import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface RouteParams {
  params: Promise<{ id: string; addonId: string }>;
}

// PUT /api/villas/[id]/addons/[addonId] - Update addon
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "MANAJER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Hanya Admin dan Manajer yang dapat mengedit addon villa" },
        { status: 403 }
      );
    }

    const { id: villaId, addonId } = await params;
    const body = await request.json();

    const existingAddon = await prisma.villa_addons.findUnique({
      where: { id: addonId },
      include: {
        villa: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!existingAddon || existingAddon.villaId !== villaId) {
      return NextResponse.json(
        { error: "Addon villa tidak ditemukan" },
        { status: 404 }
      );
    }

    const { name, description, price, maxQty, unit, isActive } = body;

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name.trim();
    if (description !== undefined) dataToUpdate.description = description?.trim() || null;
    if (price !== undefined) dataToUpdate.price = Math.max(0, parseInt(price, 10) || 0);
    if (maxQty !== undefined) dataToUpdate.maxQty = Math.max(1, parseInt(maxQty, 10) || 1);
    if (unit !== undefined) dataToUpdate.unit = unit.trim() || "pcs";
    if (isActive !== undefined) dataToUpdate.isActive = Boolean(isActive);

    const updatedAddon = await prisma.villa_addons.update({
      where: { id: addonId },
      data: dataToUpdate,
    });

    // Audit log
    await prisma.activity_logs.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_VILLA_ADDON",
        entity: "villa_addons",
        entityId: updatedAddon.id,
        details: `Memperbarui addon "${updatedAddon.name}" untuk villa "${existingAddon.villa.name}"`,
      },
    });

    try {
      revalidatePath(`/villas/${existingAddon.villa.slug}`);
      revalidatePath(`/booking`);
      revalidatePath(`/dashboard/villas`);
    } catch (e) {
      console.warn("revalidatePath notice:", e);
    }

    return NextResponse.json({
      success: true,
      addon: updatedAddon,
      message: "Addon berhasil diperbarui",
    });
  } catch (error: any) {
    console.error("Error updating villa addon:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui addon villa" },
      { status: 500 }
    );
  }
}

// DELETE /api/villas/[id]/addons/[addonId] - Hapus addon
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "MANAJER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Hanya Admin dan Manajer yang dapat menghapus addon villa" },
        { status: 403 }
      );
    }

    const { id: villaId, addonId } = await params;

    const existingAddon = await prisma.villa_addons.findUnique({
      where: { id: addonId },
      include: {
        villa: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!existingAddon || existingAddon.villaId !== villaId) {
      return NextResponse.json(
        { error: "Addon villa tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.villa_addons.delete({
      where: { id: addonId },
    });

    // Audit log
    await prisma.activity_logs.create({
      data: {
        userId: session.user.id,
        action: "DELETE_VILLA_ADDON",
        entity: "villa_addons",
        entityId: addonId,
        details: `Menghapus addon "${existingAddon.name}" dari villa "${existingAddon.villa.name}"`,
      },
    });

    try {
      revalidatePath(`/villas/${existingAddon.villa.slug}`);
      revalidatePath(`/booking`);
      revalidatePath(`/dashboard/villas`);
    } catch (e) {
      console.warn("revalidatePath notice:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Addon berhasil dihapus",
    });
  } catch (error: any) {
    console.error("Error deleting villa addon:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menghapus addon villa" },
      { status: 500 }
    );
  }
}
