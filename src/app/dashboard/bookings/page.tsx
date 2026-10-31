import { connection } from "next/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ManagerBookingsClient } from "@/components/dashboard/bookings/manager-bookings-client";
import { requirePagePermission } from "@/lib/auth-guard";
import { normalizeMediaUrl } from "@/lib/media";
import { getSiteContactConfig } from "@/lib/site-config";

export const instant = false;

export default async function DashboardBookingsPage() {
  const user = await requirePagePermission("booking:read");
  if (user.role === "GUEST") {
    redirect("/dashboard");
  }

  // Fetch all bookings
  const bookings = await prisma.bookings.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      villa: {
        select: {
          id: true,
          name: true,
          slug: true,
          checkInTime: true,
          checkOutTime: true,
        },
      },
      addons: true,
    },
  });

  // Fetch villas for the direct booking dropdown with complete pricing configuration
  const villas = await prisma.villas.findMany({
    where: { status: "AVAILABLE" },
    select: {
      id: true,
      name: true,
      slug: true,
      pricePerNight: true,
      priceWeekend: true,
      dailyRates: true,
      customPrices: true,
      capacity: true,
    },
    orderBy: { name: "asc" },
  });

  const siteContact = await getSiteContactConfig();

  return (
    <ManagerBookingsClient
      siteName={siteContact.siteName}
      siteLogo={siteContact.siteLogo}
      contactPhone={siteContact.contactPhone1}
      contactEmail={siteContact.contactEmail}
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
        paymentProofUrl: b.paymentProofUrl ? normalizeMediaUrl(b.paymentProofUrl) : null,
        paymentProofUploadedAt: b.paymentProofUploadedAt
          ? b.paymentProofUploadedAt.toISOString()
          : null,
        settlementProofUrl: b.settlementProofUrl ? normalizeMediaUrl(b.settlementProofUrl) : null,
        settlementProofUploadedAt: b.settlementProofUploadedAt
          ? b.settlementProofUploadedAt.toISOString()
          : null,
        dpAmount: b.dpAmount || 0,
        notes: b.notes,
        rejectionReason: b.rejectionReason,
        createdAt: b.createdAt.toISOString(),
        addons: b.addons.map((a) => ({
          id: a.id,
          name: a.name,
          price: a.price,
          qty: a.qty,
          subtotal: a.subtotal,
          unit: a.unit,
        })),
        villa: {
          id: b.villa.id,
          name: b.villa.name,
          slug: b.villa.slug,
          checkInTime: b.villa.checkInTime,
          checkOutTime: b.villa.checkOutTime,
        },
      }))}
      villas={villas}
      userRole={user.role}
    />
  );
}
