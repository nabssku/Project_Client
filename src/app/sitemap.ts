import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";

function getBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://villaqoe.com"
      : process.env.AUTH_URL || "http://localhost:3000");
  return url.replace(/\/+$/, "");
}

/**
 * Escapes special XML characters (&, <, >, ", ') in URLs and text to prevent
 * XML parsing errors (such as "EntityRef: expecting ';'" caused by unescaped '&').
 * Ampersands that are already part of a valid XML entity reference are preserved.
 */
function escapeXml(str: string): string {
  if (!str) return "";
  return str
    .trim()
    .replace(/&(?!amp;|lt;|gt;|quot;|apos;|#[0-9]+;|#x[0-9a-fA-F]+;)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function getVillasForSitemap() {
  "use cache";
  cacheTag("sitemap_villas");
  cacheLife("hours");

  try {
    return await prisma.villas.findMany({
      where: {
        status: { not: "UNAVAILABLE" },
      },
      select: {
        slug: true,
        updatedAt: true,
        images: true,
      },
    });
  } catch (error) {
    console.warn("Failed to fetch villas for sitemap:", error);
    return [];
  }
}

async function getArticlesForSitemap() {
  "use cache";
  cacheTag("sitemap_articles");
  cacheLife("hours");

  try {
    return await prisma.articles.findMany({
      where: {
        isPublished: true,
      },
      select: {
        slug: true,
        updatedAt: true,
        publishedAt: true,
        coverImage: true,
      },
    });
  } catch (error) {
    console.warn("Failed to fetch articles for sitemap:", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  // 1. Static Public Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: escapeXml(baseUrl),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: escapeXml(`${baseUrl}/villas`),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: escapeXml(`${baseUrl}/artikel`),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: escapeXml(`${baseUrl}/about`),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // 2. Dynamic Villas
  const villas = await getVillasForSitemap();
  const villaRoutes: MetadataRoute.Sitemap = villas.map((villa) => {
    const images = Array.isArray(villa.images)
      ? villa.images
          .filter((img): img is string => typeof img === "string" && img.trim().length > 0)
          .map((img) => {
            const trimmed = img.trim();
            const fullUrl = trimmed.startsWith("http")
              ? trimmed
              : `${baseUrl}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
            return escapeXml(fullUrl);
          })
      : [];

    return {
      url: escapeXml(`${baseUrl}/villas/${villa.slug}`),
      lastModified: villa.updatedAt || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
      ...(images.length > 0 ? { images } : {}),
    };
  });

  // 3. Dynamic Articles
  const articles = await getArticlesForSitemap();
  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => {
    const images: string[] = [];
    if (article.coverImage && article.coverImage.trim().length > 0) {
      const trimmed = article.coverImage.trim();
      const fullUrl = trimmed.startsWith("http")
        ? trimmed
        : `${baseUrl}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
      images.push(escapeXml(fullUrl));
    }

    return {
      url: escapeXml(`${baseUrl}/artikel/${article.slug}`),
      lastModified: article.publishedAt || article.updatedAt || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      ...(images.length > 0 ? { images } : {}),
    };
  });

  return [...staticRoutes, ...villaRoutes, ...articleRoutes];
}
