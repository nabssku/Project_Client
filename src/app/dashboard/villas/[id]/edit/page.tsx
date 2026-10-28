import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { VillaForm } from "@/components/dashboard/villas/villa-form";

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const villa = await prisma.villas.findUnique({
    where: { id },
    select: { name: true },
  });

  return {
    title: villa ? `Edit ${villa.name} - Dashboard` : "Edit Villa - Dashboard",
  };
}

export default async function EditVillaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Strict RBAC: Only ADMIN can access edit villa form
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard/villas");
  }

  const { id } = await params;
  const villa = await prisma.villas.findUnique({
    where: { id },
  });

  if (!villa) {
    notFound();
  }

  return (
    <VillaForm
      initialData={{
        id: villa.id,
        name: villa.name,
        slug: villa.slug,
        description: villa.description,
        pricePerNight: villa.pricePerNight,
        priceWeekend: villa.priceWeekend,
        capacity: villa.capacity,
        bedrooms: villa.bedrooms,
        bathrooms: villa.bathrooms,
        location: villa.location,
        amenities: villa.amenities,
        images: villa.images,
        rules: villa.rules,
        checkInTime: villa.checkInTime,
        checkOutTime: villa.checkOutTime,
        mapEmbed: villa.mapEmbed,
        isFeatured: villa.isFeatured,
        status: villa.status,
      }}
    />
  );
}
