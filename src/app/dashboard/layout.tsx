import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { DashboardLayoutClient } from "@/components/dashboard/dashboard-layout-client";
import { getUserPermissions } from "@/lib/rbac";

export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Live DB check to verify user is active and load current permissions
  const dbUser = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      isActive: true,
      permissions: true,
    },
  });

  if (!dbUser || !dbUser.isActive) {
    redirect("/login?error=deactivated");
  }

  const effectivePermissions = getUserPermissions(dbUser);

  let siteName = "Singgahsana";
  try {
    const config = await prisma.site_configs.findUnique({
      where: { key: "site_name" },
    });
    if (config?.value) {
      siteName = config.value;
    }
  } catch (err) {
    console.error("Failed to load site_name in dashboard:", err);
  }

  return (
    <DashboardLayoutClient
      user={{
        name: dbUser.name,
        role: dbUser.role,
        avatar: dbUser.avatar,
        permissions: effectivePermissions,
      }}
      siteName={siteName}
    >
      {children}
    </DashboardLayoutClient>
  );
}
