import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-guard";
import { z } from "zod";

const promoSchema = z.object({
  title: z.string().min(2, "Judul promo minimal 2 karakter"),
  description: z.string().min(5, "Deskripsi minimal 5 karakter"),
  discountPercent: z.number().int().min(1, "Diskon minimal 1%").max(100, "Diskon maksimal 100%"),
  code: z.string().min(3, "Kode promo minimal 3 karakter"),
  validFrom: z.string().min(1, "Tanggal mulai berlaku wajib diisi"),
  validUntil: z.string().min(1, "Tanggal akhir berlaku wajib diisi"),
  isActive: z.boolean().default(true),
});

export async function GET(request: Request) {
  try {
    const authCheck = await requireApiPermission("cms:read");
    if (!authCheck.success) return authCheck.response;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    const where: any = {};
    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status === "ACTIVE") {
      where.isActive = true;
    } else if (status === "INACTIVE") {
      where.isActive = false;
    }

    const promoList = await prisma.promos.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      promos: promoList,
    });
  } catch (error: any) {
    console.error("GET /api/cms/promos error:", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar kode promo" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authCheck = await requireApiPermission("cms:update");
    if (!authCheck.success) return authCheck.response;

    const body = await request.json();
    const validated = promoSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;
    const cleanCode = data.code.trim().toUpperCase().replace(/\s+/g, "");

    // Check code uniqueness
    const existing = await prisma.promos.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Kode promo "${cleanCode}" sudah digunakan. Gunakan kode unik lain.` },
        { status: 400 }
      );
    }

    const newPromo = await prisma.promos.create({
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        discountPercent: data.discountPercent,
        code: cleanCode,
        validFrom: new Date(data.validFrom),
        validUntil: new Date(data.validUntil),
        isActive: data.isActive,
      },
    });

    try {
      await prisma.activity_logs.create({
        data: {
          userId: authCheck.user.id,
          action: "CREATE_PROMO",
          entity: "promos",
          entityId: newPromo.id,
          details: `Membuat voucher promo baru: "${newPromo.code}" (Diskon ${newPromo.discountPercent}%)`,
        },
      });
    } catch (e) {
      console.warn("Log error:", e);
    }

    try {
      revalidatePath("/promo");
    } catch (e) {
      console.warn("Revalidate error:", e);
    }

    return NextResponse.json(
      {
        success: true,
        promo: newPromo,
        message: "Kode promo berhasil dibuat!",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/cms/promos error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat kode promo" },
      { status: 500 }
    );
  }
}
