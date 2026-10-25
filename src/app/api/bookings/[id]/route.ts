import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateBookingStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED"]),
  notes: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    // Find by ID or by Code
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
            images: true,
            checkInTime: true,
            checkOutTime: true,
            rules: true,
            mapEmbed: true,
            capacity: true,
            pricePerNight: true,
            priceWeekend: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 });
    }

    // Authorization check:
    // 1. ADMIN and MANAJER have full access.
    // 2. GUEST user can only access if they own it (userId or guestEmail).
    // 3. Unauthenticated access is allowed ONLY when querying by public booking code (e.g. from /booking/[code]).
    if (session?.user) {
      const isManagerOrAdmin = ["ADMIN", "MANAJER"].includes(session.user.role);
      const isOwner =
        booking.userId === session.user.id ||
        booking.guestEmail?.toLowerCase() === session.user.email?.toLowerCase();

      if (!isManagerOrAdmin && !isOwner && id !== booking.code) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      booking,
    });
  } catch (error: any) {
    console.error("GET booking error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data booking" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isStaff = ["ADMIN", "MANAJER"].includes(session.user.role);
    if (!isStaff) {
      return NextResponse.json(
        { error: "Forbidden: Hanya Admin atau Manajer yang dapat mengubah status pesanan" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateBookingStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    const { status: newStatus, notes } = parsed.data;

    // Find existing booking
    const booking = await prisma.bookings.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 });
    }

    const oldStatus = booking.status;

    // Update booking status
    const updated = await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.bookings.update({
        where: { id: booking.id },
        data: {
          status: newStatus,
          notes: notes ? `${booking.notes ? booking.notes + "\n" : ""}[Catatan Admin]: ${notes}` : booking.notes,
        },
        include: {
          villa: true,
        },
      });

      // Record activity log
      await tx.activity_logs.create({
        data: {
          userId: session.user.id,
          action: "UPDATE_STATUS",
          entity: "Booking",
          entityId: booking.id,
          details: JSON.stringify({
            bookingCode: booking.code,
            guestName: booking.guestName,
            oldStatus,
            newStatus,
            notes,
            updatedBy: session.user.name || session.user.email,
          }),
        },
      });

      return updatedBooking;
    });

    // Jika status diubah menjadi CONFIRMED, kirimkan email voucher resmi kepada tamu
    if (newStatus === "CONFIRMED") {
      try {
        const siteConfig = await prisma.site_configs.findUnique({
          where: { key: "site_name" },
        });
        const siteName = siteConfig?.value || "Singgahsana";

        const { sendBookingConfirmationEmail } = await import("@/lib/email/resend");
        sendBookingConfirmationEmail({
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
          siteName,
        }).catch((e) => console.error("Background Resend email error on booking confirm:", e));
      } catch (err) {
        console.warn("Could not trigger booking confirmation email on PUT:", err);
      }
    }

    return NextResponse.json({
      success: true,
      booking: updated,
      message: `Status pesanan berhasil diubah menjadi ${newStatus}`,
    });
  } catch (error: any) {
    console.error("PUT booking error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui status pesanan" },
      { status: 500 }
    );
  }
}
