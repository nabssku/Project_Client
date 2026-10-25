import { requirePagePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { TestimonialsClient } from "@/components/dashboard/cms/testimonials-client";

export const instant = false;

export default async function CmsTestimonialsPage() {
  const user = await requirePagePermission("cms:read");

  const [testimonials, villas] = await Promise.all([
    prisma.testimonials.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        villa: {
          select: {
            id: true,
            name: true,
          },
        },
        booking: {
          select: {
            id: true,
            code: true,
          },
        },
      },
    }),
    prisma.villas.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const canEdit = user.permissions.includes("cms:update");

  return (
    <TestimonialsClient
      initialTestimonials={testimonials}
      villas={villas}
      canEdit={canEdit}
    />
  );
}
