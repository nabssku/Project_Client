"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Grid,
  Maximize2,
} from "lucide-react";

interface VillaGalleryProps {
  images: string[];
  villaName: string;
}

export function VillaGallery({ images, villaName }: VillaGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const total = images.length;

  // Open modal at specific index
  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Keyboard navigation & lock scroll
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [lightboxOpen, nextImage, prevImage]);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-72 sm:h-96 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400">
        Belum ada foto tersedia
      </div>
    );
  }

  // Layout decision based on number of images
  const renderGalleryGrid = () => {
    // 1 image
    if (total === 1) {
      return (
        <div
          onClick={() => openLightbox(0)}
          className="relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer group"
        >
          <Image
            src={images[0]}
            alt={villaName}
            fill
            priority
            sizes="100vw"
            className="object-cover group-hover:scale-103 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="p-3 rounded-full bg-white/90 text-slate-900 shadow-lg backdrop-blur-xs">
              <Maximize2 className="h-5 w-5" />
            </span>
          </div>
        </div>
      );
    }

    // 2 images
    if (total === 2) {
      return (
        <>
          {/* Mobile (< md): 2 stacked images */}
          <div className="flex flex-col gap-2 h-full md:hidden">
            {images.map((img, idx) => (
              <div
                key={idx}
                onClick={() => openLightbox(idx)}
                className="relative flex-1 min-h-0 rounded-xl overflow-hidden cursor-pointer group"
              >
                <Image
                  src={img}
                  alt={`${villaName} ${idx + 1}`}
                  fill
                  priority={idx === 0}
                  sizes="100vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>

          {/* Desktop (md:): 2 columns 50%-50% */}
          <div className="hidden md:grid md:grid-cols-2 md:gap-3 md:h-full">
            {images.map((img, idx) => (
              <div
                key={idx}
                onClick={() => openLightbox(idx)}
                className="relative h-full rounded-2xl overflow-hidden cursor-pointer group"
              >
                <Image
                  src={img}
                  alt={`${villaName} ${idx + 1}`}
                  fill
                  priority={idx === 0}
                  sizes="50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </>
      );
    }

    // 3 images
    if (total === 3) {
      return (
        <>
          {/* Mobile (< md): 1 top hero + 2 bottom thumbnails */}
          <div className="flex flex-col gap-2 h-full md:hidden">
            <div
              onClick={() => openLightbox(0)}
              className="relative flex-1 min-h-0 rounded-xl overflow-hidden cursor-pointer group"
            >
              <Image
                src={images[0]}
                alt={villaName}
                fill
                priority
                sizes="100vw"
                className="object-cover group-hover:scale-103 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="p-2.5 rounded-full bg-white/90 text-slate-900 shadow-lg backdrop-blur-xs">
                  <Maximize2 className="h-4 w-4" />
                </span>
              </div>
              <div className="absolute bottom-2.5 right-2.5 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-medium shadow-sm">
                <Grid className="h-3.5 w-3.5 text-accent" />
                <span>3 Foto</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 h-[86px] sm:h-[105px] shrink-0">
              {images.slice(1, 3).map((img, idx) => (
                <div
                  key={idx + 1}
                  onClick={() => openLightbox(idx + 1)}
                  className="relative h-full rounded-lg sm:rounded-xl overflow-hidden cursor-pointer group"
                >
                  <Image
                    src={img}
                    alt={`${villaName} ${idx + 2}`}
                    fill
                    sizes="50vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>

          {/* Desktop (md:): col-span-8 hero + col-span-4 (2 stacked) */}
          <div className="hidden md:grid md:grid-cols-12 md:gap-3 md:h-full">
            <div
              onClick={() => openLightbox(0)}
              className="md:col-span-8 relative h-full rounded-2xl overflow-hidden cursor-pointer group"
            >
              <Image
                src={images[0]}
                alt={villaName}
                fill
                priority
                sizes="66vw"
                className="object-cover group-hover:scale-103 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="p-3 rounded-full bg-white/90 text-slate-900 shadow-lg backdrop-blur-xs">
                  <Maximize2 className="h-5 w-5" />
                </span>
              </div>
            </div>

            <div className="md:col-span-4 grid grid-cols-1 gap-3 h-full">
              {images.slice(1, 3).map((img, idx) => (
                <div
                  key={idx + 1}
                  onClick={() => openLightbox(idx + 1)}
                  className="relative h-full rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group"
                >
                  <Image
                    src={img}
                    alt={`${villaName} ${idx + 2}`}
                    fill
                    sizes="33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        </>
      );
    }

    // 4 or more images (total >= 4)
    const mobileThumbnails = images.slice(1, 4);

    return (
      <>
        {/* MOBILE BENTO LAYOUT (< md) */}
        <div className="flex flex-col gap-2 h-full md:hidden">
          {/* Main Hero Photo (Mobile) */}
          <div
            onClick={() => openLightbox(0)}
            className="relative flex-1 min-h-0 rounded-xl overflow-hidden cursor-pointer group"
          >
            <Image
              src={images[0]}
              alt={villaName}
              fill
              priority
              sizes="100vw"
              className="object-cover group-hover:scale-103 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="p-2.5 rounded-full bg-white/90 text-slate-900 shadow-lg backdrop-blur-xs">
                <Maximize2 className="h-4 w-4" />
              </span>
            </div>
            <div className="absolute bottom-2.5 right-2.5 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-medium shadow-sm">
              <Grid className="h-3.5 w-3.5 text-accent" />
              <span>{total} Foto</span>
            </div>
          </div>

          {/* Bottom 3 Thumbnails Row (Mobile) */}
          <div className="grid grid-cols-3 gap-2 h-[86px] sm:h-[105px] shrink-0">
            {mobileThumbnails.map((img, idx) => {
              const actualIndex = idx + 1;
              const isLastSlot = idx === 2;
              const showMoreBadge = isLastSlot && total > 4;

              return (
                <div
                  key={actualIndex}
                  onClick={() => openLightbox(actualIndex)}
                  className="relative h-full rounded-lg sm:rounded-xl overflow-hidden cursor-pointer group"
                >
                  <Image
                    src={img}
                    alt={`${villaName} ${actualIndex + 1}`}
                    fill
                    sizes="33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {showMoreBadge ? (
                    <div className="absolute inset-0 bg-primary-dark/80 backdrop-blur-2xs flex flex-col items-center justify-center text-center p-1 text-white group-hover:bg-primary-dark/90 transition-colors">
                      <Grid className="h-4 w-4 text-accent mb-0.5" />
                      <span className="text-xs font-bold font-display leading-tight">
                        +{total - 3} Foto
                      </span>
                      <span className="text-[9px] text-white/75 mt-0.5">
                        Lihat Semua
                      </span>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* DESKTOP BENTO LAYOUT (md: and up) */}
        {total <= 6 ? (
          // 4 to 6 images on Desktop
          <div className="hidden md:grid md:grid-cols-12 md:gap-3 md:h-full">
            <div
              onClick={() => openLightbox(0)}
              className="md:col-span-6 lg:col-span-7 relative h-full rounded-2xl overflow-hidden cursor-pointer group"
            >
              <Image
                src={images[0]}
                alt={villaName}
                fill
                priority
                sizes="(max-width: 1024px) 50vw, 60vw"
                className="object-cover group-hover:scale-103 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="p-3 rounded-full bg-white/90 text-slate-900 shadow-lg backdrop-blur-xs">
                  <Maximize2 className="h-5 w-5" />
                </span>
              </div>
            </div>

            {total === 4 ? (
              // 4 images: 1 top spanning 2 cols, 2 bottom
              <div className="md:col-span-6 lg:col-span-5 grid grid-cols-2 gap-3 h-full">
                <div
                  onClick={() => openLightbox(1)}
                  className="col-span-2 relative h-full rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group"
                >
                  <Image
                    src={images[1]}
                    alt={`${villaName} 2`}
                    fill
                    sizes="50vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {images.slice(2, 4).map((img, idx) => (
                  <div
                    key={idx + 2}
                    onClick={() => openLightbox(idx + 2)}
                    className="col-span-1 relative h-full rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group"
                  >
                    <Image
                      src={img}
                      alt={`${villaName} ${idx + 3}`}
                      fill
                      sizes="25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            ) : (
              // 5 or 6 images: 2x2 grid
              <div className="md:col-span-6 lg:col-span-5 grid grid-cols-2 gap-3 h-full">
                {images.slice(1, 5).map((img, idx) => {
                  const actualIndex = idx + 1;
                  const isFourthSlot = idx === 3;
                  const showDesktopOverlay = isFourthSlot && total > 5;

                  return (
                    <div
                      key={actualIndex}
                      onClick={() => openLightbox(actualIndex)}
                      className="relative h-full rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group"
                    >
                      <Image
                        src={img}
                        alt={`${villaName} ${actualIndex + 1}`}
                        fill
                        sizes="25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {showDesktopOverlay ? (
                        <div className="absolute inset-0 bg-primary-dark/75 backdrop-blur-2xs flex flex-col items-center justify-center text-center p-2 text-white group-hover:bg-primary-dark/85 transition-colors">
                          <Grid className="h-5 w-5 text-accent mb-1" />
                          <span className="text-xs sm:text-sm font-bold font-display leading-tight">
                            +{total - 4} Foto
                          </span>
                          <span className="text-[10px] text-white/70 mt-0.5">
                            Lihat Semua
                          </span>
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          // 7 or more images on Desktop (1 Hero + 6 Thumbnails)
          <div className="hidden md:grid md:grid-cols-12 md:gap-3 md:h-full">
            {/* Main Cover (Left) */}
            <div
              onClick={() => openLightbox(0)}
              className="md:col-span-6 lg:col-span-6 relative h-full rounded-2xl overflow-hidden cursor-pointer group"
            >
              <Image
                src={images[0]}
                alt={villaName}
                fill
                priority
                sizes="50vw"
                className="object-cover group-hover:scale-103 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="p-3 rounded-full bg-white/90 text-slate-900 shadow-lg backdrop-blur-xs">
                  <Maximize2 className="h-5 w-5" />
                </span>
              </div>
            </div>

            {/* Right 6 Photos (2 cols x 3 rows or 3 cols x 2 rows) */}
            <div className="md:col-span-6 lg:col-span-6 grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 h-full">
              {images.slice(1, 7).map((img, idx) => {
                const actualIndex = idx + 1;
                const isLastVisible = idx === 5 && total > 7;

                return (
                  <div
                    key={actualIndex}
                    onClick={() => openLightbox(actualIndex)}
                    className="relative h-full rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group"
                  >
                    <Image
                      src={img}
                      alt={`${villaName} ${actualIndex + 1}`}
                      fill
                      sizes="(max-width: 1024px) 25vw, 17vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {isLastVisible ? (
                      <div className="absolute inset-0 bg-primary-dark/75 backdrop-blur-2xs flex flex-col items-center justify-center text-center p-2 text-white group-hover:bg-primary-dark/85 transition-colors">
                        <Grid className="h-5 w-5 text-accent mb-1" />
                        <span className="text-xs sm:text-sm font-bold font-display leading-tight">
                          +{total - 6} Foto
                        </span>
                        <span className="text-[10px] text-white/70 mt-0.5">
                          Lihat Semua
                        </span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      {/* Gallery Container */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden h-[340px] sm:h-[400px] md:h-[480px] lg:h-[520px] bg-slate-100 shadow-sm">
        {renderGalleryGrid()}

        {/* Floating Button for Desktop */}
        {total > 1 && (
          <button
            type="button"
            onClick={() => openLightbox(0)}
            className="hidden md:inline-flex absolute bottom-4 right-4 z-20 items-center gap-2 rounded-xl bg-white/95 backdrop-blur-md px-4 py-2.5 text-xs sm:text-sm font-semibold text-primary shadow-lg border border-black/5 hover:bg-white hover:scale-102 transition-all cursor-pointer"
          >
            <Grid className="h-4 w-4 text-accent" />
            <span>Lihat semua foto ({total} foto)</span>
          </button>
        )}
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-between bg-[#0b0b10]/96 backdrop-blur-xl text-white select-none animate-in fade-in duration-200"
          onClick={closeLightbox}
        >
          {/* Top Bar (Floating Minimalist) */}
          <div
            className="flex items-center justify-between px-6 py-4 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium tracking-wide text-white/90 font-display">
                {villaName}
              </h3>
              <span className="text-xs text-white/30">•</span>
              <span className="text-xs font-mono font-medium text-accent tracking-widest">
                {String(currentIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </span>
            </div>

            <button
              onClick={closeLightbox}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all text-xs cursor-pointer group"
              aria-label="Tutup Galeri"
            >
              <span className="hidden sm:inline text-[11px] text-white/50 group-hover:text-white/80">Esc</span>
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Main Photo Area */}
          <div
            className="relative flex-1 flex items-center justify-center px-4 sm:px-16 min-h-0"
            onClick={closeLightbox}
          >
            {/* Prev Button */}
            {total > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-3 sm:left-6 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                aria-label="Foto Sebelumnya"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {/* Current Active Image */}
            <div
              className="relative w-full h-full max-w-6xl max-h-[82vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[currentIndex]}
                alt={`${villaName} foto ${currentIndex + 1}`}
                fill
                priority
                sizes="(max-width: 1400px) 100vw, 1400px"
                className="object-contain drop-shadow-2xl rounded-lg sm:rounded-xl transition-all duration-300"
              />
            </div>

            {/* Next Button */}
            {total > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-3 sm:right-6 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                aria-label="Foto Berikutnya"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Bottom Floating Minimalist Thumbnail Strip */}
          {total > 1 && (
            <div
              className="flex items-center justify-center py-4 px-6 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 max-w-full overflow-x-auto py-1 px-2 scrollbar-none rounded-2xl bg-black/30 backdrop-blur-md border border-white/5">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative h-11 sm:h-13 aspect-4/3 rounded-lg overflow-hidden shrink-0 transition-all duration-200 cursor-pointer ${
                      currentIndex === idx
                        ? "ring-2 ring-accent ring-offset-1 ring-offset-black scale-105 opacity-100 shadow-md"
                        : "opacity-40 hover:opacity-80"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Foto ${idx + 1}`}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
