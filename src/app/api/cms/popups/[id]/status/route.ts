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
    const existing = await prisma.popups.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Pop-up tidak ditemukan" }, { status: 404 });
    }

    const nextStatus = !existing.isActive;
    const updated = await prisma.popups.update({
      where: { id },
      data: { isActive: nextStatus },
    });

    try {
      revalidatePath("/", "layout");
    } catch (e) {
      console.warn("Revalidate error:", e);
    }

    return NextResponse.json({
      success: true,
      popup: updated,
      message: nextStatus
        ? "Pop-up berhasil diaktifkan ke publik!"
        : "Pop-up telah dinonaktifkan.",
    });
  } catch (error: any) {
    console.error("PATCH /api/cms/popups/[id]/status error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui status pop-up" },
      { status: 500 }
    );
  }
}
