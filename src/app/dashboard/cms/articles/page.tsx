import { requirePagePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { ArticlesClient } from "@/components/dashboard/cms/articles-client";

export const instant = false;

export default async function CmsArticlesPage() {
  const user = await requirePagePermission("cms:read");

  const [articles, siteConfig, existingCategoriesData] = await Promise.all([
    prisma.articles.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
      },
    }),
    prisma.site_configs.findUnique({
      where: { key: "site_name" },
    }),
    prisma.articles.findMany({
      select: { category: true },
      distinct: ["category"],
    }),
  ]);

  const siteName = siteConfig?.value || "Villa Luxury Stay";

  const defaultCategories = [
    "Panduan Wisata",
    "Rekomendasi Villa",
    "Tips Liburan",
    "Info & Event",
    "Kuliner & Budaya",
  ];

  const dbCategories = existingCategoriesData
    .map((c) => c.category)
    .filter(Boolean);

  const initialCategories = Array.from(
    new Set([...defaultCategories, ...dbCategories])
  );

  const canEdit = user.permissions.includes("cms:update");

  return (
    <ArticlesClient
      initialArticles={articles}
      canEdit={canEdit}
      siteName={siteName}
      initialCategories={initialCategories}
    />
  );
}
