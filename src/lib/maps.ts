/**
 * Cleans and normalizes Google Maps embed input.
 * Handles:
 * 1. Full HTML <iframe> embed code: <iframe src="https://www.google.com/maps/embed?..." ...></iframe>
 * 2. Direct embed URLs: https://www.google.com/maps/embed?...
 * 3. Standard Google Maps URLs / coordinates / queries
 * 4. Fallback to free keyless embed using location name
 */
export function extractMapEmbedSrc(
  input?: string | null,
  fallbackLocation: string = "Puncak, Bogor"
): string {
  if (!input || !input.trim()) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(
      fallbackLocation || "Puncak, Bogor"
    )}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }

  const trimmed = input.trim();

  // If user pasted a full iframe HTML tag: <iframe src="..." ...>
  const iframeMatch = trimmed.match(/src=["']([^"']+)["']/i);
  if (iframeMatch && iframeMatch[1]) {
    return iframeMatch[1];
  }

  // If user pasted direct embed link or standard URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    // If it's already an embed URL, return as-is
    if (trimmed.includes("/embed") || trimmed.includes("output=embed")) {
      return trimmed;
    }

    // If it's a standard google maps URL, extract query or embed it
    try {
      const url = new URL(trimmed);
      const q = url.searchParams.get("q") || url.pathname;
      if (q) {
        return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
      }
    } catch {
      // ignore URL parse errors
    }

    return trimmed;
  }

  // Fallback to query
  return `https://maps.google.com/maps?q=${encodeURIComponent(trimmed)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}
