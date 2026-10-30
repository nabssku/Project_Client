import type { Metadata } from "next";

export function getBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://villaqoe.com"
      : process.env.AUTH_URL || "http://localhost:3000");
  return url.replace(/\/+$/, "");
}

/**
 * Ensures an image URL is fully-qualified with the production domain
 * so crawlers and scrapers (WhatsApp, Facebook, Twitter, Telegram, LinkedIn)
 * can properly fetch and render social media preview cards.
 */
export function toAbsoluteUrl(
  url?: string | null,
  fallback: string = "/Villaqoe.png"
): string {
  const baseUrl = getBaseUrl();
  const target = url && url.trim().length > 0 ? url.trim() : fallback;
  if (target.startsWith("http://") || target.startsWith("https://")) {
    return target;
  }
  return `${baseUrl}${target.startsWith("/") ? "" : "/"}${target}`;
}

export interface SmoOptions {
  title: string;
  description: string;
  urlPath?: string;
  image?: string | null;
  imageAlt?: string;
  siteName?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  tags?: string[];
  section?: string;
  keywords?: string[];
  noIndex?: boolean;
}

/**
 * Builds standard Social Media Optimization (SMO) metadata
 * adhering to OpenGraph and Twitter Cards specifications.
 */
export function buildSmoMetadata(opts: SmoOptions): Metadata {
  const baseUrl = getBaseUrl();
  const canonicalPath = opts.urlPath || "";
  const canonicalUrl = canonicalPath.startsWith("http")
    ? canonicalPath
    : `${baseUrl}${canonicalPath.startsWith("/") ? "" : "/"}${canonicalPath}`;
  const siteName = opts.siteName || "villaqoe";
  const absoluteImageUrl = toAbsoluteUrl(opts.image);
  const imageAlt = opts.imageAlt || opts.title;

  const robots = opts.noIndex
    ? {
        index: false,
        follow: false,
      }
    : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large" as const,
          "max-snippet": -1,
        },
      };

  return {
    title: opts.title,
    description: opts.description,
    keywords: opts.keywords,
    alternates: {
      canonical: canonicalPath.startsWith("http") ? canonicalPath : (canonicalPath || "/"),
    },
    robots,
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: canonicalUrl,
      siteName: siteName,
      locale: "id_ID",
      type: opts.type || "website",
      ...(opts.publishedTime ? { publishedTime: opts.publishedTime } : {}),
      ...(opts.modifiedTime ? { modifiedTime: opts.modifiedTime } : {}),
      ...(opts.authors ? { authors: opts.authors } : {}),
      ...(opts.tags ? { tags: opts.tags } : {}),
      ...(opts.section ? { section: opts.section } : {}),
      images: [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt,
          type: absoluteImageUrl.endsWith(".png")
            ? "image/png"
            : absoluteImageUrl.endsWith(".webp")
            ? "image/webp"
            : "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [absoluteImageUrl],
    },
  };
}
