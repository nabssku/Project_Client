import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth-guard";
import { uploadBufferToR2, generateKey } from "@/lib/r2";
import sharp from "sharp";

export async function POST(request: Request) {
  try {
    const authCms = await requireApiPermission("cms:update");
    if (!authCms.success) {
      const authSettings = await requireApiPermission("settings:update");
      if (!authSettings.success) {
        return authCms.response;
      }
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File gambar tidak ditemukan" }, { status: 400 });
    }

    // Validate mime type
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/svg+xml",
    ];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Harap gunakan format JPG, PNG, WebP, atau SVG." },
        { status: 400 }
      );
    }

    // Limit size to 15MB
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ukuran file terlalu besar. Maksimal 15 MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const inputBuffer = Buffer.from(bytes);
    const folder = (formData.get("folder") as string) || "cms";

    let processedBuffer: Buffer;
    let contentType: string;
    let key: string;

    if (file.type === "image/svg+xml") {
      // SVG vector preservation
      processedBuffer = inputBuffer;
      contentType = "image/svg+xml";
      const timestamp = Date.now();
      const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/\.[^/.]+$/, "");
      key = `${folder}/${timestamp}-${sanitized}.svg`;
    } else {
      // Optimize image with sharp (high quality WebP, preserve alpha/transparency)
      processedBuffer = await sharp(inputBuffer)
        .rotate()
        .resize({
          width: 2560,
          withoutEnlargement: true,
          fit: "inside",
        })
        .webp({ quality: 85 })
        .toBuffer();
      contentType = "image/webp";
      key = generateKey(folder, file.name);
    }

    // Upload to Cloudflare R2 / Local Storage
    const publicUrl = await uploadBufferToR2(processedBuffer, key, contentType);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      key,
    });
  } catch (error: any) {
    console.error("Upload CMS image error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengunggah gambar" },
      { status: 500 }
    );
  }
}
