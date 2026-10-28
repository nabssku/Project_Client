import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasUserPermission } from "@/lib/rbac";
import { z } from "zod";

const toggleStatusSchema = z.object({
  isActive: z.boolean(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: targetUserId } = await params;

    const currentUser = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, permissions: true, isActive: true },
    });

    if (!currentUser || !currentUser.isActive) {
      return NextResponse.json({ error: "Akun dinonaktifkan" }, { status: 403 });
    }

    if (!hasUserPermission(currentUser, "user:status")) {
      return NextResponse.json(
        { error: "Forbidden: Anda tidak memiliki izin mengubah status pengguna" },
        { status: 403 }
      );
    }

    // Prevent self-deactivation
    if (session.user.id === targetUserId) {
      return NextResponse.json(
        { error: "Anda tidak dapat menonaktifkan akun Anda sendiri" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.users.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = toggleStatusSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Nilai status tidak valid" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.users.update({
      where: { id: targetUserId },
      data: { isActive: validated.data.isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        permissions: true,
      },
    });

    // Record audit log
    try {
      await prisma.activity_logs.create({
        data: {
          userId: session.user.id,
          action: "UPDATE_USER_STATUS",
          entity: "users",
          entityId: targetUserId,
          details: `Mengubah status akun "${targetUser.name}" (${targetUser.email}) menjadi ${updatedUser.isActive ? "AKTIF" : "NONAKTIF"}`,
        },
      });
    } catch (logErr) {
      console.warn("Failed to create activity log for user status toggle:", logErr);
    }

    try {
      revalidatePath("/dashboard", "layout");
      revalidatePath("/dashboard/users");
    } catch (e) {
      // ignore
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `Akun "${updatedUser.name}" berhasil di${updatedUser.isActive ? "aktifkan" : "nonaktifkan"}`,
    });
  } catch (error: any) {
    console.error("PATCH /api/users/[id]/status error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengubah status akun pengguna" },
      { status: 500 }
    );
  }
}
