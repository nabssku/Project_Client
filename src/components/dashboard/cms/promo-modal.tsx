"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Tag,
  Percent,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Ticket,
} from "lucide-react";

interface PromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  promoToEdit?: any | null;
}

export function PromoModal({
  isOpen,
  onClose,
  onSuccess,
  promoToEdit,
}: PromoModalProps) {
  const isEditing = Boolean(promoToEdit);

  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [description, setDescription] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (promoToEdit) {
      setTitle(promoToEdit.title || "");
      setCode(promoToEdit.code || "");
      setDiscountPercent(promoToEdit.discountPercent || 10);
      setDescription(promoToEdit.description || "");
      setValidFrom(
        promoToEdit.validFrom
          ? new Date(promoToEdit.validFrom).toISOString().slice(0, 10)
          : ""
      );
      setValidUntil(
        promoToEdit.validUntil
          ? new Date(promoToEdit.validUntil).toISOString().slice(0, 10)
          : ""
      );
      setIsActive(promoToEdit.isActive ?? true);
    } else {
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      setTitle("");
      setCode("");
      setDiscountPercent(15);
      setDescription("Potongan harga spesial untuk pemesanan villa minimum 2 malam.");
      setValidFrom(today.toISOString().slice(0, 10));
      setValidUntil(nextMonth.toISOString().slice(0, 10));
      setIsActive(true);
    }
    setError(null);
  }, [promoToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Judul promo wajib diisi");
      return;
    }
    if (!code.trim() || code.trim().length < 3) {
      setError("Kode promo minimal 3 karakter");
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      setError("Deskripsi promo minimal 5 karakter");
      return;
    }
    if (!validFrom || !validUntil) {
      setError("Masa berlaku promo (tanggal mulai & akhir) wajib diisi");
      return;
    }

    setSaving(true);

    const payload = {
      title: title.trim(),
      code: code.trim().toUpperCase().replace(/\s+/g, ""),
      discountPercent: Number(discountPercent),
      description: description.trim(),
      validFrom,
      validUntil,
      isActive,
    };

    try {
      const url = isEditing
        ? `/api/cms/promos/${promoToEdit.id}`
        : "/api/cms/promos";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan kode promo");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menyimpan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-[#e8e6df] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e6df] bg-[#f8f7f4]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-[#C8A44E]/15 text-[#C8A44E]">
              <Ticket className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#1a1a2e]">
                {isEditing ? "Edit Kode Promo" : "Buat Kode Promo Baru"}
              </h2>
              <p className="text-xs text-gray-500">
                Kode voucher dapat digunakan calon tamu saat alur checkout pemesanan villa.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                Judul Promo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Diskon Staycation Weekend 20%"
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                  Kode Kupon Voucher <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                  placeholder="WEEKEND20"
                  className="w-full text-sm font-mono font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                  Persentase Diskon (%) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full text-sm font-bold px-3.5 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                    %
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                  Mulai Berlaku <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                  Berlaku Sampai <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                Deskripsi &amp; Syarat Ketentuan <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Diskon khusus untuk reservasi semua tipe villa periode liburan..."
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                required
              />
            </div>

            <div className="p-3.5 rounded-xl border border-[#e8e6df] bg-[#f8f7f4] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#1a1a2e]">Status Aktif Promo</div>
                <div className="text-[11px] text-gray-500">
                  Tamu hanya dapat menggunakan kode ini jika status aktif dan dalam masa berlaku.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#e8e6df] bg-[#f8f7f4]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#C8A44E] hover:bg-[#b8933e] text-white text-sm font-semibold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : isEditing ? (
                "Simpan Perubahan"
              ) : (
                "Buat Kode Promo"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
