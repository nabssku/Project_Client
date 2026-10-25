"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { formatIDR } from "@/lib/pricing";
import {
  CalendarDays,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  X,
  ExternalLink,
  MessageCircle,
  Loader2,
  Copy,
  ChevronRight,
  UserCheck,
  Building,
  Check,
  MoreVertical,
  Download,
  Edit3,
  CheckCheck,
  FileText,
  Trash2,
  Share2,
  CreditCard,
  Mail,
} from "lucide-react";
import { BankAccountsManagerModal } from "@/components/dashboard/settings/bank-accounts-manager-modal";
import { downloadBookingPDF } from "@/lib/booking-pdf";

interface VillaOption {
  id: string;
  name: string;
  slug: string;
  pricePerNight: number;
  priceWeekend?: number | null;
  capacity: number;
}

interface BookingItem {
  id: string;
  code: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestCity?: string | null;
  companionType?: string | null;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  totalPrice: number;
  discountAmount: number;
  promoCode?: string | null;
  status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED";
  paymentMethod: string;
  paymentProofUrl?: string | null;
  paymentProofUploadedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  villa: {
    id: string;
    name: string;
    slug: string;
  };
}

interface ManagerBookingsClientProps {
  initialBookings: BookingItem[];
  villas: VillaOption[];
  userRole: string;
}

