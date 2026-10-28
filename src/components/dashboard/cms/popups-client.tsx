"use client";

import React, { useState } from "react";
import {
  Megaphone,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  ExternalLink,
  Eye,
  Sparkles,
} from "lucide-react";
import { PopupFormModal } from "./popup-form-modal";

interface PopupsClientProps {
  initialPopups: any[];
  canEdit: boolean;
}

export function PopupsClient({ initialPopups, canEdit }: PopupsClientProps) {
  const [popups, setPopups] = useState<any[]>(initialPopups);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState<any | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const refreshPopups = async () => {
    try {
      const res = await fetch("/api/cms/popups");
      const data = await res.json();
      if (data.popups) {
        setPopups(data.popups);
      }
    } catch (e) {
      console.error("Failed to refresh popups:", e);
    }
  };

  const handleToggleStatus = async (popup: any) => {
    if (!canEdit) return;
    setTogglingId(popup.id);
    try {
      const res = await fetch(`/api/cms/popups/${popup.id}/status`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPopups((prev) =>
        prev.map((p) => (p.id === popup.id ? { ...p, isActive: !p.isActive } : p))
      );
      setNotification({
        type: "success",
        message: data.message || "Status pop-up berhasil diubah",
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Gagal mengubah status",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (popup: any) => {
    if (!canEdit) return;
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus pop-up "${popup.title}"? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      return;
    }

    setDeletingId(popup.id);
    try {
      const res = await fetch(`/api/cms/popups/${popup.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPopups((prev) => prev.filter((p) => p.id !== popup.id));
      setNotification({ type: "success", message: "Pop-up berhasil dihapus!" });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Gagal menghapus pop-up",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const activePopupsCount = popups.filter((p) => p.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8e6df] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-accent/10 text-accent">
              <Megaphone className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-primary">Pop-up Promo &amp; Pengumuman</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Buat pesan promosi interaktif yang muncul ke pengunjung website publik secara otomatis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-primary px-3 py-2 rounded-lg border border-[#e8e6df] bg-white hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Cek Beranda Publik
          </a>

          {canEdit && (
            <button
              onClick={() => {
                setEditingPopup(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-[#b8933e] text-white text-sm font-semibold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Buat Pop-up Baru
            </button>
          )}
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

      {/* Info Banner */}
      {/*<div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Mekanisme Tampilan Pengunjung:</span> Pop-up yang aktif akan
          muncul secara elegan setelah jeda ~2.5 detik ketika pengunjung membuka beranda. Jika pengunjung
          menutup pop-up (klik tombol X), status disimpan di sesi browser (sessionStorage) agar pengunjung tidak
          terganggu berulang kali saat berpindah halaman.
        </div>
      </div>*/}

      {/* Popups List */}
      {popups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e8e6df] p-16 text-center max-w-xl mx-auto shadow-2xs">
          <div className="w-14 h-14 rounded-full bg-[#f8f7f4] border border-[#e8e6df] flex items-center justify-center mx-auto text-gray-400 mb-3">
            <Megaphone className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-primary">Belum Ada Pop-up Promo</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-5">
            Tingkatkan reservasi dengan membuat banner promosi diskon spesial atau pengumuman penting bagi calon tamu.
          </p>
          {canEdit && (
            <button
              onClick={() => {
                setEditingPopup(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-[#b8933e] transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Buat Pop-up Sekarang
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popups.map((popup) => (
            <div
              key={popup.id}
              className={`bg-white rounded-2xl border overflow-hidden shadow-2xs transition-all flex flex-col justify-between ${
                popup.isActive
                  ? "border-accent/50 shadow-md ring-1 ring-[#C8A44E]/20"
                  : "border-[#e8e6df] opacity-80"
              }`}
            >
              <div>
                {/* Banner Thumbnail */}
                <div className="h-40 bg-gray-100 relative overflow-hidden">
                  {popup.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={popup.imageUrl}
                      alt={popup.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary text-white/50">
                      <Megaphone className="w-8 h-8 opacity-40" />
                    </div>
                  )}

                  {/* Badge */}
                  {popup.badge && (
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent text-white shadow-xs">
                      {popup.badge}
                    </span>
                  )}

                  {/* Active status indicator */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-xs ${
                        popup.isActive
                          ? "bg-emerald-600/90 text-white"
                          : "bg-gray-700/80 text-white/70"
                      }`}
                    >
                      {popup.isActive ? "Aktif Tayang" : "Nonaktif"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-base text-primary leading-snug">
                    {popup.title}
                  </h3>

                  {popup.subtitle && (
                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                      {popup.subtitle}
                    </p>
                  )}

                  {popup.actionLabel && (
                    <div className="pt-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent bg-accent/10 px-3 py-1 rounded-lg">
                        CTA: {popup.actionLabel} &rarr; {popup.actionUrl || "#"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom footer bar */}
              <div className="p-3.5 border-t border-[#e8e6df] bg-[#f8f7f4] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-gray-500">Tayang:</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={popup.isActive}
                      onChange={() => handleToggleStatus(popup)}
                      disabled={!canEdit || togglingId === popup.id}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingPopup(popup);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-md text-gray-500 hover:text-primary hover:bg-gray-200/60 transition-colors cursor-pointer"
                      title="Edit pop-up"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(popup)}
                      disabled={deletingId === popup.id}
                      className="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Hapus pop-up"
                    >
                      {deletingId === popup.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
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
      <PopupFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPopup(null);
        }}
        onSuccess={refreshPopups}
        popupToEdit={editingPopup}
      />
    </div>
  );
}
