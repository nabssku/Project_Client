"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { calculateStayBreakdown, formatIDR } from "@/lib/pricing";
import {
  Calendar,
  Users,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Tag,
  AlertCircle,
  Loader2,
  Lock,
  ArrowLeft,
} from "lucide-react";

interface VillaData {
  id: string;
  slug: string;
  name: string;
  location: string;
  pricePerNight: number;
  priceWeekend?: number | null;
  capacity: number;
  images: string[];
  checkInTime: string;
  checkOutTime: string;
  customPrices: Array<{
    startDate: string | Date;
    endDate: string | Date;
    price: number;
    reason?: string | null;
  }>;
}

interface BookingFlowClientProps {
  villa: VillaData;
  initialCheckIn: string;
  initialCheckOut: string;
  initialGuests: number;
  currentUser?: {
    id: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
}

export function BookingFlowClient({
  villa,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
  currentUser,
}: BookingFlowClientProps) {
  const router = useRouter();

  // Form states
  const [guestName, setGuestName] = useState(currentUser?.name || "");
  const [guestEmail, setGuestEmail] = useState(currentUser?.email || "");
  const [guestPhone, setGuestPhone] = useState(currentUser?.phone || "");
  const [guestCity, setGuestCity] = useState("");
  const [companionType, setCompanionType] = useState("Keluarga");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");

  // Account creation state
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Promo code states
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    title: string;
    discountPercent: number;
  } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Pricing breakdown calculation
  const breakdown = useMemo(() => {
    try {
      return calculateStayBreakdown(
        {
          pricePerNight: villa.pricePerNight,
          priceWeekend: villa.priceWeekend,
          customPrices: villa.customPrices,
        },
        initialCheckIn,
        initialCheckOut
      );
    } catch {
      return null;
    }
  }, [villa, initialCheckIn, initialCheckOut]);

  const discountAmount = useMemo(() => {
    if (!breakdown || !appliedPromo) return 0;
    return Math.round((breakdown.subtotal * appliedPromo.discountPercent) / 100);
  }, [breakdown, appliedPromo]);

  const finalTotal = useMemo(() => {
    if (!breakdown) return 0;
    return Math.max(0, breakdown.subtotal - discountAmount);
  }, [breakdown, discountAmount]);

