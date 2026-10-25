"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  FileText,
  Search,
  Globe,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tag,
  Sparkles,
  Upload,
  Link2,
  ExternalLink,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Eye,
  Edit2,
  Plus,
  Trash2,
  ImagePlus,
} from "lucide-react";
import { ArticleRichRenderer } from "@/components/cms/article-rich-renderer";

interface ArticleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  articleToEdit?: any | null;
  siteName?: string;
  availableCategories?: string[];
}

export function ArticleFormModal({
  isOpen,
  onClose,
  onSuccess,
  articleToEdit,
  siteName = "Villa Luxury Stay",
  availableCategories = [
    "Panduan Wisata",
    "Rekomendasi Villa",
    "Tips Liburan",
    "Info & Event",
    "Kuliner & Budaya",
  ],
}: ArticleFormModalProps) {
  const isEditing = Boolean(articleToEdit);

  const [activeTab, setActiveTab] = useState<"content" | "seo" | "publish">("content");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");

  // Cover image states
  const [coverImage, setCoverImage] = useState("");
  const [coverMode, setCoverMode] = useState<"url" | "upload">("upload");
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Category states
  const [categoriesList, setCategoriesList] = useState<string[]>(availableCategories);
  const [category, setCategory] = useState("Panduan Wisata");
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState("");

  // Tags & SEO
  const [tagsInput, setTagsInput] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  // Editor states
  const [editorView, setEditorView] = useState<"write" | "preview">("write");
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Modal Insert Link
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  // Modal Insert Image
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageModalTab, setImageModalTab] = useState<"upload" | "url">("upload");
  const [bodyImageUrl, setBodyImageUrl] = useState("");
  const [bodyImageAlt, setBodyImageAlt] = useState("");
  const [uploadingBodyImage, setUploadingBodyImage] = useState(false);
  const bodyImageFileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync available categories
  useEffect(() => {
    const set = new Set([...availableCategories]);
    if (articleToEdit?.category) {
      set.add(articleToEdit.category);
    }
    setCategoriesList(Array.from(set));
  }, [availableCategories, articleToEdit]);

  useEffect(() => {
    if (articleToEdit) {
      setTitle(articleToEdit.title || "");
      setSlug(articleToEdit.slug || "");
      setExcerpt(articleToEdit.excerpt || "");
      setContent(articleToEdit.content || "");
      setCoverImage(articleToEdit.coverImage || "");
      setCategory(articleToEdit.category || "Panduan Wisata");
      setTagsInput(articleToEdit.tags ? articleToEdit.tags.join(", ") : "");
      setMetaTitle(articleToEdit.metaTitle || "");
      setMetaDescription(articleToEdit.metaDescription || "");
      setIsPublished(articleToEdit.isPublished ?? true);
      setIsCustomCategoryMode(false);
      setCustomCategoryInput("");
    } else {
      setTitle("");
      setSlug("");
      setExcerpt("");
      setContent("");
      setCoverImage("");
      setCategory(availableCategories[0] || "Panduan Wisata");
      setTagsInput("");
      setMetaTitle("");
      setMetaDescription("");
      setIsPublished(true);
      setIsCustomCategoryMode(false);
      setCustomCategoryInput("");
    }
    setError(null);
    setActiveTab("content");
    setEditorView("write");
  }, [articleToEdit, isOpen, availableCategories]);

  if (!isOpen) return null;

  // Auto-slugify helper if slug is empty
  const computedSlug = slug.trim()
    ? slug
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
    : title
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "");

  const effectiveMetaTitle = metaTitle.trim() || title || "Judul Artikel Anda";
  const effectiveMetaDesc =
    metaDescription.trim() ||
    excerpt.trim() ||
    "Temukan panduan liburan terlengkap, rekomendasi villa eksklusif, dan tips perjalanan terbaik di sini.";

  // Handle Cover Image Upload
  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "cms/articles");

      const res = await fetch("/api/upload/cms-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah gambar sampul");

      setCoverImage(data.url);
    } catch (err: any) {
      setError(err.message || "Gagal mengunggah gambar");
    } finally {
      setUploadingCover(false);
    }
  };

  // Helper for inserting formatting inside the content textarea
  const insertFormatting = (prefix: string, suffix: string = "", placeholder: string = "") => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end) || placeholder;

    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);

    const replacement = `${prefix}${selectedText}${suffix}`;
    const newContent = `${before}${replacement}${after}`;
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 10);
  };

  // Handle Link Insertion
  const handleInsertLink = () => {
    if (!linkUrl.trim()) return;
    const text = linkText.trim() || linkUrl.trim();
    insertFormatting(`[${text}](`, `)`, linkUrl.trim());
    setIsLinkModalOpen(false);
    setLinkText("");
    setLinkUrl("");
  };

  // Handle Body Image Upload
  const handleBodyImageUpload = async (file: File) => {
    setUploadingBodyImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "cms/articles/content");

      const res = await fetch("/api/upload/cms-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah gambar");

      setBodyImageUrl(data.url);
    } catch (err: any) {
      alert(err.message || "Gagal mengunggah gambar");
    } finally {
      setUploadingBodyImage(false);
    }
  };

  // Confirm Insert Body Image
  const handleConfirmInsertImage = () => {
    if (!bodyImageUrl.trim()) return;
    const alt = bodyImageAlt.trim() || "Gambar Artikel";
    const markdownImage = `\n\n![${alt}](${bodyImageUrl.trim()})\n\n`;

    const textarea = contentTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const before = textarea.value.substring(0, start);
      const after = textarea.value.substring(start);
      setContent(`${before}${markdownImage}${after}`);
    } else {
      setContent((prev) => `${prev}${markdownImage}`);
    }

    setIsImageModalOpen(false);
    setBodyImageUrl("");
    setBodyImageAlt("");
  };

  // Apply custom category
  const handleAddCustomCategory = () => {
    const trimmed = customCategoryInput.trim();
    if (!trimmed) return;
    if (!categoriesList.includes(trimmed)) {
      setCategoriesList((prev) => [...prev, trimmed]);
    }
    setCategory(trimmed);
    setIsCustomCategoryMode(false);
    setCustomCategoryInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Judul artikel wajib diisi");
      setActiveTab("content");
      return;
    }

    if (!content.trim() || content.trim().length < 10) {
      setError("Konten artikel minimal 10 karakter");
      setActiveTab("content");
      return;
    }

    setSaving(true);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      slug: computedSlug,
      excerpt: excerpt.trim() || null,
      content,
      coverImage: coverImage.trim() || null,
      category: category.trim() || "Panduan Wisata",
      tags,
      metaTitle: metaTitle.trim() || null,
      metaDescription: metaDescription.trim() || null,
      isPublished,
    };

    try {
      const url = isEditing
        ? `/api/cms/articles/${articleToEdit.id}`
        : "/api/cms/articles";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan artikel");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menyimpan artikel");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-[#e8e6df] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e6df] bg-[#f8f7f4]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-[#C8A44E]/15 text-[#C8A44E]">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#1a1a2e]">
                {isEditing ? "Edit Artikel & Optimasi SEO" : "Tulis Artikel Baru"}
              </h2>
              <p className="text-xs text-gray-500">
                Kelola konten editorial, gambar pendukung, dan parameter SEO Google untuk meningkatkan ranking web.
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

        {/* Tab Navigation */}
        <div className="flex border-b border-[#e8e6df] px-6 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab("content")}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "content"
                ? "border-[#C8A44E] text-[#1a1a2e]"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <FileText className="w-4 h-4" />
            1. Konten Artikel
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("seo")}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "seo"
                ? "border-[#C8A44E] text-[#1a1a2e]"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <Search className="w-4 h-4" />
            2. Google SEO Snippet
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("publish")}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "publish"
                ? "border-[#C8A44E] text-[#1a1a2e]"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <Globe className="w-4 h-4" />
            3. Publikasi
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 max-h-[72vh] overflow-y-auto space-y-6">
            {/* TAB 1: Content */}
            {activeTab === "content" && (
              <div className="space-y-5">
                {/* Judul Artikel */}
                <div>
                  <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                    Judul Artikel <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: 7 Tips Memilih Villa Nyaman untuk Liburan Keluarga di Bandung"
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                    required
                  />
                </div>

                {/* Kategori & Slug URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Kategori Dinamis */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider">
                        Kategori Artikel
                      </label>
                      {!isCustomCategoryMode ? (
                        <button
                          type="button"
                          onClick={() => setIsCustomCategoryMode(true)}
                          className="text-[11px] font-semibold text-[#C8A44E] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          Kategori Baru
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsCustomCategoryMode(false)}
                          className="text-[11px] text-gray-500 hover:text-gray-700 underline cursor-pointer"
                        >
                          Pilih dari daftar
                        </button>
                      )}
                    </div>

                    {!isCustomCategoryMode ? (
                      <select
                        value={category}
                        onChange={(e) => {
                          if (e.target.value === "__add_new__") {
                            setIsCustomCategoryMode(true);
                          } else {
                            setCategory(e.target.value);
                          }
                        }}
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                      >
                        {categoriesList.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                        <option value="__add_new__" className="text-[#C8A44E] font-semibold">
                          + Tambah Kategori Baru...
                        </option>
                      </select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customCategoryInput}
                          onChange={(e) => setCustomCategoryInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomCategory();
                            }
                          }}
                          placeholder="Ketik kategori baru..."
                          className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-[#C8A44E] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomCategory}
                          className="px-3.5 py-2.5 rounded-lg bg-[#C8A44E] text-white text-xs font-semibold hover:bg-[#b8933e] cursor-pointer shrink-0"
                        >
                          Terapkan
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Slug URL */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                      Slug URL (Otomatis)
                    </label>
                    <div className="flex items-center rounded-lg border border-[#e8e6df] bg-gray-50 px-3 py-2">
                      <span className="text-xs text-gray-400 font-mono">/artikel/</span>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder={computedSlug || "judul-artikel"}
                        className="w-full text-xs font-mono bg-transparent text-gray-800 focus:outline-none ml-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Cover Image: Dual-Mode (URL / Upload) */}
                <div className="rounded-xl border border-[#e8e6df] p-4 bg-[#fcfbf9] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-bold text-[#1a1a2e] uppercase tracking-wider block">
                        Gambar Sampul (Cover Image)
                      </label>
                      <span className="text-[11px] text-gray-500">
                        Foto utama yang tampil di kartu katalog &amp; bagian atas artikel
                      </span>
                    </div>

                    {/* Mode Switcher */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#e8e6df] self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setCoverMode("upload")}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                          coverMode === "upload"
                            ? "bg-[#1a1a2e] text-white shadow-2xs"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <Upload className="w-3 h-3" />
                        Unggah File
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverMode("url")}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                          coverMode === "url"
                            ? "bg-[#1a1a2e] text-white shadow-2xs"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <Link2 className="w-3 h-3" />
                        Tautan URL
                      </button>
                    </div>
                  </div>

                  {/* Mode Upload */}
                  {coverMode === "upload" && !coverImage && (
                    <div>
                      <input
                        type="file"
                        ref={coverFileInputRef}
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCoverUpload(file);
                        }}
                      />
                      <div
                        onClick={() => coverFileInputRef.current?.click()}
                        className="border-2 border-dashed border-[#e8e6df] hover:border-[#C8A44E] bg-white rounded-xl p-6 text-center cursor-pointer transition-colors group"
                      >
                        {uploadingCover ? (
                          <div className="flex flex-col items-center justify-center py-2">
                            <Loader2 className="w-7 h-7 text-[#C8A44E] animate-spin mb-2" />
                            <span className="text-xs font-semibold text-gray-700">
                              Mengompresi &amp; Mengunggah Gambar...
                            </span>
                            <span className="text-[11px] text-gray-400 mt-0.5">
                              Format otomatis dikonversi ke WebP untuk performa kilat
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-amber-50 group-hover:bg-amber-100/70 text-[#C8A44E] flex items-center justify-center mb-2 transition-colors">
                              <Upload className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-semibold text-gray-800">
                              Pilih file gambar dari komputer Anda
                            </span>
                            <span className="text-[11px] text-gray-400 mt-1">
                              Format didukung: JPG, PNG, WebP (Maksimal 15 MB)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mode URL */}
                  {coverMode === "url" && (
                    <div>
                      <input
                        type="url"
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                      />
                    </div>
                  )}

                  {/* Active Cover Preview Card */}
                  {coverImage && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-[#e8e6df]">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-16 h-12 rounded-lg overflow-hidden border border-[#e8e6df] shrink-0 bg-gray-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={coverImage}
                            alt="Cover Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                          />
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-xs font-semibold text-[#1a1a2e] block truncate">
                            Gambar Sampul Terpasang
                          </span>
                          <span className="text-[11px] font-mono text-gray-400 truncate block max-w-sm">
                            {coverImage}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={coverImage}
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
                            setCoverImage("");
                            if (coverFileInputRef.current) coverFileInputRef.current.value = "";
                          }}
                          className="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Hapus gambar sampul"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Excerpt / Ringkasan */}
                <div>
                  <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                    Ringkasan Singkat (Excerpt)
                  </label>
                  <textarea
                    rows={2}
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Tulis 1-2 kalimat pengantar menarik yang muncul di kartu katalog artikel..."
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                  />
                </div>

                {/* Rich Text Editor for Konten Lengkap */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider">
                      Konten Lengkap Artikel <span className="text-red-500">*</span>
                    </label>

                    {/* View Switch: Tulis / Pratinjau */}
                    <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setEditorView("write")}
                        className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                          editorView === "write"
                            ? "bg-white text-[#1a1a2e] shadow-2xs font-semibold"
                            : "text-gray-500 hover:text-gray-900"
                        }`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Editor Tulis
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorView("preview")}
                        className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                          editorView === "preview"
                            ? "bg-white text-[#C8A44E] shadow-2xs font-semibold"
                            : "text-gray-500 hover:text-gray-900"
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Pratinjau Visual
                      </button>
                    </div>
                  </div>

                  {/* Editor Container */}
                  <div className="rounded-xl border border-[#e8e6df] overflow-hidden focus-within:border-[#C8A44E] focus-within:ring-2 focus-within:ring-[#C8A44E]/20 transition-all">
                    {/* Formatting Toolbar */}
                    <div className="bg-[#f8f7f4] border-b border-[#e8e6df] px-3 py-2 flex flex-wrap items-center gap-1 text-gray-700">
                      <button
                        type="button"
                        onClick={() => insertFormatting("**", "**", "teks tebal")}
                        className="p-1.5 rounded hover:bg-gray-200/70 text-gray-700 hover:text-black transition-colors cursor-pointer"
                        title="Tebal (Bold)"
                      >
                        <Bold className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting("*", "*", "teks miring")}
                        className="p-1.5 rounded hover:bg-gray-200/70 text-gray-700 hover:text-black transition-colors cursor-pointer"
                        title="Miring (Italic)"
                      >
                        <Italic className="w-4 h-4" />
                      </button>

                      <div className="h-4 w-px bg-gray-300 mx-1" />

                      <button
                        type="button"
                        onClick={() => insertFormatting("## ", "", "Judul Bagian H2")}
                        className="px-2 py-1 rounded text-xs font-bold hover:bg-gray-200/70 text-gray-700 hover:text-black transition-colors cursor-pointer"
                        title="Heading 2"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting("### ", "", "Sub-judul H3")}
                        className="px-2 py-1 rounded text-xs font-bold hover:bg-gray-200/70 text-gray-700 hover:text-black transition-colors cursor-pointer"
                        title="Heading 3"
                      >
                        H3
                      </button>

                      <div className="h-4 w-px bg-gray-300 mx-1" />

                      <button
                        type="button"
                        onClick={() => insertFormatting("- ", "", "Poin daftar")}
                        className="p-1.5 rounded hover:bg-gray-200/70 text-gray-700 hover:text-black transition-colors cursor-pointer"
                        title="Bullet List"
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting("1. ", "", "Langkah pertama")}
                        className="p-1.5 rounded hover:bg-gray-200/70 text-gray-700 hover:text-black transition-colors cursor-pointer"
                        title="Numbered List"
                      >
                        <ListOrdered className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting("> ", "", "Kutipan inspiratif...")}
                        className="p-1.5 rounded hover:bg-gray-200/70 text-gray-700 hover:text-black transition-colors cursor-pointer"
                        title="Blockquote"
                      >
                        <Quote className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting("\n\n---\n\n")}
                        className="p-1.5 rounded hover:bg-gray-200/70 text-gray-700 hover:text-black transition-colors cursor-pointer"
                        title="Garis Pemisah"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <div className="h-4 w-px bg-gray-300 mx-1" />

                      {/* Link Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const textarea = contentTextareaRef.current;
                          if (textarea) {
                            const selected = textarea.value.substring(
                              textarea.selectionStart,
                              textarea.selectionEnd
                            );
                            setLinkText(selected);
                          }
                          setIsLinkModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-white border border-[#e8e6df] text-gray-700 hover:bg-gray-50 hover:text-black transition-colors cursor-pointer shadow-2xs"
                        title="Sisipkan Tautan URL"
                      >
                        <Link2 className="w-3.5 h-3.5 text-[#C8A44E]" />
                        Link
                      </button>

                      {/* Image Button */}
                      <button
                        type="button"
                        onClick={() => setIsImageModalOpen(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-white border border-[#e8e6df] text-gray-700 hover:bg-gray-50 hover:text-black transition-colors cursor-pointer shadow-2xs"
                        title="Sisipkan Gambar ke Konten"
                      >
                        <ImagePlus className="w-3.5 h-3.5 text-emerald-600" />
                        Unggah / URL Gambar
                      </button>
                    </div>

                    {/* Mode Editor: Textarea */}
                    {editorView === "write" ? (
                      <textarea
                        ref={contentTextareaRef}
                        rows={12}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Tulis artikel Anda di sini... Gunakan tombol toolbar di atas untuk memasukkan gambar, link, heading, dan daftar bullet."
                        className="w-full text-sm font-sans p-4 bg-white text-gray-900 leading-relaxed focus:outline-none resize-y min-h-[260px]"
                        required
                      />
                    ) : (
                      /* Mode Preview: ArticleRichRenderer */
                      <div className="p-6 bg-white min-h-[260px] max-h-[460px] overflow-y-auto">
                        {content.trim() ? (
                          <ArticleRichRenderer content={content} />
                        ) : (
                          <div className="py-12 text-center text-gray-400 text-xs italic">
                            Belum ada konten artikel yang ditulis.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center justify-between">
                    <span>
                      Dukung formatting Markdown: gambar, link, heading, daftar, dan baris baru.
                    </span>
                    <span>
                      {content.split(/\s+/).filter(Boolean).length} kata &bull; {content.length} karakter
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: SEO Google */}
            {activeTab === "seo" && (
              <div className="space-y-6">
                {/* Live Google Search Snippet Preview */}
                <div className="p-5 rounded-xl bg-gray-50 border border-[#e8e6df] space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#C8A44E]" />
                      Pratinjau Hasil Pencarian Google (Search Result)
                    </span>
                    <span className="text-[11px] font-mono text-gray-400">Google SERP Snippet</span>
                  </div>

                  {/* Google Card Simulation */}
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm font-sans text-left space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded-full bg-[#1a1a2e] flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                        {siteName ? siteName[0].toUpperCase() : "V"}
                      </div>
                      <div className="text-xs text-gray-700 truncate">
                        villabooking.com &rsaquo; artikel &rsaquo; {computedSlug || "judul-artikel"}
                      </div>
                    </div>
                    <h3 className="text-base sm:text-lg text-[#1a0dab] hover:underline font-normal cursor-pointer leading-tight">
                      {effectiveMetaTitle} | {siteName}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#4d5156] leading-relaxed line-clamp-2">
                      {effectiveMetaDesc}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Nama brand <strong>{siteName}</strong> disinkronkan langsung dari konfigurasi database (<code>site_configs</code>).
                    </span>
                  </div>
                </div>

                {/* Meta Title */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider">
                      Meta Title (Judul Google)
                    </label>
                    <span
                      className={`text-[11px] font-mono ${
                        metaTitle.length > 60
                          ? "text-red-500 font-semibold"
                          : metaTitle.length >= 40
                          ? "text-emerald-600 font-semibold"
                          : "text-gray-400"
                      }`}
                    >
                      {metaTitle.length}/60 karakter (Rekomendasi: 50-60)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder={title || "Judul artikel yang dioptimasi untuk mesin pencari"}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                  />
                </div>

                {/* Meta Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider">
                      Meta Description (Deskripsi Google Snippet)
                    </label>
                    <span
                      className={`text-[11px] font-mono ${
                        metaDescription.length > 160
                          ? "text-red-500 font-semibold"
                          : metaDescription.length >= 120
                          ? "text-emerald-600 font-semibold"
                          : "text-gray-400"
                      }`}
                    >
                      {metaDescription.length}/160 karakter (Rekomendasi: 120-160)
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder={
                      excerpt ||
                      "Deskripsi singkat dan memikat yang muncul di bawah judul pada pencarian Google..."
                    }
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-semibold text-[#1a1a2e] uppercase tracking-wider mb-1.5">
                    Kata Kunci / Tags (Pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="liburan bandung, villa keluarga, tips villa, private pool"
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: Publikasi */}
            {activeTab === "publish" && (
              <div className="space-y-5">
                <div className="p-5 rounded-xl border border-[#e8e6df] bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-[#1a1a2e]">
                        Status Publikasi Artikel
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Artikel yang dipublikasikan akan langsung dapat diakses publik di{" "}
                        <code className="text-[#C8A44E]">/artikel/{computedSlug || "..."}</code>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPublished}
                        onChange={(e) => setIsPublished(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div
                    className={`p-3.5 rounded-lg text-xs font-medium ${
                      isPublished
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {isPublished ? (
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Artikel Aktif &amp; Terbuka untuk Publik (Published)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        Artikel Disimpan sebagai Draf Rahasia (Draft Mode)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#e8e6df] bg-[#f8f7f4]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              Batal
            </button>

            <div className="flex items-center gap-2">
              {activeTab !== "publish" && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(activeTab === "content" ? "seo" : "publish")
                  }
                  className="px-4 py-2 rounded-lg border border-[#e8e6df] bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Lanjut &rarr;
                </button>
              )}

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
                  "Simpan Perubahan Artikel"
                ) : isPublished ? (
                  "Publikasikan Artikel Sekarang"
                ) : (
                  "Simpan sebagai Draft"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* POPUP MODAL: Sisipkan Link */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-[#1a1a2e] flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-[#C8A44E]" />
                Sisipkan Tautan Hyperlink
              </h3>
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Teks Tautan
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Contoh: Kunjungi Villa Melati"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#C8A44E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  URL Tujuan (Web / Halaman)
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://... atau /villas/villa-tropical"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#C8A44E]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                disabled={!linkUrl.trim()}
                className="px-4 py-1.5 rounded-lg bg-[#C8A44E] text-white text-xs font-semibold hover:bg-[#b8933e] disabled:opacity-50 cursor-pointer"
              >
                Sisipkan Tautan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: Sisipkan Gambar ke Konten Artikel */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-[#1a1a2e] flex items-center gap-1.5">
                <ImagePlus className="w-4 h-4 text-emerald-600" />
                Sisipkan Gambar ke Konten Artikel
              </h3>
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Switch Tab: Upload vs URL */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-medium mb-4">
              <button
                type="button"
                onClick={() => setImageModalTab("upload")}
                className={`flex-1 py-1.5 text-center rounded-md transition-all cursor-pointer ${
                  imageModalTab === "upload"
                    ? "bg-white text-[#1a1a2e] shadow-2xs font-semibold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                📤 Unggah Gambar
              </button>
              <button
                type="button"
                onClick={() => setImageModalTab("url")}
                className={`flex-1 py-1.5 text-center rounded-md transition-all cursor-pointer ${
                  imageModalTab === "url"
                    ? "bg-white text-[#1a1a2e] shadow-2xs font-semibold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                🔗 Tautan URL Gambar
              </button>
            </div>

            <div className="space-y-4">
              {imageModalTab === "upload" ? (
                <div>
                  <input
                    type="file"
                    ref={bodyImageFileInputRef}
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleBodyImageUpload(file);
                    }}
                  />
                  <div
                    onClick={() => bodyImageFileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#e8e6df] hover:border-emerald-500 bg-gray-50/50 rounded-xl p-5 text-center cursor-pointer transition-colors"
                  >
                    {uploadingBodyImage ? (
                      <div className="flex flex-col items-center justify-center py-2">
                        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mb-1.5" />
                        <span className="text-xs font-semibold text-gray-700">
                          Mengunggah Gambar...
                        </span>
                      </div>
                    ) : bodyImageUrl ? (
                      <div className="flex flex-col items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={bodyImageUrl}
                          alt="Uploaded"
                          className="w-32 h-20 object-cover rounded-lg border border-gray-200 mb-2 shadow-2xs"
                        />
                        <span className="text-xs font-semibold text-emerald-600">
                          Gambar berhasil diunggah! Klik untuk ganti
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <Upload className="w-6 h-6 text-emerald-600 mb-1.5" />
                        <span className="text-xs font-semibold text-gray-800">
                          Klik untuk memilih file gambar
                        </span>
                        <span className="text-[11px] text-gray-400 mt-0.5">
                          JPG, PNG, WebP (Maks 15 MB)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    URL Gambar
                  </label>
                  <input
                    type="url"
                    value={bodyImageUrl}
                    onChange={(e) => setBodyImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Alt / Caption */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Keterangan / Caption Gambar (Alt Text)
                </label>
                <input
                  type="text"
                  value={bodyImageAlt}
                  onChange={(e) => setBodyImageAlt(e.target.value)}
                  placeholder="Contoh: Suasana infinity pool dengan pemandangan pegunungan"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmInsertImage}
                disabled={!bodyImageUrl.trim()}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
              >
                Sisipkan ke Artikel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
