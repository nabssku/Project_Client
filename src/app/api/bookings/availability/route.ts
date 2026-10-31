import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format, startOfDay } from "date-fns";
import { autoCancelExpiredBookings } from "@/lib/booking-expiration";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const villaParam = searchParams.get("villa") || searchParams.get("slug") || searchParams.get("villaId");

    if (!villaParam) {
      return NextResponse.json(
        { error: "Parameter villa/slug wajib disertakan" },
        { status: 400 }
      );
    }

    const villa = await prisma.villas.findFirst({
      where: {
        OR: [{ id: villaParam }, { slug: villaParam }],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        pricePerNight: true,
        priceWeekend: true,
        dailyRates: true,
        capacity: true,
        checkInTime: true,
        checkOutTime: true,
        customPrices: {
          orderBy: { startDate: "asc" },
        },
      },
    });

    if (!villa) {
      return NextResponse.json({ error: "Villa tidak ditemukan" }, { status: 404 });
    }

    // Auto-cancel any pending bookings whose check-in deadline has expired
    await autoCancelExpiredBookings();

    // Fetch active bookings starting from today onwards (or recent)
    const today = startOfDay(new Date());

    const activeBookings = await prisma.bookings.findMany({
      where: {
        villaId: villa.id,
        status: { in: ["CONFIRMED", "CHECKED_IN", "PENDING", "DP_50"] },
        checkOut: { gte: today },
      },
      select: {
        id: true,
        code: true,
        checkIn: true,
        checkOut: true,
        status: true,
      },
      orderBy: { checkIn: "asc" },
    });

    const bookedRanges = activeBookings.map((b) => ({
      startDate: format(new Date(b.checkIn), "yyyy-MM-dd"),
      endDate: format(new Date(b.checkOut), "yyyy-MM-dd"),
      start: format(new Date(b.checkIn), "yyyy-MM-dd"),
      end: format(new Date(b.checkOut), "yyyy-MM-dd"),
      status: b.status,
    }));

    return NextResponse.json({
      success: true,
      villa: {
        id: villa.id,
        name: villa.name,
        slug: villa.slug,
        pricePerNight: villa.pricePerNight,
        priceWeekend: villa.priceWeekend,
        dailyRates: (villa as any).dailyRates,
        capacity: villa.capacity,
        checkInTime: villa.checkInTime || "14:00",
        checkOutTime: villa.checkOutTime || "12:00",
        customPrices: villa.customPrices.map((cp) => ({
          id: cp.id,
          startDate: format(new Date(cp.startDate), "yyyy-MM-dd"),
          endDate: format(new Date(cp.endDate), "yyyy-MM-dd"),
          price: cp.price,
          reason: cp.reason,
        })),
      },
      bookedRanges,
    });
  } catch (error: any) {
    if (error?.digest === "NEXT_PRERENDER_INTERRUPTED" || error?.message?.includes("bail out of prerendering")) {
      throw error;
    }
    console.error("Error fetching villa availability:", error);
    return NextResponse.json(
      { error: "Gagal memuat ketersediaan villa" },
      { status: 500 }
    );
  }
}
