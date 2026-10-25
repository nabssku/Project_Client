import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { ManagerBookingsClient } from "@/components/dashboard/bookings/manager-bookings-client";
import { requirePagePermission } from "@/lib/auth-guard";

export const instant = false;

export default async function DashboardBookingsPage() {
  const user = await requirePagePermission("booking:read");

  // Fetch all bookings
  const bookings = await prisma.bookings.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      villa: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  // Fetch villas for the direct booking dropdown
  const villas = await prisma.villas.findMany({
    where: { status: "AVAILABLE" },
    select: {
      id: true,
      name: true,
      slug: true,
      pricePerNight: true,
      priceWeekend: true,
      capacity: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <ManagerBookingsClient
      initialBookings={bookings.map((b) => ({
        id: b.id,
        code: b.code,
        guestName: b.guestName,
        guestEmail: b.guestEmail,
        guestPhone: b.guestPhone,
        guestCity: b.guestCity,
        companionType: b.companionType,
        checkIn: b.checkIn.toISOString(),
        checkOut: b.checkOut.toISOString(),
        guestsCount: b.guestsCount,
        totalPrice: b.totalPrice,
        discountAmount: b.discountAmount,
        promoCode: b.promoCode,
        status: b.status as any,
        paymentMethod: b.paymentMethod,
        paymentProofUrl: b.paymentProofUrl,
        paymentProofUploadedAt: b.paymentProofUploadedAt
          ? b.paymentProofUploadedAt.toISOString()
          : null,
        notes: b.notes,
        createdAt: b.createdAt.toISOString(),
        villa: {
          id: b.villa.id,
          name: b.villa.name,
          slug: b.villa.slug,
        },
      }))}
      villas={villas}
      userRole={user.role}
    />
  );
}
