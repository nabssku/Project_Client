import { notFound } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { BookingPaymentClient } from "@/components/public/booking-payment-client";
import { getPaymentTransferBanks } from "@/lib/payment-config";

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
    },
  });

  if (!booking || !booking.villa) {
    notFound();
  }

  const bankAccounts = await getPaymentTransferBanks();

  return (
    <BookingPaymentClient
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
        paymentProofUrl: booking.paymentProofUrl,
        paymentProofUploadedAt: booking.paymentProofUploadedAt
          ? booking.paymentProofUploadedAt.toISOString()
          : null,
        notes: booking.notes,
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
