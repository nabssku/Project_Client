import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const villaSchema = z.object({
  name: z.string().min(2, "Nama villa minimal 2 karakter"),
  slug: z.string().min(2, "Slug minimal 2 karakter"),
  description: z.string().min(10, "Deskripsi minimal 10 karakter"),
  pricePerNight: z.coerce.number().min(0, "Harga sewa tidak boleh negatif"),
  capacity: z.coerce.number().min(1, "Kapasitas minimal 1 orang"),
  bedrooms: z.coerce.number().min(1, "Kamar tidur minimal 1"),
  bathrooms: z.coerce.number().min(1, "Kamar mandi minimal 1"),
  location: z.string().min(2, "Lokasi minimal 2 karakter"),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string()).min(1, "Harap unggah minimal 1 foto villa"),
  rules: z.array(z.string()).default([]),
  checkInTime: z.string().default("14:00"),
  checkOutTime: z.string().default("12:00"),
  mapEmbed: z.string().optional().nullable(),
  isFeatured: z.boolean().default(false),
  status: z.enum(["AVAILABLE", "CLEANING", "MAINTENANCE", "UNAVAILABLE"]).default("AVAILABLE"),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get("featured");
    const status = searchParams.get("status");

    const where: any = {};

    if (featured === "true") {
      where.isFeatured = true;
    }

    if (status) {
      where.status = status;
    }

    const villas = await prisma.villas.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        pricePerNight: true,
        capacity: true,
        bedrooms: true,
        bathrooms: true,
        location: true,
        amenities: true,
        images: true,
        isFeatured: true,
        status: true,
      },
    });

    return NextResponse.json(villas);
  } catch (error) {
    console.error("Error fetching villas:", error);
    return NextResponse.json(
      { error: "Failed to fetch villas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Hanya role ADMIN yang diizinkan menambah unit villa" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = villaSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Check slug uniqueness
    const existingSlug = await prisma.villas.findUnique({
      where: { slug: data.slug },
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: `Slug "${data.slug}" sudah digunakan oleh villa lain` },
        { status: 400 }
      );
    }

    const newVilla = await prisma.villas.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        pricePerNight: data.pricePerNight,
        capacity: data.capacity,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        location: data.location,
        amenities: data.amenities,
        images: data.images,
        rules: data.rules,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        mapEmbed: data.mapEmbed,
        isFeatured: data.isFeatured,
        status: data.status,
      },
    });

    // Audit log
    await prisma.activity_logs.create({
      data: {
        userId: session.user.id,
        action: "CREATE_VILLA",
        entity: "villas",
        entityId: newVilla.id,
        details: `Menambahkan unit villa baru "${newVilla.name}" (${newVilla.slug})`,
      },
    });

    return NextResponse.json(newVilla, { status: 201 });
  } catch (error: any) {
    console.error("Error creating villa:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat data villa baru" },
      { status: 500 }
    );
  }
}
