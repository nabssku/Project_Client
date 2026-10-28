import { prisma } from "@/lib/prisma";

/**
 * Calculates the exact check-in deadline for a booking in Western Indonesia Time (WIB / Asia/Jakarta).
 * Directly uses the villa's check-in time (`checkInTime`) from the database (e.g. "15:00", "13:00", etc.).
 * Defaults to "14:00" only as a safety fallback if checkInTime is empty/null.
 */
export function getBookingCheckInDeadline(
  checkIn: Date | string,
  checkInTime?: string | null
): Date {
  const d = typeof checkIn === "string" ? new Date(checkIn) : checkIn;

  // Format date in Asia/Jakarta timezone as YYYY-MM-DD
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dateStr = formatter.format(d);

  // Normalize check-in time from database (e.g. "15:00" -> "15:00:00")
  const rawTime = (checkInTime || "14:00").trim();
  const timeFormatted = rawTime.includes(":")
    ? rawTime.length === 5
      ? `${rawTime}:00`
      : rawTime
    : "14:00:00";

  return new Date(`${dateStr}T${timeFormatted}+07:00`);
}

/**
 * Checks whether a booking has expired based on current time.
 * Compares against the villa's checkInTime from the database.
 */
export function isBookingExpired(
  checkIn: Date | string,
  checkInTime?: string | null,
  now: Date = new Date()
): boolean {
  const deadline = getBookingCheckInDeadline(checkIn, checkInTime);
  return now.getTime() >= deadline.getTime();
}

/**
 * Formats the check-in deadline into a human-friendly string in Indonesian.
 * Directly reflects the villa's check-in time from the database.
 * Example: "Jumat, 30 Oktober 2026 pukul 15:00 WIB"
 */
export function formatBookingDeadline(
  checkIn: Date | string,
  checkInTime?: string | null
): string {
  const deadline = getBookingCheckInDeadline(checkIn, checkInTime);

  const formatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${formatter.format(deadline)} WIB`;
}

/**
 * Automatically cancels all PENDING bookings that have passed their check-in deadline.
 * Releases blocked dates and updates status to CANCELLED with an informative reason.
 * Returns the count of bookings cancelled.
 */
export async function autoCancelExpiredBookings(): Promise<number> {
  try {
    const now = new Date();

    // Query pending bookings where checkIn date is up to now + 1 day to be comprehensive
    const pendingBookings = await prisma.bookings.findMany({
      where: {
        status: "PENDING",
      },
      select: {
        id: true,
        code: true,
        checkIn: true,
        paymentProofUrl: true,
        villa: {
          select: {
            checkInTime: true,
          },
        },
      },
    });

    const expiredIds: string[] = [];
    for (const b of pendingBookings) {
      if (isBookingExpired(b.checkIn, b.villa?.checkInTime, now)) {
        expiredIds.push(b.id);
      }
    }

    if (expiredIds.length > 0) {
      await prisma.bookings.updateMany({
        where: { id: { in: expiredIds } },
        data: {
          status: "CANCELLED",
          rejectionReason:
            "Dibatalkan otomatis oleh sistem: Batas waktu pembayaran telah kedaluwarsa karena telah melewati jadwal check-in.",
        },
      });
      return expiredIds.length;
    }

    return 0;
  } catch (error) {
    console.error("Failed to auto-cancel expired bookings:", error);
    return 0;
  }
}
