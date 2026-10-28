"use client";

import React, { useState } from "react";
import {
  Tag,
  Plus,
  Search,
  Percent,
  Copy,
  Check,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Clock,
  ExternalLink,
} from "lucide-react";
import { PromoModal } from "./promo-modal";

interface PromosClientProps {
  initialPromos: any[];
  canEdit: boolean;
}

export function PromosClient({ initialPromos, canEdit }: PromosClientProps) {
  const [promos, setPromos] = useState<any[]>(initialPromos);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const refreshPromos = async () => {
    try {
      const res = await fetch("/api/cms/promos");
      const data = await res.json();
      if (data.promos) {
        setPromos(data.promos);
      }
    } catch (e) {
      console.error("Failed to refresh promos:", e);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleToggleStatus = async (promo: any) => {
    if (!canEdit) return;
    setTogglingId(promo.id);
    try {
      const res = await fetch(`/api/cms/promos/${promo.id}/status`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPromos((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, isActive: !p.isActive } : p))
      );
      setNotification({
        type: "success",
        message: data.message || "Status promo berhasil diubah",
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Gagal mengubah status promo",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (promo: any) => {
    if (!canEdit) return;
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus kode promo "${promo.code}"?`
      )
    ) {
      return;
    }

    setDeletingId(promo.id);
    try {
      const res = await fetch(`/api/cms/promos/${promo.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPromos((prev) => prev.filter((p) => p.id !== promo.id));
      setNotification({ type: "success", message: "Kode promo berhasil dihapus!" });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Gagal menghapus promo",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const now = new Date();

  const filtered = promos.filter((item) => {
    const matchesSearch =
      !search ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && item.isActive) ||
      (statusFilter === "INACTIVE" && !item.isActive);

    return matchesSearch && matchesStatus;
  });

  const activeCount = promos.filter((p) => p.isActive).length;
  const expiredCount = promos.filter(
    (p) => new Date(p.validUntil).getTime() < now.getTime()
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8e6df] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-accent/10 text-accent">
              <Tag className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-primary">Manajemen Kode Promo</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Buat voucher diskon pemesanan villa untuk kampanye promosi marketing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/promo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-primary px-3 py-2 rounded-lg border border-[#e8e6df] bg-white hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Lihat Halaman Promo Publik
          </a>

          {canEdit && (
            <button
              onClick={() => {
                setEditingPromo(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-[#b8933e] text-white text-sm font-semibold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Buat Kode Promo
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#e8e6df] shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 uppercase font-semibold">Total Promo</div>
            <div className="text-2xl font-bold text-primary mt-1">{promos.length}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-gray-50 text-gray-500 border border-gray-100">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#e8e6df] shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-emerald-600 uppercase font-semibold">Promo Aktif</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{activeCount}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#e8e6df] shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-600 uppercase font-semibold">Sudah Kadaluarsa</div>
            <div className="text-2xl font-bold text-amber-700 mt-1">{expiredCount}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Notification Alert */}
      {notification && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border text-sm transition-all animate-in fade-in ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#e8e6df] p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode kupon, nama promo, atau deskripsi..."
            className="w-full text-sm pl-9 pr-4 py-2 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-medium shrink-0">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-white text-primary shadow-2xs font-semibold"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Semua ({promos.length})
          </button>
          <button
            onClick={() => setStatusFilter("ACTIVE")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              statusFilter === "ACTIVE"
                ? "bg-white text-emerald-700 shadow-2xs font-semibold"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Aktif ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter("INACTIVE")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              statusFilter === "INACTIVE"
                ? "bg-white text-gray-800 shadow-2xs font-semibold"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Nonaktif ({promos.length - activeCount})
          </button>
        </div>
      </div>

      {/* Promos Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e8e6df] p-16 text-center max-w-xl mx-auto shadow-2xs">
          <div className="w-14 h-14 rounded-full bg-[#f8f7f4] border border-[#e8e6df] flex items-center justify-center mx-auto text-gray-400 mb-3">
            <Tag className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-primary">Belum Ada Kode Promo</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-5">
            {search || statusFilter !== "ALL"
              ? "Tidak ada kode promo yang cocok dengan pencarian."
              : "Buat kode voucher promo pertama untuk menarik pemesanan tamu baru!"}
          </p>
          {canEdit && (
            <button
              onClick={() => {
                setEditingPromo(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-[#b8933e] transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Buat Kode Promo Sekarang
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((promo) => {
            const isExpired = new Date(promo.validUntil).getTime() < now.getTime();
            const isNotStarted = new Date(promo.validFrom).getTime() > now.getTime();

            return (
              <div
                key={promo.id}
                className={`bg-white rounded-2xl border overflow-hidden shadow-2xs transition-all flex flex-col justify-between hover:shadow-md ${
                  promo.isActive && !isExpired
                    ? "border-accent/50 ring-1 ring-[#C8A44E]/20"
                    : "border-[#e8e6df] opacity-85"
                }`}
              >
                <div>
                  {/* Top Voucher Header with Discount Accent */}
                  <div className="p-5 bg-linear-to-r from-[#1a1a2e] to-[#252542] text-white relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                        Voucher Diskon
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isExpired
                            ? "bg-red-500/80 text-white"
                            : isNotStarted
                            ? "bg-blue-500/80 text-white"
                            : promo.isActive
                            ? "bg-emerald-500/80 text-white"
                            : "bg-gray-500/80 text-white"
                        }`}
                      >
                        {isExpired
                          ? "Kadaluarsa"
                          : isNotStarted
                          ? "Akan Datang"
                          : promo.isActive
                          ? "Aktif"
                          : "Nonaktif"}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-white">
                        {promo.discountPercent}%
                      </span>
                      <span className="text-xs text-white/70">Potongan Harga</span>
                    </div>

                    <h3 className="font-bold text-base text-white mt-1 line-clamp-1">
                      {promo.title}
                    </h3>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3.5">
                    {/* Coupon Code Pill */}
                    <div className="p-2.5 rounded-xl border border-dashed border-accent bg-[#f8f7f4] flex items-center justify-between">
                      <div className="font-mono font-bold text-sm tracking-widest text-primary">
                        {promo.code}
                      </div>

                      <button
                        onClick={() => handleCopyCode(promo.code)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:text-[#b8933e] px-2 py-1 rounded-md bg-white border border-[#e8e6df] shadow-2xs cursor-pointer transition-colors"
                      >
                        {copiedCode === promo.code ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {promo.description}
                    </p>

                    <div className="pt-1 text-[11px] text-gray-400 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-accent" />
                        <span>
                          Berlaku:{" "}
                          <strong className="text-gray-700">
                            {new Date(promo.validFrom).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                            })}
                          </strong>{" "}
                          s/d{" "}
                          <strong className="text-gray-700">
                            {new Date(promo.validUntil).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="p-3.5 border-t border-[#e8e6df] bg-[#f8f7f4] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-gray-500">Aktif:</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={promo.isActive}
                        onChange={() => handleToggleStatus(promo)}
                        disabled={!canEdit || togglingId === promo.id}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingPromo(promo);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-md text-gray-500 hover:text-primary hover:bg-gray-200/60 transition-colors cursor-pointer"
                        title="Edit promo"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(promo)}
                        disabled={deletingId === promo.id}
                        className="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Hapus promo"
                      >
                        {deletingId === promo.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <PromoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPromo(null);
        }}
        onSuccess={refreshPromos}
        promoToEdit={editingPromo}
      />
    </div>
  );
}
