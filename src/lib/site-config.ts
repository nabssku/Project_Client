import { prisma } from "@/lib/prisma";

export interface SiteContactConfig {
  siteName: string;
  siteLogo: string | null;
  contactPhone1: string;
  contactPhone2: string;
  contactEmail: string;
  contactAddress: string;
  waNumber1: string; // Clean digits formatted for wa.me link (e.g. "628111141888")
  waNumber2: string;
}

/**
 * Normalizes any phone string format (e.g. "(+62) 811-1141-888", "08111141888", "+62 811...")
 * into clean digits suitable for WhatsApp `https://wa.me/{number}` links.
 */
export function cleanWhatsAppNumber(phone?: string | null): string {
  if (!phone) return "628111141888";
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "628111141888";
  if (digits.startsWith("0")) {
    return "62" + digits.slice(1);
  }
  if (digits.startsWith("62")) {
    return digits;
  }
  return "62" + digits;
}

/**
 * Fetches contact info from `site_configs` in the database.
 * Always resolves to the latest configured hotline / WhatsApp numbers.
 */
export async function getSiteContactConfig(): Promise<SiteContactConfig> {
  try {
    const configs = await prisma.site_configs.findMany({
      where: {
        key: {
          in: [
            "site_name",
            "site_logo",
            "contact_phone_1",
            "contact_phone_2",
            "contact_email",
            "contact_address",
          ],
        },
      },
    });

    const map = configs.reduce(
      (acc, c) => ({ ...acc, [c.key]: c.value }),
      {} as Record<string, string>
    );

    const phone1 = map.contact_phone_1 || "(+62) 811-1141-888";
    const phone2 = map.contact_phone_2 || "(+62) 8521-9949-626";

    return {
      siteName: map.site_name || "Villa",
      siteLogo: map.site_logo || null,
      contactPhone1: phone1,
      contactPhone2: phone2,
      contactEmail: map.contact_email || "support@example.com",
      contactAddress: map.contact_address || "Puncak, Bogor",
      waNumber1: cleanWhatsAppNumber(phone1),
      waNumber2: cleanWhatsAppNumber(phone2),
    };
  } catch (error) {
    console.error("Failed to fetch site contact config:", error);
    return {
      siteName: "Villa",
      siteLogo: null,
      contactPhone1: "(+62) 811-1141-888",
      contactPhone2: "(+62) 8521-9949-626",
      contactEmail: "support@example.com",
      contactAddress: "Puncak, Bogor",
      waNumber1: "628111141888",
      waNumber2: "6285219949626",
    };
  }
}
