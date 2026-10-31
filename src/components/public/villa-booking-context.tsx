"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import {
  calculateStayBreakdown,
  CustomPriceRange,
  StayBreakdown,
  VillaPricingInput,
} from "@/lib/pricing";
import {
  addDays,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
  format,
} from "date-fns";

export interface BookedDateRange {
  startDate: string | Date;
  endDate: string | Date;
  status?: string;
}

interface VillaBookingContextType {
  villa: {
    id: string;
    slug: string;
    name: string;
    price: number;
    priceWeekend?: number | null;
    dailyRates?: any;
    capacity: number;
    ownerPhone?: string;
    checkInTime?: string;
    checkOutTime?: string;
  };
  checkIn: Date | null;
  checkOut: Date | null;
  setCheckIn: (date: Date | null) => void;
  setCheckOut: (date: Date | null) => void;
  guests: number;
  setGuests: (guests: number) => void;
  customPrices: CustomPriceRange[];
  bookedRanges: BookedDateRange[];
  breakdown: StayBreakdown | null;
  isDateBooked: (date: Date) => boolean;
  isDateDisabled: (date: Date) => boolean;
  hasBookedBetween: (start: Date, end: Date) => boolean;
  hasOverlapWithBooked: (start: Date, end: Date) => boolean;
  selectDate: (date: Date) => void;
}

const VillaBookingContext = createContext<VillaBookingContextType | undefined>(
  undefined
);

export function VillaBookingProvider({
  children,
  villa,
  initialBookedRanges = [],
  initialCustomPrices = [],
  initialCheckIn,
  initialCheckOut,
  initialGuests = 2,
}: {
  children: React.ReactNode;
  villa: {
    id: string;
    slug: string;
    name: string;
    price: number;
    priceWeekend?: number | null;
    dailyRates?: any;
    capacity: number;
    ownerPhone?: string;
    checkInTime?: string;
    checkOutTime?: string;
  };
  initialBookedRanges?: BookedDateRange[];
  initialCustomPrices?: CustomPriceRange[];
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
}) {
  const [checkIn, setCheckIn] = useState<Date | null>(() => {
    if (initialCheckIn) {
      try {
        return startOfDay(parseISO(initialCheckIn));
      } catch {}
    }
    return null;
  });

  const [checkOut, setCheckOut] = useState<Date | null>(() => {
    if (initialCheckOut) {
      try {
        return startOfDay(parseISO(initialCheckOut));
      } catch {}
    }
    return null;
  });

  const [guests, setGuests] = useState<number>(initialGuests);
  const [bookedRanges, setBookedRanges] = useState<BookedDateRange[]>(initialBookedRanges);

  // Sync if initialBookedRanges updates from server
  useEffect(() => {
    setBookedRanges(initialBookedRanges);
  }, [initialBookedRanges]);

  // Real-time live availability polling: ensures calendar is always fresh
  useEffect(() => {
    let isMounted = true;

    const fetchAvailability = async () => {
      try {
        const res = await fetch(`/api/bookings/availability?villaId=${villa.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.bookedRanges && isMounted) {
          setBookedRanges(data.bookedRanges);
        }
      } catch (e) {
        // Silent fail on background fetch
      }
    };

    fetchAvailability();

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        fetchAvailability();
      }
    };

    window.addEventListener("visibilitychange", onVisible);
    const interval = setInterval(fetchAvailability, 15000);

    return () => {
      isMounted = false;
      window.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, [villa.id]);

  const pricingInput: VillaPricingInput = useMemo(
    () => ({
      pricePerNight: villa.price,
      priceWeekend: villa.priceWeekend,
      dailyRates: villa.dailyRates,
      customPrices: initialCustomPrices,
    }),
    [villa.price, villa.priceWeekend, villa.dailyRates, initialCustomPrices]
  );

  // Check if a specific day is booked
  const isDateBooked = (date: Date) => {
    const targetStr = format(date, "yyyy-MM-dd");
    return bookedRanges.some((range) => {
      let startStr = "";
      let endStr = "";

      if (typeof range.startDate === "string") {
        startStr = range.startDate.slice(0, 10);
      } else if (range.startDate instanceof Date) {
        startStr = format(range.startDate, "yyyy-MM-dd");
      }

      if (typeof range.endDate === "string") {
        endStr = range.endDate.slice(0, 10);
      } else if (range.endDate instanceof Date) {
        endStr = format(range.endDate, "yyyy-MM-dd");
      }

      // Stay night is strictly [start, end)
      return targetStr >= startStr && targetStr < endStr;
    });
  };

  const isDateDisabled = (date: Date) => {
    const today = startOfDay(new Date());
    const target = startOfDay(date);
    if (isBefore(target, today)) return true;
    return isDateBooked(target);
  };

  // Check if any date in (start, end) is booked
  const hasBookedBetween = (start: Date, end: Date) => {
    let curr = addDays(start, 1);
    while (isBefore(curr, end)) {
      if (isDateBooked(curr)) return true;
      curr = addDays(curr, 1);
    }
    return false;
  };

  // Check if entire range [start, end) overlaps with any booked dates
  const hasOverlapWithBooked = (start: Date, end: Date) => {
    if (isDateBooked(start)) return true;
    return hasBookedBetween(start, end);
  };

  // Intelligent date selection (allows check-out on the check-in date of another booking)
  const selectDate = (date: Date) => {
    const today = startOfDay(new Date());
    const target = startOfDay(date);
    if (isBefore(target, today)) return;

    if (!checkIn || (checkIn && checkOut)) {
      // First click: selecting checkIn
      if (isDateBooked(target)) return;
      setCheckIn(target);
      setCheckOut(null);
    } else {
      // Second click: setting checkOut
      if (isBefore(target, checkIn) || isSameDay(target, checkIn)) {
        // Clicked date is earlier or same as checkIn -> set as new checkIn
        if (isDateBooked(target)) return;
        setCheckIn(target);
        setCheckOut(null);
      } else {
        // Verify no booked dates in between [checkIn, target)
        if (hasOverlapWithBooked(checkIn, target)) {
          // Can't span over booked dates -> if target is not booked, set as new checkIn
          if (!isDateBooked(target)) {
            setCheckIn(target);
            setCheckOut(null);
          }
        } else {
          setCheckOut(target);
        }
      }
    }
  };

  // Compute breakdown when both checkIn and checkOut are valid
  const breakdown = useMemo(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      return null;
    }
    return calculateStayBreakdown(pricingInput, checkIn, checkOut);
  }, [pricingInput, checkIn, checkOut]);

  return (
    <VillaBookingContext.Provider
      value={{
        villa,
        checkIn,
        checkOut,
        setCheckIn,
        setCheckOut,
        guests,
        setGuests,
        customPrices: initialCustomPrices,
        bookedRanges,
        breakdown,
        isDateBooked,
        isDateDisabled,
        hasBookedBetween,
        hasOverlapWithBooked,
        selectDate,
      }}
    >
      {children}
    </VillaBookingContext.Provider>
  );
}

export function useVillaBooking() {
  const context = useContext(VillaBookingContext);
  if (!context) {
    throw new Error(
      "useVillaBooking must be used within a VillaBookingProvider"
    );
  }
  return context;
}
