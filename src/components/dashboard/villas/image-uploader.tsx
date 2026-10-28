"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { UploadCloud, X, Star, Loader2, Sparkles, AlertCircle } from "lucide-react";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxFiles?: number;
}

export function ImageUploader({ images, onChange, maxFiles = 10 }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const remainingSlots = maxFiles - images.length;
    if (remainingSlots <= 0) {
      setError(`Maksimal ${maxFiles} foto per villa.`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setIsUploading(true);

    const uploadedUrls: string[] = [];

    try {
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload/villa-image", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Gagal mengunggah gambar");
        }

        if (data.url) {
          uploadedUrls.push(data.url);
        }
      }

      if (uploadedUrls.length > 0) {
        onChange([...images, ...uploadedUrls]);
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat upload.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleRemove(index: number) {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  }

  function handleSetCover(index: number) {
    if (index === 0) return;
    const target = images[index];
    const rest = images.filter((_, i) => i !== index);
    onChange([target, ...rest]);
  }

  return (
    <div className="space-y-4">
      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
          dragOver
            ? "border-accent bg-accent/5"
            : "border-[#e8e6df] bg-white hover:border-accent/50 hover:bg-[#f8f7f4]/50"
        } ${isUploading ? "pointer-events-none opacity-70" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-xs font-semibold text-primary">
              Mengunggah & Menerapkan Watermark di Tengah...
            </p>
            <p className="text-[11px] text-slate-400">
              Mengonversi ke format WebP teroptimasi Cloudflare R2
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-accent">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-primary">
                Klik atau seret foto villa ke sini
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Mendukung JPG, PNG, WebP (Maks. 15MB per foto)
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 text-[10px] font-bold text-[#9c7827] border border-accent/30 mt-1">
              <Sparkles className="h-3 w-3" />
              <span>Otomatis Watermark</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Gallery Grid */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-primary">
              Galeri Foto ({images.length}/{maxFiles})
            </p>
            <span className="text-[11px] text-slate-400">
              *Foto pertama adalah foto sampul utama
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {images.map((url, idx) => (
              <div
                key={url + idx}
                className="group relative aspect-4/3 rounded-xl overflow-hidden border border-[#e8e6df] bg-slate-100 shadow-2xs"
              >
                <Image
                  src={url}
                  alt={`Villa photo ${idx + 1}`}
                  fill
                  sizes="200px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Cover badge */}
                {idx === 0 && (
                  <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/90 text-accent text-[10px] font-bold shadow-xs backdrop-blur-xs">
                    <Star className="h-3 w-3 fill-accent text-accent" />
                    Sampul
                  </span>
                )}

                {/* Action buttons on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                  {idx !== 0 && (
                    <button
                      type="button"
                      onClick={() => handleSetCover(idx)}
                      title="Jadikan foto sampul utama"
                      className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 shadow-xs transition-colors"
                    >
                      <Star className="h-4 w-4 text-accent" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    title="Hapus foto"
                    className="p-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white shadow-xs transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
