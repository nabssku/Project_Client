"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { UploadCloud, X, Star, Loader2, Sparkles, AlertCircle } from "lucide-react";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxFiles?: number;
}

/**
 * Compresses an image in the browser before upload to prevent proxy 503/timeout
 * and reduce memory consumption on the server.
 */
async function compressImageBeforeUpload(file: File): Promise<File> {
  // If already under 800KB or not a standard image, upload directly
  if (file.size <= 800 * 1024 || !file.type.startsWith("image/")) {
    return file;
  }

  return new Promise((resolve) => {
    const img = document.createElement("img");
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        const maxDim = 1920;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const cleanName = file.name.replace(/\.[^.]+$/, ".webp");
            const compressed = new File([blob], cleanName, {
              type: "image/webp",
              lastModified: Date.now(),
            });
            resolve(compressed);
          },
          "image/webp",
          0.85
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export function ImageUploader({ images, onChange, maxFiles = 10 }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
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
      for (let i = 0; i < filesToUpload.length; i++) {
        const originalFile = filesToUpload[i];
        setUploadProgress(`Mengoptimalkan & mengunggah foto ${i + 1} dari ${filesToUpload.length}...`);

        // Compress high-res image client-side to prevent 503 / timeout
        const readyFile = await compressImageBeforeUpload(originalFile);

        const formData = new FormData();
        formData.append("file", readyFile);

        const res = await fetch("/api/upload/villa-image", {
          method: "POST",
          body: formData,
        });

        let data: any = {};
        try {
          data = await res.json();
        } catch {
          if (res.status === 503) {
            throw new Error("Server sedang sibuk (503 Service Unavailable). Coba lagi dalam beberapa saat.");
          }
          throw new Error(`Gagal mengunggah foto (Status ${res.status}).`);
        }

        if (!res.ok) {
          throw new Error(data.error || `Gagal mengunggah gambar (${res.status})`);
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
      setUploadProgress(null);
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
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center mb-3">
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6 text-accent" />
            )}
          </div>
          <p className="text-xs sm:text-sm font-semibold text-primary">
            {isUploading
              ? uploadProgress || "Sedang memproses & mengunggah gambar..."
              : "Klik atau seret foto villa ke sini"}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Mendukung JPG, PNG, WebP (Otomatis dioptimalkan & diberi watermark)
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-accent" /> Watermark Otomatis
            </span>
            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              Sisa slot: {maxFiles - images.length} foto
            </span>
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
          {images.map((imgUrl, index) => (
            <div
              key={index}
              className={`group relative aspect-4/3 rounded-xl overflow-hidden border bg-slate-50 ${
                index === 0 ? "border-accent ring-2 ring-accent/20" : "border-[#e8e6df]"
              }`}
            >
              <Image
                src={imgUrl}
                alt={`Foto villa ${index + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, 20vw"
                className="object-cover transition-transform group-hover:scale-105"
              />

              {/* Cover badge */}
              {index === 0 && (
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-accent text-white text-[9px] font-bold flex items-center gap-1 shadow-xs">
                  <Star className="w-2.5 h-2.5 fill-white" />
                  Foto Utama
                </div>
              )}

              {/* Action Buttons overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                {index !== 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetCover(index);
                    }}
                    title="Jadikan Foto Utama (Cover)"
                    className="p-1.5 rounded-lg bg-white/90 text-primary hover:bg-white transition-colors"
                  >
                    <Star className="w-3.5 h-3.5 text-accent" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(index);
                  }}
                  title="Hapus Foto"
                  className="p-1.5 rounded-lg bg-white/90 text-rose-600 hover:bg-white hover:text-rose-700 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
