"use client";

import { useState, useMemo } from "react";
import {
  Activity,
  FileText,
  Download,
  Filter,
  Search,
  RotateCcw,
  Calendar,
  User,
  ShieldAlert,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Database,
  Tag,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";
import {
  ActivityLogExportItem,
  exportActivityLogsToPDF,
} from "@/lib/export-pdf";
import { exportActivityLogsToCSV } from "@/lib/export-csv";

interface ActivityLogItem {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string | null;
  } | null;
}

interface ActivityLogClientProps {
  initialLogs: ActivityLogItem[];
  staffUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  siteName: string;
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

type TimePreset = "all" | "today" | "last_7" | "last_30" | "custom";

export function ActivityLogClient({
  initialLogs,
  staffUsers,
  siteName,
  currentUser,
}: ActivityLogClientProps) {
  // Filter States
  const [timePreset, setTimePreset] = useState<TimePreset>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedUser, setSelectedUser] = useState("all");
  const [selectedEntity, setSelectedEntity] = useState("all");
  const [selectedAction, setSelectedAction] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Time Calculation Helper
  function getRelativeTime(dateString: string) {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "Baru saja";
    if (diffMin < 60) return `${diffMin} menit yang lalu`;
    if (diffHour < 24) return `${diffHour} jam yang lalu`;
    if (diffDay < 7) return `${diffDay} hari yang lalu`;
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  // --- Filtering Logic ---
  const { filteredLogs, periodLabel } = useMemo(() => {
    const now = new Date();
    let startBoundary: Date | null = null;
    let endBoundary: Date | null = null;
    let label = "Semua Waktu";

    if (timePreset === "today") {
      startBoundary = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endBoundary = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      label = "Hari Ini";
    } else if (timePreset === "last_7") {
      startBoundary = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startBoundary.setHours(0, 0, 0, 0);
      endBoundary = new Date();
      label = "7 Hari Terakhir";
    } else if (timePreset === "last_30") {
      startBoundary = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startBoundary.setHours(0, 0, 0, 0);
      endBoundary = new Date();
      label = "30 Hari Terakhir";
    } else if (timePreset === "custom") {
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
    }

    const filtered = initialLogs.filter((log) => {
      const logDate = new Date(log.createdAt);

      if (startBoundary && logDate < startBoundary) return false;
      if (endBoundary && logDate > endBoundary) return false;

      // Filter User
      if (selectedUser !== "all") {
        if (selectedUser === "system" && log.user !== null) return false;
        if (selectedUser !== "system" && log.user?.id !== selectedUser) return false;
      }

      // Filter Entity
      if (selectedEntity !== "all" && log.entity.toLowerCase() !== selectedEntity.toLowerCase()) {
        return false;
      }

      // Filter Action
      if (selectedAction !== "all") {
        const actionUpper = log.action.toUpperCase();
        if (selectedAction === "CREATE" && !actionUpper.includes("CREATE")) return false;
        if (selectedAction === "UPDATE" && !actionUpper.includes("UPDATE") && !actionUpper.includes("CONFIRM")) return false;
        if (selectedAction === "DELETE" && !actionUpper.includes("DELETE")) return false;
        if (selectedAction === "STATUS" && !actionUpper.includes("STATUS")) return false;
        if (selectedAction === "CONFIG" && !actionUpper.includes("CONFIG")) return false;
      }

      // Filter Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesAction = log.action.toLowerCase().includes(q);
        const matchesEntity = log.entity.toLowerCase().includes(q);
        const matchesDetails = (log.details || "").toLowerCase().includes(q);
        const matchesUserName = (log.user?.name || "").toLowerCase().includes(q);
        const matchesUserEmail = (log.user?.email || "").toLowerCase().includes(q);
        if (!matchesAction && !matchesEntity && !matchesDetails && !matchesUserName && !matchesUserEmail) {
          return false;
        }
      }

      return true;
    });

    return { filteredLogs: filtered, periodLabel: label };
  }, [
    initialLogs,
    timePreset,
    customStartDate,
    customEndDate,
    selectedUser,
    selectedEntity,
    selectedAction,
    searchQuery,
  ]);

  // --- Summary Calculations ---
  const summaryMetrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayCount = 0;
    const actorSet = new Set<string>();
    const entityCountMap: Record<string, number> = {};

    filteredLogs.forEach((l) => {
      if (new Date(l.createdAt) >= today) {
        todayCount += 1;
      }
      if (l.user) {
        actorSet.add(l.user.id);
      }
      entityCountMap[l.entity] = (entityCountMap[l.entity] || 0) + 1;
    });

    let topEntity = "-";
    let topEntityCount = 0;
    Object.entries(entityCountMap).forEach(([ent, count]) => {
      if (count > topEntityCount) {
        topEntityCount = count;
        topEntity = ent;
      }
    });

