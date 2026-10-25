"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Plus,
  Search,
  Star,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { TestimonialModal } from "./testimonial-modal";

interface TestimonialsClientProps {
  initialTestimonials: any[];
  villas: { id: string; name: string }[];
  canEdit: boolean;
}

export function TestimonialsClient({
  initialTestimonials,
  villas,
  canEdit,
}: TestimonialsClientProps) {
  const [testimonials, setTestimonials] = useState<any[]>(initialTestimonials);
  const [search, setSearch] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState<"ALL" | "FEATURED" | "NON_FEATURED">("ALL");
  const [selectedVillaFilter, setSelectedVillaFilter] = useState("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const refreshTestimonials = async () => {
    try {
      const res = await fetch("/api/cms/testimonials");
      const data = await res.json();
      if (data.testimonials) {
        setTestimonials(data.testimonials);
      }
    } catch (e) {
      console.error("Failed to refresh testimonials:", e);
    }
  };

  const handleToggleFeatured = async (item: any) => {
    if (!canEdit) return;
    setTogglingId(item.id);
    try {
      const res = await fetch(`/api/cms/testimonials/${item.id}/featured`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTestimonials((prev) =>
        prev.map((t) => (t.id === item.id ? { ...t, isFeatured: !t.isFeatured } : t))
      );
      setNotification({
        type: "success",
        message: data.message || "Status featured berhasil diubah",
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Gagal mengubah status featured",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (item: any) => {
    if (!canEdit) return;
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus testimoni dari "${item.name}"?`
      )
    ) {
      return;
    }

    setDeletingId(item.id);
    try {
      const res = await fetch(`/api/cms/testimonials/${item.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTestimonials((prev) => prev.filter((t) => t.id !== item.id));
      setNotification({ type: "success", message: "Testimoni berhasil dihapus!" });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Gagal menghapus testimoni",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = testimonials.filter((item) => {
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase()) ||
      (item.villa?.name && item.villa.name.toLowerCase().includes(search.toLowerCase()));

    const matchesFilter =
      featuredFilter === "ALL" ||
      (featuredFilter === "FEATURED" && item.isFeatured) ||
      (featuredFilter === "NON_FEATURED" && !item.isFeatured);

    const matchesVilla =
      selectedVillaFilter === "ALL" ||
      (selectedVillaFilter === "GENERAL" ? !item.villaId : item.villaId === selectedVillaFilter);

    return matchesSearch && matchesFilter && matchesVilla;
  });

  const featuredCount = testimonials.filter((t) => t.isFeatured).length;
  const avgRating =
    testimonials.length > 0
      ? (
          testimonials.reduce((sum, t) => sum + (t.rating || 5), 0) /
          testimonials.length
        ).toFixed(1)
      : "5.0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8e6df] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#C8A44E]/10 text-[#C8A44E]">
              <MessageSquare className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-[#1a1a2e]">Kurasi Testimoni Tamu</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Kelola ulasan pengalaman tamu dan sematkan testimoni terbaik ke beranda publik.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-[#1a1a2e] px-3 py-2 rounded-lg border border-[#e8e6df] bg-white hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Cek Testimoni Beranda
          </a>

          {canEdit && (
            <button
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C8A44E] hover:bg-[#b8933e] text-white text-sm font-semibold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Testimoni
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#e8e6df] shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 uppercase font-semibold">Total Ulasan</div>
            <div className="text-2xl font-bold text-[#1a1a2e] mt-1">{testimonials.length}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-gray-50 text-gray-500 border border-gray-100">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#e8e6df] shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-[#C8A44E] uppercase font-semibold">Featured di Beranda</div>
            <div className="text-2xl font-bold text-[#C8A44E] mt-1">{featuredCount}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#C8A44E]/10 text-[#C8A44E] border border-[#C8A44E]/20">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#e8e6df] shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-600 uppercase font-semibold">Rata-rata Rating</div>
            <div className="text-2xl font-bold text-amber-700 mt-1 flex items-center gap-1.5">
              <span>{avgRating}</span>
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <Star className="w-5 h-5" />
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

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-[#e8e6df] p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan nama tamu atau kutipan ulasan..."
            className="w-full text-sm pl-9 pr-4 py-2 rounded-lg border border-[#e8e6df] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8A44E]/30 focus:border-[#C8A44E]"
          />
        </div>

        {/* Villa Filter Dropdown */}
        <select
          value={selectedVillaFilter}
          onChange={(e) => setSelectedVillaFilter(e.target.value)}
          className="text-xs px-3 py-2 rounded-lg border border-[#e8e6df] bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#C8A44E] shrink-0"
        >
          <option value="ALL">Semua Villa (Seluruh)</option>
          <option value="GENERAL">Pengalaman Umum (Tanpa Villa)</option>
          {villas.map((v) => (
            <option key={v.id} value={v.id}>
              Villa: {v.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-medium shrink-0">
          <button
            onClick={() => setFeaturedFilter("ALL")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              featuredFilter === "ALL"
                ? "bg-white text-[#1a1a2e] shadow-2xs font-semibold"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Semua ({testimonials.length})
          </button>
          <button
            onClick={() => setFeaturedFilter("FEATURED")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              featuredFilter === "FEATURED"
                ? "bg-white text-[#C8A44E] shadow-2xs font-semibold"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Featured Beranda ({featuredCount})
          </button>
          <button
            onClick={() => setFeaturedFilter("NON_FEATURED")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              featuredFilter === "NON_FEATURED"
                ? "bg-white text-gray-800 shadow-2xs font-semibold"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Bukan Featured ({testimonials.length - featuredCount})
          </button>
        </div>
      </div>

      {/* Grid of Reviews */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e8e6df] p-16 text-center max-w-xl mx-auto shadow-2xs">
          <div className="w-14 h-14 rounded-full bg-[#f8f7f4] border border-[#e8e6df] flex items-center justify-center mx-auto text-gray-400 mb-3">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#1a1a2e]">Belum Ada Testimoni</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-5">
            {search || featuredFilter !== "ALL"
              ? "Tidak ada testimoni yang cocok dengan kriteria pencarian."
              : "Tambahkan testimoni kepuasan tamu untuk meningkatkan kepercayaan calon pelanggan."}
          </p>
          {canEdit && (
            <button
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C8A44E] text-white text-xs font-semibold hover:bg-[#b8933e] transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Testimoni Sekarang
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border overflow-hidden shadow-2xs transition-all flex flex-col justify-between hover:shadow-md ${
                item.isFeatured
                  ? "border-[#C8A44E]/60 ring-1 ring-[#C8A44E]/20"
                  : "border-[#e8e6df]"
              }`}
            >
              <div className="p-5 space-y-3">
                {/* Top Row: Stars + Featured Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= item.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>

                  {item.isFeatured && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#C8A44E]/15 text-[#C8A44E]">
                      Featured
                    </span>
                  )}
                </div>

                {/* Review Quote */}
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed italic">
                  &ldquo;{item.content}&rdquo;
                </p>

                {/* Aspect Ratings Pills */}
                {(item.cleanlinessRating || item.serviceRating || item.facilityRating) && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-gray-500">
                    {item.serviceRating && (
                      <span className="px-2 py-0.5 rounded bg-amber-50/60 text-amber-800 border border-amber-200/50">
                        Pelayanan: ★{item.serviceRating}
                      </span>
                    )}
                    {item.cleanlinessRating && (
                      <span className="px-2 py-0.5 rounded bg-emerald-50/60 text-emerald-800 border border-emerald-200/50">
                        Kebersihan: ★{item.cleanlinessRating}
                      </span>
                    )}
                    {item.facilityRating && (
                      <span className="px-2 py-0.5 rounded bg-blue-50/60 text-blue-800 border border-blue-200/50">
                        Fasilitas: ★{item.facilityRating}
                      </span>
                    )}
                  </div>
                )}

                {/* Villa tag & Verified badge */}
                <div className="pt-1 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                    <Building2 className="w-3 h-3 text-[#C8A44E]" />
                    {item.villa?.name ? item.villa.name : "Pengalaman Umum"}
                  </span>

                  {item.bookingId && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      Tamu Selesai Menginap
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom: Guest author + Actions */}
              <div className="p-4 border-t border-[#e8e6df] bg-[#f8f7f4] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {item.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#1a1a2e] text-white flex items-center justify-center font-bold text-xs">
                      {item.name[0]}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-[#1a1a2e]">{item.name}</div>
                    <div className="text-[10px] text-gray-400">Tamu Terverifikasi</div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {canEdit && (
                    <>
                      <button
                        onClick={() => handleToggleFeatured(item)}
                        disabled={togglingId === item.id}
                        className={`p-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                          item.isFeatured
                            ? "bg-[#C8A44E] text-white border-[#C8A44E]"
                            : "bg-white text-gray-600 border-[#e8e6df] hover:border-[#C8A44E]"
                        }`}
                        title={item.isFeatured ? "Hapus dari Featured" : "Sematkan ke Beranda"}
                      >
                        {togglingId === item.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-md text-gray-500 hover:text-[#1a1a2e] hover:bg-gray-200/60 transition-colors cursor-pointer"
                        title="Edit testimoni"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(item)}
                        disabled={deletingId === item.id}
                        className="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Hapus testimoni"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <TestimonialModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSuccess={refreshTestimonials}
        testimonialToEdit={editingItem}
        villas={villas}
      />
    </div>
  );
}
