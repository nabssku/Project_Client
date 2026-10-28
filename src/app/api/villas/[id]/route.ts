import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateVillaSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  pricePerNight: z.coerce.number().min(0).optional(),
  priceWeekend: z.coerce.number().min(0).optional().nullable(),
  dailyRates: z.record(z.string(), z.coerce.number().nullable().optional()).optional().nullable(),
  capacity: z.coerce.number().min(1).optional(),
  bedrooms: z.coerce.number().min(1).optional(),
  bathrooms: z.coerce.number().min(1).optional(),
  location: z.string().min(2).optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string()).min(1).optional(),
  rules: z.array(z.string()).optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  mapEmbed: z.string().optional().nullable(),
  isFeatured: z.boolean().optional(),
  status: z.enum(["AVAILABLE", "CLEANING", "MAINTENANCE", "UNAVAILABLE"]).optional(),
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
      include: {
        _count: {
          select: {
            bookings: true,
            maintenanceTasks: true,
          },
        },
      },
    });

    if (!villa) {
      return NextResponse.json({ error: "Villa tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(villa);
  } catch (error) {
    console.error("Error fetching villa:", error);
    return NextResponse.json(
      { error: "Gagal memuat data villa" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // If it is only a quick status change, allow ADMIN or MANAJER or MAINTENANCE
    const isStatusOnly = Object.keys(body).length === 1 && "status" in body;
    if (isStatusOnly) {
      const allowedRoles = ["ADMIN", "MANAJER", "MAINTENANCE"];
      if (!allowedRoles.includes(session.user.role)) {
        return NextResponse.json(
          { error: "Forbidden: Anda tidak memiliki izin memperbarui status unit" },
          { status: 403 }
        );
      }
    } else {
      // Full update requires ADMIN role
      if (session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Forbidden: Hanya role ADMIN yang diizinkan mengubah data villa" },
          { status: 403 }
        );
      }
    }

    const validated = updateVillaSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const existingVilla = await prisma.villas.findUnique({
      where: { id },
    });

    if (!existingVilla) {
      return NextResponse.json({ error: "Villa tidak ditemukan" }, { status: 404 });
    }

    // Check slug conflict if slug is being updated
    if (validated.data.slug && validated.data.slug !== existingVilla.slug) {
      const slugConflict = await prisma.villas.findUnique({
        where: { slug: validated.data.slug },
      });
      if (slugConflict && slugConflict.id !== id) {
        return NextResponse.json(
          { error: `Slug "${validated.data.slug}" sudah digunakan oleh villa lain` },
          { status: 400 }
        );
      }
    }

    const updatedVilla = await prisma.villas.update({
      where: { id },
      data: validated.data as any,
    });

    // Audit log
    await prisma.activity_logs.create({
      data: {
        userId: session.user.id,
        action: isStatusOnly ? "UPDATE_VILLA_STATUS" : "UPDATE_VILLA",
        entity: "villas",
        entityId: updatedVilla.id,
        details: isStatusOnly
          ? `Mengubah status villa "${updatedVilla.name}" ke ${updatedVilla.status}`
          : `Memperbarui detail informasi villa "${updatedVilla.name}"`,
      },
    });

    return NextResponse.json(updatedVilla);
  } catch (error: any) {
    console.error("Error updating villa:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui data villa" },
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

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Hanya role ADMIN yang diizinkan menghapus unit villa" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const villa = await prisma.villas.findUnique({
      where: { id },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    });

    if (!villa) {
      return NextResponse.json({ error: "Villa tidak ditemukan" }, { status: 404 });
    }

    // Safety guard: Cannot delete if bookings exist
    if (villa._count.bookings > 0) {
      return NextResponse.json(
        {
          error: `Villa ini memiliki ${villa._count.bookings} riwayat reservasi aktif. Demi keamanan data finansial dan riwayat transaksi, villa tidak dapat dihapus permanen. Silakan ubah statusnya menjadi UNAVAILABLE.`,
          hasBookings: true,
        },
        { status: 400 }
      );
    }

    await prisma.villas.delete({
      where: { id },
    });

    // Audit log
    await prisma.activity_logs.create({
      data: {
        userId: session.user.id,
        action: "DELETE_VILLA",
        entity: "villas",
        entityId: id,
        details: `Menghapus permanen unit villa "${villa.name}"`,
      },
    });

    return NextResponse.json({ success: true, message: `Villa "${villa.name}" berhasil dihapus` });
  } catch (error: any) {
    console.error("Error deleting villa:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menghapus unit villa" },
      { status: 500 }
    );
  }
}
