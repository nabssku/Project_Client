import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendBookingConfirmationEmail } from "@/lib/email/resend";
import { getSiteContactConfig } from "@/lib/site-config";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    // Cari booking berdasarkan ID atau Kode Booking
    const booking = await prisma.bookings.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
      include: {
        villa: {
          select: {
            id: true,
            name: true,
            slug: true,
            location: true,
            checkInTime: true,
            checkOutTime: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Data booking tidak ditemukan" },
        { status: 404 }
      );
    }

    // Ambil konfigurasi kontak situs dari database
    const siteContact = await getSiteContactConfig();

    // Kirim email konfirmasi beserta PDF lampiran melalui Resend
    const result = await sendBookingConfirmationEmail({
      siteName: siteContact.siteName,
      siteLogo: siteContact.siteLogo,
      contactPhone: siteContact.contactPhone1,
      contactEmail: siteContact.contactEmail,
      booking: {
        id: booking.id,
        code: booking.code,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        guestPhone: booking.guestPhone,
        guestCity: booking.guestCity,
        companionType: booking.companionType,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guestsCount: booking.guestsCount,
        totalPrice: booking.totalPrice,
        discountAmount: booking.discountAmount,
        promoCode: booking.promoCode,
        status: booking.status,
        paymentMethod: booking.paymentMethod,
        notes: booking.notes,
        createdAt: booking.createdAt,
        villa: {
          name: booking.villa.name,
          location: booking.villa.location,
          checkInTime: booking.villa.checkInTime,
          checkOutTime: booking.villa.checkOutTime,
        },
      },
    });

    // Catat log mutasi aktivitas
    if (result.success) {
      await prisma.activity_logs.create({
        data: {
          userId: session?.user?.id || null,
          action: "SEND_BOOKING_EMAIL",
          entity: "bookings",
          entityId: booking.code,
          details: `Mengirim email konfirmasi & voucher PDF ke ${booking.guestEmail} untuk reservasi ${booking.code}`,
        },
      });
    }

    return NextResponse.json({
      success: result.success,
      message: result.message,
      simulated: result.simulated,
    });
  } catch (error: any) {
    console.error("POST booking email error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memproses pengiriman email" },
      { status: 500 }
    );
  }
}
