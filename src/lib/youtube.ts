/**
 * YouTube Utility Helper
 * Mendukung ekstraksi Video ID dari berbagai format URL YouTube:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - @[youtube](VIDEO_ID_OR_URL)
 */

export function extractYouTubeId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Jika input adalah raw 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle format markdown embed @[youtube](...) atau [youtube](...)
  const tagMatch = trimmed.match(/(?:@\[youtube\]\(|\[youtube:?\]\(?)([^)]+)\)?/i);
  const target = tagMatch ? tagMatch[1].trim() : trimmed;

  if (/^[a-zA-Z0-9_-]{11}$/.test(target)) {
    return target;
  }

  // Regex universal untuk youtube link
  const regExp =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const match = target.match(regExp);

  return match ? match[1] : null;
}

export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
}
