import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { BookingFlowClient } from "@/components/public/booking-flow-client";
import { addDays, format, isValid, parseISO } from "date-fns";

export const instant = false;

interface BookingPageProps {
  searchParams: Promise<{
    property?: string;
    villa?: string;
    slug?: string;
    check_in?: string;
    check_out?: string;
    guests?: string;
  }>;
}

export default async function BookingPage({ searchParams }: BookingPageProps) {
  await connection();
  const params = await searchParams;
  const session = await auth();

  const villaSlugOrId = params.property || params.villa || params.slug;

  if (!villaSlugOrId) {
    redirect("/villas");
  }

  // Fetch villa with custom holiday prices and active addons
  const villa = await prisma.villas.findFirst({
    where: {
      OR: [{ slug: villaSlugOrId }, { id: villaSlugOrId }],
    },
    include: {
      customPrices: {
        orderBy: { startDate: "asc" },
      },
      addons: {
        where: { isActive: true },
        orderBy: { price: "asc" },
      },
    },
  });

  if (!villa) {
    notFound();
  }

  // Compute default or provided dates
  const today = new Date();
  let checkIn = params.check_in || "";
  let checkOut = params.check_out || "";

  if (!checkIn || !isValid(parseISO(checkIn))) {
    checkIn = format(addDays(today, 1), "yyyy-MM-dd");
  }
  if (!checkOut || !isValid(parseISO(checkOut))) {
    checkOut = format(addDays(parseISO(checkIn), 1), "yyyy-MM-dd");
  }

  const guests = parseInt(params.guests || "2", 10) || 2;

  let siteName = "Singgahsana";
  try {
    const config = await prisma.site_configs.findUnique({
      where: { key: "site_name" },
    });
    if (config?.value) siteName = config.value;
  } catch (err) {
    console.warn("Failed to load site_name in booking page:", err);
  }

  return (
    <BookingFlowClient
      siteName={siteName}
      villa={{
        id: villa.id,
        slug: villa.slug,
        name: villa.name,
        location: villa.location,
        pricePerNight: villa.pricePerNight,
        priceWeekend: villa.priceWeekend,
        capacity: villa.capacity,
        images: villa.images,
        checkInTime: villa.checkInTime,
        checkOutTime: villa.checkOutTime,
        customPrices: villa.customPrices.map((cp) => ({
          startDate: cp.startDate.toISOString(),
          endDate: cp.endDate.toISOString(),
          price: cp.price,
          reason: cp.reason,
        })),
        addons: villa.addons.map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          price: a.price,
          maxQty: a.maxQty,
          unit: a.unit,
        })),
      }}
      initialCheckIn={checkIn}
      initialCheckOut={checkOut}
      initialGuests={Math.min(villa.capacity, Math.max(1, guests))}
      currentUser={
        session?.user
          ? {
              id: session.user.id,
              name: session.user.name,
              email: session.user.email,
            }
          : null
      }
    />
  );
}
