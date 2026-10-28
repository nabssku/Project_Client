import { Suspense } from 'react'
import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { prisma } from '@/lib/prisma'
import { SessionProvider } from '@/components/session-provider'
import { PublicAnnouncementPopup } from '@/components/public/public-announcement-popup'
import { cacheLife, cacheTag } from 'next/cache'

async function getNavbarConfig() {
  'use cache'
  cacheTag('site_configs')
  cacheLife('seconds')

  try {
    const configs = await prisma.site_configs.findMany({
      where: {
        key: { in: ['contact_phone_1', 'site_name', 'site_logo'] },
      },
    });
    const map = configs.reduce((acc, c) => ({ ...acc, [c.key]: c.value }), {} as Record<string, string>);
    return {
      contactPhone: map.contact_phone_1 || '628111141888',
      siteName: map.site_name || 'Villa',
      siteLogo: map.site_logo || null,
    };
  } catch (e) {
    console.error("Failed to load navbar config:", e);
    return {
      contactPhone: '628111141888',
      siteName: 'Villa',
      siteLogo: null,
    };
  }
}

async function NavbarWrapper() {
  const { contactPhone, siteName, siteLogo } = await getNavbarConfig();
  return <Navbar contactPhone={contactPhone} siteName={siteName} siteLogo={siteLogo} />;
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <div>
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
