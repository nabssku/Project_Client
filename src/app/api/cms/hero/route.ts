import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-guard";

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

export async function GET() {
  try {
    const authCheck = await requireApiPermission("cms:read");
    if (!authCheck.success) return authCheck.response;

    const configs = await prisma.site_configs.findMany({
      where: { key: { in: HERO_CONFIG_KEYS } },
    });

    const configMap: Record<string, string> = { ...DEFAULT_CONFIGS };
    configs.forEach((item) => {
      configMap[item.key] = item.value;
    });

    return NextResponse.json({
      success: true,
      configs: configMap,
    });
  } catch (error: any) {
    console.error("GET /api/cms/hero error:", error);
    return NextResponse.json(
      { error: "Gagal memuat konfigurasi hero & desain web" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const authCheck = await requireApiPermission("cms:update");
    if (!authCheck.success) return authCheck.response;

    const body = await request.json();

    const updates = HERO_CONFIG_KEYS.filter(
      (key) => typeof body[key] === "string"
    ).map((key) =>
      prisma.site_configs.upsert({
        where: { key },
        update: { value: body[key] },
        create: { key, value: body[key], type: "string" },
      })
    );

    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }

    // Audit log
    try {
      await prisma.activity_logs.create({
        data: {
          userId: authCheck.user.id,
          action: "UPDATE_CMS_HERO",
          entity: "site_configs",
          details: `Marketing/Admin ${authCheck.user.name} memperbarui desain web & hero branding.`,
        },
      });
    } catch (logErr) {
      console.warn("Failed to create activity log for cms hero update:", logErr);
    }

    // Revalidate public layouts and homepages
    try {
      revalidatePath("/", "layout");
      revalidatePath("/", "page");
      revalidatePath("/villas", "layout");
      revalidatePath("/villas", "page");
      revalidatePath("/artikel", "layout");
      revalidatePath("/promo", "layout");
      revalidatePath("/dashboard/cms/hero", "page");
    } catch (e) {
      console.warn("Revalidation error:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Konfigurasi Hero, Branding, & Desain Web berhasil disimpan!",
    });
  } catch (error: any) {
    console.error("PUT /api/cms/hero error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui konfigurasi CMS" },
      { status: 500 }
    );
  }
}
