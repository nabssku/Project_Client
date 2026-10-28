import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

// MIME type lookup
const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  mp4: "video/mp4",
  webm: "video/webm",
};

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;

    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json({ error: "File path is required" }, { status: 400 });
    }

    // Decode and construct key
    const rawKey = pathSegments.map((segment) => decodeURIComponent(segment)).join("/");
    // Security check: prevent directory traversal
    const normalizedKey = path.normalize(rawKey).replace(/^(\.\.(\/|\\|$))+/, "");
    if (!normalizedKey || normalizedKey.includes("..")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const ext = normalizedKey.split(".").pop()?.toLowerCase() || "";
    const fallbackMime = MIME_TYPES[ext] || "application/octet-stream";

    const isR2Configured = Boolean(
      process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME
    );

    // 1. Try to fetch from Cloudflare R2
    if (isR2Configured) {
      try {
        const client = getR2Client();
        const command = new GetObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: normalizedKey,
        });

        const r2Res = await client.send(command);

        if (r2Res.Body) {
          const contentType = r2Res.ContentType || fallbackMime;
          const stream = r2Res.Body.transformToWebStream();

          const headers: Record<string, string> = {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
            "Content-Disposition": "inline",
          };

          if (r2Res.ContentLength) {
            headers["Content-Length"] = r2Res.ContentLength.toString();
          }
          if (r2Res.ETag) {
            headers["ETag"] = r2Res.ETag;
          }
          if (r2Res.LastModified) {
            headers["Last-Modified"] = r2Res.LastModified.toUTCString();
          }

          return new Response(stream, {
            status: 200,
            headers,
          });
        }
      } catch (r2Error: any) {
        // If not found or R2 error, proceed to fallback
        if (r2Error?.name !== "NoSuchKey" && r2Error?.$metadata?.httpStatusCode !== 404) {
          console.warn(`[Media Route] R2 fetch error for ${normalizedKey}:`, r2Error.message);
        }
      }
    }

    // 2. Fallback: local public/uploads directory
    const localFilePath = path.join(process.cwd(), "public", "uploads", normalizedKey);
    if (fs.existsSync(localFilePath)) {
      const stat = fs.statSync(localFilePath);
      const fileBuffer = fs.readFileSync(localFilePath);

      return new Response(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": fallbackMime,
          "Content-Length": stat.size.toString(),
          "Cache-Control": "public, max-age=86400",
          "Content-Disposition": "inline",
        },
      });
    }

    return NextResponse.json({ error: "Media file not found" }, { status: 404 });
  } catch (error: any) {
    console.error("[Media Route] Internal server error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve media file" },
      { status: 500 }
    );
  }
}
