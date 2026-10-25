import { requirePagePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { PromosClient } from "@/components/dashboard/cms/promos-client";

export const instant = false;

export default async function CmsPromosPage() {
  const user = await requirePagePermission("cms:read");

  const promoList = await prisma.promos.findMany({
    orderBy: { createdAt: "desc" },
  });

  const canEdit = user.permissions.includes("cms:update");

  return <PromosClient initialPromos={promoList} canEdit={canEdit} />;
}
