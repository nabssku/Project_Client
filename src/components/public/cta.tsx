import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Starfield } from "@/components/public/starfield";

export async function CTA() {
  const configs = await prisma.site_configs.findMany({
    where: {
      key: {
        in: ["contact_phone_1", "contact_phone_2", "cta_title", "cta_subtitle"],
      },
    },
  });

  const c: Record<string, string> = configs.reduce(
    (acc: Record<string, string>, cfg: { key: string; value: string }) => ({
      ...acc,
      [cfg.key]: cfg.value,
    }),
    {}
  );

  const phone1 = c["contact_phone_1"] || "628111141888";
  const ctaTitle = c["cta_title"] || "Siap Untuk Liburan?";
  const ctaSubtitle =
    c["cta_subtitle"] ||
    "Hubungi kami dan dapatkan penawaran terbaik untuk villa impian Anda";

  // Normalize phone: strip non-digits, ensure starts with 62
  const waNumber = phone1.replace(/\D/g, "").replace(/^0/, "62");

  return (
    <section className="time-section relative overflow-hidden py-32">
      {/* Gradient */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/10 to-transparent opacity-80" />

      {/* Stars */}
      <Starfield count={140} seed={99} />

      {/* Glow */}
      <div className="absolute left-1/2 top-1/2 hidden h-125 w-125 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 blur-3xl md:block" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-accent">
          Mulai Sekarang
        </p>

        <h2 className="font-display mb-5 text-2xl font-bold leading-tight time-text sm:text-3xl md:text-5xl lg:text-6xl">
          {ctaTitle.includes("?") ? (
            <>
              {ctaTitle.split("?")[0]}
              <br />
              <span className="italic time-text-muted-alt">{ctaTitle.split("?")[1] ?? ""}?</span>
            </>
          ) : (
            ctaTitle
          )}
        </h2>

        <p className="mx-auto mb-12 max-w-md text-lg time-text-secondary">
          {ctaSubtitle}
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-full bg-accent px-8 py-4 font-semibold text-primary-dark shadow-xl shadow-accent/20 transition-all duration-300 hover:bg-accent-light hover:shadow-accent/30"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            WhatsApp Kami
          </a>

          <Link
            href="/villas"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-transparent px-8 py-4 font-semibold time-link-secondary backdrop-blur-sm transition-all duration-300 hover:border-accent/40"
          >
            Lihat Villa
          </Link>
        </div>
      </div>
    </section>
  );
}
