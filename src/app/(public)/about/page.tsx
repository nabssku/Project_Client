import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import {
  Building2,
  Users,
  Star,
  Award,
  ArrowRight,
  Phone,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { AboutRichRenderer } from "@/components/cms/about-rich-renderer";
import { ABOUT_CONFIG_KEYS, DEFAULT_ABOUT_CONFIGS } from "@/lib/about-config";
import { buildSmoMetadata } from "@/lib/smo";

export const instant = false;

async function getAboutConfigs() {
  "use cache";
  cacheTag("site_configs");
  cacheLife("seconds");

  try {
    const keysToFetch = [...ABOUT_CONFIG_KEYS, "site_name", "contact_phone_1"];
    const records = await prisma.site_configs.findMany({
      where: { key: { in: keysToFetch } },
    });

    const configMap: Record<string, string> = { ...DEFAULT_ABOUT_CONFIGS };
    records.forEach((item) => {
      configMap[item.key] = item.value;
    });

    return configMap;
  } catch (error) {
    console.error("Error fetching about page configs:", error);
    return { ...DEFAULT_ABOUT_CONFIGS };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  "use cache";
  cacheTag("site_configs");
  cacheLife("minutes");

  const configs = await getAboutConfigs();
  const siteName = configs.site_name || "villaqoe";
  const title = configs.about_meta_title || `${configs.about_title || "Tentang Kami"} | ${siteName}`;
  const description =
    configs.about_meta_description ||
    configs.about_subtitle ||
    `Pelajari filosofi, dedikasi pelayanan, dan komitmen kenyamanan villa peristirahatan terbaik bersama ${siteName}.`;
  const image = configs.about_hero_image || "/Villaqoe.png";

  return buildSmoMetadata({
    title,
    description,
    urlPath: "/about",
    image,
    siteName,
    keywords: ["tentang kami", "profil villaqoe", "pengelola villa puncak", "pelayanan villa"],
  });
}

export default async function AboutPublicPage() {
  const configs = await getAboutConfigs();
  const siteName = configs.site_name || "Villa";

  const phone = (configs.contact_phone_1 || "628111141888").replace(/\D/g, "").replace(/^0/, "62");
  const waText = `Halo Admin ${siteName}, saya tertarik untuk mengetahui informasi ketersediaan villa. Bisa dibantu?`;

  const stats = [
    {
      val: configs.about_stat_1_val || "15+",
      lbl: configs.about_stat_1_lbl || "Unit Villa Eksklusif",
      icon: Building2,
    },
    {
      val: configs.about_stat_2_val || "10.000+",
      lbl: configs.about_stat_2_lbl || "Tamu Bahagia",
      icon: Users,
    },
    {
      val: configs.about_stat_3_val || "4.9 / 5.0",
      lbl: configs.about_stat_3_lbl || "Rating Kepuasan",
      icon: Star,
    },
    {
      val: configs.about_stat_4_val || "7+ Tahun",
      lbl: configs.about_stat_4_lbl || "Dedikasi Pelayanan",
      icon: Award,
    },
  ];

  return (
    <main className="min-h-screen bg-[#fcfbf9] pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 space-y-16 sm:space-y-20">
        {/* ================= 1. HERO HEADER BANNER ================= */}
        <section className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-semibold tracking-wider uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Suaka Eksklusif &amp; Ketenangan</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary tracking-tight leading-tight mb-5">
            {configs.about_title || `Tentang ${siteName}`}
          </h1>

          <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
            {configs.about_subtitle ||
              "Kenyamanan Suaka Eksklusif dan Suasana Damai untuk Liburan Istimewa Anda"}
          </p>
        </section>

        {/* ================= 2. HERO IMAGE BANNER ================= */}
        {configs.about_hero_image && (
          <section className="relative rounded-3xl overflow-hidden shadow-xl border border-gray-200/80 aspect-[16/9] sm:aspect-[21/9] max-h-[520px] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={configs.about_hero_image}
              alt={configs.about_title || `Tentang ${siteName}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 text-white max-w-xl">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-widest uppercase bg-white/20 backdrop-blur-md px-3 py-1 rounded-full mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                <span>Kenyamanan Terjamin</span>
              </span>
              <p className="font-display text-xl sm:text-2xl md:text-3xl font-semibold leading-snug drop-shadow-sm">
                Setiap sudut dirancang untuk menciptakan ketenangan dan momen kebersamaan tak terlupakan.
              </p>
            </div>
          </section>
        )}

        {/* ================= 3. STATS HIGHLIGHT BAR ================= */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs text-center flex flex-col items-center justify-center space-y-2 hover:shadow-md transition-shadow duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-1">
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                {stat.val}
              </span>
              <span className="text-xs sm:text-sm text-gray-500 font-medium">
                {stat.lbl}
              </span>
            </div>
          ))}
        </section>

        {/* ================= 4. RICH CONTENT BODY ================= */}
        <section className="max-w-4xl mx-auto bg-white p-7 sm:p-12 md:p-14 rounded-3xl border border-gray-200/80 shadow-xs">
          <AboutRichRenderer content={configs.about_content || ""} />
        </section>

        {/* ================= 5. LUXURY CTA BANNER ================= */}
        <section className="relative rounded-3xl overflow-hidden bg-primary-dark text-white p-8 sm:p-14 md:p-16 text-center space-y-6 shadow-xl border border-white/10">
          <div className="max-w-2xl mx-auto space-y-4">
            <span className="inline-block text-accent text-xs font-semibold tracking-widest uppercase">
              Rencanakan Liburan Anda
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
              Siap Merasakan Ketenangan di Villa Pilihan Anda?
            </h2>
            <p className="text-sm sm:text-base text-white/75 leading-relaxed">
              Jelajahi koleksi unit villa privat dengan kolam renang eksklusif, pemandangan pegunungan asri, dan fasilitas bintang lima.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/villas"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full text-sm font-semibold bg-accent text-primary-dark hover:bg-accent-light transition-all shadow-md group"
            >
              <span>Jelajahi Katalog Villa</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <a
              href={`https://wa.me/${phone}?text=${encodeURIComponent(waText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all"
            >
              <Phone className="w-4 h-4" />
              <span>Hubungi via WhatsApp</span>
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
