"use client";

import { useState } from "react";
import { Building2, Users, Star, Calendar, User } from "lucide-react";

interface HeroProps {
  config: Record<string, string>;
}

export function Hero({ config }: HeroProps) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden grain">
      {/* Video Background */}
      <div className="absolute inset-0">
        {config.hero_video ? (
          <iframe
            src={`${config.hero_video}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full aspect-video"
            allow="autoplay; encrypted-media"
            style={{ border: "none", pointerEvents: "none" }}
          />
        ) : (
          <div className="absolute inset-0 bg-primary-dark" />
        )}
        {/* Gradient Overlay - customizable via hero_gradient_accent */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(26,26,46,0.7) 50%, ${config.hero_gradient_accent || '#1a1a2e'}95 100%)`
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full pt-20 pb-24 sm:pt-24 sm:pb-40">
        <div className="text-center max-w-3xl mx-auto">
          {/* Tagline */}
          <div className="overflow-hidden mb-4">
            <p className="hero-animate text-accent font-medium tracking-[0.3em] uppercase text-sm">
              {config.hero_tagline || "Hai, Hallo Tatangga"}
            </p>
          </div>

          {/* Main Heading */}
          <div className="overflow-hidden mb-3">
            <h1 className="hero-animate hero-animate-delay-1 font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[0.95] tracking-tight">
              {config.hero_title || "Tittle"}
            </h1>
          </div>

          {/* Italic Heading */}
          <div className="overflow-hidden mb-8">
            <h1 className="hero-animate hero-animate-delay-2 font-display text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white/40 leading-[0.95] tracking-tight italic">
              {config.hero_title_italic || "Tittle Italic"}
            </h1>
          </div>

          {/* Subtitle */}
          <div className="overflow-hidden mb-12">
            <p className="hero-animate hero-animate-delay-3 text-white/45 text-lg max-w-lg mx-auto leading-relaxed">
              {config.hero_subtitle || "Pengalaman menginap lengkap untuk momen yang lebih berkesan."}
            </p>
          </div>
        </div>

        {/* Search Form */}
        <div className="hero-animate hero-animate-delay-3">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 max-w-4xl mx-auto text-left">
            <div className="flex flex-col md:flex-row gap-2">
              {/* Check-in */}
              <div className="relative flex-1">
                <button
                  type="button"
                  className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 w-full text-left cursor-pointer hover:bg-white/15 transition-colors"
                >
                  <Calendar className="w-5 h-5 text-white/40 shrink-0" />
                  <span className="text-sm truncate text-white/40">
                    {checkIn || "Check-in"}
                  </span>
                </button>
              </div>

              {/* Check-out */}
              <div className="relative flex-1">
                <button
                  type="button"
                  className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 w-full text-left cursor-pointer hover:bg-white/15 transition-colors"
                >
                  <Calendar className="w-5 h-5 text-white/40 shrink-0" />
                  <span className="text-sm truncate text-white/40">
                    {checkOut || "Check-out"}
                  </span>
                </button>
              </div>

              {/* Guests */}
              <div className="relative md:w-36">
                <button
                  type="button"
                  className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 w-full text-left cursor-pointer hover:bg-white/15 transition-colors"
                >
                  <User className="w-5 h-5 text-white/40 shrink-0" />
                  <span className="text-white text-sm truncate">
                    {guests} Tamu
                  </span>
                </button>
              </div>

              {/* Search Button */}
              <button
                type="button"
                className="bg-accent hover:bg-accent-light text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                Cari
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="hidden sm:block absolute bottom-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-center gap-12 py-6 border-t border-white/10">
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-white">
                {config.stats_properties || "50+"}
              </p>
              <p className="text-white/30 text-xs">Properti</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-white">
                {config.stats_guests || "10K+"}
              </p>
              <p className="text-white/30 text-xs">Tamu</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-white">
                {config.stats_rating || "4.8"}
              </p>
              <p className="text-white/30 text-xs">Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="hidden sm:flex absolute bottom-24 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-white/20 z-10">
        <span className="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent" />
      </div>
    </section>
  );
}
