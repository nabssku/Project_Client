import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { compare, hash } from "bcryptjs";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Kata sandi baru minimal 6 karakter").optional(),
});

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized: Silakan login terlebih dahulu" }, { status: 401 });
    }

    const currentUser = await prisma.users.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || !currentUser.isActive) {
      return NextResponse.json(
        { error: "Akun tidak ditemukan atau telah dinonaktifkan" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = updateProfileSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;
    const updateData: { name?: string; passwordHash?: string } = {};

    // 1. Name update
    if (data.name && data.name.trim() !== currentUser.name) {
      updateData.name = data.name.trim();
    }

    // 2. Password update
    if (data.newPassword) {
      if (!data.currentPassword) {
        return NextResponse.json(
          { error: "Kata sandi saat ini wajib diisi untuk mengganti kata sandi baru" },
          { status: 400 }
        );
      }

      const isCurrentValid = await compare(data.currentPassword, currentUser.passwordHash);
      if (!isCurrentValid) {
        return NextResponse.json(
          { error: "Kata sandi saat ini tidak sesuai. Silakan periksa kembali." },
          { status: 400 }
        );
      }

      updateData.passwordHash = await hash(data.newPassword, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: true,
        user: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          avatar: currentUser.avatar,
        },
        message: "Tidak ada perubahan data",
      });
    }

    const updatedUser = await prisma.users.update({
      where: { id: currentUser.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
      },
    });

    // Record audit log
    try {
      const logDetails = [
        updateData.name ? `mengubah nama menjadi "${updatedUser.name}"` : null,
        updateData.passwordHash ? "memperbarui kata sandi" : null,
      ].filter(Boolean).join(" dan ");

      await prisma.activity_logs.create({
        data: {
          userId: currentUser.id,
          action: "UPDATE_PROFILE",
          entity: "users",
          entityId: currentUser.id,
          details: `Tamu/Pengguna ${currentUser.name} (${currentUser.email}) ${logDetails}`,
        },
      });
    } catch (logErr) {
      console.warn("Failed to create activity log for profile update:", logErr);
    }

    try {
      revalidatePath("/dashboard");
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "Profil akun Anda berhasil diperbarui",
    });
  } catch (error: any) {
    console.error("PATCH /api/user/profile error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui profil akun" },
      { status: 500 }
    );
  }
}
