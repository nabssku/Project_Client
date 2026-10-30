"use client";

import React, { useState } from "react";
import {
  addMonths,
  subMonths,
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isBefore,
  isAfter,
  startOfDay,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useVillaBooking } from "./villa-booking-context";
import { formatCompactPrice, getDailyPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function VillaAvailabilityCalendar() {
  const {
    villa,
    checkIn,
    checkOut,
    customPrices,
    isDateBooked,
    isDateDisabled,
    selectDate,
  } = useVillaBooking();

  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => {
    const prev = subMonths(currentMonth, 1);
    if (!isBefore(endOfMonth(prev), startOfMonth(new Date()))) {
      setCurrentMonth(prev);
    }
  };

  const isPrevDisabled = isBefore(
    subMonths(currentMonth, 1),
    startOfMonth(new Date())
  );

  // Calendar dates generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  const today = startOfDay(new Date());

  const pricingInput = {
    pricePerNight: villa.price,
    priceWeekend: villa.priceWeekend,
    dailyRates: (villa as any).dailyRates,
    customPrices,
  };

  return (
    <div
      id="availability-calendar"
      className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 lg:p-7 border border-gray-100 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
        <div>
          <h2 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-primary flex items-center gap-2">
            Kalender Ketersediaan &amp; Harga
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1">
            Gunakan kalender ini untuk melihat ketersediaan tanggal dan rincian tarif per malam. Tanggal bertanda <strong className="text-rose-500">Penuh</strong> sudah terisi.
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={prevMonth}
            disabled={isPrevDisabled}
            className="p-1.5 sm:p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-cream hover:border-accent/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Bulan sebelumnya"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <span className="font-bold text-xs sm:text-sm md:text-base text-primary min-w-[110px] sm:min-w-[130px] text-center capitalize font-sans">
            {format(currentMonth, "MMMM yyyy", { locale: localeId })}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 sm:p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-cream hover:border-accent/40 transition-colors cursor-pointer"
            aria-label="Bulan berikutnya"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2 mb-1.5 sm:mb-2 text-center">
        {dayNames.map((name, i) => (
          <div
            key={i}
            className={`text-center text-[10px] sm:text-xs font-semibold py-1 sm:py-1.5 uppercase tracking-wider font-sans ${
              i >= 5 ? "text-amber-700" : "text-gray-400"
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2">
        {days.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isPast = isBefore(startOfDay(day), today);
          const isBooked = isDateBooked(day);
          const isDisabled = isPast || isBooked;

          const isCheckInDay = checkIn && isSameDay(day, checkIn);
          const isCheckOutDay = checkOut && isSameDay(day, checkOut);
          const isInRange =
            checkIn &&
            checkOut &&
            isAfter(startOfDay(day), startOfDay(checkIn)) &&
            isBefore(startOfDay(day), startOfDay(checkOut));

          const priceInfo = getDailyPrice(pricingInput, day);
          const compactPrice = formatCompactPrice(priceInfo.price);

          // Cell styling logic
          let cellStyle = "bg-white border-gray-100";
          let textColor = "text-gray-800";
          let priceColor = "text-gray-500";

          if (!isCurrentMonth) {
            cellStyle = "opacity-25 bg-gray-50 border-transparent";
            textColor = "text-gray-400";
            priceColor = "text-gray-400";
          } else if (isPast) {
            cellStyle = "opacity-40 bg-gray-50 border-gray-100";
            textColor = "text-gray-400";
            priceColor = "text-gray-300";
          } else if (isBooked) {
            cellStyle =
              "bg-rose-50/60 border-rose-100 opacity-80";
            textColor = "text-rose-400 line-through";
            priceColor = "text-rose-400 font-medium";
          } else if (isCheckInDay || isCheckOutDay) {
            cellStyle =
              "bg-accent text-white border-accent shadow-md scale-[1.02] z-10 ring-2 ring-accent/30";
            textColor = "text-white font-bold";
            priceColor = "text-white/90 font-medium";
          } else if (isInRange) {
            cellStyle = "bg-accent/15 border-accent/30";
            textColor = "text-accent-dark font-semibold";
            priceColor = "text-accent-dark/80";
          } else if (priceInfo.type === "HOLIDAY") {
            cellStyle =
              "bg-rose-50/40 border-rose-200/60";
            priceColor = "text-rose-600 font-medium";
          } else if (priceInfo.type === "WEEKEND") {
            cellStyle =
              "bg-amber-50/40 border-amber-200/60";
            priceColor = "text-amber-700 font-medium";
          }

          return (
            <div
              key={idx}
              className={cn(
                "min-h-[48px] sm:min-h-[56px] lg:min-h-[60px] p-1 sm:p-1.5 lg:p-2 rounded-xl border transition-all flex flex-col justify-between text-left relative select-none cursor-default",
                cellStyle
              )}
            >
              {/* Day Number and status badge */}
              <div className="flex items-center justify-between w-full leading-none">
                <span className={cn("text-[11px] sm:text-xs md:text-sm font-semibold font-sans", textColor)}>
                  {format(day, "d")}
                </span>
                {isCheckInDay && (
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-white/20 text-white px-1 sm:px-1.5 py-0.5 rounded-full hidden sm:inline">
                    Masuk
                  </span>
                )}
                {isCheckOutDay && (
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-white/20 text-white px-1 sm:px-1.5 py-0.5 rounded-full hidden sm:inline">
                    Keluar
                  </span>
                )}
                {isBooked && isCurrentMonth && !isPast && (
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-rose-500 bg-rose-100 px-1 py-0.2 rounded hidden sm:inline">
                    Penuh
                  </span>
                )}
              </div>

              {/* Price badge / Booked notice */}
              {isCurrentMonth && !isPast && !isBooked ? (
                <div className="mt-0.5 sm:mt-1 leading-none">
                  <span
                    className={cn(
                      "block text-[8px] sm:text-[10px] md:text-[11px] tracking-tight font-medium font-sans truncate whitespace-nowrap",
                      priceColor
                    )}
                  >
                    {compactPrice}
                  </span>
                </div>
              ) : isCurrentMonth && !isPast && isBooked ? (
                <div className="mt-0.5 sm:mt-1 leading-none">
                  <span className="block text-[8px] sm:text-[9px] text-rose-500 font-bold font-sans truncate sm:hidden">
                    Penuh
                  </span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Calendar Legend */}
      <div className="mt-4 sm:mt-6 pt-3.5 sm:pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2.5 sm:gap-4 text-[10px] sm:text-xs text-gray-500 font-sans">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-md border border-gray-200 bg-white"></span>
          <span>Tersedia</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-md border border-accent bg-accent"></span>
          <span>Pilihan Anda</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-md border border-amber-300 bg-amber-50"></span>
          <span>Weekend</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-md border border-rose-300 bg-rose-50"></span>
          <span>Hari Libur</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-md border border-rose-200 bg-rose-100/70"></span>
          <span>Penuh</span>
        </div>
      </div>
    </div>
  );
}
