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
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

const articleSchema = z.object({
  title: z.string().min(3, "Judul artikel minimal 3 karakter"),
  slug: z.string().optional(),
  excerpt: z.string().optional().nullable(),
  content: z.string().min(10, "Konten artikel minimal 10 karakter"),
  coverImage: z.string().optional().nullable(),
  category: z.string().default("Panduan Wisata"),
  tags: z.array(z.string()).default([]),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  isPublished: z.boolean().default(true),
});

export async function GET(request: Request) {
  try {
    const authCheck = await requireApiPermission("cms:read");
    if (!authCheck.success) return authCheck.response;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (status === "PUBLISHED") {
      where.isPublished = true;
    } else if (status === "DRAFT") {
      where.isPublished = false;
    }

    const articles = await prisma.articles.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      articles,
    });
  } catch (error: any) {
    console.error("GET /api/cms/articles error:", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar artikel" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authCheck = await requireApiPermission("cms:update");
    if (!authCheck.success) return authCheck.response;

    const body = await request.json();
    const validated = articleSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;
    let baseSlug = data.slug ? slugify(data.slug) : slugify(data.title);
    if (!baseSlug) baseSlug = "artikel-" + Date.now();

    // Ensure slug uniqueness
    let finalSlug = baseSlug;
    let counter = 1;
    while (await prisma.articles.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const article = await prisma.articles.create({
      data: {
        title: data.title.trim(),
        slug: finalSlug,
        excerpt: data.excerpt?.trim() || null,
        content: data.content,
        coverImage: data.coverImage?.trim() || null,
        category: data.category || "Panduan Wisata",
        tags: data.tags || [],
        metaTitle: data.metaTitle?.trim() || data.title.trim(),
        metaDescription: data.metaDescription?.trim() || data.excerpt?.trim() || null,
        isPublished: data.isPublished,
        publishedAt: data.isPublished ? new Date() : null,
        authorId: authCheck.user.id,
      },
    });

    // Activity log
    try {
      await prisma.activity_logs.create({
        data: {
          userId: authCheck.user.id,
          action: "CREATE_ARTICLE",
          entity: "articles",
          entityId: article.id,
          details: `Membuat artikel baru: "${article.title}" (${article.isPublished ? "Published" : "Draft"})`,
        },
      });
    } catch (e) {
      console.warn("Log error:", e);
    }

    try {
      revalidatePath("/artikel");
      revalidatePath(`/artikel/${article.slug}`);
      revalidatePath("/sitemap.xml");
      try { revalidateTag("sitemap_articles", { expire: 0 }); } catch {}
    } catch (e) {
      console.warn("Revalidate error:", e);
    }

    return NextResponse.json(
      {
        success: true,
        article,
        message: "Artikel berhasil dibuat!",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/cms/articles error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat artikel baru" },
      { status: 500 }
    );
  }
}
