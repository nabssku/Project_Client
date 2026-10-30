import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Calendar, Clock, ArrowRight, Tag, BookOpen } from "lucide-react";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { buildSmoMetadata } from "@/lib/smo";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  'use cache';
  cacheTag('site_configs', 'articles');
  cacheLife('minutes');

  const [siteConfig, latestArticle] = await Promise.all([
    prisma.site_configs.findUnique({
      where: { key: "site_name" },
    }),
    prisma.articles.findFirst({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      select: { coverImage: true },
    }),
  ]);
  const siteName = siteConfig?.value || "villaqoe";

  const title = `Panduan Wisata & Rekomendasi Villa | ${siteName}`;
  const description =
    "Temukan inspirasi liburan, tips menginap, kuliner terbaik, dan rekomendasi villa eksklusif di Puncak dan sekitarnya.";
  const image = latestArticle?.coverImage || "/Villaqoe.png";

  return buildSmoMetadata({
    title,
    description,
    urlPath: "/artikel",
    image,
    siteName,
    keywords: [
      "artikel wisata",
      "tips villa",
      "rekomendasi liburan",
      "panduan wisata puncak",
      "villa bogor",
      "villaqoe",
    ],
  });
}

interface ArtikelPageProps {
  searchParams: Promise<{
    kategori?: string;
    cari?: string;
  }>;
}

export default async function ArtikelPublicPage({ searchParams }: ArtikelPageProps) {
  const { kategori, cari } = await searchParams;

  const where: any = {
    isPublished: true,
  };

  if (kategori && kategori !== "Semua") {
    where.category = kategori;
  }

  if (cari) {
    where.OR = [
      { title: { contains: cari, mode: "insensitive" } },
      { excerpt: { contains: cari, mode: "insensitive" } },
      { content: { contains: cari, mode: "insensitive" } },
    ];
  }

  const [articles, distinctCategories] = await Promise.all([
    prisma.articles.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
    }),
    prisma.articles.findMany({
      where: { isPublished: true },
      select: { category: true },
      distinct: ["category"],
    }),
  ]);

  const defaultCategories = [
    "Semua",
    "Panduan Wisata",
    "Rekomendasi Villa",
    "Tips Liburan",
    "Info & Event",
    "Kuliner & Budaya",
  ];

  const categories = Array.from(
    new Set([
      ...defaultCategories,
      ...distinctCategories.map((c) => c.category).filter(Boolean),
    ])
  );

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Beranda",
        item: "https://villaqoe.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Artikel & Panduan",
        item: "https://villaqoe.com/artikel",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <main className="min-h-screen bg-[#fcfbf9] pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        {/* Editorial Header Banner */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-accent mb-3">
            Inspirasi &amp; Panduan Perjalanan
          </p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-primary tracking-tight mb-4">
            Jurnal Liburan &amp; Eksplorasi Villa
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Kumpulan tips berlibur, rekomendasi destinasi tersembunyi, dan panduan memilih villa terbaik untuk liburan yang tak terlupakan.
          </p>
        </div>

        {/* Filter Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((cat) => {
            const isActive = (!kategori && cat === "Semua") || kategori === cat;
            return (
              <Link
                key={cat}
                href={cat === "Semua" ? "/artikel" : `/artikel?kategori=${encodeURIComponent(cat)}`}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-[#e8e6df]"
                }`}
              >
                {cat}
              </Link>
            );
          })}
        </div>

        {/* Articles List / Empty */}
        {articles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e8e6df] p-16 text-center max-w-xl mx-auto shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#f8f7f4] flex items-center justify-center mx-auto text-gray-400 mb-3">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-primary">Belum Ada Artikel</h3>
            <p className="text-xs text-gray-500 mt-1">
              {kategori
                ? `Belum ada artikel yang diterbitkan dalam kategori "${kategori}".`
                : "Artikel menarik sedang dipersiapkan oleh tim kami. Silakan kembali lagi nanti!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => {
              // Word count reading time estimate (approx 200 words per minute)
              const wordCount = article.content.split(/\s+/).length;
              const readTime = Math.max(1, Math.ceil(wordCount / 200));

              return (
                <article
                  key={article.id}
                  className="bg-white rounded-2xl border border-[#e8e6df] overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-accent/40 transition-all duration-300 group"
                >
                  <div>
                    {/* Cover Image */}
                    <Link href={`/artikel/${article.slug}`} className="block relative h-56 overflow-hidden bg-gray-100">
                      {article.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={article.coverImage}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/5 text-gray-400">
                          <BookOpen className="w-8 h-8 opacity-40" />
                        </div>
                      )}

                      <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/95 backdrop-blur-md text-primary shadow-xs">
                        {article.category}
                      </span>
                    </Link>

                    {/* Body */}
                    <div className="p-6">
                      <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(article.publishedAt || article.createdAt).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "short", year: "numeric" }
                          )}
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {readTime} mnt baca
                        </span>
                      </div>

                      <Link href={`/artikel/${article.slug}`}>
                        <h2 className="font-display font-bold text-xl text-primary group-hover:text-accent transition-colors leading-snug line-clamp-2 mb-3">
                          {article.title}
                        </h2>
                      </Link>

                      <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed mb-4">
                        {article.excerpt || article.content.substring(0, 160)}
                      </p>
                    </div>
                  </div>

                  {/* Read More Footer */}
                  <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">
                      {article.author?.name ? `Oleh ${article.author.name}` : "Redaksi Villa"}
                    </span>

                    <Link
                      href={`/artikel/${article.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:text-accent group-hover:translate-x-1 transition-all"
                    >
                      Baca Selengkapnya
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  </>
  );
}
