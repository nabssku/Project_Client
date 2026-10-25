import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    // Allow logged-in staff/admin OR request with valid secret/token
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token") || searchParams.get("secret");
    const expectedSecret = process.env.REVALIDATION_SECRET || "villa-luxury-revalidate-secret-2026";

    const isAuthorized = Boolean(
      (session?.user && ["ADMIN", "MANAJER", "MARKETING"].includes(session.user.role)) ||
      (token && token === expectedSecret)
    );

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized: Hanya staf atau token valid yang dapat menyegarkan cache." },
        { status: 401 }
      );
    }

    // Invalidate all site config tags and pages
    try {
      revalidateTag("site_configs", { expire: 0 });
      revalidateTag("site_configs", "max");
      revalidateTag("villas", { expire: 0 });
      revalidateTag("testimonials", { expire: 0 });
      revalidateTag("articles", { expire: 0 });

      revalidatePath("/", "layout");
      revalidatePath("/", "page");
      revalidatePath("/villas", "layout");
      revalidatePath("/villas", "page");
      revalidatePath("/artikel", "layout");
      revalidatePath("/promo", "layout");
      revalidatePath("/booking", "layout");
      revalidatePath("/dashboard/settings");
      revalidatePath("/dashboard/cms/hero");
    } catch (revalErr) {
      console.warn("Revalidation warning:", revalErr);
    }

    return NextResponse.json({
      success: true,
      message: "Cache Vercel & Website berhasil dibersihkan! Seluruh konfigurasi database kini tampil live.",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Cache purge error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menyegarkan cache" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