  // Handle promo code verification
  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await fetch("/api/promos/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCodeInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setPromoError(data.error || "Kode promo tidak valid");
        setAppliedPromo(null);
      } else {
        setAppliedPromo({
          code: data.code,
          title: data.title,
          discountPercent: data.discountPercent,
        });
        setPromoError("");
      }
    } catch {
      setPromoError("Gagal memeriksa kode promo");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput("");
    setPromoError("");
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!guestName.trim()) {
      setFormError("Nama lengkap wajib diisi.");
      return;
    }
    if (!guestEmail.trim()) {
      setFormError("Email wajib diisi.");
      return;
    }
    if (!guestPhone.trim() || guestPhone.trim().length < 9) {
      setFormError("Nomor WhatsApp/telepon aktif minimal 9 digit.");
      return;
    }

    if (createAccount) {
      if (!password || password.length < 6) {
        setFormError("Kata sandi akun minimal 6 karakter.");
        return;
      }
      if (password !== confirmPassword) {
        setFormError("Konfirmasi kata sandi tidak cocok.");
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        villaId: villa.id,
        checkIn: initialCheckIn,
        checkOut: initialCheckOut,
        guestsCount: initialGuests,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim().toLowerCase(),
        guestPhone: guestPhone.trim(),
        guestCity: guestCity.trim() || undefined,
        companionType,
        notes: notes.trim() || undefined,
        promoCode: appliedPromo?.code || undefined,
        paymentMethod,
        createAccount,
        password: createAccount ? password : undefined,
      };

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const bookingCode = data.booking?.code || data.code;

      if (!res.ok || (!data.success && !bookingCode)) {
        throw new Error(data.error || "Gagal memproses booking. Silakan coba kembali.");
      }

      // Redirect to booking payment instruction page
      router.push(`/booking/${bookingCode}`);
    } catch (err: any) {
      setFormError(err.message || "Terjadi kesalahan saat memproses pesanan Anda.");
      setSubmitting(false);
    }
  };

  const formattedIn = format(parseISO(initialCheckIn), "EEEE, d MMMM yyyy", {
    locale: localeId,
  });
  const formattedOut = format(parseISO(initialCheckOut), "EEEE, d MMMM yyyy", {
    locale: localeId,
  });

  return (
    <div className="min-h-screen bg-[#faf9f5] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href={`/villas/${villa.slug}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Detail {villa.name}</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-primary mt-2">
            Konfirmasi Pemesanan
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Lengkapi data pemesan untuk menyelesaikan reservasi villa impian Anda.
          </p>
        </div>

        {formError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-700 text-sm animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
            {formError.includes("sudah dipesan") && (
              <Link
                href={`/villas/${villa.slug}#availability-calendar`}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition-colors shrink-0 text-center"
              >
                Pilih Tanggal Lain
              </Link>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form Fields */}
          <div className="lg:col-span-7 space-y-6">
            {/* Card: Guest Data */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-lg font-bold font-display text-primary mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-accent/15 text-accent text-xs font-bold flex items-center justify-center">
                  1
                </span>
                Data Pemesan
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Nama Lengkap Sesuai KTP <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                      Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="budi@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Bukti booking & invoice akan dikirim ke email ini.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                      Nomor WhatsApp <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="081234567890"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Untuk koordinasi check-in staf di lokasi.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                      Kota Asal (Opsional)
                    </label>
                    <input
                      type="text"
                      value={guestCity}
                      onChange={(e) => setGuestCity(e.target.value)}
                      placeholder="Contoh: Jakarta Selatan"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                      Kategori Rombongan
                    </label>
                    <select
                      value={companionType}
                      onChange={(e) => setCompanionType(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm bg-white"
                    >
                      <option value="Keluarga">Keluarga</option>
                      <option value="Pasangan">Pasangan</option>
                      <option value="Teman / Rekan Kerja">Teman / Rekan Kerja</option>
                      <option value="Rombongan / Acara Gathering">Rombongan / Gathering</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Permintaan Khusus atau Catatan
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Perkiraan tiba jam 15:00 WIB, butuh bantuan arahan parkir 2 mobil."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm"
                  ></textarea>
                </div>

                {/* Optional Account Creation */}
                {!currentUser && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createAccount}
                        onChange={(e) => setCreateAccount(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                      />
                      <div>
                        <span className="text-sm font-semibold text-gray-800">
                          Buat akun Singgahsana sekaligus
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Memudahkan Anda melihat riwayat reservasi, status pembayaran, dan penawaran khusus member di masa mendatang.
                        </p>
                      </div>
                    </label>

                    {createAccount && (
                      <div className="mt-4 pl-7 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                            Kata Sandi Akun
                          </label>
                          <div className="relative">
                            <input
                              type="password"
                              required={createAccount}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Minimal 6 karakter"
                              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm"
                            />
                            <Lock className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                            Konfirmasi Sandi
                          </label>
                          <input
                            type="password"
                            required={createAccount}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Ulangi kata sandi"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Card: Payment Method */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-lg font-bold font-display text-primary mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-accent/15 text-accent text-xs font-bold flex items-center justify-center">
                  2
                </span>
                Metode Pembayaran
              </h2>

              <div  className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* QRIS */}
                {/*<label
                  className={`p-4 rounded-2xl border-2 cursor-pointer flex items-start gap-3 transition-all ${
                    paymentMethod === "QRIS"
                      ? "border-accent bg-accent/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    disabled
                    type="radio"
                    name="paymentMethod"
                    value="QRIS"
                    checked={paymentMethod === "QRIS"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 text-accent focus:ring-accent"
                  />
                  <div>
                    <span className="font-bold text-sm text-gray-900 block">
                      QRIS Instant
                    </span>
                    <span className="text-xs text-gray-500 mt-0.5 block">
                      BCA, Mandiri, BRI, BNI, GoPay, OVO, ShopeePay, Dana & LinkAja
                    </span>
                    <span className="inline-block mt-2 text-[10px] bg-green-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full">
                      Sedang Maintenance
                    </span>
                  </div>
                </label>*/}

                {/* Transfer Bank */}
                <label
                  className={`p-4 rounded-2xl border-2 cursor-pointer flex items-start gap-3 transition-all ${
                    paymentMethod === "BANK_TRANSFER"
                      ? "border-accent bg-accent/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="BANK_TRANSFER"
                    checked={paymentMethod === "BANK_TRANSFER"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 text-accent focus:ring-accent"
                  />
                  <div>
                    <span className="font-bold text-sm text-gray-900 block">
                      Transfer Bank Manual
                    </span>
                    <span className="text-xs text-gray-500 mt-0.5 block">
                      BCA / Mandiri / BRI Singgahsana Management
                    </span>
                    <span className="inline-block mt-2 text-[10px] bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full">
                      Unggah Bukti Struk
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Card: Promo Code */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-sm font-bold font-display text-primary mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-accent" />
                Punya Kode Promo?
              </h2>

              {appliedPromo ? (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-xs uppercase tracking-wide text-emerald-900">
                        {appliedPromo.code} - Hemat {appliedPromo.discountPercent}%
                      </p>
                      <p className="text-[11px] text-emerald-700">{appliedPromo.title}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                      placeholder="Masukkan kode promo (misal: LIBURAN20)"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm uppercase"
                    />
                    <button
                      type="button"
                      disabled={promoLoading || !promoCodeInput.trim()}
                      onClick={handleApplyPromo}
                      className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:opacity-40 transition-colors shrink-0"
                    >
                      {promoLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Terapkan"
                      )}
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-xs text-rose-600">{promoError}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Reservation Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl shadow-primary/5 space-y-6">
              {/* Villa Preview */}
              <div className="flex gap-4 items-center">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-gray-100">
                  <Image
                    src={villa.images?.[0] || "/placeholder-villa.jpg"}
                    alt={villa.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
                    Villa Singgahsana
                  </span>
                  <h3 className="font-display font-bold text-lg text-primary leading-tight">
                    {villa.name}
                  </h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                    {villa.location}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100"></div>

              {/* Stay Detail Summary */}
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex items-start justify-between">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-accent" />
                    Check-in
                  </span>
                  <div className="text-right">
                    <span className="font-semibold text-gray-800 block capitalize">
                      {formattedIn}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Mulai {villa.checkInTime} WIB
                    </span>
                  </div>
                </div>

                <div className="flex items-start justify-between">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-accent" />
                    Check-out
                  </span>
                  <div className="text-right">
                    <span className="font-semibold text-gray-800 block capitalize">
                      {formattedOut}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Sebelum {villa.checkOutTime} WIB
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-accent" />
                    Durasi Menginap
                  </span>
                  <span className="font-semibold text-gray-800">
                    {breakdown?.nights || 1} Malam
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-accent" />
                    Jumlah Tamu
                  </span>
                  <span className="font-semibold text-gray-800">
                    {initialGuests} Tamu
                  </span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-cream rounded-2xl p-5 space-y-2.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Rincian Biaya
                </p>

                {breakdown?.breakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs sm:text-sm text-gray-700"
                  >
                    <span className="capitalize">
                      {item.dayName}
                      {item.type === "WEEKEND" && (
                        <span className="ml-1 text-[10px] text-amber-700 bg-amber-100/70 px-1 py-0.2 rounded">
                          Weekend
                        </span>
                      )}
                      {item.type === "HOLIDAY" && (
                        <span className="ml-1 text-[10px] text-rose-700 bg-rose-100/70 px-1 py-0.2 rounded">
                          {item.label}
                        </span>
                      )}
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatIDR(item.price)}
                    </span>
                  </div>
                ))}

                <div className="border-t border-gray-200/60 pt-2 flex items-center justify-between text-xs sm:text-sm text-gray-600">
                  <span>Subtotal ({breakdown?.nights || 1} malam)</span>
                  <span className="font-medium tabular-nums">
                    {formatIDR(breakdown?.subtotal || 0)}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-xs sm:text-sm text-emerald-700 font-semibold">
                    <span>Diskon Promo ({appliedPromo?.discountPercent}%)</span>
                    <span className="tabular-nums">- {formatIDR(discountAmount)}</span>
                  </div>
                )}

                <div className="border-t border-gray-200/80 pt-3 flex items-center justify-between">
                  <span className="font-bold text-gray-800 text-sm">
                    Total Pembayaran
                  </span>
                  <span className="font-display font-bold text-xl text-primary tabular-nums">
                    {formatIDR(finalTotal)}
                  </span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-accent text-white font-semibold text-base hover:bg-accent-light active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-accent/25"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Memproses Reservasi...</span>
                  </>
                ) : (
                  <span>Lanjutkan ke Pembayaran</span>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-gray-400 text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Transaksi Terenkripsi & Jaminan Reservasi Langsung</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
