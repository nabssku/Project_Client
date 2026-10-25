"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  MessageSquare,
  Star,
  Building2,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  Link2,
  Trash2,
} from "lucide-react";

interface TestimonialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  testimonialToEdit?: any | null;
  villas: { id: string; name: string }[];
}

export function TestimonialModal({
  isOpen,
  onClose,
  onSuccess,
  testimonialToEdit,
  villas,
}: TestimonialModalProps) {
  const isEditing = Boolean(testimonialToEdit);

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [avatarMode, setAvatarMode] = useState<"url" | "upload">("url");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState("");
  const [villaId, setVillaId] = useState("");
  const [rating, setRating] = useState(5);
  const [serviceRating, setServiceRating] = useState(5);
  const [cleanlinessRating, setCleanlinessRating] = useState(5);
  const [facilityRating, setFacilityRating] = useState(5);
  const [isFeatured, setIsFeatured] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (testimonialToEdit) {
      setName(testimonialToEdit.name || "");
      setAvatar(testimonialToEdit.avatar || "");
      setContent(testimonialToEdit.content || "");
      setVillaId(testimonialToEdit.villaId || "");
      setRating(testimonialToEdit.rating || 5);
      setServiceRating(testimonialToEdit.serviceRating || testimonialToEdit.rating || 5);
      setCleanlinessRating(testimonialToEdit.cleanlinessRating || testimonialToEdit.rating || 5);
      setFacilityRating(testimonialToEdit.facilityRating || testimonialToEdit.rating || 5);
      setIsFeatured(testimonialToEdit.isFeatured ?? false);
    } else {
      setName("");
      setAvatar("");
      setContent("");
      setVillaId("");
      setRating(5);
      setServiceRating(5);
      setCleanlinessRating(5);
      setFacilityRating(5);
      setIsFeatured(false);
    }
    setError(null);
  }, [testimonialToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "cms/testimonials");

      const res = await fetch("/api/upload/cms-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah avatar tamu");

      setAvatar(data.url);
    } catch (err: any) {
      setError(err.message || "Gagal mengunggah avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Nama tamu wajib diisi");
      return;
    }
    if (!content.trim() || content.trim().length < 5) {
      setError("Ulasan ulasan minimal 5 karakter");
      return;
    }

    setSaving(true);

    const payload = {
      name: name.trim(),
      avatar: avatar.trim() || null,
      content: content.trim(),
      villaId: villaId || null,
      rating,
      serviceRating,
      cleanlinessRating,
      facilityRating,
      isFeatured,
    };

    try {
      const url = isEditing
        ? `/api/cms/testimonials/${testimonialToEdit.id}`
        : "/api/cms/testimonials";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan ulasan");
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
              <MessageSquare className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#1a1a2e]">
                {isEditing ? "Edit Testimoni Tamu" : "Tambah Testimoni Baru"}
              </h2>
              <p className="text-xs text-gray-500">
                Ulasan dapat diassign ke villa spesifik dan di-feature ke beranda utama.
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
          <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
            {/* Rating Stars Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-2">
                Rating Keseluruhan (1 - 5)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm font-bold text-gray-700">
                  {rating} dari 5 Bintang
                </span>
              </div>
            </div>

            {/* Aspek Penilaian Detail */}
            <div className="bg-[#faf9f5] p-3.5 rounded-xl border border-[#e8e6df] space-y-2.5">
              <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1">
                Penilaian Aspek Kualitas (1 - 5)
              </span>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Pelayanan &amp; Staf</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setServiceRating(s)}
                      className="p-0.5 cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          s <= serviceRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-gray-700 w-5 text-right">
                    {serviceRating}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs border-t border-gray-200/60 pt-2">
                <span className="text-gray-600">Kebersihan Villa</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setCleanlinessRating(s)}
                      className="p-0.5 cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          s <= cleanlinessRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-gray-700 w-5 text-right">
                    {cleanlinessRating}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs border-t border-gray-200/60 pt-2">
                <span className="text-gray-600">Fasilitas &amp; Properti</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFacilityRating(s)}
                      className="p-0.5 cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          s <= facilityRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-gray-700 w-5 text-right">
                    {facilityRating}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                Nama Tamu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Raditya &amp; Keluarga"
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                required
              />
            </div>

            {/* Avatar Tamu: Dual-Mode */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider">
                  Foto Profil Tamu (Avatar)
                </label>
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setAvatarMode("url")}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      avatarMode === "url"
                        ? "bg-[#1a1a2e] text-white"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarMode("upload")}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      avatarMode === "upload"
                        ? "bg-[#1a1a2e] text-white"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    Upload
                  </button>
                </div>
              </div>

              {avatarMode === "url" ? (
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                  />
                  {avatar && (
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-[#e8e6df] shrink-0 bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                        onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={avatarFileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAvatarUpload(file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => avatarFileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="px-3.5 py-2.5 rounded-lg border border-dashed border-[#e8e6df] hover:border-[#C8A44E] bg-[#faf9f5] text-xs font-semibold text-gray-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#C8A44E]" />
                    ) : (
                      <Upload className="w-4 h-4 text-[#C8A44E]" />
                    )}
                    <span>{uploadingAvatar ? "Mengunggah..." : "Pilih Foto Tamu"}</span>
                  </button>

                  {avatar && (
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-[#e8e6df] shrink-0 bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={avatar}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAvatar("");
                          if (avatarFileInputRef.current) avatarFileInputRef.current.value = "";
                        }}
                        className="text-xs text-red-500 hover:underline cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                Villa Terkait (Assign ke Villa)
              </label>
              <select
                value={villaId}
                onChange={(e) => setVillaId(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
              >
                <option value="">-- Pengalaman Umum (Seluruh Villa) --</option>
                {villas.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-gray-400 mt-1 block">
                Jika di-assign ke villa, ulasan akan tampil di seksi Ulasan pada halaman detail villa tersebut.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                Isi Ulasan Tamu <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Pelayanan sangat luar biasa ramah, pemandangan bukit pagi hari sangat menyejukkan hati..."
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                required
              />
            </div>

            <div className="p-3.5 rounded-xl border border-[#e8e6df] bg-[#f8f7f4] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#1a1a2e]">
                  Tampilkan di Beranda (Featured)
                </div>
                <div className="text-[11px] text-gray-500">
                  Ulasan ini akan masuk ke deretan testimoni utama di landing page.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C8A44E]"></div>
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
                "Tambah Testimoni"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
