import { ReportBookingItem, ReportExportSummary, ReportExportOptions, ActivityLogExportItem } from "./export-pdf";

function escapeCSV(field: any): string {
  if (field === null || field === undefined) {
    return '""';
  }
  const stringVal = String(field);
  if (stringVal.includes(",") || stringVal.includes('"') || stringVal.includes("\n") || stringVal.includes("\r")) {
    return `"${stringVal.replace(/"/g, '""')}"`;
  }
  return `"${stringVal}"`;
}

/**
 * Download file helper in browser
 */
function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Ekspor Laporan Reservasi & Finansial ke CSV
 */
export function exportReportsToCSV(
  bookings: ReportBookingItem[],
  summary: ReportExportSummary,
  options: ReportExportOptions
) {
  const rows: string[] = [];

  // UTF-8 BOM untuk kompatibilitas penuh dengan Microsoft Excel
  const BOM = "\uFEFF";

  // Header Metadata Dokumen
  rows.push(escapeCSV(`LAPORAN KEUANGAN & OPERASIONAL RESERVASI - ${options.siteName.toUpperCase()}`));
  rows.push(escapeCSV(`Periode: ${options.periodLabel}`));
  rows.push(escapeCSV(`Parameter Filter: Villa: ${options.filterVillaName || "Semua"} | Status: ${options.filterStatusLabel || "Semua"} | Metode: ${options.filterPaymentLabel || "Semua"}`));
  rows.push(escapeCSV(`Dicetak Oleh: ${options.printedBy.name} (${options.printedBy.role}) pada ${new Date().toLocaleString("id-ID")}`));
  rows.push(""); // Empty separator line

  // Ringkasan KPI
  rows.push(["RINGKASAN METRIK", "NILAI"].map(escapeCSV).join(","));
  rows.push(["Total Omzet Kas Masuk (Lunas + DP)", summary.totalNetRevenue].map(escapeCSV).join(","));
  if (summary.totalDpReceived && summary.totalDpReceived > 0) {
    rows.push(["Total DP 50% Diterima", summary.totalDpReceived].map(escapeCSV).join(","));
  }
  if (summary.totalPendingSettlement && summary.totalPendingSettlement > 0) {
    rows.push(["Total Sisa Piutang Pelunasan (H-1 Check-In)", summary.totalPendingSettlement].map(escapeCSV).join(","));
    rows.push(["Estimasi Total Kontrak Reservasi", summary.totalNetRevenue + summary.totalPendingSettlement].map(escapeCSV).join(","));
  }
  rows.push(["Total Omzet Kotor", summary.totalGrossRevenue].map(escapeCSV).join(","));
  rows.push(["Total Diskon Kupon Diberikan", summary.totalDiscount].map(escapeCSV).join(","));
  rows.push(["Total Transaksi Reservasi", summary.totalBookings].map(escapeCSV).join(","));
  rows.push(["Transaksi Sukses / Aktif", summary.completedBookings].map(escapeCSV).join(","));
  rows.push(["Total Malam Terjual", `${summary.totalNights} Malam`].map(escapeCSV).join(","));
  rows.push(["Rata-rata Nilai Transaksi (ADR)", summary.avgBookingValue].map(escapeCSV).join(","));
  rows.push(""); // Empty separator line

  // Kolom Tabel Rincian
  const headers = [
    "No",
    "Kode Booking",
    "Tanggal Pemesanan",
    "Nama Tamu",
    "Email Tamu",
    "Nomor HP",
    "Asal Kota",
    "Unit Villa",
    "Tanggal Check-In",
    "Tanggal Check-Out",
    "Durasi (Malam)",
    "Jumlah Tamu",
    "Harga Asli (IDR)",
    "Diskon Promo (IDR)",
    "Kode Promo",
    "Total Nilai Booking (IDR)",
    "DP Diterima (IDR)",
    "Sisa Pelunasan (IDR)",
    "Metode Pembayaran",
    "Status Reservasi",
  ];
  rows.push(headers.map(escapeCSV).join(","));

  // Baris Data
  bookings.forEach((b, idx) => {
    const nights = Math.max(
      1,
      Math.round(
        (new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );

    const isDp50 = b.status === "DP_50";
    const isPaidInFull =
      b.status === "CONFIRMED" ||
      b.status === "CHECKED_IN" ||
      b.status === "COMPLETED";

    const dpPaid = isDp50
      ? b.dpAmount || Math.round(b.totalPrice * 0.5)
      : isPaidInFull
      ? b.totalPrice
      : 0;

    const sisa = isDp50
      ? Math.max(0, b.totalPrice - dpPaid)
      : isPaidInFull
      ? 0
      : b.totalPrice;

    const row = [
      idx + 1,
      b.code,
      new Date(b.createdAt).toLocaleString("id-ID"),
      b.guestName,
      b.guestEmail,
      b.guestPhone,
      b.guestCity || "-",
      b.villa.name,
      new Date(b.checkIn).toLocaleDateString("id-ID"),
      new Date(b.checkOut).toLocaleDateString("id-ID"),
      nights,
      b.guestsCount,
      b.totalPrice + b.discountAmount,
      b.discountAmount,
      b.promoCode || "-",
      b.totalPrice,
      dpPaid,
      sisa,
      b.paymentMethod,
      b.status === "DP_50" ? "DP_50 (Menunggu Pelunasan H-1)" : b.status,
    ];
    rows.push(row.map(escapeCSV).join(","));
  });

  // Footer Total Baris
  const totalDpPaidAll = bookings.reduce((acc, b) => {
    if (b.status === "DP_50") {
      return acc + (b.dpAmount || Math.round(b.totalPrice * 0.5));
    }
    if (
      b.status === "CONFIRMED" ||
      b.status === "CHECKED_IN" ||
      b.status === "COMPLETED"
    ) {
      return acc + b.totalPrice;
    }
    return acc;
  }, 0);

  const totalSisaAll = bookings.reduce((acc, b) => {
    if (b.status === "DP_50") {
      const dp = b.dpAmount || Math.round(b.totalPrice * 0.5);
      return acc + Math.max(0, b.totalPrice - dp);
    }
    return acc;
  }, 0);

  const footerRow = [
    "TOTAL",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    summary.totalNights,
    "",
    summary.totalGrossRevenue,
    summary.totalDiscount,
    "",
    summary.totalNetRevenue + totalSisaAll,
    totalDpPaidAll,
    totalSisaAll,
    "",
    `${bookings.length} Reservasi`,
  ];
  rows.push(footerRow.map(escapeCSV).join(","));

  const csvContent = BOM + rows.join("\r\n");
  const filename = `laporan-reservasi-${options.siteName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
  downloadBlob(csvContent, filename, "text/csv;charset=utf-8;");
}

/**
 * Ekspor Log Audit Aktivitas ke CSV
 */
export function exportActivityLogsToCSV(
  logs: ActivityLogExportItem[],
  options: {
    siteName: string;
    periodLabel: string;
    filterEntityLabel?: string;
    filterActionLabel?: string;
    printedBy: {
      name: string;
      role: string;
    };
  }
) {
  const rows: string[] = [];
  const BOM = "\uFEFF";

  rows.push(escapeCSV(`LOG AUDIT & JEJAK MUTASI SISTEM - ${options.siteName.toUpperCase()}`));
  rows.push(escapeCSV(`Periode: ${options.periodLabel}`));
  rows.push(escapeCSV(`Filter: Modul: ${options.filterEntityLabel || "Semua"} | Aksi: ${options.filterActionLabel || "Semua"}`));
  rows.push(escapeCSV(`Dicetak Oleh: ${options.printedBy.name} (${options.printedBy.role}) pada ${new Date().toLocaleString("id-ID")}`));
  rows.push("");

  const headers = [
    "No",
    "Waktu Kejadian (WIB)",
    "Nama Staf / Aktor",
    "Email Staf",
    "Role Staf",
    "Aksi",
    "Modul / Entitas",
    "ID Entitas",
    "Rincian Aktivitas",
  ];
  rows.push(headers.map(escapeCSV).join(","));

  logs.forEach((log, idx) => {
    let cleanDetails = log.details || "-";
    if (cleanDetails.startsWith("{") && cleanDetails.endsWith("}")) {
      try {
        const parsed = JSON.parse(cleanDetails);
        cleanDetails = Object.entries(parsed)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
      } catch {
        // ignore
      }
    }

    const row = [
      idx + 1,
      new Date(log.createdAt).toLocaleString("id-ID"),
      log.user ? log.user.name : "Sistem / Otomatis",
      log.user ? log.user.email : "-",
      log.user ? log.user.role : "SYSTEM",
      log.action,
      log.entity,
      log.entityId || "-",
      cleanDetails,
    ];
    rows.push(row.map(escapeCSV).join(","));
  });

  const csvContent = BOM + rows.join("\r\n");
  const filename = `log-aktivitas-${options.siteName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
  downloadBlob(csvContent, filename, "text/csv;charset=utf-8;");
}
