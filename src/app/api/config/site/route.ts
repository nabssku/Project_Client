import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    const configsList = await prisma.site_configs.findMany();
    const configsMap: Record<string, string> = {};
    configsList.forEach((c) => {
      configsMap[c.key] = c.value;
    });

    return NextResponse.json({
      success: true,
      configs: configsMap,
    });
  } catch (error: any) {
    console.error("GET site configs error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat konfigurasi situs" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Strict role check: Only ADMIN can edit general site configs
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Forbidden: Hanya akun dengan role Administrator yang diizinkan mengubah konfigurasi umum situs.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { configs } = body;

    if (!configs || typeof configs !== "object") {
      return NextResponse.json(
        { error: "Data konfigurasi tidak valid" },
        { status: 400 }
      );
    }

    const entries = Object.entries(configs as Record<string, any>);

    // Upsert each key in transaction
    await prisma.$transaction(
      entries.map(([key, value]) => {
        const stringVal = value !== null && value !== undefined ? String(value) : "";
        return prisma.site_configs.upsert({
          where: { key },
          update: {
            value: stringVal,
            updatedAt: new Date(),
          },
          create: {
            key,
            value: stringVal,
            type: "string",
          },
        });
      })
    );

    // Record activity log
    try {
      await prisma.activity_logs.create({
        data: {
          userId: session.user.id,
          action: "UPDATE_CONFIG",
          entity: "site_configs",
          details: JSON.stringify({
            updatedKeysCount: entries.length,
            updatedBy: session.user.name || session.user.email,
            role: session.user.role,
          }),
        },
      });
    } catch (logErr) {
      console.warn("Failed to record activity log for site config update:", logErr);
    }

    // Revalidate paths across website
    try {
      revalidatePath("/", "layout");
      revalidatePath("/dashboard/settings");
      revalidatePath("/villas");
      revalidatePath("/login");
      revalidatePath("/register");
    } catch (e) {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: "Seluruh konfigurasi situs berhasil diperbarui!",
    });
  } catch (error: any) {
    console.error("PUT site configs error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui konfigurasi situs" },
      { status: 500 }
    );
  }
}
