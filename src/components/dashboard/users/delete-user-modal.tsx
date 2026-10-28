"use client";

import React from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

interface DeleteUserModalProps {
  isOpen: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  errorMessage?: string;
}

export function DeleteUserModal({
  isOpen,
  user,
  onClose,
  onConfirm,
  isDeleting,
  errorMessage,
}: DeleteUserModalProps) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#e8e6df] p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          aria-label="Tutup modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-primary">
              Hapus Akun Pengguna
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun{" "}
              <strong className="text-primary">{user.name}</strong> ({user.email})?
              Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 leading-relaxed">
            {errorMessage}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#e8e6df]">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors flex items-center gap-2 shadow-xs"
          >
            {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Hapus Pengguna</span>
          </button>
        </div>
      </div>
    </div>
  );
}
