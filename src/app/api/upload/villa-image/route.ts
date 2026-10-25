import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyCenterWatermark } from "@/lib/watermark";
import { uploadBufferToR2, generateKey } from "@/lib/r2";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Hanya role ADMIN yang dapat mengunggah foto villa" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    // Validate mime type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Harap gunakan JPG, PNG, atau WebP." },
        { status: 400 }
      );
    }

    // Limit size to 15MB
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ukuran file terlalu besar. Maksimum 15 MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const inputBuffer = Buffer.from(bytes);

    // Read watermark text from database (check 'watermark_text' first, then 'site_name')
    let watermarkText = "singgahsana";
    try {
      const configs = await prisma.site_configs.findMany({
        where: {
          key: { in: ["watermark_text", "site_name"] },
        },
      });
      const customWm = configs.find((c) => c.key === "watermark_text")?.value;
      const siteName = configs.find((c) => c.key === "site_name")?.value;
      watermarkText = customWm || siteName || "singgahsana";
    } catch (e) {
      console.error("Failed to load watermark text from DB:", e);
    }

    // Apply center watermark and convert to WebP
    const { buffer: processedBuffer, width, height } = await applyCenterWatermark(inputBuffer, {
      text: watermarkText,
      opacity: 0.32,
    });

    // Upload to Cloudflare R2
    const key = generateKey("villas", file.name);
    const publicUrl = await uploadBufferToR2(processedBuffer, key, "image/webp");

    return NextResponse.json({
      success: true,
      url: publicUrl,
      key,
      width,
      height,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memproses dan mengunggah gambar" },
      { status: 500 }
    );
  }
}
