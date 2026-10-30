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
    const existing = await prisma.articles.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Artikel tidak ditemukan" }, { status: 404 });
    }

    const nextPublishedState = !existing.isPublished;
    const updated = await prisma.articles.update({
      where: { id },
      data: {
        isPublished: nextPublishedState,
        publishedAt: nextPublishedState ? (existing.publishedAt || new Date()) : existing.publishedAt,
      },
    });

    try {
      revalidatePath("/artikel");
      revalidatePath(`/artikel/${existing.slug}`);
      revalidatePath("/sitemap.xml");
      try { revalidateTag("sitemap_articles", { expire: 0 }); } catch {}
    } catch (e) {
      console.warn("Revalidate error:", e);
    }

    return NextResponse.json({
      success: true,
      article: updated,
      message: nextPublishedState
        ? "Artikel berhasil dipublikasikan!"
        : "Artikel dipindahkan ke draft.",
    });
  } catch (error: any) {
    console.error("PATCH /api/cms/articles/[id]/publish error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui status publikasi artikel" },
      { status: 500 }
    );
  }
}
