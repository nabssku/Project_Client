import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/villas/[id]/addons - Ambil daftar addon untuk villa
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: villaId } = await params;

    // Check auth to determine whether to show inactive addons
    const session = await auth();
    const isStaff =
      session?.user &&
      ["ADMIN", "MANAJER", "MARKETING"].includes(session.user.role);

    const addons = await prisma.villa_addons.findMany({
      where: {
        villaId,
        ...(isStaff ? {} : { isActive: true }),
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      addons,
    });
  } catch (error: any) {
    console.error("Error fetching villa addons:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar addon villa" },
      { status: 500 }
    );
  }
}

// POST /api/villas/[id]/addons - Tambah addon baru untuk villa
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "MANAJER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Hanya Admin dan Manajer yang dapat mengelola addon villa" },
        { status: 403 }
      );
    }

    const { id: villaId } = await params;
    const body = await request.json();

    const { name, description, price, maxQty, unit, isActive } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Nama addon wajib diisi" },
        { status: 400 }
      );
    }

    const parsedPrice = parseInt(price, 10);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json(
        { error: "Harga addon harus berupa angka valid (minimal Rp 0)" },
        { status: 400 }
      );
    }

    const parsedMaxQty = parseInt(maxQty, 10) || 10;

    const villa = await prisma.villas.findUnique({
      where: { id: villaId },
      select: { id: true, name: true, slug: true },
    });

    if (!villa) {
      return NextResponse.json(
        { error: "Villa tidak ditemukan" },
        { status: 404 }
      );
    }

    const newAddon = await prisma.villa_addons.create({
      data: {
        villaId,
        name: name.trim(),
        description: description?.trim() || null,
        price: parsedPrice,
        maxQty: parsedMaxQty,
        unit: unit?.trim() || "pcs",
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    // Audit log
    await prisma.activity_logs.create({
      data: {
        userId: session.user.id,
        action: "CREATE_VILLA_ADDON",
        entity: "villa_addons",
        entityId: newAddon.id,
        details: `Menambahkan addon "${newAddon.name}" (Rp ${parsedPrice.toLocaleString("id-ID")}/${newAddon.unit}) untuk villa "${villa.name}"`,
      },
    });

    try {
      revalidatePath(`/villas/${villa.slug}`);
      revalidatePath(`/booking`);
      revalidatePath(`/dashboard/villas`);
    } catch (e) {
      console.warn("revalidatePath notice:", e);
    }

    return NextResponse.json(
      {
        success: true,
        addon: newAddon,
        message: "Addon berhasil ditambahkan",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating villa addon:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat addon villa" },
      { status: 500 }
    );
  }
}
