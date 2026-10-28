import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/auth-guard";
import { ActivityLogClient } from "@/components/dashboard/activity/activity-log-client";

export const instant = false;

export default async function DashboardActivityPage() {
  await connection();
  // Role & Granular RBAC Check: Pengguna harus memiliki izin "activity:view"
  const currentUser = await requirePagePermission("activity:view");

  // Query audit activity logs dan user/staf
  const [logs, staffUsers, siteConfig] = await Promise.all([
    prisma.activity_logs.findMany({
      take: 500, // Ambil hingga 500 riwayat log terbaru untuk performa cepat dan komprehensif
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
      },
    }),
    prisma.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.site_configs.findUnique({
      where: { key: "site_name" },
    }),
  ]);

  const siteName = siteConfig?.value || "Villa";

  // Serialisasi data untuk Client Component
  const serializedLogs = logs.map((log) => ({
    id: log.id,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    details: log.details,
    createdAt: log.createdAt.toISOString(),
    user: log.user
      ? {
          id: log.user.id,
          name: log.user.name,
          email: log.user.email,
          role: log.user.role,
          avatar: log.user.avatar,
        }
      : null,
  }));

  return (
    <ActivityLogClient
      initialLogs={serializedLogs}
      staffUsers={staffUsers}
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
