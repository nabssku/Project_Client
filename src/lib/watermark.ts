import sharp from "sharp";

// Configure sharp for constrained environments (e.g. Hostinger, VPS, Docker):
// 1. Limit concurrency to 1 thread to prevent "Resource temporarily unavailable (os error 11)" on 64-core host servers
// 2. Disable cache to prevent high RAM consumption and OOM crashes
try {
  sharp.concurrency(1);
  sharp.cache(false);
} catch (e) {
  console.warn("Could not set sharp concurrency:", e);
}

export interface WatermarkOptions {
  text?: string;
  opacity?: number;
  logoBuffer?: Buffer;
}

/**
 * Generates a clean, universal SVG text watermark.
 * Avoids any proprietary OS fonts (such as Georgia or -apple-system) to prevent
 * missing-glyph "tofu" boxes (▯▯▯) on Linux servers (e.g. Hostinger, Docker).
 */
export function createWatermarkSvg(
  width: number,
  height: number,
  text: string = "VILLA",
  opacity: number = 0.42
): Buffer {
  const clean = (text || "VILLA").trim();
  // Format with elegant letter spacing for single words, or preserve multi-word phrasing
  const formatted = clean.includes(" ")
    ? clean.toUpperCase()
    : clean.toUpperCase().split("").join(" ");

  // Target watermark width is ~38% of image width (bounded between 260px and 720px)
  const watermarkWidth = Math.min(Math.max(Math.round(width * 0.38), 260), 720);
  const watermarkHeight = Math.round(watermarkWidth * 0.22);

  // Dynamic font sizing to prevent overflowing on long text
  const baseSize = Math.round(watermarkWidth * 0.08);
  const maxChars = Math.floor(watermarkWidth / (baseSize * 0.8));
  const fontSize =
    formatted.length > maxChars
      ? Math.max(Math.round(watermarkWidth / (formatted.length * 0.85)), 12)
      : baseSize;

  return Buffer.from(`
    <svg width="${watermarkWidth}" height="${watermarkHeight}" viewBox="0 0 ${watermarkWidth} ${watermarkHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="wm-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="5" flood-color="#000000" flood-opacity="0.85"/>
        </filter>
      </defs>
      <text 
        x="${watermarkWidth / 2}" 
        y="${watermarkHeight / 2}" 
        text-anchor="middle" 
        dominant-baseline="central"
        font-family="DejaVu Sans, FreeSans, Liberation Sans, Arial, Helvetica, sans-serif" 
        font-weight="bold" 
        font-size="${fontSize}" 
        letter-spacing="6" 
        fill="#ffffff" 
        opacity="${opacity}"
        filter="url(#wm-shadow)"
      >${formatted}</text>
    </svg>
  `);
}

/**
 * Applies a centered semi-transparent watermark to an image buffer
 * and optimizes the output to WebP format.
 */
export async function applyCenterWatermark(
  imageBuffer: Buffer,
  options?: WatermarkOptions
): Promise<{ buffer: Buffer; width: number; height: number; format: string }> {
  try {
    const image = sharp(imageBuffer, { failOn: "none" });
    const metadata = await image.metadata();

    const originalWidth = metadata.width || 1200;
    const originalHeight = metadata.height || 800;

    // Resize if too large (max 1920px wide/tall) to keep optimal quality & speed
    let pipeline = image.rotate();
    if (originalWidth > 1920 || originalHeight > 1920) {
      pipeline = pipeline.resize({
        width: originalWidth > originalHeight ? 1920 : undefined,
        height: originalHeight >= originalWidth ? 1920 : undefined,
        withoutEnlargement: true,
      });
    }

    const effectiveWidth = Math.min(originalWidth, 1920);
    const effectiveHeight = Math.min(originalHeight, 1920);
    const opacity = options?.opacity ?? 0.42;

    let watermarkInput: Buffer;

    if (options?.logoBuffer) {
      try {
        const logoSharp = sharp(options.logoBuffer, { failOn: "none" });
        const logoMeta = await logoSharp.metadata();
        const targetWidth = Math.min(Math.round(effectiveWidth * 0.32), 420);
        const targetHeight = Math.round(
          ((logoMeta.height || 1) * targetWidth) / (logoMeta.width || 1)
        );

        watermarkInput = await logoSharp
          .resize(targetWidth, targetHeight)
          .composite([
            {
              input: Buffer.from([0, 0, 0, Math.round(255 * opacity)]),
              raw: { width: 1, height: 1, channels: 4 },
              tile: true,
              blend: "dest-in",
            },
          ])
          .png()
          .toBuffer();
      } catch (logoErr) {
        console.warn("Could not process logoBuffer, falling back to text SVG:", logoErr);
        watermarkInput = createWatermarkSvg(
          effectiveWidth,
          effectiveHeight,
          options?.text || "Villa",
          opacity
        );
      }
    } else {
      watermarkInput = createWatermarkSvg(
        effectiveWidth,
        effectiveHeight,
        options?.text || "Villa",
        opacity
      );
    }

    // Composite watermark in the center
    const outputBuffer = await pipeline
      .composite([
        {
          input: watermarkInput,
          gravity: "center",
        },
      ])
      .webp({ quality: 85 })
      .toBuffer();

    return {
      buffer: outputBuffer,
      width: effectiveWidth,
      height: effectiveHeight,
      format: "webp",
    };
  } catch (error) {
    console.error("Watermarking error in sharp, attempting safe WebP conversion:", error);
    try {
      // Safe fallback: simple conversion to WebP without watermark composite
      const safeBuffer = await sharp(imageBuffer, { failOn: "none" })
        .rotate()
        .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
      return {
        buffer: safeBuffer,
        width: 1200,
        height: 800,
        format: "webp",
      };
    } catch {
      // Ultimate fallback: return original buffer to prevent 500/503 crash
      return {
        buffer: imageBuffer,
        width: 1200,
        height: 800,
        format: "jpeg",
      };
    }
  }
}
