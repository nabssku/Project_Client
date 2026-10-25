import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
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
    const existing = await prisma.testimonials.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Testimoni tidak ditemukan" }, { status: 404 });
    }

    const nextFeatured = !existing.isFeatured;
    const updated = await prisma.testimonials.update({
      where: { id },
      data: { isFeatured: nextFeatured },
    });

    try {
      revalidateTag("testimonials", { expire: 0 });
      revalidatePath("/", "page");
    } catch (e) {
      console.warn("Revalidate error:", e);
    }

    return NextResponse.json({
      success: true,
      testimonial: updated,
      message: nextFeatured
        ? "Testimoni disematkan ke Beranda (Featured)!"
        : "Testimoni dihapus dari Featured Beranda.",
    });
  } catch (error: any) {
    console.error("PATCH /api/cms/testimonials/[id]/featured error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui status featured" },
      { status: 500 }
    );
  }
}
