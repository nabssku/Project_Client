"use client";

import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { formatIDR } from "@/lib/pricing";
import {
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  DollarSign,
  Info,
  X,
} from "lucide-react";

interface CustomPrice {
  id: string;
  startDate: string;
  endDate: string;
  price: number;
  reason?: string | null;
}

interface VillaPricingManagerProps {
  villaId: string;
  villaName: string;
  basePrice: number;
  initialPriceWeekend?: number | null;
  onClose?: () => void;
  onUpdated?: () => void;
}

export function VillaPricingManager({
  villaId,
  villaName,
  basePrice,
  initialPriceWeekend,
  onClose,
  onUpdated,
}: VillaPricingManagerProps) {
  const [weekendPrice, setWeekendPrice] = useState<string>(
    initialPriceWeekend ? initialPriceWeekend.toString() : ""
  );
  const [customPrices, setCustomPrices] = useState<CustomPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingWeekend, setSavingWeekend] = useState(false);
  const [addingRange, setAddingRange] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // New range form
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newReason, setNewReason] = useState("");

  // Fetch current pricing config
  const fetchPricing = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/villas/${villaId}/pricing`);
      const data = await res.json();
      if (data.success) {
        if (data.pricing.priceWeekend) {
          setWeekendPrice(data.pricing.priceWeekend.toString());
        }
        setCustomPrices(
          data.pricing.customPrices.map((cp: any) => ({
            id: cp.id,
            startDate: cp.startDate,
            endDate: cp.endDate,
            price: cp.price,
            reason: cp.reason,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load pricing:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, [villaId]);

  // Save Weekend Rate
  const handleSaveWeekend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWeekend(true);
    setFeedback(null);

    try {
      const parsedWeekend = weekendPrice ? parseInt(weekendPrice, 10) : null;
      const res = await fetch(`/api/villas/${villaId}/pricing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceWeekend: parsedWeekend,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menyimpan tarif weekend");
      }

      setFeedback({ type: "success", message: "Tarif akhir pekan (Jumat-Sabtu) berhasil diperbarui!" });
      onUpdated?.();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSavingWeekend(false);
    }
  };

  // Add Custom Holiday/Peak Season Range
  const handleAddCustomRange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStartDate || !newEndDate || !newPrice) {
      setFeedback({ type: "error", message: "Harap lengkapi tanggal mulai, selesai, dan harga custom." });
      return;
    }

    setAddingRange(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/villas/${villaId}/pricing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customPrice: {
            startDate: newStartDate,
            endDate: newEndDate,
            price: parseInt(newPrice, 10),
            reason: newReason.trim() || "Hari Libur / High Season",
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menambahkan periode harga khusus");
      }

      setFeedback({ type: "success", message: "Periode harga khusus berhasil ditambahkan!" });
      setNewStartDate("");
      setNewEndDate("");
      setNewPrice("");
      setNewReason("");
      fetchPricing();
      onUpdated?.();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setAddingRange(false);
    }
  };

  // Delete Custom Range
  const handleDeleteRange = async (customPriceId: string) => {
    if (!confirm("Hapus periode harga khusus ini?")) return;
    setDeletingId(customPriceId);
    setFeedback(null);

    try {
      const res = await fetch(`/api/villas/${villaId}/pricing`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customPriceId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menghapus periode");
      }

      setFeedback({ type: "success", message: "Periode harga khusus telah dihapus." });
      fetchPricing();
      onUpdated?.();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden max-w-2xl w-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-cream/40">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
            Pengaturan Harga Dinamis
          </span>
          <h2 className="font-display text-xl font-bold text-primary">
            {villaName}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Tarif dasar reguler (Senin - Kamis & Minggu):{" "}
            <span className="font-bold text-primary">{formatIDR(basePrice)}/malam</span>
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
        {feedback && (
          <div
            className={`p-3.5 rounded-2xl flex items-start gap-2.5 text-xs ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Section 1: Weekend Pricing */}
        <div className="bg-cream/40 rounded-2xl p-5 border border-gray-200/60">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <h3 className="font-bold text-sm text-primary">
              Tarif Akhir Pekan (Jumat & Sabtu Malam)
            </h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Secara otomatis diterapkan di kalender tamu pada malam Jumat dan malam Sabtu.
          </p>

          <form onSubmit={handleSaveWeekend} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-3 text-xs font-semibold text-gray-400">
                Rp
              </span>
              <input
                type="number"
                min="0"
                step="50000"
                value={weekendPrice}
                onChange={(e) => setWeekendPrice(e.target.value)}
                placeholder={`Default: ${basePrice}`}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={savingWeekend}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              {savingWeekend ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                "Simpan Tarif Weekend"
              )}
            </button>
          </form>
        </div>

        {/* Section 2: Holiday / Custom Date Ranges */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" />
                Periode Hari Libur & Peak Season
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Override harga khusus untuk tanggal libur nasional, Idul Fitri, Natal, atau Tahun Baru.
              </p>
            </div>
          </div>

          {/* Existing Custom Ranges Table */}
          {loading ? (
            <div className="p-8 text-center text-xs text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              Memuat data harga...
            </div>
          ) : customPrices.length > 0 ? (
            <div className="border border-gray-100 rounded-2xl overflow-hidden mb-4 divide-y divide-gray-100">
              {customPrices.map((cp) => (
                <div
                  key={cp.id}
                  className="p-3.5 flex items-center justify-between hover:bg-gray-50/60 transition-colors text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">
                        {cp.reason || "Hari Libur / High Season"}
                      </span>
                      <span className="text-[10px] bg-rose-100 text-rose-700 font-semibold px-2 py-0.5 rounded-full">
                        Peak Season
                      </span>
                    </div>
                    <p className="text-gray-500 mt-0.5">
                      {format(parseISO(cp.startDate), "d MMM yyyy", { locale: localeId })} -{" "}
                      {format(parseISO(cp.endDate), "d MMM yyyy", { locale: localeId })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-accent text-sm tabular-nums">
                      {formatIDR(cp.price)}
                      <span className="text-[10px] font-normal text-gray-400">/malam</span>
                    </span>
                    <button
                      type="button"
                      disabled={deletingId === cp.id}
                      onClick={() => handleDeleteRange(cp.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-40 transition-colors"
                      title="Hapus Periode"
                    >
                      {deletingId === cp.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center text-xs text-gray-400 mb-4">
              Belum ada periode harga khusus yang aktif.
            </div>
          )}

          {/* Add New Range Form */}
          <form
            onSubmit={handleAddCustomRange}
            className="p-4 rounded-2xl border border-dashed border-gray-200 bg-[#faf9f5] space-y-3"
          >
            <span className="text-xs font-bold text-primary block">
              + Tambah Periode Baru
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Mulai Tanggal
                </label>
                <input
                  type="date"
                  required
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  required
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Tarif per Malam (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  required
                  placeholder="Misal: 2500000"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Keterangan / Nama Event
                </label>
                <input
                  type="text"
                  placeholder="Misal: Libur Tahun Baru 2027"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={addingRange}
              className="w-full py-2.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-light transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
            >
              {addingRange ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambahkan Periode Harga</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
