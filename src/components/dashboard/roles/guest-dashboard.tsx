"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { formatIDR } from "@/lib/pricing";
import { normalizeMediaUrl } from "@/lib/media";
import { downloadBookingPDF, type BookingPDFData } from "@/lib/booking-pdf";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Download,
  Phone,
  ArrowRight,
  User,
  KeyRound,
  ShieldCheck,
  ExternalLink,
  MapPin,
  Sparkles,
  Tag,
  Building2,
  Loader2,
  Info,
  CalendarCheck2,
  CalendarX,
  CreditCard,
  MessageCircle,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

export interface GuestBookingItem {
  id: string;
  code: string;
  villaId: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  guestCity?: string | null;
  companionType?: string | null;
  guestsCount: number;
  checkIn: string | Date;
  checkOut: string | Date;
  totalPrice: number;
  discountAmount: number;
  promoCode?: string | null;
  addonsTotal: number;
  status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED";
  notes?: string | null;
  rejectionReason?: string | null;
  paymentMethod: string;
  paymentProofUrl?: string | null;
  paymentProofUploadedAt?: string | Date | null;
  createdAt: string | Date;
  villa: {
    id: string;
    name: string;
    slug: string;
    location: string;
    images: string[];
    checkInTime?: string;
    checkOutTime?: string;
    pricePerNight?: number;
  };
  addons?: Array<{
    id: string;
    name: string;
    price: number;
    qty: number;
    subtotal: number;
    unit?: string;
  }>;
}

interface GuestDashboardProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
  data: {
    bookings: GuestBookingItem[];
    user: {
      id: string;
      name: string;
      email: string;
      createdAt: string | Date;
      avatar?: string | null;
    } | null;
    siteName: string;
    siteLogo: string | null;
    contactPhone: string;
  };
}

