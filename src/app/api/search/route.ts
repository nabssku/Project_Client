import { NextRequest, NextResponse, connection } from "next/server";
import { prisma } from "@/lib/prisma";

interface SearchPageItem {
  title: string;
  description: string;
  url: string;
  type: "page";
  category: string;
  keywords: string[];
}

// Halaman publik yang diizinkan untuk pencarian global (Login dan Register dikecualikan)
const PUBLIC_PAGES: SearchPageItem[] = [
  {
    title: "Katalog Semua Villa",
    description: "Jelajahi seluruh koleksi villa mewah dengan private pool dan fasilitas lengkap.",
    url: "/villas",
    type: "page",
    category: "Eksplorasi Villa",
    keywords: ["villa", "katalog", "daftar", "sewa", "booking", "semua", "private pool", "kamar"],
  },
  {
    title: "Artikel & Panduan Wisata",
    description: "Kumpulan tips menginap, rekomendasi kuliner, dan panduan liburan keluarga di Puncak.",
    url: "/artikel",
    type: "page",
    category: "Blog & Panduan",
    keywords: ["artikel", "panduan", "wisata", "tips", "kuliner", "liburan", "blog", "jurnal", "bacaan"],
  },
  {
    title: "Tentang Kami (Profil & Pelayanan)",
    description: "Pelajari filosofi, standar keramahan, dan dedikasi kenyamanan villa terbaik.",
    url: "/about",
    type: "page",
    category: "Profil & Informasi",
    keywords: ["tentang", "about", "profil", "kontak", "fasilitas", "layanan", "hubungi", "bantuan"],
  },
  {
    title: "Cek Status Reservasi & Pelunasan",
    description: "Periksa status konfirmasi, unggah bukti pelunasan DP 50%, dan unduh invoice resmi reservasi.",
    url: "/booking/status",
    type: "page",
    category: "Layanan Tamu",
    keywords: ["status", "cek booking", "pelunasan", "dp", "dp 50", "bukti transfer", "invoice", "bayar", "kode"],
  },
];

export async function GET(req: NextRequest) {
  await connection();
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q || q.length < 2) {
      // Rekomendasi bawaan saat kotak pencarian baru dibuka
      const [featuredVillas, recentArticles] = await Promise.all([
        prisma.villas.findMany({
          where: { status: "AVAILABLE" },
          orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
          take: 4,
          select: {
            id: true,
            name: true,
            slug: true,
            location: true,
            pricePerNight: true,
            bedrooms: true,
            capacity: true,
            images: true,
          },
        }),
        prisma.articles.findMany({
          where: { isPublished: true },
          orderBy: { createdAt: "desc" },
          take: 3,
          select: {
            id: true,
            title: true,
            slug: true,
            category: true,
            excerpt: true,
            coverImage: true,
          },
        }),
      ]);

      return NextResponse.json({
        query: "",
        villas: featuredVillas.map((v) => ({
          ...v,
          type: "villa" as const,
          url: `/villas/${v.slug}`,
          image: v.images?.[0] || null,
        })),
        articles: recentArticles.map((a) => ({
          ...a,
          type: "article" as const,
          url: `/artikel/${a.slug}`,
          image: a.coverImage || null,
        })),
        pages: PUBLIC_PAGES,
        isDefault: true,
      });
    }

    const queryLower = q.toLowerCase();

    // Jalankan query pencarian paralel di database
    const [villas, articles] = await Promise.all([
      prisma.villas.findMany({
        where: {
          status: { not: "UNAVAILABLE" },
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { location: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          location: true,
          pricePerNight: true,
          bedrooms: true,
          capacity: true,
          images: true,
          amenities: true,
        },
        take: 6,
      }),
      prisma.articles.findMany({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { excerpt: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
            { content: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          excerpt: true,
          coverImage: true,
          tags: true,
        },
        take: 6,
      }),
    ]);

    // Filter halaman statis publik yang cocok
    const matchedPages = PUBLIC_PAGES.filter((p) => {
      const matchTitle = p.title.toLowerCase().includes(queryLower);
      const matchDesc = p.description.toLowerCase().includes(queryLower);
      const matchKeywords = p.keywords.some((k) => k.includes(queryLower));
      return matchTitle || matchDesc || matchKeywords;
    });

    const formattedVillas = villas.map((v) => ({
      id: v.id,
      name: v.name,
      slug: v.slug,
      location: v.location,
      pricePerNight: v.pricePerNight,
      bedrooms: v.bedrooms,
      capacity: v.capacity,
      image: v.images?.[0] || null,
      type: "villa" as const,
      url: `/villas/${v.slug}`,
      matchedAmenities: v.amenities.filter((a) =>
        a.toLowerCase().includes(queryLower)
      ),
    }));

    const formattedArticles = articles.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      category: a.category,
      excerpt: a.excerpt,
      image: a.coverImage || null,
      type: "article" as const,
      url: `/artikel/${a.slug}`,
      tags: a.tags || [],
    }));

    const totalCount =
      formattedVillas.length + formattedArticles.length + matchedPages.length;

    return NextResponse.json({
      query: q,
      villas: formattedVillas,
      articles: formattedArticles,
      pages: matchedPages,
      totalCount,
      isDefault: false,
    });
  } catch (error) {
    console.error("Global search error:", error);
    return NextResponse.json(
      { error: "Gagal memproses pencarian" },
      { status: 500 }
    );
  }
}
