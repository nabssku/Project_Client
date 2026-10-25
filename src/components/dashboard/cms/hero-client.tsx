"use client";

import React, { useState, useRef } from "react";
import {
  Palette,
  Video,
  Type,
  BarChart3,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  UploadCloud,
  Link as LinkIcon,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
} from "lucide-react";

interface HeroClientProps {
  initialConfigs: Record<string, string>;
  canEdit: boolean;
}

const DISPLAY_FONTS = [
  { name: "Playfair Display", category: "Serif Elegan Klasik" },
  { name: "Cormorant Garamond", category: "Serif Royal & Mewah" },
  { name: "Libre Baskerville", category: "Serif Editorial Tradisional" },
  { name: "Lora", category: "Serif Lembut & Kontemporer" },
  { name: "Merriweather", category: "Serif Kokoh Berkarakter" },
  { name: "Crimson Text", category: "Serif Buku Antik" },
];

const BODY_FONTS = [
  { name: "DM Sans", category: "Geometrik Modern Bersih" },
  { name: "Inter", category: "Standar UI Terbaca Tinggi" },
  { name: "Poppins", category: "Geometrik Ramah & Trendi" },
  { name: "Open Sans", category: "Netral & Seimbang" },
  { name: "Nunito", category: "Rounded Hangat & Nyaman" },
  { name: "Work Sans", category: "Modern Arsitektural" },
];

const COLOR_PRESETS = [
  {
    name: "Royal Midnight & Gold",
    primary: "#1a1a2e",
    secondary: "#C8A44E",
    accent: "#1a1a2e",
  },
  {
    name: "Luxury Slate & Bronze",
    primary: "#0f172a",
    secondary: "#d97706",
    accent: "#0f172a",
  },
  {
    name: "Forest Emerald & Champagne",
    primary: "#064e3b",
    secondary: "#f59e0b",
    accent: "#064e3b",
  },
  {
    name: "Deep Ocean & Rose Gold",
    primary: "#164e63",
    secondary: "#fb7185",
    accent: "#164e63",
  },
];

