"use client";

import { FontLoader } from "./font-loader";

interface DynamicFontProps {
  bodyFont?: string;
  displayFont?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export default function DynamicFont({
  bodyFont = "DM Sans",
  displayFont = "Playfair Display",
  primaryColor = "#1a1a2e",
  secondaryColor = "#C8A44E",
}: DynamicFontProps) {
  return (
    <FontLoader
      bodyFont={bodyFont}
      displayFont={displayFont}
      primaryColor={primaryColor}
      secondaryColor={secondaryColor}
    />
  );
}
