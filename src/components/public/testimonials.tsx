import Link from "next/link";
import { Star, Quote, Building2, CheckCircle2 } from "lucide-react";
import { Starfield } from "@/components/public/starfield";

type Testimonial = {
  id: string;
  name: string;
  avatar: string | null;
  content: string;
  villaId: string | null;
  rating: number;
  cleanlinessRating?: number | null;
  serviceRating?: number | null;
  facilityRating?: number | null;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  villa?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

interface TestimonialsProps {
  testimonials: Testimonial[];
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="h-3.5 w-3.5"
          style={{
            fill: i < rating ? "var(--accent)" : "transparent",
            color: i < rating ? "var(--accent)" : "rgba(200,164,78,0.25)",
          }}
        />
      ))}
    </div>
  );
}

function Avatar({ name, avatar }: { name: string; avatar?: string | null }) {
  if (avatar) {
    return (
      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt={name} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-xs"
      style={{
        background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)",
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function Testimonials({ testimonials }: TestimonialsProps) {
  if (!testimonials || testimonials.length === 0) return null;

  const [first, second, third, ...remaining] = testimonials;

  return (
    <section className="time-section relative overflow-hidden py-24">
      <Starfield count={100} seed={7} />
      <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-8">
        {/* Header */}
        <div className="mb-14 flex items-end justify-between">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-accent font-semibold">
              Ulasan Tamu Pilihan
            </p>
            <h2 className="font-display text-3xl font-medium time-text lg:text-4xl">
              Apa Kata Mereka
            </h2>
          </div>
          {/* Decorative quote */}
          <Quote
            className="hidden h-16 w-16 opacity-10 md:block"
            style={{ color: "var(--accent)" }}
          />
        </div>

        {/* Bento grid — adapts dynamically */}
        {testimonials.length === 1 && (
          <BentoCard testimonial={first} size="full" />
        )}

        {testimonials.length === 2 && (
          <div className="grid gap-4 md:grid-cols-2">
            <BentoCard testimonial={first} size="half" />
            <BentoCard testimonial={second} size="half" />
          </div>
        )}

        {testimonials.length >= 3 && (
          <div className="space-y-4">
            {/* Top 3 Featured Bento Grid */}
            <div className="grid gap-4 md:grid-cols-12">
              {/* Large featured card — left */}
              <div className="md:col-span-7">
                <BentoCard testimonial={first} size="large" />
              </div>
              {/* Two stacked cards — right */}
              <div className="flex flex-col gap-4 md:col-span-5">
                <BentoCard testimonial={second} size="small" />
                {third && <BentoCard testimonial={third} size="small" />}
              </div>
            </div>

            {/* Additional Featured Testimonials Grid */}
            {remaining.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 pt-2">
                {remaining.map((item) => (
                  <BentoCard key={item.id} testimonial={item} size="small" />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Bento card variants ─────────────────────────────────────────── */

type CardSize = "full" | "half" | "large" | "small";

function BentoCard({
  testimonial,
  size,
}: {
  testimonial: Testimonial;
  size: CardSize;
}) {
  const isLarge = size === "large" || size === "full";

  return (
    <div
      className={`bento-card group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5 ${
        isLarge ? "bento-card--featured" : "bento-card--small"
      }`}
    >
      {/* Decorative quote mark */}
      {isLarge && (
        <div
          className="absolute right-6 top-6 font-display text-8xl leading-none select-none"
          style={{ color: "rgba(200,164,78,0.06)" }}
        >
          &ldquo;
        </div>
      )}

      <div>
        {/* Top: Stars & Villa Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <StarRow rating={testimonial.rating} />

          {testimonial.villa && (
            <Link
              href={`/villas/${testimonial.villa.slug}`}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline bg-accent/10 px-2.5 py-0.5 rounded-full"
            >
              <Building2 className="w-3 h-3" />
              <span>{testimonial.villa.name}</span>
            </Link>
          )}
        </div>

        {/* Content */}
        <p
          className={`bento-content leading-relaxed ${
            isLarge ? "text-base" : "text-sm"
          }`}
        >
          &ldquo;{testimonial.content}&rdquo;
        </p>

        {/* Aspect Ratings (if available) */}
        {(testimonial.serviceRating || testimonial.cleanlinessRating || testimonial.facilityRating) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-3 text-[10px] opacity-75">
            {testimonial.serviceRating && (
              <span className="px-2 py-0.5 rounded bg-white/10 text-white">
                Pelayanan: ★{testimonial.serviceRating}
              </span>
            )}
            {testimonial.cleanlinessRating && (
              <span className="px-2 py-0.5 rounded bg-white/10 text-white">
                Kebersihan: ★{testimonial.cleanlinessRating}
              </span>
            )}
            {testimonial.facilityRating && (
              <span className="px-2 py-0.5 rounded bg-white/10 text-white">
                Fasilitas: ★{testimonial.facilityRating}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Author */}
      <div className="mt-6 flex items-center gap-3 pt-3 border-t border-white/5">
        <Avatar name={testimonial.name} avatar={testimonial.avatar} />
        <div>
          <p className="bento-author-name text-sm font-medium">{testimonial.name}</p>
          <p className="text-xs time-text-muted flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Tamu Terverifikasi
          </p>
        </div>
      </div>
    </div>
  );
}
