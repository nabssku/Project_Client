"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  Save,
  Eye,
  Edit3,
  Columns,
  Upload,
  Image as ImageIcon,
  Video,
  ExternalLink,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Quote,
  List,
  ListOrdered,
  Minus,
  Link2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Play,
  BarChart3,
  Globe,
  Layout,
  RefreshCw,
} from "lucide-react";
import { AboutRichRenderer } from "@/components/cms/about-rich-renderer";
import { extractYouTubeId, getYouTubeThumbnail, getYouTubeEmbedUrl } from "@/lib/youtube";
import { DEFAULT_ABOUT_CONFIGS } from "@/lib/about-config";

interface AboutCmsClientProps {
  initialConfigs: Record<string, string>;
  canEdit: boolean;
}

export function AboutCmsClient({ initialConfigs, canEdit }: AboutCmsClientProps) {
  const [configs, setConfigs] = useState<Record<string, string>>(initialConfigs);
  const [activeTab, setActiveTab] = useState<"content" | "hero" | "stats_seo">("content");
  const [viewMode, setViewMode] = useState<"write" | "split" | "preview">("split");

  // Save states
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Textarea ref for cursor insertion
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Link modal
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  // Image modal
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageModalTab, setImageModalTab] = useState<"upload" | "url">("upload");
  const [imageCaption, setImageCaption] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  // YouTube modal
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
  const [youTubeUrlInput, setYouTubeUrlInput] = useState("");
  const detectedVideoId = extractYouTubeId(youTubeUrlInput);

  // Hero image upload
  const [uploadingHero, setUploadingHero] = useState(false);
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  const updateConfig = (key: string, value: string) => {
    setConfigs((prev) => ({ ...prev, [key]: value }));
  };

  // Helper to insert markdown text at cursor
  const insertTextAtCursor = (before: string, after: string = "", defaultText: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = configs.about_content || "";
    const selectedText = currentVal.substring(start, end) || defaultText;

    const replacement = `${before}${selectedText}${after}`;
    const newContent = currentVal.substring(0, start) + replacement + currentVal.substring(end);

    updateConfig("about_content", newContent);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  // Insert link handler
  const handleInsertLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;
    const text = linkText.trim() || linkUrl.trim();
    insertTextAtCursor(`[${text}](`, `)`, linkUrl.trim());
    setIsLinkModalOpen(false);
    setLinkText("");
    setLinkUrl("");
  };

  // Insert image handler (from URL)
  const handleInsertImageUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;
    const alt = imageCaption.trim() || "Gambar Properti";
    insertTextAtCursor(`\n\n![${alt}](`, `)\n\n`, imageUrlInput.trim());
    setIsImageModalOpen(false);
    setImageUrlInput("");
    setImageCaption("");
  };

  // Upload image handler
  const handleUploadImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "about");

      const res = await fetch("/api/upload/cms-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Gagal mengunggah gambar");
      }

      const alt = imageCaption.trim() || file.name.replace(/\.[^/.]+$/, "");
      insertTextAtCursor(`\n\n![${alt}](`, `)\n\n`, data.url);
      setIsImageModalOpen(false);
      setImageCaption("");
      if (imageFileInputRef.current) imageFileInputRef.current.value = "";
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan saat mengunggah gambar");
    } finally {
      setUploadingImage(false);
    }
  };

  // Upload Hero image handler
  const handleUploadHeroImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingHero(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "hero");

      const res = await fetch("/api/upload/cms-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Gagal mengunggah foto banner");
      }

      updateConfig("about_hero_image", data.url);
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan saat mengunggah banner");
    } finally {
      setUploadingHero(false);
    }
  };

  // Insert YouTube video handler
  const handleInsertYouTube = (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = extractYouTubeId(youTubeUrlInput);
    if (!videoId) {
      alert("Link YouTube tidak valid. Pastikan link berupa format youtube.com atau youtu.be");
      return;
    }
    const cleanEmbedUrl = `https://www.youtube.com/watch?v=${videoId}`;
    insertTextAtCursor(`\n\n${cleanEmbedUrl}\n\n`);
    setIsYouTubeModalOpen(false);
    setYouTubeUrlInput("");
  };

  // Reset to default template
  const handleLoadDefaultTemplate = () => {
    if (
      window.confirm(
        "Apakah Anda yakin ingin memuat template standar Tentang Kami? Konten yang saat ini diketik akan ditimpa."
      )
    ) {
      updateConfig("about_content", DEFAULT_ABOUT_CONFIGS.about_content);
    }
  };

  // Save changes to API
  const handleSave = async () => {
    if (!canEdit) return;
    setSaving(true);
    setNotification(null);

    try {
      const res = await fetch("/api/cms/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configs),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan perubahan");
      }

      setNotification({
        type: "success",
        message: "Perubahan halaman Tentang Kami berhasil disimpan dan dipublikasikan!",
      });

      setTimeout(() => {
        setNotification(null);
      }, 5000);
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Terjadi kesalahan saat menyimpan",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <span>Dashboard</span>
            <span>/</span>
            <span>CMS</span>
            <span>/</span>
            <span className="text-accent font-semibold">Tentang Kami</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-primary flex items-center gap-2">
            <span>Kelola Halaman Tentang Kami</span>
            <Sparkles className="w-5 h-5 text-accent" />
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Kustomisasi narasi profil, nilai perusahaan, galeri foto, dan sematkan video YouTube dengan Rich Text Editor.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/about"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-xs"
          >
            <ExternalLink className="w-4 h-4 text-gray-500" />
            <span>Lihat Halaman Publik</span>
          </Link>

          <button
            onClick={handleSave}
            disabled={saving || !canEdit}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-accent text-primary-dark hover:bg-[#d4b366] disabled:opacity-50 transition-all shadow-sm cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notification banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm transition-all duration-300 ${
            notification.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          )}
          <span className="flex-1 font-medium">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex border-b border-gray-200 bg-white px-6 rounded-t-2xl pt-2">
        <button
          onClick={() => setActiveTab("content")}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === "content"
              ? "border-accent text-accent"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Editor Konten (Rich Text)</span>
        </button>

        <button
          onClick={() => setActiveTab("hero")}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === "hero"
              ? "border-accent text-accent"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Layout className="w-4 h-4" />
          <span>Banner Hero &amp; Media</span>
        </button>

        <button
          onClick={() => setActiveTab("stats_seo")}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === "stats_seo"
              ? "border-accent text-accent"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Statistik &amp; SEO Google</span>
        </button>
      </div>

      {/* TAB 1: RICH TEXT CONTENT EDITOR */}
      {activeTab === "content" && (
        <div className="bg-white rounded-b-2xl border border-t-0 border-gray-200/80 shadow-xs p-6 space-y-4">
          {/* Top toolbar & view mode switch */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-200">
            {/* Formatting tools */}
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => insertTextAtCursor("# ", "", "Judul Utama H1")}
                title="Heading 1"
                className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors cursor-pointer"
              >
                <Heading1 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor("## ", "", "Subjudul H2")}
                title="Heading 2"
                className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors cursor-pointer"
              >
                <Heading2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor("### ", "", "Subjudul H3")}
                title="Heading 3"
                className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors cursor-pointer"
              >
                <Heading3 className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-gray-200 mx-1" />

              <button
                type="button"
                onClick={() => insertTextAtCursor("**", "**", "teks tebal")}
                title="Tebal (Bold)"
                className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors cursor-pointer"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor("*", "*", "teks miring")}
                title="Miring (Italic)"
                className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors cursor-pointer"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor("~~", "~~", "teks coret")}
                title="Coret (Strikethrough)"
                className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors cursor-pointer"
              >
                <Strikethrough className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor("`", "`", "kode")}
                title="Kode"
                className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors cursor-pointer"
              >
                <Code className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-gray-200 mx-1" />

              <button
                type="button"
                onClick={() => insertTextAtCursor("> ", "", "Kutipan inspiratif")}
                title="Kutipan / Blockquote"
                className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors cursor-pointer"
              >
                <Quote className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor("- ", "", "Item daftar")}
                title="Daftar Titik (Bullet List)"
                className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors cursor-pointer"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor("1. ", "", "Item urutan")}
                title="Daftar Angka (Numbered List)"
                className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors cursor-pointer"
              >
                <ListOrdered className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor("\n\n---\n\n")}
                title="Garis Pemisah"
                className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(true)}
                title="Sisipkan Tautan (Link)"
                className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors cursor-pointer"
              >
                <Link2 className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-gray-200 mx-1" />

              {/* Special Insertion Modals */}
              <button
                type="button"
                onClick={() => setIsImageModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>+ Gambar Sendiri</span>
              </button>

              <button
                type="button"
                onClick={() => setIsYouTubeModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
              >
                <Video className="w-3.5 h-3.5" />
                <span>+ Video YouTube</span>
              </button>
            </div>

            {/* Template & View mode switcher */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadDefaultTemplate}
                title="Muat teks bawaan standar"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Muat Template</span>
              </button>

              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setViewMode("write")}
                  className={`p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    viewMode === "write"
                      ? "bg-white text-primary shadow-xs font-semibold"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                  title="Tampilan Editor Teks"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("split")}
                  className={`p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    viewMode === "split"
                      ? "bg-white text-primary shadow-xs font-semibold"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                  title="Tampilan Berdampingan (Split Screen)"
                >
                  <Columns className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("preview")}
                  className={`p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    viewMode === "preview"
                      ? "bg-white text-primary shadow-xs font-semibold"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                  title="Pratinjau Penuh"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Editor and Preview Area */}
          <div
            className={`grid gap-6 ${
              viewMode === "split"
                ? "grid-cols-1 lg:grid-cols-2"
                : "grid-cols-1"
            }`}
          >
            {/* Editor Textarea */}
            {(viewMode === "write" || viewMode === "split") && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-semibold uppercase tracking-wider text-gray-400">
                    Area Penulisan (Markdown &amp; Rich Format)
                  </span>
                  <span>{configs.about_content?.length || 0} karakter</span>
                </div>
                <textarea
                  ref={textareaRef}
                  value={configs.about_content || ""}
                  onChange={(e) => updateConfig("about_content", e.target.value)}
                  placeholder="Tulis cerita, filosofi, komitmen pelayanan, dan sematkan media gambar atau YouTube..."
                  rows={26}
                  className="w-full font-mono text-sm leading-relaxed p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-y bg-[#fafafa]"
                />
                <p className="text-[11px] text-gray-500 italic">
                  💡 Tips: Letakkan link video YouTube di baris baru secara mandiri atau gunakan tombol <strong>+ Video YouTube</strong> di atas untuk menyematkan otomatis player video.
                </p>
              </div>
            )}

            {/* Live Interactive Preview */}
            {(viewMode === "preview" || viewMode === "split") && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-semibold uppercase tracking-wider text-accent flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Pratinjau Langsung (Live Preview)</span>
                  </span>
                  <span className="text-[11px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                    Tampilan Tamu
                  </span>
                </div>
                <div className="p-6 sm:p-8 rounded-xl border border-gray-200 bg-[#fcfbf9] overflow-y-auto max-h-[640px] shadow-inner">
                  <AboutRichRenderer content={configs.about_content || ""} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: HERO BANNER & MEDIA UTAMA */}
      {activeTab === "hero" && (
        <div className="bg-white rounded-b-2xl border border-t-0 border-gray-200/80 shadow-xs p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title & Subtitle */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Judul Banner Hero
                </label>
                <input
                  type="text"
                  value={configs.about_title || ""}
                  onChange={(e) => updateConfig("about_title", e.target.value)}
                  placeholder="Contoh: Tentang Singgahsana"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Subjudul / Slogan Hero
                </label>
                <textarea
                  value={configs.about_subtitle || ""}
                  onChange={(e) => updateConfig("about_subtitle", e.target.value)}
                  rows={3}
                  placeholder="Contoh: Kenyamanan Suaka Eksklusif dan Suasana Damai untuk Liburan Istimewa Anda"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Video Unggulan Utama (Opsional)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={configs.about_video_url || ""}
                    onChange={(e) => updateConfig("about_video_url", e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                  />
                  <Video className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Video profil tambahan yang dapat disorot pada kartu perkenalan.
                </p>
              </div>
            </div>

            {/* Hero Image */}
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                Foto Banner Hero Utama
              </label>

              {/* Image Preview */}
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 aspect-[16/9] bg-gray-100 flex items-center justify-center">
                {configs.about_hero_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={configs.about_hero_image}
                    alt="Banner Hero Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6 text-gray-400">
                    <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Belum ada foto banner</p>
                  </div>
                )}
                {uploadingHero && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-accent" />
                    <span className="text-xs font-semibold">Mengunggah Banner...</span>
                  </div>
                )}
              </div>

              {/* Upload controls */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="file"
                  ref={heroFileInputRef}
                  onChange={handleUploadHeroImage}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => heroFileInputRef.current?.click()}
                  disabled={uploadingHero}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors shadow-xs cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Unggah dari Perangkat</span>
                </button>

                <span className="text-xs text-gray-400 font-medium">atau</span>

                <input
                  type="url"
                  value={configs.about_hero_image || ""}
                  onChange={(e) => updateConfig("about_hero_image", e.target.value)}
                  placeholder="Atau tempel URL gambar..."
                  className="w-full flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STATISTIK & SEO */}
      {activeTab === "stats_seo" && (
        <div className="bg-white rounded-b-2xl border border-t-0 border-gray-200/80 shadow-xs p-6 space-y-8">
          {/* Section 1: 4 Key Statistics */}
          <div>
            <h3 className="text-sm font-bold font-display text-primary uppercase tracking-wider mb-1 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-accent" />
              <span>4 Kartu Statistik Pencapaian</span>
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Angka kredibilitas yang tampil di bawah banner Tentang Kami untuk membangun kepercayaan tamu.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stat 1 */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Statistik 1</label>
                <input
                  type="text"
                  value={configs.about_stat_1_val || ""}
                  onChange={(e) => updateConfig("about_stat_1_val", e.target.value)}
                  placeholder="Nilai (e.g. 15+)"
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-primary"
                />
                <input
                  type="text"
                  value={configs.about_stat_1_lbl || ""}
                  onChange={(e) => updateConfig("about_stat_1_lbl", e.target.value)}
                  placeholder="Label (e.g. Unit Villa Eksklusif)"
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600"
                />
              </div>

              {/* Stat 2 */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Statistik 2</label>
                <input
                  type="text"
                  value={configs.about_stat_2_val || ""}
                  onChange={(e) => updateConfig("about_stat_2_val", e.target.value)}
                  placeholder="Nilai (e.g. 10.000+)"
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-primary"
                />
                <input
                  type="text"
                  value={configs.about_stat_2_lbl || ""}
                  onChange={(e) => updateConfig("about_stat_2_lbl", e.target.value)}
                  placeholder="Label (e.g. Tamu Bahagia)"
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600"
                />
              </div>

              {/* Stat 3 */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Statistik 3</label>
                <input
                  type="text"
                  value={configs.about_stat_3_val || ""}
                  onChange={(e) => updateConfig("about_stat_3_val", e.target.value)}
                  placeholder="Nilai (e.g. 4.9 / 5.0)"
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-primary"
                />
                <input
                  type="text"
                  value={configs.about_stat_3_lbl || ""}
                  onChange={(e) => updateConfig("about_stat_3_lbl", e.target.value)}
                  placeholder="Label (e.g. Rating Kepuasan)"
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600"
                />
              </div>

              {/* Stat 4 */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Statistik 4</label>
                <input
                  type="text"
                  value={configs.about_stat_4_val || ""}
                  onChange={(e) => updateConfig("about_stat_4_val", e.target.value)}
                  placeholder="Nilai (e.g. 7+ Tahun)"
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-primary"
                />
                <input
                  type="text"
                  value={configs.about_stat_4_lbl || ""}
                  onChange={(e) => updateConfig("about_stat_4_lbl", e.target.value)}
                  placeholder="Label (e.g. Dedikasi Pelayanan)"
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Section 2: SEO Meta Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold font-display text-primary uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-accent" />
                <span>Pengaturan SEO Google</span>
              </h3>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={configs.about_meta_title || ""}
                  onChange={(e) => updateConfig("about_meta_title", e.target.value)}
                  placeholder="Judul yang tampil di tab browser & hasil pencarian Google"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Meta Description
                </label>
                <textarea
                  value={configs.about_meta_description || ""}
                  onChange={(e) => updateConfig("about_meta_description", e.target.value)}
                  rows={3}
                  placeholder="Deskripsi ringkas 150-160 karakter untuk snippet Google..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent resize-none"
                />
              </div>
            </div>

            {/* Google Search Result Preview */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                Pratinjau Hasil Pencarian Google
              </label>
              <div className="p-5 rounded-2xl border border-gray-200 bg-white shadow-xs space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-[#202124]">
                  <span className="font-medium">singgahsana.com</span>
                  <span className="text-gray-400">› about</span>
                </div>
                <h4 className="text-lg font-medium text-[#1a0dab] hover:underline cursor-pointer leading-snug">
                  {configs.about_meta_title || configs.about_title || "Tentang Kami"}
                </h4>
                <p className="text-xs text-[#4d5156] leading-relaxed">
                  {configs.about_meta_description ||
                    configs.about_subtitle ||
                    "Informasi profil dan komitmen kenyamanan villa..."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: INSERT LINK ================= */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-base text-primary flex items-center gap-2">
                <Link2 className="w-4 h-4 text-accent" />
                <span>Sisipkan Tautan (Link)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInsertLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Teks Tautan
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Contoh: Lihat Katalog Villa"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  URL Tujuan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="Contoh: /villas atau https://..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary-dark"
                >
                  Sisipkan Tautan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: INSERT IMAGE ================= */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-base text-primary flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>Sisipkan Gambar ke Konten</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tabs: Upload vs URL */}
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => setImageModalTab("upload")}
                className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  imageModalTab === "upload"
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                Unggah File Langsung
              </button>
              <button
                type="button"
                onClick={() => setImageModalTab("url")}
                className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  imageModalTab === "url"
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                Gunakan URL Gambar
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Keterangan Foto / Alt Text (Opsional)
                </label>
                <input
                  type="text"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="Contoh: Pemandangan kolam renang privat saat senja"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {imageModalTab === "upload" ? (
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={imageFileInputRef}
                    onChange={handleUploadImageFile}
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="hidden"
                  />
                  <div
                    onClick={() => !uploadingImage && imageFileInputRef.current?.click()}
                    className={`border-2 border-dashed border-gray-300 hover:border-emerald-500 p-8 rounded-2xl text-center cursor-pointer transition-colors bg-gray-50/50 ${
                      uploadingImage ? "pointer-events-none opacity-60" : ""
                    }`}
                  >
                    {uploadingImage ? (
                      <div className="flex flex-col items-center justify-center gap-2 text-emerald-700">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-xs font-semibold">Mengompresi &amp; Mengunggah Gambar...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 text-gray-600">
                        <Upload className="w-8 h-8 text-emerald-600 mb-1" />
                        <span className="text-xs font-semibold text-gray-800">
                          Klik untuk memilih file gambar dari komputer / HP Anda
                        </span>
                        <span className="text-[11px] text-gray-400">
                          Mendukung JPG, PNG, WebP (Otomatis dioptimalkan)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleInsertImageUrl} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Link / URL Gambar <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsImageModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800"
                    >
                      Sisipkan ke Konten
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: INSERT YOUTUBE VIDEO ================= */}
      {isYouTubeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-base text-primary flex items-center gap-2">
                <Video className="w-4 h-4 text-red-600" />
                <span>Sematkan Video YouTube</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsYouTubeModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInsertYouTube} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Link / URL Video YouTube <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={youTubeUrlInput}
                  onChange={(e) => setYouTubeUrlInput(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Mendukung link video standar, link pendek youtu.be, maupun YouTube Shorts.
                </p>
              </div>

              {/* Real-time YouTube Preview */}
              {detectedVideoId ? (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Video Ditemukan (ID: {detectedVideoId})</span>
                  </span>
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-black">
                    <iframe
                      src={getYouTubeEmbedUrl(detectedVideoId)}
                      title="Pratinjau YouTube"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      className="absolute inset-0 w-full h-full border-0"
                    />
                  </div>
                </div>
              ) : youTubeUrlInput.trim().length > 5 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Format link belum terdeteksi sebagai URL YouTube yang valid.</span>
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsYouTubeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!detectedVideoId}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Sisipkan Video ke Konten
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
