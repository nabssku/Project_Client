import { requirePagePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { AboutCmsClient } from "@/components/dashboard/cms/about-cms-client";
import { ABOUT_CONFIG_KEYS, DEFAULT_ABOUT_CONFIGS } from "@/lib/about-config";

export const instant = false;

export default async function CmsAboutPage() {
  const user = await requirePagePermission("cms:read");

  let configsFromDb: Array<{ key: string; value: string }> = [];
  try {
    configsFromDb = await prisma.site_configs.findMany({
      where: { key: { in: ABOUT_CONFIG_KEYS } },
    });
  } catch (err: any) {
    console.warn("Notice: Using default configs due to slow DB connection:", err?.message || err);
  }

  const configMap: Record<string, string> = { ...DEFAULT_ABOUT_CONFIGS };
  configsFromDb.forEach((item) => {
    configMap[item.key] = item.value;
  });

  const canEdit = user.permissions.includes("cms:update");

  return <AboutCmsClient initialConfigs={configMap} canEdit={canEdit} />;
}
