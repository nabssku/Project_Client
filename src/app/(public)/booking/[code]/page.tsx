import { notFound } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { BookingPaymentClient } from "@/components/public/booking-payment-client";
import { getPaymentTransferBanks } from "@/lib/payment-config";
import { normalizeMediaUrl } from "@/lib/media";

export const instant = false;

interface BookingCodePageProps {
  params: Promise<{ code: string }>;
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

  const bankAccounts = await getPaymentTransferBanks();

  let siteName = "Singgahsana";
  let siteLogo: string | null = null;
  try {
    const configs = await prisma.site_configs.findMany({
      where: { key: { in: ["site_name", "site_logo"] } },
    });
    configs.forEach((c) => {
      if (c.key === "site_name" && c.value) siteName = c.value;
      if (c.key === "site_logo" && c.value) siteLogo = c.value;
    });
  } catch (err) {
    console.warn("Failed to load site configs for booking payment page:", err);
  }

  return (
    <BookingPaymentClient
      siteName={siteName}
      siteLogo={siteLogo}
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
