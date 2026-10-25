"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useVillaBooking } from "./villa-booking-context";
import { formatIDR } from "@/lib/pricing";
import { Calendar, ChevronRight } from "lucide-react";

export function VillaMobileBookingBar() {
  const { villa, checkIn, checkOut, guests, breakdown } = useVillaBooking();

  const averagePrice = breakdown?.averagePerNight || villa.price;
  const hasDates = Boolean(checkIn && checkOut);

  const formattedDates = hasDates
    ? `${format(checkIn!, "d MMM", { locale: localeId })} - ${format(
        checkOut!,
        "d MMM yyyy",
        { locale: localeId }
      )}`
    : "Pilih tanggal menginap";

  const bookingUrl = hasDates
    ? `/booking?property=${villa.slug}&check_in=${format(
        checkIn!,
        "yyyy-MM-dd"
      )}&check_out=${format(checkOut!, "yyyy-MM-dd")}&guests=${guests}`
    : "#booking-widget";

  const scrollToBooking = (e: React.MouseEvent) => {
    if (!hasDates) {
      e.preventDefault();
      const el =
        document.getElementById("booking-widget") ||
        document.getElementById("availability-calendar");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/90 px-4 py-3 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] lg:hidden">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        {/* Price & Selected Dates Info */}
        <div className="min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-lg font-bold text-accent">
              {formatIDR(
                hasDates && breakdown ? breakdown.subtotal : averagePrice
              )}
            </span>
            <span className="text-[11px] text-gray-500 font-normal">
              {hasDates && breakdown
                ? `(${breakdown.nights} malam)`
                : "/malam"}
            </span>
          </div>
          <div className="text-[11px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
            <Calendar className="w-3 h-3 text-accent shrink-0" />
            <span className="truncate">{formattedDates}</span>
          </div>
        </div>

        {/* Action Button */}
        {hasDates ? (
          <Link
            href={bookingUrl}
            className="inline-flex items-center justify-center gap-1.5 bg-accent hover:bg-accent-light active:scale-95 text-white font-semibold text-xs px-5 py-3 rounded-2xl shadow-md shadow-accent/25 transition-all shrink-0"
          >
            <span>Booking Sekarang</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={scrollToBooking}
            className="inline-flex items-center justify-center gap-1.5 bg-accent hover:bg-accent-light active:scale-95 text-white font-semibold text-xs px-5 py-3 rounded-2xl shadow-md shadow-accent/25 transition-all shrink-0 cursor-pointer"
          >
            <span>Pesan Sekarang</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
