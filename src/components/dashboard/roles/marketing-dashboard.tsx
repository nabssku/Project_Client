import Link from "next/link";
import {
  Tag,
  Star,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  Percent,
  Calendar,
  Info,
} from "lucide-react";

interface MarketingDashboardProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  data: {
    activePromosCount: number;
    featuredVillasCount: number;
    testimonialsCount: number;
    averageRating: number;
    promosList: Array<{
      id: string;
      title: string;
      code: string;
      discountPercent: number;
      validFrom: Date;
      validUntil: Date;
      isActive: boolean;
      description: string;
    }>;
    testimonialsList: Array<{
      id: string;
      name: string;
      content: string;
      rating: number;
      isFeatured: boolean;
      createdAt: Date;
    }>;
  };
}

export function MarketingDashboard({ user, data }: MarketingDashboardProps) {
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
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight">
            Promosi & Konten CMS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pengelolaan kode diskon, kurasi ulasan tamu, dan sorotan unit unggulan
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/dashboard/cms/promos"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-accent hover:text-primary-dark transition-all"
          >
            <Tag className="h-3.5 w-3.5" />
            <span>Kelola Promo</span>
          </Link>
          <Link
            href="/dashboard/cms/about"
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#e8e6df] px-4 py-2 text-xs font-semibold text-primary hover:bg-slate-50 transition-colors"
          >
            <Info className="h-3.5 w-3.5 text-slate-500" />
            <span>Tentang Kami</span>
          </Link>
          <Link
            href="/dashboard/cms/testimonials"
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#e8e6df] px-4 py-2 text-xs font-semibold text-primary hover:bg-slate-50 transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
            <span>Testimoni</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="rounded-2xl border border-[#e8e6df] bg-white p-5 shadow-xs hover:border-accent/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Promo Aktif
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Tag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="font-display text-2xl sm:text-3xl font-bold text-primary">{data.activePromosCount}</p>
            <Link
              href="/dashboard/cms/promos"
              className="text-xs font-medium text-accent hover:underline inline-flex items-center"
            >
              Kelola <ArrowUpRight className="h-3 w-3 ml-0.5" />
            </Link>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Kupon diskon berjalan</p>
        </div>

        <div className="rounded-2xl border border-[#e8e6df] bg-white p-5 shadow-xs hover:border-accent/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Total Testimoni
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/5 text-primary">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-display text-2xl sm:text-3xl font-bold text-primary">{data.testimonialsCount}</p>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Ulasan tamu terverifikasi</p>
        </div>

        <div className="rounded-2xl border border-[#e8e6df] bg-white p-5 shadow-xs hover:border-accent/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Rating Rata-rata
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
              <Star className="h-4 w-4 fill-amber-400" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <p className="font-display text-2xl sm:text-3xl font-bold text-primary">
              {data.averageRating ? data.averageRating.toFixed(1) : "5.0"}
            </p>
            <span className="text-amber-500 text-base">★</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Kepuasan pengalaman tamu</p>
        </div>

        <div className="rounded-2xl border border-[#e8e6df] bg-white p-5 shadow-xs hover:border-accent/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Villa Unggulan
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-display text-2xl sm:text-3xl font-bold text-primary">{data.featuredVillasCount}</p>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Featured di beranda</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Promos List (2 cols) */}
        <div className="rounded-2xl border border-[#e8e6df] bg-white shadow-xs lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#e8e6df] p-5">
            <div>
              <h2 className="font-display text-base font-bold text-primary">Kode Promo & Diskon</h2>
              <p className="text-xs text-slate-400">Kupon aktif untuk tamu saat reservasi</p>
            </div>
            <Link
              href="/dashboard/cms/promos"
              className="text-xs font-semibold text-primary hover:text-accent inline-flex items-center"
            >
              Tambah Promo <ArrowUpRight className="h-3 w-3 ml-1" />
            </Link>
          </div>

          <div className="divide-y divide-[#e8e6df]/70">
            {data.promosList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Belum ada kode promo aktif.
              </div>
            ) : (
              data.promosList.map((promo) => (
                <div key={promo.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#f8f7f4]/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-primary text-white px-2.5 py-0.5 rounded-lg">
                        {promo.code}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Percent className="h-3 w-3" />
                        Diskon {promo.discountPercent}%
                      </span>
                    </div>
                    <p className="text-xs font-bold text-primary">{promo.title}</p>
                    <p className="text-xs text-slate-500">{promo.description}</p>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-0.5">
                      <Calendar className="h-3 w-3" />
                      Berlaku s/d {formatDate(promo.validUntil)}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        promo.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {promo.isActive ? "AKTIF" : "NON-AKTIF"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Testimonials (1 col) */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#e8e6df] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-bold text-primary">Ulasan Tamu</h2>
              <Link
                href="/dashboard/cms/testimonials"
                className="text-xs font-semibold text-primary hover:text-accent"
              >
                Kurasi
              </Link>
            </div>
            <div className="space-y-3">
              {data.testimonialsList.map((t) => (
                <div key={t.id} className="p-3 rounded-xl bg-[#f8f7f4] border border-[#e8e6df] space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-primary">{t.name}</p>
                    <div className="flex text-amber-400 text-xs">
                      {"★".repeat(t.rating)}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 italic line-clamp-2">
                    &ldquo;{t.content}&rdquo;
                  </p>
                  {t.isFeatured && (
                    <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/30">
                      Featured
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
