import { prisma } from "@/lib/prisma";
import { SettingsClient } from "@/components/dashboard/settings/settings-client";
import { getPaymentTransferBanks } from "@/lib/payment-config";
import { requirePagePermission } from "@/lib/auth-guard";

export const instant = false;

export default async function DashboardSettingsPage() {
  const user = await requirePagePermission("settings:read");

  // Load configured banks
  const banks = await getPaymentTransferBanks();

  // Load general site_configs
  const configsList = await prisma.site_configs.findMany();
  const configsMap: Record<string, string> = {};
  configsList.forEach((c) => {
    configsMap[c.key] = c.value;
  });

  return (
    <SettingsClient
      initialBanks={banks}
      initialConfigs={configsMap}
      userRole={user.role}
    />
  );
}
