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

export async function generateMetadata(): Promise<Metadata> {
  'use cache';
  cacheTag('site_configs');
  cacheLife('minutes');

  try {
    const configs = await prisma.site_configs.findMany({
      where: {
        key: {
          in: ['site_name', 'site_description'],
        },
      },
      orderBy: { key: 'asc' },
    });

    const siteName = configs.find((c: any) => c.key === 'site_name')?.value || 'Villa Booking System';
    const siteDescription = configs.find((c: any) => c.key === 'site_description')?.value || 'Book your dream villa';

    return {
      title: siteName,
      description: siteDescription,
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
  } catch (error) {
    return {
      title: 'Villa Booking System',
      description: 'Book your dream villa',
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
