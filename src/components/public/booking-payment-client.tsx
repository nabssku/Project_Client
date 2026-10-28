"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { formatIDR } from "@/lib/pricing";
import {
  CheckCircle2,
  Clock,
  Copy,
  UploadCloud,
  FileCheck,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Calendar,
  Users,
  MapPin,
  Building,
  CreditCard,
  Star,
  Sparkles,
  MessageSquare,
  Send,
  Loader2,
  FileDown,
  Download,
  Mail,
  XCircle,
  HelpCircle,
  Smartphone,
  X,
} from "lucide-react";
import { type BankAccount, DEFAULT_BANK_ACCOUNTS } from "@/lib/payment-config";
import { downloadBookingPDF } from "@/lib/booking-pdf";
import { normalizeMediaUrl } from "@/lib/media";
import {
  isBookingExpired,
  formatBookingDeadline,
} from "@/lib/booking-expiration";

interface BookingData {
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
  discountAmount: number;
  promoCode?: string | null;
  status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED";
  paymentMethod: string;
  paymentProofUrl?: string | null;
  paymentProofUploadedAt?: string | Date | null;
  notes?: string | null;
  rejectionReason?: string | null;
  createdAt: string | Date;
  addons?: Array<{
    id: string;
    name: string;
    price: number;
    qty: number;
    subtotal: number;
    unit: string;
  }>;
  villa: {
    id: string;
    name: string;
    slug: string;
    location: string;
    coverImage?: string | null;
    images: string[];
    checkInTime: string;
    checkOutTime: string;
  };
  testimonial?: {
    id: string;
    rating: number;
    cleanlinessRating?: number | null;
    serviceRating?: number | null;
    facilityRating?: number | null;
    content: string;
    createdAt: string;
  } | null;
}

