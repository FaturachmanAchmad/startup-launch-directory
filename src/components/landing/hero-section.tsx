"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  productCount: number;
  userCount: number;
  isLoggedIn: boolean;
};

// Floating particle that drifts upward
function Particle({ style }: { style: React.CSSProperties }) {
  return (
    <span
      className="absolute rounded-full pointer-events-none"
      style={style}
    />
  );
}

const PARTICLES = [
  { size: 4,  left: "10%", delay: "0s",    dur: "6s",  opacity: 0.25, color: "#f97316" },
  { size: 6,  left: "20%", delay: "1.2s",  dur: "8s",  opacity: 0.15, color: "#fb923c" },
  { size: 3,  left: "35%", delay: "0.5s",  dur: "7s",  opacity: 0.2,  color: "#f97316" },
  { size: 5,  left: "50%", delay: "2s",    dur: "9s",  opacity: 0.12, color: "#fdba74" },
  { size: 4,  left: "62%", delay: "0.8s",  dur: "6.5s",opacity: 0.2,  color: "#f97316" },
  { size: 7,  left: "75%", delay: "1.8s",  dur: "8.5s",opacity: 0.1,  color: "#fb923c" },
  { size: 3,  left: "88%", delay: "0.3s",  dur: "7.5s",opacity: 0.18, color: "#f97316" },
  { size: 5,  left: "93%", delay: "2.5s",  dur: "6s",  opacity: 0.15, color: "#fdba74" },
];

// Orbit ring that slowly spins
function OrbitRing({ radius, duration, clockwise = true, children }: {
  radius: number; duration: string; clockwise?: boolean; children?: React.ReactNode;
}) {
  return (
    <div
      className="absolute top-1/2 left-1/2 rounded-full border border-orange-200/20 dark:border-orange-500/10"
      style={{
        width: radius * 2,
        height: radius * 2,
        marginLeft: -radius,
        marginTop: -radius,
        animation: `spin ${duration} linear infinite ${clockwise ? "" : "reverse"}`,
      }}
    >
      {children}
    </div>
  );
}

// Star dot positioned on orbit ring
function StarDot({ angle, color = "#f97316", size = 6 }: { angle: number; color?: string; size?: number }) {
  const rad = (angle * Math.PI) / 180;
  return (
    <span
      className="absolute rounded-full"
      style={{
        width: size, height: size,
        background: color,
        top: "50%", left: "50%",
        transform: `rotate(${angle}deg) translateX(50%) translateY(-50%)`,
        boxShadow: `0 0 ${size * 2}px ${color}`,
      }}
    />
  );
}