export function ManagerBookingsClient({
  initialBookings,
  villas,
  userRole,
}: ManagerBookingsClientProps) {
  const [bookings, setBookings] = useState<BookingItem[]>(initialBookings);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [villaFilter, setVillaFilter] = useState<string>("ALL");

  // Proof Modal
  const [selectedProofBooking, setSelectedProofBooking] =
    useState<BookingItem | null>(null);

  // Status Change Modal
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    booking: BookingItem | null;
    targetStatus: BookingItem["status"];
    notes: string;
  }>({
    isOpen: false,
    booking: null,
    targetStatus: "CONFIRMED",
    notes: "",
  });

  // Action Menu Dropdown state (stores booking id)
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Download loading state
  const [downloadingCode, setDownloadingCode] = useState<string | null>(null);

  // Bank Accounts Settings Modal
  const [bankModalOpen, setBankModalOpen] = useState(false);

  // Direct Booking Modal
  const [directBookingOpen, setDirectBookingOpen] = useState(false);
  const [creatingDirect, setCreatingDirect] = useState(false);
  const [directVillaId, setDirectVillaId] = useState(villas[0]?.id || "");
  const [directCheckIn, setDirectCheckIn] = useState("");
  const [directCheckOut, setDirectCheckOut] = useState("");
  const [directGuestName, setDirectGuestName] = useState("");
  const [directGuestEmail, setDirectGuestEmail] = useState("");
  const [directGuestPhone, setDirectGuestPhone] = useState("");
  const [directGuestCity, setDirectGuestCity] = useState("");
  const [directGuestsCount, setDirectGuestsCount] = useState(2);
  const [directStatus, setDirectStatus] = useState<"CONFIRMED" | "PENDING">(
    "CONFIRMED"
  );
  const [directNotes, setDirectNotes] = useState("");
  const [directError, setDirectError] = useState("");
  const [createdDirectCode, setCreatedDirectCode] = useState<string | null>(
    null
  );

  // Status update loading state
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Copy toast state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const copyBookingSummary = (b: BookingItem) => {
    const summary = `*Reservasi Singgahsana Villa*
Kode Booking: ${b.code}
Villa: ${b.villa.name}
Nama Tamu: ${b.guestName}
WhatsApp: ${b.guestPhone}
Menginap: ${format(parseISO(b.checkIn), "d MMM yyyy", { locale: localeId })} s/d ${format(parseISO(b.checkOut), "d MMM yyyy", { locale: localeId })}
Tamu: ${b.guestsCount} orang
Total Biaya: ${formatIDR(b.totalPrice)}
Metode: ${b.paymentMethod}
Status: ${b.status}`;
    navigator.clipboard.writeText(summary);
    setOpenActionMenuId(null);
    alert("Ringkasan pesanan berhasil disalin ke clipboard!");
  };

  // Unduh Dokumen PDF Resmi (Invoice & Voucher Menginap)
  const handleDownloadPDF = (b: BookingItem) => {
    try {
      downloadBookingPDF({
        id: b.id,
        code: b.code,
        guestName: b.guestName,
        guestEmail: b.guestEmail,
        guestPhone: b.guestPhone,
        guestCity: b.guestCity,
        companionType: b.companionType,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        guestsCount: b.guestsCount,
        totalPrice: b.totalPrice,
        discountAmount: b.discountAmount,
        promoCode: b.promoCode,
        status: b.status,
        paymentMethod: b.paymentMethod,
        notes: b.notes,
        createdAt: b.createdAt,
        villa: {
          name: b.villa.name,
        },
      });
    } catch (err) {
      console.error("Gagal mengunduh dokumen PDF:", err);
      alert("Gagal mengunduh dokumen PDF.");
    }
  };

  // Kirim Ulang Email Konfirmasi & Voucher via Resend
  const [sendingEmailCode, setSendingEmailCode] = useState<string | null>(null);
  const handleSendEmail = async (b: BookingItem) => {
    try {
      setSendingEmailCode(b.code);
      const res = await fetch(`/api/bookings/${b.code}/email`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim email konfirmasi");
      alert(data.message || `Email voucher dan invoice PDF berhasil dikirim ke ${b.guestEmail}!`);
    } catch (err: any) {
      alert(err.message || "Gagal mengirim email voucher.");
    } finally {
      setSendingEmailCode(null);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === "PENDING").length;
    const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length;
    const checkedIn = bookings.filter((b) => b.status === "CHECKED_IN").length;
    const completed = bookings.filter((b) => b.status === "COMPLETED").length;
    return { total, pending, confirmed, checkedIn, completed };
  }, [bookings]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Status
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      // Villa
      if (villaFilter !== "ALL" && b.villa.id !== villaFilter) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = b.code.toLowerCase().includes(q);
        const matchName = b.guestName.toLowerCase().includes(q);
        const matchEmail = b.guestEmail.toLowerCase().includes(q);
        const matchPhone = b.guestPhone.includes(q);
        const matchVilla = b.villa.name.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchEmail && !matchPhone && !matchVilla)
          return false;
      }
      return true;
    });
  }, [bookings, statusFilter, villaFilter, searchQuery]);

  // Update Booking Status Handler
  const handleUpdateStatus = async (
    bookingId: string,
    newStatus: BookingItem["status"],
    notes?: string
  ) => {
    setUpdatingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal memperbarui status");
      }

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                status: newStatus,
                notes: notes
                  ? `${b.notes ? b.notes + "\n" : ""}[Catatan Admin]: ${notes}`
                  : b.notes,
              }
            : b
        )
      );

      if (selectedProofBooking?.id === bookingId) {
        setSelectedProofBooking((prev) =>
          prev ? { ...prev, status: newStatus } : null
        );
      }
      if (statusModal.isOpen && statusModal.booking?.id === bookingId) {
        setStatusModal((prev) => ({ ...prev, isOpen: false }));
      }
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui status");
    } finally {
      setUpdatingId(null);
    }
  };

  // Open Status Modal helper
  const openStatusModal = (
    booking: BookingItem,
    defaultStatus?: BookingItem["status"]
  ) => {
    setOpenActionMenuId(null);
    setStatusModal({
      isOpen: true,
      booking,
      targetStatus: defaultStatus || booking.status,
      notes: "",
    });
  };

  // Handle Download Transfer Proof
  const handleDownloadProof = async (url: string, code: string) => {
    setDownloadingCode(code);
    try {
      const cleanUrl = url.split("?")[0];
      const ext = cleanUrl.split(".").pop() || "jpg";
      const filename = `${code}-bukti-transfer.${ext}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Gagal mengambil file gambar bukti");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn("Direct blob download failed, opening in new tab:", err);
      window.open(url, "_blank");
    } finally {
      setDownloadingCode(null);
    }
  };

  // Submit Direct Booking
  const handleCreateDirectBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setDirectError("");
    setCreatingDirect(true);

    try {
      const payload = {
        villaId: directVillaId,
        checkIn: directCheckIn,
        checkOut: directCheckOut,
        guestsCount: directGuestsCount,
        guestName: directGuestName.trim(),
        guestEmail: directGuestEmail.trim().toLowerCase(),
        guestPhone: directGuestPhone.trim(),
        guestCity: directGuestCity.trim() || undefined,
        notes: directNotes.trim() || undefined,
        directBookingStatus: directStatus,
      };

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal membuat booking langsung");
      }

      setCreatedDirectCode(data.booking.code);
      setBookings((prev) => [data.booking, ...prev]);
    } catch (err: any) {
      setDirectError(err.message || "Gagal membuat booking langsung");
    } finally {
      setCreatingDirect(false);
    }
  };

  const getStatusBadge = (status: BookingItem["status"], isInteractive = false) => {
    const baseClasses =
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all select-none";

    switch (status) {
      case "CONFIRMED":
        return (
          <span
            className={`${baseClasses} bg-emerald-100 text-emerald-800 ${
              isInteractive ? "hover:bg-emerald-200 cursor-pointer shadow-xs" : ""
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Terkonfirmasi</span>
          </span>
        );
      case "CHECKED_IN":
        return (
          <span
            className={`${baseClasses} bg-blue-100 text-blue-800 ${
              isInteractive ? "hover:bg-blue-200 cursor-pointer shadow-xs" : ""
            }`}
          >
            <Building className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Check-In</span>
          </span>
        );
      case "COMPLETED":
        return (
          <span
            className={`${baseClasses} bg-purple-100 text-purple-800 ${
              isInteractive ? "hover:bg-purple-200 cursor-pointer shadow-xs" : ""
            }`}
          >
            <CheckCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>Selesai</span>
          </span>
        );
      case "CANCELLED":
        return (
          <span
            className={`${baseClasses} bg-rose-100 text-rose-800 ${
              isInteractive ? "hover:bg-rose-200 cursor-pointer shadow-xs" : ""
            }`}
          >
            <X className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Dibatalkan</span>
          </span>
        );
      default:
        return (
          <span
            className={`${baseClasses} bg-amber-100 text-amber-800 ${
              isInteractive ? "hover:bg-amber-200 cursor-pointer shadow-xs" : ""
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-pulse" />
            <span>Menunggu Verifikasi</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-primary">
            Manajemen Reservasi & Booking
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Kelola operasional reservasi, verifikasi bukti pembayaran, dan buat booking langsung.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setCreatedDirectCode(null);
              setDirectError("");
              setDirectBookingOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-accent text-white font-semibold text-xs sm:text-sm hover:bg-accent-light transition-all shadow-md shadow-accent/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Booking Langsung</span>
          </button>
        </div>
      </div>

      {/* Operational Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-xs">
          <span className="text-xs text-gray-400 font-medium">Total Pesanan</span>
          <p className="text-xl sm:text-2xl font-bold text-primary mt-1">
            {metrics.total}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-amber-200/60 shadow-xs bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-800 font-medium">Perlu Verifikasi</span>
            {metrics.pending > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            )}
          </div>
          <p className="text-xl sm:text-2xl font-bold text-amber-700 mt-1">
            {metrics.pending}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-xs">
          <span className="text-xs text-gray-400 font-medium">Terkonfirmasi</span>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">
            {metrics.confirmed}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-xs">
          <span className="text-xs text-gray-400 font-medium">Sedang Menginap</span>
          <p className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">
            {metrics.checkedIn}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: "Semua" },
            { id: "PENDING", label: `Menunggu (${metrics.pending})` },
            { id: "CONFIRMED", label: "Terkonfirmasi" },
            { id: "CHECKED_IN", label: "Check-In" },
            { id: "COMPLETED", label: "Selesai" },
            { id: "CANCELLED", label: "Dibatalkan" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-primary text-white"
                  : "bg-gray-100/80 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Villa & Keyword Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={villaFilter}
            onChange={(e) => setVillaFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white text-gray-700 focus:outline-none"
          >
            <option value="ALL">Semua Villa</option>
            {villas.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>

          <div className="relative flex-1 md:w-60">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari kode / nama / WA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#faf9f5] border-b border-gray-100 text-gray-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Kode & Tanggal</th>
                <th className="py-3.5 px-4">Tamu</th>
                <th className="py-3.5 px-4">Villa</th>
                <th className="py-3.5 px-4">Menginap</th>
                <th className="py-3.5 px-4">Total & Metode</th>
                <th className="py-3.5 px-4">Bukti Bayar</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Tombol Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((b) => {
                  const checkInDate = parseISO(b.checkIn);
                  const checkOutDate = parseISO(b.checkOut);
                  const isMenuOpen = openActionMenuId === b.id;

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-gray-50/60 transition-colors relative"
                    >
                      {/* Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-primary">
                            {b.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyCode(b.code)}
                            className="text-gray-400 hover:text-accent transition-colors cursor-pointer"
                            title="Salin Kode Booking"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        {copiedCode === b.code && (
                          <span className="text-[10px] text-emerald-600 font-semibold block animate-fade-in">
                            Tersalin!
                          </span>
                        )}
                        <span className="text-[11px] text-gray-400 block mt-0.5">
                          {format(parseISO(b.createdAt), "d MMM, HH:mm", {
                            locale: localeId,
                          })}
                        </span>
                      </td>

                      {/* Guest */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-gray-900 block">
                          {b.guestName}
                        </span>
                        <a
                          href={`https://wa.me/${b.guestPhone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1 mt-0.5 font-medium"
                          title="Chat via WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3 shrink-0" />
                          <span>{b.guestPhone}</span>
                        </a>
                        {b.guestCity && (
                          <span className="text-[10px] text-gray-400 block">
                            {b.guestCity}
                          </span>
                        )}
                      </td>

                      {/* Villa */}
                      <td className="py-3.5 px-4 font-medium text-gray-800">
                        <span className="block font-semibold">{b.villa.name}</span>
                        <span className="text-[10px] text-gray-400 block">
                          {b.guestsCount} Tamu
                        </span>
                      </td>

                      {/* Stay Dates */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-gray-800 block">
                          {format(checkInDate, "d MMM", { locale: localeId })} -{" "}
                          {format(checkOutDate, "d MMM yyyy", { locale: localeId })}
                        </span>
                        <span className="text-[10px] text-gray-400 block">
                          {Math.round(
                            (checkOutDate.getTime() - checkInDate.getTime()) /
                              (1000 * 3600 * 24)
                          )}{" "}
                          malam
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-accent tabular-nums block">
                          {formatIDR(b.totalPrice)}
                        </span>
                        <span className="text-[10px] text-gray-500 block uppercase font-medium">
                          {b.paymentMethod}
                        </span>
                      </td>

                      {/* Payment Proof with Preview & Direct Download */}
                      <td className="py-3.5 px-4">
                        {b.paymentProofUrl ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedProofBooking(b)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-[11px] hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-200/50 shadow-2xs"
                              title="Lihat Bukti Transfer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Lihat</span>
                            </button>

                            <button
                              type="button"
                              disabled={downloadingCode === b.code}
                              onClick={() =>
                                handleDownloadProof(b.paymentProofUrl!, b.code)
                              }
                              className="p-1.5 rounded-xl bg-gray-100 text-gray-600 hover:text-primary hover:bg-gray-200 transition-colors cursor-pointer border border-gray-200/50 shadow-2xs disabled:opacity-50"
                              title="Unduh File Bukti Transfer"
                            >
                              {downloadingCode === b.code ? (
                                <Loader2 className="w-3 h-3 animate-spin text-accent" />
                              ) : (
                                <Download className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 italic">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>Belum Ada</span>
                          </span>
                        )}
                      </td>

                      {/* Status - Interactive Badge (Click to open Status Modal) */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => openStatusModal(b)}
                          className="group inline-flex items-center gap-1 cursor-pointer focus:outline-none"
                          title="Klik untuk mengubah status pesanan & catatan"
                        >
                          {getStatusBadge(b.status, true)}
                          <Edit3 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </td>

                      {/* Actions Column: Contextual Quick Button + 3-Dots Dropdown */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="relative inline-flex items-center justify-end gap-1.5">
                          {/* 1. Contextual Quick Action Button */}
                          {b.status === "PENDING" && (
                            <button
                              type="button"
                              disabled={updatingId === b.id}
                              onClick={() => openStatusModal(b, "CONFIRMED")}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-all shadow-xs disabled:opacity-40 cursor-pointer"
                              title="Verifikasi & Konfirmasi Pembayaran"
                            >
                              {updatingId === b.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Verifikasi</span>
                                </>
                              )}
                            </button>
                          )}

                          {b.status === "CONFIRMED" && (
                            <button
                              type="button"
                              disabled={updatingId === b.id}
                              onClick={() =>
                                handleUpdateStatus(b.id, "CHECKED_IN")
                              }
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-all shadow-xs disabled:opacity-40 cursor-pointer"
                              title="Tamu Datang & Check-In di Villa"
                            >
                              {updatingId === b.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <Building className="w-3.5 h-3.5" />
                                  <span>Check-In</span>
                                </>
                              )}
                            </button>
                          )}

                          {b.status === "CHECKED_IN" && (
                            <button
                              type="button"
                              disabled={updatingId === b.id}
                              onClick={() =>
                                handleUpdateStatus(b.id, "COMPLETED")
                              }
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 text-white font-semibold text-xs hover:bg-purple-700 transition-all shadow-xs disabled:opacity-40 cursor-pointer"
                              title="Tamu Selesai Menginap (Check-Out)"
                            >
                              {updatingId === b.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <CheckCheck className="w-3.5 h-3.5" />
                                  <span>Selesai</span>
                                </>
                              )}
                            </button>
                          )}

                          {(b.status === "COMPLETED" || b.status === "CANCELLED") && (
                            <button
                              type="button"
                              onClick={() => openStatusModal(b)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gray-100 text-gray-600 font-semibold text-xs hover:bg-gray-200 transition-colors cursor-pointer"
                              title="Ubah Status / Catatan"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Ubah</span>
                            </button>
                          )}

                          {/* Quick Direct Download PDF Button */}
                          <button
                            type="button"
                            onClick={() => handleDownloadPDF(b)}
                            className="p-1.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-[#C8A44E] hover:border-[#C8A44E] hover:bg-amber-50/50 transition-colors cursor-pointer"
                            title="Unduh Invoice & Voucher Tamu (PDF)"
                          >
                            <FileText className="w-4 h-4 text-[#C8A44E]" />
                          </button>

                          {/* 2. Three-Dots Menu Trigger */}
                          <button
                            type="button"
                            onClick={() =>
                              setOpenActionMenuId(isMenuOpen ? null : b.id)
                            }
                            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                              isMenuOpen
                                ? "bg-primary text-white border-primary"
                                : "bg-white text-gray-500 border-gray-200 hover:text-gray-800 hover:bg-gray-100"
                            }`}
                            title="Menu Aksi Lainnya"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* 3. Dropdown Menu */}
                          {isMenuOpen && (
                            <>
                              {/* Click-outside backdrop */}
                              <div
                                className="fixed inset-0 z-20"
                                onClick={() => setOpenActionMenuId(null)}
                              />

                              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-30 py-1.5 text-left animate-fade-in divide-y divide-gray-100">
                                <div className="py-1">
                                  {/* Ubah Status */}
                                  <button
                                    type="button"
                                    onClick={() => openStatusModal(b)}
                                    className="w-full px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-accent" />
                                    <span>Ubah Status & Catatan</span>
                                  </button>

                                  {/* Lihat Bukti */}
                                  {b.paymentProofUrl && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenActionMenuId(null);
                                          setSelectedProofBooking(b);
                                        }}
                                        className="w-full px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                      >
                                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Lihat Bukti Transfer</span>
                                      </button>

                                      <button
                                        type="button"
                                        disabled={downloadingCode === b.code}
                                        onClick={() => {
                                          setOpenActionMenuId(null);
                                          handleDownloadProof(
                                            b.paymentProofUrl!,
                                            b.code
                                          );
                                        }}
                                        className="w-full px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                      >
                                        <Download className="w-3.5 h-3.5 text-primary" />
                                        <span>Unduh Bukti Transfer</span>
                                      </button>
                                    </>
                                  )}
                                </div>

                                {/* Dokumen PDF & Email Section */}
                                <div className="py-1">
                                  {/* Unduh Voucher PDF */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleDownloadPDF(b);
                                    }}
                                    className="w-full px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-[#C8A44E]" />
                                    <span>Unduh Voucher & Invoice (PDF)</span>
                                  </button>

                                  {/* Kirim Ulang Email ke Tamu via Resend */}
                                  <button
                                    type="button"
                                    disabled={sendingEmailCode === b.code}
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleSendEmail(b);
                                    }}
                                    className="w-full px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50"
                                  >
                                    {sendingEmailCode === b.code ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C8A44E]" />
                                    ) : (
                                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                                    )}
                                    <span>Kirim Email Voucher ke Tamu</span>
                                  </button>
                                </div>

                                <div className="py-1">
                                  {/* Kirim WhatsApp */}
                                  <a
                                    href={`https://wa.me/${b.guestPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                                      `Halo ${b.guestName}, kami dari manajemen Singgahsana Villa mengonfirmasi reservasi ${b.code} di ${b.villa.name}.`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setOpenActionMenuId(null)}
                                    className="w-full px-3.5 py-2 text-xs text-emerald-700 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Chat WhatsApp Tamu</span>
                                  </a>

                                  {/* Salin Ringkasan */}
                                  <button
                                    type="button"
                                    onClick={() => copyBookingSummary(b)}
                                    className="w-full px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                  >
                                    <Share2 className="w-3.5 h-3.5 text-gray-500" />
                                    <span>Salin Rincian Pesanan</span>
                                  </button>
                                </div>

                                {b.status !== "CANCELLED" && (
                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenuId(null);
                                        if (
                                          confirm(
                                            `Batalkan pesanan ${b.code} atas nama ${b.guestName}? Tanggal villa akan kembali dibuka untuk tamu lain.`
                                          )
                                        ) {
                                          handleUpdateStatus(
                                            b.id,
                                            "CANCELLED",
                                            "Dibatalkan oleh manajer via menu aksi"
                                          );
                                        }
                                      }}
                                      className="w-full px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Batalkan Pesanan</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    Tidak ada data reservasi yang sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proof Preview Modal with Download & Actions */}
      {selectedProofBooking && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl animate-fade-in border border-gray-100 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-cream/40 shrink-0">
              <div>
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">
                  Bukti Transfer
                </span>
                <h3 className="font-bold text-base text-primary">
                  {selectedProofBooking.code} &bull; {selectedProofBooking.guestName}
                </h3>
                <p className="text-xs text-gray-500">
                  Total Bayar:{" "}
                  <span className="font-bold text-accent">
                    {formatIDR(selectedProofBooking.totalPrice)}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Download PDF Voucher & Invoice */}
                <button
                  type="button"
                  onClick={() => handleDownloadPDF(selectedProofBooking)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1a1a2e] text-white text-xs font-semibold hover:bg-[#252542] transition-all shadow-xs cursor-pointer"
                  title="Unduh Invoice & Voucher Tamu (PDF)"
                >
                  <FileText className="w-3.5 h-3.5 text-[#C8A44E]" />
                  <span className="hidden sm:inline">Voucher PDF</span>
                </button>

                {/* Header Download Button */}
                {selectedProofBooking.paymentProofUrl && (
                  <button
                    type="button"
                    disabled={downloadingCode === selectedProofBooking.code}
                    onClick={() =>
                      handleDownloadProof(
                        selectedProofBooking.paymentProofUrl!,
                        selectedProofBooking.code
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-light transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    title="Unduh File Bukti Transfer"
                  >
                    {downloadingCode === selectedProofBooking.code ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">Unduh Bukti</span>
                  </button>
                )}

                {/* Open in new tab */}
                {selectedProofBooking.paymentProofUrl && (
                  <a
                    href={selectedProofBooking.paymentProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl text-gray-500 hover:text-primary hover:bg-gray-100 transition-colors"
                    title="Buka gambar di tab baru"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedProofBooking(null)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 flex flex-col items-center">
              {selectedProofBooking.paymentProofUrl?.endsWith(".pdf") ? (
                <div className="p-8 text-center bg-gray-50 rounded-2xl w-full border border-gray-200">
                  <FileText className="w-12 h-12 text-primary mx-auto mb-3" />
                  <p className="text-xs text-gray-600 mb-4 font-medium">
                    Bukti pembayaran dikirim dalam bentuk dokumen PDF.
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      disabled={downloadingCode === selectedProofBooking.code}
                      onClick={() =>
                        handleDownloadProof(
                          selectedProofBooking.paymentProofUrl!,
                          selectedProofBooking.code
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-accent text-white rounded-xl text-xs font-semibold hover:bg-accent-light transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh Dokumen PDF</span>
                    </button>
                    <a
                      href={selectedProofBooking.paymentProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl text-xs font-semibold"
                    >
                      <span>Buka File</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-80 rounded-2xl overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center">
                  <Image
                    src={selectedProofBooking.paymentProofUrl || ""}
                    alt="Bukti Transfer"
                    fill
                    className="object-contain"
                  />
                </div>
              )}

              {/* Summary Card */}
              <div className="mt-4 w-full bg-cream/70 rounded-2xl p-4 border border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 font-medium block">
                    Metode Pembayaran
                  </span>
                  <span className="font-bold text-gray-800 uppercase">
                    {selectedProofBooking.paymentMethod}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-medium block">
                    Total Tagihan
                  </span>
                  <span className="font-bold text-accent">
                    {formatIDR(selectedProofBooking.totalPrice)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-medium block">
                    Waktu Upload
                  </span>
                  <span className="text-gray-700 font-medium">
                    {selectedProofBooking.paymentProofUploadedAt
                      ? format(
                          parseISO(selectedProofBooking.paymentProofUploadedAt),
                          "d MMM yyyy, HH:mm",
                          { locale: localeId }
                        )
                      : "Terlampir"}
                  </span>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="mt-5 w-full flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100">
                {/* Secondary Download Button */}
                <button
                  type="button"
                  disabled={downloadingCode === selectedProofBooking.code}
                  onClick={() =>
                    handleDownloadProof(
                      selectedProofBooking.paymentProofUrl!,
                      selectedProofBooking.code
                    )
                  }
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {downloadingCode === selectedProofBooking.code ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Unduh Bukti Transfer</span>
                </button>

                <div className="w-full sm:w-auto flex items-center justify-end gap-2">
                  {selectedProofBooking.status === "PENDING" && (
                    <>
                      <button
                        type="button"
                        disabled={updatingId === selectedProofBooking.id}
                        onClick={() => {
                          if (
                            confirm(
                              `Tolak bukti pembayaran untuk ${selectedProofBooking.code}? Status akan menjadi Dibatalkan.`
                            )
                          ) {
                            handleUpdateStatus(
                              selectedProofBooking.id,
                              "CANCELLED",
                              "Bukti transfer tidak valid/ditolak oleh manajer"
                            );
                          }
                        }}
                        className="px-3.5 py-2.5 rounded-xl border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        Tolak Bukti
                      </button>

                      <button
                        type="button"
                        disabled={updatingId === selectedProofBooking.id}
                        onClick={() =>
                          handleUpdateStatus(
                            selectedProofBooking.id,
                            "CONFIRMED",
                            "Bukti transfer disetujui via modal preview"
                          )
                        }
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Setujui & Konfirmasi</span>
                      </button>
                    </>
                  )}

                  <a
                    href={`https://wa.me/${selectedProofBooking.guestPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Halo ${selectedProofBooking.guestName}, terkait bukti transfer reservasi ${selectedProofBooking.code} untuk ${selectedProofBooking.villa.name} di Singgahsana Villa.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2.5 rounded-xl bg-green-500 text-white text-xs font-semibold hover:bg-green-600 flex items-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Status Change Modal */}
      {statusModal.isOpen && statusModal.booking && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-fade-in border border-gray-100 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-cream/40 shrink-0">
              <div>
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">
                  Kelola Operasional
                </span>
                <h3 className="font-bold text-lg font-display text-primary">
                  Ubah Status Reservasi
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Kode:{" "}
                  <span className="font-mono font-bold text-primary">
                    {statusModal.booking.code}
                  </span>{" "}
                  &bull; {statusModal.booking.guestName}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setStatusModal((prev) => ({ ...prev, isOpen: false }))
                }
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Pilih Status Baru
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: "PENDING",
                      label: "Menunggu Verifikasi",
                      desc: "Tamu belum bayar atau bukti transfer belum diverifikasi",
                      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
                      activeBorder: "border-amber-500 bg-amber-50/40",
                      icon: Clock,
                    },
                    {
                      id: "CONFIRMED",
                      label: "Terkonfirmasi (Lunas / Valid)",
                      desc: "Pembayaran telah diverifikasi, reservasi sah & tanggal villa dikunci",
                      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
                      activeBorder: "border-emerald-500 bg-emerald-50/40",
                      icon: CheckCircle2,
                    },
                    {
                      id: "CHECKED_IN",
                      label: "Check-In (Sedang Menginap)",
                      desc: "Tamu sudah tiba di villa dan sedang menjalani masa tinggal",
                      badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
                      activeBorder: "border-blue-500 bg-blue-50/40",
                      icon: Building,
                    },
                    {
                      id: "COMPLETED",
                      label: "Selesai (Check-Out)",
                      desc: "Tamu telah selesai menginap dan check-out dari villa",
                      badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
                      activeBorder: "border-purple-500 bg-purple-50/40",
                      icon: CheckCheck,
                    },
                    {
                      id: "CANCELLED",
                      label: "Dibatalkan",
                      desc: "Pesanan dibatalkan / tidak hadir (no-show)",
                      badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
                      activeBorder: "border-rose-500 bg-rose-50/40",
                      icon: X,
                    },
                  ].map((option) => {
                    const isSelected = statusModal.targetStatus === option.id;
                    const IconComp = option.icon;
                    return (
                      <div
                        key={option.id}
                        onClick={() =>
                          setStatusModal((prev) => ({
                            ...prev,
                            targetStatus: option.id as any,
                          }))
                        }
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? `${option.activeBorder} shadow-xs ring-1 ring-accent/30`
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? "border-accent bg-accent text-white"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {isSelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-gray-800">
                                {option.label}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${option.badgeColor}`}
                              >
                                <IconComp className="w-2.5 h-2.5 inline mr-1" />
                                {option.id}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              {option.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Catatan Internal Manajer (opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Bukti transfer BCA telah dicek mutasi rekening, sudah valid."
                  value={statusModal.notes}
                  onChange={(e) =>
                    setStatusModal((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setStatusModal((prev) => ({ ...prev, isOpen: false }))
                  }
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={updatingId === statusModal.booking.id}
                  onClick={async () => {
                    await handleUpdateStatus(
                      statusModal.booking!.id,
                      statusModal.targetStatus,
                      statusModal.notes.trim() || undefined
                    );
                  }}
                  className="px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-light transition-colors flex items-center gap-2 shadow-md shadow-accent/20 cursor-pointer disabled:opacity-50"
                >
                  {updatingId === statusModal.booking.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Simpan Status</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Direct Booking Modal ("+ Buat Booking Langsung") */}
      {directBookingOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-cream/40">
              <div>
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
                  Operasional Manajer
                </span>
                <h3 className="font-bold text-lg font-display text-primary">
                  Buat Booking Langsung (Direct Order)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Input pesanan walk-in, WhatsApp, atau telepon langsung tanpa harus lewat checkout publik.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDirectBookingOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdDirectCode ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-lg text-primary">
                  Booking Berhasil Dibuat!
                </h4>
                <div className="bg-cream px-4 py-3 rounded-2xl border border-gray-200 inline-block">
                  <span className="text-xs text-gray-500 block">Kode Booking</span>
                  <span className="font-mono text-xl font-bold text-primary">
                    {createdDirectCode}
                  </span>
                </div>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Pesanan telah tersimpan di sistem Singgahsana dan tanggal villa telah otomatis diblokir.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => copyCode(createdDirectCode)}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Kode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirectBookingOpen(false)}
                    className="px-5 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-light cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateDirectBooking} className="p-6 space-y-4">
                {directError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{directError}</span>
                  </div>
                )}

                {/* Villa Picker */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Pilih Villa <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={directVillaId}
                    onChange={(e) => setDirectVillaId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    {villas.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} (Kapasitas: {v.capacity} orang)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Tanggal Check-In <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={directCheckIn}
                      onChange={(e) => setDirectCheckIn(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Tanggal Check-Out <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={directCheckOut}
                      onChange={(e) => setDirectCheckOut(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>

                {/* Guest Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Nama Tamu <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Pak Herman"
                      value={directGuestName}
                      onChange={(e) => setDirectGuestName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      WhatsApp / HP <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="08123456789"
                      value={directGuestPhone}
                      onChange={(e) => setDirectGuestPhone(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email Tamu <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="tamu@mail.com"
                      value={directGuestEmail}
                      onChange={(e) => setDirectGuestEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Kota Asal
                    </label>
                    <input
                      type="text"
                      placeholder="Bandung"
                      value={directGuestCity}
                      onChange={(e) => setDirectGuestCity(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Jumlah Tamu
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={directGuestsCount}
                      onChange={(e) =>
                        setDirectGuestsCount(parseInt(e.target.value, 10) || 1)
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>

                {/* Status Selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Status Awal Booking
                  </label>
                  <select
                    value={directStatus}
                    onChange={(e) =>
                      setDirectStatus(e.target.value as "CONFIRMED" | "PENDING")
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="CONFIRMED">
                      Langsung Terkonfirmasi (Lunas / Transfer Diterima)
                    </option>
                    <option value="PENDING">
                      Menunggu Pembayaran (Tagihan Dikirim ke Tamu)
                    </option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Catatan Internal Manajer
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Pesanan via WA Ibu Santi, pembayaran cash on check-in atau DP 50%."
                    value={directNotes}
                    onChange={(e) => setDirectNotes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                  ></textarea>
                </div>

                {/* Submit */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={creatingDirect}
                    className="w-full py-3 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-light transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {creatingDirect ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Simpan & Terbitkan Kode Booking</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Bank Accounts Manager Modal (site_configs) */}
      <BankAccountsManagerModal
        isOpen={bankModalOpen}
        onClose={() => setBankModalOpen(false)}
      />
    </div>
  );
}
