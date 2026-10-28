"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Megaphone,
  Image as ImageIcon,
  Calendar,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Eye,
  Upload,
  Link2,
  ExternalLink,
  Trash2,
} from "lucide-react";

interface PopupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  popupToEdit?: any | null;
}

export function PopupFormModal({
  isOpen,
  onClose,
  onSuccess,
  popupToEdit,
}: PopupFormModalProps) {
  const isEditing = Boolean(popupToEdit);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageMode, setImageMode] = useState<"url" | "upload">("upload");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [badge, setBadge] = useState("PROMO TERBATAS");
  const [actionLabel, setActionLabel] = useState("Klaim Sekarang");
  const [actionUrl, setActionUrl] = useState("/villas");
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (popupToEdit) {
      setTitle(popupToEdit.title || "");
      setSubtitle(popupToEdit.subtitle || "");
      setImageUrl(popupToEdit.imageUrl || "");
      setBadge(popupToEdit.badge || "PROMO TERBATAS");
      setActionLabel(popupToEdit.actionLabel || "Klaim Sekarang");
      setActionUrl(popupToEdit.actionUrl || "/villas");
      setIsActive(popupToEdit.isActive ?? true);
      setStartDate(
        popupToEdit.startDate
          ? new Date(popupToEdit.startDate).toISOString().slice(0, 16)
          : ""
      );
      setEndDate(
        popupToEdit.endDate
          ? new Date(popupToEdit.endDate).toISOString().slice(0, 16)
          : ""
      );
    } else {
      setTitle("");
      setSubtitle("");
      setImageUrl(
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80"
      );
      setBadge("PROMO SPESIAL LIBURAN");
      setActionLabel("Lihat Promo Villa");
      setActionUrl("/villas");
      setIsActive(true);
      setStartDate("");
      setEndDate("");
    }
    setError(null);
  }, [popupToEdit, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "cms/popups");

      const res = await fetch("/api/upload/cms-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah banner pop-up");

      setImageUrl(data.url);
    } catch (err: any) {
      setError(err.message || "Gagal mengunggah gambar banner");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Judul pop-up wajib diisi");
      return;
    }

    setSaving(true);

    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      imageUrl: imageUrl.trim() || null,
      badge: badge.trim() || null,
      actionLabel: actionLabel.trim() || null,
      actionUrl: actionUrl.trim() || null,
      isActive,
      startDate: startDate || null,
      endDate: endDate || null,
    };

    try {
      const url = isEditing
        ? `/api/cms/popups/${popupToEdit.id}`
        : "/api/cms/popups";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan pop-up");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menyimpan pop-up");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-[#e8e6df] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e6df] bg-[#f8f7f4]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-accent/15 text-accent">
              <Megaphone className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-primary">
                {isEditing ? "Edit Pop-up Pengumuman / Promo" : "Buat Pop-up Pengumuman Baru"}
              </h2>
              <p className="text-xs text-gray-500">
                Pop-up akan muncul otomatis di beranda publik dengan jeda halus.
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
          <div className="p-6 max-h-[70vh] overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Inputs (Left) */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                  Judul Pop-up <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Diskon Menginap Spesial Akhir Pekan 25%!"
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                  Teks Badge (Pita Atas)
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="PROMO TERBATAS / PENGUMUMAN"
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-accent"
                />
              </div>

              {/* Banner Image: Dual-Mode (URL / Upload) */}
              <div className="rounded-xl border border-[#e8e6df] p-4 bg-[#fcfbf9] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-primary uppercase tracking-wider block">
                      Gambar Banner Pop-up
                    </label>
                    <span className="text-[11px] text-gray-500">
                      Foto visual promo atau pengumuman yang muncul di bagian atas pop-up
                    </span>
                  </div>

                  {/* Mode Switcher */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#e8e6df] self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setImageMode("upload")}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                        imageMode === "upload"
                          ? "bg-primary text-white shadow-2xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      Unggah File
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode("url")}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                        imageMode === "url"
                          ? "bg-primary text-white shadow-2xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Link2 className="w-3 h-3" />
                      Tautan URL
                    </button>
                  </div>
                </div>

                {/* Mode Upload File */}
                {imageMode === "upload" && !imageUrl && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#e8e6df] hover:border-accent bg-white rounded-xl p-5 text-center cursor-pointer transition-colors group"
                    >
                      {uploadingImage ? (
                        <div className="flex flex-col items-center justify-center py-2">
                          <Loader2 className="w-6 h-6 text-accent animate-spin mb-2" />
                          <span className="text-xs font-semibold text-gray-700">
                            Mengompresi &amp; Mengunggah Banner...
                          </span>
                          <span className="text-[11px] text-gray-400 mt-0.5">
                            Format otomatis dikonversi ke WebP untuk performa kilat
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-amber-50 group-hover:bg-amber-100/70 text-accent flex items-center justify-center mb-2 transition-colors">
                            <Upload className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-semibold text-gray-800">
                            Pilih file gambar banner dari komputer Anda
                          </span>
                          <span className="text-[11px] text-gray-400 mt-1">
                            Format didukung: JPG, PNG, WebP (Maksimal 15 MB)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Mode Tautan URL */}
                {imageMode === "url" && (
                  <div>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-accent"
                    />
                  </div>
                )}

                {/* Active Image Preview Card */}
                {imageUrl && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-[#e8e6df]">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-16 h-12 rounded-lg overflow-hidden border border-[#e8e6df] shrink-0 bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                        />
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-xs font-semibold text-primary block truncate">
                          Banner Pop-up Terpasang
                        </span>
                        <span className="text-[11px] font-mono text-gray-400 truncate block max-w-sm">
                          {imageUrl}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                        title="Buka gambar di tab baru"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl("");
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Hapus gambar banner"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                  Subjudul / Pesan Lengkap
                </label>
                <textarea
                  rows={3}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Nikmati liburan mewah dengan harga spesial. Gunakan kode promo saat reservasi..."
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                    Label Tombol Aksi (CTA)
                  </label>
                  <input
                    type="text"
                    value={actionLabel}
                    onChange={(e) => setActionLabel(e.target.value)}
                    placeholder="Klaim Sekarang"
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                    Tautan / Link Tujuan
                  </label>
                  <input
                    type="text"
                    value={actionUrl}
                    onChange={(e) => setActionUrl(e.target.value)}
                    placeholder="/villas atau /promo"
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                    Tanggal Mulai (Opsional)
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                    Tanggal Berakhir (Opsional)
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[#e8e6df] bg-[#f8f7f4] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-primary">Status Aktif Pop-up</div>
                  <div className="text-[11px] text-gray-500">
                    Jika aktif, pop-up akan tampil ke pengunjung website publik.
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

            {/* Live Interactive Preview (Right) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
                <Eye className="w-4 h-4 text-accent" />
                Pratinjau Tampilan Pop-up
              </div>

              {/* Popup Mockup */}
              <div className="p-4 rounded-2xl bg-gray-900/60 backdrop-blur-md border border-gray-700 flex items-center justify-center">
                <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200 w-full max-w-sm text-center relative">
                  {/* Close button mock */}
                  <div className="absolute top-2.5 right-2.5 z-10 w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center text-xs">
                    ✕
                  </div>

                  {/* Banner image */}
                  {imageUrl ? (
                    <div className="h-32 bg-gray-100 overflow-hidden relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt="Preview banner"
                        className="w-full h-full object-cover"
                        onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                      />
                      {badge && (
                        <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent text-white shadow-xs">
                          {badge}
                        </span>
                      )}
                    </div>
                  ) : badge ? (
                    <div className="pt-4 pb-1">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent/15 text-accent">
                        {badge}
                      </span>
                    </div>
                  ) : null}

                  {/* Copy */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-base text-primary leading-snug">
                      {title || "Judul Pop-up Pengumuman"}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {subtitle ||
                        "Deskripsi atau instruksi promo yang ingin disampaikan kepada pengunjung website."}
                    </p>

                    {/* CTA Button */}
                    {actionLabel && (
                      <div className="pt-2">
                        <button
                          type="button"
                          className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-black transition-colors"
                        >
                          {actionLabel}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-accent hover:bg-[#b8933e] text-white text-sm font-semibold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : isEditing ? (
                "Simpan Perubahan Pop-up"
              ) : (
                "Aktifkan Pop-up Sekarang"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
