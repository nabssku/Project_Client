import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatPrice, formatDate } from "@/lib/utils";
import { resolveImageToDataUri } from "@/lib/booking-pdf";

export interface ReportBookingItem {
  id: string;
  code: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestCity?: string | null;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  totalPrice: number;
  discountAmount: number;
  promoCode?: string | null;
  status: string;
  paymentMethod: string;
  createdAt: string;
  villa: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface ReportExportSummary {
  totalGrossRevenue: number;
  totalDiscount: number;
  totalNetRevenue: number;
  totalBookings: number;
  completedBookings: number;
  totalNights: number;
  avgBookingValue: number;
}

export interface ReportExportOptions {
  siteName: string;
  siteLogo?: string | null;
  periodLabel: string;
  filterVillaName?: string;
  filterStatusLabel?: string;
  filterPaymentLabel?: string;
  printedBy: {
    name: string;
    role: string;
  };
}

/**
 * Ekspor Laporan Reservasi & Finansial ke PDF Format Resmi
 */
export async function exportReportsToPDF(
  bookings: ReportBookingItem[],
  summary: ReportExportSummary,
  options: ReportExportOptions
) {
  // A4 Landscape untuk memuat tabel transaksi dengan rapi
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const primaryColor = [26, 26, 46]; // #1a1a2e
  const accentColor = [200, 164, 78]; // #C8A44E

  // --- Header Dokumen ---
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 28, "F");

  let hasLogo = false;
  let textStartX = 14;
  if (options.siteLogo) {
    try {
      const logoUri = await resolveImageToDataUri(options.siteLogo);
      if (logoUri) {
        let format = "PNG";
        if (logoUri.includes("image/jpeg") || logoUri.includes("image/jpg")) format = "JPEG";
        else if (logoUri.includes("image/webp")) format = "WEBP";
        doc.addImage(logoUri, format, 14, 4, 20, 20);
        hasLogo = true;
        textStartX = 38;
      }
    } catch {
      hasLogo = false;
      textStartX = 14;
    }
  }

  // Nama Bisnis / Logo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(hasLogo ? 16 : 18);
  doc.setTextColor(255, 255, 255);
  doc.text(options.siteName.toUpperCase(), textStartX, 13);

  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(".", textStartX + doc.getTextWidth(options.siteName.toUpperCase()), 13);

  // Judul Dokumen
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text("LAPORAN KEUANGAN & OPERASIONAL RESERVASI", textStartX, 21);

