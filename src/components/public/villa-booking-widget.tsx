"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useVillaBooking } from "./villa-booking-context";
import { formatIDR } from "@/lib/pricing";
import { cn } from "@/lib/utils";

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
    guests,
    setGuests,
    breakdown,
  } = useVillaBooking();

  const [guestDropdownOpen, setGuestDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setGuestDropdownOpen(false);
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
            : "Harga per malam"}
        </p>
        <p className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-accent">
          {formatIDR(averagePrice)}
          <span className="text-gray-400 font-normal text-base ml-1">
            /malam
          </span>
        </p>
      </div>

      <div className="border-t border-gray-100 mb-6"></div>

      {/* Date Pickers */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
            Check-in
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={scrollToCalendar}
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
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                ></path>
              </svg>
              <span className="text-sm truncate text-gray-800">
                {formattedCheckIn}
              </span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
            Check-out
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={scrollToCalendar}
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
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                ></path>
              </svg>
              <span className="text-sm truncate text-gray-800">
                {formattedCheckOut}
              </span>
            </button>
          </div>
        </div>
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
              ></path>
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

      {/* Itemized Price Breakdown */}
      {breakdown && breakdown.nights > 0 ? (
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
      ) : (
        <div className="bg-cream/60 rounded-2xl p-4 mb-4 text-center text-xs text-gray-500">
          Silakan pilih tanggal check-in dan check-out untuk melihat rincian harga.
        </div>
      )}

      {/* Booking CTA */}
      {checkIn && checkOut ? (
        <Link
          className="w-full flex items-center justify-center gap-2 bg-accent text-white px-6 py-4 rounded-2xl font-semibold hover:bg-accent-light transition-colors text-center"
          href={bookingUrl}
        >
          Booking Sekarang
        </Link>
      ) : (
        <button
          type="button"
          onClick={scrollToCalendar}
          className="w-full flex items-center justify-center gap-2 bg-accent text-white px-6 py-4 rounded-2xl font-semibold hover:bg-accent-light transition-colors cursor-pointer text-center"
        >
          Pilih Tanggal
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
