import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const guestReviewSchema = z.object({
  bookingCode: z.string().min(3, "Kode booking tidak valid"),
  rating: z.number().int().min(1).max(5),
  cleanlinessRating: z.number().int().min(1).max(5).default(5),
  serviceRating: z.number().int().min(1).max(5).default(5),
  facilityRating: z.number().int().min(1).max(5).default(5),
  content: z.string().min(5, "Ulasan minimal 5 karakter"),
  name: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = guestReviewSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      bookingCode,
      rating,
      cleanlinessRating,
      serviceRating,
      facilityRating,
      content,
      name,
    } = validated.data;

    // Look up booking with villa
    const booking = await prisma.bookings.findFirst({
      where: {
        code: {
          equals: bookingCode.trim(),
          mode: "insensitive",
        },
      },
      include: {
        villa: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        testimonial: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Data reservasi tidak ditemukan." },
        { status: 404 }
      );
    }

    // Ensure stay has been completed or checked in
    if (booking.status !== "COMPLETED" && booking.status !== "CHECKED_IN") {
      return NextResponse.json(
        {
          error:
            "Ulasan hanya dapat dikirimkan setelah Anda melakukan check-in dan menyelesaikan masa menginap.",
        },
        { status: 400 }
      );
    }

    // Check if review already submitted for this booking
    if (booking.testimonial) {
      return NextResponse.json(
        {
          error: "Anda sudah pernah mengirimkan ulasan untuk reservasi ini. Terima kasih atas partisipasi Anda!",
        },
        { status: 400 }
      );
    }

    // Create testimonial linked to villa and booking
    const reviewerName = name?.trim() || booking.guestName;
    const testimonial = await prisma.testimonials.create({
      data: {
        name: reviewerName,
        content: content.trim(),
        rating,
        cleanlinessRating,
        serviceRating,
        facilityRating,
        villaId: booking.villaId,
        bookingId: booking.id,
        isFeatured: false,
      },
      include: {
        villa: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    try {
      revalidatePath(`/booking/${booking.code}`);
      if (booking.villa?.slug) {
        revalidatePath(`/villas/${booking.villa.slug}`);
      }
      revalidatePath("/");
    } catch (e) {
      console.warn("Revalidate error:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Terima kasih! Ulasan dan penilaian Anda telah berhasil dikirimkan.",
      testimonial,
    });
  } catch (error: any) {
    console.error("POST /api/public/testimonials error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengirimkan ulasan" },
      { status: 500 }
    );
  }
}
