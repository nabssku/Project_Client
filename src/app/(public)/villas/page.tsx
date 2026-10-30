import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { cacheLife } from "next/cache";
import { buildSmoMetadata } from "@/lib/smo";

async function getVillas() {
  'use cache'
  cacheLife('minutes')
  
  try {
    const villas = await prisma.villas.findMany({
      where: { status: 'AVAILABLE' },
      orderBy: { createdAt: 'desc' },
    });

    return villas;
  } catch (error) {
    console.error("Error fetching villas:", error);
    return [];
  }
}

export async function generateMetadata() {
  try {
    const [siteConfig, firstVilla] = await Promise.all([
      prisma.site_configs.findFirst({
        where: { key: "site_name" },
      }),
      prisma.villas.findFirst({
        where: { status: "AVAILABLE" },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        select: { images: true },
      }),
    ]);
    const siteName = siteConfig?.value || "villaqoe";
    const title = `Katalog Villa Eksklusif & Resort | ${siteName}`;
    const description = `Pilihan villa mewah dan private pool terbaik di Puncak dan sekitarnya. Booking mudah dengan fasilitas lengkap dan harga terbaik.`;
    const image = firstVilla?.images?.[0] || "/Villaqoe.png";

    return buildSmoMetadata({
      title,
      description,
      urlPath: "/villas",
      image,
      siteName,
      keywords: ["katalog villa", "villa private pool", "villa puncak", "sewa villa bogor", "villa keluarga"],
    });
  } catch {
    return buildSmoMetadata({
      title: "Katalog Villa & Resort | villaqoe",
      description: "Temukan dan booking villa & resort terbaik di Puncak.",
      urlPath: "/villas",
      image: "/Villaqoe.png",
      siteName: "villaqoe",
    });
  }
}

export default async function VillasPage() {
  const villas = await getVillas();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID").format(price);
  };

  return (
    <main className="min-h-screen pt-20 pb-20 bg-cream">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-10">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-accent font-medium tracking-[0.2em] uppercase text-xs mb-3">
            Pilihan Terbaik
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary leading-tight">
            Villa{" "}
            <span className="italic text-primary/40">Tersedia</span>
          </h1>
        </div>

        {/* Filter - Coming Soon */}
        {/* <div className="bg-white rounded-2xl p-4 mb-10 shadow-sm">
          <div className="flex flex-wrap gap-4">
            <button className="px-4 py-2 bg-accent text-white rounded-lg">Semua</button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Private Pool</button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Large Group</button>
          </div>
        </div> */}

        {/* Villa Grid */}
        {villas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {villas.map((villa: any) => (
              <Link
                key={villa.id}
                href={`/villas/${villa.slug}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="aspect-[16/11] bg-cream overflow-hidden relative">
                  {villa.images.length > 0 ? (
                    <Image
                      src={villa.images[0]}
                      alt={villa.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-gray-400">No image</p>
                    </div>
                  )}
                  {villa.isFeatured && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className="bg-accent text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                        Featured
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="font-display text-xl font-bold text-primary mb-2 line-clamp-1 group-hover:text-accent transition-colors">
                    {villa.name}
                  </h3>

                  <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                      />
                    </svg>
                    {villa.location}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                        />
                      </svg>
                      {villa.capacity} Tamu
                    </span>
                    <span className="flex items-center gap-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                        />
                      </svg>
                      {villa.bedrooms} Kamar
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                    {villa.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Mulai dari</p>
                      <p className="font-display text-lg font-bold text-accent">
                        Rp&nbsp;{formatPrice(villa.pricePerNight)}
                        <span className="text-xs text-gray-400 font-normal">
                          /malam
                        </span>
                      </p>
                    </div>
                    <span className="text-accent text-sm font-semibold flex items-center gap-1">
                      Lihat Detail
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1"
              stroke="currentColor"
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
              />
            </svg>
            <p className="text-gray-500 text-lg">Belum ada villa tersedia</p>
            <p className="text-gray-400 text-sm mt-2">
              Silakan cek kembali nanti
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
