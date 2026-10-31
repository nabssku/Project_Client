import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { BookingPaymentClient } from "@/components/public/booking-payment-client";
import { getPaymentTransferBanks } from "@/lib/payment-config";
import { normalizeMediaUrl } from "@/lib/media";
import { isBookingExpired } from "@/lib/booking-expiration";
import { getSiteContactConfig } from "@/lib/site-config";
import { buildSmoMetadata } from "@/lib/smo";

export const instant = false;

interface BookingCodePageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({
  params,
}: BookingCodePageProps): Promise<Metadata> {
  const { code } = await params;
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
          name: true,
          location: true,
          images: true,
        },
      },
    },
  });

  if (!booking || !booking.villa) {
    return {
      title: "Detail Reservasi",
      robots: { index: false, follow: false },
    };
  }

  const siteConfig = await prisma.site_configs.findFirst({
    where: { key: "site_name" },
  });
  const siteName = siteConfig?.value || "villaqoe";
  const firstImage = booking.villa.images?.[0] || "/Villaqoe.png";

  return buildSmoMetadata({
    title: `Reservasi ${booking.villa.name} (${booking.code}) | ${siteName}`,
    description: `Detail reservasi villa ${booking.villa.name} di ${booking.villa.location} untuk ${booking.guestName}. Periksa tagihan dan informasi check-in.`,
    urlPath: `/booking/${booking.code}`,
    image: firstImage,
    imageAlt: `Reservasi ${booking.villa.name}`,
    siteName,
    noIndex: true,
  });
}

export default async function BookingCodePage({ params }: BookingCodePageProps) {
  await connection();
  const { code } = await params;

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
        },
      },
      testimonial: true,
      addons: true,
    },
  });

  if (!booking || !booking.villa) {
    notFound();
  }

  // Auto-cancel if booking is still PENDING and check-in deadline has passed
  if (
    booking.status === "PENDING" &&
    isBookingExpired(booking.checkIn, booking.villa.checkInTime)
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
    } catch (updateErr) {
      console.error("Failed to auto-cancel expired booking:", updateErr);
    }
  }

  const bankAccounts = await getPaymentTransferBanks();
  const siteContact = await getSiteContactConfig();

  return (
    <BookingPaymentClient
      siteName={siteContact.siteName}
      siteLogo={siteContact.siteLogo}
      contactPhone={siteContact.contactPhone1}
      contactEmail={siteContact.contactEmail}
      initialBooking={{
        id: booking.id,
        code: booking.code,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        guestPhone: booking.guestPhone,
        guestCity: booking.guestCity,
        companionType: booking.companionType,
        checkIn: booking.checkIn.toISOString(),
        checkOut: booking.checkOut.toISOString(),
        guestsCount: booking.guestsCount,
        totalPrice: booking.totalPrice,
        discountAmount: booking.discountAmount,
        promoCode: booking.promoCode,
        status: booking.status as any,
        paymentMethod: booking.paymentMethod,
        paymentProofUrl: booking.paymentProofUrl
          ? normalizeMediaUrl(booking.paymentProofUrl)
          : null,
        paymentProofUploadedAt: booking.paymentProofUploadedAt
          ? booking.paymentProofUploadedAt.toISOString()
          : null,
        notes: booking.notes,
        rejectionReason: booking.rejectionReason,
        createdAt: booking.createdAt.toISOString(),
        villa: {
          id: booking.villa.id,
          name: booking.villa.name,
          slug: booking.villa.slug,
          location: booking.villa.location,
          images: booking.villa.images,
          checkInTime: booking.villa.checkInTime,
          checkOutTime: booking.villa.checkOutTime,
        },
        addons: booking.addons.map((a) => ({
          id: a.id,
          name: a.name,
          price: a.price,
          qty: a.qty,
          subtotal: a.subtotal,
          unit: a.unit,
        })),
        testimonial: booking.testimonial
          ? {
              id: booking.testimonial.id,
              rating: booking.testimonial.rating,
              cleanlinessRating: booking.testimonial.cleanlinessRating,
              serviceRating: booking.testimonial.serviceRating,
              facilityRating: booking.testimonial.facilityRating,
              content: booking.testimonial.content,
              createdAt: booking.testimonial.createdAt.toISOString(),
            }
          : null,
      }}
      bankAccounts={bankAccounts}
    />
  );
}
