"use client";

import { useEffect } from "react";

// Night = 18:00 – 05:59, Day = 06:00 – 17:59
function isNightTime() {
  const h = new Date().getHours();
  return h >= 18 || h < 6;
}

export function TimeThemeProvider() {
  useEffect(() => {
    const apply = () => {
      const night = isNightTime();
      document.documentElement.classList.toggle("is-night", night);
      document.documentElement.classList.toggle("is-day", !night);
    };

    apply();

    // Re-check every minute in case the page stays open across threshold
    const id = setInterval(apply, 60_000);
    return () => clearInterval(id);
  }, []);

  return null;
}
