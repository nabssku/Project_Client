import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { valid: false, error: "Kode promo wajib diisi" },
        { status: 400 }
      );
    }

    const now = new Date();
    const promo = await prisma.promos.findFirst({
      where: {
        code: { equals: code.trim(), mode: "insensitive" },
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
    });

    if (!promo) {
      return NextResponse.json(
        {
          valid: false,
          error: "Kode promo tidak valid, sudah kadaluarsa, atau tidak aktif.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      code: promo.code,
      title: promo.title,
      discountPercent: promo.discountPercent,
      description: promo.description,
    });
  } catch (error: any) {
    console.error("Promo validate error:", error);
    return NextResponse.json(
      { valid: false, error: "Gagal memvalidasi kode promo" },
      { status: 500 }
    );
  }
}
