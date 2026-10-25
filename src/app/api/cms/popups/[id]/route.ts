import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-guard";
import { z } from "zod";

const updatePopupSchema = z.object({
  title: z.string().min(2, "Judul pop-up minimal 2 karakter").optional(),
  subtitle: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  badge: z.string().optional().nullable(),
  actionLabel: z.string().optional().nullable(),
  actionUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireApiPermission("cms:read");
    if (!authCheck.success) return authCheck.response;

    const { id } = await params;
    const popup = await prisma.popups.findUnique({ where: { id } });

    if (!popup) {
      return NextResponse.json({ error: "Pop-up tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, popup });
  } catch (error: any) {
    console.error("GET /api/cms/popups/[id] error:", error);
    return NextResponse.json({ error: "Gagal memuat pop-up" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireApiPermission("cms:update");
    if (!authCheck.success) return authCheck.response;

    const { id } = await params;
    const existing = await prisma.popups.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Pop-up tidak ditemukan" }, { status: 404 });
    }

    const body = await request.json();
    const validated = updatePopupSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;

    const updated = await prisma.popups.update({
      where: { id },
      data: {
        ...(data.title ? { title: data.title.trim() } : {}),
        ...(data.subtitle !== undefined ? { subtitle: data.subtitle?.trim() || null } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl?.trim() || null } : {}),
        ...(data.badge !== undefined ? { badge: data.badge?.trim() || null } : {}),
        ...(data.actionLabel !== undefined ? { actionLabel: data.actionLabel?.trim() || null } : {}),
        ...(data.actionUrl !== undefined ? { actionUrl: data.actionUrl?.trim() || null } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.startDate !== undefined ? { startDate: data.startDate ? new Date(data.startDate) : null } : {}),
        ...(data.endDate !== undefined ? { endDate: data.endDate ? new Date(data.endDate) : null } : {}),
      },
    });

    try {
      await prisma.activity_logs.create({
        data: {
          userId: authCheck.user.id,
          action: "UPDATE_POPUP",
          entity: "popups",
          entityId: updated.id,
          details: `Memperbarui pop-up "${updated.title}"`,
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

    return NextResponse.json({
      success: true,
      popup: updated,
      message: "Pop-up berhasil diperbarui!",
    });
  } catch (error: any) {
    console.error("PUT /api/cms/popups/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui pop-up" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireApiPermission("cms:update");
    if (!authCheck.success) return authCheck.response;

    const { id } = await params;
    const existing = await prisma.popups.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Pop-up tidak ditemukan" }, { status: 404 });
    }

    await prisma.popups.delete({ where: { id } });

    try {
      await prisma.activity_logs.create({
        data: {
          userId: authCheck.user.id,
          action: "DELETE_POPUP",
          entity: "popups",
          entityId: id,
          details: `Menghapus pop-up "${existing.title}"`,
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

    return NextResponse.json({
      success: true,
      message: "Pop-up berhasil dihapus!",
    });
  } catch (error: any) {
    console.error("DELETE /api/cms/popups/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus pop-up" },
      { status: 500 }
    );
  }
}
