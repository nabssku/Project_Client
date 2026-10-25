import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
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
  } catch (error: any) {
    console.error("GET /api/public/popups error:", error);
    return NextResponse.json(
      { error: "Gagal memuat pop-up aktif", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
