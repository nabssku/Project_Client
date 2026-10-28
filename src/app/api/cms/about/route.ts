import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-guard";
import { ABOUT_CONFIG_KEYS, DEFAULT_ABOUT_CONFIGS } from "@/lib/about-config";

export async function GET() {
  try {
    const authCheck = await requireApiPermission("cms:read");
    if (!authCheck.success) return authCheck.response;

    const configs = await prisma.site_configs.findMany({
      where: { key: { in: ABOUT_CONFIG_KEYS } },
    });

    const configMap: Record<string, string> = { ...DEFAULT_ABOUT_CONFIGS };
    configs.forEach((item) => {
      configMap[item.key] = item.value;
    });

    return NextResponse.json({
      success: true,
      configs: configMap,
    });
  } catch (error: any) {
    console.error("GET /api/cms/about error:", error);
    return NextResponse.json(
      { error: "Gagal memuat konfigurasi halaman Tentang Kami" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const authCheck = await requireApiPermission("cms:update");
    if (!authCheck.success) return authCheck.response;

    const body = await request.json();

    const updates = ABOUT_CONFIG_KEYS.filter(
      (key) => typeof body[key] === "string"
    ).map((key) => {
      return prisma.site_configs.upsert({
        where: { key },
        update: { value: body[key] },
        create: {
          key,
          value: body[key],
          type: "string",
        },
      });
    });

    await prisma.$transaction(updates);

    // Audit log
    await prisma.activity_logs.create({
      data: {
        userId: authCheck.user.id,
        action: "UPDATE_CMS_ABOUT",
        entity: "site_configs",
        details: `Memperbarui konten halaman Tentang Kami oleh ${authCheck.user.name} (${authCheck.user.role})`,
      },
    });

    // Revalidate public page & tags
    try {
      revalidatePath("/about", "layout");
      revalidatePath("/about");
      revalidateTag("site_configs", { expire: 0 });
    } catch (e) {
      console.warn("Revalidate cache error:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Halaman Tentang Kami berhasil disimpan!",
    });
  } catch (error: any) {
    console.error("PUT /api/cms/about error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menyimpan perubahan halaman Tentang Kami" },
      { status: 500 }
    );
  }
}
