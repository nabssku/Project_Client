import {
  Waves,
  Wifi,
  Wind,
  UtensilsCrossed,
  Flame,
  Car,
  Trees,
  Mic,
  CircleDot,
  Gamepad2,
  Tv,
  Bath,
  Droplets,
  Mountain,
  Refrigerator,
  Users,
  Dumbbell,
  ShieldCheck,
  Coffee,
  CookingPot,
  Sparkles,
  LucideIcon,
} from "lucide-react";

interface AmenityIconProps {
  name: string;
  className?: string;
  size?: number;
}

/**
 * Returns the matching Lucide icon component based on keyword heuristics.
 * Supports both Indonesian and English terms.
 */
export function getAmenityIconComponent(name: string): LucideIcon {
  const normalized = (name || "").toLowerCase().trim();

  // 1. Swimming Pool
  if (
    normalized.includes("pool") ||
    normalized.includes("kolam") ||
    normalized.includes("renang") ||
    normalized.includes("swimming")
  ) {
    return Waves;
  }

  // 2. WiFi / Internet
  if (
    normalized.includes("wifi") ||
    normalized.includes("wi-fi") ||
    normalized.includes("internet") ||
    normalized.includes("hotspot")
  ) {
    return Wifi;
  }

  // 3. AC / Air Conditioner
  // Check exact word boundaries or common AC phrases so we don't accidentally match "access"
  if (
    normalized === "ac" ||
    /\bac\b/.test(normalized) ||
    normalized.includes("air cond") ||
    normalized.includes("pendingin")
  ) {
    return Wind;
  }

  // 4. Kitchen / Cooking
  if (
    normalized.includes("kitchen") ||
    normalized.includes("dapur") ||
    normalized.includes("masak") ||
    normalized.includes("cook")
  ) {
    if (normalized.includes("rice") || normalized.includes("nasi")) {
      return CookingPot;
    }
    return UtensilsCrossed;
  }

  // 5. BBQ / Grill
  if (
    normalized.includes("bbq") ||
    normalized.includes("barbeque") ||
    normalized.includes("barbecue") ||
    normalized.includes("grill") ||
    normalized.includes("panggang")
  ) {
    return Flame;
  }

  // 6. Parking / Garage
  if (
    normalized.includes("parking") ||
    normalized.includes("parkir") ||
    normalized.includes("garasi") ||
    normalized.includes("garage") ||
    normalized.includes("carport")
  ) {
    return Car;
  }

  // 7. Garden / Taman
  if (
    normalized.includes("garden") ||
    normalized.includes("taman") ||
    normalized.includes("halaman") ||
    normalized.includes("outdoor")
  ) {
    return Trees;
  }

  // 8. Karaoke / Mic / Sound
  if (
    normalized.includes("karaoke") ||
    normalized.includes("mic") ||
    normalized.includes("sound") ||
    normalized.includes("musik") ||
    normalized.includes("music")
  ) {
    return Mic;
  }

  // 9. Billiard
  if (
    normalized.includes("billiard") ||
    normalized.includes("bilyard") ||
    normalized.includes("biliar") ||
    normalized.includes("snooker")
  ) {
    return CircleDot;
  }

  // 10. Games / Playstation / Console
  if (
    normalized.includes("playstation") ||
    normalized.includes("ps4") ||
    normalized.includes("ps5") ||
    normalized.includes("game") ||
    normalized.includes("console")
  ) {
    return Gamepad2;
  }

  // 11. TV / Smart TV / Netflix
  if (
    normalized.includes("tv") ||
    normalized.includes("televisi") ||
    normalized.includes("netflix")
  ) {
    return Tv;
  }

  // 12. Bathtub / Hot Tub / Jacuzzi / Kamar Mandi
  if (
    normalized.includes("bathtub") ||
    normalized.includes("bathub") ||
    normalized.includes("hot tub") ||
    normalized.includes("jacuzzi") ||
    normalized.includes("kamar mandi") ||
    normalized.includes("bathroom")
  ) {
    return Bath;
  }

  // 13. Water Heater / Pemanas Air
  if (
    normalized.includes("heater") ||
    normalized.includes("pemanas") ||
    normalized.includes("air panas")
  ) {
    return Droplets;
  }

  // 14. Balcony / Mountain View
  if (
    normalized.includes("balkon") ||
    normalized.includes("balcony") ||
    normalized.includes("rooftop") ||
    normalized.includes("view") ||
    normalized.includes("gunung") ||
    normalized.includes("mountain")
  ) {
    return Mountain;
  }

  // 15. Refrigerator / Kulkas
  if (
    normalized.includes("kulkas") ||
    normalized.includes("refrigerator") ||
    normalized.includes("fridge") ||
    normalized.includes("freezer")
  ) {
    return Refrigerator;
  }

  // 16. Meeting Room
  if (
    normalized.includes("meeting") ||
    normalized.includes("rapat") ||
    normalized.includes("pertemuan") ||
    normalized.includes("conference")
  ) {
    return Users;
  }

  // 17. Gym / Fitness
  if (
    normalized.includes("gym") ||
    normalized.includes("fitness") ||
    normalized.includes("olahraga")
  ) {
    return Dumbbell;
  }

  // 18. Security / Keamanan
  if (
    normalized.includes("security") ||
    normalized.includes("keamanan") ||
    normalized.includes("cctv") ||
    normalized.includes("satpam")
  ) {
    return ShieldCheck;
  }

  // 19. Coffee / Tea / Dispenser
  if (
    normalized.includes("coffee") ||
    normalized.includes("kopi") ||
    normalized.includes("dispenser") ||
    normalized.includes("teh")
  ) {
    return Coffee;
  }

  // Default fallback icon
  return Sparkles;
}

export function AmenityIcon({ name, className = "h-4 w-4", size }: AmenityIconProps) {
  const IconComponent = getAmenityIconComponent(name);
  return <IconComponent className={className} size={size} />;
}
