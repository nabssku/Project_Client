import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatPrice } from "@/lib/utils";

export interface BookingPDFData {
  id: string;
  code: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestCity?: string | null;
  companionType?: string | null;
  checkIn: string | Date;
  checkOut: string | Date;
  guestsCount: number;
  totalPrice: number;
  discountAmount?: number;
  promoCode?: string | null;
  status: string;
  paymentMethod: string;
  paymentProofUrl?: string | null;
  notes?: string | null;
  createdAt: string | Date;
  villa: {
    name: string;
    location?: string;
    checkInTime?: string;
    checkOutTime?: string;
  };
}

/**
 * Membangun dokumen jsPDF Voucher & Invoice Reservasi dengan desain Luxury Hospitality
 */
export function buildBookingPDFDocument(
  booking: BookingPDFData,
  siteName: string = "Singgahsana"
): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm

  // Brand Colors
  const navy = [26, 26, 46]; // #1a1a2e
  const gold = [200, 164, 78]; // #C8A44E
  const darkGray = [50, 50, 60];
  const mutedGray = [120, 120, 130];
  const borderGray = [225, 225, 230];

  // Helper formats
  const checkInDate = new Date(booking.checkIn);
  const checkOutDate = new Date(booking.checkOut);
  const nights = Math.max(
    1,
    Math.round(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  const checkInFormatted = checkInDate.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const checkOutFormatted = checkOutDate.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const checkInTime = booking.villa.checkInTime || "14:00";
  const checkOutTime = booking.villa.checkOutTime || "12:00";

  // ==========================================
  // 1. TOP HEADER BANNER (Midnight Navy)
  // ==========================================
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(0, 0, pageWidth, 34, "F");

  // Gold accent strip at the top
  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.rect(0, 0, pageWidth, 2.5, "F");

  // Brand Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text(siteName.toUpperCase(), 16, 17);

  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text(".", 16 + doc.getTextWidth(siteName.toUpperCase()), 17);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(190, 190, 205);
  doc.text("LUXURY PRIVATE VILLAS & RESIDENTIAL RESORTS", 16, 24);

  // Right side: Status Badge & Booking Code
  const statusUpper = booking.status.toUpperCase();
  let statusBadgeColor = [40, 160, 90]; // Emerald
  let statusLabel = "LUNAS / TERKONFIRMASI";

  if (statusUpper === "PENDING") {
    statusBadgeColor = [217, 119, 6]; // Amber
    statusLabel = "MENUNGGU PEMBAYARAN";
  } else if (statusUpper === "CHECKED_IN") {
    statusBadgeColor = [37, 99, 235]; // Blue
    statusLabel = "SEDANG MENGINAP (CHECK-IN)";
  } else if (statusUpper === "COMPLETED") {
    statusBadgeColor = [16, 185, 129]; // Emerald
    statusLabel = "SELESAI (CHECK-OUT)";
  } else if (statusUpper === "CANCELLED") {
    statusBadgeColor = [225, 29, 72]; // Rose
    statusLabel = "DIBATALKAN";
  }

  // Rounded badge background
  const badgeWidth = 56;
  const badgeHeight = 7.5;
  const badgeX = pageWidth - 16 - badgeWidth;
  doc.setFillColor(statusBadgeColor[0], statusBadgeColor[1], statusBadgeColor[2]);
  doc.roundedRect(badgeX, 9, badgeWidth, badgeHeight, 3.5, 3.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(statusLabel, badgeX + badgeWidth / 2, 14, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(220, 220, 230);
  doc.text(`Kode Booking:`, pageWidth - 46, 23, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text(booking.code, pageWidth - 16, 23, { align: "right" });

  // ==========================================
  // 2. DOCUMENT TITLE & GREETING
  // ==========================================
  let y = 43;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("BUKTI RESERVASI & INVOICE PEMBAYARAN", 16, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  doc.text(
    `Diterbitkan pada ${new Date(booking.createdAt).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })} untuk konfirmasi resmi masa menginap Anda.`,
    16,
    y + 5
  );

  // ==========================================
  // 3. TWO-COLUMN CARDS: TAMU & VILLA
  // ==========================================
  y = 54;
  const cardWidth = (pageWidth - 32 - 8) / 2;
  const cardHeight = 38;

  // Card Left: Data Pemesan
  doc.setFillColor(248, 247, 244); // luxury soft background
  doc.roundedRect(16, y, cardWidth, cardHeight, 3, 3, "F");
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(16, y, cardWidth, cardHeight, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text("INFORMASI TAMU PEMESAN", 22, y + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(booking.guestName, 22, y + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text(`Email: ${booking.guestEmail}`, 22, y + 20);
  doc.text(`Telepon / WhatsApp: ${booking.guestPhone}`, 22, y + 25);
  const cityInfo = booking.guestCity ? `Asal: ${booking.guestCity}` : "Asal: -";
  const companionInfo = booking.companionType ? `Rombongan: ${booking.companionType}` : "";
  doc.text(`${cityInfo} ${companionInfo ? `• ${companionInfo}` : ""}`, 22, y + 30);

  // Card Right: Unit Villa
  const xRight = 16 + cardWidth + 8;
  doc.setFillColor(248, 247, 244);
  doc.roundedRect(xRight, y, cardWidth, cardHeight, 3, 3, "F");
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(xRight, y, cardWidth, cardHeight, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text("PROPERTI VILLA DI PESAN", xRight + 6, y + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(booking.villa.name, xRight + 6, y + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text(`Lokasi: ${booking.villa.location || "Puncak, Jawa Barat"}`, xRight + 6, y + 20);
  doc.text(`Waktu Check-In: Pukul ${checkInTime} WIB`, xRight + 6, y + 25);
  doc.text(`Waktu Check-Out: Pukul ${checkOutTime} WIB`, xRight + 6, y + 30);

  // ==========================================
  // 4. JADWAL MENGINAP HIGHLIGHT STRIP
  // ==========================================
  y = 97;
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.roundedRect(16, y, pageWidth - 32, 22, 3, 3, "F");

  // Check In Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text("TANGGAL CHECK-IN", 24, y + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text(checkInFormatted, 24, y + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(200, 200, 210);
  doc.text(`Mulai pukul ${checkInTime} WIB`, 24, y + 18);

  // Divider Line in strip
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.2);
  doc.line(100, y + 4, 100, y + 18);

  // Check Out Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text("TANGGAL CHECK-OUT", 108, y + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text(checkOutFormatted, 108, y + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(200, 200, 210);
  doc.text(`Maksimal pukul ${checkOutTime} WIB`, 108, y + 18);

  // Duration Badge on Right
  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.roundedRect(pageWidth - 56, y + 5, 38, 12, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(`${nights} MALAM`, pageWidth - 37, y + 10, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`${booking.guestsCount} Tamu Terdaftar`, pageWidth - 37, y + 14, { align: "center" });

  // ==========================================
  // 5. RINCIAN BIAYA & INVOICE TABLE
  // ==========================================
  y = 125;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("RINCIAN BIAYA & STATUS PEMBAYARAN", 16, y);

  const discountVal = booking.discountAmount || 0;
  const originalPrice = booking.totalPrice + discountVal;
  const pricePerNightEst = Math.round(originalPrice / nights);

  const invoiceItems: string[][] = [
    [
      "1",
      `Sewa Private Villa: ${booking.villa.name}\nPeriode: ${nights} Malam (${booking.guestsCount} Tamu)`,
      `${nights} Malam`,
      formatPrice(pricePerNightEst),
      formatPrice(originalPrice),
    ],
  ];

  if (discountVal > 0) {
    invoiceItems.push([
      "2",
      `Potongan Diskon Kupon Promo ${booking.promoCode ? `[${booking.promoCode}]` : ""}`,
      "1x",
      `-${formatPrice(discountVal)}`,
      `-${formatPrice(discountVal)}`,
    ]);
  }

  autoTable(doc, {
    startY: y + 3,
    head: [["No", "Deskripsi Layanan & Fasilitas", "Qty", "Tarif Satuan", "Subtotal"]],
    body: invoiceItems,
    theme: "striped",
    headStyles: {
      fillColor: [navy[0], navy[1], navy[2]],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [40, 40, 40],
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 90 },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 28, halign: "right" },
      4: { cellWidth: 28, halign: "right", fontStyle: "bold" },
    },
    margin: { left: 16, right: 16 },
  });

  // Total Payment Box below table
  const finalTableY = (doc as any).lastAutoTable.finalY + 4;
  const totalBoxWidth = 85;
  const totalBoxX = pageWidth - 16 - totalBoxWidth;

  doc.setFillColor(248, 247, 244);
  doc.roundedRect(totalBoxX, finalTableY, totalBoxWidth, 24, 2, 2, "F");
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(totalBoxX, finalTableY, totalBoxWidth, 24, 2, 2, "S");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  doc.text("TOTAL DIBAYARKAN:", totalBoxX + 6, finalTableY + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text(formatPrice(booking.totalPrice), totalBoxX + 6, finalTableY + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text(`Metode: ${booking.paymentMethod} • Status: ${statusLabel}`, totalBoxX + 6, finalTableY + 20);

  // Left note beside Total box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("Catatan Khusus Tamu:", 16, finalTableY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  const notesText = booking.notes?.trim()
    ? booking.notes.trim()
    : "Tidak ada catatan khusus yang dilampirkan.";
  const splitNotes = doc.splitTextToSize(notesText, totalBoxX - 22);
  doc.text(splitNotes, 16, finalTableY + 12);

  // ==========================================
  // 6. ATURAN VILLA & PANDUAN CHECK-IN
  // ==========================================
  let rulesY = finalTableY + 30;
  doc.setFillColor(252, 251, 249);
  doc.roundedRect(16, rulesY, pageWidth - 32, 42, 3, 3, "F");
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(16, rulesY, pageWidth - 32, 42, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("PANDUAN KEDATANGAN & TATA TERTIB MENGINAP", 22, rulesY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

  const rules = [
    "1. Tunjukkan dokumen PDF / Booking Code ini serta kartu identitas (KTP/Paspor) saat check-in.",
    `2. Waktu Check-In resmi dibuka pukul ${checkInTime} WIB dan batas Check-Out maksimal pukul ${checkOutTime} WIB.`,
    "3. Dilarang merokok di dalam seluruh area kamar tidur (merokok hanya diizinkan di teras/area luar ruangan).",
    "4. Harap menjaga ketenangan lingkungan hunian dan menghormati privasi tetangga setelah pukul 22:00 WIB.",
    "5. Informasi arah jalan atau bantuan fasilitas villa dapat menghubungi Layanan Tamu di nomor WhatsApp pengelola.",
  ];

  rules.forEach((rule, idx) => {
    doc.text(rule, 22, rulesY + 13 + idx * 5.2);
  });

  // ==========================================
  // 7. FOOTER & CONCIERGE ASSISTANCE
  // ==========================================
  const footerY = pageHeight - 20;
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.3);
  doc.line(16, footerY - 2, pageWidth - 16, footerY - 2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("Layanan Bantuan Tamu (Concierge & WhatsApp):", 16, footerY + 3);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text("+62 811-1141-888  |  support@singgahsana.com", 82, footerY + 3);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  doc.text(
    `Dokumen resmi ${siteName} • Diterbitkan secara otomatis sebagai bukti reservasi yang sah • Dicetak ${new Date().toLocaleString("id-ID")}`,
    16,
    footerY + 9
  );

  return doc;
}

/**
 * Trigger unduh dokumen PDF secara langsung di peramban klien
 */
export function downloadBookingPDF(
  booking: BookingPDFData,
  siteName: string = "Singgahsana"
) {
  const doc = buildBookingPDFDocument(booking, siteName);
  const filename = `Voucher-${siteName.toLowerCase().replace(/\s+/g, "-")}-${booking.code}.pdf`;
  doc.save(filename);
}

/**
 * Meng-generate PDF sebagai Buffer untuk pengiriman email server-side
 */
export function generateBookingPDFBuffer(
  booking: BookingPDFData,
  siteName: string = "Singgahsana"
): Buffer {
  const doc = buildBookingPDFDocument(booking, siteName);
  const arrayBuf = doc.output("arraybuffer");
  return Buffer.from(arrayBuf);
}
