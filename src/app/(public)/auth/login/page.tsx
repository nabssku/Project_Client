import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { LoginForm } from "@/components/auth/login-form";

export const instant = false;

async function getAuthConfig() {
  'use cache';
  cacheTag('site_configs');
  cacheLife('seconds');

  try {
    const configs = await prisma.site_configs.findMany({
      where: {
        key: {
          in: [
            "site_name",
            "site_logo",
            "auth_video",
            "login_title",
            "login_subtitle",
          ],
        },
      },
    });
    return configs.reduce((acc, c) => ({ ...acc, [c.key]: c.value }), {} as Record<string, string>);
  } catch (e) {
    console.error("Failed to load auth config for (public) login:", e);
    return {};
  }
}

export default async function PublicLoginPage() {
  const config = await getAuthConfig();

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LoginForm config={config} />
    </Suspense>
  );
}
