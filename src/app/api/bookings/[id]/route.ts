import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { getSiteContactConfig } from "@/lib/site-config";

const updateBookingStatusSchema = z.object({
  status: z.enum(["PENDING", "DP", "DP_50", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED"]).optional(),
  notes: z.string().optional().nullable(),
  adminNotes: z.string().optional().nullable(),
  invoiceNotes: z.string().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
  settlementProofUrl: z.string().optional().nullable(),
  dpAmount: z.coerce.number().min(0).optional(),
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
        addons: true,
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

    const { status: requestedStatus, notes, adminNotes, invoiceNotes, rejectionReason } = parsed.data;

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
    const newStatus = requestedStatus ?? booking.status;
    const statusChanged = requestedStatus !== undefined && requestedStatus !== oldStatus;

    // Update booking
    const updated = await prisma.$transaction(async (tx) => {
      const updateData: any = {};

      if (requestedStatus !== undefined) {
        updateData.status = newStatus;
      }

      if (notes !== undefined) {
        updateData.notes = notes?.trim() || null;
      }

      if (adminNotes !== undefined) {
        updateData.adminNotes = adminNotes?.trim() || null;
      }

      if (invoiceNotes !== undefined) {
        updateData.invoiceNotes = invoiceNotes?.trim() || null;
      }

      if (parsed.data.settlementProofUrl) {
        updateData.settlementProofUrl = parsed.data.settlementProofUrl;
        updateData.settlementProofUploadedAt = new Date();
      }

      if (requestedStatus === "CANCELLED") {
        updateData.rejectionReason =
          rejectionReason?.trim() ||
          adminNotes?.trim() ||
          booking.rejectionReason ||
          "Bukti transfer atau reservasi ditolak oleh manajer.";
      } else if (requestedStatus === "CONFIRMED") {
        // Clear rejection reason once confirmed
        updateData.rejectionReason = null;
      } else if (requestedStatus === "DP" || requestedStatus === "DP_50") {
        updateData.rejectionReason = null;
        if (parsed.data.dpAmount !== undefined && parsed.data.dpAmount !== null && parsed.data.dpAmount > 0) {
          updateData.dpAmount = Math.min(booking.totalPrice, Math.round(parsed.data.dpAmount));
        } else if (!booking.dpAmount || booking.dpAmount <= 0) {
          updateData.dpAmount = Math.round(booking.totalPrice * 0.5);
        }
      }

      const updatedBooking = await tx.bookings.update({
        where: { id: booking.id },
        data: updateData,
        include: {
          villa: true,
          addons: true,
        },
      });

      // Record activity log
      await tx.activity_logs.create({
        data: {
          userId: session.user.id,
          action: requestedStatus !== undefined ? "UPDATE_STATUS" : "UPDATE_BOOKING_NOTES",
          entity: "Booking",
          entityId: booking.id,
          details: JSON.stringify({
            bookingCode: booking.code,
            guestName: booking.guestName,
            oldStatus,
            newStatus,
            adminNotes,
            invoiceNotes,
            rejectionReason: updateData.rejectionReason,
            updatedBy: session.user.name || session.user.email,
          }),
        },
      });

      return updatedBooking;
    });

    // Jika status diubah menjadi CONFIRMED atau DP, kirimkan email voucher resmi kepada tamu
    if (
      requestedStatus !== undefined &&
      (newStatus === "CONFIRMED" || newStatus === "DP" || newStatus === "DP_50") &&
      (statusChanged || parsed.data.dpAmount !== undefined)
    ) {
      try {
        const siteContact = await getSiteContactConfig();
        const { sendBookingConfirmationEmail } = await import("@/lib/email/resend");
        sendBookingConfirmationEmail({
          siteName: siteContact.siteName,
          siteLogo: siteContact.siteLogo,
          contactPhone: siteContact.contactPhone1,
          contactEmail: siteContact.contactEmail,
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
            paymentProofUrl: updated.paymentProofUrl,
            settlementProofUrl: updated.settlementProofUrl,
            settlementProofUploadedAt: updated.settlementProofUploadedAt,
            dpAmount: updated.dpAmount,
            notes: updated.notes,
            invoiceNotes: updated.invoiceNotes,
            createdAt: updated.createdAt,
            addons: updated.addons?.map((a) => ({
              name: a.name,
              price: a.price,
              qty: a.qty,
              subtotal: a.subtotal,
              unit: a.unit,
            })),
            villa: {
              name: updated.villa.name,
              location: updated.villa.location,
              checkInTime: updated.villa.checkInTime,
              checkOutTime: updated.villa.checkOutTime,
            },
          },
        }).catch((e) => console.error("Background Resend email error on booking confirm:", e));
      } catch (err) {
        console.warn("Could not trigger booking confirmation email on PUT:", err);
      }
    }

    return NextResponse.json({
      success: true,
      booking: updated,
      message: requestedStatus !== undefined
        ? `Status pesanan berhasil diubah menjadi ${newStatus}`
        : "Catatan pesanan berhasil diperbarui",
    });
  } catch (error: any) {
    console.error("PUT booking error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui status pesanan" },
      { status: 500 }
    );
  }
}
