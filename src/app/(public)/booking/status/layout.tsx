import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildSmoMetadata } from "@/lib/smo";

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await prisma.site_configs.findFirst({
    where: { key: "site_name" },
  });
  const siteName = siteConfig?.value || "villaqoe";

  return buildSmoMetadata({
    title: `Cek Status Reservasi & Pelunasan | ${siteName}`,
    description: `Periksa status konfirmasi reservasi villa Anda, unggah bukti transfer pelunasan DP 50%, dan unduh invoice resmi secara mudah dan aman.`,
    urlPath: "/booking/status",
    image: "/Villaqoe.png",
    siteName,
  });
}

export default function BookingStatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
