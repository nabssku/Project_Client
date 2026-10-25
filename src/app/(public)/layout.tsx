import { Suspense } from 'react'
import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { FontLoader } from '@/components/font-loader'
import { prisma } from '@/lib/prisma'
import { SessionProvider } from '@/components/session-provider'
import { PublicAnnouncementPopup } from '@/components/public/public-announcement-popup'
import { cacheLife, cacheTag } from 'next/cache'

async function getThemeConfig() {
  'use cache'
  cacheTag('site_configs')
  cacheLife('seconds')

  let fontBody = 'DM Sans';
  let fontDisplay = 'Playfair Display';
  let primaryColor = '#1a1a2e';
  let secondaryColor = '#C8A44E';

  try {
    const configs = await prisma.site_configs.findMany({
      where: {
        key: {
          in: ['font_body', 'font_display', 'primary_color', 'secondary_color'],
        },
      },
    });

    configs.forEach((c: { key: string; value: string }) => {
      if (c.key === 'font_body') fontBody = c.value;
      if (c.key === 'font_display') fontDisplay = c.value;
      if (c.key === 'primary_color') primaryColor = c.value;
      if (c.key === 'secondary_color') secondaryColor = c.value;
    });
  } catch (e) {
    console.error("Failed to load theme config from DB:", e);
  }

  return { fontBody, fontDisplay, primaryColor, secondaryColor };
}

async function FontLoaderWrapper() {
  const { fontBody, fontDisplay, primaryColor, secondaryColor } = await getThemeConfig();
  return (
    <FontLoader
      bodyFont={fontBody}
      displayFont={fontDisplay}
      primaryColor={primaryColor}
      secondaryColor={secondaryColor}
    />
  );
}

async function getNavbarConfig() {
  'use cache'
  cacheTag('site_configs')
  cacheLife('seconds')

  try {
    const config = await prisma.site_configs.findUnique({
      where: { key: 'contact_phone_1' },
    });
    return config?.value || '628111141052';
  } catch (e) {
    console.error("Failed to load contact phone for navbar:", e);
    return '628111141052';
  }
}

async function NavbarWrapper() {
  const contactPhone = await getNavbarConfig();
  return <Navbar contactPhone={contactPhone} />;
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <div>
        <Suspense fallback={null}>
          <FontLoaderWrapper />
        </Suspense>
        <Suspense fallback={<Navbar />}>
          <NavbarWrapper />
        </Suspense>
        {children}
        <PublicAnnouncementPopup />
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </div>
    </SessionProvider>
  )
}
