"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  Plus,
  Search,
  Users,
  Bed,
  Bath,
  Edit3,
  Trash2,
  Eye,
  Sparkles,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Clock,
  Wrench,
  Ban,
  LayoutGrid,
  List,
} from "lucide-react";
import { VillaPricingManager } from "./villa-pricing-manager";

interface VillaItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  pricePerNight: number;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  location: string;
  amenities: string[];
  images: string[];
  isFeatured: boolean;
  status: "AVAILABLE" | "CLEANING" | "MAINTENANCE" | "UNAVAILABLE";
  createdAt: string | Date;
  _count?: {
    bookings: number;
    maintenanceTasks: number;
  };
}

interface VillaListClientProps {
  initialVillas: VillaItem[];
  userRole: string;
}

export function VillaListClient({ initialVillas, userRole }: VillaListClientProps) {
  const isAdmin = userRole === "ADMIN";

  const [villas, setVillas] = useState<VillaItem[]>(initialVillas);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Status updating state
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    villa: VillaItem | null;
    loading: boolean;
    error: string | null;
  }>({
    isOpen: false,
    villa: null,
    loading: false,
    error: null,
  });

  // Dynamic pricing modal state
  const [pricingModalVilla, setPricingModalVilla] = useState<VillaItem | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Filter villas
  const filteredVillas = villas.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.location.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" ? true : v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stat counts
  const totalCount = villas.length;
  const availableCount = villas.filter((v) => v.status === "AVAILABLE").length;
  const cleaningCount = villas.filter((v) => v.status === "CLEANING").length;
  const maintenanceCount = villas.filter((v) => v.status === "MAINTENANCE").length;

  // Handle Quick Status Change
  async function handleQuickStatus(id: string, newStatus: string) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/villas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal memperbarui status");
      }

      setVillas((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: newStatus as any } : v))
      );
    } catch (err: any) {
      alert(err.message || "Gagal mengubah status");
    } finally {
      setUpdatingId(null);
    }
  }

  // Handle Delete Confirmation
  async function confirmDelete() {
    if (!deleteModal.villa) return;
    setDeleteModal((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const res = await fetch(`/api/villas/${deleteModal.villa.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menghapus villa");
      }

      setVillas((prev) => prev.filter((v) => v.id !== deleteModal.villa?.id));
      setDeleteModal({ isOpen: false, villa: null, loading: false, error: null });
    } catch (err: any) {
      setDeleteModal((prev) => ({
        ...prev,
        loading: false,
        error: err.message,
      }));
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#e8e6df]">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1a1a2e] tracking-tight">
            Manajemen Unit Villa
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Katalog unit, ketersediaan hunian, tarif sewa, dan galeri foto Cloudflare R2
          </p>
        </div>

        {isAdmin && (
          <Link
            href="/dashboard/villas/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1a1a2e] px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-[#C8A44E] hover:text-[#12121f] transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Unit Baru</span>
          </Link>
        )}
      </div>

      {/* Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-[#e8e6df] bg-white p-4 shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Unit
          </p>
          <p className="font-display text-2xl sm:text-3xl font-bold text-[#1a1a2e] mt-1">
            {totalCount}
          </p>
        </div>

        <div className="rounded-2xl border border-[#e8e6df] bg-white p-4 shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
            Siap Huni (Available)
          </p>
          <p className="font-display text-2xl sm:text-3xl font-bold text-emerald-600 mt-1">
            {availableCount}
          </p>
        </div>

        <div className="rounded-2xl border border-[#e8e6df] bg-white p-4 shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-purple-600">
            Pembersihan (Cleaning)
          </p>
          <p className="font-display text-2xl sm:text-3xl font-bold text-purple-600 mt-1">
            {cleaningCount}
          </p>
        </div>

        <div className="rounded-2xl border border-[#e8e6df] bg-white p-4 shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">
            Perbaikan (Maintenance)
          </p>
          <p className="font-display text-2xl sm:text-3xl font-bold text-amber-600 mt-1">
            {maintenanceCount}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl border border-[#e8e6df] bg-white shadow-2xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama villa atau wilayah lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm text-[#1a1a2e] placeholder:text-slate-400 focus:outline-hidden"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: "ALL", label: "Semua" },
            { key: "AVAILABLE", label: "Available" },
            { key: "CLEANING", label: "Cleaning" },
            { key: "MAINTENANCE", label: "Maintenance" },
            { key: "UNAVAILABLE", label: "Unavailable" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                statusFilter === tab.key
                  ? "bg-[#1a1a2e] text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}

          {/* View Mode Toggle */}
          <div className="hidden md:flex items-center gap-1 pl-2 border-l border-[#e8e6df]">
            <button
              onClick={() => setViewMode("grid")}
              title="Grid View"
              className={`p-1.5 rounded-lg ${
                viewMode === "grid" ? "bg-slate-200 text-slate-900" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              title="Table View"
              className={`p-1.5 rounded-lg ${
                viewMode === "table" ? "bg-slate-200 text-slate-900" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredVillas.length === 0 ? (
        <div className="rounded-2xl border border-[#e8e6df] bg-white p-12 text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1a1a2e]/5 text-[#C8A44E] mx-auto">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="font-bold text-sm text-[#1a1a2e]">Tidak ada unit villa yang cocok</p>
            <p className="text-xs text-slate-400 mt-1">
              Coba sesuaikan kata kunci pencarian atau ubah filter status
            </p>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVillas.map((villa) => (
            <div
              key={villa.id}
              className="group rounded-2xl border border-[#e8e6df] bg-white overflow-hidden shadow-xs hover:border-[#C8A44E]/50 hover:shadow-md transition-all flex flex-col"
            >
              {/* Image Preview */}
              <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100">
                <Image
                  src={villa.images[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"}
                  alt={villa.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Status Badge */}
                <div className="absolute top-3 left-3 z-10">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs backdrop-blur-md ${
                      villa.status === "AVAILABLE"
                        ? "bg-emerald-500/90 text-white"
                        : villa.status === "CLEANING"
                        ? "bg-purple-600/90 text-white"
                        : villa.status === "MAINTENANCE"
                        ? "bg-amber-500/90 text-white"
                        : "bg-red-500/90 text-white"
                    }`}
                  >
                    {villa.status === "AVAILABLE" && <CheckCircle2 className="h-3 w-3" />}
                    {villa.status === "CLEANING" && <Clock className="h-3 w-3" />}
                    {villa.status === "MAINTENANCE" && <Wrench className="h-3 w-3" />}
                    {villa.status === "UNAVAILABLE" && <Ban className="h-3 w-3" />}
                    {villa.status}
                  </span>
                </div>

                {/* Featured Badge */}
                {villa.isFeatured && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1a1a2e]/90 text-[#C8A44E] text-[10px] font-bold shadow-xs backdrop-blur-md border border-[#C8A44E]/40">
                      <Sparkles className="h-3 w-3" />
                      Featured
                    </span>
                  </div>
                )}
              </div>

              {/* Content Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-bold text-base text-[#1a1a2e] group-hover:text-[#C8A44E] transition-colors line-clamp-1">
                      {villa.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{villa.location}</p>

                  {/* Specs */}
                  <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-500 border-t border-[#e8e6df]">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      {villa.capacity} Tamu
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Bed className="h-3.5 w-3.5 text-slate-400" />
                      {villa.bedrooms} Kamar
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Bath className="h-3.5 w-3.5 text-slate-400" />
                      {villa.bathrooms} Mandi
                    </span>
                  </div>
                </div>

                {/* Price & Action Row */}
                <div className="pt-3 border-t border-[#e8e6df] space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                        Tarif per Malam
                      </span>
                      <span className="font-display text-lg font-bold text-[#1a1a2e]">
                        {formatPrice(villa.pricePerNight)}
                      </span>
                    </div>

                    {/* Quick Status Dropdown */}
                    <div className="relative">
                      {updatingId === villa.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-[#C8A44E]" />
                      ) : (
                        <select
                          value={villa.status}
                          onChange={(e) => handleQuickStatus(villa.id, e.target.value)}
                          className="text-[11px] font-semibold py-1 px-2 rounded-lg border border-[#e8e6df] bg-slate-50 text-slate-700 hover:border-[#C8A44E] cursor-pointer focus:outline-hidden"
                        >
                          <option value="AVAILABLE">AVAILABLE</option>
                          <option value="CLEANING">CLEANING</option>
                          <option value="MAINTENANCE">MAINTENANCE</option>
                          <option value="UNAVAILABLE">UNAVAILABLE</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Button Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Link
                      href={`/villas/${villa.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-[#1a1a2e]"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Lihat Publik
                    </Link>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPricingModalVilla(villa)}
                        className="px-2 py-1 rounded-lg border border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                        title="Kelola Harga Weekend & Hari Libur"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-accent" />
                        <span>Tarif</span>
                      </button>

                      {isAdmin && (
                        <>
                          <Link
                            href={`/dashboard/villas/${villa.id}/edit`}
                            className="p-1.5 rounded-lg border border-[#e8e6df] text-slate-600 hover:text-[#1a1a2e] hover:bg-slate-50 transition-colors"
                            title="Edit Villa"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              setDeleteModal({
                                isOpen: true,
                                villa,
                                loading: false,
                                error: null,
                              })
                            }
                            className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                            title="Hapus Villa"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-2xl border border-[#e8e6df] bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-[#f8f7f4] uppercase text-[10px] text-slate-500 font-semibold border-b border-[#e8e6df]">
                <tr>
                  <th className="px-5 py-3.5">Unit Villa</th>
                  <th className="px-5 py-3.5">Kapasitas</th>
                  <th className="px-5 py-3.5">Tarif / Malam</th>
                  <th className="px-5 py-3.5">Status Kesiapan</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8e6df]/70">
                {filteredVillas.map((villa) => (
                  <tr key={villa.id} className="hover:bg-[#f8f7f4]/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-16 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                          <Image
                            src={villa.images[0] || ""}
                            alt={villa.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-[#1a1a2e]">{villa.name}</p>
                          <p className="text-[11px] text-slate-400">{villa.location}</p>
                          {villa.isFeatured && (
                            <span className="inline-block mt-0.5 text-[9px] font-bold text-[#9c7827] bg-[#C8A44E]/10 px-1.5 py-0.2 rounded">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      <div>{villa.capacity} Tamu</div>
                      <div className="text-slate-400 text-[10px]">
                        {villa.bedrooms} KT • {villa.bathrooms} KM
                      </div>
                    </td>

                    <td className="px-5 py-4 font-bold text-[#1a1a2e]">
                      {formatPrice(villa.pricePerNight)}
                    </td>

                    <td className="px-5 py-4">
                      <select
                        value={villa.status}
                        onChange={(e) => handleQuickStatus(villa.id, e.target.value)}
                        className="text-[11px] font-semibold py-1 px-2 rounded-lg border border-[#e8e6df] bg-slate-50 text-slate-700 hover:border-[#C8A44E] cursor-pointer focus:outline-hidden"
                      >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="CLEANING">CLEANING</option>
                        <option value="MAINTENANCE">MAINTENANCE</option>
                        <option value="UNAVAILABLE">UNAVAILABLE</option>
                      </select>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          href={`/villas/${villa.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg border border-[#e8e6df] text-slate-600 hover:text-[#1a1a2e] hover:bg-slate-50 transition-colors"
                          title="Lihat Publik"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => setPricingModalVilla(villa)}
                          className="p-1.5 rounded-lg border border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors"
                          title="Kelola Harga Weekend & Libur"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-accent" />
                        </button>

                        {isAdmin && (
                          <>
                            <Link
                              href={`/dashboard/villas/${villa.id}/edit`}
                              className="p-1.5 rounded-lg border border-[#e8e6df] text-slate-600 hover:text-[#1a1a2e] hover:bg-slate-50 transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Link>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteModal({
                                  isOpen: true,
                                  villa,
                                  loading: false,
                                  error: null,
                                })
                              }
                              className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.villa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => !deleteModal.loading && setDeleteModal({ isOpen: false, villa: null, loading: false, error: null })}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-[#e8e6df] space-y-4 z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-display text-lg font-bold text-[#1a1a2e]">
                Hapus Unit Villa?
              </h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus{" "}
                <span className="font-bold text-[#1a1a2e]">
                  &ldquo;{deleteModal.villa.name}&rdquo;
                </span>
                ? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            {deleteModal.error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                {deleteModal.error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleteModal.loading}
                onClick={() => setDeleteModal({ isOpen: false, villa: null, loading: false, error: null })}
                className="flex-1 py-2 rounded-xl border border-[#e8e6df] text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteModal.loading}
                onClick={confirmDelete}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                {deleteModal.loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Pricing Manager Modal */}
      {pricingModalVilla && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setPricingModalVilla(null)}
          />
          <div className="relative z-10 w-full max-w-2xl">
            <VillaPricingManager
              villaId={pricingModalVilla.id}
              villaName={pricingModalVilla.name}
              basePrice={pricingModalVilla.pricePerNight}
              onClose={() => setPricingModalVilla(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
