import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

/**
 * Normalizes phone number input in real-time for WhatsApp (62 format).
 * Automatically converts leading "08" (or "0") to "628" ("62") as the user types or pastes.
 */
export function formatWhatsAppInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("08")) {
    return "62" + digits.slice(1);
  }
  if (digits.startsWith("0") && digits.length > 1) {
    return "62" + digits.slice(1);
  }
  if (digits.startsWith("620")) {
    return "62" + digits.slice(3);
  }
  return digits;
}

/**
 * Ensures final phone number string is in clean 62... WhatsApp format on blur/submit.
 */
export function normalizeWhatsAppPhone(value: string): string {
  const digits = formatWhatsAppInput(value);
  if (!digits) return "";
  if (digits.startsWith("0")) {
    return "62" + digits.slice(1);
  }
  if (digits.startsWith("8")) {
    return "62" + digits;
  }
  return digits;
}

