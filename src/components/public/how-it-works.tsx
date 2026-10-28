import { Search, CreditCard, Home } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Pilih Villa",
    description: "Cek ketersediaan dan pilih villa yang sesuai kebutuhan Anda",
  },
  {
    icon: CreditCard,
    title: "Konfirmasi & Bayar",
    description: "Isi data tamu dan lakukan pembayaran melalui sistem kami",
  },
  {
    icon: Home,
    title: "Check In",
    description: "Datang dan nikmati liburan di villa pilihan Anda!",
  },
];

export function HowItWorks() {
  return (
    <section
      className="relative overflow-hidden py-24"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in srgb, var(--accent) 6%, #ffffff) 0%, color-mix(in srgb, var(--accent) 12%, #ffffff) 50%, color-mix(in srgb, var(--accent) 18%, #ffffff) 100%)",
      }}
    >
      {/* Subtle texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, color-mix(in srgb, var(--accent) 15%, transparent) 0%, transparent 60%), radial-gradient(circle at 80% 20%, color-mix(in srgb, var(--accent) 10%, transparent) 0%, transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-accent font-semibold">
            Proses Mudah
          </p>
          <h2 className="font-display text-3xl font-medium text-primary-dark lg:text-4xl">
            Cara Booking
          </h2>
        </div>

        {/* Steps */}
        <div className="relative grid gap-8 md:grid-cols-3 md:gap-0">
          {/* Connector line (desktop) */}
          <div
            className="absolute left-1/6 right-1/6 top-8 hidden h-px md:block"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--accent) 40%, transparent) 20%, color-mix(in srgb, var(--accent) 40%, transparent) 80%, transparent 100%)",
            }}
          />

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative flex flex-col items-center px-6 text-center">
                {/* Step number */}
                <span
                  className="mb-4 font-display text-6xl font-medium leading-none"
                  style={{ color: "color-mix(in srgb, var(--accent) 25%, transparent)" }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                {/* Icon circle */}
                <div
                  className="relative z-10 mb-5 flex h-16 w-16 items-center justify-center rounded-full"
                  style={{
                    background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)",
                    boxShadow: "0 4px 20px color-mix(in srgb, var(--accent) 30%, transparent)",
                  }}
                >
                  <Icon className="h-7 w-7 text-white" strokeWidth={1.5} />
                </div>

                {/* Text */}
                <h3
                  className="mb-2 text-base font-semibold tracking-wide"
                  style={{ color: "var(--primary)" }}
                >
                  {step.title}
                </h3>
                <p className="max-w-45 text-sm leading-relaxed text-gray-600">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
