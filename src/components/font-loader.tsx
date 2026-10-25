"use client";

import React, { useEffect } from "react";

export interface ThemeLoaderProps {
  bodyFont?: string;
  displayFont?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

const FONT_MAP: Record<string, string> = {
  // Body fonts
  "DM Sans": "family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400",
  "Inter": "family=Inter:wght@400;500;600;700",
  "Poppins": "family=Poppins:ital,wght@0,400;0,500;0,600;0,700;1,400",
  "Open Sans": "family=Open+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400",
  "Nunito": "family=Nunito:ital,wght@0,400;0,600;0,700;1,400",
  "Work Sans": "family=Work+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400",

  // Display fonts
  "Playfair Display": "family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600",
  "Libre Baskerville": "family=Libre+Baskerville:ital,wght@0,400;0,700;1,400",
  "Cormorant Garamond": "family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500",
  "Merriweather": "family=Merriweather:ital,wght@0,400;0,700;1,400;1,700",
  "Lora": "family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500",
  "Crimson Text": "family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600",
};

function adjustHex(hex: string, percent: number): string {
  try {
    const cleanHex = hex.replace("#", "").trim();
    if (cleanHex.length !== 6 && cleanHex.length !== 3) return hex;
    const fullHex =
      cleanHex.length === 3
        ? cleanHex
            .split("")
            .map((c) => c + c)
            .join("")
        : cleanHex;
    const num = parseInt(fullHex, 16);
    if (isNaN(num)) return hex;
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
    return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
  } catch {
    return hex;
  }
}

export function FontLoader({
  bodyFont = "DM Sans",
  displayFont = "Playfair Display",
  primaryColor = "#1a1a2e",
  secondaryColor = "#C8A44E",
}: ThemeLoaderProps) {
  const primaryDark = adjustHex(primaryColor, -16);
  const accentLight = adjustHex(secondaryColor, 14);

  useEffect(() => {
    // 1. Remove existing font links
    const existingLinks = document.querySelectorAll("link[data-font-loader]");
    existingLinks.forEach((link) => link.remove());

    // 2. Build Google Fonts URL
    const fontParams: string[] = [];

    const bodyQuery = FONT_MAP[bodyFont] || `family=${encodeURIComponent(bodyFont)}:ital,wght@0,400;0,500;0,600;0,700;1,400`;
    fontParams.push(bodyQuery);

    if (displayFont !== bodyFont) {
      const displayQuery = FONT_MAP[displayFont] || `family=${encodeURIComponent(displayFont)}:ital,wght@0,400;0,600;0,700;1,400`;
      fontParams.push(displayQuery);
    }

    if (fontParams.length > 0) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?${fontParams.join("&")}&display=swap`;
      link.setAttribute("data-font-loader", "true");
      document.head.appendChild(link);
    }

    // 3. Update CSS variables globally on document root
    const root = document.documentElement;

    root.style.setProperty("--font-sans", bodyFont);
    root.style.setProperty("--font-display", displayFont);

    root.style.setProperty("--primary", primaryColor);
    root.style.setProperty("--color-primary", primaryColor);
    root.style.setProperty("--primary-dark", primaryDark);
    root.style.setProperty("--color-primary-dark", primaryDark);

    root.style.setProperty("--accent", secondaryColor);
    root.style.setProperty("--color-accent", secondaryColor);
    root.style.setProperty("--accent-light", accentLight);
    root.style.setProperty("--color-accent-light", accentLight);
    root.style.setProperty("--ring", secondaryColor);
    root.style.setProperty("--color-ring", secondaryColor);
  }, [bodyFont, displayFont, primaryColor, secondaryColor, primaryDark, accentLight]);

  // Server-rendered inline style to prevent flash of default theme
  const inlineStyles = `
    :root {
      --primary: ${primaryColor} !important;
      --primary-dark: ${primaryDark} !important;
      --color-primary: ${primaryColor} !important;
      --color-primary-dark: ${primaryDark} !important;
      --accent: ${secondaryColor} !important;
      --accent-light: ${accentLight} !important;
      --color-accent: ${secondaryColor} !important;
      --color-accent-light: ${accentLight} !important;
      --ring: ${secondaryColor} !important;
      --color-ring: ${secondaryColor} !important;
      --font-sans: "${bodyFont}", system-ui, -apple-system, sans-serif !important;
      --font-display: "${displayFont}", Georgia, serif !important;
    }
    body {
      font-family: var(--font-sans) !important;
    }
    .font-display {
      font-family: var(--font-display) !important;
    }
  `;

  return <style dangerouslySetInnerHTML={{ __html: inlineStyles }} />;
}

// Export ThemeLoader as alias for FontLoader
export const ThemeLoader = FontLoader;
