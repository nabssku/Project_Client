import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const holidayPriceSchema = z.object({
  startDate: z.string().min(10, "Format tanggal mulai: YYYY-MM-DD"),
  endDate: z.string().min(10, "Format tanggal selesai: YYYY-MM-DD"),
  price: z.coerce.number().min(10000, "Harga minimal Rp 10.000"),
  reason: z.string().optional().nullable(),
});

const setPricingSchema = z.object({
  priceWeekend: z.coerce.number().min(0).optional().nullable(),
  dailyRates: z.record(z.string(), z.coerce.number().nullable().optional()).optional().nullable(),
  newHolidayPrice: holidayPriceSchema.optional(),
  customPrice: holidayPriceSchema.optional(), // alias to prevent frontend mismatch
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const villa = await prisma.villas.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        pricePerNight: true,
        priceWeekend: true,
        dailyRates: true,
        customPrices: {
          orderBy: { startDate: "asc" },
        },
      },
    });

    if (!villa) {
      return NextResponse.json({ error: "Villa tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ...villa,
      pricing: {
        pricePerNight: villa.pricePerNight,
        priceWeekend: villa.priceWeekend,
        dailyRates: villa.dailyRates,
        customPrices: villa.customPrices,
      },
    });
  } catch (error) {
    console.error("Error fetching villa pricing:", error);
    return NextResponse.json({ error: "Gagal memuat tarif villa" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["ADMIN", "MANAJER"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Hanya Admin atau Manajer yang dapat mengatur tarif" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validated = setPricingSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const villa = await prisma.villas.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!villa) {
      return NextResponse.json({ error: "Villa tidak ditemukan" }, { status: 404 });
    }

    const updateData: any = {};

    // 1. Update weekend price if provided
    if (validated.data.priceWeekend !== undefined) {
      updateData.priceWeekend = validated.data.priceWeekend;
    }

    // 2. Update daily rates if provided
    if (validated.data.dailyRates !== undefined) {
      updateData.dailyRates = validated.data.dailyRates;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.villas.update({
        where: { id: villa.id },
        data: updateData,
      });
    }

    // 3. Add holiday/peak season price override if provided
    const holidayInput = validated.data.newHolidayPrice || validated.data.customPrice;
    if (holidayInput) {
      const { startDate, endDate, price, reason } = holidayInput;
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end < start) {
        return NextResponse.json(
          { error: "Tanggal selesai tidak boleh lebih awal dari tanggal mulai" },
          { status: 400 }
        );
      }

      await prisma.villa_custom_prices.create({
        data: {
          villaId: villa.id,
          startDate: start,
          endDate: end,
          price,
          reason: reason || "Hari Libur / High Season",
        },
      });
    }

    // Return updated villa with custom prices
    const updated = await prisma.villas.findUnique({
      where: { id: villa.id },
      select: {
        id: true,
        name: true,
        slug: true,
        pricePerNight: true,
        priceWeekend: true,
        dailyRates: true,
        customPrices: {
          orderBy: { startDate: "asc" },
        },
      },
    });

    // Audit log
    await prisma.activity_logs.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_VILLA_PRICING",
        entity: "villas",
        entityId: villa.id,
        details: `Memperbarui tarif dynamic pricing untuk "${villa.name}"`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Tarif villa berhasil diperbarui",
      ...updated,
      pricing: {
        pricePerNight: updated?.pricePerNight,
        priceWeekend: updated?.priceWeekend,
        dailyRates: updated?.dailyRates,
        customPrices: updated?.customPrices,
      },
    });
  } catch (error: any) {
    console.error("Error setting pricing:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui tarif" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["ADMIN", "MANAJER"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Hanya Admin atau Manajer yang dapat menghapus tarif" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    let customPriceId = searchParams.get("customPriceId");

    if (!customPriceId) {
      try {
        const body = await request.json();
        customPriceId = body?.customPriceId;
      } catch {
        // body parsing optional
      }
    }

    if (!customPriceId) {
      return NextResponse.json(
        { error: "ID tarif khusus (customPriceId) wajib disertakan" },
        { status: 400 }
      );
    }

    await prisma.villa_custom_prices.delete({
      where: { id: customPriceId },
    });

    return NextResponse.json({ success: true, message: "Tarif khusus berhasil dihapus" });
  } catch (error: any) {
    console.error("Error deleting custom price:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menghapus tarif khusus" },
      { status: 500 }
    );
  }
}
