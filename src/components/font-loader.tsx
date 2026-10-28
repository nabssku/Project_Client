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
  const [theme, setTheme] = React.useState({
    bodyFont,
    displayFont,
    primaryColor,
    secondaryColor,
  });

  // Keep in sync if props change
  useEffect(() => {
    setTheme({ bodyFont, displayFont, primaryColor, secondaryColor });
  }, [bodyFont, displayFont, primaryColor, secondaryColor]);

  // Real-time event listener for instant theme changes across tabs or CMS previews
  useEffect(() => {
    const handleThemeChange = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      setTheme((prev) => ({
        bodyFont: detail.font_body || prev.bodyFont,
        displayFont: detail.font_display || prev.displayFont,
        primaryColor: detail.primary_color || prev.primaryColor,
        secondaryColor: detail.secondary_color || prev.secondaryColor,
      }));
    };

    window.addEventListener("theme-change", handleThemeChange);
    return () => {
      window.removeEventListener("theme-change", handleThemeChange);
    };
  }, []);

  // Client-side cache-buster: fetch fresh configs to bypass any stale CDN/browser cache
  useEffect(() => {
    let mounted = true;
    fetch(`/api/config/site?_t=${Date.now()}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted || !data?.configs) return;
        const cfg = data.configs;
        setTheme((prev) => {
          const nextBody = cfg.font_body || prev.bodyFont;
          const nextDisplay = cfg.font_display || prev.displayFont;
          const nextPrimary = cfg.primary_color || prev.primaryColor;
          const nextSecondary = cfg.secondary_color || prev.secondaryColor;
          if (
            nextBody !== prev.bodyFont ||
            nextDisplay !== prev.displayFont ||
            nextPrimary !== prev.primaryColor ||
            nextSecondary !== prev.secondaryColor
          ) {
            return {
              bodyFont: nextBody,
              displayFont: nextDisplay,
              primaryColor: nextPrimary,
              secondaryColor: nextSecondary,
            };
          }
          return prev;
        });
      })
      .catch(() => {
        // Silently ignore if offline
      });

    return () => {
      mounted = false;
    };
  }, []);

  const primaryDark = adjustHex(theme.primaryColor, -16);
  const accentLight = adjustHex(theme.secondaryColor, 14);

  useEffect(() => {
    // 1. Remove existing font links
    const existingLinks = document.querySelectorAll("link[data-font-loader]");
    existingLinks.forEach((link) => link.remove());

    // 2. Build Google Fonts URL
    const fontParams: string[] = [];

    const bodyQuery =
      FONT_MAP[theme.bodyFont] ||
      `family=${encodeURIComponent(theme.bodyFont)}:ital,wght@0,400;0,500;0,600;0,700;1,400`;
    fontParams.push(bodyQuery);

    if (theme.displayFont !== theme.bodyFont) {
      const displayQuery =
        FONT_MAP[theme.displayFont] ||
        `family=${encodeURIComponent(theme.displayFont)}:ital,wght@0,400;0,600;0,700;1,400`;
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

    root.style.setProperty("--font-sans", `"${theme.bodyFont}", system-ui, -apple-system, sans-serif`);
    root.style.setProperty("--font-display", `"${theme.displayFont}", Georgia, serif`);

    root.style.setProperty("--primary", theme.primaryColor);
    root.style.setProperty("--color-primary", theme.primaryColor);
    root.style.setProperty("--primary-dark", primaryDark);
    root.style.setProperty("--color-primary-dark", primaryDark);

    root.style.setProperty("--accent", theme.secondaryColor);
    root.style.setProperty("--color-accent", theme.secondaryColor);
    root.style.setProperty("--accent-light", accentLight);
    root.style.setProperty("--color-accent-light", accentLight);
    root.style.setProperty("--ring", theme.secondaryColor);
    root.style.setProperty("--color-ring", theme.secondaryColor);
  }, [
    theme.bodyFont,
    theme.displayFont,
    theme.primaryColor,
    theme.secondaryColor,
    primaryDark,
    accentLight,
  ]);

  // Server-rendered inline style to guarantee instant correct colors & typography everywhere
  const inlineStyles = `
    :root {
      --primary: ${theme.primaryColor} !important;
      --primary-dark: ${primaryDark} !important;
      --color-primary: ${theme.primaryColor} !important;
      --color-primary-dark: ${primaryDark} !important;
      --accent: ${theme.secondaryColor} !important;
      --accent-light: ${accentLight} !important;
      --color-accent: ${theme.secondaryColor} !important;
      --color-accent-light: ${accentLight} !important;
      --ring: ${theme.secondaryColor} !important;
      --color-ring: ${theme.secondaryColor} !important;
      --font-sans: "${theme.bodyFont}", system-ui, -apple-system, sans-serif !important;
      --font-display: "${theme.displayFont}", Georgia, serif !important;
    }
    html, body {
      font-family: var(--font-sans) !important;
    }
    .font-sans, [class*="font-sans"] {
      font-family: var(--font-sans) !important;
    }
    .font-display, [class*="font-display"] {
      font-family: var(--font-display) !important;
    }

    /* Fallback and legacy hardcoded hex mapping to guarantee 100% color synchronization */
    .bg-\\[\\#1a1a2e\\], .bg-\\[\\#1A1A2E\\] { background-color: var(--primary) !important; }
    .text-\\[\\#1a1a2e\\], .text-\\[\\#1A1A2E\\] { color: var(--primary) !important; }
    .border-\\[\\#1a1a2e\\], .border-\\[\\#1A1A2E\\] { border-color: var(--primary) !important; }

    .bg-\\[\\#12121f\\], .bg-\\[\\#12121F\\] { background-color: var(--primary-dark) !important; }
    .text-\\[\\#12121f\\], .text-\\[\\#12121F\\] { color: var(--primary-dark) !important; }
    .border-\\[\\#12121f\\], .border-\\[\\#12121F\\] { border-color: var(--primary-dark) !important; }

    .bg-\\[\\#C8A44E\\], .bg-\\[\\#c8a44e\\], .bg-\\[\\#C8a44e\\] { background-color: var(--accent) !important; }
    .text-\\[\\#C8A44E\\], .text-\\[\\#c8a44e\\], .text-\\[\\#C8a44e\\] { color: var(--accent) !important; }
    .border-\\[\\#C8A44E\\], .border-\\[\\#c8a44e\\], .border-\\[\\#C8a44e\\] { border-color: var(--accent) !important; }

    .bg-\\[\\#d4b366\\], .bg-\\[\\#D4B366\\], .bg-\\[\\#d6b25a\\] { background-color: var(--accent-light) !important; }
    .text-\\[\\#d4b366\\], .text-\\[\\#D4B366\\], .text-\\[\\#d6b25a\\] { color: var(--accent-light) !important; }
    .border-\\[\\#d4b366\\], .border-\\[\\#D4B366\\], .border-\\[\\#d6b25a\\] { border-color: var(--accent-light) !important; }

    [class*="bg-[#C8A44E]/"], [class*="bg-[#c8a44e]/"] {
      background-color: color-mix(in srgb, var(--accent) 15%, transparent) !important;
    }
    [class*="text-[#C8A44E]/"], [class*="text-[#c8a44e]/"] {
      color: color-mix(in srgb, var(--accent) 80%, transparent) !important;
    }
    [class*="border-[#C8A44E]/"], [class*="border-[#c8a44e]/"] {
      border-color: color-mix(in srgb, var(--accent) 30%, transparent) !important;
    }
    [class*="bg-[#1a1a2e]/"], [class*="bg-[#1A1A2E]/"] {
      background-color: color-mix(in srgb, var(--primary) 10%, transparent) !important;
    }
    [class*="text-[#1a1a2e]/"], [class*="text-[#1A1A2E]/"] {
      color: color-mix(in srgb, var(--primary) 80%, transparent) !important;
    }
    [class*="border-[#1a1a2e]/"], [class*="border-[#1A1A2E]/"] {
      border-color: color-mix(in srgb, var(--primary) 30%, transparent) !important;
    }
  `;

  return <style dangerouslySetInnerHTML={{ __html: inlineStyles }} />;
}

// Export ThemeLoader as alias for FontLoader
export const ThemeLoader = FontLoader;
