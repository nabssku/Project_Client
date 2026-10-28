import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasUserPermission } from "@/lib/rbac";
import { hash } from "bcryptjs";
import { z } from "zod";
import type { Role } from "@prisma/client";

const createUserSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["ADMIN", "MANAJER", "MARKETING", "MAINTENANCE", "GUEST"]),
  isActive: z.boolean().default(true),
  permissions: z.array(z.string()).default([]),
});

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { role: true, permissions: true, isActive: true },
    });

    if (!currentUser || !currentUser.isActive) {
      return NextResponse.json({ error: "Akun dinonaktifkan" }, { status: 403 });
    }

    if (!hasUserPermission(currentUser, "user:read")) {
      return NextResponse.json(
        { error: "Forbidden: Anda tidak memiliki izin melihat data pengguna" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const roleParam = searchParams.get("role");
    const statusParam = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};

    if (roleParam && roleParam !== "ALL") {
      where.role = roleParam as Role;
    }

    if (statusParam === "ACTIVE") {
      where.isActive = true;
    } else if (statusParam === "INACTIVE") {
      where.isActive = false;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const usersList = await prisma.users.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        permissions: true,
        createdAt: true,
        _count: {
          select: {
            bookings: true,
            maintenanceTasks: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      users: usersList,
    });
  } catch (error: any) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar pengguna" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { role: true, permissions: true, isActive: true },
    });

    if (!currentUser || !currentUser.isActive) {
      return NextResponse.json({ error: "Akun dinonaktifkan" }, { status: 403 });
    }

    if (!hasUserPermission(currentUser, "user:create")) {
      return NextResponse.json(
        { error: "Forbidden: Anda tidak memiliki izin membuat pengguna baru" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = createUserSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;
    const cleanEmail = data.email.toLowerCase().trim();

    // Check if email already registered
    const existing = await prisma.users.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Alamat email ini sudah terdaftar dalam sistem" },
        { status: 400 }
      );
    }

    const passwordHash = await hash(data.password, 12);

    const newUser = await prisma.users.create({
      data: {
        name: data.name.trim(),
        email: cleanEmail,
        passwordHash,
        role: data.role,
        isActive: data.isActive,
        permissions: data.permissions,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        permissions: true,
        createdAt: true,
      },
    });

    // Record audit log
    try {
      await prisma.activity_logs.create({
        data: {
          userId: session.user.id,
          action: "CREATE_USER",
          entity: "users",
          entityId: newUser.id,
          details: `Menambahkan pengguna baru: "${newUser.name}" (${newUser.email}) sebagai role ${newUser.role}`,
        },
      });
    } catch (logErr) {
      console.warn("Failed to create activity log for create user:", logErr);
    }

    return NextResponse.json(
      {
        success: true,
        user: newUser,
        message: "Pengguna baru berhasil ditambahkan",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/users error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat pengguna baru" },
      { status: 500 }
    );
  }
}
