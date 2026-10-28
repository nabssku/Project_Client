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

interface WatermarkOptions {
  text?: string;
  opacity?: number;
}

/**
 * Generates an SVG watermark buffer scaled to the image width.
 */
function createWatermarkSvg(width: number, height: number, text: string = "Villa", opacity: number = 0.3) {
  // Target watermark width is ~35% of image width (bounded between 240px and 700px)
  const watermarkWidth = Math.min(Math.max(Math.round(width * 0.35), 240), 700);
  const watermarkHeight = Math.round(watermarkWidth * 0.32);
  const fontSize = Math.round(watermarkWidth * 0.12);
  const iconSize = Math.round(watermarkWidth * 0.14);
  const initialLetter = (text || "S").charAt(0).toUpperCase();

  return Buffer.from(`
    <svg width="${watermarkWidth}" height="${watermarkHeight}" viewBox="0 0 ${watermarkWidth} ${watermarkHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
      </defs>
      <g filter="url(#shadow)" opacity="${opacity}">
        <!-- Monogram Box -->
        <rect x="10" y="${(watermarkHeight - iconSize) / 2}" width="${iconSize}" height="${iconSize}" rx="${iconSize * 0.25}" fill="#C8A44E" />
        <text 
          x="${10 + iconSize / 2}" 
          y="${watermarkHeight / 2 + iconSize * 0.35}" 
          font-family="system-ui, -apple-system, sans-serif" 
          font-weight="900" 
          font-size="${iconSize * 0.65}" 
          fill="#12121f" 
          text-anchor="middle"
        >${initialLetter}</text>

        <!-- Brand Text -->
        <text 
          x="${iconSize + 24}" 
          y="${watermarkHeight / 2 + fontSize * 0.35}" 
          font-family="Georgia, serif" 
          font-weight="bold" 
          font-size="${fontSize}" 
          fill="#ffffff" 
          letter-spacing="1"
        >${text}<tspan fill="#C8A44E">.</tspan></text>
      </g>
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

    // Generate SVG watermark buffer
    const effectiveWidth = Math.min(originalWidth, 1920);
    const effectiveHeight = Math.min(originalHeight, 1920);
    const watermarkSvg = createWatermarkSvg(
      effectiveWidth,
      effectiveHeight,
      options?.text || "Villa",
      options?.opacity || 0.32
    );

    // Composite watermark in the center
    const outputBuffer = await pipeline
      .composite([
        {
          input: watermarkSvg,
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
