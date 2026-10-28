import { prisma } from "@/lib/prisma";

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  instructions?: string;
  isActive: boolean;
}

export const DEFAULT_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: "bca-default",
    bankName: "Bank BCA",
    accountNumber: "8001 2345 67",
    accountHolder: "PT Villa Hospitality",
    instructions: "Transfer sesuai nominal total tagihan hingga digit terakhir",
    isActive: true,
  },
  {
    id: "mandiri-default",
    bankName: "Bank Mandiri",
    accountNumber: "133 00 9876543 2",
    accountHolder: "PT Villa Hospitality",
    instructions: "Transfer sesuai nominal total tagihan hingga digit terakhir",
    isActive: true,
  },
];

export async function getPaymentTransferBanks(): Promise<BankAccount[]> {
  try {
    const config = await prisma.site_configs.findUnique({
      where: { key: "payment_transfer_banks" },
    });

    if (!config || !config.value) {
      return DEFAULT_BANK_ACCOUNTS;
    }

    const parsed = JSON.parse(config.value);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }

    return DEFAULT_BANK_ACCOUNTS;
  } catch (error) {
    console.error("Failed to parse payment_transfer_banks:", error);
    return DEFAULT_BANK_ACCOUNTS;
  }
}
