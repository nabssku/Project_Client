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
  X,
  Sun,
  CalendarDays,
  RotateCcw,
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

const DAYS_CONFIG = [
  { key: "monday", label: "Senin", isWeekend: false, defaultType: "Weekday" },
  { key: "tuesday", label: "Selasa", isWeekend: false, defaultType: "Weekday" },
  { key: "wednesday", label: "Rabu", isWeekend: false, defaultType: "Weekday" },
  { key: "thursday", label: "Kamis", isWeekend: false, defaultType: "Weekday" },
  { key: "friday", label: "Jumat", isWeekend: true, defaultType: "Weekend" },
  { key: "saturday", label: "Sabtu", isWeekend: true, defaultType: "Weekend" },
  { key: "sunday", label: "Minggu", isWeekend: true, defaultType: "Weekend / Libur" },
];

export function VillaPricingManager({
  villaId,
  villaName,
  basePrice,
  initialPriceWeekend,
  onClose,
  onUpdated,
}: VillaPricingManagerProps) {
  const [activeTab, setActiveTab] = useState<"daily" | "holidays">("daily");
  const [weekendPrice, setWeekendPrice] = useState<string>(
    initialPriceWeekend ? initialPriceWeekend.toString() : ""
  );
  const [dailyRates, setDailyRates] = useState<Record<string, string>>({
    sunday: "",
    monday: "",
    tuesday: "",
    wednesday: "",
    thursday: "",
    friday: "",
    saturday: "",
  });
  const [customPrices, setCustomPrices] = useState<CustomPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingWeekend, setSavingWeekend] = useState(false);
  const [savingDaily, setSavingDaily] = useState(false);
  const [addingRange, setAddingRange] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // New holiday form
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
      if (res.ok) {
        const pWeekend = data.pricing?.priceWeekend ?? data.priceWeekend;
        if (pWeekend !== undefined && pWeekend !== null) {
          setWeekendPrice(pWeekend.toString());
        }

        const rates = data.pricing?.dailyRates ?? data.dailyRates;
        if (rates && typeof rates === "object") {
          setDailyRates({
            sunday: rates.sunday ? rates.sunday.toString() : "",
            monday: rates.monday ? rates.monday.toString() : "",
            tuesday: rates.tuesday ? rates.tuesday.toString() : "",
            wednesday: rates.wednesday ? rates.wednesday.toString() : "",
            thursday: rates.thursday ? rates.thursday.toString() : "",
            friday: rates.friday ? rates.friday.toString() : "",
            saturday: rates.saturday ? rates.saturday.toString() : "",
          });
        }

        const cps = data.pricing?.customPrices ?? data.customPrices ?? [];
        setCustomPrices(
          cps.map((cp: any) => ({
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
      const parsedWeekend = weekendPrice.trim() ? parseInt(weekendPrice, 10) : null;
      const res = await fetch(`/api/villas/${villaId}/pricing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceWeekend: parsedWeekend,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan tarif weekend");
      }

      setFeedback({ type: "success", message: "Tarif akhir pekan berhasil disimpan!" });
      onUpdated?.();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSavingWeekend(false);
    }
  };

  // Save Daily Rates
  const handleSaveDailyRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDaily(true);
    setFeedback(null);

    try {
      const payloadRates: Record<string, number | null> = {};
      const keys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      for (const k of keys) {
        const val = dailyRates[k]?.trim();
        payloadRates[k] = val ? parseInt(val, 10) : null;
      }

      const res = await fetch(`/api/villas/${villaId}/pricing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyRates: payloadRates,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan tarif harian");
      }

      setFeedback({
        type: "success",
        message: "Penyesuaian tarif harian (Senin - Minggu) berhasil disimpan!",
      });
      onUpdated?.();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSavingDaily(false);
    }
  };

  // Helper presets for daily rates
  const applyPresetWeekday = (price: number) => {
    setDailyRates((prev) => ({
      ...prev,
      monday: price ? price.toString() : "",
      tuesday: price ? price.toString() : "",
      wednesday: price ? price.toString() : "",
      thursday: price ? price.toString() : "",
    }));
  };

  const applyPresetWeekend = (price: number, includeSunday: boolean = false) => {
    setDailyRates((prev) => ({
      ...prev,
      friday: price ? price.toString() : "",
      saturday: price ? price.toString() : "",
      ...(includeSunday ? { sunday: price ? price.toString() : "" } : {}),
    }));
  };

  const resetAllDailyRates = () => {
    setDailyRates({
      sunday: "",
      monday: "",
      tuesday: "",
      wednesday: "",
      thursday: "",
      friday: "",
      saturday: "",
    });
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
      if (!res.ok) {
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
      const res = await fetch(`/api/villas/${villaId}/pricing?customPriceId=${customPriceId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customPriceId }),
      });

      const data = await res.json();
      if (!res.ok) {
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
    <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden max-w-2xl w-full">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-cream/40">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
            Pengaturan Tarif Dinamis
          </span>
          <h2 className="font-display text-lg sm:text-xl font-bold text-primary">
            {villaName}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Tarif dasar reguler:{" "}
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

      {/* Tabs */}
      <div className="flex border-b border-gray-100 bg-gray-50/70 p-1.5 gap-1.5 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("daily")}
          className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
            activeTab === "daily"
              ? "bg-white text-primary shadow-xs border border-gray-100 font-bold"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5 text-accent" />
          <span>Tarif Harian (Senin - Minggu)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("holidays")}
          className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
            activeTab === "holidays"
              ? "bg-white text-primary shadow-xs border border-gray-100 font-bold"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-accent" />
          <span>Periode Libur & High Season ({customPrices.length})</span>
        </button>
      </div>

      <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
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

        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-accent" />
            Memuat pengaturan tarif villa...
          </div>
        ) : activeTab === "daily" ? (
          <div className="space-y-6">
            {/* Quick Weekend Rate Box */}
            <div className="bg-cream/40 rounded-2xl p-4 sm:p-5 border border-gray-200/60">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-accent" />
                <h3 className="font-bold text-sm text-primary">
                  Tarif Weekend Standar (Jumat & Sabtu Malam)
                </h3>
              </div>
              <p className="text-xs text-gray-500 mb-3.5">
                Tarif cepat untuk akhir pekan. Jika Anda ingin harga hari Minggu, Senin, atau hari lain berbeda, atur pada formulir tarif harian di bawah.
              </p>

              <form onSubmit={handleSaveWeekend} className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-2.5 text-xs font-semibold text-gray-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={weekendPrice}
                    onChange={(e) => setWeekendPrice(e.target.value)}
                    placeholder={`Default reguler: ${basePrice}`}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-accent text-xs sm:text-sm bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingWeekend}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {savingWeekend ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Simpan Tarif Weekend Standar"
                  )}
                </button>
              </form>
            </div>

            {/* Daily Pricing Form */}
            <div className="border border-gray-100 rounded-2xl p-4 sm:p-5 bg-white space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    Penyesuaian Tarif per Hari (Custom Daily Rates)
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Tentukan harga spesifik per malam untuk setiap hari dalam seminggu.
                  </p>
                </div>

                {/* Quick actions */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const p = prompt("Masukkan tarif untuk Weekday (Senin - Kamis):", basePrice.toString());
                      if (p) applyPresetWeekday(parseInt(p, 10));
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                  >
                    Set Weekday
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const defaultVal = weekendPrice ? weekendPrice : (basePrice * 1.2).toString();
                      const p = prompt("Masukkan tarif untuk Weekend (Jumat, Sabtu & Minggu):", defaultVal);
                      if (p) applyPresetWeekend(parseInt(p, 10), true);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                  >
                    Set Weekend (Jum-Min)
                  </button>
                  <button
                    type="button"
                    onClick={resetAllDailyRates}
                    className="text-[11px] px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1"
                    title="Kosongkan semua hari agar kembali ke harga reguler/weekend standar"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveDailyRates} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DAYS_CONFIG.map((day) => {
                    const currentValue = dailyRates[day.key] || "";
                    const hasCustom = Boolean(currentValue && parseInt(currentValue, 10) > 0);
                    const effectiveFallback =
                      day.key === "friday" || day.key === "saturday"
                        ? weekendPrice && parseInt(weekendPrice, 10) > 0
                          ? parseInt(weekendPrice, 10)
                          : basePrice
                        : basePrice;

                    return (
                      <div
                        key={day.key}
                        className={`p-3 rounded-xl border transition-all ${
                          hasCustom
                            ? "border-accent/40 bg-accent/5"
                            : "border-gray-100 bg-gray-50/40"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-primary">
                              {day.label}
                            </span>
                            <span
                              className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                                day.isWeekend
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {day.defaultType}
                            </span>
                          </div>
                          {!hasCustom && (
                            <span className="text-[10px] text-gray-400">
                              Reguler: {formatIDR(effectiveFallback)}
                            </span>
                          )}
                        </div>

                        <div className="relative">
                          <span className="absolute left-3 top-2 text-[11px] font-semibold text-gray-400">
                            Rp
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="50000"
                            value={currentValue}
                            onChange={(e) =>
                              setDailyRates((prev) => ({
                                ...prev,
                                [day.key]: e.target.value,
                              }))
                            }
                            placeholder={`Default: ${effectiveFallback}`}
                            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingDaily}
                    className="px-6 py-2.5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-light transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                  >
                    {savingDaily ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Simpan Pengaturan Tarif Harian"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* Tab 2: Holiday / Custom Date Ranges */
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" />
                Periode Hari Libur & Peak Season
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Override harga khusus untuk rentang tanggal tertentu (misal: Libur Lebaran, Natal, atau Tahun Baru).
              </p>
            </div>

            {/* Existing Custom Ranges Table */}
            {customPrices.length > 0 ? (
              <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
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
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center text-xs text-gray-400">
                Belum ada periode harga khusus yang aktif.
              </div>
            )}

            {/* Add New Range Form */}
            <form
              onSubmit={handleAddCustomRange}
              className="p-4 rounded-2xl border border-dashed border-gray-200 bg-[#faf9f5] space-y-3"
            >
              <span className="text-xs font-bold text-primary block">
                + Tambah Periode Khusus Baru
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
        )}
      </div>
    </div>
  );
}
