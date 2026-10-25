import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-guard";
import { z } from "zod";

const updatePromoSchema = z.object({
  title: z.string().min(2, "Judul promo minimal 2 karakter").optional(),
  description: z.string().min(5, "Deskripsi minimal 5 karakter").optional(),
  discountPercent: z.number().int().min(1).max(100).optional(),
  code: z.string().min(3).optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireApiPermission("cms:read");
    if (!authCheck.success) return authCheck.response;

    const { id } = await params;
    const promo = await prisma.promos.findUnique({ where: { id } });

    if (!promo) {
      return NextResponse.json({ error: "Promo tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, promo });
  } catch (error: any) {
    console.error("GET /api/cms/promos/[id] error:", error);
    return NextResponse.json({ error: "Gagal memuat promo" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireApiPermission("cms:update");
    if (!authCheck.success) return authCheck.response;

    const { id } = await params;
    const existing = await prisma.promos.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Promo tidak ditemukan" }, { status: 404 });
    }

    const body = await request.json();
    const validated = updatePromoSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;
    let cleanCode = existing.code;

    if (data.code) {
      cleanCode = data.code.trim().toUpperCase().replace(/\s+/g, "");
      if (cleanCode !== existing.code) {
        const conflict = await prisma.promos.findFirst({
          where: { code: cleanCode, id: { not: id } },
        });
        if (conflict) {
          return NextResponse.json(
            { error: `Kode promo "${cleanCode}" sudah digunakan promo lain` },
            { status: 400 }
          );
        }
      }
    }

    const updated = await prisma.promos.update({
      where: { id },
      data: {
        ...(data.title ? { title: data.title.trim() } : {}),
        ...(data.description ? { description: data.description.trim() } : {}),
        ...(data.discountPercent !== undefined ? { discountPercent: data.discountPercent } : {}),
        code: cleanCode,
        ...(data.validFrom ? { validFrom: new Date(data.validFrom) } : {}),
        ...(data.validUntil ? { validUntil: new Date(data.validUntil) } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });

    try {
      await prisma.activity_logs.create({
        data: {
          userId: authCheck.user.id,
          action: "UPDATE_PROMO",
          entity: "promos",
          entityId: updated.id,
          details: `Memperbarui promo "${updated.code}"`,
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

    return NextResponse.json({
      success: true,
      promo: updated,
      message: "Kode promo berhasil diperbarui!",
    });
  } catch (error: any) {
    console.error("PUT /api/cms/promos/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui promo" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireApiPermission("cms:update");
    if (!authCheck.success) return authCheck.response;

    const { id } = await params;
    const existing = await prisma.promos.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Promo tidak ditemukan" }, { status: 404 });
    }

    await prisma.promos.delete({ where: { id } });

    try {
      await prisma.activity_logs.create({
        data: {
          userId: authCheck.user.id,
          action: "DELETE_PROMO",
          entity: "promos",
          entityId: id,
          details: `Menghapus promo "${existing.code}"`,
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

    return NextResponse.json({
      success: true,
      message: "Kode promo berhasil dihapus!",
    });
  } catch (error: any) {
    console.error("DELETE /api/cms/promos/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus promo" },
      { status: 500 }
    );
  }
}