    return {
      totalLogs: filteredLogs.length,
      todayActions: todayCount,
      uniqueActors: actorSet.size,
      topEntity: topEntity !== "-" ? `${topEntity} (${topEntityCount})` : "-",
    };
  }, [filteredLogs]);

  // Reset Filters
  function handleResetFilters() {
    setTimePreset("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setSelectedUser("all");
    setSelectedEntity("all");
    setSelectedAction("all");
    setSearchQuery("");
    setCurrentPage(1);
  }

  const isFilterActive =
    timePreset !== "all" ||
    selectedUser !== "all" ||
    selectedEntity !== "all" ||
    selectedAction !== "all" ||
    searchQuery.trim().length > 0;

  // --- Pagination Logic ---
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // --- Export Handlers ---
  const exportOptions = {
    siteName,
    periodLabel,
    filterEntityLabel: selectedEntity !== "all" ? selectedEntity : undefined,
    filterActionLabel: selectedAction !== "all" ? selectedAction : undefined,
    printedBy: {
      name: currentUser.name,
      role: currentUser.role,
    },
  };

  function handleExportPDF() {
    exportActivityLogsToPDF(filteredLogs, exportOptions);
  }

  function handleExportCSV() {
    exportActivityLogsToCSV(filteredLogs, exportOptions);
  }

  // Action badge styling helper
  function getActionBadge(action: string) {
    const act = action.toUpperCase();
    if (act.includes("CREATE")) {
      return {
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        label: action,
      };
    }
    if (act.includes("DELETE")) {
      return {
        bg: "bg-rose-50 text-rose-700 border-rose-200",
        label: action,
      };
    }
    if (act.includes("CONFIG") || act.includes("CMS")) {
      return {
        bg: "bg-purple-50 text-purple-700 border-purple-200",
        label: action,
      };
    }
    if (act.includes("STATUS") || act.includes("CONFIRM")) {
      return {
        bg: "bg-cyan-50 text-cyan-700 border-cyan-200",
        label: action,
      };
    }
    return {
      bg: "bg-amber-50 text-amber-800 border-amber-200",
      label: action,
    };
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#1a1a2e]">
              Log Aktivitas & Audit Trail
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">
              <ShieldAlert className="h-3 w-3" />
              Izin Khusus RBAC
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            Riwayat kronologis mutasi sistem, aktivitas staf, dan jejak audit keamanan (Akses: {currentUser.role}).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs transition hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Download CSV Audit Trail"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1a1a2e] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#252542] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Download PDF Laporan Audit"
          >
            <FileText className="h-4 w-4 text-[#C8A44E]" />
            <span>Ekspor PDF</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Total Log Terpilih
          </span>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {summaryMetrics.totalLogs}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Dari {initialLogs.length} riwayat keseluruhan
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            Aksi Hari Ini
          </span>
          <p className="mt-1 text-2xl font-bold text-emerald-950">
            {summaryMetrics.todayActions} Aksi
          </p>
          <p className="text-[11px] text-emerald-700 mt-0.5">
            Aktivitas mutasi hari berjalan
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
            Staf Terlibat
          </span>
          <p className="mt-1 text-2xl font-bold text-blue-950">
            {summaryMetrics.uniqueActors} Staf
          </p>
          <p className="text-[11px] text-blue-700 mt-0.5">
            Aktor aktif dalam periode ini
          </p>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
            Modul Terbanyak
          </span>
          <p className="mt-1 text-lg font-bold text-purple-950 truncate">
            {summaryMetrics.topEntity}
          </p>
          <p className="text-[11px] text-purple-700 mt-0.5">
            Entitas paling sering dimutasi
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs space-y-3.5">
        {/* Preset Waktu */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-100 pb-3">
          <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Waktu:
          </span>
          {[
            { id: "all", label: "Semua Waktu" },
            { id: "today", label: "Hari Ini" },
            { id: "last_7", label: "7 Hari Terakhir" },
            { id: "last_30", label: "30 Hari Terakhir" },
            { id: "custom", label: "Kustom Tanggal" },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                setTimePreset(preset.id as TimePreset);
                setCurrentPage(1);
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                timePreset === preset.id
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

        {/* Custom Date Pickers */}
        {timePreset === "custom" && (
          <div className="flex flex-wrap items-center gap-3 bg-purple-50/50 p-2.5 rounded-xl border border-purple-200/60 text-xs">
            <span className="font-semibold text-purple-900">Rentang Tanggal Log:</span>
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

        {/* Dropdowns Filter */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Staf Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Staf / Aktor
            </label>
            <select
              value={selectedUser}
              onChange={(e) => {
                setSelectedUser(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-800 shadow-2xs focus:border-[#C8A44E] focus:outline-none focus:ring-1 focus:ring-[#C8A44E]"
            >
              <option value="all">Semua Staf & Sistem</option>
              <option value="system">Sistem Otomatis</option>
              {staffUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Modul / Entitas */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Modul / Entitas
            </label>
            <select
              value={selectedEntity}
              onChange={(e) => {
                setSelectedEntity(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-800 shadow-2xs focus:border-[#C8A44E] focus:outline-none focus:ring-1 focus:ring-[#C8A44E]"
            >
              <option value="all">Semua Modul</option>
              <option value="bookings">Reservasi (bookings)</option>
              <option value="villas">Unit Villa (villas)</option>
              <option value="articles">Artikel Blog (articles)</option>
              <option value="popups">Pop-up Promo (popups)</option>
              <option value="testimonials">Testimoni (testimonials)</option>
              <option value="promos">Kode Promo (promos)</option>
              <option value="users">Pengguna & RBAC (users)</option>
              <option value="site_configs">Pengaturan Situs (site_configs)</option>
            </select>
          </div>

          {/* Jenis Aksi */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Jenis Aksi
            </label>
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-800 shadow-2xs focus:border-[#C8A44E] focus:outline-none focus:ring-1 focus:ring-[#C8A44E]"
            >
              <option value="all">Semua Jenis Aksi</option>
              <option value="CREATE">CREATE (Tambah Baru)</option>
              <option value="UPDATE">UPDATE (Perbarui Data)</option>
              <option value="DELETE">DELETE (Hapus)</option>
              <option value="STATUS">STATUS (Ubah Status/Verifikasi)</option>
              <option value="CONFIG">CONFIG (Konfigurasi Sistem)</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Pencarian Kata Kunci
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
                placeholder="Cari deskripsi, nama staf..."
                className="w-full rounded-xl border border-gray-200 bg-white pl-8 pr-3 py-1.5 text-xs text-gray-800 shadow-2xs focus:border-[#C8A44E] focus:outline-none focus:ring-1 focus:ring-[#C8A44E]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table / Audit Stream */}
      <div className="rounded-2xl border border-gray-200/80 bg-white shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h4 className="text-sm font-bold text-gray-800">
              Tidak Ada Jejak Log Aktivitas
            </h4>
            <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
              Tidak ada catatan audit yang cocok dengan filter yang Anda tentukan. Silakan ubah rentang tanggal atau kata kunci pencarian.
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
                  <th className="py-3 px-4 w-12">No</th>
                  <th className="py-3 px-4 w-44">Waktu (WIB)</th>
                  <th className="py-3 px-4 w-52">Staf / Aktor</th>
                  <th className="py-3 px-4 w-36">Aksi</th>
                  <th className="py-3 px-4 w-32">Modul</th>
                  <th className="py-3 px-4">Rincian Aktivitas Mutasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {paginatedLogs.map((log, idx) => {
                  const badge = getActionBadge(log.action);
                  const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                  const isExpanded = expandedLogId === log.id;

                  // Parse Details jika format JSON
                  let parsedJson: any = null;
                  let isJson = false;
                  if (log.details && log.details.startsWith("{") && log.details.endsWith("}")) {
                    try {
                      parsedJson = JSON.parse(log.details);
                      isJson = true;
                    } catch {
                      isJson = false;
                    }
                  }

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50/70 transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-400 font-medium">
                        {rowNumber}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">
                          {new Date(log.createdAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(log.createdAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          WIB • {getRelativeTime(log.createdAt)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {log.user ? (
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1a1a2e] text-white font-bold text-[10px]">
                              {log.user.name.charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {log.user.name}
                              </div>
                              <div className="text-[10px] text-gray-400">
                                <span className="font-semibold text-[#8a6e29]">
                                  {log.user.role}
                                </span>{" "}
                                • {log.user.email}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-400 italic">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600 font-bold text-[10px]">
                              S
                            </span>
                            <div>
                              <span className="font-medium text-gray-600 not-italic">
                                Sistem Otomatis
                              </span>
                              <div className="text-[10px]">Background Job</div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-mono font-bold tracking-tight ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 bg-gray-100/80 px-2 py-0.5 rounded-md">
                          <Database className="h-3 w-3 text-gray-400" />
                          {log.entity}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {isJson ? (
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {Object.entries(parsedJson).map(([k, v]) => (
                                <span
                                  key={k}
                                  className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700 font-mono"
                                >
                                  <strong>{k}:</strong> {String(v)}
                                </span>
                              ))}
                              <button
                                onClick={() =>
                                  setExpandedLogId(isExpanded ? null : log.id)
                                }
                                className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 hover:underline cursor-pointer"
                              >
                                <Eye className="h-2.5 w-2.5" />
                                {isExpanded ? "Tutup JSON" : "Lihat JSON"}
                              </button>
                            </div>
                            {isExpanded && (
                              <pre className="mt-2 max-w-lg overflow-x-auto rounded-lg bg-gray-900 p-2 text-[10px] text-emerald-400 font-mono">
                                {JSON.stringify(parsedJson, null, 2)}
                              </pre>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-800 font-medium leading-relaxed max-w-xl">
                            {log.details || "-"}
                            {log.entityId && (
                              <span className="ml-1 text-[10px] font-mono text-gray-400">
                                (ID: {log.entityId})
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredLogs.length > 0 && (
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
                <option value={15}>15 Log</option>
                <option value={25}>25 Log</option>
                <option value={50}>50 Log</option>
                <option value={100}>100 Log</option>
              </select>
              <span>
                dari total <strong className="text-gray-800">{filteredLogs.length}</strong> catatan audit
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
  );
}
