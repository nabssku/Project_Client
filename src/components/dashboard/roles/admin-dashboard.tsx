import Link from "next/link";
import {
  Building2,
  CalendarDays,
  Users,
  DollarSign,
  ArrowUpRight,
  Settings,
  Activity,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface AdminDashboardProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  data: {
    villaCount: number;
    bookingCount: number;
    userCount: number;
    pendingBookings: number;
    totalRevenue: number;
    recentBookings: Array<{
      id: string;
      code: string;
      guestName: string;
      guestPhone: string;
      checkIn: Date;
      checkOut: Date;
      totalPrice: number;
      status: string;
      villa: { name: string };
    }>;
    recentLogs: Array<{
      id: string;
      action: string;
      entity: string;
      details: string | null;
      createdAt: Date;
      user: { name: string; role: string } | null;
    }>;
    usersList: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      isActive: boolean;
    }>;
  };
}

export function AdminDashboard({ user, data }: AdminDashboardProps) {
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
            Ringkasan Eksekutif
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Data ketersediaan villa, transaksi reservasi, dan aktivitas tim
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/dashboard/users"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1a1a2e] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#C8A44E] hover:text-[#12121f] transition-all"
          >
            <Users className="h-3.5 w-3.5" />
            <span>Kelola Staf</span>
          </Link>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#e8e6df] px-4 py-2 text-xs font-semibold text-[#1a1a2e] hover:bg-slate-50 transition-colors"
          >
            <Settings className="h-3.5 w-3.5 text-slate-500" />
            <span>Pengaturan</span>
          </Link>
        </div>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="rounded-2xl border border-[#e8e6df] bg-white p-5 shadow-xs hover:border-[#C8A44E]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Total Unit Villa
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a1a2e]/5 text-[#1a1a2e]">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#1a1a2e]">{data.villaCount}</p>
            <Link
              href="/dashboard/villas"
              className="text-xs font-medium text-[#C8A44E] hover:underline inline-flex items-center"
            >
              Lihat <ArrowUpRight className="h-3 w-3 ml-0.5" />
            </Link>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Unit terdaftar di platform</p>
        </div>

        <div className="rounded-2xl border border-[#e8e6df] bg-white p-5 shadow-xs hover:border-[#C8A44E]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Total Reservasi
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a1a2e]/5 text-[#1a1a2e]">
              <CalendarDays className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#1a1a2e]">{data.bookingCount}</p>
            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {data.pendingBookings} Pending
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Seluruh booking masuk</p>
        </div>

        <div className="rounded-2xl border border-[#e8e6df] bg-white p-5 shadow-xs hover:border-[#C8A44E]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Estimasi Revenue
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C8A44E]/10 text-[#C8A44E]">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-display text-xl sm:text-2xl font-bold text-[#1a1a2e] truncate">
              {formatPrice(data.totalRevenue)}
            </p>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Dari booking valid & selesai</p>
        </div>

        <div className="rounded-2xl border border-[#e8e6df] bg-white p-5 shadow-xs hover:border-[#C8A44E]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Pengguna & Staf
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a1a2e]/5 text-[#1a1a2e]">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#1a1a2e]">{data.userCount}</p>
            <Link
              href="/dashboard/users"
              className="text-xs font-medium text-[#C8A44E] hover:underline inline-flex items-center"
            >
              Kelola <ArrowUpRight className="h-3 w-3 ml-0.5" />
            </Link>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Admin, Manajer, Staf aktif</p>
        </div>
      </div>

      {/* Main Content: Tables & User List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Bookings Table (2 cols) */}
        <div className="rounded-2xl border border-[#e8e6df] bg-white shadow-xs lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#e8e6df] p-5">
            <div>
              <h2 className="font-display text-base font-bold text-[#1a1a2e]">Reservasi Terbaru</h2>
              <p className="text-xs text-slate-400">Daftar transaksi reservasi terakhir</p>
            </div>
            <Link
              href="/dashboard/bookings"
              className="text-xs font-semibold text-[#1a1a2e] hover:text-[#C8A44E] inline-flex items-center transition-colors"
            >
              Semua Booking <ArrowUpRight className="h-3 w-3 ml-1" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[550px]">
              <thead className="bg-[#f8f7f4] uppercase text-[10px] text-slate-500 font-semibold border-b border-[#e8e6df]">
                <tr>
                  <th className="px-5 py-3">Kode / Tamu</th>
                  <th className="px-5 py-3">Villa</th>
                  <th className="px-5 py-3">Periode</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8e6df]/70">
                {data.recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                      Belum ada reservasi masuk.
                    </td>
                  </tr>
                ) : (
                  data.recentBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-[#f8f7f4]/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-[#1a1a2e]">{b.code}</div>
                        <div className="text-slate-400 text-[11px]">{b.guestName}</div>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-700">
                        {b.villa?.name || "Unit Villa"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-[11px]">
                        <div>{formatDate(b.checkIn)}</div>
                        <div className="text-slate-400">s/d {formatDate(b.checkOut)}</div>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-[#1a1a2e]">
                        {formatPrice(b.totalPrice)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === "CONFIRMED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : b.status === "PENDING"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {b.status === "CONFIRMED" && <CheckCircle2 className="h-3 w-3" />}
                          {b.status === "PENDING" && <Clock className="h-3 w-3" />}
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Mini Lists (1 col) */}
        <div className="space-y-6">
          {/* User List */}
          <div className="rounded-2xl border border-[#e8e6df] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-bold text-[#1a1a2e]">Pengguna & Peran</h2>
              <Link
                href="/dashboard/users"
                className="text-xs font-semibold text-[#1a1a2e] hover:text-[#C8A44E]"
              >
                Kelola
              </Link>
            </div>
            <div className="space-y-2.5">
              {data.usersList.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#f8f7f4] border border-[#e8e6df]">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-[#1a1a2e] truncate">{u.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                  </div>
                  <span className="shrink-0 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#1a1a2e] text-white">
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Logs */}
          <div className="rounded-2xl border border-[#e8e6df] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#C8A44E]" />
                <h2 className="font-display text-base font-bold text-[#1a1a2e]">Log Aktivitas</h2>
              </div>
              <Link
                href="/dashboard/activity"
                className="text-xs font-semibold text-[#1a1a2e] hover:text-[#C8A44E]"
              >
                Semua
              </Link>
            </div>
            <div className="space-y-3">
              {data.recentLogs.length === 0 ? (
                <p className="text-xs text-slate-400">Belum ada riwayat aktivitas.</p>
              ) : (
                data.recentLogs.map((log) => (
                  <div key={log.id} className="text-xs border-l-2 border-[#C8A44E] pl-3 py-0.5 space-y-0.5">
                    <p className="font-semibold text-[#1a1a2e]">
                      {log.action} <span className="text-slate-400 font-normal">({log.user?.name || "Sistem"})</span>
                    </p>
                    <p className="text-slate-500 text-[11px] line-clamp-1">{log.details}</p>
                    <p className="text-[10px] text-slate-400">{formatDate(log.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
