"use client";

import React, { useState, useEffect } from "react";
import { formatIDR } from "@/lib/pricing";
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Bed,
  Flame,
  LifeBuoy,
  UtensilsCrossed,
} from "lucide-react";

export interface VillaAddon {
  id: string;
  villaId: string;
  name: string;
  description?: string | null;
  price: number;
  maxQty: number;
  unit: string;
  isActive: boolean;
}

interface VillaAddonManagerProps {
  villaId: string;
  villaName: string;
  isInline?: boolean;
  onClose?: () => void;
  onUpdated?: () => void;
}

const ADDON_TEMPLATES = [
  {
    name: "Extra Bed (Single)",
    price: 150000,
    maxQty: 4,
    unit: "set",
    description: "Kasur busa empuk lengkap dengan sprei, bantal, dan selimut bersih",
    icon: Bed,
  },
  {
    name: "Floaties Pelampung Flamingo Jumbo",
    price: 75000,
    maxQty: 3,
    unit: "pcs",
    description: "Pelampung kolam renang karakter flamingo besar untuk foto & santai",
    icon: LifeBuoy,
  },
  {
    name: "Paket BBQ Grill & Arang Batok",
    price: 120000,
    maxQty: 2,
    unit: "paket",
    description: "Peralatan bakaran lengkap, arang batok kelapa 2kg, capit, dan briket pemantik",
    icon: Flame,
  },
  {
    name: "Floating Breakfast Tray",
    price: 50000,
    maxQty: 2,
    unit: "pcs",
    description: "Nampan terapung anyaman rotan sintetis premium untuk sarapan kolam renang",
    icon: UtensilsCrossed,
  },
];

