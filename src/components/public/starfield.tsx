// Starfield — pure SVG, no JS runtime, safe for Server Components.
interface Star {
  cx: number;
  cy: number;
  r: number;
  opacity: number;
  delay: number;
}

function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateStars(count: number, seed = 42): Star[] {
  const rand = lcg(seed);
  return Array.from({ length: count }, () => ({
    cx: Math.round(rand() * 1440 * 10) / 10,
    cy: Math.round(rand() * 800 * 10) / 10,
    r: Math.round((0.4 + rand() * 1.4) * 10) / 10,
    opacity: Math.round((0.2 + rand() * 0.7) * 100) / 100,
    delay: Math.round(rand() * 6 * 10) / 10,
  }));
}

interface StarfieldProps {
  count?: number;
  seed?: number;
  className?: string;
}

export function Starfield({ count = 120, seed = 42, className = "" }: StarfieldProps) {
  const stars = generateStars(count, seed);

  return (
    <svg
      aria-hidden="true"
      className={`starfield-el pointer-events-none absolute inset-0 h-full w-full ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1440 800"
      preserveAspectRatio="xMidYMid slice"
    >
      {stars.map((star, i) => (
        <circle
          key={i}
          cx={star.cx}
          cy={star.cy}
          r={star.r}
          fill="white"
          opacity={star.opacity}
          className="star-twinkle"
          style={{ animationDelay: `${star.delay}s` }}
        />
      ))}
    </svg>
  );
}