export function BookingPaymentClient({
  initialBooking,
  bankAccounts = DEFAULT_BANK_ACCOUNTS,
  siteName = "Singgahsana",
  siteLogo = "/logo.png",
  contactPhone,
}: {
  initialBooking: BookingData;
  bankAccounts?: BankAccount[];
  siteName?: string;
  siteLogo?: string | null;
  contactPhone?: string | null;
}) {
  const [booking, setBooking] = useState<BookingData>(initialBooking);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  // Tutorial Modal state
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [tutorialTab, setTutorialTab] = useState<"mbanking" | "bifast" | "atm">("mbanking");

  // Booking payment expiration state
  const deadlineFormatted = formatBookingDeadline(
    booking.checkIn,
    booking.villa.checkInTime
  );
  const isExpired = isBookingExpired(booking.checkIn, booking.villa.checkInTime);
  const isExpiredCancelled =
    booking.status === "CANCELLED" &&
    (isExpired ||
      booking.rejectionReason?.toLowerCase().includes("otomatis") ||
      booking.rejectionReason?.toLowerCase().includes("kedaluwarsa") ||
      booking.rejectionReason?.toLowerCase().includes("check-in") ||
      booking.rejectionReason?.toLowerCase().includes("expired"));

  // Active bank accounts from site_configs
  const activeBankAccounts =
    bankAccounts && bankAccounts.length > 0
      ? bankAccounts.filter((b) => b.isActive)
      : DEFAULT_BANK_ACCOUNTS;

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Guest Review states
  const [testimonial, setTestimonial] = useState(initialBooking.testimonial || null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [overallRating, setOverallRating] = useState(5);
  const [serviceRating, setServiceRating] = useState(5);
  const [cleanlinessRating, setCleanlinessRating] = useState(5);
  const [facilityRating, setFacilityRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewerName, setReviewerName] = useState(initialBooking.guestName || "");

  const copyToClipboard = (text: string, type: "code" | "amount" | string) => {
    navigator.clipboard.writeText(text);
    if (type === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else if (type === "amount") {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    } else {
      setCopiedBank(type);
      setTimeout(() => setCopiedBank(null), 2000);
    }
  };

  // PDF Download Handler
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const handleDownloadPDF = async () => {
    try {
      setDownloadingPdf(true);
      await downloadBookingPDF(
        {
          id: booking.id,
          code: booking.code,
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          guestPhone: booking.guestPhone,
          guestCity: booking.guestCity,
          companionType: booking.companionType,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          guestsCount: booking.guestsCount,
          totalPrice: booking.totalPrice,
          discountAmount: booking.discountAmount,
          promoCode: booking.promoCode,
          status: booking.status,
          paymentMethod: booking.paymentMethod,
          notes: booking.notes,
          rejectionReason: booking.rejectionReason,
          createdAt: booking.createdAt,
          addons: booking.addons?.map((a) => ({
            name: a.name,
            price: a.price,
            qty: a.qty,
            subtotal: a.subtotal,
            unit: a.unit,
          })),
          villa: {
            name: booking.villa.name,
            location: booking.villa.location,
            checkInTime: booking.villa.checkInTime,
            checkOutTime: booking.villa.checkOutTime,
          },
        },
        siteName,
        siteLogo,
        contactPhone
      );
    } catch (err) {
      console.error("Gagal mengunduh PDF:", err);
      alert("Gagal mengunduh dokumen PDF.");
    } finally {
      setTimeout(() => setDownloadingPdf(false), 600);
    }
  };

  // Resend Email Handler
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSentNotice, setEmailSentNotice] = useState<string | null>(null);
  const handleResendEmail = async () => {
    try {
      setSendingEmail(true);
      setEmailSentNotice(null);
      const res = await fetch(`/api/bookings/${booking.code}/email`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim email");
      setEmailSentNotice(data.message || `Email voucher berhasil dikirim ke ${booking.guestEmail}!`);
      setTimeout(() => setEmailSentNotice(null), 6000);
    } catch (err: any) {
      alert(err.message || "Gagal mengirim email voucher.");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bookingCode", booking.code);

      const res = await fetch("/api/upload/payment-proof", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengunggah bukti pembayaran");
      }

      setBooking((prev) => ({
        ...prev,
        ...data.booking,
        paymentProofUrl: data.url || data.booking?.paymentProofUrl,
        paymentProofUploadedAt:
          data.booking?.paymentProofUploadedAt || new Date().toISOString(),
        villa: {
          ...prev.villa,
          ...(data.booking?.villa || {}),
          images:
            data.booking?.villa?.images && data.booking.villa.images.length > 0
              ? data.booking.villa.images
              : prev.villa?.images || [],
        },
      }));
      setUploadSuccess(true);
    } catch (err: any) {
      setUploadError(err.message || "Gagal mengunggah bukti pembayaran");
    } finally {
      setUploading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewSubmitting(true);
    setReviewError("");

    if (!reviewContent.trim() || reviewContent.trim().length < 5) {
      setReviewError("Ulasan pengalaman menginap minimal 5 karakter.");
      setReviewSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/public/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingCode: booking.code,
          rating: overallRating,
          serviceRating,
          cleanlinessRating,
          facilityRating,
          content: reviewContent.trim(),
          name: reviewerName.trim() || booking.guestName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirimkan ulasan");

      setTestimonial(data.testimonial);
      setReviewSuccess(true);
    } catch (err: any) {
      setReviewError(err.message || "Gagal mengirimkan ulasan");
    } finally {
      setReviewSubmitting(false);
    }
  };

  // WhatsApp verification message directed to Admin / CS
  const waPhone = (contactPhone || "628111141888").replace(/\D/g, "").replace(/^0/, "62");
  const waText = `Halo Admin ${siteName}, saya telah melakukan pembayaran untuk Booking Code: *${booking.code}* atas nama *${booking.guestName}* (${booking.villa.name}). Mohon dibantu verifikasi. Terima kasih!`;
  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}`;

  const checkInDate = typeof booking.checkIn === "string" ? parseISO(booking.checkIn) : new Date(booking.checkIn);
  const checkOutDate = typeof booking.checkOut === "string" ? parseISO(booking.checkOut) : new Date(booking.checkOut);

  return (
    <div className="min-h-screen bg-[#faf9f5] pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Status Header Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm text-center mb-6">
          {booking.status === "CANCELLED" ? (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 text-rose-600 mb-4 shadow-xs animate-bounce">
              <XCircle className="w-8 h-8" />
            </div>
          ) : booking.status === "COMPLETED" ? (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 text-accent mb-4 shadow-xs">
              <Sparkles className="w-8 h-8" />
            </div>
          ) : booking.status === "CONFIRMED" ? (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          ) : booking.status === "PENDING" ? (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 mb-4 animate-pulse">
              <Clock className="w-8 h-8" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl font-bold font-display text-primary">
            {isExpiredCancelled
              ? "Pesanan Kedaluwarsa & Dibatalkan Otomatis"
              : booking.status === "CANCELLED"
              ? "Bukti Pembayaran Ditolak / Dibatalkan"
              : booking.status === "COMPLETED"
              ? "Masa Menginap Selesai"
              : booking.status === "CHECKED_IN"
              ? "Sedang Menginap di Villa"
              : booking.status === "CONFIRMED"
              ? "Pembayaran Terverifikasi!"
              : booking.paymentProofUrl
              ? "Bukti Terkirim — Menunggu Verifikasi"
              : "Instruksi Pembayaran Reservasi"}
          </h1>

          <p className="text-sm text-gray-500 max-w-md mx-auto mt-2">
            {isExpiredCancelled
              ? `Batas waktu pembayaran untuk reservasi ini telah habis karena telah melewati batas jadwal check-in (${deadlineFormatted}). Tanggal menginap telah dirilis kembali untuk umum.`
              : booking.status === "CANCELLED"
              ? "Pembayaran atau pesanan ini ditolak/dibatalkan oleh pengelola villa. Harap periksa alasan penolakan di bawah ini."
              : booking.status === "COMPLETED"
              ? `Terima kasih telah menginap di ${booking.villa.name}! Kami mengundang Anda untuk memberikan ulasan pengalaman liburan Anda.`
              : booking.status === "CHECKED_IN"
              ? `Selamat menikmati waktu liburan Anda di ${booking.villa.name}!`
              : booking.status === "CONFIRMED"
              ? "Reservasi Anda telah berhasil dikonfirmasi. Sampai jumpa di villa!"
              : booking.paymentProofUrl
              ? `Terima kasih! Bukti transfer Anda sudah kami terima dan sedang diverifikasi oleh Tim ${siteName}.`
              : "Selesaikan pembayaran Anda sebelum jadwal check-in untuk mengamankan tanggal menginap di villa."}
          </p>

          {/* Rejection / Expiration Notice Banner */}
          {booking.status === "CANCELLED" && (
            <div className="mt-5 max-w-xl mx-auto p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-left space-y-2 animate-fade-in shadow-xs">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  {isExpiredCancelled
                    ? "Alasan Pembatalan Otomatis Sistem:"
                    : "Alasan Penolakan dari Pengelola Villa:"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-rose-700 pl-6 font-semibold leading-relaxed bg-white/70 p-3 rounded-xl border border-rose-100">
                &ldquo;
                {booking.rejectionReason ||
                  (isExpiredCancelled
                    ? "Batas waktu pembayaran telah kedaluwarsa karena telah melewati jadwal check-in."
                    : "Bukti transfer tidak sesuai, foto tidak jelas, atau nominal kurang. Silakan unggah bukti yang benar.")}
                &rdquo;
              </p>
              <div className="pl-6 pt-1 text-[11px] text-rose-600 flex items-center justify-between flex-wrap gap-2">
                {isExpiredCancelled ? (
                  <div className="flex items-center gap-1.5">
                    <span>💡</span>
                    <span>
                      Jadwal menginap telah dibuka kembali. Anda dapat memilih tanggal baru untuk memesan ulang.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span>💡</span>
                    <span>
                      <strong>Solusi:</strong> Anda dapat mengunggah ulang bukti pembayaran yang valid pada formulir di bawah ini agar pesanan Anda dapat diproses kembali.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Deadline Info Banner for PENDING bookings */}
          {booking.status === "PENDING" && !booking.paymentProofUrl && (
            <div className="mt-5 max-w-xl mx-auto p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-left flex items-start gap-3 shadow-xs animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-amber-950">Batas Waktu Pembayaran:</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200/60 font-semibold text-amber-900 text-[10px]">
                    Sebelum Check-In
                  </span>
                </div>
                <p className="text-amber-800 leading-relaxed text-[11px]">
                  Pembayaran dan bukti transfer wajib dikirim sebelum{" "}
                  <strong>{deadlineFormatted}</strong>. Jika melewati batas waktu jadwal check-in, pesanan akan{" "}
                  <strong className="text-rose-700">dibatalkan secara otomatis</strong> oleh sistem.
                </p>
              </div>
            </div>
          )}

          {/* Booking Code Card */}
          <div className="mt-6 inline-flex items-center gap-3 bg-cream px-5 py-3 rounded-2xl border border-gray-200">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block text-left">
                Kode Booking
              </span>
              <span className="font-mono text-lg sm:text-xl font-bold text-primary tracking-wide">
                {booking.code}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(booking.code, "code")}
              className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-accent hover:border-accent transition-colors ml-2"
              title="Salin Kode"
            >
              <Copy className="w-4 h-4" />
            </button>
            {copiedCode && (
              <span className="text-xs text-emerald-600 font-semibold animate-fade-in">
                Tersalin!
              </span>
            )}
          </div>
        </div>

        {/* --- Dokumen Bukti Reservasi & Invoice (PDF) & Kirim Email --- */}
        <div className="bg-gradient-to-r from-[#1a1a2e] to-[#252542] rounded-3xl p-5 sm:p-6 text-white shadow-lg mb-6 border border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-center sm:text-left">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/20 text-accent border border-accent/30 shadow-xs">
                <FileDown className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                  <span>Invoice</span>
                </h3>
                <p className="text-xs text-white/70 mt-1 max-w-lg">
                  Unduh invoice resmi & voucher menginap untuk ditunjukkan saat check-in, atau kirimkan salinannya langsung ke email <strong>{booking.guestEmail}, jika tidak ada cek folder SPAM</strong>.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={downloadingPdf}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-2.5 text-xs font-bold text-primary shadow-md transition hover:bg-accent-light active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Download Dokumen PDF Resmi"
              >
                {downloadingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>{downloadingPdf ? "Menyiapkan PDF..." : "Unduh PDF Voucher"}</span>
              </button>

              <button
                type="button"
                onClick={handleResendEmail}
                disabled={sendingEmail}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2.5 text-xs font-semibold text-white transition active:scale-95 disabled:opacity-50 cursor-pointer"
                title={`Kirim ulang ke ${booking.guestEmail}`}
              >
                {sendingEmail ? (
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                ) : (
                  <Mail className="h-4 w-4 text-accent" />
                )}
                <span>{sendingEmail ? "Mengirim..." : "Kirim ke Email"}</span>
              </button>
            </div>
          </div>

          {emailSentNotice && (
            <div className="mt-3.5 flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-3.5 py-2 text-xs text-emerald-200 animate-fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{emailSentNotice}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Payment Instructions & Proof Upload */}
          <div className="md:col-span-7 space-y-6">
            {/* Guest Review & Feedback Section (For Completed / Checked-In Guests) */}
            {(booking.status === "COMPLETED" || booking.status === "CHECKED_IN") && (
              <div id="review" className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
                {testimonial ? (
                  /* Completed Review Card */
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-2xl border border-emerald-200">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span className="text-xs font-semibold">
                        Ulasan Anda Telah Terkirim — Terima kasih telah membagikan pengalaman Anda!
                      </span>
                    </div>

                    <div className="bg-[#faf9f5] p-5 rounded-2xl border border-[#e8e6df] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-5 h-5 ${
                                s <= testimonial.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                          <span className="text-sm font-bold text-gray-800 ml-1.5">
                            {testimonial.rating}.0 / 5.0
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400">
                          {new Date(testimonial.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      {/* Aspect Ratings Pills */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-gray-600">
                        <span className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-[11px] font-medium">
                          Pelayanan: <strong className="text-amber-600">★ {testimonial.serviceRating || 5}</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-[11px] font-medium">
                          Kebersihan: <strong className="text-amber-600">★ {testimonial.cleanlinessRating || 5}</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-[11px] font-medium">
                          Fasilitas: <strong className="text-amber-600">★ {testimonial.facilityRating || 5}</strong>
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 leading-relaxed italic border-t border-gray-200/60 pt-3">
                        &ldquo;{testimonial.content}&rdquo;
                      </p>

                      <div className="text-xs text-gray-400 font-medium pt-1">
                        Oleh: <strong className="text-gray-700">{booking.guestName}</strong> (Tamu Terverifikasi)
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Form Review Baru */
                  <form onSubmit={handleReviewSubmit} className="space-y-5">
                    <div className="border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-2 text-accent mb-1">
                        <Sparkles className="w-5 h-5" />
                        <h2 className="text-base sm:text-lg font-bold font-display text-primary">
                          Bagikan Pengalaman Menginap Anda
                        </h2>
                      </div>
                      <p className="text-xs text-gray-500">
                        Ulasan Anda membantu kami meningkatkan pelayanan di <strong>{booking.villa.name}</strong> dan membantu calon tamu lain merencanakan liburan mereka.
                      </p>
                    </div>

                    {reviewError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{reviewError}</span>
                      </div>
                    )}

                    {/* Aspect Questions */}
                    <div className="space-y-4 bg-[#faf9f5] p-4 sm:p-5 rounded-2xl border border-[#e8e6df]">
                      <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Penilaian Kualitas &amp; Pelayanan
                      </div>

                      {/* 1. Pelayanan & Keramahan */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200/60 pb-3">
                        <div>
                          <span className="text-xs font-semibold text-primary block">
                            1. Pelayanan &amp; Keramahan Staf
                          </span>
                          <span className="text-[11px] text-gray-400">
                            Kecepatan respon, kesigapan, dan sambutan hangat
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              type="button"
                              key={s}
                              onClick={() => setServiceRating(s)}
                              className="p-1 hover:scale-110 transition-transform cursor-pointer"
                            >
                              <Star
                                className={`w-5 h-5 ${
                                  s <= serviceRating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                          <span className="text-xs font-bold text-gray-700 w-6 text-right">
                            {serviceRating}
                          </span>
                        </div>
                      </div>

                      {/* 2. Kebersihan Villa */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200/60 pb-3">
                        <div>
                          <span className="text-xs font-semibold text-primary block">
                            2. Kebersihan Villa &amp; Kamar
                          </span>
                          <span className="text-[11px] text-gray-400">
                            Kerapian sprei, kebersihan kamar mandi, dan area santai
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              type="button"
                              key={s}
                              onClick={() => setCleanlinessRating(s)}
                              className="p-1 hover:scale-110 transition-transform cursor-pointer"
                            >
                              <Star
                                className={`w-5 h-5 ${
                                  s <= cleanlinessRating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                          <span className="text-xs font-bold text-gray-700 w-6 text-right">
                            {cleanlinessRating}
                          </span>
                        </div>
                      </div>

                      {/* 3. Fasilitas & Kenyamanan */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200/60 pb-3">
                        <div>
                          <span className="text-xs font-semibold text-primary block">
                            3. Fasilitas &amp; Kenyamanan Properti
                          </span>
                          <span className="text-[11px] text-gray-400">
                            Kolam renang, WiFi, dapur, kelengkapan elektronik
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              type="button"
                              key={s}
                              onClick={() => setFacilityRating(s)}
                              className="p-1 hover:scale-110 transition-transform cursor-pointer"
                            >
                              <Star
                                className={`w-5 h-5 ${
                                  s <= facilityRating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                          <span className="text-xs font-bold text-gray-700 w-6 text-right">
                            {facilityRating}
                          </span>
                        </div>
                      </div>

                      {/* 4. Kepuasan Keseluruhan */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                        <div>
                          <span className="text-xs font-bold text-primary block">
                            4. Kepuasan Keseluruhan
                          </span>
                          <span className="text-[11px] text-gray-400">
                            Secara umum seberapa puas Anda menginap di sini
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              type="button"
                              key={s}
                              onClick={() => setOverallRating(s)}
                              className="p-1 hover:scale-110 transition-transform cursor-pointer"
                            >
                              <Star
                                className={`w-6 h-6 ${
                                  s <= overallRating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                          <span className="text-sm font-bold text-accent w-6 text-right">
                            {overallRating}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Text Review */}
                    <div>
                      <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                        Ulasan Pengalaman Menginap <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={reviewContent}
                        onChange={(e) => setReviewContent(e.target.value)}
                        placeholder="Ceritakan momen terbaik Anda selama liburan di villa ini (suasana, fasilitas favorit, keramahan staf)..."
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#e8e6df] bg-white text-gray-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                      />
                    </div>

                    {/* Reviewer Name */}
                    <div>
                      <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                        Nama yang Ditampilkan
                      </label>
                      <input
                        type="text"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        placeholder={booking.guestName}
                        className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={reviewSubmitting || !reviewContent.trim()}
                      className="w-full py-3 rounded-xl bg-accent hover:bg-accent-light text-white text-xs sm:text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {reviewSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Mengirimkan Ulasan...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Kirim Ulasan &amp; Penilaian Menginap</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Payment Details & Proof Upload */}
            {isExpiredCancelled ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm space-y-5 text-center animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
                  <Clock className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold font-display text-gray-900">
                    Batas Waktu Pembayaran Telah Berakhir
                  </h2>
                  <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 leading-relaxed">
                    Pesanan dengan kode <strong className="font-mono text-primary">{booking.code}</strong> telah dibatalkan otomatis oleh sistem karena melewati jadwal batas check-in ({deadlineFormatted}).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#faf9f5] border border-gray-200/80 text-left space-y-2 text-xs">
                  <span className="font-bold text-gray-800 block">Keterangan Sistem:</span>
                  <ul className="list-disc pl-4 text-gray-600 space-y-1.5 text-[11px] leading-relaxed">
                    <li>Sesi pembayaran dan pengunggahan bukti transfer telah dinonaktifkan.</li>
                    <li>Jadwal tanggal villa telah dirilis dan tersedia kembali untuk tamu lain.</li>
                    <li>Jika Anda masih berencana menginap, silakan lakukan reservasi baru dengan memilih jadwal tanggal yang tersedia.</li>
                  </ul>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href={`/villas/${booking.villa.slug}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-xs transition shadow-xs"
                  >
                    <span>Cari Jadwal Menginap Baru</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/booking/status"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition"
                  >
                    Cek Status Pesanan Lain
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Payment Details Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold font-display text-primary">
                      Total Tagihan Pembayaran
                    </h2>
                    <button
                      type="button"
                      onClick={() => setShowTutorialModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent font-semibold text-xs transition-colors cursor-pointer border border-accent/20"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Tutorial Bayar</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-cream border border-gray-200/70 flex items-center justify-between mb-6">
                    <div>
                      <span className="text-xs text-gray-500 block">Jumlah yang harus ditransfer</span>
                      <span className="text-2xl font-display font-bold text-accent tabular-nums">
                        {formatIDR(booking.totalPrice)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(booking.totalPrice.toString(), "amount")}
                      className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:border-accent hover:text-accent transition-colors flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedAmount ? "Tersalin!" : "Salin"}</span>
                    </button>
                  </div>

                  {/* Bank Transfer Accounts (Dynamically loaded from site_configs) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Pilihan Rekening Resmi {siteName}
                      </p>
                      <span className="text-[11px] text-gray-400">
                        {activeBankAccounts.length} Rekening Aktif
                      </span>
                    </div>

                    {activeBankAccounts.map((bank) => {
                      const cleanNumber = bank.accountNumber.replace(/\s+/g, "");
                      const isCopied = copiedBank === bank.id;

                      return (
                        <div
                          key={bank.id}
                          className="p-4 rounded-2xl border border-gray-100 bg-[#fafafa] flex items-center justify-between hover:border-gray-200 transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-accent shrink-0" />
                              <span className="font-bold text-sm text-primary">
                                {bank.bankName}
                              </span>
                            </div>
                            <span className="font-mono text-base font-bold text-gray-900 block mt-1 tracking-wide">
                              {bank.accountNumber}
                            </span>
                            <span className="text-[11px] text-gray-500 block">
                              a.n. {bank.accountHolder}
                            </span>
                            {bank.instructions && (
                              <span className="text-[10px] text-accent/90 block mt-0.5">
                                {bank.instructions}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => copyToClipboard(cleanNumber, bank.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:border-accent hover:text-accent transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0 ml-3"
                            title="Salin Nomor Rekening"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{isCopied ? "Tersalin!" : "Salin"}</span>
                          </button>
                        </div>
                      );
                    })}

                    {/* Tutorial Banner Prompt */}
                    <div className="mt-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 block">
                            Belum tahu cara bayar via transfer bank?
                          </span>
                          <span className="text-gray-500 text-[11px]">
                            Lihat panduan lengkap langkah demi langkah via m-Banking, BI-FAST, atau ATM.
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowTutorialModal(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-accent hover:bg-accent-light text-white font-semibold text-xs transition-colors shrink-0 shadow-2xs cursor-pointer"
                      >
                        Buka Panduan
                      </button>
                    </div>
                  </div>
                </div>

                {/* Proof Upload Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                  <h2 className="text-base font-bold font-display text-primary mb-2">
                    Unggah Bukti Transfer
                  </h2>
                  <p className="text-xs text-gray-500 mb-4">
                    Unggah tangkapan layar (screenshot) bukti transfer sukses atau resi bank Anda.
                  </p>

                  {uploadError && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {uploadSuccess && (
                    <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Bukti pembayaran berhasil diunggah!</span>
                    </div>
                  )}

                  {booking.status === "CANCELLED" ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 text-rose-600">
                            <XCircle className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-rose-900 block truncate">
                              Bukti Pembayaran Ditolak
                            </span>
                            <span className="text-[11px] text-rose-700 block line-clamp-1">
                              Alasan: {booking.rejectionReason || "Bukti tidak valid"}
                            </span>
                          </div>
                        </div>
                        {booking.paymentProofUrl && (
                          <a
                            href={normalizeMediaUrl(booking.paymentProofUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:underline shrink-0 bg-white/80 px-2.5 py-1.5 rounded-lg border border-rose-200"
                          >
                            <span>Lihat Bukti Ditolak</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      <div>
                        <label className="border-2 border-dashed border-rose-300 hover:border-rose-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-rose-50/20">
                          <UploadCloud className="w-8 h-8 text-rose-500 mb-2" />
                          <span className="text-xs font-bold text-rose-900">
                            {uploading ? "Sedang Mengunggah Bukti Baru..." : "Unggah Ulang Bukti Pembayaran yang Benar"}
                          </span>
                          <span className="text-[11px] text-rose-600 mt-1">
                            Format JPG, PNG, WebP atau PDF (Maks. 10MB)
                          </span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ) : booking.paymentProofUrl ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {booking.paymentProofUrl.endsWith(".pdf") ? (
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-700">
                              <FileCheck className="w-6 h-6" />
                            </div>
                          ) : (
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-emerald-100 border border-emerald-200 shrink-0 shadow-2xs">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={normalizeMediaUrl(booking.paymentProofUrl)}
                                alt="Bukti Transfer"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-emerald-900 block truncate">
                              Bukti Berhasil Diunggah
                            </span>
                            <span className="text-[11px] text-emerald-700 block">
                              {booking.paymentProofUploadedAt
                                ? `Diunggah pada ${format(
                                    new Date(booking.paymentProofUploadedAt),
                                    "d MMM yyyy, HH:mm",
                                    { locale: localeId }
                                  )} WIB`
                                : `Siap diperiksa staf ${siteName}`}
                            </span>
                          </div>
                        </div>
                        <a
                          href={normalizeMediaUrl(booking.paymentProofUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline shrink-0 bg-white/70 px-2.5 py-1.5 rounded-lg border border-emerald-200"
                        >
                          <span>Lihat File</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      {/* Re-upload button */}
                      <div>
                        <label className="inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline cursor-pointer">
                          <UploadCloud className="w-4 h-4" />
                          <span>Unggah ulang jika ada revisi bukti</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="border-2 border-dashed border-gray-200 hover:border-accent rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#fafafa]">
                        <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-xs font-semibold text-gray-700">
                          {uploading ? "Sedang Mengunggah..." : "Pilih foto bukti pembayaran"}
                        </span>
                        <span className="text-[11px] text-gray-400 mt-1">
                          JPG, PNG, WebP atau PDF (Maks. 10MB)
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          onChange={handleFileUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  {/* WhatsApp confirmation button */}
                  <div className="mt-6 pt-5 border-t border-gray-100">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-green-500 text-white px-5 py-3 rounded-2xl text-sm font-semibold hover:bg-green-600 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Konfirmasi Cepat via WhatsApp</span>
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Column: Reservation Detail Card */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-base text-primary">
                Ringkasan Reservasi
              </h3>

              {/* Villa Thumbnail */}
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                  <Image
                    src={booking.villa?.images?.[0] || "/placeholder-villa.jpg"}
                    alt={booking.villa?.name || "Villa"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-primary">{booking.villa?.name}</h4>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-accent" />
                    {booking.villa?.location}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100"></div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nama Pemesan</span>
                  <span className="font-semibold text-gray-800">{booking.guestName}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="font-semibold text-gray-800">{booking.guestEmail}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Nomor WhatsApp</span>
                  <span className="font-semibold text-gray-800">{booking.guestPhone}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Check-in</span>
                  <span className="font-semibold text-gray-800 capitalize">
                    {format(checkInDate, "d MMM yyyy", { locale: localeId })}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Check-out</span>
                  <span className="font-semibold text-gray-800 capitalize">
                    {format(checkOutDate, "d MMM yyyy", { locale: localeId })}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Tamu</span>
                  <span className="font-semibold text-gray-800">
                    {booking.guestsCount} Tamu
                  </span>
                </div>

                {booking.promoCode && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Promo ({booking.promoCode})</span>
                    <span className="font-semibold">
                      - {formatIDR(booking.discountAmount)}
                    </span>
                  </div>
                )}

                {/* Add-ons List */}
                {booking.addons && booking.addons.length > 0 && (
                  <div className="border-t border-gray-100 pt-2 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Add-on / Fasilitas Ekstra
                    </span>
                    {booking.addons.map((addon) => (
                      <div key={addon.id} className="flex justify-between text-xs text-gray-700">
                        <span>
                          {addon.name} ({addon.qty} {addon.unit})
                        </span>
                        <span className="font-semibold tabular-nums text-gray-900">
                          {formatIDR(addon.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Guest Notes if any */}
                {booking.notes && (
                  <div className="border-t border-gray-100 pt-2.5 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Catatan / Permintaan Khusus Tamu
                    </span>
                    <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-200/60 leading-relaxed italic">
                      &ldquo;{booking.notes}&rdquo;
                    </p>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-sm">
                  <span className="text-primary">Total Bayar</span>
                  <span className="text-accent">{formatIDR(booking.totalPrice)}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={downloadingPdf}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-100 hover:bg-gray-200 py-2.5 text-xs font-bold text-gray-800 transition cursor-pointer"
                  title="Unduh Dokumen PDF Transaksi"
                >
                  <Download className="w-3.5 h-3.5 text-accent" />
                  <span>{downloadingPdf ? "Menyiapkan..." : "Unduh Invoice & Voucher (PDF)"}</span>
                </button>
                <Link
                  href="/booking/status"
                  className="w-full text-center block text-xs font-semibold text-accent hover:underline pt-1"
                >
                  Cek Status Pesanan Kapan Saja
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Pop-up Modal: Tutorial Pembayaran Transfer Bank --- */}
      {showTutorialModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in"
          onClick={() => setShowTutorialModal(false)}
        >
          <div
            className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-cream/60 via-white to-cream/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-primary">
                    Tutorial Pembayaran Bank Transfer
                  </h3>
                  <p className="text-xs text-gray-500">
                    Panduan langkah mudah transfer via m-Banking, BI-FAST, atau ATM
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTutorialModal(false)}
                className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition cursor-pointer shrink-0"
                title="Tutup Panduan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Total & Booking Code Highlight Banner */}
            <div className="px-5 sm:px-6 py-3.5 bg-accent/5 border-b border-accent/15 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-gray-500 block text-[11px] font-medium">Nominal Tepat yang Ditransfer:</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-display font-bold text-base sm:text-lg text-accent tabular-nums">
                    {formatIDR(booking.totalPrice)}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(booking.totalPrice.toString(), "amount")}
                    className="p-1 rounded-md bg-white border border-accent/30 text-accent hover:bg-accent hover:text-white transition cursor-pointer"
                    title="Salin Nominal"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {copiedAmount && <span className="text-[10px] text-emerald-600 font-semibold">Tersalin!</span>}
                </div>
              </div>

              <div>
                <span className="text-gray-500 block text-[11px] font-medium">Kode Booking (Keterangan/Berita):</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-bold text-xs sm:text-sm text-primary bg-white px-2.5 py-0.5 rounded-lg border border-gray-200">
                    {booking.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(booking.code, "code")}
                    className="p-1 rounded-md bg-white border border-gray-300 text-gray-600 hover:text-accent transition cursor-pointer"
                    title="Salin Kode Booking"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {copiedCode && <span className="text-[10px] text-emerald-600 font-semibold">Tersalin!</span>}
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="px-5 sm:px-6 pt-3 pb-2 border-b border-gray-100 bg-white">
              <div className="flex p-1 bg-gray-100/80 rounded-2xl gap-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setTutorialTab("mbanking")}
                  className={`flex-1 py-2 rounded-xl transition text-center cursor-pointer ${
                    tutorialTab === "mbanking"
                      ? "bg-white text-primary shadow-xs font-bold"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  m-Banking
                </button>
                <button
                  type="button"
                  onClick={() => setTutorialTab("bifast")}
                  className={`flex-1 py-2 rounded-xl transition text-center cursor-pointer ${
                    tutorialTab === "bifast"
                      ? "bg-white text-primary shadow-xs font-bold"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  BI-FAST
                </button>
                <button
                  type="button"
                  onClick={() => setTutorialTab("atm")}
                  className={`flex-1 py-2 rounded-xl transition text-center cursor-pointer ${
                    tutorialTab === "atm"
                      ? "bg-white text-primary shadow-xs font-bold"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Mesin ATM
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto px-5 sm:px-6 py-4 space-y-5 text-xs text-gray-700 leading-relaxed">
              {/* Tab 1: m-Banking */}
              {tutorialTab === "mbanking" && (
                <div className="space-y-3 animate-fade-in">
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    <span className="text-[11px] leading-relaxed">
                      Direkomendasikan! Transfer melalui aplikasi Mobile Banking (BCA Mobile, Livin&apos; by Mandiri, BRImo, BNI Mobile, Seabank, dll) berlangsung instan dan tanpa repot.
                    </span>
                  </div>

                  <ol className="list-decimal pl-4 space-y-2.5">
                    <li>
                      Buka aplikasi <strong>Mobile Banking</strong> di ponsel Anda dan masukkan kode akses/sidik jari untuk masuk.
                    </li>
                    <li>
                      Pilih menu <strong>Transfer</strong> &rarr; pilih <strong>Antar Rekening</strong> (jika bank sama) atau <strong>Antar Bank / Rekening Bank Lain</strong> (jika beda bank).
                    </li>
                    <li>
                      Salin salah satu nomor rekening resmi <strong>{siteName}</strong> yang ada di bawah ini dan tempelkan ke aplikasi m-Banking Anda.
                    </li>
                    <li>
                      Pastikan <strong>Nama Pemilik Rekening</strong> yang muncul di layar m-Banking sesuai dengan nama rekening tujuan resmi kami.
                    </li>
                    <li>
                      Masukkan nominal transfer tepat sebesar <strong className="text-accent">{formatIDR(booking.totalPrice)}</strong> (tanpa dilebihkan atau dikurangi).
                    </li>
                    <li>
                      Pada kolom Berita / Catatan Transaksi, cantumkan Kode Booking: <strong className="font-mono text-primary bg-gray-100 px-1 py-0.5 rounded">{booking.code}</strong>.
                    </li>
                    <li>
                      Periksa kembali data transfer, lalu masukkan <strong>PIN m-Banking</strong> Anda untuk menyelesaikan proses pembayaran.
                    </li>
                    <li>
                      <strong className="text-emerald-700">Simpan bukti transfer (tangkapan layar / screenshot)</strong> yang berhasil, lalu unggah pada form <strong>Unggah Bukti Transfer</strong> di halaman ini.
                    </li>
                  </ol>
                </div>
              )}

              {/* Tab 2: BI-FAST */}
              {tutorialTab === "bifast" && (
                <div className="space-y-3 animate-fade-in">
                  <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 text-sky-800 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 text-sky-600 mt-0.5" />
                    <span className="text-[11px] leading-relaxed">
                      Gunakan layanan <strong>BI-FAST</strong> di aplikasi m-Banking jika rekening bank Anda berbeda dengan rekening tujuan. Biaya admin hanya <strong>Rp 2.500</strong> dan transfer diterima secara seketika (real-time 24/7).
                    </span>
                  </div>

                  <ol className="list-decimal pl-4 space-y-2.5">
                    <li>
                      Buka aplikasi <strong>Mobile Banking</strong> bank apa saja yang Anda gunakan.
                    </li>
                    <li>
                      Pilih menu <strong>Transfer</strong> &rarr; <strong>Transfer Antar Bank</strong>.
                    </li>
                    <li>
                      Pada pilihan Jenis / Layanan Transfer, pilih opsi <strong>BI-FAST</strong>.
                    </li>
                    <li>
                      Pilih Bank Tujuan (contoh: Bank BCA, Bank Mandiri, Bank BRI, dll) sesuai rekening kami di bawah.
                    </li>
                    <li>
                      Masukkan nomor rekening tujuan resmi dan nominal pembayaran tepat <strong className="text-accent">{formatIDR(booking.totalPrice)}</strong>.
                    </li>
                    <li>
                      Tuliskan Kode Booking <strong className="font-mono text-primary bg-gray-100 px-1 py-0.5 rounded">{booking.code}</strong> pada catatan/berita transfer.
                    </li>
                    <li>
                      Konfirmasi rincian pembayaran, masukkan PIN m-Banking Anda hingga transaksi sukses.
                    </li>
                    <li>
                      <strong className="text-emerald-700">Simpan / screenshot resi pembayaran sukses</strong> dan unggah di formulir bukti pembayaran.
                    </li>
                  </ol>
                </div>
              )}

              {/* Tab 3: ATM */}
              {tutorialTab === "atm" && (
                <div className="space-y-3 animate-fade-in">
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2">
                    <Building className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <span className="text-[11px] leading-relaxed">
                      Jika Anda melakukan pembayaran via mesin ATM, pastikan Anda <strong>menyimpan struk bukti fisik</strong> dan memfotonya dengan jelas.
                    </span>
                  </div>

                  <ol className="list-decimal pl-4 space-y-2.5">
                    <li>
                      Kunjungi gerai <strong>mesin ATM terdekat</strong> (ATM Bersama, Prima, atau ATM bank Anda).
                    </li>
                    <li>
                      Masukkan kartu debit/ATM dan 6 digit PIN ATM Anda dengan aman.
                    </li>
                    <li>
                      Pilih menu <strong>Transaksi Lainnya</strong> &rarr; <strong>Transfer</strong>.
                    </li>
                    <li>
                      Pilih <strong>Ke Rekening Bank Sama</strong> atau <strong>Ke Rekening Bank Lain</strong> (masukkan kode bank 3 angka terlebih dahulu jika antar bank).
                    </li>
                    <li>
                      Masukkan nomor rekening tujuan resmi {siteName}.
                    </li>
                    <li>
                      Masukkan jumlah transfer tepat sejumlah <strong className="text-accent">{formatIDR(booking.totalPrice)}</strong>.
                    </li>
                    <li>
                      Periksa data yang tampil di layar mesin ATM (Nama Penerima, No. Rekening, dan Nominal). Jika sudah sesuai, tekan <strong>YA / Benar</strong>.
                    </li>
                    <li>
                      <strong className="text-emerald-700">Ambil kertas struk transfer yang keluar dari mesin ATM</strong>, kemudian ambil foto yang jelas dari struk tersebut untuk diunggah di web ini.
                    </li>
                  </ol>
                </div>
              )}

              {/* Quick Copy Rekening inside Modal */}
              <div className="pt-3 border-t border-gray-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary text-[11px] uppercase tracking-wider block">
                    Pilihan Rekening Resmi {siteName}:
                  </span>
                  <span className="text-[10px] text-gray-400">Klik &quot;Salin&quot; untuk menyalin nomor</span>
                </div>

                <div className="space-y-2">
                  {activeBankAccounts.map((bank) => {
                    const cleanNum = bank.accountNumber.replace(/\s+/g, "");
                    const isCopied = copiedBank === `modal-${bank.id}`;

                    return (
                      <div
                        key={`modal-${bank.id}`}
                        className="p-3 rounded-2xl bg-gray-50/80 border border-gray-200/70 flex items-center justify-between hover:bg-gray-100/60 transition"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-accent shrink-0" />
                            <span className="font-bold text-primary text-xs">{bank.bankName}</span>
                          </div>
                          <span className="font-mono text-sm font-bold text-gray-900 tracking-wide block mt-0.5">
                            {bank.accountNumber}
                          </span>
                          <span className="text-[11px] text-gray-500 block">
                            a.n. {bank.accountHolder}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(cleanNum, `modal-${bank.id}`)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:border-accent hover:text-accent transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 ml-2"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{isCopied ? "Tersalin!" : "Salin"}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 sm:px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-gray-500 flex items-center gap-1.5 w-full sm:w-auto">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Setelah transfer, langsung unggah bukti bayar Anda di bawah.</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTutorialModal(false)}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-xs transition cursor-pointer shadow-xs text-center"
              >
                Saya Mengerti, Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
