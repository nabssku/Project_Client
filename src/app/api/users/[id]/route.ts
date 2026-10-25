import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";
import { hash } from "bcryptjs";
import { z } from "zod";
import type { Role } from "@prisma/client";

const updateUserSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter").optional().nullable().or(z.literal("")),
  role: z.enum(["ADMIN", "MANAJER", "MARKETING", "MAINTENANCE", "GUEST"]),
  isActive: z.boolean(),
  permissions: z.array(z.string()).default([]),
});

export async function PUT(
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

    const perms = getUserPermissions(currentUser);
    if (!perms.includes("user:update")) {
      return NextResponse.json(
        { error: "Forbidden: Anda tidak memiliki izin memperbarui data pengguna" },
        { status: 403 }
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
    const validated = updateUserSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;
    const cleanEmail = data.email.toLowerCase().trim();

    // Prevent self-lockout: cannot deactivate own account
    if (session.user.id === targetUserId && !data.isActive) {
      return NextResponse.json(
        { error: "Anda tidak dapat menonaktifkan akun Anda sendiri" },
        { status: 400 }
      );
    }

    // Prevent self-demotion from ADMIN
    if (
      session.user.id === targetUserId &&
      targetUser.role === "ADMIN" &&
      data.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "Anda tidak dapat mencabut hak Administrator dari akun Anda sendiri" },
        { status: 400 }
      );
    }

    // Check email uniqueness if email changed
    if (cleanEmail !== targetUser.email.toLowerCase()) {
      const emailTaken = await prisma.users.findUnique({
        where: { email: cleanEmail },
      });
      if (emailTaken) {
        return NextResponse.json(
          { error: "Alamat email ini sudah digunakan oleh akun lain" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {
      name: data.name.trim(),
      email: cleanEmail,
      role: data.role as Role,
      isActive: data.isActive,
      permissions: data.permissions,
    };

    if (data.password && data.password.trim().length >= 6) {
      updateData.passwordHash = await hash(data.password.trim(), 12);
    }

    const updatedUser = await prisma.users.update({
      where: { id: targetUserId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        permissions: true,
        updatedAt: true,
      },
    });

    // Record audit log
    try {
      await prisma.activity_logs.create({
        data: {
          userId: session.user.id,
          action: "UPDATE_USER",
          entity: "users",
          entityId: updatedUser.id,
          details: `Memperbarui akun "${updatedUser.name}" (${updatedUser.email}) — Role: ${updatedUser.role}, Status: ${updatedUser.isActive ? "Aktif" : "Nonaktif"}, Izin: ${updatedUser.permissions.length} izin`,
        },
      });
    } catch (logErr) {
      console.warn("Failed to create activity log for update user:", logErr);
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
      message: "Data pengguna dan hak akses berhasil diperbarui",
    });
  } catch (error: any) {
    console.error("PUT /api/users/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui pengguna" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const perms = getUserPermissions(currentUser);
    if (!perms.includes("user:delete")) {
      return NextResponse.json(
        { error: "Forbidden: Anda tidak memiliki izin menghapus pengguna" },
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (session.user.id === targetUserId) {
      return NextResponse.json(
        { error: "Anda tidak dapat menghapus akun Anda sendiri" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.users.findUnique({
      where: { id: targetUserId },
      include: {
        _count: {
          select: {
            bookings: true,
            assignedBookings: true,
            maintenanceTasks: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    // Safety relation guard: If user has associated bookings, prevent deletion
    const totalRelations =
      targetUser._count.bookings +
      targetUser._count.assignedBookings +
      targetUser._count.maintenanceTasks;

    if (totalRelations > 0) {
      return NextResponse.json(
        {
          error: `Pengguna ini memiliki relasi aktif (${targetUser._count.bookings} booking, ${targetUser._count.assignedBookings} penugasan staf, ${targetUser._count.maintenanceTasks} tugas maintenance). Untuk menjaga integritas data, silakan nonaktifkan akun (status: Nonaktif) alih-alih menghapusnya.`,
        },
        { status: 400 }
      );
    }

    await prisma.users.delete({
      where: { id: targetUserId },
    });

    // Record audit log
    try {
      await prisma.activity_logs.create({
        data: {
          userId: session.user.id,
          action: "DELETE_USER",
          entity: "users",
          entityId: targetUserId,
          details: `Menghapus akun "${targetUser.name}" (${targetUser.email})`,
        },
      });
    } catch (logErr) {
      console.warn("Failed to create activity log for delete user:", logErr);
    }

    try {
      revalidatePath("/dashboard", "layout");
      revalidatePath("/dashboard/users");
    } catch (e) {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: "Akun pengguna berhasil dihapus",
    });
  } catch (error: any) {
    console.error("DELETE /api/users/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menghapus pengguna" },
      { status: 500 }
    );
  }
}
