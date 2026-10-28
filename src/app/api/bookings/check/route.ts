import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { isBookingExpired } from "@/lib/booking-expiration";

const checkBookingSchema = z.object({
  code: z.string().min(3, "Kode booking wajib diisi"),
  email: z.string().optional(),
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

    const { code } = parsed.data;

    const booking = await prisma.bookings.findFirst({
      where: {
        code: {
          equals: code.trim(),
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
        addons: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        {
          error:
            "Pesanan tidak ditemukan. Pastikan kode booking yang dimasukkan sudah benar (contoh: BK-XXXXXX).",
        },
        { status: 404 }
      );
    }

    // Auto-cancel if pending and check-in deadline has passed
    if (
      booking.status === "PENDING" &&
      isBookingExpired(booking.checkIn, booking.villa?.checkInTime)
    ) {
      const expiredReason =
        "Dibatalkan otomatis oleh sistem: Batas waktu pembayaran telah kedaluwarsa karena telah melewati jadwal check-in.";
      try {
        await prisma.bookings.update({
          where: { id: booking.id },
          data: {
            status: "CANCELLED",
            rejectionReason: expiredReason,
          },
        });
        booking.status = "CANCELLED";
        booking.rejectionReason = expiredReason;
      } catch (err) {
        console.error("Failed to auto-cancel expired booking in check route:", err);
      }
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
