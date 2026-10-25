import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-guard";
import { z } from "zod";

const updateTestimonialSchema = z.object({
  name: z.string().min(2, "Nama tamu minimal 2 karakter").optional(),
  avatar: z.string().optional().nullable(),
  content: z.string().min(5, "Ulasan minimal 5 karakter").optional(),
  villaId: z.string().optional().nullable(),
  rating: z.number().int().min(1).max(5).optional(),
  cleanlinessRating: z.number().int().min(1).max(5).optional(),
  serviceRating: z.number().int().min(1).max(5).optional(),
  facilityRating: z.number().int().min(1).max(5).optional(),
  isFeatured: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireApiPermission("cms:read");
    if (!authCheck.success) return authCheck.response;

    const { id } = await params;
    const testimonial = await prisma.testimonials.findUnique({
      where: { id },
      include: {
        villa: { select: { id: true, name: true, slug: true } },
        booking: { select: { id: true, code: true, guestName: true, status: true } },
      },
    });

    if (!testimonial) {
      return NextResponse.json({ error: "Testimoni tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, testimonial });
  } catch (error: any) {
    console.error("GET /api/cms/testimonials/[id] error:", error);
    return NextResponse.json({ error: "Gagal memuat testimoni" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireApiPermission("cms:update");
    if (!authCheck.success) return authCheck.response;

    const { id } = await params;
    const existing = await prisma.testimonials.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Testimoni tidak ditemukan" }, { status: 404 });
    }

    const body = await request.json();
    const validated = updateTestimonialSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;

    const updated = await prisma.testimonials.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.avatar !== undefined ? { avatar: data.avatar?.trim() || null } : {}),
        ...(data.content ? { content: data.content.trim() } : {}),
        ...(data.villaId !== undefined ? { villaId: data.villaId || null } : {}),
        ...(data.rating !== undefined ? { rating: data.rating } : {}),
        ...(data.cleanlinessRating !== undefined ? { cleanlinessRating: data.cleanlinessRating } : {}),
        ...(data.serviceRating !== undefined ? { serviceRating: data.serviceRating } : {}),
        ...(data.facilityRating !== undefined ? { facilityRating: data.facilityRating } : {}),
        ...(data.isFeatured !== undefined ? { isFeatured: data.isFeatured } : {}),
      },
      include: {
        villa: { select: { id: true, name: true, slug: true } },
        booking: { select: { id: true, code: true, guestName: true, status: true } },
      },
    });

    try {
      await prisma.activity_logs.create({
        data: {
          userId: authCheck.user.id,
          action: "UPDATE_TESTIMONIAL",
          entity: "testimonials",
          entityId: updated.id,
          details: `Memperbarui ulasan dari "${updated.name}"`,
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

    return NextResponse.json({
      success: true,
      testimonial: updated,
      message: "Testimoni berhasil diperbarui!",
    });
  } catch (error: any) {
    console.error("PUT /api/cms/testimonials/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui testimoni" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireApiPermission("cms:update");
    if (!authCheck.success) return authCheck.response;

    const { id } = await params;
    const existing = await prisma.testimonials.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Testimoni tidak ditemukan" }, { status: 404 });
    }

    await prisma.testimonials.delete({ where: { id } });

    try {
      await prisma.activity_logs.create({
        data: {
          userId: authCheck.user.id,
          action: "DELETE_TESTIMONIAL",
          entity: "testimonials",
          entityId: id,
          details: `Menghapus ulasan dari "${existing.name}"`,
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

    return NextResponse.json({
      success: true,
      message: "Testimoni berhasil dihapus!",
    });
  } catch (error: any) {
    console.error("DELETE /api/cms/testimonials/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus testimoni" },
      { status: 500 }
    );
  }
}
