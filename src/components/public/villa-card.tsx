import Link from "next/link";
import Image from "next/image";
import { Users, BedDouble, Bath, Waves } from "lucide-react";
import { formatPrice } from "@/lib/utils";

type Villa = {
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
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

interface VillaCardProps {
  villa: Villa;
}

export function VillaCard({ villa }: VillaCardProps) {
  const hasPool = villa.amenities.some((a) =>
    a.toLowerCase().includes("pool")
  );

  return (
    <Link href={`/villas/${villa.slug}`} className="group">
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {villa.images[0] ? (
            <Image
              src={villa.images[0]}
              alt={villa.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              No Image
            </div>
          )}
          {hasPool && (
            <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-blue-600 px-2 py-1 text-xs font-medium text-white">
              <Waves className="h-3 w-3" />
              Private Pool
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="mb-2 font-semibold text-slate-900 group-hover:text-blue-600">
            {villa.name}
          </h3>

          {/* Specs */}
          <div className="mb-3 flex flex-wrap gap-3 text-sm text-slate-600">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {villa.capacity} Orang
            </span>
            <span className="flex items-center gap-1">
              <BedDouble className="h-4 w-4" />
              {villa.bedrooms} Kamar
            </span>
            <span className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              {villa.bathrooms} Mandi
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-blue-600">
              {formatPrice(villa.pricePerNight)}
            </span>
            <span className="text-sm text-slate-500">/malam</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
