import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cacheLife } from "next/cache";
import { connection } from "next/server";
import { VillaGallery } from "@/components/public/villa-gallery";
import { AmenityIcon } from "@/components/public/amenity-icon";
import { Clock, ShieldCheck, Star, Sparkles, MessageSquare, CheckCircle2 } from "lucide-react";
import { extractMapEmbedSrc } from "@/lib/maps";
import { VillaBookingProvider } from "@/components/public/villa-booking-context";
import { VillaBookingWidget } from "@/components/public/villa-booking-widget";
import { VillaAvailabilityCalendar } from "@/components/public/villa-availability-calendar";
import { VillaMobileBookingBar } from "@/components/public/villa-mobile-booking-bar";

async function getVilla(slug: string) {
  'use cache'
  cacheLife('minutes')

  try {
    const villa = await prisma.villas.findUnique({
      where: { slug },
      include: {
        customPrices: {
          orderBy: { startDate: "asc" },
        },
      },
    });

    return villa;
  } catch (error) {
    console.error("Error fetching villa:", error);
    return null;
  }
}

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  'use cache';
  const resolvedParams = await params;
  const villa = await getVilla(resolvedParams.slug);

  if (!villa) {
    return {
      title: "Villa Not Found",
    };
  }

  return {
    title: `${villa.name} — ${villa.location} | Singgahsana`,
    description: villa.description.substring(0, 160),
    openGraph: {
      title: `${villa.name} — ${villa.location}`,
      description: villa.description.substring(0, 160),
      images: villa.images.length > 0 ? [villa.images[0]] : [],
    },
  };
}

