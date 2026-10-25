import { requirePagePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { PopupsClient } from "@/components/dashboard/cms/popups-client";

export const instant = false;

export default async function CmsPopupsPage() {
  const user = await requirePagePermission("cms:read");

  const popups = await prisma.popups.findMany({
    orderBy: { createdAt: "desc" },
  });

  const canEdit = user.permissions.includes("cms:update");

  return <PopupsClient initialPopups={popups} canEdit={canEdit} />;
}
