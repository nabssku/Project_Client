import Link from "next/link";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Wrench,
  ArrowUpRight,
  CreditCard,
  FileCheck,
} from "lucide-react";

interface ManajerDashboardProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  data: {
    pendingBookingsCount: number;
    confirmedBookingsCount: number;
    availableVillasCount: number;
    cleaningVillasCount: number;
    pendingBookingsList: Array<{
      id: string;
      code: string;
      guestName: string;
      guestPhone: string;
      guestEmail: string;
      checkIn: Date;
      checkOut: Date;
      totalPrice: number;
      notes: string | null;
      villa: { name: string };
    }>;
    upcomingCheckIns: Array<{
      id: string;
      code: string;
      guestName: string;
      guestPhone: string;
      checkIn: Date;
      checkOut: Date;
      totalPrice: number;
      status: string;
      villa: { name: string };
      assignedTo: { name: string } | null;
    }>;
    villasStatus: Array<{
      id: string;
      name: string;
      status: string;
      capacity: number;
      bedrooms: number;
    }>;
  };
}

export function ManajerDashboard({ user, data }: ManajerDashboardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#e8e6df]">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1a1a2e] tracking-tight">
            Operasional & Reservasi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Verifikasi pembayaran transfer, pantau jadwal check-in, dan kesiapan unit villa
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1a1a2e] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#C8A44E] hover:text-[#12121f] transition-all"
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Verifikasi Booking</span>
          </Link>
          <Link
            href="/dashboard/maintenance"
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#e8e6df] px-4 py-2 text-xs font-semibold text-[#1a1a2e] hover:bg-slate-50 transition-colors"
          >
            <Wrench className="h-3.5 w-3.5 text-slate-500" />
            <span>Housekeeping</span>
          </Link>
        </div>
      </div>

      {/* Subtle Alert if Pending Bookings need verification */}
      {data.pendingBookingsCount > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 text-amber-900 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-xs sm:text-sm">
              Ada {data.pendingBookingsCount} Reservasi Menunggu Verifikasi Pembayaran Manual
            </p>
            <p className="text-xs text-amber-800">
              Periksa mutasi rekening bank dan konfirmasi reservasi agar jadwal villa tidak bertabrakan.
            </p>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="rounded-2xl border border-[#e8e6df] bg-white p-5 shadow-xs hover:border-[#C8A44E]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Menunggu Verifikasi
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="font-display text-2xl sm:text-3xl font-bold text-amber-600">{data.pendingBookingsCount}</p>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
              Prioritas
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Status PENDING transfer</p>
        </div>

        <div className="rounded-2xl border border-[#e8e6df] bg-white p-5 shadow-xs hover:border-[#C8A44E]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Terkonfirmasi
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#1a1a2e]">{data.confirmedBookingsCount}</p>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Jadwal tamu aktif</p>
        </div>

        <div className="rounded-2xl border border-[#e8e6df] bg-white p-5 shadow-xs hover:border-[#C8A44E]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Unit Siap Huni
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a1a2e]/5 text-[#1a1a2e]">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#1a1a2e]">{data.availableVillasCount}</p>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Unit berstatus AVAILABLE</p>
        </div>

        <div className="rounded-2xl border border-[#e8e6df] bg-white p-5 shadow-xs hover:border-[#C8A44E]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Unit Cleaning
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C8A44E]/10 text-[#C8A44E]">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#1a1a2e]">{data.cleaningVillasCount}</p>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Unit proses housekeeping</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Pending Verification Queue (2 cols) */}
        <div className="rounded-2xl border border-[#e8e6df] bg-white shadow-xs lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#e8e6df] p-5">
            <div>
              <h2 className="font-display text-base font-bold text-[#1a1a2e]">Antrean Verifikasi Pembayaran</h2>
              <p className="text-xs text-slate-400">Reservasi transfer yang menunggu konfirmasi</p>
            </div>
            <Link
              href="/dashboard/bookings"
              className="text-xs font-semibold text-[#1a1a2e] hover:text-[#C8A44E] inline-flex items-center"
            >
              Semua Booking <ArrowUpRight className="h-3 w-3 ml-1" />
            </Link>
          </div>

          <div className="divide-y divide-[#e8e6df]/70">
            {data.pendingBookingsList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                Tidak ada pembayaran tertunda. Semua pesanan telah diverifikasi.
              </div>
            ) : (
              data.pendingBookingsList.map((b) => (
                <div key={b.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#f8f7f4]/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1a1a2e] text-xs sm:text-sm">{b.code}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        PENDING
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800">{b.villa.name}</p>
                    <p className="text-[11px] text-slate-500">
                      Tamu: <span className="font-medium text-[#1a1a2e]">{b.guestName}</span> ({b.guestPhone})
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Check-in: {formatDate(b.checkIn)} — Check-out: {formatDate(b.checkOut)}
                    </p>
                    {b.notes && (
                      <p className="text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded-lg mt-1 border border-amber-200/50">
                        Catatan: {b.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2.5 shrink-0">
                    <p className="font-display font-bold text-[#1a1a2e] text-base">{formatPrice(b.totalPrice)}</p>
                    <Link
                      href={`/dashboard/bookings?verify=${b.code}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a2e] text-white hover:bg-[#C8A44E] hover:text-[#12121f] text-xs font-semibold shadow-xs transition-colors"
                    >
                      <FileCheck className="h-3 w-3" />
                      <span>Verifikasi</span>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Villa Status (1 col) */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#e8e6df] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-bold text-[#1a1a2e]">Kesiapan Villa</h2>
              <Link
                href="/dashboard/villas"
                className="text-xs font-semibold text-[#1a1a2e] hover:text-[#C8A44E]"
              >
                Unit
              </Link>
            </div>
            <div className="space-y-2.5">
              {data.villasStatus.map((villa) => (
                <div key={villa.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#f8f7f4] border border-[#e8e6df]">
                  <div>
                    <p className="text-xs font-bold text-[#1a1a2e]">{villa.name}</p>
                    <p className="text-[11px] text-slate-400">{villa.capacity} Tamu • {villa.bedrooms} Kamar</p>
                  </div>
                  <span
                    className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                      villa.status === "AVAILABLE"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : villa.status === "CLEANING"
                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {villa.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