export function HeroSection({ productCount, userCount, isLoggedIn }: Props) {
  const [mounted, setMounted] = useState(false);
  const [rocketLaunched, setRocketLaunched] = useState(false);
  const rocketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Stagger mount for entrance animations
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  function handleRocketClick() {
    if (rocketLaunched) return;
    setRocketLaunched(true);
    setTimeout(() => setRocketLaunched(false), 2000);
  }

  return (
    <section className="relative py-24 px-4 overflow-hidden min-h-[600px] flex items-center">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-background to-background dark:from-orange-950/20 dark:via-background dark:to-background" />

      {/* Radial glow behind hero center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-orange-500/5 blur-3xl" />
      </div>

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <Particle
          key={i}
          style={{
            width: p.size,
            height: p.size,
            left: p.left,
            bottom: "-10px",
            background: p.color,
            opacity: p.opacity,
            animation: `float-up ${p.dur} ${p.delay} ease-in infinite`,
          }}
        />
      ))}

      {/* Orbit rings — decorative, centered */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <OrbitRing radius={220} duration="30s" clockwise>
          <StarDot angle={30}  color="#f97316" size={5} />
          <StarDot angle={200} color="#fdba74" size={3} />
        </OrbitRing>
        <OrbitRing radius={320} duration="50s" clockwise={false}>
          <StarDot angle={80}  color="#fb923c" size={4} />
          <StarDot angle={260} color="#f97316" size={6} />
        </OrbitRing>
        <OrbitRing radius={420} duration="70s" clockwise>
          <StarDot angle={140} color="#fdba74" size={3} />
          <StarDot angle={310} color="#f97316" size={5} />
        </OrbitRing>
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Main content */}
      <div className="relative container max-w-4xl mx-auto text-center z-10">

        {/* Status pill */}
        <div
          className="inline-flex items-center gap-2 rounded-full border bg-background/80 backdrop-blur-sm px-4 py-1.5 text-xs font-medium text-muted-foreground mb-8 shadow-sm"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}
        >
          <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-600 dark:text-green-400 font-semibold">{productCount}</span>
          <span>products launched by</span>
          <span className="text-foreground font-semibold">{userCount}+</span>
          <span>makers</span>
        </div>

        {/* Rocket icon — clickable, launches on click */}
        <div
          ref={rocketRef}
          onClick={handleRocketClick}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-xl shadow-orange-500/30 mb-8 cursor-pointer select-none hover:scale-105 active:scale-95 transition-transform"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted
              ? rocketLaunched
                ? "translateY(-120px) rotate(-45deg) scale(0.5)"
                : "translateY(0) rotate(0) scale(1)"
              : "translateY(20px)",
            transition: rocketLaunched
              ? "transform 0.8s cubic-bezier(0.2, 0, 0.8, 1), opacity 0.8s ease"
              : "opacity 0.6s ease 0.1s, transform 0.3s ease",
          }}
          title="Click to launch 🚀"
        >
          <Rocket className="h-9 w-9 text-white" style={{ transform: "rotate(-45deg)" }} />
        </div>

        {/* Smoke trail when launched */}
        {rocketLaunched && (
          <div className="absolute left-1/2 -translate-x-1/2 top-[calc(50%-60px)] pointer-events-none">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="absolute rounded-full bg-orange-400/30"
                style={{
                  width: 8 + i * 4,
                  height: 8 + i * 4,
                  left: `${(i - 2) * 8}px`,
                  top: `${i * 18}px`,
                  animation: `smoke-puff 0.8s ${i * 0.1}s ease-out forwards`,
                }}
              />
            ))}
          </div>
        )}

        {/* Headline */}
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s",
          }}
        >
          Discover the next{" "}
          <span className="relative inline-block">
            <span className="text-orange-500">big thing</span>
            {/* Underline squiggle */}
            <svg
              className="absolute -bottom-1 left-0 w-full"
              viewBox="0 0 200 8"
              fill="none"
              preserveAspectRatio="none"
              style={{ height: 8 }}
            >
              <path
                d="M0 6 Q25 2 50 6 Q75 10 100 6 Q125 2 150 6 Q175 10 200 6"
                stroke="#f97316"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
                style={{
                  strokeDasharray: 300,
                  strokeDashoffset: mounted ? 0 : 300,
                  transition: "stroke-dashoffset 1s ease 0.8s",
                }}
              />
            </svg>
          </span>
          <br />
          before everyone else
        </h1>

        {/* Subheading */}
        <p
          className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.6s ease 0.35s, transform 0.6s ease 0.35s",
          }}
        >
          LaunchDir is where indie makers and startup founders come to launch,
          discover, and promote their products. Join thousands of builders sharing
          what they make.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.6s ease 0.5s, transform 0.6s ease 0.5s",
          }}
        >
          <Link href="/products">
            <Button size="lg" className="gap-2 w-full sm:w-auto shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all">
              Explore Products
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={isLoggedIn ? "/submit" : "/register"}>
            <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto hover:-translate-y-0.5 transition-all">
              <Rocket className="h-4 w-4 text-orange-500" />
              {isLoggedIn ? "Submit Your Product" : "Get Started Free"}
            </Button>
          </Link>
        </div>

        {/* Floating mini-cards hinting at products */}
        <div
          className="mt-14 flex items-center justify-center gap-3 flex-wrap"
          style={{
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.8s ease 0.8s",
          }}
        >
          {["🚀 SaaS", "🤖 AI Tools", "📱 Mobile", "🛠️ Dev Tools", "🎨 Design"].map((label, i) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border bg-background/60 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:border-orange-300 dark:hover:border-orange-700 transition-colors cursor-default select-none"
              style={{
                animation: "float-bob 3s ease-in-out infinite",
                animationDelay: `${i * 0.4}s`,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}