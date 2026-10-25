import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const checkBookingSchema = z.object({
  code: z.string().min(3, "Kode booking wajib diisi"),
  email: z.string().email("Format email tidak valid"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = checkBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    const { code, email } = parsed.data;

    const booking = await prisma.bookings.findFirst({
      where: {
        code: {
          equals: code.trim(),
          mode: "insensitive",
        },
        guestEmail: {
          equals: email.trim(),
          mode: "insensitive",
        },
      },
      include: {
        villa: {
          select: {
            id: true,
            name: true,
            slug: true,
            location: true,
            images: true,
            checkInTime: true,
            checkOutTime: true,
            rules: true,
            mapEmbed: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        {
          error:
            "Pesanan tidak ditemukan. Pastikan kode booking dan email yang dimasukkan sudah sesuai.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      booking,
    });
  } catch (error: any) {
    console.error("Booking lookup error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mencari data pesanan" },
      { status: 500 }
    );
  }
}
