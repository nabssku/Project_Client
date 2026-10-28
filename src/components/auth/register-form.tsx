"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface RegisterFormProps {
  config: Record<string, string>;
}

export function RegisterForm({ config }: RegisterFormProps) {
  const router = useRouter();
  const siteName = config.site_name || "Villa";
  const siteLogo = config.site_logo || null;
  const initialLetter = siteName.charAt(0).toUpperCase();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Password tidak cocok");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mendaftar");
      }

      // Auto login after registration
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Pendaftaran berhasil, silakan login");
        router.push("/login");
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (err) {
      setError("Terjadi kesalahan saat login dengan Google");
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <Link className="lg:hidden flex justify-center mb-8" href="/">
            <div className="flex items-center gap-2.5">
              {siteLogo ? (
                <img
                  src={siteLogo}
                  alt={siteName}
                  className="h-9 w-auto max-w-[140px] object-contain"
                />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-primary-dark font-black text-sm">
                  {initialLetter}
                </span>
              )}
              <span className="text-xl font-bold font-display text-primary">
                {siteName}<span className="text-accent">.</span>
              </span>
            </div>
          </Link>

          <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-2">
            Daftar Akun
          </h1>
          <p className="text-gray-500 mb-8">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-accent font-medium hover:underline">
              Masuk
            </Link>
          </p>

          {/* Google Sign In */}
          <div className="w-full mb-6">
            <button
              onClick={handleGoogleSignIn}
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Daftar dengan Google
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-gray-400 text-xs font-medium uppercase tracking-wide">
              atau daftar dengan email
            </span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Nama Lengkap
              </label>
              <input
                required
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-cream border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10 transition-colors"
                placeholder="Nama Anda"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-cream border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10 transition-colors"
                placeholder="email@contoh.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-cream border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10 transition-colors"
                  placeholder="Minimal 8 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? "Sembunyikan" : "Lihat"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Konfirmasi Password
              </label>
              <div className="relative">
                <input
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-cream border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10 transition-colors"
                  placeholder="Ulangi password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? "Sembunyikan" : "Lihat"}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 py-1">
              <input
                required
                type="checkbox"
                id="terms"
                className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
              />
              <label htmlFor="terms" className="text-xs text-gray-600">
                Saya menyetujui{" "}
                <Link href="/terms" className="text-accent hover:underline">
                  Syarat & Ketentuan
                </Link>{" "}
                serta{" "}
                <Link href="/privacy" className="text-accent hover:underline">
                  Kebijakan Privasi
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white py-3.5 rounded-xl font-semibold hover:bg-accent-light transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Mendaftar..." : "Daftar Sekarang"}
            </button>
          </form>

          <p className="text-center text-gray-400 text-xs mt-8">
            <Link href="/" className="hover:text-gray-600">
              Kembali ke beranda
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Video & Welcome */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-dark relative overflow-hidden items-center justify-center grain">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-dark via-primary to-primary-dark"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl"></div>

        {/* Video Background */}
        <div className="absolute inset-0 overflow-hidden">
          <iframe
            src={config.auth_video || "https://www.youtube.com/embed/_hofBX5yvfE?autoplay=1&mute=1&loop=1&playlist=_hofBX5yvfE&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&fs=0&disablekb=1&iv_load_policy=3&cc_load_policy=0"}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.77777778vh] h-[56.25vw] min-h-full min-w-full"
            allow="autoplay; encrypted-media"
            style={{ border: 0, pointerEvents: "none" }}
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-primary-dark/80"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-16">
          <Link href="/" className="inline-flex items-center gap-3 mb-8 group">
            {siteLogo ? (
              <img
                src={siteLogo}
                alt={siteName}
                className="h-12 w-auto max-w-[180px] object-contain transition-transform group-hover:scale-105"
              />
            ) : (
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-primary-dark font-black text-base">
                {initialLetter}
              </span>
            )}
            <span className="text-2xl font-bold font-display text-white">
              {siteName}<span className="text-accent">.</span>
            </span>
          </Link>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            {config.register_title || "Bergabung Bersama Kami"}
            <br />
            <span className="italic text-white/40">Kami</span>
          </h2>
          <p className="text-white/40 max-w-sm mx-auto">
            {config.register_subtitle || "Daftar sekarang untuk mulai menikmati pengalaman booking villa yang mudah"}
          </p>
        </div>
      </div>
    </div>
  );
}
