import { redirect } from "next/navigation";
import { connection, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPermissions, hasUserPermission, type Permission } from "@/lib/rbac";
import type { Role } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  permissions: Permission[];
}

/**
 * Server-Side Route Guard untuk memvalidasi akses halaman dashboard secara langsung.
 * Jika pengguna tidak aktif -> langsung dialihkan ke login dengan pesan dinonaktifkan.
 * Jika pengguna tidak memiliki izin -> langsung dialihkan ke /dashboard dengan parameter peringatan.
 */
export async function requirePagePermission(
  permission: Permission
): Promise<AuthenticatedUser> {
  await connection();
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  let user = null;
  try {
    user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        permissions: true,
      },
    });
  } catch (err: any) {
    console.error("Warning: DB query error in requirePagePermission:", err?.message || err);
    // Jika koneksi Neon timeout/sleep sementara, gunakan kredensial valid dari JWT session
    if (session.user.role) {
      user = {
        id: session.user.id,
        name: session.user.name || "Pengguna",
        email: session.user.email || "",
        role: session.user.role as Role,
        isActive: true,
        permissions: [] as string[],
      };
    }
  }

  if (!user || !user.isActive) {
    redirect("/login?error=deactivated");
  }

  const effectivePermissions = getUserPermissions(user);

  if (!hasUserPermission(user, permission)) {
    redirect(`/dashboard?denied=${encodeURIComponent(permission)}`);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    permissions: effectivePermissions,
  };
}

/**
 * Route Guard untuk API endpoints: memverifikasi session, keaktifan akun, dan izin spesifik.
 * Mengembalikan objek user yang terautentikasi jika valid, atau NextResponse error (401/403) jika ditolak.
 */
export async function requireApiPermission(
  permission: Permission
): Promise<
  | { success: true; user: AuthenticatedUser }
  | { success: false; response: NextResponse }
> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Sesi tidak valid atau telah berakhir. Silakan login kembali." },
        { status: 401 }
      ),
    };
  }

  let user = null;
  try {
    user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        permissions: true,
      },
    });
  } catch (err: any) {
    console.error("Warning: DB query error in requirePagePermission:", err?.message || err);
    // Jika koneksi Neon timeout/sleep sementara, gunakan kredensial valid dari JWT session
    if (session.user.role) {
      user = {
        id: session.user.id,
        name: session.user.name || "Pengguna",
        email: session.user.email || "",
        role: session.user.role as Role,
        isActive: true,
        permissions: [] as string[],
      };
    }
  }

  if (!user || !user.isActive) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Akun Anda telah dinonaktifkan oleh administrator." },
        { status: 403 }
      ),
    };
  }

  const effectivePermissions = getUserPermissions(user);

  if (!hasUserPermission(user, permission)) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: `Akses ditolak: Anda memerlukan izin '${permission}' untuk melakukan tindakan ini.`,
        },
        { status: 403 }
      ),
    };
  }

  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      permissions: effectivePermissions,
    },
  };
}
