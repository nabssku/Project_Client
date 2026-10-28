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
      className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-primary flex items-center gap-2">
            Kalender Ketersediaan & Harga
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Klik tanggal untuk memilih check-in dan check-out. Harga dapat berbeda pada akhir pekan atau hari libur.
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={prevMonth}
            disabled={isPrevDisabled}
            className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-cream hover:border-accent/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Bulan sebelumnya"
          >
            <svg
              className="w-5 h-5"
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
          <span className="font-bold text-sm sm:text-base text-primary min-w-[130px] text-center capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: localeId })}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-cream hover:border-accent/40 transition-colors"
            aria-label="Bulan berikutnya"
          >
            <svg
              className="w-5 h-5"
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
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {dayNames.map((name, i) => (
          <div
            key={i}
            className={`text-center text-xs font-semibold py-2 uppercase tracking-wider ${
              i >= 5 ? "text-amber-700" : "text-gray-400"
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
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
          let cellStyle =
            "bg-white border-gray-100 hover:border-accent/60 hover:shadow-xs cursor-pointer";
          let textColor = "text-gray-800";
          let priceColor = "text-gray-500";

          if (!isCurrentMonth) {
            cellStyle = "opacity-25 bg-gray-50 border-transparent cursor-not-allowed";
            textColor = "text-gray-400";
            priceColor = "text-gray-400";
          } else if (isPast) {
            cellStyle = "opacity-40 bg-gray-50 border-gray-100 cursor-not-allowed";
            textColor = "text-gray-400";
            priceColor = "text-gray-300";
          } else if (isBooked) {
            cellStyle =
              "bg-rose-50/60 border-rose-100 cursor-not-allowed opacity-80";
            textColor = "text-rose-400 line-through";
            priceColor = "text-rose-400 font-medium";
          } else if (isCheckInDay || isCheckOutDay) {
            cellStyle =
              "bg-accent text-white border-accent shadow-md scale-[1.02] z-10";
            textColor = "text-white font-bold";
            priceColor = "text-white/90 font-medium";
          } else if (isInRange) {
            cellStyle = "bg-accent/15 border-accent/30";
            textColor = "text-accent-dark font-semibold";
            priceColor = "text-accent-dark/80";
          } else if (priceInfo.type === "HOLIDAY") {
            cellStyle =
              "bg-rose-50/40 border-rose-200/60 hover:border-rose-400 cursor-pointer";
            priceColor = "text-rose-600 font-medium";
          } else if (priceInfo.type === "WEEKEND") {
            cellStyle =
              "bg-amber-50/40 border-amber-200/60 hover:border-accent cursor-pointer";
            priceColor = "text-amber-700 font-medium";
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isDisabled || !isCurrentMonth}
              onClick={() => selectDate(day)}
              className={`min-h-[70px] sm:min-h-[82px] p-1.5 sm:p-2 rounded-2xl border transition-all flex flex-col justify-between text-left relative ${cellStyle}`}
            >
              {/* Day Number and status badge */}
              <div className="flex items-center justify-between w-full">
                <span className={`text-xs sm:text-sm ${textColor}`}>
                  {format(day, "d")}
                </span>
                {isCheckInDay && (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-white/20 text-white px-1.5 py-0.5 rounded-full hidden sm:inline">
                    Masuk
                  </span>
                )}
                {isCheckOutDay && (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-white/20 text-white px-1.5 py-0.5 rounded-full hidden sm:inline">
                    Keluar
                  </span>
                )}
                {isBooked && isCurrentMonth && !isPast && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-rose-500 bg-rose-100 px-1 py-0.2 rounded hidden sm:inline">
                    Penuh
                  </span>
                )}
              </div>

              {/* Price badge */}
              {isCurrentMonth && !isPast && !isBooked && (
                <div className="mt-1">
                  <span
                    className={`block text-[10px] sm:text-xs tracking-tight ${priceColor}`}
                  >
                    {compactPrice}
                  </span>
                </div>
              )}

              {/* Booked notice */}
              {isCurrentMonth && !isPast && isBooked && (
                <div className="mt-1">
                  <span className="block text-[10px] text-rose-500 font-semibold sm:hidden">
                    Penuh
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Calendar Legend */}
      <div className="mt-6 pt-5 border-t border-gray-100 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-lg border border-gray-200 bg-white"></span>
          <span>Tersedia</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-lg border border-accent bg-accent"></span>
          <span>Terpilih</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-lg border border-amber-300 bg-amber-50"></span>
          <span>Weekend (Jumat - Sabtu)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-lg border border-rose-300 bg-rose-50"></span>
          <span>Hari Libur / High Season</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-lg border border-rose-200 bg-rose-100/70"></span>
          <span>Sudah Dipesan (Penuh)</span>
        </div>
      </div>
    </div>
  );
}
