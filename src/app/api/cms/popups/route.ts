import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-guard";
import { z } from "zod";

const popupSchema = z.object({
  title: z.string().min(2, "Judul pop-up minimal 2 karakter"),
  subtitle: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  badge: z.string().optional().nullable(),
  actionLabel: z.string().optional().nullable(),
  actionUrl: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    if (activeOnly) {
      // Public endpoint to retrieve current active popup
      const now = new Date();
      const activePopup = await prisma.popups.findFirst({
        where: {
          isActive: true,
          OR: [
            {
              startDate: null,
              endDate: null,
            },
            {
              startDate: { lte: now },
              endDate: null,
            },
            {
              startDate: null,
              endDate: { gte: now },
            },
            {
              startDate: { lte: now },
              endDate: { gte: now },
            },
          ],
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        success: true,
        popup: activePopup,
      });
    }

    // Dashboard management request
    const authCheck = await requireApiPermission("cms:read");
    if (!authCheck.success) return authCheck.response;

    const popups = await prisma.popups.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      popups,
    });
  } catch (error: any) {
    console.error("GET /api/cms/popups error:", error);
    return NextResponse.json(
      { error: "Gagal memuat pop-up" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authCheck = await requireApiPermission("cms:update");
    if (!authCheck.success) return authCheck.response;

    const body = await request.json();
    const validated = popupSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;

    const newPopup = await prisma.popups.create({
      data: {
        title: data.title.trim(),
        subtitle: data.subtitle?.trim() || null,
        imageUrl: data.imageUrl?.trim() || null,
        badge: data.badge?.trim() || null,
        actionLabel: data.actionLabel?.trim() || null,
        actionUrl: data.actionUrl?.trim() || null,
        isActive: data.isActive,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });

    try {
      await prisma.activity_logs.create({
        data: {
          userId: authCheck.user.id,
          action: "CREATE_POPUP",
          entity: "popups",
          entityId: newPopup.id,
          details: `Membuat pop-up pengumuman baru: "${newPopup.title}"`,
        },
      });
    } catch (e) {
      console.warn("Log error:", e);
    }

    try {
      revalidatePath("/", "layout");
    } catch (e) {
      console.warn("Revalidate error:", e);
    }

    return NextResponse.json(
      {
        success: true,
        popup: newPopup,
        message: "Pop-up promo baru berhasil dibuat!",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/cms/popups error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat pop-up" },
      { status: 500 }
    );
  }
}
