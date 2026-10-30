import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import type { Metadata } from "next";
import { Hero } from "@/components/public/hero";
import { VillaGrid } from "@/components/public/villa-grid";
import { HowItWorks } from "@/components/public/how-it-works";
import { Testimonials } from "@/components/public/testimonials";
import { CTA } from "@/components/public/cta";
import { prisma } from "@/lib/prisma";
import { buildSmoMetadata } from "@/lib/smo";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  "use cache";
  cacheTag("site_configs");
  cacheLife("minutes");

  try {
    const [configs, featuredVilla] = await Promise.all([
      prisma.site_configs.findMany({
        where: {
          key: {
            in: ["site_name", "site_description", "hero_image", "hero_title", "hero_subtitle", "site_logo"],
          },
        },
      }),
      prisma.villas.findFirst({
        where: { status: "AVAILABLE" },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        select: { images: true },
      }),
    ]);

    const map = configs.reduce(
      (acc, c) => ({ ...acc, [c.key]: c.value }),
      {} as Record<string, string>
    );

    const siteName = map.site_name || "villaqoe";
    const title = map.hero_title && map.hero_title !== "Tittle"
      ? `${siteName} — ${map.hero_title}`
      : `${siteName} — Sewa Villa Eksklusif & Private Vacation di Puncak`;
    const description =
      map.site_description ||
      map.hero_subtitle ||
      "Pilihan villa eksklusif dan privat untuk liburan tak terlupakan bersama keluarga dan orang terkasih di Puncak, Bogor.";

    const firstVillaImage = featuredVilla?.images?.[0] || null;
    const previewImage = map.hero_image || map.site_logo || firstVillaImage || "/Villaqoe.png";

    return buildSmoMetadata({
      title,
      description,
      urlPath: "/",
      image: previewImage,
      siteName,
      keywords: ["sewa villa puncak", "villa bogor", "villa privat", "villa keluarga", "villaqoe", "booking villa"],
    });
  } catch {
    return buildSmoMetadata({
      title: "villaqoe — Sewa Villa Eksklusif di Puncak",
      description: "Pilihan villa eksklusif dan privat untuk liburan tak terlupakan bersama keluarga di Puncak, Bogor.",
      urlPath: "/",
      image: "/Villaqoe.png",
      siteName: "villaqoe",
    });
  }
}

async function HomeContent() {
  'use cache';
  cacheTag('site_configs', 'villas', 'testimonials');
  cacheLife('seconds');

  const [villas, testimonials, configs] = await Promise.all([
    prisma.villas.findMany({
      where: { status: "AVAILABLE" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.testimonials.findMany({
      where: { isFeatured: true },
      orderBy: { createdAt: "desc" },
      include: {
        villa: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      take: 12,
    }),
    prisma.site_configs.findMany(),
  ]);

  const config: Record<string, string> = configs.reduce(
    (acc: Record<string, string>, c: any) => ({ ...acc, [c.key]: c.value }),
    {} as Record<string, string>
  );

  const featuredVilla = villas.find((v) => v.isFeatured) || villas[0] || null;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === "production" ? "https://villaqoe.com" : "http://localhost:3000");

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: config.site_name || "Villa Booking",
        description: config.site_description || "Sewa villa dan penginapan eksklusif terbaik",
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/villas?destination={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
        inLanguage: "id-ID",
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: config.site_name || "Villa Booking",
        url: siteUrl,
        logo: config.site_logo
          ? config.site_logo.startsWith("http")
            ? config.site_logo
            : `${siteUrl}${config.site_logo.startsWith("/") ? "" : "/"}${config.site_logo}`
          : undefined,
        contactPoint: {
          "@type": "ContactPoint",
          telephone: config.contact_phone_1 || config.wa_number_1 || "+628111141888",
          contactType: "customer service",
          areaServed: "ID",
          availableLanguage: ["id", "en"],
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Hero config={config} featuredVilla={featuredVilla} villas={villas} />
      <section className="container mx-auto px-4 py-16 scroll-mt-20" id="villas">
        <VillaGrid villas={villas} title="Villa Pilihan" />
      </section>
      <HowItWorks />
      <Testimonials testimonials={testimonials} />
      <CTA />
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-96 bg-slate-200" />
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 rounded-xl bg-slate-200" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
