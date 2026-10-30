"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { format, parseISO, subDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { formatIDR } from "@/lib/pricing";
import { normalizeMediaUrl } from "@/lib/media";
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  MapPin,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Building,
  Sparkles,
  Ticket,
  UploadCloud,
  Loader2,
  ExternalLink,
} from "lucide-react";

export default function BookingStatusPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<any>(null);
  const [uploadingSettlement, setUploadingSettlement] = useState(false);
  const [settlementError, setSettlementError] = useState("");
  const [settlementSuccess, setSettlementSuccess] = useState(false);

  const handleSettlementUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !booking) return;

    setUploadingSettlement(true);
    setSettlementError("");
    setSettlementSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bookingCode", booking.code);
      formData.append("proofType", "SETTLEMENT");

      const res = await fetch("/api/upload/payment-proof", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengunggah bukti pelunasan");
      }

      setBooking((prev: any) => ({
        ...prev,
        ...data.booking,
        settlementProofUrl:
          data.booking?.settlementProofUrl || prev?.settlementProofUrl,
        settlementProofUploadedAt:
          data.booking?.settlementProofUploadedAt || new Date().toISOString(),
      }));
      setSettlementSuccess(true);
    } catch (err: any) {
      setSettlementError(err.message || "Gagal mengunggah bukti pelunasan");
    } finally {
      setUploadingSettlement(false);
    }
  };

  const fetchBooking = async (bookingCode: string) => {
    if (!bookingCode.trim()) {
      setError("Silakan masukkan kode booking Anda.");
      return;
    }

    setError("");
    setBooking(null);
    setLoading(true);

    try {
      const res = await fetch("/api/bookings/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: bookingCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Pesanan tidak ditemukan.");
      }

      setBooking(data.booking);
    } catch (err: any) {
      setError(err.message || "Gagal mencari data pesanan.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBooking(code);
  };

  // Auto-search if ?code= is provided in URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get("code");
      if (urlCode) {
        const clean = urlCode.trim().toUpperCase();
        setCode(clean);
        fetchBooking(clean);
      }
    }
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Terkonfirmasi (Lunas)
          </span>
        );
      case "DP_50":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            DP 50% Terkonfirmasi
          </span>
        );
      case "CHECKED_IN":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <Building className="w-3.5 h-3.5" />
            Sedang Menginap
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Selesai
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <AlertCircle className="w-3.5 h-3.5" />
            Dibatalkan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5" />
            Menunggu Verifikasi
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-accent">
            Pelacakan Reservasi
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-primary mt-1">
            Cek Status Pesanan
          </h1>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            Masukkan kode booking reservasi Anda untuk melihat status konfirmasi dan rincian pesanan.
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-accent" />
                <span>Kode Booking Reservasi</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Misal: BK-8K29FXLA"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-mono text-base font-semibold uppercase tracking-wider placeholder:font-normal placeholder:tracking-normal"
              />
              <p className="text-[11px] text-gray-400 mt-1.5">
                Kode booking tertera pada bukti reservasi atau email konfirmasi Anda (awalan <strong>BK-</strong>).
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-light active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? "Mencari Pesanan..." : "Lacak Pesanan"}</span>
            </button>
          </form>
        </div>

        {/* Booking Result Card */}
        {booking && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-md animate-fade-in space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-5">
              <div>
                <span className="text-xs text-gray-400">Kode Booking</span>
                <p className="font-mono text-xl font-bold text-primary">
                  {booking.code}
                </p>
              </div>
              <div>{getStatusBadge(booking.status)}</div>
            </div>

            {/* Villa details */}
            <div className="flex gap-4 items-center">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-gray-100">
                <Image
                  src={booking.villa?.images?.[0] || "/placeholder-villa.jpg"}
                  alt={booking.villa?.name || "Villa"}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-primary">
                  {booking.villa.name}
                </h3>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-accent" />
                  {booking.villa.location}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Atas nama:{" "}
                  <span className="font-semibold text-gray-800">
                    {booking.guestName}
                  </span>
                </p>
              </div>
            </div>

            {/* Stay Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-cream p-4 rounded-2xl text-xs">
              <div>
                <span className="text-gray-400 block mb-0.5">Check-in</span>
                <span className="font-semibold text-gray-800 capitalize">
                  {format(parseISO(booking.checkIn), "d MMM yyyy", {
                    locale: localeId,
                  })}
                </span>
                <span className="text-[11px] text-gray-500 block">
                  {booking.villa.checkInTime} WIB
                </span>
              </div>

              <div>
                <span className="text-gray-400 block mb-0.5">Check-out</span>
                <span className="font-semibold text-gray-800 capitalize">
                  {format(parseISO(booking.checkOut), "d MMM yyyy", {
                    locale: localeId,
                  })}
                </span>
                <span className="text-[11px] text-gray-500 block">
                  {booking.villa.checkOutTime} WIB
                </span>
              </div>

              <div>
                <span className="text-gray-400 block mb-0.5">
                  {booking.status === "DP_50" ? "Status DP 50%" : "Total Bayar"}
                </span>
                <span className="font-bold text-accent text-sm tabular-nums">
                  {formatIDR(booking.totalPrice)}
                </span>
                <span className="text-[11px] text-gray-500 block">
                  {booking.status === "DP_50"
                    ? `DP: ${formatIDR(booking.dpAmount || Math.round(booking.totalPrice * 0.5))}`
                    : booking.paymentMethod}
                </span>
              </div>
            </div>

            {/* DP 50% Financial Summary Card */}
            {booking.status === "DP_50" && (() => {
              const dpPaid = booking.dpAmount || Math.round(booking.totalPrice * 0.5);
              const remainingBalance = Math.max(0, booking.totalPrice - dpPaid);
              const checkInParsed = parseISO(booking.checkIn);
              const settlementDue = subDays(checkInParsed, 1);

              return (
                <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 text-xs space-y-2.5 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-sky-200/70 pb-2">
                    <div className="flex items-center gap-2 text-sky-950 font-bold">
                      <ShieldCheck className="w-4 h-4 text-sky-600" />
                      <span>Status DP 50% Terkonfirmasi</span>
                    </div>
                    <span className="text-[10px] font-semibold text-sky-800 bg-sky-200/60 px-2.5 py-0.5 rounded-full">
                      Batas H-1 Check-In
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-gray-700">
                    <div>
                      <span className="text-gray-400 text-[10px] block">Total Biaya:</span>
                      <span className="font-semibold text-gray-900">{formatIDR(booking.totalPrice)}</span>
                    </div>
                    <div>
                      <span className="text-emerald-700 text-[10px] block font-medium">DP Diterima:</span>
                      <span className="font-bold text-emerald-800 tabular-nums">{formatIDR(dpPaid)}</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-accent text-[10px] block font-bold">Sisa Pelunasan:</span>
                      <span className="font-bold text-accent text-sm tabular-nums">{formatIDR(remainingBalance)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-sky-200/60 flex items-center justify-between text-[11px] text-sky-900">
                    <span>Jatuh Tempo Pelunasan:</span>
                    <span className="font-bold">
                      {format(settlementDue, "EEEE, d MMMM yyyy", { locale: localeId })} pukul {booking.villa.checkInTime} WIB
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Add-ons List if any */}
            {booking.addons && booking.addons.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-1.5">
                <span className="font-bold text-gray-500 text-[10px] uppercase tracking-wider block">
                  Fasilitas Tambahan (Add-on):
                </span>
                <div className="space-y-1">
                  {booking.addons.map((a: any) => (
                    <div key={a.id} className="flex justify-between text-gray-700">
                      <span>
                        {a.name} ({a.qty} {a.unit || "pcs"})
                      </span>
                      <span className="font-semibold text-gray-900 tabular-nums">
                        {formatIDR(a.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guest Notes if any */}
            {booking.notes && (
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs space-y-1">
                <span className="font-bold text-amber-900 text-[10px] uppercase tracking-wider block">
                  Catatan / Permintaan Khusus Tamu:
                </span>
                <p className="text-amber-800 italic leading-relaxed">
                  &ldquo;{booking.notes}&rdquo;
                </p>
              </div>
            )}

            {/* Cancelled / Rejected Banner */}
            {booking.status === "CANCELLED" ? (
              (() => {
                const isExpiredCancel =
                  booking.rejectionReason?.toLowerCase().includes("otomatis") ||
                  booking.rejectionReason?.toLowerCase().includes("kedaluwarsa") ||
                  booking.rejectionReason?.toLowerCase().includes("check-in") ||
                  booking.rejectionReason?.toLowerCase().includes("expired");

                return (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-rose-800 font-bold">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>
                        {isExpiredCancel
                          ? "Pesanan Kedaluwarsa & Dibatalkan Otomatis"
                          : "Bukti Pembayaran Ditolak / Reservasi Dibatalkan"}
                      </span>
                    </div>
                    <p className="text-rose-700 pl-6 leading-relaxed">
                      <strong>Alasan:</strong>{" "}
                      {booking.rejectionReason ||
                        (isExpiredCancel
                          ? "Batas waktu pembayaran telah kedaluwarsa karena telah melewati jadwal check-in."
                          : "Bukti transfer tidak sesuai atau tidak terbaca.")}
                    </p>
                    <div className="pl-6 pt-1">
                      {isExpiredCancel ? (
                        <Link
                          href={`/villas/${booking.villa.slug}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white font-semibold text-xs hover:bg-primary-dark transition-colors"
                        >
                          <span>Cari Jadwal Baru di Villa Ini</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <Link
                          href={`/booking/${booking.code}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition-colors"
                        >
                          <span>Unggah Ulang Bukti Pembayaran</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : booking.status === "DP_50" ? (
              (() => {
                const dpPaid = booking.dpAmount || Math.round(booking.totalPrice * 0.5);
                const remainingBalance = Math.max(0, booking.totalPrice - dpPaid);

                return (
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-sky-200 shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2 text-sky-950 font-bold text-xs sm:text-sm">
                          <UploadCloud className="w-4 h-4 text-sky-600 shrink-0" />
                          <span>Unggah Bukti Transfer Pelunasan ({formatIDR(remainingBalance)})</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Pelunasan sisa 50% wajib diselesaikan paling lambat H-1 sebelum tanggal check-in.
                        </p>
                      </div>
                      {booking.paymentProofUrl && (
                        <a
                          href={normalizeMediaUrl(booking.paymentProofUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline shrink-0 bg-cream px-2.5 py-1 rounded-lg border border-gray-200/80"
                        >
                          <span>Lihat Bukti DP</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {settlementError && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{settlementError}</span>
                      </div>
                    )}

                    {settlementSuccess && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Bukti pelunasan berhasil diunggah! Pengelola akan segera memverifikasi.</span>
                      </div>
                    )}

                    {booking.settlementProofUrl ? (
                      <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 text-emerald-800">
                          <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-bold block">
                              Bukti Transfer Pelunasan Berhasil Diunggah
                            </span>
                            <span className="text-[11px] text-emerald-700">
                              {booking.settlementProofUploadedAt
                                ? `Diunggah pada ${format(new Date(booking.settlementProofUploadedAt), "d MMM yyyy, HH:mm", { locale: localeId })} WIB (menunggu verifikasi)`
                                : "Sedang diverifikasi oleh manajer villa"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                          <a
                            href={normalizeMediaUrl(booking.settlementProofUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-emerald-800 hover:underline inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs"
                          >
                            <span>Lihat File</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <label className="text-accent hover:underline cursor-pointer font-semibold text-xs">
                            {uploadingSettlement ? "Mengunggah..." : "Unggah Ulang"}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,application/pdf"
                              onChange={handleSettlementUpload}
                              disabled={uploadingSettlement}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="border-2 border-dashed border-sky-300 hover:border-accent rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-sky-50/20 text-center">
                          {uploadingSettlement ? (
                            <div className="flex items-center gap-2 text-sky-800 text-xs font-semibold py-2">
                              <Loader2 className="w-4 h-4 animate-spin text-accent" />
                              <span>Sedang Mengunggah Bukti Pelunasan...</span>
                            </div>
                          ) : (
                            <>
                              <UploadCloud className="w-7 h-7 text-sky-600 mb-1.5" />
                              <span className="text-xs font-bold text-sky-950">
                                Klik di sini untuk memilih foto resi pelunasan
                              </span>
                              <span className="text-[10px] text-sky-700 mt-0.5">
                                JPG, PNG, WebP atau PDF (Maks. 10MB)
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            onChange={handleSettlementUpload}
                            disabled={uploadingSettlement}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : booking.paymentProofUrl ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>Bukti pembayaran sudah diunggah (sedang diverifikasi).</span>
                </div>
                <a
                  href={normalizeMediaUrl(booking.paymentProofUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  Lihat File
                </a>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-amber-800">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Bukti transfer belum diunggah &bull; Batas bayar sebelum check-in ({booking.villa.checkInTime} WIB).
                  </span>
                </div>
                <Link
                  href={`/booking/${booking.code}`}
                  className="font-semibold text-accent hover:underline shrink-0"
                >
                  Bayar &amp; Unggah Sekarang &rarr;
                </Link>
              </div>
            )}

            {/* Completed Review Banner */}
            {booking.status === "COMPLETED" && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-amber-900">
                  <Sparkles className="w-5 h-5 text-accent shrink-0" />
                  <div>
                    <span className="font-bold block">Masa Menginap Telah Selesai</span>
                    <span className="text-gray-600">Bagikan penilaian pelayanan & kebersihan Anda untuk {booking.villa.name}</span>
                  </div>
                </div>
                <Link
                  href={`/booking/${booking.code}#review`}
                  className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-light text-white font-semibold text-xs transition-colors shrink-0 text-center"
                >
                  Beri Ulasan Sekarang &rarr;
                </Link>
              </div>
            )}

            {/* Action button */}
            <div className="pt-2">
              <Link
                href={`/booking/${booking.code}`}
                className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
              >
                <span>Buka Rincian Pembayaran & Rekening Transfer</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
