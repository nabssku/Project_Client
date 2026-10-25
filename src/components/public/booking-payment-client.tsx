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
} from "lucide-react";
import { type BankAccount, DEFAULT_BANK_ACCOUNTS } from "@/lib/payment-config";
import { downloadBookingPDF } from "@/lib/booking-pdf";

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
  createdAt: string | Date;
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
}: {
  initialBooking: BookingData;
  bankAccounts?: BankAccount[];
}) {
  const [booking, setBooking] = useState<BookingData>(initialBooking);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

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
  const handleDownloadPDF = () => {
    try {
      setDownloadingPdf(true);
      downloadBookingPDF({
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
        createdAt: booking.createdAt,
        villa: {
          name: booking.villa.name,
          location: booking.villa.location,
          checkInTime: booking.villa.checkInTime,
          checkOutTime: booking.villa.checkOutTime,
        },
      });
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

  // WhatsApp verification message
  const waPhone = "628111141052";
  const waText = `Halo Admin Singgahsana, saya telah melakukan pembayaran untuk Booking Code: *${booking.code}* atas nama *${booking.guestName}* (${booking.villa.name}). Mohon dibantu verifikasi. Terima kasih!`;
  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}`;

  const checkInDate = typeof booking.checkIn === "string" ? parseISO(booking.checkIn) : new Date(booking.checkIn);
  const checkOutDate = typeof booking.checkOut === "string" ? parseISO(booking.checkOut) : new Date(booking.checkOut);

  return (
    <div className="min-h-screen bg-[#faf9f5] pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Status Header Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm text-center mb-6">
          {booking.status === "COMPLETED" ? (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 text-[#C8A44E] mb-4 shadow-xs">
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
            {booking.status === "COMPLETED"
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
            {booking.status === "COMPLETED"
              ? `Terima kasih telah menginap di ${booking.villa.name}! Kami mengundang Anda untuk memberikan ulasan pengalaman liburan Anda.`
              : booking.status === "CHECKED_IN"
              ? `Selamat menikmati waktu liburan Anda di ${booking.villa.name}!`
              : booking.status === "CONFIRMED"
              ? "Reservasi Anda telah berhasil dikonfirmasi. Sampai jumpa di villa!"
              : booking.paymentProofUrl
              ? "Terima kasih! Bukti transfer Anda sudah kami terima dan sedang diverifikasi oleh Tim Singgahsana."
              : "Selesaikan pembayaran Anda untuk mengamankan tanggal menginap di villa."}
          </p>

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
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#C8A44E]/20 text-[#C8A44E] border border-[#C8A44E]/30 shadow-xs">
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
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#C8A44E] px-4 py-2.5 text-xs font-bold text-[#1a1a2e] shadow-md transition hover:bg-[#d6b25a] active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Download Dokumen PDF Resmi"
              >
                {downloadingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#1a1a2e]" />
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
                  <Loader2 className="h-4 w-4 animate-spin text-[#C8A44E]" />
                ) : (
                  <Mail className="h-4 w-4 text-[#C8A44E]" />
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
                      <div className="flex items-center gap-2 text-[#C8A44E] mb-1">
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
                          <span className="text-sm font-bold text-[#C8A44E] w-6 text-right">
                            {overallRating}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Text Review */}
                    <div>
                      <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                        Ulasan Pengalaman Menginap <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={reviewContent}
                        onChange={(e) => setReviewContent(e.target.value)}
                        placeholder="Ceritakan momen terbaik Anda selama liburan di villa ini (suasana, fasilitas favorit, keramahan staf)..."
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#e8e6df] bg-white text-gray-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                      />
                    </div>

                    {/* Reviewer Name */}
                    <div>
                      <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                        Nama yang Ditampilkan
                      </label>
                      <input
                        type="text"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        placeholder={booking.guestName}
                        className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={reviewSubmitting || !reviewContent.trim()}
                      className="w-full py-3 rounded-xl bg-[#C8A44E] hover:bg-[#b8933e] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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

            {/* Payment Details Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-base font-bold font-display text-primary mb-4">
                Total Tagihan Pembayaran
              </h2>

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

              {/* QRIS Display */}
              {booking.paymentMethod === "QRIS" ? (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl border border-gray-100 bg-[#fafafa] flex flex-col items-center text-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
                      QRIS Nasional Singgahsana
                    </span>
                    <div className="relative w-52 h-52 bg-white p-3 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=SINGGAHSANA-VILLA-RESERVATION"
                        alt="QRIS Pembayaran"
                        width={200}
                        height={200}
                        className="object-contain"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-3 max-w-xs">
                      Buka aplikasi m-Banking (BCA, Mandiri, BRI, BNI) atau e-Wallet (GoPay, OVO, ShopeePay, Dana), lalu scan kode QR di atas.
                    </p>
                  </div>
                </div>
              ) : (
                /* Bank Transfer Accounts (Dynamically loaded from site_configs) */
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Pilihan Rekening Resmi Singgahsana
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
                </div>
              )}
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

              {booking.paymentProofUrl ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileCheck className="w-6 h-6 text-emerald-600" />
                      <div>
                        <span className="text-xs font-bold text-emerald-900 block">
                          Bukti Berhasil Diunggah
                        </span>
                        <span className="text-[11px] text-emerald-700">
                          {booking.paymentProofUploadedAt
                            ? `Diunggah pada ${format(
                                new Date(booking.paymentProofUploadedAt),
                                "d MMM yyyy, HH:mm",
                                { locale: localeId }
                              )} WIB`
                            : "Siap diperiksa staf Singgahsana"}
                        </span>
                      </div>
                    </div>
                    <a
                      href={booking.paymentProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
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
                  <Download className="w-3.5 h-3.5 text-[#C8A44E]" />
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
    </div>
  );
}
