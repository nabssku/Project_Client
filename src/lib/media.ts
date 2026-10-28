/**
 * Normalizes media URLs.
 * If a URL points to Cloudflare R2 default domain (*.r2.dev), which is blocked
 * by Indonesian ISPs / Kominfo (Internet Positif), this transforms it into
 * the internal /api/media/... proxy URL.
 */
export function normalizeMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.includes(".r2.dev/")) {
    const key = url.split(".r2.dev/")[1];
    return `/api/media/${key}`;
  }
  return url;
}
