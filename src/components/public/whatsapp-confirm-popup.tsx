"use client";

import React from "react";
import {
  CheckCircle2,
  MessageCircle,
  X,
  FileCheck,
  ExternalLink,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { normalizeMediaUrl } from "@/lib/media";

interface WhatsAppConfirmPopupProps {
  isOpen: boolean;
  onClose: () => void;
  bookingCode: string;
  guestName: string;
  villaName: string;
  amountFormatted: string;
  proofType?: "PAYMENT" | "SETTLEMENT";
  proofUrl?: string | null;
  siteName?: string;
  contactPhone?: string | null;
}

export function WhatsAppConfirmPopup({
  isOpen,
  onClose,
  bookingCode,
  guestName,
  villaName,
  amountFormatted,
  proofType = "PAYMENT",
  proofUrl,
  siteName = "Villa",
  contactPhone,
}: WhatsAppConfirmPopupProps) {
  if (!isOpen) return null;

  const rawDigits = (contactPhone || "628111141888").replace(/\D/g, "");
  const waPhone = rawDigits
    ? rawDigits.startsWith("0")
      ? "62" + rawDigits.slice(1)
      : rawDigits.startsWith("62")
      ? rawDigits
      : "62" + rawDigits
    : "628111141888";

  const isSettlement = proofType === "SETTLEMENT";

  const waText = isSettlement
    ? `Halo Admin ${siteName}, saya telah mengunggah bukti transfer *Pelunasan* sebesar *${amountFormatted}* untuk Booking Code: *${bookingCode}* atas nama *${guestName}* (${villaName}). Mohon dibantu verifikasi. Terima kasih!`
    : `Halo Admin ${siteName}, saya telah melakukan pembayaran dan mengunggah bukti transfer sebesar *${amountFormatted}* untuk Booking Code: *${bookingCode}* atas nama *${guestName}* (${villaName}). Mohon dibantu verifikasi. Terima kasih!`;

  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}`;
  const normalizedProof = proofUrl ? normalizeMediaUrl(proofUrl) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden p-6 sm:p-7 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors cursor-pointer"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Success + WhatsApp Badge Icon */}
        <div className="relative inline-flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center border-2 border-white shadow-xs">
            <MessageCircle className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3 h-3" />
          <span>Upload Berhasil</span>
        </div>

        <h3 className="text-lg sm:text-xl font-bold font-display text-primary">
          {isSettlement
            ? "Bukti Pelunasan Terkirim!"
            : "Bukti Pembayaran Terkirim!"}
        </h3>

        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
          File bukti transfer Anda telah berhasil diunggah ke sistem. Lanjutkan{" "}
          <strong className="text-gray-700">Konfirmasi Cepat via WhatsApp</strong>{" "}
          agar tim {siteName} dapat segera memverifikasi pesanan Anda.
        </p>

        {/* Summary Details Box */}
        <div className="mt-5 p-4 rounded-2xl bg-[#faf9f5] border border-gray-200/80 text-left space-y-2.5 text-xs">
          <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
            <span className="text-gray-400">Kode Booking</span>
            <span className="font-mono font-bold text-sm text-primary">
              {bookingCode}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">Unit Villa</span>
            <span className="font-semibold text-gray-800 truncate max-w-[200px]">
              {villaName}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">Atas Nama</span>
            <span className="font-semibold text-gray-800 truncate max-w-[200px]">
              {guestName}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
            <span className="text-gray-500 font-medium">
              {isSettlement ? "Nominal Pelunasan" : "Nominal Pembayaran"}
            </span>
            <span className="font-bold text-accent text-sm tabular-nums">
              {amountFormatted}
            </span>
          </div>

          {normalizedProof && (
            <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium text-[11px]">
                <FileCheck className="w-3.5 h-3.5 shrink-0" />
                <span>File bukti tersimpan</span>
              </div>
              <a
                href={normalizedProof}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
              >
                <span>Lihat File</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-5 space-y-2.5">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full py-3.5 px-5 rounded-2xl bg-green-500 hover:bg-green-600 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-green-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Konfirmasi Cepat via WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-xs transition-colors cursor-pointer"
          >
            Nanti Saja, Tutup Pop-up
          </button>
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Pesan konfirmasi otomatis terisi dengan Kode Booking Anda</span>
        </div>
      </div>
    </div>
  );
}
