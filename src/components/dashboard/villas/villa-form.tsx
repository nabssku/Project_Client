"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Users,
  Bed,
  Bath,
  DollarSign,
  Plus,
  X,
  Check,
  Save,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Eye,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { ImageUploader } from "./image-uploader";
import { AmenityIcon } from "@/components/public/amenity-icon";
import { extractMapEmbedSrc } from "@/lib/maps";

interface VillaFormProps {
  initialData?: {
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
    rules?: string[];
    checkInTime?: string;
    checkOutTime?: string;
    mapEmbed?: string | null;
    isFeatured: boolean;
    status: "AVAILABLE" | "CLEANING" | "MAINTENANCE" | "UNAVAILABLE";
  };
}

const DEFAULT_AMENITIES = [
  "Private Pool",
  "WiFi",
  "AC",
  "Dapur Lengkap",
  "Smart TV",
  "Area BBQ",
  "Karaoke",
  "Water Heater",
  "Balkon Gunung",
  "Parkir Luas",
  "Billiard",
  "Taman Luas",
  "Meeting Room",
  "Hot Tub",
  "Kulkas",
];

const DEFAULT_PRESET_RULES = [
  "Dilarang merokok di dalam kamar / ruangan tertutup",
  "Tidak diperkenankan membawa hewan peliharaan (No Pets)",
  "Waktu tenang (Quiet Hours) berlaku mulai pukul 22:00 WIB",
  "Dilarang membawa atau mengonsumsi narkoba, miras, atau obat terlarang",
  "Wajib menjaga kebersihan dan fasilitas villa selama menginap",
  "Deposit jaminan kerusakan Rp 500.000 saat check-in (refundable)",
  "Tamu wajib menunjukkan identitas resmi (KTP/Passport) saat registrasi",
];

