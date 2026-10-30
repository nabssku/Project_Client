import type { Metadata } from "next";
import { Suspense } from "react";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { prisma } from "@/lib/prisma";
import { TimeThemeProvider } from "@/components/public/time-theme-provider";
import { FontLoader } from "@/components/font-loader";
import { cacheLife, cacheTag } from "next/cache";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

async function RootThemeLoader() {
  'use cache';
  cacheTag('site_configs');
  cacheLife('seconds');

  let fontBody = 'DM Sans';
  let fontDisplay = 'Playfair Display';
  let primaryColor = '#164e63';
  let secondaryColor = '#fb7185';

  try {
    const configs = await prisma.site_configs.findMany({
      where: {
        key: {
          in: ['font_body', 'font_display', 'primary_color', 'secondary_color'],
        },
      },
      orderBy: { key: 'asc' },
    });

    configs.forEach((c: { key: string; value: string }) => {
      if (c.key === 'font_body') fontBody = c.value;
      if (c.key === 'font_display') fontDisplay = c.value;
      if (c.key === 'primary_color') primaryColor = c.value;
      if (c.key === 'secondary_color') secondaryColor = c.value;
    });
  } catch (e) {
    console.warn("Notice: Failed to load theme config from DB in root layout:", e);
  }

  return (
    <FontLoader
      bodyFont={fontBody}
      displayFont={fontDisplay}
      primaryColor={primaryColor}
      secondaryColor={secondaryColor}
    />
  );
}

function getBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://villaqoe.com"
      : process.env.AUTH_URL || "http://localhost:3000");
  return url.replace(/\/+$/, "");
}

async function getSiteMetadataConfig() {
  'use cache';
  cacheTag('site_configs');
  cacheLife('minutes');

  try {
    const configs = await prisma.site_configs.findMany({
      where: {
        key: {
          in: ['site_name', 'site_description', 'hero_image', 'site_logo', 'google_site_verification'],
        },
      },
      orderBy: { key: 'asc' },
    });

    const siteName = configs.find((c: any) => c.key === 'site_name')?.value || 'Villa Booking System';
    const siteDescription = configs.find((c: any) => c.key === 'site_description')?.value || 'Book your dream villa';
    const heroImage = configs.find((c: any) => c.key === 'hero_image')?.value || null;
    const googleVerification =
      configs.find((c: any) => c.key === 'google_site_verification')?.value ||
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
      process.env.GOOGLE_SITE_VERIFICATION ||
      null;

    return { siteName, siteDescription, heroImage, googleVerification };
  } catch (error) {
    return {
      siteName: 'Villa Booking System',
      siteDescription: 'Book your dream villa',
      heroImage: null,
      googleVerification:
        process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
        process.env.GOOGLE_SITE_VERIFICATION ||
        null,
    };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { siteName, siteDescription, heroImage, googleVerification } = await getSiteMetadataConfig();
  const baseUrl = getBaseUrl();

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: siteDescription,
    verification: {
      google: googleVerification || undefined,
    },
    openGraph: {
      type: 'website',
      locale: 'id_ID',
      url: baseUrl,
      siteName: siteName,
      title: siteName,
      description: siteDescription,
      images: heroImage ? [{ url: heroImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: siteName,
      description: siteDescription,
      images: heroImage ? [heroImage] : undefined,
    },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/icon.png', type: 'image/png', sizes: '192x192' },
      ],
      shortcut: '/favicon.ico',
      apple: [
        { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased bg-background text-gray-900">
        <Suspense fallback={null}>
          <RootThemeLoader />
        </Suspense>
        <TimeThemeProvider />
        {children}
      </body>
    </html>
  );
}
