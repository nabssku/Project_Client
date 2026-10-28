import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadBufferToR2 } from "@/lib/r2";
import { isBookingExpired } from "@/lib/booking-expiration";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bookingCode = formData.get("bookingCode") as string | null;

    if (!file) {
      return NextResponse.json({ error: "File bukti pembayaran tidak ditemukan" }, { status: 400 });
    }

    if (!bookingCode) {
      return NextResponse.json({ error: "Kode booking diperlukan" }, { status: 400 });
    }

    // Check if booking exists
    const booking = await prisma.bookings.findFirst({
      where: {
        OR: [
          { code: { equals: bookingCode.trim(), mode: "insensitive" } },
          { id: bookingCode.trim() },
        ],
      },
      include: {
        villa: {
          select: {
            checkInTime: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 });
    }

    // Check if payment deadline has expired
    if (isBookingExpired(booking.checkIn, booking.villa?.checkInTime)) {
      if (booking.status === "PENDING") {
        await prisma.bookings.update({
          where: { id: booking.id },
          data: {
            status: "CANCELLED",
            rejectionReason:
              "Dibatalkan otomatis oleh sistem: Batas waktu pembayaran telah kedaluwarsa karena telah melewati jadwal check-in.",
          },
        });
      }
      return NextResponse.json(
        {
          error:
            "Batas waktu pembayaran telah kedaluwarsa. Pesanan dibatalkan otomatis karena telah melewati batas jadwal check-in.",
        },
        { status: 400 }
      );
    }

    // Validate mime type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Harap unggah foto JPG, PNG, WebP, atau dokumen PDF." },
        { status: 400 }
      );
    }

    // Max size: 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ukuran file terlalu besar. Maksimum 10 MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine file extension
    let ext = "jpg";
    if (file.type === "image/png") ext = "png";
    else if (file.type === "image/webp") ext = "webp";
    else if (file.type === "application/pdf") ext = "pdf";

    const timestamp = Date.now();
    const sanitizedCode = booking.code.replace(/[^a-zA-Z0-9_-]/g, "");
    const key = `proofs/${sanitizedCode}_${timestamp}.${ext}`;

    const publicUrl = await uploadBufferToR2(buffer, key, file.type);

    // Update booking with payment proof URL, timestamp, reset status to PENDING, and clear rejection reason
    const updated = await prisma.bookings.update({
      where: { id: booking.id },
      data: {
        paymentProofUrl: publicUrl,
        paymentProofUploadedAt: new Date(),
        status: "PENDING",
        rejectionReason: null,
      },
      include: {
        addons: true,
        villa: {
          select: {
            id: true,
            name: true,
            slug: true,
            location: true,
            images: true,
            checkInTime: true,
            checkOutTime: true,
          },
        },
      },
    });

    // Kirim notifikasi bukti bayar via Resend beserta PDF invoice
    try {
      const configs = await prisma.site_configs.findMany({
        where: { key: { in: ["site_name", "site_logo"] } },
      });
      const configMap = configs.reduce((acc, c) => ({ ...acc, [c.key]: c.value }), {} as Record<string, string>);
      const siteName = configMap.site_name || "Singgahsana";
      const siteLogo = configMap.site_logo || null;

      const { sendBookingConfirmationEmail } = await import("@/lib/email/resend");
      sendBookingConfirmationEmail({
        siteName,
        siteLogo,
        booking: {
          id: updated.id,
          code: updated.code,
          guestName: updated.guestName,
          guestEmail: updated.guestEmail,
          guestPhone: updated.guestPhone,
          guestCity: updated.guestCity,
          companionType: updated.companionType,
          checkIn: updated.checkIn,
          checkOut: updated.checkOut,
          guestsCount: updated.guestsCount,
          totalPrice: updated.totalPrice,
          discountAmount: updated.discountAmount,
          promoCode: updated.promoCode,
          status: updated.status,
          paymentMethod: updated.paymentMethod,
          notes: updated.notes,
          createdAt: updated.createdAt,
          villa: {
            name: updated.villa.name,
            location: updated.villa.location,
            checkInTime: updated.villa.checkInTime,
            checkOutTime: updated.villa.checkOutTime,
          },
        },
      }).catch((e) => console.error("Background Resend email error on payment proof upload:", e));
    } catch (err) {
      console.warn("Could not trigger booking email on proof upload:", err);
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      booking: updated,
      message: "Bukti pembayaran berhasil diunggah! Tim Singgahsana akan segera memverifikasi pesanan Anda.",
    });
  } catch (error: any) {
    console.error("Payment proof upload error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengunggah bukti pembayaran" },
      { status: 500 }
    );
  }
}
