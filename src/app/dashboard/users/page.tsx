import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/auth-guard";
import { UsersManagementClient } from "@/components/dashboard/users/users-management-client";

export const instant = false;

export const metadata = {
  title: "Manajemen Pengguna & Tim - Dashboard",
  description: "Kelola akun staf, tamu, status aktivasi akun, dan granular izin fitur (RBAC)",
};

export default async function DashboardUsersPage() {
  const currentUser = await requirePagePermission("user:read");

  const usersList = await prisma.users.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      isActive: true,
      permissions: true,
      createdAt: true,
      _count: {
        select: {
          bookings: true,
          maintenanceTasks: true,
        },
      },
    },
  });

  return (
    <UsersManagementClient
      initialUsers={JSON.parse(JSON.stringify(usersList))}
      currentUser={{
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        permissions: currentUser.permissions,
      }}
    />
  );
}
