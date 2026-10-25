import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Calendar,
  Clock,
  ArrowLeft,
  Share2,
  Tag,
  BookOpen,
  ArrowRight,
  User,
} from "lucide-react";
import type { Metadata } from "next";
import { ArticleRichRenderer } from "@/components/cms/article-rich-renderer";

export const instant = false;

interface ArticleDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [article, siteConfig] = await Promise.all([
    prisma.articles.findUnique({ where: { slug } }),
    prisma.site_configs.findUnique({ where: { key: "site_name" } }),
  ]);

  if (!article || !article.isPublished) {
    return {
      title: "Artikel Tidak Ditemukan",
    };
  }

  const siteName = siteConfig?.value || "Villa Luxury Stay";
  const metaTitle = article.metaTitle
    ? `${article.metaTitle} | ${siteName}`
    : `${article.title} | ${siteName}`;

  const metaDescription =
    article.metaDescription ||
    article.excerpt ||
    article.content.substring(0, 160);

  return {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: "article",
      publishedTime: article.publishedAt
        ? new Date(article.publishedAt).toISOString()
        : new Date(article.createdAt).toISOString(),
      authors: article.authorId ? [article.authorId] : undefined,
      images: article.coverImage ? [{ url: article.coverImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: article.coverImage ? [article.coverImage] : undefined,
    },
  };
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { slug } = await params;

  const [article, siteConfig] = await Promise.all([
    prisma.articles.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            name: true,
            avatar: true,
            role: true,
          },
        },
      },
    }),
    prisma.site_configs.findUnique({
      where: { key: "site_name" },
    }),
  ]);

  if (!article || !article.isPublished) {
    notFound();
  }

  const siteName = siteConfig?.value || "Villa Luxury Stay";

  // Estimated reading time
  const wordCount = article.content.split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  // Related articles (same category or recent)
  const relatedArticles = await prisma.articles.findMany({
    where: {
      isPublished: true,
      id: { not: article.id },
      category: article.category,
    },
    take: 3,
    orderBy: { createdAt: "desc" },
  });

  // JSON-LD Schema for Google SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.metaDescription || article.excerpt,
    image: article.coverImage ? [article.coverImage] : [],
    datePublished: article.publishedAt || article.createdAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Person",
      name: article.author?.name || "Redaksi Villa",
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-[#fcfbf9] pt-28 pb-24">
        <article className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
          {/* Breadcrumb / Back link */}
          <div className="mb-8">
            <Link
              href="/artikel"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Semua Artikel
            </Link>
          </div>

          {/* Header Section */}
          <header className="mb-10 text-center max-w-3xl mx-auto">
            <div className="inline-block mb-4">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-accent/15 text-accent">
                {article.category}
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-primary tracking-tight leading-tight mb-6">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed italic mb-6">
                &ldquo;{article.excerpt}&rdquo;
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400 border-y border-[#e8e6df] py-3.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[10px]">
                  {article.author?.name?.[0] || "V"}
                </div>
                <span className="font-medium text-gray-700">
                  {article.author?.name || "Redaksi Villa"}
                </span>
              </div>

              <span>&bull;</span>

              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {new Date(article.publishedAt || article.createdAt).toLocaleDateString(
                    "id-ID",
                    { day: "numeric", month: "long", year: "numeric" }
                  )}
                </span>
              </div>

              <span>&bull;</span>

              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{readTime} menit baca</span>
              </div>
            </div>
          </header>

          {/* Cover Image */}
          {article.coverImage && (
            <div className="rounded-2xl overflow-hidden shadow-lg border border-[#e8e6df] mb-12 max-h-[500px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Article Rich Content (Headings, Lists, Quotes, Links, Uploaded/URL Images) */}
          <ArticleRichRenderer content={article.content} className="max-w-none text-primary" />

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-12 pt-6 border-t border-[#e8e6df] flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 mr-2 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                Tags:
              </span>
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="mt-16 pt-12 border-t border-[#e8e6df]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-display text-2xl font-bold text-primary">
                  Artikel Terkait Lainnya
                </h3>
                <Link
                  href="/artikel"
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  Lihat Semua
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedArticles.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/artikel/${rel.slug}`}
                    className="group bg-white rounded-xl border border-[#e8e6df] overflow-hidden shadow-2xs hover:shadow-md transition-all"
                  >
                    <div className="h-36 bg-gray-100 overflow-hidden relative">
                      {rel.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={rel.coverImage}
                          alt={rel.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <BookOpen className="w-6 h-6" />
                        </div>
                      )}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 text-primary">
                        {rel.category}
                      </span>
                    </div>

                    <div className="p-4">
                      <h4 className="font-bold text-sm text-primary group-hover:text-accent transition-colors line-clamp-2 mb-1.5">
                        {rel.title}
                      </h4>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {rel.excerpt || rel.content.substring(0, 80)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>
    </>
  );
}
