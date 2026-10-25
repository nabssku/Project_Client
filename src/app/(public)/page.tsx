import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { Hero } from "@/components/public/hero";
import { VillaGrid } from "@/components/public/villa-grid";
import { HowItWorks } from "@/components/public/how-it-works";
import { Testimonials } from "@/components/public/testimonials";
import { CTA } from "@/components/public/cta";
import { prisma } from "@/lib/prisma";
import DynamicFont from "@/components/DynamicFont";

export const instant = false;

async function HomeContent() {
  'use cache';
  cacheTag('site_configs', 'villas', 'testimonials');
  cacheLife('seconds');

  const [villas, testimonials, configs] = await Promise.all([
    prisma.villas.findMany({
      take: 6,
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

  const fontBody: string = config["font_body"] || "DM Sans";
  const fontDisplay: string = config["font_display"] || "Playfair Display";
  const primaryColor: string = config["primary_color"] || "#1a1a2e";
  const secondaryColor: string = config["secondary_color"] || "#C8A44E";

  return (
    <>
      <DynamicFont
        bodyFont={fontBody}
        displayFont={fontDisplay}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      />
      <Hero config={config} />
      <section className="container mx-auto px-4 py-16">
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
