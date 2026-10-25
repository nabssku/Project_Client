import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { hash } from "bcryptjs";
import { calculateStayBreakdown } from "@/lib/pricing";
import { generateBookingCode } from "@/lib/booking";
import { parseISO, startOfDay } from "date-fns";

const createBookingSchema = z.object({
  villaId: z.string().optional(),
  villaSlug: z.string().optional(),
  checkIn: z.string().min(10, "Tanggal check-in wajib diisi"),
  checkOut: z.string().min(10, "Tanggal check-out wajib diisi"),
  guestsCount: z.coerce.number().min(1, "Minimal 1 orang tamu"),
  guestName: z.string().min(2, "Nama tamu minimal 2 karakter"),
  guestEmail: z.string().email("Format email tidak valid"),
  guestPhone: z.string().min(9, "Nomor telepon minimal 9 digit"),
  guestCity: z.string().optional().nullable(),
  companionType: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  promoCode: z.string().optional().nullable(),
  paymentMethod: z.string().default("QRIS"),
  createAccount: z.boolean().default(false),
  password: z.string().optional().nullable(),
  // For Manager direct bookings
  directBookingStatus: z.enum(["PENDING", "CONFIRMED"]).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const villaId = searchParams.get("villaId");

    const where: any = {};

    // Role-based visibility
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "GUEST") {
      // Guests only see their own bookings
      where.OR = [
        { userId: session.user.id },
        { guestEmail: session.user.email?.toLowerCase() },
      ];
    } else {
      // ADMIN & MANAJER can filter
      if (status && status !== "ALL") {
        where.status = status;
      }
      if (villaId) {
        where.villaId = villaId;
      }
      if (search) {
        where.OR = [
          { code: { contains: search, mode: "insensitive" } },
          { guestName: { contains: search, mode: "insensitive" } },
          { guestEmail: { contains: search, mode: "insensitive" } },
          { guestPhone: { contains: search, mode: "insensitive" } },
          { villa: { name: { contains: search, mode: "insensitive" } } },
        ];
      }
    }

    const bookings = await prisma.bookings.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        villa: {
          select: {
            id: true,
            name: true,
            slug: true,
            location: true,
            images: true,
            pricePerNight: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json({ error: "Gagal memuat daftar reservasi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const validated = createBookingSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;
    const checkInDate = startOfDay(parseISO(data.checkIn));
    const checkOutDate = startOfDay(parseISO(data.checkOut));

    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        { error: "Tanggal check-out harus lebih besar dari tanggal check-in" },
        { status: 400 }
      );
    }

    // 0. Account Status Guard: Block Deactivated Users
    if (session?.user?.id) {
      const loggedUser = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { isActive: true },
      });
      if (loggedUser && !loggedUser.isActive) {
        return NextResponse.json(
          { error: "Akun Anda telah dinonaktifkan oleh administrator. Anda tidak dapat melakukan reservasi villa." },
          { status: 403 }
        );
      }
    }

    const userByEmail = await prisma.users.findUnique({
      where: { email: data.guestEmail.toLowerCase().trim() },
      select: { isActive: true },
    });
    if (userByEmail && !userByEmail.isActive) {
      return NextResponse.json(
        {
          error:
            "Alamat email ini terdaftar pada akun yang dinonaktifkan oleh administrator. Tidak dapat melakukan reservasi.",
        },
        { status: 403 }
      );
    }

    // 1. Fetch Villa
    const villa = await prisma.villas.findFirst({
      where: {
        OR: [
          ...(data.villaId ? [{ id: data.villaId }] : []),
          ...(data.villaSlug ? [{ slug: data.villaSlug }] : []),
        ],
      },
      include: {
        customPrices: true,
      },
    });

    if (!villa) {
      return NextResponse.json({ error: "Villa tidak ditemukan" }, { status: 404 });
    }

    // Validate guest capacity
    if (data.guestsCount > villa.capacity) {
      return NextResponse.json(
        { error: `Jumlah tamu melebihi kapasitas maksimal villa (${villa.capacity} orang)` },
        { status: 400 }
      );
    }

    // 2. Pricing Calculation using Dynamic Pricing Engine
    const stay = calculateStayBreakdown(villa, checkInDate, checkOutDate);
    let discountAmount = 0;
    let validPromoCode: string | null = null;

    if (data.promoCode && data.promoCode.trim()) {
      const promo = await prisma.promos.findFirst({
        where: {
          code: data.promoCode.trim().toUpperCase(),
          isActive: true,
          validFrom: { lte: new Date() },
          validUntil: { gte: new Date() },
        },
      });

      if (promo) {
        discountAmount = Math.round((stay.subtotal * promo.discountPercent) / 100);
        validPromoCode = promo.code;
      }
    }

    const totalPrice = Math.max(0, stay.subtotal - discountAmount);

    // 3. Handle Account Creation or User Association
    let userId: string | null = session?.user?.id || null;

    if (data.createAccount && !userId && data.password && data.password.length >= 8) {
      const existingUser = await prisma.users.findUnique({
        where: { email: data.guestEmail.toLowerCase().trim() },
      });

      if (!existingUser) {
        const passwordHash = await hash(data.password, 12);
        const newUser = await prisma.users.create({
          data: {
            name: data.guestName,
            email: data.guestEmail.toLowerCase().trim(),
            passwordHash,
            role: "GUEST",
            isActive: true,
          },
        });
        userId = newUser.id;
      } else {
        userId = existingUser.id;
      }
    }

    // 4. Determine Initial Status
    const isManagerOrAdmin =
      session?.user && (session.user.role === "MANAJER" || session.user.role === "ADMIN");

    let initialStatus: "PENDING" | "CONFIRMED" = "PENDING";
    if (isManagerOrAdmin && data.directBookingStatus) {
      initialStatus = data.directBookingStatus;
    }

    // 5. ATOMIC Collision Guard & Booking Creation inside Transaction
    const newBooking = await prisma.$transaction(async (tx) => {
      // Date Collision Guard (Interval Overlap Detection)
      const existingCollision = await tx.bookings.findFirst({
        where: {
          villaId: villa.id,
          status: { in: ["CONFIRMED", "CHECKED_IN", "PENDING"] },
          AND: [
            { checkIn: { lt: checkOutDate } },
            { checkOut: { gt: checkInDate } },
          ],
        },
      });

      if (existingCollision) {
        throw new Error("COLLISION_ERROR");
      }

      // Generate Unique Booking Code
      let bookingCode = generateBookingCode();
      let codeExists = await tx.bookings.findUnique({ where: { code: bookingCode } });
      while (codeExists) {
        bookingCode = generateBookingCode();
        codeExists = await tx.bookings.findUnique({ where: { code: bookingCode } });
      }

      // Save Booking to Database
      const created = await tx.bookings.create({
        data: {
          code: bookingCode,
          villaId: villa.id,
          guestName: data.guestName,
          guestPhone: data.guestPhone,
          guestEmail: data.guestEmail.toLowerCase().trim(),
          guestCity: data.guestCity || null,
          companionType: data.companionType || null,
          guestsCount: data.guestsCount,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          totalPrice,
          discountAmount,
          promoCode: validPromoCode,
          status: initialStatus,
          notes: data.notes || null,
          paymentMethod: data.paymentMethod || "QRIS",
          userId,
          assignedToId: isManagerOrAdmin ? session.user.id : null,
        },
        include: {
          villa: {
            select: {
              id: true,
              name: true,
              slug: true,
              location: true,
              images: true,
            },
          },
        },
      });

      // Audit Log
      await tx.activity_logs.create({
        data: {
          userId: userId || undefined,
          action: "CREATE_BOOKING",
          entity: "bookings",
          entityId: created.code,
          details: `Pemesanan baru ${created.code} untuk "${villa.name}" oleh ${created.guestName} (Rp ${totalPrice.toLocaleString("id-ID")})`,
        },
      });

      return created;
    });

    // Revalidate paths for instant freshness
    try {
      revalidatePath(`/villas/${villa.slug}`);
      revalidatePath("/dashboard/bookings");
    } catch (e) {
      console.warn("revalidatePath error:", e);
    }

    // Kirim email konfirmasi reservasi & PDF invoice secara asynchronous via Resend
    try {
      const siteConfig = await prisma.site_configs.findUnique({
        where: { key: "site_name" },
      });
      const siteName = siteConfig?.value || "Singgahsana";

      const { sendBookingConfirmationEmail } = await import("@/lib/email/resend");
      sendBookingConfirmationEmail({
        booking: {
          id: newBooking.id,
          code: newBooking.code,
          guestName: newBooking.guestName,
          guestEmail: newBooking.guestEmail,
          guestPhone: newBooking.guestPhone,
          guestCity: newBooking.guestCity,
          companionType: newBooking.companionType,
          checkIn: newBooking.checkIn,
          checkOut: newBooking.checkOut,
          guestsCount: newBooking.guestsCount,
          totalPrice: newBooking.totalPrice,
          discountAmount: newBooking.discountAmount,
          promoCode: newBooking.promoCode,
          status: newBooking.status,
          paymentMethod: newBooking.paymentMethod,
          notes: newBooking.notes,
          createdAt: newBooking.createdAt,
          villa: {
            name: villa.name,
            location: villa.location,
            checkInTime: villa.checkInTime,
            checkOutTime: villa.checkOutTime,
          },
        },
        siteName,
      }).catch((e) => console.error("Background Resend email error on booking create:", e));
    } catch (emailErr) {
      console.warn("Could not trigger booking creation email:", emailErr);
    }

    return NextResponse.json(
      {
        success: true,
        booking: newBooking,
        code: newBooking.code,
        message: "Pemesanan berhasil dibuat",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating booking:", error);
    if (error.message === "COLLISION_ERROR") {
      return NextResponse.json(
        {
          error:
            "Maaf, villa sudah dipesan untuk rentang tanggal tersebut oleh tamu lain. Silakan pilih tanggal lain pada kalender ketersediaan.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Gagal membuat reservasi booking" },
      { status: 500 }
    );
  }
}
