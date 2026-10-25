import Link from "next/link";
import {
  Wrench,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
  ClipboardList,
} from "lucide-react";

interface MaintenanceDashboardProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  data: {
    activeTasksCount: number;
    cleaningCount: number;
    maintenanceCount: number;
    availableCount: number;
    tasksList: Array<{
      id: string;
      title: string;
      description: string | null;
      isCompleted: boolean;
      dueDate: Date | null;
      villa: {
        id: string;
        name: string;
        status: string;
      };
      assignedTo: {
        name: string;
      } | null;
    }>;
    villasList: Array<{
      id: string;
      name: string;
      status: string;
      location: string;
    }>;
  };
}

export function MaintenanceDashboard({ user, data }: MaintenanceDashboardProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#e8e6df]">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1a1a2e] tracking-tight">
            Housekeeping & Maintenance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Status kebersihan villa, tugas housekeeping pasca checkout, dan perbaikan fasilitas
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="rounded-2xl border border-[#e8e6df] bg-white p-5 shadow-xs hover:border-[#C8A44E]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Tugas Aktif
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <ClipboardList className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="font-display text-2xl sm:text-3xl font-bold text-amber-600">{data.activeTasksCount}</p>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              Perlu Dikerjakan
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Pekerjaan belum selesai</p>
        </div>

        <div className="rounded-2xl border border-[#e8e6df] bg-white p-5 shadow-xs hover:border-[#C8A44E]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Unit Cleaning
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C8A44E]/10 text-[#C8A44E]">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#1a1a2e]">{data.cleaningCount}</p>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Unit butuh housekeeping</p>
        </div>

        <div className="rounded-2xl border border-[#e8e6df] bg-white p-5 shadow-xs hover:border-[#C8A44E]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Unit Maintenance
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#1a1a2e]">{data.maintenanceCount}</p>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Unit dalam perbaikan</p>
        </div>

        <div className="rounded-2xl border border-[#e8e6df] bg-white p-5 shadow-xs hover:border-[#C8A44E]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Unit Siap Huni
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#1a1a2e]">{data.availableCount}</p>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Status AVAILABLE bersih</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Tasks List (2 cols) */}
        <div className="rounded-2xl border border-[#e8e6df] bg-white shadow-xs lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#e8e6df] p-5">
            <div>
              <h2 className="font-display text-base font-bold text-[#1a1a2e]">Daftar Tugas Housekeeping</h2>
              <p className="text-xs text-slate-400">Jadwal pembersihan unit pasca checkout</p>
            </div>
            <Link
              href="/dashboard/maintenance"
              className="text-xs font-semibold text-[#1a1a2e] hover:text-[#C8A44E] inline-flex items-center"
            >
              Semua Tugas <ArrowUpRight className="h-3 w-3 ml-1" />
            </Link>
          </div>

          <div className="divide-y divide-[#e8e6df]/70">
            {data.tasksList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                Semua tugas pembersihan dan perbaikan selesai.
              </div>
            ) : (
              data.tasksList.map((task) => (
                <div key={task.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#f8f7f4]/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1a1a2e] text-xs sm:text-sm">{task.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          task.isCompleted
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {task.isCompleted ? "SELESAI" : "PENDING"}
                      </span>
                    </div>
                    <p className="text-xs text-[#C8A44E] font-medium">Unit: {task.villa.name}</p>
                    {task.description && (
                      <p className="text-xs text-slate-500">{task.description}</p>
                    )}
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-0.5">
                      <Clock className="h-3 w-3" />
                      Tenggat: {formatDate(task.dueDate)}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        task.isCompleted
                          ? "bg-slate-100 text-slate-500"
                          : "bg-[#1a1a2e] text-white hover:bg-[#C8A44E] hover:text-[#12121f] transition-colors cursor-pointer"
                      }`}
                    >
                      {task.isCompleted ? "Selesai" : "Tandai Selesai"}
                    </span>
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
              <h2 className="font-display text-base font-bold text-[#1a1a2e]">Kesiapan Unit</h2>
              <span className="text-xs text-slate-400">{data.villasList.length} Unit</span>
            </div>
            <div className="space-y-2.5">
              {data.villasList.map((villa) => (
                <div key={villa.id} className="p-2.5 rounded-xl bg-[#f8f7f4] border border-[#e8e6df] space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#1a1a2e]">{villa.name}</p>
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
                  <p className="text-[11px] text-slate-400">{villa.location}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
