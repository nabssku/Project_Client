import { requirePagePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { HeroClient } from "@/components/dashboard/cms/hero-client";

export const instant = false;

const HERO_CONFIG_KEYS = [
  "hero_title",
  "hero_title_italic",
  "hero_tagline",
  "hero_subtitle",
  "hero_video",
  "hero_image",
  "hero_gradient_accent",
  "font_display",
  "font_body",
  "primary_color",
  "secondary_color",
  "stats_properties",
  "stats_guests",
  "stats_rating",
  "cta_title",
  "cta_subtitle",
];

const DEFAULT_CONFIGS: Record<string, string> = {
  hero_title: "Kemewahan Bertemu Ketenangan",
  hero_title_italic: "Suaka Eksklusif Anda",
  hero_tagline: "Hai, Hallo Tatangga",
  hero_subtitle: "Pengalaman menginap lengkap untuk momen yang lebih berkesan bersama keluarga dan orang terkasih.",
  hero_video: "",
  hero_image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1920&q=80",
  hero_gradient_accent: "#1a1a2e",
  font_display: "Playfair Display",
  font_body: "DM Sans",
  primary_color: "#1a1a2e",
  secondary_color: "#C8A44E",
  stats_properties: "50+",
  stats_guests: "10K+",
  stats_rating: "4.8",
  cta_title: "Siap Untuk Liburan?",
  cta_subtitle: "Hubungi kami dan dapatkan penawaran terbaik untuk villa impian Anda",
};

export default async function CmsHeroPage() {
  const user = await requirePagePermission("cms:read");

  const configsFromDb = await prisma.site_configs.findMany({
    where: { key: { in: HERO_CONFIG_KEYS } },
  });

  const configMap: Record<string, string> = { ...DEFAULT_CONFIGS };
  configsFromDb.forEach((item) => {
    configMap[item.key] = item.value;
  });

  const canEdit = user.permissions.includes("cms:update");

  return <HeroClient initialConfigs={configMap} canEdit={canEdit} />;
}
