"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Calendar,
  Building2,
  Filter,
  Search,
  RotateCcw,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  List,
  Sparkles,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import {
  ReportBookingItem,
  ReportExportSummary,
  exportReportsToPDF,
} from "@/lib/export-pdf";
import { exportReportsToCSV } from "@/lib/export-csv";

interface ReportsClientProps {
  initialBookings: ReportBookingItem[];
  villas: Array<{ id: string; name: string; slug: string }>;
  siteName: string;
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

type DatePreset =
  | "this_month"
  | "last_month"
  | "last_7"
  | "last_30"
  | "this_year"
  | "all"
  | "custom";

export function ReportsClient({
  initialBookings,
  villas,
  siteName,
  currentUser,
}: ReportsClientProps) {
  // --- Filter State ---
  const [datePreset, setDatePreset] = useState<DatePreset>("this_month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedVilla, setSelectedVilla] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "table">("overview");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Helper Copy Booking Code
  function handleCopy(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  // --- Dynamic Filtering Logic ---
  const { filteredBookings, periodLabel } = useMemo(() => {
    const now = new Date();
    let startBoundary: Date | null = null;
    let endBoundary: Date | null = null;
    let label = "Bulan Ini";

    if (datePreset === "this_month") {
      startBoundary = new Date(now.getFullYear(), now.getMonth(), 1);
      endBoundary = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      label = `${now.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`;
    } else if (datePreset === "last_month") {
      startBoundary = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endBoundary = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      label = `${lastMonthDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`;
    } else if (datePreset === "last_7") {
      startBoundary = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startBoundary.setHours(0, 0, 0, 0);
      endBoundary = new Date();
      label = "7 Hari Terakhir";
    } else if (datePreset === "last_30") {
      startBoundary = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startBoundary.setHours(0, 0, 0, 0);
      endBoundary = new Date();
      label = "30 Hari Terakhir";
    } else if (datePreset === "this_year") {
      startBoundary = new Date(now.getFullYear(), 0, 1);
      endBoundary = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      label = `Tahun ${now.getFullYear()}`;
    } else if (datePreset === "custom") {
      if (customStartDate) {
        startBoundary = new Date(customStartDate);
        startBoundary.setHours(0, 0, 0, 0);
      }
      if (customEndDate) {
        endBoundary = new Date(customEndDate);
        endBoundary.setHours(23, 59, 59, 999);
      }
      label = customStartDate && customEndDate
        ? `${customStartDate} s/d ${customEndDate}`
        : "Periode Kustom";
    } else {
      label = "Semua Waktu";
    }

    const filtered = initialBookings.filter((b) => {
      const bDate = new Date(b.createdAt);

      // Filter Tanggal
      if (startBoundary && bDate < startBoundary) return false;
      if (endBoundary && bDate > endBoundary) return false;

      // Filter Villa
      if (selectedVilla !== "all" && b.villa.id !== selectedVilla) return false;

      // Filter Status
      if (selectedStatus !== "all" && b.status !== selectedStatus) return false;

      // Filter Payment
      if (selectedPayment !== "all" && b.paymentMethod !== selectedPayment) return false;

      // Filter Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCode = b.code.toLowerCase().includes(q);
        const matchesGuest = b.guestName.toLowerCase().includes(q);
        const matchesEmail = b.guestEmail.toLowerCase().includes(q);
        const matchesPhone = b.guestPhone.toLowerCase().includes(q);
        const matchesVilla = b.villa.name.toLowerCase().includes(q);
        if (!matchesCode && !matchesGuest && !matchesEmail && !matchesPhone && !matchesVilla) {
          return false;
        }
      }

      return true;
    });

    return { filteredBookings: filtered, periodLabel: label };
  }, [
    initialBookings,
    datePreset,
    customStartDate,
    customEndDate,
    selectedVilla,
    selectedStatus,
    selectedPayment,
    searchQuery,
  ]);

  // --- Summary Calculations ---
  const summary: ReportExportSummary = useMemo(() => {
    let gross = 0;
    let discount = 0;
    let net = 0;
    let completed = 0;
    let nightsTotal = 0;

    filteredBookings.forEach((b) => {
      gross += b.totalPrice + b.discountAmount;
      discount += b.discountAmount;

      const isSuccessful =
        b.status === "COMPLETED" ||
        b.status === "CHECKED_IN" ||
        b.status === "CONFIRMED";

      if (isSuccessful) {
        net += b.totalPrice;
        completed += 1;
      }

      const nights = Math.max(
        1,
        Math.round(
          (new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      nightsTotal += nights;
    });

    const avgVal = completed > 0 ? Math.round(net / completed) : 0;

    return {
      totalGrossRevenue: gross,
      totalDiscount: discount,
      totalNetRevenue: net,
      totalBookings: filteredBookings.length,
      completedBookings: completed,
      totalNights: nightsTotal,
      avgBookingValue: avgVal,
    };
  }, [filteredBookings]);

  // Reset all filters
  function handleResetFilters() {
    setDatePreset("this_month");
    setCustomStartDate("");
    setCustomEndDate("");
    setSelectedVilla("all");
    setSelectedStatus("all");
    setSelectedPayment("all");
    setSearchQuery("");
    setCurrentPage(1);
  }

  const isFilterActive =
    datePreset !== "this_month" ||
    selectedVilla !== "all" ||
    selectedStatus !== "all" ||
    selectedPayment !== "all" ||
    searchQuery.trim().length > 0;

  // --- Breakdown Per Villa ---
  const villaBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; bookings: number }>();
    villas.forEach((v) => map.set(v.id, { name: v.name, revenue: 0, bookings: 0 }));

    filteredBookings.forEach((b) => {
      const isSuccess =
        b.status === "COMPLETED" ||
        b.status === "CHECKED_IN" ||
        b.status === "CONFIRMED";
      const item = map.get(b.villa.id);
      if (item) {
        item.bookings += 1;
        if (isSuccess) item.revenue += b.totalPrice;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filteredBookings, villas]);

  // --- Breakdown Status Booking ---
  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {
      COMPLETED: 0,
      CHECKED_IN: 0,
      CONFIRMED: 0,
      PENDING: 0,
      CANCELLED: 0,
    };
    filteredBookings.forEach((b) => {
      counts[b.status] = (counts[b.status] || 0) + 1;
    });
    return counts;
  }, [filteredBookings]);

  // --- Pagination Logic ---
  const totalPages = Math.ceil(filteredBookings.length / pageSize) || 1;
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, currentPage, pageSize]);

  // --- Export Handlers ---
  const exportOptions = {
    siteName,
    periodLabel,
    filterVillaName:
      selectedVilla !== "all"
        ? villas.find((v) => v.id === selectedVilla)?.name
        : undefined,
    filterStatusLabel: selectedStatus !== "all" ? selectedStatus : undefined,
    filterPaymentLabel: selectedPayment !== "all" ? selectedPayment : undefined,
    printedBy: {
      name: currentUser.name,
      role: currentUser.role,
    },
  };

  function handleExportPDF() {
    exportReportsToPDF(filteredBookings, summary, exportOptions);
  }

  function handleExportCSV() {
    exportReportsToCSV(filteredBookings, summary, exportOptions);
  }

  return (
    <div className="space-y-6">
      {/* --- Top Header & Action Buttons --- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#1a1a2e]">
              Laporan & Analitik Keuangan
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#C8A44E]/15 px-2.5 py-0.5 text-xs font-semibold text-[#8a6e29]">
              <Sparkles className="h-3 w-3" />
              Sistem RBAC
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            Ringkasan omzet, okupansi villa, dan mutasi reservasi tamu berdasarkan hak akses Anda ({currentUser.role}).
          </p>
        </div>

        {/* Tombol Ekspor CSV & PDF */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={filteredBookings.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs transition hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Download Spreadsheet Excel (.CSV)"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={filteredBookings.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1a1a2e] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#252542] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Download Dokumen Cetak Resmi (.PDF)"
          >
            <FileText className="h-4 w-4 text-[#C8A44E]" />
            <span>Ekspor PDF</span>
          </button>
        </div>
      </div>

      {/* --- Filter Bar Interaktif --- */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs space-y-3.5">
        {/* Preset Periode Cepat */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-100 pb-3">
          <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Periode:
          </span>
          {[
            { id: "this_month", label: "Bulan Ini" },
            { id: "last_month", label: "Bulan Lalu" },
            { id: "last_7", label: "7 Hari Terakhir" },
            { id: "last_30", label: "30 Hari Terakhir" },
            { id: "this_year", label: "Tahun Ini" },
            { id: "all", label: "Semua Waktu" },
            { id: "custom", label: "Kustom Tanggal" },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                setDatePreset(preset.id as DatePreset);
                setCurrentPage(1);
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                datePreset === preset.id
                  ? "bg-[#1a1a2e] text-white shadow-xs"
                  : "bg-gray-100/70 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {preset.label}
            </button>
          ))}

          {isFilterActive && (
            <button
              onClick={handleResetFilters}
              className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              Reset Filter
            </button>
          )}
        </div>

        {/* Input Custom Date jika dipilih */}
        {datePreset === "custom" && (
          <div className="flex flex-wrap items-center gap-3 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60 text-xs">
            <span className="font-semibold text-amber-900">Rentang Tanggal:</span>
            <div className="flex items-center gap-2">
              <label className="text-gray-500">Mulai:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#C8A44E]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-500">Sampai:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#C8A44E]"
              />
            </div>
          </div>
        )}

        {/* Multi-Dropdown Filter: Villa, Status, Payment & Search */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Villa Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Unit Villa
            </label>
            <select
              value={selectedVilla}
              onChange={(e) => {
                setSelectedVilla(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-800 shadow-2xs focus:border-[#C8A44E] focus:outline-none focus:ring-1 focus:ring-[#C8A44E]"
            >
              <option value="all">Semua Unit Villa</option>
              {villas.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Status Reservasi
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-800 shadow-2xs focus:border-[#C8A44E] focus:outline-none focus:ring-1 focus:ring-[#C8A44E]"
            >
              <option value="all">Semua Status</option>
              <option value="COMPLETED">Selesai (COMPLETED)</option>
              <option value="CHECKED_IN">Sedang Menginap (CHECKED_IN)</option>
              <option value="CONFIRMED">Terkonfirmasi (CONFIRMED)</option>
              <option value="PENDING">Menunggu Verifikasi (PENDING)</option>
              <option value="CANCELLED">Dibatalkan (CANCELLED)</option>
            </select>
          </div>

          {/* Metode Bayar Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Metode Pembayaran
            </label>
            <select
              value={selectedPayment}
              onChange={(e) => {
                setSelectedPayment(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-800 shadow-2xs focus:border-[#C8A44E] focus:outline-none focus:ring-1 focus:ring-[#C8A44E]"
            >
              <option value="all">Semua Metode</option>
              <option value="QRIS">QRIS</option>
              <option value="BANK_TRANSFER">Transfer Bank Manual</option>
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Pencarian Cepat
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari tamu / kode..."
                className="w-full rounded-xl border border-gray-200 bg-white pl-8 pr-3 py-1.5 text-xs text-gray-800 shadow-2xs focus:border-[#C8A44E] focus:outline-none focus:ring-1 focus:ring-[#C8A44E]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- Executive KPI Summary Cards --- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Omzet Bersih */}
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Omzet Bersih
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <DollarSign className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            {formatPrice(summary.totalNetRevenue)}
          </p>
          <p className="mt-1 text-[11px] text-gray-500">
            Dari {summary.completedBookings} reservasi sukses/terkonfirmasi
          </p>
        </div>

        {/* Card 2: Total Reservasi */}
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
              Total Reservasi
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            {summary.totalBookings} Transaksi
          </p>
          <p className="mt-1 text-[11px] text-gray-500">
            {summary.totalNights} total malam terpesan
          </p>
        </div>

        {/* Card 3: Diskon Promo Diberikan */}
        <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/60 to-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
              Total Diskon
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            {formatPrice(summary.totalDiscount)}
          </p>
          <p className="mt-1 text-[11px] text-gray-500">
            Omzet kotor: {formatPrice(summary.totalGrossRevenue)}
          </p>
        </div>

        {/* Card 4: Rata-Rata Transaksi (ADR) */}
        <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/60 to-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Rata-rata Nilai (ADR)
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#C8A44E]/20 text-[#8a6e29]">
              <Building2 className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            {formatPrice(summary.avgBookingValue)}
          </p>
          <p className="mt-1 text-[11px] text-gray-500">
            Rata-rata per reservasi berhasil
          </p>
        </div>
      </div>

      {/* --- Switch View Tabs: Ringkasan Analitik vs Tabel Rincian --- */}
      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
              activeTab === "overview"
                ? "border-[#1a1a2e] text-[#1a1a2e]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Ringkasan & Visualisasi</span>
          </button>

          <button
            onClick={() => setActiveTab("table")}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
              activeTab === "table"
                ? "border-[#1a1a2e] text-[#1a1a2e]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <List className="h-4 w-4" />
            <span>Tabel Transaksi Lengkap</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
              {filteredBookings.length}
            </span>
          </button>
        </div>

        <div className="hidden sm:block text-xs text-gray-400">
          Menampilkan data periode: <span className="font-semibold text-gray-700">{periodLabel}</span>
        </div>
      </div>

      {/* --- Tab 1: Ringkasan & Visualisasi --- */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Villa Revenue Performance Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Kontribusi Omzet per Unit Villa */}
            <div className="lg:col-span-2 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                Kontribusi Pendapatan per Unit Villa
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Peringkat unit villa berdasarkan omzet dan jumlah malam terpesan dalam periode ini.
              </p>

              <div className="space-y-4">
                {villaBreakdown.map((vb, idx) => {
                  const maxRevenue = Math.max(...villaBreakdown.map((v) => v.revenue), 1);
                  const percentage = Math.round((vb.revenue / maxRevenue) * 100);

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-800 flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-600">
                            {idx + 1}
                          </span>
                          {vb.name}
                          <span className="text-[11px] font-normal text-gray-400">
                            ({vb.bookings} reservasi)
                          </span>
                        </span>
                        <span className="font-bold text-[#1a1a2e]">
                          {formatPrice(vb.revenue)}
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#C8A44E] to-[#1a1a2e] transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Distribusi Status Transaksi & Info Cepat */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 mb-1">
                  Distribusi Status Reservasi
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Rasio penyelesaian booking periode ini.
                </p>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50/70 p-2.5 border border-emerald-100">
                    <span className="flex items-center gap-2 text-emerald-800 font-medium">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Selesai (COMPLETED)
                    </span>
                    <span className="font-bold text-emerald-900">
                      {statusBreakdown.COMPLETED}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-blue-50/70 p-2.5 border border-blue-100">
                    <span className="flex items-center gap-2 text-blue-800 font-medium">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      Check-In Aktif
                    </span>
                    <span className="font-bold text-blue-900">
                      {statusBreakdown.CHECKED_IN}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-cyan-50/70 p-2.5 border border-cyan-100">
                    <span className="flex items-center gap-2 text-cyan-800 font-medium">
                      <Check className="h-4 w-4 text-cyan-600" />
                      Terkonfirmasi (CONFIRMED)
                    </span>
                    <span className="font-bold text-cyan-900">
                      {statusBreakdown.CONFIRMED}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-amber-50/70 p-2.5 border border-amber-100">
                    <span className="flex items-center gap-2 text-amber-800 font-medium">
                      <Clock className="h-4 w-4 text-amber-600" />
                      Menunggu Pembayaran (PENDING)
                    </span>
                    <span className="font-bold text-amber-900">
                      {statusBreakdown.PENDING}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-rose-50/70 p-2.5 border border-rose-100">
                    <span className="flex items-center gap-2 text-rose-800 font-medium">
                      <XCircle className="h-4 w-4 text-rose-600" />
                      Dibatalkan (CANCELLED)
                    </span>
                    <span className="font-bold text-rose-900">
                      {statusBreakdown.CANCELLED}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Info Export */}
              <div className="rounded-2xl border border-gray-200/80 bg-gray-50/60 p-4 text-xs text-gray-600 space-y-2">
                <p className="font-semibold text-gray-800 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-[#C8A44E]" />
                  Tentang Ekspor Dokumen
                </p>
                <p className="text-[11px] leading-relaxed text-gray-500">
                  Semua filter yang Anda aktifkan di atas (periode, villa, status, dan metode) akan otomatis diterapkan ke file PDF dan file CSV Excel yang Anda unduh.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Tab 2: Tabel Transaksi Lengkap --- */}
      {activeTab === "table" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200/80 bg-white shadow-xs overflow-hidden">
            {filteredBookings.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h4 className="text-sm font-bold text-gray-800">
                  Tidak Ada Data Transaksi
                </h4>
                <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                  Tidak ada transaksi yang cocok dengan parameter filter yang Anda pilih. Silakan sesuaikan periode tanggal atau reset filter.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gray-100 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset Filter
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/75 text-gray-600 font-semibold">
                      <th className="py-3 px-4">No</th>
                      <th className="py-3 px-4">Kode Booking</th>
                      <th className="py-3 px-4">Tanggal Pesan</th>
                      <th className="py-3 px-4">Nama Tamu</th>
                      <th className="py-3 px-4">Unit Villa</th>
                      <th className="py-3 px-4">Periode Menginap</th>
                      <th className="py-3 px-4 text-right">Total Bayar</th>
                      <th className="py-3 px-4 text-center">Metode</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {paginatedBookings.map((b, index) => {
                      const nights = Math.max(
                        1,
                        Math.round(
                          (new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )
                      );
                      const rowNumber = (currentPage - 1) * pageSize + index + 1;

                      return (
                        <tr
                          key={b.id}
                          className="hover:bg-gray-50/70 transition-colors"
                        >
                          <td className="py-3 px-4 text-gray-400 font-medium">
                            {rowNumber}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-gray-900">
                            <div className="flex items-center gap-1.5">
                              <span>{b.code}</span>
                              <button
                                onClick={() => handleCopy(b.code)}
                                className="text-gray-400 hover:text-gray-700 cursor-pointer"
                                title="Salin Kode Booking"
                              >
                                {copiedCode === b.code ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                            {new Date(b.createdAt).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-gray-900">
                              {b.guestName}
                            </div>
                            <div className="text-[11px] text-gray-400 truncate max-w-[150px]">
                              {b.guestPhone}
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Link
                              href={`/villas/${b.villa.slug}`}
                              target="_blank"
                              className="font-medium text-gray-800 hover:text-[#C8A44E] transition"
                            >
                              {b.villa.name}
                            </Link>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="text-gray-800">
                              {new Date(b.checkIn).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                              })}{" "}
                              -{" "}
                              {new Date(b.checkOut).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                              })}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {nights} Malam • {b.guestsCount} Tamu
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="font-bold text-[#1a1a2e]">
                              {formatPrice(b.totalPrice)}
                            </div>
                            {b.discountAmount > 0 && (
                              <div className="text-[10px] text-emerald-600">
                                Diskon: -{formatPrice(b.discountAmount)}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                              {b.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                b.status === "COMPLETED"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : b.status === "CHECKED_IN"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : b.status === "CONFIRMED"
                                  ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                                  : b.status === "PENDING"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {filteredBookings.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-100 px-4 py-3 gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span>Tampilkan:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700"
                  >
                    <option value={10}>10 Baris</option>
                    <option value={25}>25 Baris</option>
                    <option value={50}>50 Baris</option>
                    <option value={100}>100 Baris</option>
                  </select>
                  <span>
                    dari total <strong className="text-gray-800">{filteredBookings.length}</strong> reservasi
                  </span>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <span className="px-2 font-medium text-gray-700">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
