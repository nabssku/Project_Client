"use client";

import React, { useState } from "react";
import {
  Newspaper,
  Plus,
  Search,
  ExternalLink,
  Edit3,
  Trash2,
  CheckCircle2,
  Eye,
  Loader2,
  AlertCircle,
  FileText,
  Tag,
  Calendar,
  Sparkles,
} from "lucide-react";
import { ArticleFormModal } from "./article-form-modal";

interface ArticlesClientProps {
  initialArticles: any[];
  canEdit: boolean;
  siteName?: string;
  initialCategories?: string[];
}


export function ArticlesClient({
  initialArticles,
  canEdit,
  siteName = "Villa Luxury Stay",
  initialCategories = [
    "Panduan Wisata",
    "Rekomendasi Villa",
    "Tips Liburan",
    "Info & Event",
    "Kuliner & Budaya",
  ],
}: ArticlesClientProps) {
  const [articles, setArticles] = useState<any[]>(initialArticles);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");

  const categories = React.useMemo(() => {
    const set = new Set<string>(["Semua", ...initialCategories]);
    articles.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set);
  }, [articles, initialCategories]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const refreshArticles = async () => {
    try {
      const res = await fetch("/api/cms/articles");
      const data = await res.json();
      if (data.articles) {
        setArticles(data.articles);
      }
    } catch (e) {
      console.error("Failed to refresh articles:", e);
    }
  };

  const handleTogglePublish = async (article: any) => {
    if (!canEdit) return;
    setTogglingId(article.id);
    try {
      const res = await fetch(`/api/cms/articles/${article.id}/publish`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, isPublished: !a.isPublished } : a))
      );
      setNotification({
        type: "success",
        message: data.message || "Status publikasi berhasil diperbarui",
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Gagal mengubah status" });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (article: any) => {
    if (!canEdit) return;
    if (!window.confirm(`Apakah Anda yakin ingin menghapus artikel "${article.title}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    setDeletingId(article.id);
    try {
      const res = await fetch(`/api/cms/articles/${article.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setArticles((prev) => prev.filter((a) => a.id !== article.id));
      setNotification({ type: "success", message: "Artikel berhasil dihapus!" });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Gagal menghapus artikel" });
    } finally {
      setDeletingId(null);
    }
  };

  // Filter articles
  const filteredArticles = articles.filter((a) => {
    const matchesSearch =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.excerpt && a.excerpt.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selectedCategory === "Semua" || a.category === selectedCategory;

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PUBLISHED" && a.isPublished) ||
      (statusFilter === "DRAFT" && !a.isPublished);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalPublished = articles.filter((a) => a.isPublished).length;
  const totalDraft = articles.filter((a) => !a.isPublished).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8e6df] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-accent/10 text-accent">
              <Newspaper className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-primary">Artikel &amp; SEO Blog</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Publikasikan panduan liburan, rekomendasi villa, dan tingkatkan ranking SEO organik di Google.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/artikel"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-primary px-3 py-2 rounded-lg border border-[#e8e6df] bg-white hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Buka Katalog Publik
          </a>

          {canEdit && (
            <button
              onClick={() => {
                setEditingArticle(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-[#b8933e] text-white text-sm font-semibold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tulis Artikel Baru
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#e8e6df] shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 uppercase font-semibold">Total Artikel</div>
            <div className="text-2xl font-bold text-primary mt-1">{articles.length}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-gray-50 text-gray-500 border border-gray-100">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#e8e6df] shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-emerald-600 uppercase font-semibold">Tayang (Published)</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{totalPublished}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#e8e6df] shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-600 uppercase font-semibold">Draf (Draft)</div>
            <div className="text-2xl font-bold text-amber-700 mt-1">{totalDraft}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <AlertCircle className="w-5 h-5" />
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

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-[#e8e6df] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari artikel berdasarkan judul atau konten..."
              className="w-full text-sm pl-9 pr-4 py-2 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-accent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 self-start md:self-auto bg-gray-100 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-white text-primary shadow-2xs font-semibold"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Semua ({articles.length})
            </button>
            <button
              onClick={() => setStatusFilter("PUBLISHED")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                statusFilter === "PUBLISHED"
                  ? "bg-white text-emerald-700 shadow-2xs font-semibold"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Tayang ({totalPublished})
            </button>
            <button
              onClick={() => setStatusFilter("DRAFT")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                statusFilter === "DRAFT"
                  ? "bg-white text-amber-700 shadow-2xs font-semibold"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Draf ({totalDraft})
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-400 font-medium shrink-0 mr-1">Kategori:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid / Empty State */}
      {filteredArticles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e8e6df] p-12 text-center shadow-2xs">
          <div className="w-14 h-14 rounded-full bg-[#f8f7f4] border border-[#e8e6df] flex items-center justify-center mx-auto text-gray-400 mb-3">
            <Newspaper className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-primary">Belum Ada Artikel</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-5">
            {search || selectedCategory !== "Semua" || statusFilter !== "ALL"
              ? "Tidak ditemukan artikel yang cocok dengan filter pencarian Anda."
              : "Mulai tulis artikel panduan wisata pertama Anda untuk meningkatkan ranking Google!"}
          </p>
          {canEdit && (
            <button
              onClick={() => {
                setEditingArticle(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-[#b8933e] transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Tulis Artikel Sekarang
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className="bg-white rounded-xl border border-[#e8e6df] shadow-2xs overflow-hidden flex flex-col justify-between hover:border-accent/40 hover:shadow-md transition-all group"
            >
              <div>
                {/* Cover Image Thumbnail */}
                <div className="relative h-44 bg-gray-100 overflow-hidden">
                  {article.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                      <FileText className="w-10 h-10" />
                      <span className="text-[11px] font-medium text-gray-400 mt-1">
                        Tanpa Cover
                      </span>
                    </div>
                  )}

                  {/* Badges on Cover */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/90 backdrop-blur-md text-primary shadow-xs">
                      {article.category}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-xs ${
                        article.isPublished
                          ? "bg-emerald-600/90 text-white"
                          : "bg-amber-500/90 text-white"
                      }`}
                    >
                      {article.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>

                {/* Article Info */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(article.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {article.author?.name && (
                      <>
                        <span>&bull;</span>
                        <span>{article.author.name}</span>
                      </>
                    )}
                  </div>

                  <h3 className="font-bold text-primary text-base leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                    {article.title}
                  </h3>

                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {article.excerpt || article.content.substring(0, 120)}...
                  </p>

                  {/* SEO preview pill */}
                  <div className="pt-2 text-[11px] text-gray-400 font-mono truncate">
                    /artikel/{article.slug}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-3 border-t border-[#e8e6df] bg-[#f8f7f4] flex items-center justify-between">
                <a
                  href={`/artikel/${article.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-primary"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Pratinjau
                </a>

                {canEdit && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleTogglePublish(article)}
                      disabled={togglingId === article.id}
                      className={`text-[11px] px-2 py-1 rounded-md font-medium border transition-colors cursor-pointer ${
                        article.isPublished
                          ? "bg-white border-amber-200 text-amber-700 hover:bg-amber-50"
                          : "bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {togglingId === article.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : article.isPublished ? (
                        "Jadikan Draft"
                      ) : (
                        "Tayangkan"
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setEditingArticle(article);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-md text-gray-500 hover:text-primary hover:bg-gray-200/60 transition-colors cursor-pointer"
                      title="Edit artikel & SEO"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(article)}
                      disabled={deletingId === article.id}
                      className="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Hapus artikel"
                    >
                      {deletingId === article.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <ArticleFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingArticle(null);
        }}
        onSuccess={refreshArticles}
        articleToEdit={editingArticle}
        siteName={siteName}
        availableCategories={categories.filter((c) => c !== "Semua")}
      />
    </div>
  );
}
