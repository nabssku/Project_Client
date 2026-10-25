import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/auth-guard";
import { ReportsClient } from "@/components/dashboard/reports/reports-client";

export const instant = false;

export default async function DashboardReportsPage() {
  await connection();
  // Role & Granular RBAC Check: Pengguna harus memiliki izin "reports:view"
  const currentUser = await requirePagePermission("reports:view");

  // Ambil semua data reservasi dengan relasi villa
  const [bookings, villas, siteConfig] = await Promise.all([
    prisma.bookings.findMany({
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
    }),
    prisma.villas.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.site_configs.findUnique({
      where: { key: "site_name" },
    }),
  ]);

  const siteName = siteConfig?.value || "Singgahsana";

  // Serialisasi data untuk Client Component
  const serializedBookings = bookings.map((b) => ({
    id: b.id,
    code: b.code,
    guestName: b.guestName,
    guestEmail: b.guestEmail,
    guestPhone: b.guestPhone,
    guestCity: b.guestCity,
    checkIn: b.checkIn.toISOString(),
    checkOut: b.checkOut.toISOString(),
    guestsCount: b.guestsCount,
    totalPrice: b.totalPrice,
    discountAmount: b.discountAmount,
    promoCode: b.promoCode,
    status: b.status,
    paymentMethod: b.paymentMethod,
    createdAt: b.createdAt.toISOString(),
    villa: {
      id: b.villa.id,
      name: b.villa.name,
      slug: b.villa.slug,
    },
  }));

  return (
    <ReportsClient
      initialBookings={serializedBookings}
      villas={villas}
      siteName={siteName}
      currentUser={{
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
      }}
    />
  );
}