export function VillaForm({ initialData }: VillaFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    pricePerNight: initialData?.pricePerNight || 1500000,
    capacity: initialData?.capacity || 10,
    bedrooms: initialData?.bedrooms || 3,
    bathrooms: initialData?.bathrooms || 2,
    location: initialData?.location || "Puncak, Bogor",
    amenities: initialData?.amenities || [
      "Private Pool",
      "WiFi Cepat",
      "AC",
      "Dapur Lengkap",
      "Area BBQ",
    ],
    images: initialData?.images || [],
    rules: initialData?.rules && initialData.rules.length > 0
      ? initialData.rules
      : (isEditing ? [] : DEFAULT_PRESET_RULES.slice(0, 5)),
    checkInTime: initialData?.checkInTime || "14:00",
    checkOutTime: initialData?.checkOutTime || "12:00",
    mapEmbed: initialData?.mapEmbed || "",
    isFeatured: initialData?.isFeatured || false,
    status: initialData?.status || "AVAILABLE",
  });

  const [customAmenity, setCustomAmenity] = useState("");
  const [customRule, setCustomRule] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug when name changes
  function handleNameChange(name: string) {
    const autoSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setFormData((prev) => ({
      ...prev,
      name,
      slug: !isEditing ? autoSlug : prev.slug,
    }));
  }

  function toggleAmenity(amenity: string) {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  }

  function addCustomAmenity(e: React.FormEvent) {
    e.preventDefault();
    if (!customAmenity.trim()) return;
    if (!formData.amenities.includes(customAmenity.trim())) {
      setFormData((prev) => ({
        ...prev,
        amenities: [...prev.amenities, customAmenity.trim()],
      }));
    }
    setCustomAmenity("");
  }

  function toggleRulePreset(ruleText: string) {
    setFormData((prev) => {
      const exists = prev.rules.includes(ruleText);
      return {
        ...prev,
        rules: exists
          ? prev.rules.filter((r) => r !== ruleText)
          : [...prev.rules, ruleText],
      };
    });
  }

  function addCustomRule(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!customRule.trim()) return;
    if (!formData.rules.includes(customRule.trim())) {
      setFormData((prev) => ({
        ...prev,
        rules: [...prev.rules, customRule.trim()],
      }));
    }
    setCustomRule("");
  }

  function removeRule(indexToRemove: number) {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, idx) => idx !== indexToRemove),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (formData.images.length === 0) {
      setError("Harap unggah minimal 1 foto villa.");
      return;
    }

    setLoading(true);

    try {
      const url = isEditing
        ? `/api/villas/${initialData?.id}`
        : "/api/villas";

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Gagal menyimpan data villa");
      }

      router.push("/dashboard/villas");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#e8e6df]">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/villas"
            className="p-2 rounded-xl bg-white border border-[#e8e6df] text-slate-600 hover:text-[#1a1a2e] hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1a1a2e] tracking-tight">
              {isEditing ? `Edit Villa: ${initialData?.name}` : "Tambah Unit Villa Baru"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Kelola informasi unit, fasilitas, harga, dan galeri foto ber-watermark
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {isEditing && (
            <Link
              href={`/villas/${formData.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#e8e6df] bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Halaman Publik</span>
            </Link>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1a1a2e] hover:bg-[#C8A44E] hover:text-[#12121f] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isEditing ? "Simpan Perubahan" : "Publikasikan Villa"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 text-red-700 text-xs sm:text-sm border border-red-200">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Informasi Dasar */}
      <div className="rounded-2xl border border-[#e8e6df] bg-white p-6 shadow-xs space-y-5">
        <div className="border-b border-[#e8e6df] pb-3">
          <h2 className="font-display text-base font-bold text-[#1a1a2e]">Informasi Dasar</h2>
          <p className="text-xs text-slate-400">Nama, tautan URL slug, lokasi, dan deskripsi villa</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-[#1a1a2e] mb-1.5">
              Nama Villa *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Flor Villa Private Pool"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full rounded-xl border border-[#e8e6df] px-3.5 py-2.5 text-xs sm:text-sm text-[#1a1a2e] placeholder:text-slate-400 focus:outline-hidden focus:border-[#C8A44E] focus:ring-1 focus:ring-[#C8A44E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1a1a2e] mb-1.5">
              Slug URL *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 pointer-events-none">
                /villas/
              </span>
              <input
                type="text"
                required
                placeholder="flor-villa"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full rounded-xl border border-[#e8e6df] pl-16 pr-3.5 py-2.5 text-xs sm:text-sm text-[#1a1a2e] placeholder:text-slate-400 focus:outline-hidden focus:border-[#C8A44E] focus:ring-1 focus:ring-[#C8A44E]"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1a1a2e] mb-1.5">
            Lokasi / Wilayah *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              required
              placeholder="Contoh: Jl. Raya Puncak Km. 84, Cisarua, Bogor"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full rounded-xl border border-[#e8e6df] pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[#1a1a2e] placeholder:text-slate-400 focus:outline-hidden focus:border-[#C8A44E] focus:ring-1 focus:ring-[#C8A44E]"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-[#1a1a2e]">
              Embed Google Maps (Peta Lokasi)
            </label>
            <span className="text-[11px] text-slate-400">
              Paste kode HTML &lt;iframe&gt; atau link embed Google Maps
            </span>
          </div>
          <textarea
            rows={2}
            placeholder='Contoh: <iframe src="https://www.google.com/maps/embed?pb=..." ...></iframe> atau https://www.google.com/maps/embed?pb=...'
            value={formData.mapEmbed}
            onChange={(e) => setFormData({ ...formData, mapEmbed: e.target.value })}
            className="w-full font-mono text-xs rounded-xl border border-[#e8e6df] p-3 text-[#1a1a2e] placeholder:text-slate-400 focus:outline-hidden focus:border-[#C8A44E] focus:ring-1 focus:ring-[#C8A44E]"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            💡 Cara ambil: Di Google Maps cari villa &rarr; Klik <strong>Bagikan (Share)</strong> &rarr; Pilih tab <strong>Sematkan peta (Embed a map)</strong> &rarr; Salin HTML.
          </p>

          {/* Live Preview Embed */}
          {formData.mapEmbed && (
            <div className="mt-3 rounded-xl overflow-hidden border border-[#e8e6df] bg-slate-50">
              <div className="px-3 py-1.5 bg-slate-100 border-b border-[#e8e6df] text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                <span>Preview Peta Tersemat</span>
                <span className="text-emerald-600 font-medium text-[10px]">● Siap Tampil</span>
              </div>
              <iframe
                src={extractMapEmbedSrc(formData.mapEmbed, formData.location)}
                width="100%"
                height="220"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                style={{ border: 0 }}
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1a1a2e] mb-1.5">
            Deskripsi Lengkap *
          </label>
          <textarea
            required
            rows={4}
            placeholder="Jelaskan daya tarik villa, pemandangan, kenyamanan ruang keluarga, dan suasana..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded-xl border border-[#e8e6df] p-3 text-xs sm:text-sm text-[#1a1a2e] placeholder:text-slate-400 focus:outline-hidden focus:border-[#C8A44E] focus:ring-1 focus:ring-[#C8A44E]"
          />
        </div>
      </div>

      {/* 2. Kapasitas & Fasilitas */}
      <div className="rounded-2xl border border-[#e8e6df] bg-white p-6 shadow-xs space-y-5">
        <div className="border-b border-[#e8e6df] pb-3">
          <h2 className="font-display text-base font-bold text-[#1a1a2e]">Kapasitas & Fasilitas</h2>
          <p className="text-xs text-slate-400">Jumlah tamu, kamar, dan fitur kenyamanan</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-[#1a1a2e] mb-1.5">
              Kapasitas Maksimal (Tamu) *
            </label>
            <div className="relative">
              <Users className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="number"
                min={1}
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                className="w-full rounded-xl border border-[#e8e6df] pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[#1a1a2e] focus:outline-hidden focus:border-[#C8A44E] focus:ring-1 focus:ring-[#C8A44E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1a1a2e] mb-1.5">
              Jumlah Kamar Tidur *
            </label>
            <div className="relative">
              <Bed className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="number"
                min={1}
                required
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                className="w-full rounded-xl border border-[#e8e6df] pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[#1a1a2e] focus:outline-hidden focus:border-[#C8A44E] focus:ring-1 focus:ring-[#C8A44E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1a1a2e] mb-1.5">
              Jumlah Kamar Mandi *
            </label>
            <div className="relative">
              <Bath className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="number"
                min={1}
                required
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
                className="w-full rounded-xl border border-[#e8e6df] pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[#1a1a2e] focus:outline-hidden focus:border-[#C8A44E] focus:ring-1 focus:ring-[#C8A44E]"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1a1a2e] mb-2">
            Pilihan Fasilitas (Amenities)
          </label>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set([...DEFAULT_AMENITIES, ...formData.amenities])).map((item) => {
              const active = formData.amenities.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleAmenity(item)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? "bg-[#1a1a2e] text-white shadow-2xs"
                      : "bg-[#f8f7f4] border border-[#e8e6df] text-slate-600 hover:border-[#C8A44E]/50"
                  }`}
                >
                  <AmenityIcon
                    name={item}
                    className={`h-3.5 w-3.5 ${active ? "text-[#C8A44E]" : "text-slate-400"}`}
                  />
                  <span>{item}</span>
                  {active && <Check className="h-3 w-3 text-[#C8A44E]" />}
                </button>
              );
            })}
          </div>

          {/* Add custom amenity */}
          <div className="mt-3 flex items-center gap-2 max-w-sm">
            <input
              type="text"
              placeholder="Tambah fasilitas lain..."
              value={customAmenity}
              onChange={(e) => setCustomAmenity(e.target.value)}
              className="flex-1 rounded-xl border border-[#e8e6df] px-3 py-1.5 text-xs text-[#1a1a2e] placeholder:text-slate-400 focus:outline-hidden focus:border-[#C8A44E]"
            />
            <button
              type="button"
              onClick={addCustomAmenity}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Aturan Menginap (House Rules) & Waktu Check-in/Out */}
      <div className="rounded-2xl border border-[#e8e6df] bg-white p-6 shadow-xs space-y-5">
        <div className="border-b border-[#e8e6df] pb-3">
          <h2 className="font-display text-base font-bold text-[#1a1a2e]">
            Aturan Menginap (House Rules)
          </h2>
          <p className="text-xs text-slate-400">
            Atur jadwal check-in, check-out, serta tata tertib yang wajib ditaati tamu
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-[#1a1a2e] mb-1.5">
              Waktu Check-in *
            </label>
            <div className="relative">
              <Clock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Contoh: 14:00"
                value={formData.checkInTime}
                onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                className="w-full rounded-xl border border-[#e8e6df] pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[#1a1a2e] focus:outline-hidden focus:border-[#C8A44E] focus:ring-1 focus:ring-[#C8A44E]"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Format waktu atau keterangan (misal: 14:00 WIB)</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1a1a2e] mb-1.5">
              Waktu Check-out *
            </label>
            <div className="relative">
              <Clock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Contoh: 12:00"
                value={formData.checkOutTime}
                onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                className="w-full rounded-xl border border-[#e8e6df] pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[#1a1a2e] focus:outline-hidden focus:border-[#C8A44E] focus:ring-1 focus:ring-[#C8A44E]"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Format waktu atau keterangan (misal: 12:00 WIB)</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1a1a2e] mb-2">
            Preset Aturan Populer (Klik untuk aktifkan/nonaktifkan)
          </label>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_PRESET_RULES.map((preset) => {
              const active = formData.rules.includes(preset);
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => toggleRulePreset(preset)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? "bg-[#1a1a2e] text-white shadow-2xs"
                      : "bg-[#f8f7f4] border border-[#e8e6df] text-slate-600 hover:border-[#C8A44E]/50"
                  }`}
                >
                  {active ? (
                    <Check className="h-3 w-3 text-[#C8A44E]" />
                  ) : (
                    <Plus className="h-3 w-3 text-slate-400" />
                  )}
                  <span>{preset}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Active Rules List */}
        <div>
          <label className="block text-xs font-semibold text-[#1a1a2e] mb-2">
            Daftar Aturan Aktif untuk Villa Ini ({formData.rules.length} Aturan)
          </label>
          {formData.rules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#e8e6df] p-4 text-center text-xs text-slate-400">
              Belum ada aturan khusus yang dipilih. Klik preset di atas atau tambahkan aturan sendiri di bawah.
            </div>
          ) : (
            <div className="space-y-2">
              {formData.rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-[#f8f7f4] border border-[#e8e6df] text-xs text-[#1a1a2e]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#C8A44E]/15 text-[#C8A44E] font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="truncate">{rule}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRule(idx)}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                    title="Hapus aturan ini"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add custom rule */}
          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ketik aturan baru (contoh: Dilarang menyalakan kembang api)..."
              value={customRule}
              onChange={(e) => setCustomRule(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomRule();
                }
              }}
              className="flex-1 rounded-xl border border-[#e8e6df] px-3.5 py-2 text-xs text-[#1a1a2e] placeholder:text-slate-400 focus:outline-hidden focus:border-[#C8A44E]"
            />
            <button
              type="button"
              onClick={() => addCustomRule()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Aturan</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Harga, Status & Penempatan */}
      <div className="rounded-2xl border border-[#e8e6df] bg-white p-6 shadow-xs space-y-5">
        <div className="border-b border-[#e8e6df] pb-3">
          <h2 className="font-display text-base font-bold text-[#1a1a2e]">Harga & Kesiapan</h2>
          <p className="text-xs text-slate-400">Penetapan tarif sewa per malam dan status unit</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-[#1a1a2e] mb-1.5">
              Harga Sewa per Malam (Rp) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">
                Rp
              </span>
              <input
                type="number"
                min={0}
                step={50000}
                required
                value={formData.pricePerNight}
                onChange={(e) => setFormData({ ...formData, pricePerNight: Number(e.target.value) })}
                className="w-full rounded-xl border border-[#e8e6df] pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#1a1a2e] focus:outline-hidden focus:border-[#C8A44E] focus:ring-1 focus:ring-[#C8A44E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1a1a2e] mb-1.5">
              Status Unit Saat Ini
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full rounded-xl border border-[#e8e6df] px-3.5 py-2.5 text-xs sm:text-sm text-[#1a1a2e] focus:outline-hidden focus:border-[#C8A44E]"
            >
              <option value="AVAILABLE">AVAILABLE (Tersedia & Siap Check-in)</option>
              <option value="CLEANING">CLEANING (Proses Housekeeping)</option>
              <option value="MAINTENANCE">MAINTENANCE (Dalam Perbaikan Fasilitas)</option>
              <option value="UNAVAILABLE">UNAVAILABLE (Tidak Disewakan Sementara)</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <label className="relative flex items-start gap-3 p-3.5 rounded-xl border border-[#e8e6df] bg-[#f8f7f4] cursor-pointer hover:border-[#C8A44E]/50 transition-colors">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded-sm border-gray-300 text-[#C8A44E] focus:ring-[#C8A44E]"
            />
            <div>
              <p className="text-xs font-bold text-[#1a1a2e]">
                Tampilkan sebagai Villa Unggulan (Featured)
              </p>
              <p className="text-[11px] text-slate-500">
                Unit akan disorot di carousel beranda utama dengan badge eksklusif
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* 4. Galeri Foto & Watermark Cloudflare R2 */}
      <div className="rounded-2xl border border-[#e8e6df] bg-white p-6 shadow-xs space-y-4">
        <div className="border-b border-[#e8e6df] pb-3">
          <h2 className="font-display text-base font-bold text-[#1a1a2e]">
            Galeri Foto
          </h2>
          <p className="text-xs text-slate-400">
            Setiap foto yang diunggah akan otomatis ditempeli watermark logo Singgahsana di tengah
          </p>
        </div>

        <ImageUploader
          images={formData.images}
          onChange={(newImages) => setFormData({ ...formData, images: newImages })}
          maxFiles={12}
        />
      </div>

      {/* Footer Submit */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e8e6df]">
        <Link
          href="/dashboard/villas"
          className="px-4 py-2.5 rounded-xl border border-[#e8e6df] bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Batal
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1a1a2e] hover:bg-[#C8A44E] hover:text-[#12121f] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{isEditing ? "Simpan Perubahan" : "Publikasikan Villa"}</span>
        </button>
      </div>
    </form>
  );
}
