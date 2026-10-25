import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-guard";
import { z } from "zod";

const testimonialSchema = z.object({
  name: z.string().min(2, "Nama tamu minimal 2 karakter"),
  avatar: z.string().optional().nullable(),
  content: z.string().min(5, "Ulasan minimal 5 karakter"),
  villaId: z.string().optional().nullable(),
  rating: z.number().int().min(1).max(5).default(5),
  cleanlinessRating: z.number().int().min(1).max(5).optional().default(5),
  serviceRating: z.number().int().min(1).max(5).optional().default(5),
  facilityRating: z.number().int().min(1).max(5).optional().default(5),
  isFeatured: z.boolean().default(false),
});

export async function GET(request: Request) {
  try {
    const authCheck = await requireApiPermission("cms:read");
    if (!authCheck.success) return authCheck.response;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    if (featured === "true") {
      where.isFeatured = true;
    } else if (featured === "false") {
      where.isFeatured = false;
    }

    const testimonials = await prisma.testimonials.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        villa: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        booking: {
          select: {
            id: true,
            code: true,
            guestName: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      testimonials,
    });
  } catch (error: any) {
    console.error("GET /api/cms/testimonials error:", error);
    return NextResponse.json(
      { error: "Gagal memuat testimoni tamu" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authCheck = await requireApiPermission("cms:update");
    if (!authCheck.success) return authCheck.response;

    const body = await request.json();
    const validated = testimonialSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;

    const newTestimonial = await prisma.testimonials.create({
      data: {
        name: data.name.trim(),
        avatar: data.avatar?.trim() || null,
        content: data.content.trim(),
        villaId: data.villaId || null,
        rating: data.rating,
        cleanlinessRating: data.cleanlinessRating,
        serviceRating: data.serviceRating,
        facilityRating: data.facilityRating,
        isFeatured: data.isFeatured,
      },
      include: {
        villa: {
          select: { id: true, name: true, slug: true },
        },
        booking: {
          select: { id: true, code: true },
        },
      },
    });

    try {
      await prisma.activity_logs.create({
        data: {
          userId: authCheck.user.id,
          action: "CREATE_TESTIMONIAL",
          entity: "testimonials",
          entityId: newTestimonial.id,
          details: `Menambahkan testimoni baru dari "${newTestimonial.name}" (Rating ${newTestimonial.rating}/5)`,
        },
      });
    } catch (e) {
      console.warn("Log error:", e);
    }

    try {
      revalidatePath("/", "page");
    } catch (e) {
      console.warn("Revalidate error:", e);
    }

    return NextResponse.json(
      {
        success: true,
        testimonial: newTestimonial,
        message: "Testimoni tamu berhasil ditambahkan!",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/cms/testimonials error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat testimoni" },
      { status: 500 }
    );
  }
}
