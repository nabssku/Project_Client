import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  getPaymentTransferBanks,
  type BankAccount,
  DEFAULT_BANK_ACCOUNTS,
} from "@/lib/payment-config";

export async function GET() {
  try {
    const banks = await getPaymentTransferBanks();
    return NextResponse.json({
      success: true,
      banks,
    });
  } catch (error: any) {
    console.error("GET payment config error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data rekening transfer" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isStaff = ["ADMIN", "MANAJER"].includes(session.user.role);
    if (!isStaff) {
      return NextResponse.json(
        { error: "Forbidden: Hanya Admin atau Manajer yang dapat mengatur nomor rekening" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { banks } = body;

    if (!Array.isArray(banks) || banks.length === 0) {
      return NextResponse.json(
        { error: "Minimal harus ada satu rekening bank yang dikonfigurasi" },
        { status: 400 }
      );
    }

    // Validate each bank
    const sanitizedBanks: BankAccount[] = banks.map((b, index) => {
      const bankName = String(b.bankName || "").trim();
      const accountNumber = String(b.accountNumber || "").trim();
      const accountHolder = String(b.accountHolder || "").trim();

      if (!bankName || !accountNumber || !accountHolder) {
        throw new Error(
          `Rekening baris ${index + 1}: Nama bank, nomor rekening, dan atas nama wajib diisi.`
        );
      }

      return {
        id: b.id || `bank-${Date.now()}-${index}`,
        bankName,
        accountNumber,
        accountHolder,
        instructions: b.instructions ? String(b.instructions).trim() : undefined,
        isActive: b.isActive !== false,
      };
    });

    // Save to site_configs
    const updated = await prisma.site_configs.upsert({
      where: { key: "payment_transfer_banks" },
      update: {
        value: JSON.stringify(sanitizedBanks),
        type: "json",
      },
      create: {
        key: "payment_transfer_banks",
        value: JSON.stringify(sanitizedBanks),
        type: "json",
      },
    });

    // Record activity log
    try {
      await prisma.activity_logs.create({
        data: {
          userId: session.user.id,
          action: "UPDATE_CONFIG",
          entity: "site_configs",
          entityId: updated.id,
          details: JSON.stringify({
            key: "payment_transfer_banks",
            totalAccounts: sanitizedBanks.length,
            accounts: sanitizedBanks.map((b) => `${b.bankName} - ${b.accountNumber} (${b.accountHolder})`),
            updatedBy: session.user.name || session.user.email,
          }),
        },
      });
    } catch (logErr) {
      console.warn("Failed to record activity log for payment config:", logErr);
    }

    // Revalidate paths
    try {
      revalidatePath("/booking");
      revalidatePath("/booking/[code]", "page");
      revalidatePath("/dashboard/settings");
      revalidatePath("/dashboard/bookings");
    } catch (e) {
      // ignore
    }

    return NextResponse.json({
      success: true,
      banks: sanitizedBanks,
      message: "Nomor rekening pembayaran berhasil diperbarui!",
    });
  } catch (error: any) {
    console.error("PUT payment config error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui rekening pembayaran" },
      { status: 500 }
    );
  }
}
