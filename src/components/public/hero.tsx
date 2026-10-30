"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Search,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isBefore,
  isAfter,
  startOfDay,
  parseISO,
} from "date-fns";
import { id as localeId } from "date-fns/locale";

export interface HeroVillaItem {
  id: string;
  name: string;
  slug: string;
  location: string;
  pricePerNight: number;
  capacity?: number;
  images: string[];
  isFeatured?: boolean;
}

interface HeroProps {
  config: Record<string, string>;
  featuredVilla?: HeroVillaItem | null;
  villas?: HeroVillaItem[];
}

function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();

  let videoId = "";
  if (trimmed.includes("/embed/")) {
    const parts = trimmed.split("/embed/");
    videoId = parts[1]?.split("?")[0]?.split("/")[0] || "";
  } else if (trimmed.includes("watch?v=")) {
    const match = trimmed.match(/[?&]v=([^&]+)/);
    videoId = match ? match[1] : "";
  } else if (trimmed.includes("youtu.be/")) {
    const match = trimmed.match(/youtu\.be\/([^?&]+)/);
    videoId = match ? match[1] : "";
  }

  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&playlist=${videoId}&enablejsapi=1`;
  }

  if (trimmed.startsWith("http")) {
    return trimmed;
  }

  return null;
}

export function Hero({ config, featuredVilla, villas = [] }: HeroProps) {
  const router = useRouter();
  const searchBarRef = useRef<HTMLDivElement>(null);

  // Search Bar States
  const [selectedVilla, setSelectedVilla] = useState<HeroVillaItem | null>(null);
  const [destinationOpen, setDestinationOpen] = useState(false);

  // Date Range Picker States (Matches villa detail page RDP)
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<"checkIn" | "checkOut">("checkIn");
  const [pickerMonth, setPickerMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  // Guests State (Matches villa detail page)
  const [guests, setGuests] = useState(2);
  const [guestDropdownOpen, setGuestDropdownOpen] = useState(false);

  // Booked Dates for availability checking
  const [bookedDates, setBookedDates] = useState<{ start: Date; end: Date }[]>([]);

  // Close popovers on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setDestinationOpen(false);
        setIsPickerOpen(false);
        setGuestDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch booked dates whenever a specific villa is selected
  useEffect(() => {
    if (!selectedVilla) {
      setBookedDates([]);
      return;
    }

    let isMounted = true;
    fetch(`/api/bookings/availability?villa=${selectedVilla.slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data?.bookedRanges) return;
        const ranges = data.bookedRanges.map((r: any) => ({
          start: startOfDay(parseISO(r.startDate || r.start)),
          end: startOfDay(parseISO(r.endDate || r.end)),
        }));
        setBookedDates(ranges);
      })
      .catch((err) => {
        console.error("Failed to fetch villa availability:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedVilla]);

  const isDateBooked = (day: Date) => {
    if (!selectedVilla || bookedDates.length === 0) return false;
    const target = startOfDay(day);
    return bookedDates.some((r) => target >= r.start && target <= r.end);
  };

  const hasBookedBetween = (start: Date, end: Date) => {
    if (!selectedVilla || bookedDates.length === 0) return false;
    const s = startOfDay(start);
    const e = startOfDay(end);
    return bookedDates.some((r) => s <= r.end && e >= r.start);
  };

  const openPicker = (mode: "checkIn" | "checkOut") => {
    setDestinationOpen(false);
    setGuestDropdownOpen(false);
    if (mode === "checkOut" && !checkIn) {
      setPickerMode("checkIn");
      setPickerMonth(startOfMonth(new Date()));
    } else {
      setPickerMode(mode);
      setPickerMonth(startOfMonth(checkIn || new Date()));
    }
    setIsPickerOpen(true);
  };

  const prevMonth = () => {
    const prev = subMonths(pickerMonth, 1);
    if (!isBefore(endOfMonth(prev), startOfMonth(new Date()))) {
      setPickerMonth(prev);
    }
  };

  const nextMonth = () => setPickerMonth(addMonths(pickerMonth, 1));

  const isPrevDisabled = isBefore(
    subMonths(pickerMonth, 1),
    startOfMonth(new Date())
  );

  const handleDayClick = (day: Date) => {
    if (pickerMode === "checkIn") {
      setCheckIn(day);
      if (checkOut && (!isAfter(checkOut, day) || hasBookedBetween(day, checkOut))) {
        setCheckOut(null);
      }
      setPickerMode("checkOut");
    } else {
      if (checkIn && isAfter(day, checkIn)) {
        if (hasBookedBetween(checkIn, day)) {
          alert("Tanggal check-out bertabrakan dengan jadwal tamu lain. Silakan pilih tanggal lain.");
          return;
        }
        setCheckOut(day);
        setIsPickerOpen(false);
      } else {
        setCheckIn(day);
        setCheckOut(null);
        setPickerMode("checkOut");
      }
    }
  };

  const handleSearchSubmit = () => {
    setDestinationOpen(false);
    setIsPickerOpen(false);
    setGuestDropdownOpen(false);

    const checkInParam = checkIn ? format(checkIn, "yyyy-MM-dd") : "";
    const checkOutParam = checkOut ? format(checkOut, "yyyy-MM-dd") : "";

    if (selectedVilla) {
      if (checkIn && checkOut && hasBookedBetween(checkIn, checkOut)) {
        alert("Tanggal yang Anda pilih bertabrakan dengan jadwal tamu lain. Silakan pilih tanggal yang tersedia.");
        setPickerMode("checkIn");
        setIsPickerOpen(true);
        return;
      }

      const queryParts: string[] = [];
      if (checkInParam) queryParts.push(`checkIn=${checkInParam}`);
      if (checkOutParam) queryParts.push(`checkOut=${checkOutParam}`);
      if (guests) queryParts.push(`guests=${guests}`);

      const qs = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
      router.push(`/villas/${selectedVilla.slug}${qs}`);
    } else {
      const queryParts: string[] = [];
      if (checkInParam) queryParts.push(`checkIn=${checkInParam}`);
      if (checkOutParam) queryParts.push(`checkOut=${checkOutParam}`);
      if (guests) queryParts.push(`guests=${guests}`);

      const qs = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
      router.push(`/villas${qs}`);
    }
  };

  // Video and Media Helpers
  const embedVideoUrl = getYouTubeEmbedUrl(config.hero_video);
  const fallbackHeroImage =
    config.hero_image ||
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=80";

  const villaImage =
    featuredVilla?.images?.[0] ||
    config.hero_image ||
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80";

  const hasCustomTitle =
    config.hero_title &&
    config.hero_title !== "Tittle" &&
    config.hero_title !== "Kemewahan Bertemu Ketenangan";

  const subtitleText =
    config.hero_subtitle ||
    "Pengalaman menginap lengkap untuk momen yang lebih berkesan bersama keluarga dan orang terkasih.";

  // RDP Calendar Month matrix (exact match with detail page)
  const monthStart = startOfMonth(pickerMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weeks: Date[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const currentCapacity = selectedVilla?.capacity || 20;

  return (
    <main className="hero relative min-h-[75vh] flex flex-col justify-center bg-[#FAF8F5] pt-20 pb-16 sm:pt-24 sm:pb-20 lg:pt-24 lg:pb-24">
      {/* Background Ambience & Lighting - Contained so it never causes page scroll or clipping */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[450px] h-[450px] bg-accent/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-20 -left-20 w-[380px] h-[380px] bg-amber-100/40 rounded-full blur-[120px]" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full">
        {/* Top Split: Text & Dual Arch Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          
          {/* Left: Text Content */}
          <div className="hero-content lg:col-span-6 xl:col-span-7 flex flex-col justify-center text-left">
            {/* Eyebrow */}
            <div className="overflow-hidden mb-3">
              <p className="eyebrow hero-animate inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-semibold tracking-[0.2em] uppercase text-accent">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>{config.hero_tagline || "Private Villas · Hand-Picked"}</span>
              </p>
            </div>

            {/* Headline H1 */}
            <div className="overflow-hidden mb-3 sm:mb-4">
              <h1 className="hero-animate hero-animate-delay-1 font-display text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-bold text-primary tracking-tight leading-[1.15]">
                {hasCustomTitle ? (
                  <>
                    {config.hero_title}{" "}
                    {config.hero_title_italic && (
                      <span className="accent text-accent italic font-normal block sm:inline">
                        {config.hero_title_italic}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    Stay somewhere the world{" "}
                    <span className="accent text-accent italic font-normal">hasn't found</span> yet.
                  </>
                )}
              </h1>
            </div>

            {/* Description */}
            <div className="overflow-hidden mb-5">
              <p className="description hero-animate hero-animate-delay-2 text-slate-600 text-xs sm:text-sm md:text-base font-normal leading-relaxed max-w-xl">
                {subtitleText}
              </p>
            </div>

            {/* CTA Group */}
            <div className="cta-group flex flex-wrap items-center gap-4 sm:gap-5 pt-0.5 hero-animate hero-animate-delay-3">
              <Link
                href="#villas"
                className="btn-primary inline-flex items-center justify-center gap-2.5 bg-accent hover:bg-accent-light text-white font-semibold px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm shadow-lg shadow-accent/20 hover:shadow-accent/35 hover:scale-102 active:scale-98 transition-all duration-200 group cursor-pointer"
              >
                <span>Explore the villa</span>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-200 group-hover:translate-x-1"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right: Architectural Illustration & Arches (Hidden on Mobile, Displayed on Desktop) */}
          <div className="hero-illustration hidden lg:flex lg:col-span-6 xl:col-span-5 items-center justify-center lg:justify-end hero-animate hero-animate-delay-2">
            <div className="relative w-full max-w-[260px] sm:max-w-[290px] lg:max-w-[320px] h-[310px] sm:h-[350px] lg:h-[380px] flex items-center justify-center">
              
              {/* Soft Ambient Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] sm:w-[300px] h-[320px] sm:h-[360px] bg-accent/20 rounded-full blur-[60px] pointer-events-none" />

              {/* Large Arch: YouTube Video Embed (di belakang) */}
              <div className="arch-large relative w-[200px] sm:w-[230px] lg:w-[255px] h-[280px] sm:h-[320px] lg:h-[350px] rounded-t-full rounded-b-3xl overflow-hidden border-4 border-white shadow-xl shadow-primary/10 bg-slate-950 ml-auto">
                {embedVideoUrl ? (
                  <div className="absolute inset-0 w-full h-full overflow-hidden">
                    <iframe
                      src={embedVideoUrl}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[340%] h-[120%] pointer-events-none"
                      allow="autoplay; encrypted-media; loop"
                      style={{ border: "none" }}
                      title="Villa Video Preview"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/15 pointer-events-none" />
                  </div>
                ) : (
                  <div className="absolute inset-0 w-full h-full">
                    <Image
                      src={fallbackHeroImage}
                      alt="Villa Luxury Experience"
                      fill
                      priority
                      sizes="(max-width: 1024px) 60vw, 30vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/15 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Small Arch: Real Villa Photo (di depan / overlapping) */}
              <div className="arch-small absolute -bottom-2 left-0 sm:-bottom-2.5 sm:left-1 lg:-bottom-2.5 lg:left-0 z-20 w-[115px] sm:w-[135px] lg:w-[150px] h-[160px] sm:h-[190px] lg:h-[210px] rounded-t-full rounded-b-2xl overflow-hidden border-4 border-white shadow-xl shadow-primary/15 bg-slate-900 group ring-1 ring-black/10 transition-transform duration-500 hover:scale-103 cursor-pointer">
                <Link
                  href={featuredVilla ? `/villas/${featuredVilla.slug}` : "#villas"}
                  className="block w-full h-full relative"
                >
                  <Image
                    src={villaImage}
                    alt={featuredVilla?.name || "Featured Villa"}
                    fill
                    sizes="(max-width: 768px) 40vw, 20vw"
                    className="object-cover group-hover:scale-108 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
                  <div className="absolute bottom-2.5 left-1.5 right-1.5 text-center pointer-events-none">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-[9px] sm:text-[10px] font-semibold text-primary shadow-sm tracking-wide truncate max-w-full">
                      {featuredVilla?.name || "Villa Pilihan"}
                    </span>
                  </div>
                </Link>
              </div>

            </div>
          </div>

        </div>

        {/* BOTTOM: Luxury Interactive Search Bar (Never Obscured) */}
        <div className="mt-8 sm:mt-10 lg:mt-12 w-full hero-animate hero-animate-delay-3 relative z-30">
          <div
            ref={searchBarRef}
            className="search-bar relative bg-white/95 backdrop-blur-xl border border-gray-200/80 rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 shadow-xl shadow-primary/5 flex flex-col lg:flex-row items-stretch lg:items-center gap-1.5 lg:gap-1 max-w-4xl mx-auto"
          >
            {/* Field 1: Destination */}
            <div className="search-field relative flex-1 min-w-0 px-3 py-2 rounded-xl hover:bg-gray-50/80 transition-colors lg:border-r border-gray-100">
              <span className="field-label block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                Destination
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsPickerOpen(false);
                  setGuestDropdownOpen(false);
                  setDestinationOpen((prev) => !prev);
                }}
                className="field-value w-full flex items-center justify-between gap-1.5 text-left font-display text-xs sm:text-sm font-bold text-primary truncate cursor-pointer"
              >
                <span className="truncate">
                  {selectedVilla ? selectedVilla.name : "Anywhere in the collection"}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="2"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-200 ${
                    destinationOpen ? "rotate-180 text-accent" : ""
                  }`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {/* Destination Dropdown Popover */}
              {destinationOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 w-72 sm:w-80 max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 animate-fade-in">
                  <div className="p-2 border-b border-gray-100">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Pilih Destinasi Villa
                    </p>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1 py-1 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVilla(null);
                        setDestinationOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                        !selectedVilla ? "bg-accent/10 text-primary" : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <div>
                        <p className="text-xs sm:text-sm font-bold font-display">Anywhere in the collection</p>
                        <p className="text-[11px] text-gray-400">Seluruh koleksi villa</p>
                      </div>
                      {!selectedVilla && <Check className="w-3.5 h-3.5 text-accent" />}
                    </button>

                    {villas.map((v) => {
                      const isSelected = selectedVilla?.id === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setSelectedVilla(v);
                            setDestinationOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                            isSelected ? "bg-accent/10 text-primary" : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                            {v.images?.[0] ? (
                              <Image
                                src={v.images[0]}
                                alt={v.name}
                                fill
                                sizes="32px"
                                className="object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-bold font-display truncate">{v.name}</p>
                            <p className="text-[10px] text-gray-400 truncate">{v.location}</p>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-accent shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Combined Dates Container (Check in & Check out) */}
            <div className="relative flex-1 flex flex-col sm:flex-row items-stretch min-w-0 lg:border-r border-gray-100">
              
              {/* Field 2: Check in */}
              <div className="search-field flex-1 min-w-0 px-3 py-2 rounded-xl hover:bg-gray-50/80 transition-colors sm:border-r border-gray-100">
                <span className="field-label block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                  Check in
                </span>
                <button
                  type="button"
                  onClick={() => openPicker("checkIn")}
                  className={cn(
                    "field-value w-full flex items-center justify-between gap-1.5 text-left font-display text-xs sm:text-sm font-bold truncate cursor-pointer transition-colors",
                    isPickerOpen && pickerMode === "checkIn"
                      ? "text-accent"
                      : "text-primary"
                  )}
                >
                  <span className={checkIn ? "text-primary truncate" : "text-gray-400 font-normal truncate"}>
                    {checkIn ? format(checkIn, "d MMM yyyy", { locale: localeId }) : "Pilih tanggal"}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-3.5 h-3.5 text-gray-400 shrink-0"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                    />
                  </svg>
                </button>
              </div>

              {/* Field 3: Check out */}
              <div className="search-field flex-1 min-w-0 px-3 py-2 rounded-xl hover:bg-gray-50/80 transition-colors">
                <span className="field-label block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                  Check out
                </span>
                <button
                  type="button"
                  onClick={() => openPicker("checkOut")}
                  className={cn(
                    "field-value w-full flex items-center justify-between gap-1.5 text-left font-display text-xs sm:text-sm font-bold truncate cursor-pointer transition-colors",
                    isPickerOpen && pickerMode === "checkOut"
                      ? "text-accent"
                      : "text-primary"
                  )}
                >
                  <span className={checkOut ? "text-primary truncate" : "text-gray-400 font-normal truncate"}>
                    {checkOut ? format(checkOut, "d MMM yyyy", { locale: localeId }) : "Pilih tanggal"}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-3.5 h-3.5 text-gray-400 shrink-0"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                    />
                  </svg>
                </button>
              </div>

              {/* Exact Date Range Picker Popover from Villa Detail Page (rdp-sidebar) */}
              {isPickerOpen && (
                <div className="absolute top-full left-0 sm:left-1/2 sm:-translate-x-1/2 lg:left-0 lg:translate-x-0 mt-2 z-50 animate-fade-in w-[310px] sm:w-[330px] max-w-[92vw]">
                  <div className="rdp-sidebar bg-white border border-gray-200 rounded-2xl p-4 shadow-2xl shadow-black/10">
                    {/* Header Step / Mode Indicator */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 text-xs">
                      <span className="font-semibold text-primary">
                        {pickerMode === "checkIn" ? "Pilih Tanggal Check-in" : "Pilih Tanggal Check-out"}
                      </span>
                      {checkIn && (
                        <span className="text-accent text-[11px] font-medium">
                          In: {format(checkIn, "d MMM", { locale: localeId })}
                        </span>
                      )}
                    </div>

                    <div className="rdp-root" lang="id" data-mode={pickerMode === "checkIn" ? "single" : "range"}>
                      <div className="rdp-months relative">
                        <nav className="rdp-nav flex items-center justify-between absolute inset-x-0 top-0 z-10 px-0.5" aria-label="Navigation bar">
                          <button
                            type="button"
                            onClick={prevMonth}
                            disabled={isPrevDisabled}
                            className="rdp-btn-nav p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-cream transition-colors disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                            aria-label="Go to the Previous Month"
                          >
                            <svg className="rdp-chevron-icon w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <polygon points="16 18.112 9.81111111 12 16 5.87733333 14.0888889 4 6 12 14.0888889 20" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={nextMonth}
                            className="rdp-btn-nav p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-cream transition-colors cursor-pointer"
                            aria-label="Go to the Next Month"
                          >
                            <svg className="rdp-chevron-icon w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <polygon points="8 18.112 14.18888889 12 8 5.87733333 9.91111111 4 18 12 9.91111111 20" />
                            </svg>
                          </button>
                        </nav>

                        <div className="rdp-month">
                          <div className="rdp-month-caption text-center py-1 mb-2">
                            <span className="rdp-caption-label font-bold text-sm text-primary font-sans capitalize" role="status" aria-live="polite">
                              {format(pickerMonth, "MMMM yyyy", { locale: localeId })}
                            </span>
                          </div>

                          <table role="grid" aria-multiselectable="false" className="rdp-grid w-full border-collapse">
                            <thead aria-hidden="true">
                              <tr className="rdp-weekdays-row grid grid-cols-7 mb-1 text-center">
                                <th aria-label="Senin" className="rdp-weekday-cell text-[11px] font-semibold text-gray-400 py-1 font-sans" scope="col">Sen</th>
                                <th aria-label="Selasa" className="rdp-weekday-cell text-[11px] font-semibold text-gray-400 py-1 font-sans" scope="col">Sel</th>
                                <th aria-label="Rabu" className="rdp-weekday-cell text-[11px] font-semibold text-gray-400 py-1 font-sans" scope="col">Rab</th>
                                <th aria-label="Kamis" className="rdp-weekday-cell text-[11px] font-semibold text-gray-400 py-1 font-sans" scope="col">Kam</th>
                                <th aria-label="Jumat" className="rdp-weekday-cell text-[11px] font-semibold text-gray-400 py-1 font-sans" scope="col">Jum</th>
                                <th aria-label="Sabtu" className="rdp-weekday-cell text-[11px] font-semibold text-gray-400 py-1 font-sans" scope="col">Sab</th>
                                <th aria-label="Minggu" className="rdp-weekday-cell text-[11px] font-semibold text-gray-400 py-1 font-sans" scope="col">Min</th>
                              </tr>
                            </thead>
                            <tbody className="rdp-weeks space-y-1 block">
                              {weeks.map((week, wIdx) => (
                                <tr key={wIdx} className="rdp-week-row grid grid-cols-7">
                                  {week.map((day) => {
                                    const isOutside = !isSameMonth(day, pickerMonth);
                                    const isPast = isBefore(day, startOfDay(new Date()));
                                    const isBooked = isDateBooked(day);
                                    const isTodayDate = isSameDay(day, new Date());

                                    let isDisabled = isPast || isBooked;
                                    if (pickerMode === "checkOut" && checkIn) {
                                      if (!isAfter(day, checkIn)) {
                                        isDisabled = true;
                                      } else if (hasBookedBetween(checkIn, day)) {
                                        isDisabled = true;
                                      }
                                    }

                                    const isStart = checkIn ? isSameDay(day, checkIn) : false;
                                    const isEnd = checkOut ? isSameDay(day, checkOut) : false;
                                    const isInRange =
                                      checkIn && checkOut && isAfter(day, checkIn) && isBefore(day, checkOut);
                                    const isHoveredRange =
                                      checkIn &&
                                      !checkOut &&
                                      hoveredDate &&
                                      isAfter(day, checkIn) &&
                                      (isBefore(day, hoveredDate) || isSameDay(day, hoveredDate));

                                    const dayStr = format(day, "yyyy-MM-dd");

                                    if (isOutside) {
                                      return (
                                        <td key={dayStr} className="rdp-day-cell rdp-disabled rdp-hidden rdp-outside p-0.5 text-center">
                                          <div className="w-full aspect-square" />
                                        </td>
                                      );
                                    }

                                    return (
                                      <td
                                        key={dayStr}
                                        className={cn(
                                          "rdp-day-cell p-0.5 text-center relative",
                                          isDisabled && "rdp-disabled",
                                          isTodayDate && "rdp-today",
                                          isStart && "rdp-range-start",
                                          isEnd && "rdp-range-end",
                                          (isInRange || isHoveredRange) && "rdp-range-middle bg-accent/15"
                                        )}
                                      >
                                        <button
                                          type="button"
                                          disabled={isDisabled}
                                          onClick={() => handleDayClick(day)}
                                          onMouseEnter={() => {
                                            if (checkIn && !checkOut) setHoveredDate(day);
                                          }}
                                          onMouseLeave={() => setHoveredDate(null)}
                                          className={cn(
                                            "rdp-day-btn w-full aspect-square rounded-xl text-xs flex items-center justify-center font-sans transition-all duration-150",
                                            isDisabled && "text-gray-300 cursor-not-allowed",
                                            isBooked && !isPast && "line-through text-rose-300",
                                            !isDisabled && !isStart && !isEnd && "text-gray-700 hover:bg-accent hover:text-white cursor-pointer font-medium",
                                            isTodayDate && !isStart && !isEnd && "font-bold text-primary ring-1 ring-accent/40",
                                            (isStart || isEnd) && "bg-accent text-white font-bold shadow-xs hover:bg-accent-light cursor-pointer scale-105 z-10"
                                          )}
                                        >
                                          {format(day, "d")}
                                        </button>
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Field 4: Guests (Exact match with detail page) */}
            <div className="search-field relative flex-1 min-w-0 px-3 py-2 rounded-xl hover:bg-gray-50/80 transition-colors">
              <span className="field-label block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                Guests
              </span>
              <button
                type="button"
                onClick={() => {
                  setDestinationOpen(false);
                  setIsPickerOpen(false);
                  setGuestDropdownOpen((prev) => !prev);
                }}
                className="field-value w-full flex items-center justify-between gap-1.5 text-left font-display text-xs sm:text-sm font-bold text-primary truncate cursor-pointer"
              >
                <span className="truncate">{guests} Tamu</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-3.5 h-3.5 text-gray-400 shrink-0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
              </button>

              {/* Exact Guest Selector Dropdown Popover from Detail Page */}
              {guestDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white border border-gray-100 rounded-2xl p-4 shadow-xl z-50 animate-fade-in w-64 max-w-[90vw]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-primary">Jumlah Tamu</p>
                      <p className="text-xs text-gray-400">
                        Maks. {currentCapacity} orang
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={guests <= 1}
                        onClick={() => setGuests((prev) => Math.max(1, prev - 1))}
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-accent hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-semibold text-sm w-4 text-center text-primary">
                        {guests}
                      </span>
                      <button
                        type="button"
                        disabled={guests >= currentCapacity}
                        onClick={() => setGuests((prev) => Math.min(currentCapacity, prev + 1))}
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-accent hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action: Check Availability Button */}
            <button
              type="button"
              onClick={handleSearchSubmit}
              className="btn-search shrink-0 bg-accent hover:bg-accent-light active:scale-98 text-white font-semibold text-xs sm:text-sm px-5 sm:px-7 py-3 rounded-xl sm:rounded-2xl shadow-md shadow-accent/20 hover:shadow-accent/35 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-1 lg:mt-0"
            >
              <Search className="w-3.5 h-3.5 text-white" />
              <span>Check availability</span>
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
