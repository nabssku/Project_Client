"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { formatIDR } from "@/lib/pricing";
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
} from "lucide-react";

export default function BookingStatusPage() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBooking(null);

    if (!code.trim() || !email.trim()) {
      setError("Silakan isi kode booking dan email Anda.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/bookings/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          email: email.trim(),
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Terkonfirmasi
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
            Masukkan kode booking dan email yang digunakan saat pemesanan untuk melihat status reservasi Anda.
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Kode Booking
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Misal: BK-8K29FXLA"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-mono text-sm uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Email Pemesan
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm"
                />
              </div>
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
                <span className="text-gray-400 block mb-0.5">Total Bayar</span>
                <span className="font-bold text-accent text-sm tabular-nums">
                  {formatIDR(booking.totalPrice)}
                </span>
                <span className="text-[11px] text-gray-500 block">
                  {booking.paymentMethod}
                </span>
              </div>
            </div>

            {/* Proof Status */}
            {booking.paymentProofUrl ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>Bukti pembayaran sudah diunggah.</span>
                </div>
                <a
                  href={booking.paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  Lihat File
                </a>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-800">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Bukti transfer belum diunggah.</span>
                </div>
                <Link
                  href={`/booking/${booking.code}`}
                  className="font-semibold text-accent hover:underline"
                >
                  Unggah Sekarang
                </Link>
              </div>
            )}

            {/* Completed Review Banner */}
            {booking.status === "COMPLETED" && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-amber-900">
                  <Sparkles className="w-5 h-5 text-[#C8A44E] shrink-0" />
                  <div>
                    <span className="font-bold block">Masa Menginap Telah Selesai</span>
                    <span className="text-gray-600">Bagikan penilaian pelayanan & kebersihan Anda untuk {booking.villa.name}</span>
                  </div>
                </div>
                <Link
                  href={`/booking/${booking.code}#review`}
                  className="px-4 py-2 rounded-xl bg-[#C8A44E] hover:bg-[#b8933e] text-white font-semibold text-xs transition-colors shrink-0 text-center"
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
                <span>Buka Rincian Pembayaran & QRIS</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