export function HeroClient({ initialConfigs, canEdit }: HeroClientProps) {
  const [configs, setConfigs] = useState<Record<string, string>>(initialConfigs);
  const [activeTab, setActiveTab] = useState<"media" | "design" | "stats">("media");
  const [saving, setSaving] = useState(false);
  const [purgingCache, setPurgingCache] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handlePurgeCache = async () => {
    setPurgingCache(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/config/revalidate", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          message: data.message || "Cache Vercel & Website berhasil dibersihkan! Halaman web live kini langsung sinkron.",
        });
        setTimeout(() => setFeedback(null), 6000);
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Gagal menyegarkan cache",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Terjadi kesalahan jaringan saat menyegarkan cache.",
      });
    } finally {
      setPurgingCache(false);
    }
  };

  // Fallback cover image dual-mode states
  const [coverMode, setCoverMode] = useState<"url" | "upload">("url");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (key: string, value: string) => {
    setConfigs((prev) => ({ ...prev, [key]: value }));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload/cms-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengunggah gambar");
      }

      handleChange("hero_image", data.url);
      setFeedback({
        type: "success",
        message: "Gambar cover hero berhasil diunggah! Jangan lupa klik 'Simpan Perubahan' di atas.",
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setUploadError(err.message || "Gagal mengunggah file gambar");
    } finally {
      setUploadingCover(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleApplyPreset = (preset: (typeof COLOR_PRESETS)[0]) => {
    setConfigs((prev) => ({
      ...prev,
      primary_color: preset.primary,
      secondary_color: preset.secondary,
      hero_gradient_accent: preset.accent,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/cms/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configs),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan perubahan");
      }

      setFeedback({
        type: "success",
        message: "Pengaturan visual web & hero berhasil diperbarui!",
      });

      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Terjadi kesalahan saat menyimpan",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8e6df] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#C8A44E]/10 text-[#C8A44E]">
              <Palette className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-[#1a1a2e]">Hero, Branding & Desain Web</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Sesuaikan video background, judul, tipografi font Google, dan palet warna beranda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handlePurgeCache}
            disabled={purgingCache}
            title="Bersihkan cache ISR/PPR di server dan Vercel agar perubahan langsung tampil di publik"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${purgingCache ? "animate-spin text-[#C8A44E]" : ""}`} />
            <span>{purgingCache ? "Membersihkan Cache..." : "Bersihkan Cache Vercel"}</span>
          </button>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-[#1a1a2e] px-3 py-2 rounded-lg border border-[#e8e6df] bg-white hover:bg-gray-50 transition-colors shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Lihat Beranda Publik
          </a>

          {canEdit && (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#C8A44E] hover:bg-[#b8933e] text-white text-sm font-semibold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Perubahan
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border text-sm transition-all animate-in fade-in slide-in-from-top-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Main Form Editor */}
      <div className="w-full space-y-6">
        <div>
          {/* Navigation Tabs */}
          <div className="flex border-b border-[#e8e6df] bg-white rounded-t-xl px-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab("media")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${
                activeTab === "media"
                  ? "border-[#C8A44E] text-[#1a1a2e]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Video className="w-4 h-4" />
              Media &amp; Headline
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("design")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${
                activeTab === "design"
                  ? "border-[#C8A44E] text-[#1a1a2e]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Type className="w-4 h-4" />
              Desain Web &amp; Tipografi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("stats")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${
                activeTab === "stats"
                  ? "border-[#C8A44E] text-[#1a1a2e]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Statistik &amp; CTA
            </button>
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-b-xl border border-t-0 border-[#e8e6df] p-6 sm:p-8 shadow-xs space-y-6">
            {/* TAB 1: Media & Headline */}
            {activeTab === "media" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                    URL Video YouTube (Background Hero Looping)
                  </label>
                  <input
                    type="text"
                    value={configs.hero_video || ""}
                    onChange={(e) => handleChange("hero_video", e.target.value)}
                    disabled={!canEdit}
                    placeholder="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                    className="w-full text-sm px-4 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">
                    Gunakan tautan embed YouTube seperti{" "}
                    <code className="text-[#C8A44E] bg-gray-50 px-1.5 py-0.5 rounded font-mono">
                      https://www.youtube.com/embed/dQw4w9WgXcQ
                    </code>
                    . Video otomatis diputar berulang tanpa suara. Kosongkan jika ingin menggunakan gambar latar cover.
                  </p>
                </div>

                {/* Fallback Cover Image (Dual Mode: URL & Upload) */}
                <div className="space-y-3.5 p-5 rounded-xl border border-[#e8e6df] bg-[#f8f7f4]/70">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider">
                        Fallback Cover Image (Latar Hero)
                      </label>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Gambar latar utama beranda jika video YouTube tidak diputar atau sedang loading.
                      </p>
                    </div>

                    {/* Mode Toggle Switch */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#e8e6df] text-xs font-medium self-start sm:self-auto shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setCoverMode("url")}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                          coverMode === "url"
                            ? "bg-[#1a1a2e] text-white font-semibold shadow-xs"
                            : "text-gray-500 hover:text-gray-900"
                        }`}
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        Tautan URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverMode("upload")}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                          coverMode === "upload"
                            ? "bg-[#1a1a2e] text-white font-semibold shadow-xs"
                            : "text-gray-500 hover:text-gray-900"
                        }`}
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        Unggah File
                      </button>
                    </div>
                  </div>

                  {/* Mode 1: URL Input */}
                  {coverMode === "url" && (
                    <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                      <input
                        type="text"
                        value={configs.hero_image || ""}
                        onChange={(e) => handleChange("hero_image", e.target.value)}
                        disabled={!canEdit}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full text-sm px-4 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                      />
                      <p className="text-[11px] text-gray-400">
                        Tempel tautan gambar beresolusi tinggi (misal dari Unsplash atau CDN eksternal).
                      </p>
                    </div>
                  )}

                  {/* Mode 2: Upload File Area */}
                  {coverMode === "upload" && (
                    <div className="space-y-2.5 pt-1 animate-in fade-in duration-150">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif,image/jpg"
                        onChange={handleCoverUpload}
                        disabled={!canEdit || uploadingCover}
                        className="hidden"
                      />

                      <div
                        onClick={() => canEdit && !uploadingCover && fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all bg-white cursor-pointer ${
                          uploadingCover
                            ? "border-[#C8A44E] bg-[#C8A44E]/5"
                            : "border-[#e8e6df] hover:border-[#C8A44E] hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          {uploadingCover ? (
                            <>
                              <Loader2 className="w-8 h-8 animate-spin text-[#C8A44E]" />
                              <div className="text-xs font-semibold text-[#1a1a2e]">
                                Mengoptimasi &amp; mengunggah gambar ke cloud...
                              </div>
                              <p className="text-[11px] text-gray-400">
                                Harap tunggu sebentar, file otomatis dikonversi ke WebP kualitas tinggi.
                              </p>
                            </>
                          ) : (
                            <>
                              <div className="p-3 rounded-full bg-[#C8A44E]/10 text-[#C8A44E]">
                                <UploadCloud className="w-6 h-6" />
                              </div>
                              <div className="text-xs font-semibold text-[#1a1a2e]">
                                Klik untuk memilih gambar dari perangkat Anda
                              </div>
                              <p className="text-[11px] text-gray-400 max-w-sm">
                                Mendukung format JPG, PNG, atau WebP (Maksimal 15 MB). File akan dioptimalkan ke format WebP berkualitas tinggi untuk banner hero.
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {uploadError && (
                        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                          <span>{uploadError}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Thumbnail Banner Preview if image exists */}
                  {configs.hero_image && (
                    <div className="mt-3 p-3.5 rounded-xl bg-white border border-[#e8e6df] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="w-24 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 shrink-0 relative shadow-2xs">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={configs.hero_image}
                            alt="Cover thumbnail"
                            className="w-full h-full object-cover"
                            onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-[#1a1a2e] flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-[#C8A44E]" />
                            Gambar Cover Terpasang
                          </div>
                          <p className="text-[11px] text-gray-400 truncate max-w-md font-mono mt-0.5">
                            {configs.hero_image}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <a
                          href={configs.hero_image}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg border border-[#e8e6df] text-gray-600 hover:text-[#1a1a2e] hover:bg-gray-100 transition-colors text-xs inline-flex items-center gap-1 font-medium"
                          title="Buka gambar di tab baru"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Lihat
                        </a>

                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleChange("hero_image", "")}
                            className="px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-xs inline-flex items-center gap-1 font-medium cursor-pointer"
                            title="Hapus gambar cover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                      Tagline Kecil (Di Atas Judul)
                    </label>
                    <input
                      type="text"
                      value={configs.hero_tagline || ""}
                      onChange={(e) => handleChange("hero_tagline", e.target.value)}
                      disabled={!canEdit}
                      placeholder="Hai, Hallo Tatangga"
                      className="w-full text-sm px-4 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                      Judul Utama Baris 1
                    </label>
                    <input
                      type="text"
                      value={configs.hero_title || ""}
                      onChange={(e) => handleChange("hero_title", e.target.value)}
                      disabled={!canEdit}
                      placeholder="Kemewahan Bertemu Ketenangan"
                      className="w-full text-sm px-4 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                    Kata Beraksen Miring Emas (Italic Accent Line 2)
                  </label>
                  <input
                    type="text"
                    value={configs.hero_title_italic || ""}
                    onChange={(e) => handleChange("hero_title_italic", e.target.value)}
                    disabled={!canEdit}
                    placeholder="Suaka Eksklusif Anda"
                    className="w-full text-sm px-4 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 italic focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">
                    Ditampilkan di bawah judul utama dengan gaya serif miring elegan dan aksen warna sekunder emas.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                    Subjudul / Deskripsi Pendukung
                  </label>
                  <textarea
                    rows={3}
                    value={configs.hero_subtitle || ""}
                    onChange={(e) => handleChange("hero_subtitle", e.target.value)}
                    disabled={!canEdit}
                    placeholder="Pengalaman menginap lengkap untuk momen yang lebih berkesan..."
                    className="w-full text-sm px-4 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: Desain & Tipografi */}
            {activeTab === "design" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Preset Themes */}
                <div className="p-5 rounded-xl bg-[#f8f7f4] border border-[#e8e6df]">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1a1a2e] mb-3">
                    <Sparkles className="w-4 h-4 text-[#C8A44E]" />
                    Palet Warna Tema Instan (Sekali Klik Mengganti Warna Website)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => handleApplyPreset(p)}
                        disabled={!canEdit}
                        className="p-3 text-left rounded-lg bg-white border border-[#e8e6df] hover:border-[#C8A44E] transition-all cursor-pointer group shadow-2xs hover:shadow-sm"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: p.primary }}
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: p.secondary }}
                          />
                        </div>
                        <p className="text-xs font-medium text-gray-800 line-clamp-1 group-hover:text-[#C8A44E]">
                          {p.name}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fonts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                      Font Judul Website (Display Font)
                    </label>
                    <select
                      value={configs.font_display || "Playfair Display"}
                      onChange={(e) => handleChange("font_display", e.target.value)}
                      disabled={!canEdit}
                      className="w-full text-sm px-4 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                    >
                      {DISPLAY_FONTS.map((f) => (
                        <option key={f.name} value={f.name}>
                          {f.name} ({f.category})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1.5">
                      Diterapkan pada semua judul di seluruh website publik (beranda, judul villa, headline artikel, dsb.).
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                      Font Isi Website (Body Font)
                    </label>
                    <select
                      value={configs.font_body || "DM Sans"}
                      onChange={(e) => handleChange("font_body", e.target.value)}
                      disabled={!canEdit}
                      className="w-full text-sm px-4 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                    >
                      {BODY_FONTS.map((f) => (
                        <option key={f.name} value={f.name}>
                          {f.name} ({f.category})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1.5">
                      Diterapkan pada seluruh teks paragraf, tombol, label formulir, dan navigasi website.
                    </p>
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                      Warna Primer Website (Primary)
                    </label>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="color"
                        value={configs.primary_color || "#1a1a2e"}
                        onChange={(e) => handleChange("primary_color", e.target.value)}
                        disabled={!canEdit}
                        className="w-10 h-10 p-1 rounded-lg border border-[#e8e6df] cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={configs.primary_color || "#1a1a2e"}
                        onChange={(e) => handleChange("primary_color", e.target.value)}
                        disabled={!canEdit}
                        className="w-full text-sm px-3.5 py-2 rounded-lg border border-[#e8e6df] bg-white font-mono uppercase"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Warna tema utama navbar, teks headings, tombol gelap, dan footer.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                      Warna Aksen Emas (Secondary / Accent)
                    </label>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="color"
                        value={configs.secondary_color || "#C8A44E"}
                        onChange={(e) => handleChange("secondary_color", e.target.value)}
                        disabled={!canEdit}
                        className="w-10 h-10 p-1 rounded-lg border border-[#e8e6df] cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={configs.secondary_color || "#C8A44E"}
                        onChange={(e) => handleChange("secondary_color", e.target.value)}
                        disabled={!canEdit}
                        className="w-full text-sm px-3.5 py-2 rounded-lg border border-[#e8e6df] bg-white font-mono uppercase"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Warna aksen tombol CTA, bintang ulasan, badge promo, dan sorotan emas.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                      Gradient Overlay Accent
                    </label>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="color"
                        value={configs.hero_gradient_accent || "#1a1a2e"}
                        onChange={(e) => handleChange("hero_gradient_accent", e.target.value)}
                        disabled={!canEdit}
                        className="w-10 h-10 p-1 rounded-lg border border-[#e8e6df] cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={configs.hero_gradient_accent || "#1a1a2e"}
                        onChange={(e) => handleChange("hero_gradient_accent", e.target.value)}
                        disabled={!canEdit}
                        className="w-full text-sm px-3.5 py-2 rounded-lg border border-[#e8e6df] bg-white font-mono uppercase"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Gradasi transisi video hero ke seksi villa beranda.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Statistik & CTA */}
            {activeTab === "stats" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                      Counter Properti
                    </label>
                    <input
                      type="text"
                      value={configs.stats_properties || ""}
                      onChange={(e) => handleChange("stats_properties", e.target.value)}
                      disabled={!canEdit}
                      placeholder="50+"
                      className="w-full text-sm px-4 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                      Counter Tamu
                    </label>
                    <input
                      type="text"
                      value={configs.stats_guests || ""}
                      onChange={(e) => handleChange("stats_guests", e.target.value)}
                      disabled={!canEdit}
                      placeholder="10K+"
                      className="w-full text-sm px-4 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                      Counter Rating
                    </label>
                    <input
                      type="text"
                      value={configs.stats_rating || ""}
                      onChange={(e) => handleChange("stats_rating", e.target.value)}
                      disabled={!canEdit}
                      placeholder="4.8"
                      className="w-full text-sm px-4 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                    />
                  </div>
                </div>

                <div className="border-t border-[#e8e6df] pt-6 space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                      Judul Banner CTA (Bawah Halaman)
                    </label>
                    <input
                      type="text"
                      value={configs.cta_title || ""}
                      onChange={(e) => handleChange("cta_title", e.target.value)}
                      disabled={!canEdit}
                      placeholder="Siap Untuk Liburan?"
                      className="w-full text-sm px-4 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                      Subjudul Banner CTA
                    </label>
                    <textarea
                      rows={2}
                      value={configs.cta_subtitle || ""}
                      onChange={(e) => handleChange("cta_subtitle", e.target.value)}
                      disabled={!canEdit}
                      placeholder="Hubungi kami dan dapatkan penawaran terbaik untuk villa impian Anda"
                      className="w-full text-sm px-4 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
