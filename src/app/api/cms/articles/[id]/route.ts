import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-guard";
import { z } from "zod";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

const updateArticleSchema = z.object({
  title: z.string().min(3, "Judul artikel minimal 3 karakter").optional(),
  slug: z.string().optional(),
  excerpt: z.string().optional().nullable(),
  content: z.string().min(10, "Konten artikel minimal 10 karakter").optional(),
  coverImage: z.string().optional().nullable(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireApiPermission("cms:read");
    if (!authCheck.success) return authCheck.response;

    const { id } = await params;
    const article = await prisma.articles.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, role: true },
        },
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Artikel tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, article });
  } catch (error: any) {
    console.error("GET /api/cms/articles/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal memuat artikel" },
      { status: 500 }
    );
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
    const existing = await prisma.articles.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Artikel tidak ditemukan" }, { status: 404 });
    }

    const body = await request.json();
    const validated = updateArticleSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;
    let finalSlug = existing.slug;

    if (data.slug && data.slug !== existing.slug) {
      const cleanSlug = slugify(data.slug);
      const conflict = await prisma.articles.findFirst({
        where: { slug: cleanSlug, id: { not: id } },
      });
      if (conflict) {
        return NextResponse.json(
          { error: "Slug URL ini sudah digunakan oleh artikel lain" },
          { status: 400 }
        );
      }
      finalSlug = cleanSlug;
    }

    const updated = await prisma.articles.update({
      where: { id },
      data: {
        ...(data.title ? { title: data.title.trim() } : {}),
        slug: finalSlug,
        ...(data.excerpt !== undefined ? { excerpt: data.excerpt?.trim() || null } : {}),
        ...(data.content ? { content: data.content } : {}),
        ...(data.coverImage !== undefined ? { coverImage: data.coverImage?.trim() || null } : {}),
        ...(data.category ? { category: data.category } : {}),
        ...(data.tags ? { tags: data.tags } : {}),
        ...(data.metaTitle !== undefined ? { metaTitle: data.metaTitle?.trim() || null } : {}),
        ...(data.metaDescription !== undefined ? { metaDescription: data.metaDescription?.trim() || null } : {}),
        ...(data.isPublished !== undefined
          ? {
              isPublished: data.isPublished,
              publishedAt: data.isPublished && !existing.publishedAt ? new Date() : existing.publishedAt,
            }
          : {}),
      },
    });

    // Activity log
    try {
      await prisma.activity_logs.create({
        data: {
          userId: authCheck.user.id,
          action: "UPDATE_ARTICLE",
          entity: "articles",
          entityId: updated.id,
          details: `Memperbarui artikel "${updated.title}"`,
        },
      });
    } catch (e) {
      console.warn("Log error:", e);
    }

    try {
      revalidatePath("/artikel");
      revalidatePath(`/artikel/${updated.slug}`);
      if (existing.slug !== updated.slug) {
        revalidatePath(`/artikel/${existing.slug}`);
      }
      revalidatePath("/sitemap.xml");
      try { revalidateTag("sitemap_articles", { expire: 0 }); } catch {}
    } catch (e) {
      console.warn("Revalidate error:", e);
    }

    return NextResponse.json({
      success: true,
      article: updated,
      message: "Artikel berhasil diperbarui!",
    });
  } catch (error: any) {
    console.error("PUT /api/cms/articles/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui artikel" },
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
    const existing = await prisma.articles.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Artikel tidak ditemukan" }, { status: 404 });
    }

    await prisma.articles.delete({ where: { id } });

    try {
      await prisma.activity_logs.create({
        data: {
          userId: authCheck.user.id,
          action: "DELETE_ARTICLE",
          entity: "articles",
          entityId: id,
          details: `Menghapus artikel "${existing.title}"`,
        },
      });
    } catch (e) {
      console.warn("Log error:", e);
    }

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
      message: "Artikel berhasil dihapus!",
    });
  } catch (error: any) {
    console.error("DELETE /api/cms/articles/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus artikel" },
      { status: 500 }
    );
  }
}
