import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-guard";

export async function PATCH(
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

    const nextActive = !existing.isActive;
    const updated = await prisma.promos.update({
      where: { id },
      data: { isActive: nextActive },
    });

    try {
      revalidatePath("/promo");
    } catch (e) {
      console.warn("Revalidate error:", e);
    }

    return NextResponse.json({
      success: true,
      promo: updated,
      message: nextActive
        ? `Kode promo "${updated.code}" berhasil diaktifkan!`
        : `Kode promo "${updated.code}" telah dinonaktifkan.`,
    });
  } catch (error: any) {
    console.error("PATCH /api/cms/promos/[id]/status error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui status promo" },
      { status: 500 }
    );
  }
}
