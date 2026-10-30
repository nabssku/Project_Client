import type { MetadataRoute } from "next";

function getBaseUrl() {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://villaqoe.com"
      : process.env.AUTH_URL || "http://localhost:3000");
  return url.replace(/\/+$/, "");
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/dashboard",
          "/api/",
          "/login",
          "/register",
          "/auth/",
          "/booking/",
          "/booking",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