export function VillaAddonManager({
  villaId,
  villaName,
  isInline = false,
  onClose,
  onUpdated,
}: VillaAddonManagerProps) {
  const [addons, setAddons] = useState<VillaAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [maxQty, setMaxQty] = useState("5");
  const [unit, setUnit] = useState("pcs");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Fetch addons
  const fetchAddons = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/villas/${villaId}/addons`);
      const data = await res.json();
      if (data.success && Array.isArray(data.addons)) {
        setAddons(data.addons);
      }
    } catch (err) {
      console.error("Failed to load addons:", err);
      setFeedback({
        type: "error",
        message: "Gagal memuat daftar addon villa",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddons();
  }, [villaId]);

  // Apply template
  const handleApplyTemplate = (tpl: (typeof ADDON_TEMPLATES)[0]) => {
    setName(tpl.name);
    setPrice(tpl.price.toString());
    setMaxQty(tpl.maxQty.toString());
    setUnit(tpl.unit);
    setDescription(tpl.description);
    setIsActive(true);
    setEditingId(null);
  };

  // Reset form
  const handleResetForm = () => {
    setName("");
    setPrice("");
    setMaxQty("5");
    setUnit("pcs");
    setDescription("");
    setIsActive(true);
    setEditingId(null);
  };

  // Populate form for edit
  const handleStartEdit = (addon: VillaAddon) => {
    setEditingId(addon.id);
    setName(addon.name);
    setPrice(addon.price.toString());
    setMaxQty(addon.maxQty.toString());
    setUnit(addon.unit);
    setDescription(addon.description || "");
    setIsActive(addon.isActive);
  };

  // Save (Create or Update)
  const handleSubmit = async (
    e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent
  ) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setFeedback(null);

    const payload = {
      name: name.trim(),
      price: parseInt(price, 10) || 0,
      maxQty: parseInt(maxQty, 10) || 5,
      unit: unit.trim() || "pcs",
      description: description.trim() || null,
      isActive,
    };

    try {
      const url = editingId
        ? `/api/villas/${villaId}/addons/${editingId}`
        : `/api/villas/${villaId}/addons`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan addon");
      }

      setFeedback({
        type: "success",
        message: editingId
          ? "Addon berhasil diperbarui!"
          : "Addon baru berhasil ditambahkan!",
      });

      handleResetForm();
      await fetchAddons();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Terjadi kesalahan saat menyimpan",
      });
    } finally {
      setSaving(false);
    }
  };

  // Quick toggle active
  const handleToggleActive = async (addon: VillaAddon) => {
    setTogglingId(addon.id);
    try {
      const res = await fetch(`/api/villas/${villaId}/addons/${addon.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !addon.isActive }),
      });

      if (res.ok) {
        setAddons((prev) =>
          prev.map((a) =>
            a.id === addon.id ? { ...a, isActive: !a.isActive } : a
          )
        );
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      console.error("Failed to toggle addon:", err);
    } finally {
      setTogglingId(null);
    }
  };

  // Delete addon
  const handleDelete = async (addonId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus addon ini?")) return;

    setDeletingId(addonId);
    setFeedback(null);

    try {
      const res = await fetch(`/api/villas/${villaId}/addons/${addonId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus addon");
      }

      setFeedback({
        type: "success",
        message: "Addon berhasil dihapus",
      });

      setAddons((prev) => prev.filter((a) => a.id !== addonId));
      if (editingId === addonId) handleResetForm();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Gagal menghapus addon",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const bodyContent = (
    <div
      className={
        isInline
          ? "rounded-2xl border border-[#e8e6df] bg-white p-6 shadow-xs space-y-6"
          : "relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#e8e6df] space-y-6"
      }
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#e8e6df] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-primary">
              {isInline ? "Add-on Fasilitas Ekstra" : "Kelola Add-on & Fasilitas Ekstra"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Konfigurasi fasilitas tambahan (extra bed, flooties, BBQ, dll) untuk{" "}
              <span className="font-bold text-primary">{villaName}</span>
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-primary hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

        {/* Feedback alert */}
        {feedback && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 animate-fade-in ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
        )}

        {/* Quick Template Buttons */}
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Pilihan Template Cepat
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ADDON_TEMPLATES.map((tpl, i) => {
              const Icon = tpl.icon;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="p-2.5 rounded-xl border border-[#e8e6df] bg-slate-50/70 hover:bg-accent/10 hover:border-accent/40 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-accent" />
                    <span className="text-xs font-bold text-primary group-hover:text-accent transition-colors truncate">
                      {tpl.name.split(" ")[0]} {tpl.name.split(" ")[1] || ""}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-accent tabular-nums">
                    {formatIDR(tpl.price)}
                    <span className="text-[10px] text-slate-400 font-normal">
                      /{tpl.unit}
                    </span>
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Tambah/Edit Addon */}
        <div className="p-5 rounded-2xl border border-accent/25 bg-accent/5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-accent" />
              {editingId ? "Edit Add-on" : "Tambah Add-on Baru"}
            </p>
            {editingId && (
              <button
                type="button"
                onClick={handleResetForm}
                className="text-xs text-slate-500 hover:text-primary underline cursor-pointer"
              >
                Batal Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Nama Addon */}
            <div className="sm:col-span-6">
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Nama Fasilitas / Item *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Contoh: Extra Bed Single, Flooties Flamingo"
                className="w-full px-3 py-2 rounded-xl border border-[#e8e6df] bg-white text-xs text-primary focus:outline-hidden focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* Harga */}
            <div className="sm:col-span-3">
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Harga (IDR) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="5000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="150000"
                className="w-full px-3 py-2 rounded-xl border border-[#e8e6df] bg-white text-xs text-primary font-bold focus:outline-hidden focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* Max Qty & Satuan */}
            <div className="sm:col-span-3 grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Maks Pcs *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={maxQty}
                  onChange={(e) => setMaxQty(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#e8e6df] bg-white text-xs text-primary text-center font-bold focus:outline-hidden focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Satuan
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="pcs"
                  className="w-full px-3 py-2 rounded-xl border border-[#e8e6df] bg-white text-xs text-primary text-center focus:outline-hidden focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            {/* Deskripsi */}
            <div className="sm:col-span-9">
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Keterangan / Deskripsi Singkat (Opsional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Termasuk bantal, selimut, atau fasilitas pelengkap"
                className="w-full px-3 py-2 rounded-xl border border-[#e8e6df] bg-white text-xs text-primary focus:outline-hidden focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* Tombol Simpan */}
            <div className="sm:col-span-3 flex items-end">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || !name.trim()}
                className="w-full py-2 px-4 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-accent hover:text-primary-dark transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : editingId ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Perbarui</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambahkan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* List of Addons */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Daftar Add-on Tersedia ({addons.length})
            </h3>
            {loading && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin text-accent" />
                Memuat data...
              </span>
            )}
          </div>

          {addons.length === 0 && !loading ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-[#e8e6df] text-slate-400 text-xs space-y-1">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-1" />
              <p className="font-semibold text-slate-600">Belum ada add-on untuk villa ini</p>
              <p>Klik salah satu pilihan template cepat di atas atau isi form untuk menambahkan.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#e8e6df] rounded-2xl border border-[#e8e6df] overflow-hidden bg-white">
              {addons.map((addon) => (
                <div
                  key={addon.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    !addon.isActive ? "bg-slate-50/70 opacity-60" : "hover:bg-slate-50/50"
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-primary">
                        {addon.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          addon.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {addon.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                    {addon.description && (
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {addon.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                      <span>Maks. Pesan: <strong className="text-primary">{addon.maxQty} {addon.unit}</strong></span>
                      <span>•</span>
                      <span>Satuan: <strong className="text-primary">{addon.unit}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-right">
                      <span className="font-display font-bold text-base text-accent block">
                        {formatIDR(addon.price)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        per {addon.unit}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 pl-2 sm:border-l sm:border-[#e8e6df]">
                      {/* Quick Toggle Active */}
                      <button
                        type="button"
                        disabled={togglingId === addon.id}
                        onClick={() => handleToggleActive(addon)}
                        className="p-1.5 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                        title={addon.isActive ? "Nonaktifkan Add-on" : "Aktifkan Add-on"}
                      >
                        {togglingId === addon.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-accent" />
                        ) : addon.isActive ? (
                          <ToggleRight className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-slate-400" />
                        )}
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(addon)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit Add-on"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        disabled={deletingId === addon.id}
                        onClick={() => handleDelete(addon.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                        title="Hapus Add-on"
                      >
                        {deletingId === addon.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#e8e6df] pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <p>
            Add-on yang berstatus <strong className="text-emerald-600 font-semibold">Aktif</strong> akan otomatis muncul pada formulir pemesanan tamu saat booking villa ini.
          </p>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition-colors shrink-0"
            >
              Tutup
            </button>
          )}
        </div>
      </div>
  );

  if (isInline) {
    return bodyContent;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      {bodyContent}
    </div>
  );
}