export function GuestDashboard({ currentUser, data }: GuestDashboardProps) {
  const { bookings, user, siteName, siteLogo, contactPhone } = data;

  const [activeTab, setActiveTab] = useState<"active" | "history" | "profile">("active");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Profile Form States
  const [name, setName] = useState(user?.name || currentUser.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileToast, setProfileToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Group Bookings into Active and Past
  const activeBookings = useMemo(() => {
    return bookings.filter(
      (b) => b.status === "PENDING" || b.status === "CONFIRMED" || b.status === "CHECKED_IN"
    );
  }, [bookings]);

  const pastBookings = useMemo(() => {
    return bookings.filter(
      (b) => b.status === "COMPLETED" || b.status === "CANCELLED"
    );
  }, [bookings]);

  // Total Nights Stayed calculation
  const totalNights = useMemo(() => {
    return bookings
      .filter((b) => b.status === "CONFIRMED" || b.status === "CHECKED_IN" || b.status === "COMPLETED")
      .reduce((sum, b) => {
        const inDate = typeof b.checkIn === "string" ? parseISO(b.checkIn) : new Date(b.checkIn);
        const outDate = typeof b.checkOut === "string" ? parseISO(b.checkOut) : new Date(b.checkOut);
        const diff = Math.max(1, differenceInCalendarDays(outDate, inDate));
        return sum + diff;
      }, 0);
  }, [bookings]);

  // Copy booking code helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // PDF Download trigger
  const handleDownloadPDF = async (booking: GuestBookingItem) => {
    try {
      setDownloadingId(booking.id);
      const pdfData: BookingPDFData = {
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
        paymentProofUrl: booking.paymentProofUrl,
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
          checkInTime: booking.villa.checkInTime || "14:00",
          checkOutTime: booking.villa.checkOutTime || "12:00",
        },
      };

      await downloadBookingPDF(pdfData, siteName, siteLogo);
    } catch (err) {
      console.error("Failed to generate PDF voucher:", err);
      alert("Gagal mengunduh dokumen voucher. Silakan coba beberapa saat lagi.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileToast(null);

    if (!name.trim()) {
      setProfileToast({ type: "error", message: "Nama lengkap wajib diisi." });
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        setProfileToast({
          type: "error",
          message: "Masukkan kata sandi saat ini untuk menyetujui perubahan kata sandi baru.",
        });
        return;
      }
      if (newPassword.length < 6) {
        setProfileToast({
          type: "error",
          message: "Kata sandi baru minimal 6 karakter.",
        });
        return;
      }
      if (newPassword !== confirmPassword) {
        setProfileToast({
          type: "error",
          message: "Konfirmasi kata sandi baru tidak cocok.",
        });
        return;
      }
    }

    setSavingProfile(true);

    try {
      const payload: any = { name: name.trim() };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal memperbarui profil.");
      }

      setProfileToast({
        type: "success",
        message: data.message || "Profil berhasil diperbarui!",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setProfileToast({
        type: "error",
        message: err.message || "Terjadi kesalahan saat menyimpan data.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const getStatusBadge = (status: GuestBookingItem["status"]) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>Menunggu Pembayaran</span>
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Terkonfirmasi (Siap Check-in)</span>
          </span>
        );
      case "CHECKED_IN":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Sedang Menginap</span>
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Selesai Menginap</span>
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Dibatalkan</span>
          </span>
        );
    }
  };

  const formatDateRange = (checkIn: string | Date, checkOut: string | Date) => {
    const inDate = typeof checkIn === "string" ? parseISO(checkIn) : new Date(checkIn);
    const outDate = typeof checkOut === "string" ? parseISO(checkOut) : new Date(checkOut);
    const nights = Math.max(1, differenceInCalendarDays(outDate, inDate));

    return {
      inFormatted: format(inDate, "EEEE, d MMM yyyy", { locale: localeId }),
      outFormatted: format(outDate, "EEEE, d MMM yyyy", { locale: localeId }),
      nights,
    };
  };

  const cleanPhone = (contactPhone || "628111141052").replace(/\D/g, "").replace(/^0/, "62");

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. Hero Welcome & Overview Card */}
      <div className="relative overflow-hidden rounded-3xl bg-primary text-white p-6 sm:p-8 lg:p-10 shadow-xl border border-primary-dark">
        {/* Subtle Luxury Pattern / Glow Background */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-accent text-primary-dark font-display font-black text-2xl flex items-center justify-center shrink-0 shadow-lg border border-accent-light">
              {(user?.name || currentUser.name || "G").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs uppercase tracking-widest text-accent font-bold">
                  Portal Tamu {siteName}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/90 border border-white/20">
                  <ShieldCheck className="w-3 h-3 text-accent" />
                  <span>Tamu Terdaftar</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-white mt-1">
                Selamat Datang, {user?.name || currentUser.name}
              </h1>
              <p className="text-xs sm:text-sm text-white/75 mt-1 max-w-xl leading-relaxed">
                Pantau reservasi villa Anda yang sedang berjalan, unduh voucher & invoice resmi, serta kelola informasi profil akun Anda dengan mudah.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/villas"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-primary-dark font-bold text-xs hover:bg-accent-light transition-all shadow-md active:scale-95"
            >
              <Building2 className="w-4 h-4" />
              <span>Cari & Pesan Villa</span>
            </Link>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] font-medium text-white/60 block">Pesanan Berjalan</span>
            <span className="text-xl sm:text-2xl font-bold font-display text-white mt-1 block">
              {activeBookings.length}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] font-medium text-white/60 block">Total Menginap</span>
            <span className="text-xl sm:text-2xl font-bold font-display text-accent mt-1 block">
              {totalNights} Malam
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] font-medium text-white/60 block">Riwayat Selesai</span>
            <span className="text-xl sm:text-2xl font-bold font-display text-white mt-1 block">
              {pastBookings.filter((b) => b.status === "COMPLETED").length}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] font-medium text-white/60 block">Status Akun</span>
            <span className="text-xs sm:text-sm font-bold text-emerald-400 mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Aktif & Terverifikasi</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e8e6df] pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("active")}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "active"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Pesanan Berjalan</span>
          <span
            className={`text-[11px] px-2 py-0.2 rounded-full font-bold ${
              activeTab === "active" ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {activeBookings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Riwayat Reservasi</span>
          <span
            className={`text-[11px] px-2 py-0.2 rounded-full font-bold ${
              activeTab === "history" ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {pastBookings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "profile"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Pengaturan Akun</span>
        </button>
      </div>

      {/* 3. TAB 1: Pesanan Berjalan (Active Bookings) */}
      {activeTab === "active" && (
        <div className="space-y-6">
          {activeBookings.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#e8e6df] text-center shadow-2xs">
              <div className="w-16 h-16 rounded-full bg-accent/15 text-accent flex items-center justify-center mx-auto mb-4">
                <CalendarCheck2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold font-display text-primary">
                Belum Ada Pesanan yang Sedang Berjalan
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
                Saat ini Anda belum memiliki pesanan aktif. Temukan unit villa eksklusif di Puncak Bogor dengan fasilitas kolam renang privat dan panorama alam terbaik.
              </p>
              <div className="mt-6">
                <Link
                  href="/villas"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary-dark transition-all shadow-xs"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Jelajahi Katalog Villa</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {activeBookings.map((b) => {
                const dates = formatDateRange(b.checkIn, b.checkOut);
                const isDownloading = downloadingId === b.id;
                const villaImage = b.villa.images?.[0] || "/placeholder-villa.jpg";

                const waText = `Halo Concierge ${siteName}, saya tamu dengan Booking Code: *${b.code}* di ${b.villa.name}. Saya ingin menanyakan informasi kedatangan / check-in. Terima kasih.`;
                const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`;

                return (
                  <div
                    key={b.id}
                    className="rounded-3xl bg-white border border-[#e8e6df] shadow-sm hover:shadow-md transition-all overflow-hidden"
                  >
                    {/* Top status bar */}
                    <div className="px-5 sm:px-7 py-3 bg-[#faf9f6] border-b border-[#e8e6df] flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs text-slate-500 font-medium">Kode Booking:</span>
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-[#e8e6df]">
                          <span className="font-mono font-bold text-xs text-primary">{b.code}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(b.code)}
                            className="text-slate-400 hover:text-primary transition-colors cursor-pointer"
                            title="Salin Kode Booking"
                          >
                            {copiedCode === b.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>{getStatusBadge(b.status)}</div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 sm:p-7">
                      <div className="flex flex-col md:flex-row gap-5 lg:gap-6">
                        {/* Villa Image Banner */}
                        <div className="relative w-full md:w-56 lg:w-64 h-44 sm:h-48 md:h-auto rounded-2xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                          <Image
                            src={normalizeMediaUrl(villaImage)}
                            alt={b.villa.name}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-accent" />
                            <span className="truncate max-w-[120px]">{b.villa.location}</span>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-between space-y-4">
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-display text-lg sm:text-xl font-bold text-primary hover:text-accent transition-colors">
                                <Link href={`/villas/${b.villa.slug}`}>{b.villa.name}</Link>
                              </h3>
                              <span className="text-xs text-slate-400 shrink-0">
                                Dipesan {format(new Date(b.createdAt), "d MMM yyyy", { locale: localeId })}
                              </span>
                            </div>

                            {/* Schedule Chips */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-slate-100">
                              <div className="p-2.5 rounded-xl bg-[#faf9f6] border border-[#e8e6df]">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                                  Check-In (Mulai Pukul {b.villa.checkInTime || "14:00"})
                                </span>
                                <span className="text-xs font-semibold text-primary mt-0.5 block">
                                  {dates.inFormatted}
                                </span>
                              </div>
                              <div className="p-2.5 rounded-xl bg-[#faf9f6] border border-[#e8e6df]">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                                  Check-Out (Maksimal Pukul {b.villa.checkOutTime || "12:00"})
                                </span>
                                <span className="text-xs font-semibold text-primary mt-0.5 block">
                                  {dates.outFormatted}
                                </span>
                              </div>
                            </div>

                            {/* Addons List if any */}
                            {b.addons && b.addons.length > 0 && (
                              <div className="mt-3 flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] font-semibold text-slate-600">Add-on:</span>
                                {b.addons.map((a) => (
                                  <span
                                    key={a.id}
                                    className="text-[10px] px-2 py-0.5 rounded-md bg-accent/10 text-accent font-semibold border border-accent/20"
                                  >
                                    {a.name} ({a.qty} {a.unit || "pcs"})
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Guest count & Price Summary */}
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                              <div className="text-xs text-slate-500">
                                Total Menginap: <strong>{dates.nights} Malam</strong> ({b.guestsCount} Orang Tamu)
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] uppercase text-slate-400 font-bold block">
                                  Total Pembayaran
                                </span>
                                <span className="font-display text-base sm:text-lg font-bold text-accent">
                                  {formatIDR(b.totalPrice)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-2 flex flex-wrap items-center gap-2.5">
                            {b.status === "PENDING" ? (
                              <Link
                                href={`/booking/${b.code}`}
                                className="px-4 py-2 rounded-xl bg-accent text-primary-dark font-bold text-xs hover:bg-accent-light transition-all flex items-center gap-1.5 shadow-xs"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Rincian Rekening & Upload Bukti</span>
                              </Link>
                            ) : (
                              <button
                                type="button"
                                disabled={isDownloading}
                                onClick={() => handleDownloadPDF(b)}
                                className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-dark transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                              >
                                {isDownloading ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5 text-accent" />
                                )}
                                <span>Unduh Voucher & Invoice PDF</span>
                              </button>
                            )}

                            <Link
                              href={`/booking/${b.code}`}
                              className="px-3.5 py-2 rounded-xl bg-white border border-[#e8e6df] text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                            >
                              <span>Lihat Detail Lengkap</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </Link>

                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-semibold text-xs hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Bantuan Concierge</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: Riwayat Reservasi (Booking History) */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {pastBookings.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#e8e6df] text-center shadow-2xs">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold font-display text-primary">
                Belum Ada Riwayat Reservasi Lampau
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
                Reservasi villa yang telah selesai dikunjungi atau dibatalkan akan tercatat sebagai arsip riwayat perjalanan Anda di sini.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pastBookings.map((b) => {
                const dates = formatDateRange(b.checkIn, b.checkOut);
                const isDownloading = downloadingId === b.id;

                return (
                  <div
                    key={b.id}
                    className="p-5 sm:p-6 rounded-2xl bg-white border border-[#e8e6df] shadow-2xs hover:shadow-xs transition-shadow space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-display font-bold text-base sm:text-lg text-primary">
                            {b.villa.name}
                          </h4>
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {b.code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                          <span>{dates.inFormatted} — {dates.outFormatted} ({dates.nights} Malam)</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                          <span className="font-display font-bold text-sm text-primary">
                            {formatIDR(b.totalPrice)}
                          </span>
                        </div>
                        {getStatusBadge(b.status)}
                      </div>
                    </div>

                    {/* Rejection Reason Notice if Cancelled */}
                    {b.status === "CANCELLED" && b.rejectionReason && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                        <span className="font-bold block">Alasan Pembatalan / Penolakan Pengelola:</span>
                        <p className="text-rose-700/90 leading-relaxed">{b.rejectionReason}</p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                      <div className="text-[11px] text-slate-400">
                        Selesai diproses {format(new Date(b.createdAt), "d MMMM yyyy", { locale: localeId })}
                      </div>

                      <div className="flex items-center gap-2">
                        {b.status === "COMPLETED" && (
                          <button
                            type="button"
                            disabled={isDownloading}
                            onClick={() => handleDownloadPDF(b)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5"
                          >
                            {isDownloading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3 text-accent" />
                            )}
                            <span>Arsip Invoice</span>
                          </button>
                        )}

                        <Link
                          href={`/villas/${b.villa.slug}`}
                          className="px-3.5 py-1.5 rounded-lg bg-primary text-white font-semibold text-xs hover:bg-primary-dark transition-colors flex items-center gap-1"
                        >
                          <span>Pesan Lagi</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 3: Pengaturan Akun (Profile & Security) */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Account Profile Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#e8e6df] shadow-2xs space-y-6">
              <div>
                <h3 className="font-display font-bold text-lg text-primary">
                  Informasi Profil Tamu
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Perbarui nama lengkap dan data akun yang digunakan untuk bukti pemesanan villa.
                </p>
              </div>

              {profileToast && (
                <div
                  className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 animate-fade-in ${
                    profileToast.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}
                >
                  {profileToast.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{profileToast.message}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-5">
                {/* Email (Readonly) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat Email (Akun Utama)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || currentUser.email}
                    className="w-full h-10 px-3.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Alamat email terdaftar digunakan untuk menerima tiket voucher & kwitansi pembayaran.
                  </p>
                </div>

                {/* Nama Lengkap */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan nama lengkap Anda"
                    className="w-full h-10 px-3.5 text-xs rounded-xl border border-[#e8e6df] bg-white focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-accent transition-all"
                  />
                </div>

                {/* Password Change Section */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-accent" />
                      <span>Ganti Kata Sandi (Opsional)</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Biarkan kosong jika Anda tidak ingin mengubah kata sandi akun saat ini.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kata Sandi Saat Ini
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan kata sandi lama Anda"
                      className="w-full h-10 px-3.5 text-xs rounded-xl border border-[#e8e6df] bg-white focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-accent transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Kata Sandi Baru
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full h-10 px-3.5 text-xs rounded-xl border border-[#e8e6df] bg-white focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-accent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Konfirmasi Kata Sandi Baru
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi baru"
                        className="w-full h-10 px-3.5 text-xs rounded-xl border border-[#e8e6df] bg-white focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-accent transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary-dark transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {savingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Simpan Perubahan Profil</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Membership Summary & Security Info */}
          <div className="space-y-5">
            <div className="p-6 rounded-3xl bg-white border border-[#e8e6df] shadow-2xs space-y-4">
              <h4 className="font-display font-bold text-sm text-primary flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-accent" />
                <span>Keanggotaan & Keamanan</span>
              </h4>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-400">ID Tamu:</span>
                  <span className="font-mono text-[11px] font-bold text-slate-700">
                    {user?.id ? user.id.slice(0, 10) + "..." : currentUser.id.slice(0, 10) + "..."}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-400">Terdaftar Sejak:</span>
                  <span className="font-medium text-slate-700">
                    {user?.createdAt
                      ? format(new Date(user.createdAt), "d MMMM yyyy", { locale: localeId })
                      : "Member Aktif"}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-400">Total Transaksi:</span>
                  <span className="font-bold text-primary">{bookings.length} Pesanan</span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full py-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200/80 font-semibold text-xs hover:bg-rose-100 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar dari Akun</span>
                </button>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#faf9f6] border border-[#e8e6df] text-xs text-slate-500 space-y-2">
              <div className="flex items-center gap-2 font-bold text-primary">
                <Info className="w-4 h-4 text-accent" />
                <span>Butuh Bantuan Reservasi?</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Tim concierge kami siap membantu Anda 24/7 jika ingin mengubah jadwal, menambah tamu, atau konfirmasi pembayaran transfer bank.
              </p>
              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-accent font-semibold hover:underline mt-1"
              >
                <span>WhatsApp Customer Support</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
