import { prisma } from "@/lib/prisma";
import { VillaListClient } from "@/components/dashboard/villas/villa-list-client";
import { requirePagePermission } from "@/lib/auth-guard";

export const instant = false;

export const metadata = {
  title: "Manajemen Unit Villa - Dashboard",
  description: "Kelola unit villa, harga, kesiapan operasional, dan galeri foto Cloudflare R2",
};

export default async function VillasDashboardPage() {
  const user = await requirePagePermission("villa:read");

  const villas = await prisma.villas.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          bookings: true,
          maintenanceTasks: true,
        },
      },
    },
  });

  return (
    <VillaListClient
      initialVillas={JSON.parse(JSON.stringify(villas))}
      userRole={user.role}
    />
  );
}
