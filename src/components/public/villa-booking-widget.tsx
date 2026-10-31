"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  format,
  startOfDay,
  addDays,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useVillaBooking } from "./villa-booking-context";
import { formatIDR } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export function VillaBookingWidget({
  id,
  className,
}: {
  id?: string;
  className?: string;
} = {}) {
  const {
    villa,
    checkIn,
    checkOut,
    setCheckIn,
    setCheckOut,
    guests,
    setGuests,
    breakdown,
    isDateBooked,
    hasBookedBetween,
    hasOverlapWithBooked,
  } = useVillaBooking();

  const isOverlap = Boolean(
    checkIn &&
      checkOut &&
      isAfter(checkOut, checkIn) &&
      hasOverlapWithBooked &&
      hasOverlapWithBooked(checkIn, checkOut)
  );

  const [guestDropdownOpen, setGuestDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Custom Date Range Picker State (rdp)
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<"checkIn" | "checkOut">("checkIn");
  const [pickerMonth, setPickerMonth] = useState<Date>(() => startOfMonth(checkIn || new Date()));
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const openPicker = (mode: "checkIn" | "checkOut") => {
    if (mode === "checkOut" && !checkIn) {
      setPickerMode("checkIn");
    } else {
      setPickerMode(mode);
    }
    if (checkIn) {
      setPickerMonth(startOfMonth(checkIn));
    } else {
      setPickerMonth(startOfMonth(new Date()));
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
      if (checkOut && (!isAfter(checkOut, day) || hasOverlapWithBooked(day, checkOut))) {
        setCheckOut(null);
      }
      setPickerMode("checkOut");
    } else {
      if (checkIn && isAfter(day, checkIn)) {
        setCheckOut(day);
        setIsPickerOpen(false);
      } else {
        setCheckIn(day);
        setCheckOut(null);
        setPickerMode("checkOut");
      }
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setGuestDropdownOpen(false);
      }
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scrollToCalendar = () => {
    const el = document.getElementById("availability-calendar");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const formattedCheckIn = checkIn
    ? format(checkIn, "d MMM yyyy", { locale: localeId })
    : "Pilih tanggal";

  const formattedCheckOut = checkOut
    ? format(checkOut, "d MMM yyyy", { locale: localeId })
    : "Pilih tanggal";

  const averagePrice = breakdown?.averagePerNight || villa.price;

  // Booking URL
  const bookingUrl =
    checkIn && checkOut
      ? `/booking?property=${villa.slug}&check_in=${format(
          checkIn,
          "yyyy-MM-dd"
        )}&check_out=${format(checkOut, "yyyy-MM-dd")}&guests=${guests}`
      : `#availability-calendar`;

  // WhatsApp Message
  const ownerPhone = (villa.ownerPhone || "628111141888").replace(/\D/g, "").replace(/^0/, "62");
  const waDatesText =
    checkIn && checkOut
      ? `untuk tanggal ${formattedCheckIn} - ${formattedCheckOut}`
      : "";
  const waMessage = `Halo, saya tertarik booking ${villa.name} ${waDatesText}, ${guests} tamu. Bisa bantu?`;
  const waUrl = `https://wa.me/${ownerPhone}?text=${encodeURIComponent(
    waMessage
  )}`;

  const monthStart = startOfMonth(pickerMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weeks: Date[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  return (
    <div
      id={id}
      className={cn(
        "bg-white border border-gray-100 rounded-3xl p-5 sm:p-8 shadow-xl shadow-primary/5",
        className
      )}
    >
      {/* Price Header */}
      <div className="mb-6">
        <p className="text-gray-500 text-sm mb-1">
          {breakdown && breakdown.nights > 1
            ? "Rata-rata per malam"
            : "Harga hari ini"}
        </p>
        <p className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-accent">
          {formatIDR(averagePrice)}
          <span className="text-gray-400 font-normal text-base ml-1">
            /malam
          </span>
        </p>
      </div>

      <div className="border-t border-gray-100 mb-6"></div>

      {/* Date Pickers with RDP Popover */}
      <div className="space-y-3 mb-4 relative" ref={pickerRef}>
        {/* Check-in Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                Check-in
              </label>
              <span className="text-[10px] text-gray-400 font-sans">
                (Mulai {villa.checkInTime || "14:00"} WIB)
              </span>
            </div>
            {checkIn && (
              <button
                type="button"
                onClick={() => {
                  setCheckIn(null);
                  setCheckOut(null);
                  setPickerMode("checkIn");
                }}
                className="text-[11px] text-gray-400 hover:text-rose-500 cursor-pointer transition-colors"
                title="Hapus tanggal"
              >
                Reset
              </button>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => openPicker("checkIn")}
              className={cn(
                "flex items-center gap-3 bg-cream border rounded-xl px-4 py-3 w-full text-left cursor-pointer transition-colors",
                isPickerOpen && pickerMode === "checkIn"
                  ? "border-accent ring-2 ring-accent/20"
                  : "border-gray-200 hover:border-accent/40"
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-5 h-5 text-gray-400 shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                />
              </svg>
              <span
                className={cn(
                  "text-sm truncate",
                  checkIn ? "text-primary font-medium" : "text-gray-400"
                )}
              >
                {checkIn
                  ? format(checkIn, "d MMM yyyy", { locale: localeId })
                  : "Pilih tanggal"}
              </span>
            </button>
          </div>
        </div>

        {/* Check-out Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                Check-out
              </label>
              <span className="text-[10px] text-gray-400 font-sans">
                (Maks {villa.checkOutTime || "12:00"} WIB)
              </span>
            </div>
            {checkIn && !checkOut && (
              <span className="text-[10px] text-accent font-semibold uppercase">
                Wajib diisi
              </span>
            )}
            {checkIn && checkOut && breakdown && breakdown.nights > 0 && (
              <span className="text-[10px] text-accent font-semibold">
                {breakdown.nights} malam
              </span>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => openPicker("checkOut")}
              className={cn(
                "flex items-center gap-3 bg-cream border rounded-xl px-4 py-3 w-full text-left cursor-pointer transition-colors",
                !checkIn
                  ? "border-gray-200 opacity-60 hover:opacity-80"
                  : isPickerOpen && pickerMode === "checkOut"
                  ? "border-accent ring-2 ring-accent/20"
                  : checkOut
                  ? "border-gray-200 hover:border-accent/40"
                  : "border-accent/60 ring-1 ring-accent/20"
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-5 h-5 text-gray-400 shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                />
              </svg>
              <span
                className={cn(
                  "text-sm truncate",
                  checkOut
                    ? "text-primary font-medium"
                    : checkIn
                    ? "text-accent font-medium"
                    : "text-gray-400"
                )}
              >
                {checkOut
                  ? format(checkOut, "d MMM yyyy", { locale: localeId })
                  : "Pilih tanggal"}
              </span>
            </button>
          </div>
        </div>

        {/* Date Range Picker Popover (RDP Structure) */}
        {isPickerOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-40 animate-fade-in">
            <div className="rdp-sidebar bg-white border border-gray-200 rounded-2xl p-4 shadow-2xl shadow-black/10">
              {/* RDP Root Component */}
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

                    <table role="grid" aria-multiselectable="false" aria-label={format(pickerMonth, "MMMM yyyy", { locale: localeId })} className="rdp-grid w-full border-collapse">
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
                              const isToday = isSameDay(day, new Date());

                              let isDisabled = false;
                              if (pickerMode === "checkIn") {
                                isDisabled = isPast || isBooked;
                              } else {
                                isDisabled =
                                  !checkIn ||
                                  !isAfter(day, checkIn) ||
                                  hasOverlapWithBooked(checkIn, day);
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
                                  <td
                                    key={dayStr}
                                    className="rdp-day-cell rdp-disabled rdp-hidden rdp-outside p-0.5 text-center"
                                    role="gridcell"
                                    data-day={dayStr}
                                    data-disabled="true"
                                    data-hidden="true"
                                    data-outside="true"
                                  >
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
                                    isToday && "rdp-today",
                                    isStart && "rdp-range-start",
                                    isEnd && "rdp-range-end",
                                    (isInRange || isHoveredRange) && "rdp-range-middle bg-accent/15"
                                  )}
                                  role="gridcell"
                                  data-day={dayStr}
                                  data-disabled={isDisabled ? "true" : undefined}
                                  data-today={isToday ? "true" : undefined}
                                >
                                  <button
                                    type="button"
                                    disabled={isDisabled}
                                    tabIndex={isDisabled ? -1 : 0}
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
                                      isToday && !isStart && !isEnd && "font-bold text-primary ring-1 ring-accent/40",
                                      (isStart || isEnd) && "bg-accent text-white font-bold shadow-xs hover:bg-accent-light cursor-pointer scale-105 z-10"
                                    )}
                                    aria-label={format(day, "EEEE, d MMMM yyyy", { locale: localeId })}
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

      {/* Guest Selector */}
      <div className="mb-6 relative" ref={dropdownRef}>
        <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
          Tamu
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setGuestDropdownOpen(!guestDropdownOpen)}
            className="flex items-center gap-3 bg-cream border border-gray-200 rounded-xl px-4 py-3 w-full text-left cursor-pointer hover:border-accent/40 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-5 h-5 text-gray-400 shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
            <span className="text-gray-800 text-sm truncate">{guests} Tamu</span>
          </button>
        </div>

        {/* Dropdown Popover */}
        {guestDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl p-4 shadow-xl z-30 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-primary">Jumlah Tamu</p>
                <p className="text-xs text-gray-400">
                  Maks. {villa.capacity} orang
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={guests <= 1}
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <span className="w-6 text-center font-bold text-primary">
                  {guests}
                </span>
                <button
                  type="button"
                  disabled={guests >= villa.capacity}
                  onClick={() =>
                    setGuests(Math.min(villa.capacity, guests + 1))
                  }
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlap Warning Alert */}
      {isOverlap && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700 mb-4 animate-fade-in font-sans">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <p className="font-bold">Tanggal Tidak Tersedia (Penuh)</p>
            <p className="text-[11px] text-rose-600 mt-0.5">
              Rentang tanggal ini sudah terisi oleh pemesan lain. Silakan periksa kalender di bawah untuk melihat tanggal kosong.
            </p>
          </div>
        </div>
      )}

      {/* Itemized Price Breakdown */}
      {breakdown && breakdown.nights > 0 && (
        <div className="animate-fade-in">
          <div className="bg-cream rounded-2xl p-5 mb-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Rincian Harga
            </p>
            <ul className="space-y-2">
              {breakdown.breakdown.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-600 capitalize">
                    {item.dayName}
                    {item.type === "WEEKEND" && (
                      <span className="ml-1.5 text-[10px] font-medium text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded">
                        Weekend
                      </span>
                    )}
                    {item.type === "HOLIDAY" && (
                      <span className="ml-1.5 text-[10px] font-medium text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded">
                        {item.label}
                      </span>
                    )}
                  </span>
                  <span className="text-gray-800 font-medium tabular-nums">
                    {formatIDR(item.price)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-200/60 mt-3 pt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Subtotal ({breakdown.nights} malam)
                </span>
                <span className="text-gray-700 font-medium tabular-nums">
                  {formatIDR(breakdown.subtotal)}
                </span>
              </div>
              <div className="border-t border-gray-200/60 pt-2 flex items-center justify-between">
                <span className="text-gray-700 text-sm font-semibold">Total</span>
                <span className="font-display text-xl font-bold text-primary">
                  {formatIDR(breakdown.subtotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking CTA */}
      {isOverlap ? (
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-500 px-6 py-4 rounded-2xl font-semibold cursor-not-allowed text-center font-sans"
        >
          Tanggal Tidak Tersedia (Penuh)
        </button>
      ) : checkIn && checkOut ? (
        <Link
          className="w-full flex items-center justify-center gap-2 bg-accent text-white px-6 py-4 rounded-2xl font-semibold hover:bg-accent-light transition-colors text-center shadow-md shadow-accent/20 font-sans cursor-pointer"
          href={bookingUrl}
        >
          Booking Sekarang
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => openPicker(!checkIn ? "checkIn" : "checkOut")}
          className="w-full flex items-center justify-center gap-2 bg-accent text-white px-6 py-4 rounded-2xl font-semibold hover:bg-accent-light transition-colors opacity-50 cursor-pointer font-sans"
        >
          Booking Sekarang
        </button>
      )}

      {/* WhatsApp CTA */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 bg-green-500 text-white px-6 py-4 rounded-2xl font-semibold hover:bg-green-400 transition-colors mt-3 text-center"
      >
        <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"></path>
        </svg>
        Hubungi via WhatsApp
      </a>

      <p className="text-center text-gray-400 text-xs mt-4 leading-relaxed">
        Gratis pembatalan hingga 24 jam sebelum check-in.
        <br />
        Hubungi kami jika butuh bantuan.
      </p>
    </div>
  );
}
