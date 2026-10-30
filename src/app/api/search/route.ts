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
    keywords: ["villa", "katalog", "daftar", "sewa", "booking", "semua", "private pool", "kamar", "unit"],
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

const SYNONYMS: Record<string, string[]> = {
  kolam: ["pool", "private pool", "kolam renang", "renang"],
  renang: ["pool", "private pool", "kolam renang"],
  swimming: ["pool", "private pool"],
  bbq: ["bbq", "barbeque", "barbecue"],
  wifi: ["wifi", "wi-fi", "internet"],
  karaoke: ["karaoke", "sing", "musik"],
  gunung: ["view", "pemandangan", "alam", "sejuk"],
  pemandangan: ["view", "gunung"],
  keluarga: ["family", "rombongan", "anak"],
};

function expandSearchTokens(q: string) {
  const clean = q.toLowerCase().trim();
  const rawTokens = clean.split(/\s+/).filter(Boolean);
  const allTokens = new Set<string>(rawTokens);

  for (const token of rawTokens) {
    for (const [key, syns] of Object.entries(SYNONYMS)) {
      if (token.includes(key) || key.includes(token)) {
        syns.forEach((s) => allTokens.add(s));
      }
    }
  }

  return { clean, tokens: Array.from(allTokens) };
}

export async function GET(req: NextRequest) {
  await connection();
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q) {
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

    const { clean, tokens } = expandSearchTokens(q);

    // Ambil data aktif dari database untuk pencarian cerdas & komprehensif
    const [allVillas, allArticles] = await Promise.all([
      prisma.villas.findMany({
        where: { status: { not: "UNAVAILABLE" } },
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
          description: true,
        },
        take: 30,
      }),
      prisma.articles.findMany({
        where: { isPublished: true },
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          excerpt: true,
          coverImage: true,
          tags: true,
          content: true,
        },
        take: 30,
      }),
    ]);

    // Filter Villa: Nama, slug, lokasi, deskripsi, fasilitas (amenities), kapasitas
    const matchedVillas = allVillas
      .filter((v) => {
        const textToSearch = [
          v.name,
          v.slug,
          v.location,
          v.description,
          ...(v.amenities || []),
          `${v.bedrooms} kamar`,
          `${v.capacity} orang`,
          `${v.capacity} tamu`,
        ]
          .join(" ")
          .toLowerCase();

        // Jika pencariannya "villa", "sewa", atau langsung mengandung string pencarian
        if (clean === "villa" || clean === "sewa" || clean === "sewa villa" || textToSearch.includes(clean)) {
          return true;
        }

        // Atau salah satu token/sinonim cocok
        return tokens.some((t) => textToSearch.includes(t));
      })
      .slice(0, 6)
      .map((v) => ({
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
        matchedAmenities: (v.amenities || []).filter((a) =>
          tokens.some((t) => a.toLowerCase().includes(t)) || a.toLowerCase().includes(clean)
        ),
      }));

    // Filter Artikel: Judul, slug, kategori, kutipan, isi, dan tag
    const matchedArticles = allArticles
      .filter((a) => {
        const textToSearch = [
          a.title,
          a.slug,
          a.category,
          a.excerpt || "",
          a.content || "",
          ...(a.tags || []),
        ]
          .join(" ")
          .toLowerCase();

        if (textToSearch.includes(clean)) return true;
        return tokens.some((t) => textToSearch.includes(t));
      })
      .slice(0, 6)
      .map((a) => ({
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

    // Filter Halaman Publik (eksklusi login/register tetap terjaga)
    const matchedPages = PUBLIC_PAGES.filter((p) => {
      const pageText = [p.title, p.description, ...(p.keywords || [])].join(" ").toLowerCase();
      if (pageText.includes(clean)) return true;
      return tokens.some((t) => pageText.includes(t));
    }).slice(0, 4);

    return NextResponse.json({
      query: q,
      villas: matchedVillas,
      articles: matchedArticles,
      pages: matchedPages,
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
