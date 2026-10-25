import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { prisma } from "@/lib/prisma";
import { TimeThemeProvider } from "@/components/public/time-theme-provider";
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
    });

    const siteName = configs.find((c: any) => c.key === 'site_name')?.value || 'Villa Booking System';
    const siteDescription = configs.find((c: any) => c.key === 'site_description')?.value || 'Book your dream villa';

    return {
      title: siteName,
      description: siteDescription,
    };
  } catch (error) {
    return {
      title: 'Villa Booking System',
      description: 'Book your dream villa',
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
        <TimeThemeProvider />
        {children}
      </body>
    </html>
  );
}
