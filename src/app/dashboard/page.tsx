import { auth } from "@/lib/auth";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import { ShieldAlert } from "lucide-react";
import { AdminDashboard } from "@/components/dashboard/roles/admin-dashboard";
import { ManajerDashboard } from "@/components/dashboard/roles/manajer-dashboard";
import { MaintenanceDashboard } from "@/components/dashboard/roles/maintenance-dashboard";
import { MarketingDashboard } from "@/components/dashboard/roles/marketing-dashboard";
import { GuestDashboard } from "@/components/dashboard/roles/guest-dashboard";

export const instant = false;

interface DashboardPageProps {
  searchParams?: Promise<{ denied?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  await connection();
  const session = await auth();
  if (!session?.user) return null;

  const params = searchParams ? await searchParams : {};
  const hasDeniedNotice = Boolean(params.denied);

  const role = (session.user.role as Role) || "MANAJER";
  let dashboardView: React.ReactNode = null;

  // Data fetching optimized per role
  if (role === "ADMIN") {
    const [
      villaCount,
      bookingCount,
      userCount,
      pendingBookings,
      revenueResult,
      recentBookings,
      recentLogs,
      usersList,
    ] = await Promise.all([
      prisma.villas.count(),
      prisma.bookings.count(),
      prisma.users.count(),
      prisma.bookings.count({ where: { status: "PENDING" } }),
      prisma.bookings.aggregate({
        where: {
          status: { in: ["CONFIRMED", "CHECKED_IN", "COMPLETED"] },
        },
        _sum: { totalPrice: true },
      }),
      prisma.bookings.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { villa: { select: { name: true } } },
      }),
      prisma.activity_logs.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, role: true } } },
      }),
      prisma.users.findMany({
        select: { id: true, name: true, email: true, role: true, isActive: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const adminData = {
      villaCount,
      bookingCount,
      userCount,
      pendingBookings,
      totalRevenue: revenueResult._sum.totalPrice || 0,
      recentBookings,
      recentLogs,
      usersList,
    };

    dashboardView = <AdminDashboard user={session.user} data={adminData} />;
  } else if (role === "MAINTENANCE") {
    const [
      activeTasksCount,
      cleaningCount,
      maintenanceCount,
      availableCount,
      tasksList,
      villasList,
    ] = await Promise.all([
      prisma.maintenance_tasks.count({ where: { isCompleted: false } }),
      prisma.villas.count({ where: { status: "CLEANING" } }),
      prisma.villas.count({ where: { status: "MAINTENANCE" } }),
      prisma.villas.count({ where: { status: "AVAILABLE" } }),
      prisma.maintenance_tasks.findMany({
        orderBy: [{ isCompleted: "asc" }, { dueDate: "asc" }],
        include: {
          villa: { select: { id: true, name: true, status: true } },
          assignedTo: { select: { name: true } },
        },
      }),
      prisma.villas.findMany({
        select: { id: true, name: true, status: true, location: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const maintenanceData = {
      activeTasksCount,
      cleaningCount,
      maintenanceCount,
      availableCount,
      tasksList,
      villasList,
    };

    dashboardView = <MaintenanceDashboard user={session.user} data={maintenanceData} />;
  } else if (role === "MARKETING") {
    const [
      activePromosCount,
      featuredVillasCount,
      testimonialsCount,
      ratingAggregate,
      promosList,
      testimonialsList,
    ] = await Promise.all([
      prisma.promos.count({ where: { isActive: true } }),
      prisma.villas.count({ where: { isFeatured: true } }),
      prisma.testimonials.count(),
      prisma.testimonials.aggregate({
        _avg: { rating: true },
      }),
      prisma.promos.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.testimonials.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const marketingData = {
      activePromosCount,
      featuredVillasCount,
      testimonialsCount,
      averageRating: ratingAggregate._avg.rating || 5.0,
      promosList,
      testimonialsList,
    };

    dashboardView = <MarketingDashboard user={session.user} data={marketingData} />;
  } else if (role === "GUEST") {
    // Data fetching for Guest customer portal
    const [guestBookings, dbUser, siteConfigs] = await Promise.all([
      prisma.bookings.findMany({
        where: {
          OR: [
            { userId: session.user.id },
            { guestEmail: { equals: session.user.email?.toLowerCase(), mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
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
              pricePerNight: true,
            },
          },
          addons: true,
        },
      }),
      prisma.users.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          avatar: true,
        },
      }),
      prisma.site_configs.findMany({
        where: {
          key: {
            in: ["site_name", "site_logo", "contact_phone_1", "contact_phone_2"],
          },
        },
      }),
    ]);

    let siteName = "Villa";
    let siteLogo: string | null = null;
    let contactPhone = "628111141888";

    siteConfigs.forEach((c) => {
      if (c.key === "site_name" && c.value) siteName = c.value;
      if (c.key === "site_logo" && c.value) siteLogo = c.value;
      if (c.key === "contact_phone_1" && c.value) contactPhone = c.value;
    });

    const guestData = {
      bookings: JSON.parse(JSON.stringify(guestBookings)),
      user: dbUser,
      siteName,
      siteLogo,
      contactPhone,
    };

    dashboardView = (
      <GuestDashboard
        currentUser={{
          id: session.user.id || "",
          name: session.user.name || "Tamu",
          email: session.user.email || "",
        }}
        data={guestData}
      />
    );
  } else {
    // Default to MANAJER
  const [
    pendingBookingsCount,
    confirmedBookingsCount,
    availableVillasCount,
    cleaningVillasCount,
    pendingBookingsList,
    upcomingCheckIns,
    villasStatus,
  ] = await Promise.all([
    prisma.bookings.count({ where: { status: "PENDING" } }),
    prisma.bookings.count({ where: { status: "CONFIRMED" } }),
    prisma.villas.count({ where: { status: "AVAILABLE" } }),
    prisma.villas.count({ where: { status: "CLEANING" } }),
    prisma.bookings.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: { villa: { select: { name: true } } },
    }),
    prisma.bookings.findMany({
      where: { status: "CONFIRMED" },
      orderBy: { checkIn: "asc" },
      take: 5,
      include: {
        villa: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
    }),
    prisma.villas.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        capacity: true,
        bedrooms: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const manajerData = {
    pendingBookingsCount,
    confirmedBookingsCount,
    availableVillasCount,
    cleaningVillasCount,
    pendingBookingsList,
    upcomingCheckIns,
    villasStatus,
  };

    dashboardView = <ManajerDashboard user={session.user} data={manajerData} />;
  }

  return (
    <div className="space-y-6">
      {hasDeniedNotice && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-amber-900 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold">Akses Terbatas</p>
            <p className="text-amber-800/80 mt-0.5">
              Akun Anda tidak memiliki izin untuk mengakses halaman atau fitur tersebut. Hubungi administrator jika Anda memerlukan akses tambahan.
            </p>
          </div>
        </div>
      )}
      {dashboardView}
    </div>
  );
}