export default async function VillaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const resolvedParams = await params;
  const session = await auth();
  const villa = await getVilla(resolvedParams.slug);

  if (!villa) {
    notFound();
  }

  // Fetch real-time active bookings live from database on every request
  const [activeBookings, villaTestimonials] = await Promise.all([
    prisma.bookings.findMany({
      where: {
        villaId: villa.id,
        status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
      },
      select: {
        id: true,
        checkIn: true,
        checkOut: true,
        status: true,
      },
      orderBy: { checkIn: "asc" },
    }),
    prisma.testimonials.findMany({
      where: { villaId: villa.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const reviewCount = villaTestimonials.length;
  const avgRating =
    reviewCount > 0
      ? (
          villaTestimonials.reduce((sum, t) => sum + t.rating, 0) / reviewCount
        ).toFixed(1)
      : "5.0";

  const avgService =
    reviewCount > 0
      ? (
          villaTestimonials.reduce((sum, t) => sum + (t.serviceRating || t.rating), 0) /
          reviewCount
        ).toFixed(1)
      : "5.0";

  const avgCleanliness =
    reviewCount > 0
      ? (
          villaTestimonials.reduce(
            (sum, t) => sum + (t.cleanlinessRating || t.rating),
            0
          ) / reviewCount
        ).toFixed(1)
      : "5.0";

  const avgFacility =
    reviewCount > 0
      ? (
          villaTestimonials.reduce(
            (sum, t) => sum + (t.facilityRating || t.rating),
            0
          ) / reviewCount
        ).toFixed(1)
      : "5.0";

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID").format(price);
  };

  const ownerPhone = "628111141052";

  return (
    <main className="min-h-screen bg-warm-white pb-32 lg:pb-24">
      {/* Gallery Section */}
      <div className="pt-24 max-w-7xl mx-auto px-6 lg:px-8">
        <VillaGallery images={villa.images} villaName={villa.name} />
      </div>

      {/* Title & Quick Stats */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-accent/15 text-accent">
                {villa.location}
              </span>
              {villa.isFeatured && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary text-white">
                  Pilihan Utama
                </span>
              )}
              {reviewCount > 0 && (
                <a
                  href="#reviews"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-accent transition-colors"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{avgRating}</span>
                  <span className="text-gray-400">({reviewCount} ulasan)</span>
                </a>
              )}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-primary tracking-tight">
              {villa.name}
            </h1>
          </div>

          <div className="text-left md:text-right">
            <span className="text-xs text-gray-400 block mb-0.5">Mulai dari</span>
            <div className="flex items-baseline md:justify-end gap-1">
              <span className="font-display text-2xl sm:text-3xl font-bold text-primary">
                Rp {formatPrice(villa.pricePerNight)}
              </span>
              <span className="text-xs text-gray-500">/ malam</span>
            </div>
            {villa.priceWeekend && (
              <span className="text-xs text-accent font-medium block mt-0.5">
                Weekend: Rp {formatPrice(villa.priceWeekend)} / malam
              </span>
            )}
          </div>
        </div>

        {/* Quick specs */}
        <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-gray-100 text-gray-600">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-5 h-5 text-accent"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
              />
            </svg>
            <span className="text-sm font-medium">{villa.capacity} Tamu</span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-5 h-5 text-accent"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
              />
            </svg>
            <span className="text-sm font-medium">{villa.bedrooms} K. Tidur</span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-5 h-5 text-accent"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            <span className="text-sm font-medium">{villa.bathrooms} K. Mandi</span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100"></div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <VillaBookingProvider
          villa={{
            id: villa.id,
            slug: villa.slug,
            name: villa.name,
            price: villa.pricePerNight,
            priceWeekend: villa.priceWeekend,
            capacity: villa.capacity,
            ownerPhone,
          }}
          initialCustomPrices={(villa as any).customPrices || []}
          initialBookedRanges={activeBookings.map((b) => ({
            startDate: b.checkIn,
            endDate: b.checkOut,
            status: b.status,
          }))}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-10">
              {/* Description */}
              <div className="reveal">
                <h2 className="font-display text-2xl font-bold text-primary mb-4">
                  Tentang Properti
                </h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {villa.description}
                </p>
              </div>

              {/* Facilities */}
              <div className="reveal">
                <h2 className="font-display text-2xl font-bold text-primary mb-5">
                  Fasilitas
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {villa.amenities.map((amenity: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-gray-100/90 shadow-2xs hover:border-accent/40 hover:shadow-xs transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                        <AmenityIcon name={amenity} className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium text-primary/85 leading-tight">
                        {amenity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* House Rules */}
              <div className="reveal">
                <h2 className="font-display text-2xl font-bold text-primary mb-4">
                  Aturan Menginap
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="flex items-start gap-3 bg-cream rounded-2xl p-4 border border-gray-100/60">
                    <Clock className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Check-in</p>
                      <p className="text-gray-800 font-semibold text-sm sm:text-base">
                        {villa.checkInTime || "14:00"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-cream rounded-2xl p-4 border border-gray-100/60">
                    <Clock className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Check-out</p>
                      <p className="text-gray-800 font-semibold text-sm sm:text-base">
                        {villa.checkOutTime || "12:00"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-cream rounded-2xl p-4 border border-gray-100/60">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="w-5 h-5 text-accent mt-0.5 shrink-0"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                      />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Kapasitas Maks.</p>
                      <p className="text-gray-800 font-semibold text-sm sm:text-base">
                        {villa.capacity} Orang
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-cream rounded-2xl p-4 border border-gray-100/60">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="w-5 h-5 text-accent mt-0.5 shrink-0"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                      />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Parkir</p>
                      <p className="text-gray-800 font-semibold text-sm sm:text-base">
                        Tersedia
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dynamic Rules List from Database */}
                {villa.rules && villa.rules.length > 0 && (
                  <div className="mt-5 rounded-2xl bg-white border border-gray-100 p-5 sm:p-6 shadow-2xs">
                    <h3 className="text-sm font-bold font-display text-primary mb-3 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-accent" />
                      Tata Tertib &amp; Ketentuan Menginap
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {villa.rules.map((rule: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-600 bg-slate-50/70 p-3 rounded-xl border border-gray-100"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent font-bold text-[10px] mt-0.5">
                            ✓
                          </span>
                          <span className="leading-snug">{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Availability & Dynamic Pricing Calendar */}
              <div className="reveal">
                <VillaAvailabilityCalendar />
              </div>

              {/* Mobile Booking Widget Card (Visible only on mobile screens < lg) */}
              <div id="booking-widget" className="lg:hidden reveal my-8">
                <VillaBookingWidget id="mobile-booking-card" />
              </div>

              {/* Location */}
              <div className="reveal">
                <h2 className="font-display text-2xl font-bold text-primary mb-4">
                  Lokasi
                </h2>
                <div className="bg-cream rounded-2xl p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="w-5 h-5 text-accent mt-0.5 shrink-0"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z"
                        />
                      </svg>
                      <p className="text-gray-700 font-medium">{villa.location}</p>
                    </div>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(villa.name + " " + villa.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline self-start sm:self-auto"
                    >
                      <span>Petunjuk Arah Google Maps</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                  <div className="rounded-2xl overflow-hidden shadow-xs border border-gray-100 bg-white">
                    <iframe
                      src={extractMapEmbedSrc(villa.mapEmbed, villa.location)}
                      width="100%"
                      height="320"
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      style={{ border: 0 }}
                    ></iframe>
                  </div>
                </div>
              </div>

              {/* Guest Reviews Section */}
              <div id="reviews" className="reveal border-t border-gray-100 pt-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-primary">
                      Ulasan Tamu &amp; Pengalaman Menginap
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Ulasan asli dari tamu yang telah selesai menginap di {villa.name}.
                    </p>
                  </div>

                  {reviewCount > 0 && (
                    <div className="flex items-center gap-2 bg-[#faf9f5] border border-[#e8e6df] px-4 py-2 rounded-2xl self-start sm:self-auto">
                      <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      <span className="font-display text-xl font-bold text-primary">{avgRating}</span>
                      <span className="text-xs text-gray-400">/ 5.0 ({reviewCount} ulasan)</span>
                    </div>
                  )}
                </div>

                {reviewCount > 0 ? (
                  <div className="space-y-6">
                    {/* Category Ratings Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#faf9f5] border border-[#e8e6df]">
                      <div className="flex items-center justify-between sm:flex-col sm:items-start sm:gap-1 p-2">
                        <span className="text-xs text-gray-500 font-medium">Pelayanan Staf</span>
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-bold text-primary">{avgService}</span>
                          <span className="text-[11px] text-gray-400">/ 5</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:flex-col sm:items-start sm:gap-1 p-2 border-t sm:border-t-0 sm:border-l border-gray-200">
                        <span className="text-xs text-gray-500 font-medium">Kebersihan Villa</span>
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-bold text-primary">{avgCleanliness}</span>
                          <span className="text-[11px] text-gray-400">/ 5</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:flex-col sm:items-start sm:gap-1 p-2 border-t sm:border-t-0 sm:border-l border-gray-200">
                        <span className="text-xs text-gray-500 font-medium">Fasilitas Properti</span>
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-bold text-primary">{avgFacility}</span>
                          <span className="text-[11px] text-gray-400">/ 5</span>
                        </div>
                      </div>
                    </div>

                    {/* Reviews List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {villaTestimonials.map((t) => (
                        <div
                          key={t.id}
                          className="p-5 rounded-2xl bg-white border border-gray-100 shadow-2xs space-y-3 hover:border-accent/30 transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                {t.avatar ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={t.avatar}
                                    alt={t.name}
                                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                                    {t.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <h4 className="font-bold text-sm text-primary leading-tight">
                                    {t.name}
                                  </h4>
                                  <span className="text-[11px] text-gray-400">
                                    {new Date(t.createdAt).toLocaleDateString("id-ID", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                              </div>

                              {t.bookingId && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Tamu Terverifikasi
                                </span>
                              )}
                            </div>

                            {/* Star Row */}
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i < t.rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-gray-200"
                                  }`}
                                />
                              ))}
                            </div>

                            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed italic">
                              &ldquo;{t.content}&rdquo;
                            </p>
                          </div>

                          {/* Aspect Pills */}
                          {(t.cleanlinessRating || t.serviceRating || t.facilityRating) && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100 text-[10px] text-gray-500">
                              {t.serviceRating && (
                                <span className="px-2 py-0.5 rounded bg-gray-50 border border-gray-200">
                                  Pelayanan: ★{t.serviceRating}
                                </span>
                              )}
                              {t.cleanlinessRating && (
                                <span className="px-2 py-0.5 rounded bg-gray-50 border border-gray-200">
                                  Kebersihan: ★{t.cleanlinessRating}
                                </span>
                              )}
                              {t.facilityRating && (
                                <span className="px-2 py-0.5 rounded bg-gray-50 border border-gray-200">
                                  Fasilitas: ★{t.facilityRating}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-white border border-gray-100 text-center shadow-2xs space-y-2">
                    <div className="w-12 h-12 rounded-full bg-cream text-accent flex items-center justify-center mx-auto mb-2">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-sm text-primary">Belum Ada Ulasan Tamu</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Jadilah tamu pertama yang memberikan ulasan pengalaman menginap di {villa.name}!
                    </p>
                  </div>
                )}

                {/* Notice for guests to leave review */}
                <div className="mt-5 p-4 rounded-2xl bg-cream/70 border border-[#e8e6df] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <span className="text-gray-600">
                    Sudah pernah menginap di <strong>{villa.name}</strong>? Bagikan pengalaman liburan Anda dengan memasukkan kode booking.
                  </span>
                  <Link
                    href="/booking/status"
                    className="px-4 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors shrink-0 text-center"
                  >
                    Beri Ulasan Tamu &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Sidebar - Interactive Booking Card */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <VillaBookingWidget />
              </div>
            </div>
          </div>

          {/* Mobile Floating Sticky Booking Bar */}
          <VillaMobileBookingBar />
        </VillaBookingProvider>
      </div>
    </main>
  );
}
