import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth-guard";
import { uploadBufferToR2, generateKey } from "@/lib/r2";
import sharp from "sharp";

export async function POST(request: Request) {
  try {
    const authCheck = await requireApiPermission("cms:update");
    if (!authCheck.success) return authCheck.response;

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
    ];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Harap gunakan format JPG, PNG, atau WebP." },
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

    // Optimize image with sharp (high quality WebP, max width 2560px for crystal-clear hero backgrounds)
    const processedBuffer = await sharp(inputBuffer)
      .rotate()
      .resize({
        width: 2560,
        withoutEnlargement: true,
        fit: "inside",
      })
      .webp({ quality: 85 })
      .toBuffer();

    const folder = (formData.get("folder") as string) || "cms";
    // Upload to Cloudflare R2 / Local Storage
    const key = generateKey(folder, file.name);
    const publicUrl = await uploadBufferToR2(processedBuffer, key, "image/webp");

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
