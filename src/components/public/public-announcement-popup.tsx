"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { X, Sparkles, ArrowRight } from "lucide-react";

export function PublicAnnouncementPopup() {
  const [popup, setPopup] = useState<any | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    async function checkActivePopup() {
      try {
        const res = await fetch("/api/public/popups");
        if (!res.ok) return;

        const data = await res.json();
        if (data.popup) {
          const isDismissed = sessionStorage.getItem(`dismissed_popup_${data.popup.id}`);
          if (!isDismissed) {
            setPopup(data.popup);
            // Delay appearance by 2.5 seconds for a non-intrusive experience
            timer = setTimeout(() => {
              setIsVisible(true);
            }, 2500);
          }
        }
      } catch (err) {
        // Silent fail if network or DB issue
      }
    }

    checkActivePopup();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleDismiss = () => {
    if (popup) {
      sessionStorage.setItem(`dismissed_popup_${popup.id}`, "true");
    }
    setIsVisible(false);
  };

  if (!popup || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/20 w-full max-w-md text-center relative animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          aria-label="Tutup promo"
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer shadow-md backdrop-blur-xs"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Banner Image */}
        {popup.imageUrl ? (
          <div className="relative h-48 bg-gray-100 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={popup.imageUrl}
              alt={popup.title}
              className="w-full h-full object-cover"
            />
            {popup.badge && (
              <span className="absolute bottom-3 left-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent text-white shadow-md">
                {popup.badge}
              </span>
            )}
          </div>
        ) : (
          popup.badge && (
            <div className="pt-6 pb-1">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-accent/15 text-accent">
                {popup.badge}
              </span>
            </div>
          )
        )}

        {/* Text Content */}
        <div className="p-6 sm:p-7 space-y-3">
          <h2 className="font-display font-bold text-xl sm:text-2xl text-primary leading-snug">
            {popup.title}
          </h2>

          {popup.subtitle && (
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
              {popup.subtitle}
            </p>
          )}

          {/* Action CTA Button */}
          {popup.actionLabel && (
            <div className="pt-4">
              <Link
                href={popup.actionUrl || "/villas"}
                onClick={handleDismiss}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-primary hover:bg-accent text-white text-sm font-semibold transition-all duration-300 shadow-md group cursor-pointer"
              >
                <span>{popup.actionLabel}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}

          <button
            onClick={handleDismiss}
            className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors pt-2 block mx-auto cursor-pointer"
          >
            Lewati untuk saat ini
          </button>
        </div>
      </div>
    </div>
  );
}
