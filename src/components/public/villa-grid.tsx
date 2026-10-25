import Image from "next/image";
import Link from "next/link";
import { Users, Bed, Bath, MapPin } from "lucide-react";

interface Villa {
  id: string;
  name: string;
  slug: string;
  description?: string;
  pricePerNight: number;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  images: string[];
  location: string;
}

interface VillaGridProps {
  villas: Villa[];
  title?: string;
}

export function VillaGrid({ villas, title = "Villa Tersedia" }: VillaGridProps) {
  if (villas.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500">
        Tidak ada villa yang ditemukan.
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && (
        <div className="flex items-end justify-between mb-16">
          <div>
            <p className="text-emerald-600 font-medium tracking-[0.2em] uppercase text-xs mb-3">
              Terbaik Bulan Ini
            </p>
            <h2 className="font-display text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
              Villa <span className="italic text-slate-900/40">Populer</span>
            </h2>
          </div>
          <Link
            href="/villas"
            className="hidden md:inline-flex items-center gap-2 text-slate-900 text-sm font-medium hover:text-emerald-600 transition"
          >
            Lihat Semua
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"></path>
            </svg>
          </Link>
        </div>
      )}

      <div className="space-y-5">
        {/* Row 1: 7/5 split - LARGE cards */}
        {villas.length >= 2 && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <VillaCard villa={villas[0]} size="large" />
            </div>
            <div className="lg:col-span-5">
              <VillaCard villa={villas[1]} size="large" />
            </div>
          </div>
        )}

        {/* Row 2: 5/7 split - MEDIUM cards */}
        {villas.length >= 4 && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <VillaCard villa={villas[2]} size="medium" />
            </div>
            <div className="lg:col-span-7">
              <VillaCard villa={villas[3]} size="medium" />
            </div>
          </div>
        )}

        {/* Row 3: 7/5 split - LARGE cards */}
        {villas.length >= 6 && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <VillaCard villa={villas[4]} size="large" />
            </div>
            <div className="lg:col-span-5">
              <VillaCard villa={villas[5]} size="large" />
            </div>
          </div>
        )}

        {/* Villa ke-7+ full width */}
        {villas.slice(6).map((villa) => (
          <div key={villa.id}>
            <VillaCard villa={villa} size="large" />
          </div>
        ))}
      </div>
    </div>
  );
}

function VillaCard({
  villa,
  size = "medium",
}: {
  villa: Villa;
  size?: "large" | "medium";
}) {
  const coverImage =
    villa.images[0] ||
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=800";
  const formattedPrice = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(villa.pricePerNight);

  const minHeight = size === "large" ? "min-h-[480px]" : "min-h-[360px]";
  const titleSize = size === "large" ? "text-3xl" : "text-2xl";
  const padding = size === "large" ? "p-8" : "p-7";
  const priceSize = size === "large" ? "text-2xl" : "text-xl";
  const badgeText = villa.capacity >= 20 ? "Large Group" : "Private Pool";

  return (
    <Link
      href={`/villas/${villa.slug}`}
      className={`group relative block cursor-pointer overflow-hidden rounded-3xl ${minHeight}`}
    >
      {/* Image */}
      <Image
        src={coverImage}
        alt={villa.name}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Location/Feature Badge */}
      <div className="absolute left-5 top-5 z-10">
        <span className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white">
          {badgeText}
        </span>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-90" />

      {/* Content */}
      <div className={`absolute bottom-0 left-0 right-0 z-10 ${padding}`}>
        <h3 className={`font-display ${titleSize} mb-1 font-bold text-white`}>
          {villa.name}
        </h3>

        {/* Specs */}
        <div className="mb-3 flex items-center gap-3 text-xs text-white/50">
          <span>{villa.capacity} Orang</span>
          <span className="h-1 w-1 rounded-full bg-white/30" />
          <span>{villa.bedrooms} Kamar</span>
          <span className="h-1 w-1 rounded-full bg-white/30" />
          <span>{villa.bathrooms} Mandi</span>
        </div>

        {/* Price & CTA */}
        <div className="flex items-end justify-between">
          <p className={`font-bold text-white ${priceSize}`}>
            {formattedPrice}
            <span className="ml-1 text-sm font-normal text-white/40">
              /malam
            </span>
          </p>
          <span className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-slate-900 transition-colors duration-300 group-hover:bg-emerald-600 group-hover:text-white">
            Lihat Detail
          </span>
        </div>
      </div>
    </Link>
  );
}