  // Info Cetak di Kanan Atas
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  const now = new Date();
  const printedDateStr = `${now.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })} ${now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
  doc.text(`Waktu Cetak: ${printedDateStr} WIB`, pageWidth - 14, 12, { align: "right" });
  doc.text(`Dicetak Oleh: ${options.printedBy.name} (${options.printedBy.role})`, pageWidth - 14, 18, { align: "right" });

  // --- Sub-Header: Filter & Periode ---
  let yPos = 34;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text("PARAMETER LAPORAN:", 14, yPos);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  const filterDesc = [
    `Periode: ${options.periodLabel}`,
    `Villa: ${options.filterVillaName || "Semua Villa"}`,
    `Status: ${options.filterStatusLabel || "Semua Status"}`,
    `Metode Bayar: ${options.filterPaymentLabel || "Semua Metode"}`,
  ].join("   |   ");
  doc.text(filterDesc, 55, yPos);

  // --- Kotak Ringkasan KPI Finansial ---
  yPos = 39;
  const kpiBoxWidth = (pageWidth - 28 - 15) / 4;
  const kpis = [
    { label: "OMZET BERSIH", val: formatPrice(summary.totalNetRevenue), note: "Confirmed / Selesai" },
    { label: "TOTAL RESERVASI", val: `${summary.totalBookings} Transaksi`, note: `${summary.completedBookings} Sukses` },
    { label: "TOTAL DISKON", val: formatPrice(summary.totalDiscount), note: "Kupon Promo" },
    { label: "RATA-RATA TRANSAKSI", val: formatPrice(summary.avgBookingValue), note: `${summary.totalNights} Malam Terjual` },
  ];

  kpis.forEach((kpi, idx) => {
    const xBox = 14 + idx * (kpiBoxWidth + 5);
    // Background kotak
    doc.setFillColor(246, 246, 248);
    doc.roundedRect(xBox, yPos, kpiBoxWidth, 16, 2, 2, "F");
    doc.setDrawColor(225, 225, 230);
    doc.roundedRect(xBox, yPos, kpiBoxWidth, 16, 2, 2, "S");

    // Label KPI
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(120, 120, 130);
    doc.text(kpi.label, xBox + 4, yPos + 4.5);

    // Nilai KPI
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(kpi.val, xBox + 4, yPos + 10);

    // Catatan kecil
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(130, 130, 140);
    doc.text(kpi.note, xBox + 4, yPos + 14);
  });

  // --- Tabel Rincian Transaksi ---
  const tableData = bookings.map((b, i) => {
    const nights = Math.max(
      1,
      Math.round(
        (new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const dateFormatted = new Date(b.createdAt).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
    const checkInStr = new Date(b.checkIn).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });
    const checkOutStr = new Date(b.checkOut).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });

    return [
      (i + 1).toString(),
      b.code,
      dateFormatted,
      b.guestName,
      b.villa.name,
      `${checkInStr} - ${checkOutStr}`,
      `${nights} mlm`,
      formatPrice(b.totalPrice + b.discountAmount),
      b.discountAmount > 0 ? formatPrice(b.discountAmount) : "-",
      formatPrice(b.totalPrice),
      b.paymentMethod,
      b.status,
    ];
  });

  autoTable(doc, {
    startY: 60,
    head: [
      [
        "No",
        "Kode",
        "Tanggal",
        "Nama Tamu",
        "Villa",
        "Periode",
        "Durasi",
        "Harga Awal",
        "Diskon",
        "Total Bayar",
        "Metode",
        "Status",
      ],
    ],
    body: tableData,
    foot: [
      [
        "TOTAL",
        "",
        "",
        "",
        "",
        "",
        `${summary.totalNights} mlm`,
        formatPrice(summary.totalGrossRevenue),
        formatPrice(summary.totalDiscount),
        formatPrice(summary.totalNetRevenue),
        "",
        `${bookings.length} data`,
      ],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: "bold",
      halign: "left",
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [50, 50, 50],
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 252],
    },
    footStyles: {
      fillColor: [235, 235, 240],
      textColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
      fontSize: 7.5,
      fontStyle: "bold",
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 22, fontStyle: "bold" },
      2: { cellWidth: 16 },
      3: { cellWidth: 32 },
      4: { cellWidth: 28 },
      5: { cellWidth: 24 },
      6: { cellWidth: 14, halign: "center" },
      7: { cellWidth: 22, halign: "right" },
      8: { cellWidth: 18, halign: "right" },
      9: { cellWidth: 24, halign: "right", fontStyle: "bold" },
      10: { cellWidth: 18, halign: "center" },
      11: { cellWidth: 22, halign: "center" },
    },
    margin: { left: 14, right: 14, top: 14, bottom: 16 },
    didDrawPage: (data) => {
      // Footer Halaman
      const totalPages = (doc as any).internal.getNumberOfPages();
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(140, 140, 140);
      doc.text(
        `Dokumen resmi ${options.siteName} — Laporan Operasional & Keuangan`,
        14,
        pageHeight - 8
      );
      doc.text(
        `Halaman ${currentPage} dari ${totalPages}`,
        pageWidth - 14,
        pageHeight - 8,
        { align: "right" }
      );
    },
  });

  const filename = `laporan-reservasi-${options.siteName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

export interface ActivityLogExportItem {
  id: string;
  createdAt: string;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  user?: {
    name: string;
    email: string;
    role: string;
  } | null;
}

/**
 * Ekspor Log Audit Aktivitas ke PDF Format Resmi
 */
export function exportActivityLogsToPDF(
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
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const primaryColor = [26, 26, 46];

  // Header Dokumen
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 26, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(options.siteName.toUpperCase(), 14, 12);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(200, 164, 78);
  doc.text("LOG AUDIT & JEJAK MUTASI SISTEM", 14, 19);

  // Info Cetak di Kanan Atas
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(200, 200, 200);
  const now = new Date();
  const printedDateStr = `${now.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })} ${now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
  doc.text(`Waktu Cetak: ${printedDateStr} WIB`, pageWidth - 14, 12, { align: "right" });
  doc.text(`Dicetak Oleh: ${options.printedBy.name} (${options.printedBy.role})`, pageWidth - 14, 18, { align: "right" });

  // Metadata Filter
  let yPos = 32;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  const filterDesc = [
    `Periode: ${options.periodLabel}`,
    `Modul: ${options.filterEntityLabel || "Semua Modul"}`,
    `Aksi: ${options.filterActionLabel || "Semua Aksi"}`,
    `Total: ${logs.length} Log`,
  ].join("   |   ");
  doc.text(filterDesc, 14, yPos);

  const tableData = logs.map((log, index) => {
    const timeFormatted = new Date(log.createdAt).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    let formattedDetails = log.details || "-";
    if (formattedDetails.startsWith("{") && formattedDetails.endsWith("}")) {
      try {
        const parsed = JSON.parse(formattedDetails);
        formattedDetails = Object.entries(parsed)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
      } catch {
        // ignore
      }
    }

    return [
      (index + 1).toString(),
      timeFormatted,
      log.user ? `${log.user.name}\n(${log.user.role})` : "Sistem / Otomatis",
      log.action,
      log.entity,
      formattedDetails,
    ];
  });

  autoTable(doc, {
    startY: 37,
    head: [["No", "Waktu (WIB)", "Staf / Aktor", "Aksi", "Modul / Entitas", "Rincian Aktivitas"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [50, 50, 50],
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 9, halign: "center" },
      1: { cellWidth: 26 },
      2: { cellWidth: 32 },
      3: { cellWidth: 28, fontStyle: "bold" },
      4: { cellWidth: 22 },
      5: { cellWidth: "auto" },
    },
    margin: { left: 14, right: 14, top: 14, bottom: 16 },
    didDrawPage: (data) => {
      const totalPages = (doc as any).internal.getNumberOfPages();
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(140, 140, 140);
      doc.text(
        `Audit Trail Keamanan & Aktivitas ${options.siteName} — Bersifat Rahasia`,
        14,
        pageHeight - 8
      );
      doc.text(
        `Halaman ${currentPage} dari ${totalPages}`,
        pageWidth - 14,
        pageHeight - 8,
        { align: "right" }
      );
    },
  });

  const filename = `log-aktivitas-${options.siteName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
