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
    console.error("Failed to load site configs in dashboard:", err);
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
      siteLogo={siteLogo}
    >
      {children}
    </DashboardLayoutClient>
  );
}
