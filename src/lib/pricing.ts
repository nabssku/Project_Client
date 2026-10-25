import { eachDayOfInterval, format, isFriday, isSaturday, parseISO, startOfDay } from "date-fns";
import { id as localeId } from "date-fns/locale";

export interface CustomPriceRange {
  startDate: Date | string;
  endDate: Date | string;
  price: number;
  reason?: string | null;
}

export interface VillaPricingInput {
  pricePerNight: number;
  priceWeekend?: number | null;
  customPrices?: CustomPriceRange[];
}

export interface DailyPriceDetail {
  date: string; // YYYY-MM-DD
  dayName: string; // e.g. "Rabu, 28 Okt"
  price: number;
  type: "REGULAR" | "WEEKEND" | "HOLIDAY";
  label: string;
}

export interface StayBreakdown {
  nights: number;
  subtotal: number;
  averagePerNight: number;
  breakdown: DailyPriceDetail[];
}

/**
 * Returns the exact nightly price for a specific date given villa base, weekend, and custom holiday prices.
 */
export function getDailyPrice(
  villa: VillaPricingInput,
  dateInput: Date | string
): DailyPriceDetail {
  const targetDate = startOfDay(typeof dateInput === "string" ? parseISO(dateInput) : dateInput);
  const dateStr = format(targetDate, "yyyy-MM-dd");
  const dayName = format(targetDate, "EEEE, d MMM", { locale: localeId });

  // 1. Check custom prices (Holidays / High Season / Peak Season overrides)
  if (villa.customPrices && villa.customPrices.length > 0) {
    for (const cp of villa.customPrices) {
      const start = startOfDay(typeof cp.startDate === "string" ? parseISO(cp.startDate) : cp.startDate);
      const end = startOfDay(typeof cp.endDate === "string" ? parseISO(cp.endDate) : cp.endDate);

      if (targetDate >= start && targetDate <= end) {
        return {
          date: dateStr,
          dayName,
          price: cp.price,
          type: "HOLIDAY",
          label: cp.reason || "Hari Libur / Peak Season",
        };
      }
    }
  }

  // 2. Check weekend rate (Friday night & Saturday night)
  if (isFriday(targetDate) || isSaturday(targetDate)) {
    if (villa.priceWeekend && villa.priceWeekend > 0) {
      return {
        date: dateStr,
        dayName,
        price: villa.priceWeekend,
        type: "WEEKEND",
        label: "Akhir Pekan (Weekend)",
      };
    }
  }

  // 3. Fallback to regular weekday rate
  return {
    date: dateStr,
    dayName,
    price: villa.pricePerNight,
    type: "REGULAR",
    label: "Reguler (Weekday)",
  };
}

/**
 * Calculates itemized stay prices per night between checkIn and checkOut.
 * Note: checkOut date is morning/afternoon departure, so the night of departure is not charged.
 */
export function calculateStayBreakdown(
  villa: VillaPricingInput,
  checkInInput: Date | string,
  checkOutInput: Date | string
): StayBreakdown {
  const checkIn = startOfDay(typeof checkInInput === "string" ? parseISO(checkInInput) : checkInInput);
  const checkOut = startOfDay(typeof checkOutInput === "string" ? parseISO(checkOutInput) : checkOutInput);

  if (checkOut <= checkIn) {
    return {
      nights: 0,
      subtotal: 0,
      averagePerNight: villa.pricePerNight,
      breakdown: [],
    };
  }

  // Night dates: from checkIn up to day before checkOut
  const dayBeforeCheckOut = new Date(checkOut.getTime() - 24 * 60 * 60 * 1000);
  const nightsList = eachDayOfInterval({ start: checkIn, end: dayBeforeCheckOut });

  const breakdown: DailyPriceDetail[] = nightsList.map((d) => getDailyPrice(villa, d));
  const subtotal = breakdown.reduce((acc, curr) => acc + curr.price, 0);
  const nights = breakdown.length;
  const averagePerNight = nights > 0 ? Math.round(subtotal / nights) : villa.pricePerNight;

  return {
    nights,
    subtotal,
    averagePerNight,
    breakdown,
  };
}

/**
 * Compact Indonesian currency formatting for calendar badges.
 * e.g. 1500000 -> "1,5 jt", 2000000 -> "2 jt", 850000 -> "850 rb"
 */
export function formatCompactPrice(price: number): string {
  if (price >= 1_000_000) {
    const inJt = price / 1_000_000;
    // Format up to 1 decimal place without trailing zero
    const formatted = inJt % 1 === 0 ? inJt.toFixed(0) : inJt.toFixed(1).replace(".", ",");
    return `${formatted} jt`;
  }
  if (price >= 1_000) {
    return `${Math.round(price / 1_000)} rb`;
  }
  return String(price);
}

/**
 * Standard IDR formatter e.g. "Rp 1.500.000"
 */
export function formatIDR(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}
