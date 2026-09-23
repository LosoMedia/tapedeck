import { useEffect, useState, useRef } from 'react';

// ─── VU Meter ──────────────────────────────────────────────
// A stereo VU meter with animated LED segments, inspired by
// vintage console metering. Pass `active` to animate.

const SEGMENTS = 14;

function MeterBar({ active, delay }: { active: boolean; delay: number }) {
  const [levels, setLevels] = useState<number[]>([]);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setLevels(new Array(SEGMENTS).fill(0));
      return;
    }

    let lastTime = 0;
    const interval = 120;

    const tick = (time: number) => {
      if (time - lastTime >= interval) {
        lastTime = time;
        setLevels((prev) => {
          const next = [...prev];
          for (let i = 0; i < SEGMENTS; i++) {
            const target = Math.random() * (1 - i / SEGMENTS * 0.7);
            next[i] = prev[i] + (target - prev[i]) * 0.5;
          }
          return next;
        });
      }
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [active]);

  return (
    <div className="flex flex-col-reverse gap-0.5 h-full" style={{ animationDelay: `${delay}ms` }}>
      {levels.map((level, i) => {
        const threshold = i / SEGMENTS;
        const lit = level > threshold;
        let color = 'bg-signal-green';
        if (i > SEGMENTS * 0.7) color = 'bg-signal-amber';
        if (i > SEGMENTS * 0.88) color = 'bg-signal-red';
        return (
          <div
            key={i}
            className={`h-1.5 rounded-sm transition-all duration-100 ${
              lit ? `${color} shadow-sm` : 'bg-ink-700'
            }`}
            style={{ opacity: lit ? 1 : 0.15 }}
          />
        );
      })}
    </div>
  );
}

export function VUMeter({ active = true, label = 'VU' }: { active?: boolean; label?: string }) {
  return (
    <div className="inline-flex flex-col gap-1 bg-ink-900 border border-ink-600/60 rounded-md p-2">
      <div className="flex items-center justify-between px-0.5">
        <span className="font-mono text-[9px] uppercase tracking-widest text-cream-300/60">{label}</span>
        <span className="font-mono text-[9px] text-gold-500/60">dB</span>
      </div>
      <div className="flex gap-1.5 h-16">
        <MeterBar active={active} delay={0} />
        <MeterBar active={active} delay={60} />
      </div>
      <div className="flex justify-between px-0.5">
        <span className="font-mono text-[8px] text-cream-300/40">L</span>
        <span className="font-mono text-[8px] text-cream-300/40">R</span>
      </div>
    </div>
  );
}

// ─── Waveform ──────────────────────────────────────────────
// Static decorative waveform rendered from a seeded pattern.
// Pass `bars` to control density and `active` for animation.

export function Waveform({
  bars = 48,
  active = false,
  className = '',
  progress = 0,
}: {
  bars?: number;
  active?: boolean;
  className?: string;
  progress?: number;
}) {
  const heights = useRef<number[]>(
    Array.from({ length: bars }, (_, i) => {
      const base = Math.sin(i * 0.5) * 0.3 + 0.4;
      const noise = Math.sin(i * 1.7 + 2.3) * 0.2;
      return Math.max(0.08, Math.min(1, base + noise + Math.random() * 0.15));
    })
  );

  return (
    <div className={`flex items-center gap-[2px] ${className}`}>
      {heights.current.map((h, i) => {
        const isPast = i / bars <= progress;
        return (
          <div
            key={i}
            className={`flex-1 rounded-full transition-colors duration-200 ${
              isPast ? 'bg-gold-500' : 'bg-ink-500'
            } ${active && i / bars > progress ? 'animate-pulse-soft' : ''}`}
            style={{
              height: `${h * 100}%`,
              animationDelay: `${i * 30}ms`,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Tape Reels ────────────────────────────────────────────
// Decorative spinning tape reels for the hero section.

export function TapeReels({ spinning = true, size = 'md' }: { spinning?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'w-12 h-12' : size === 'lg' ? 'w-24 h-24' : 'w-16 h-16';

  return (
    <div className="flex items-center gap-3">
      <div className={`${dim} relative`}>
        <div
          className={`w-full h-full rounded-full border-2 border-ink-500 bg-ink-800 ${
            spinning ? 'animate-spin-slow' : ''
          }`}
        >
          <div className="absolute inset-2 rounded-full border border-ink-600" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-gold-500/60" />
          </div>
          {[0, 72, 144, 216, 288].map((deg) => (
            <div
              key={deg}
              className="absolute top-1/2 left-1/2 w-3 h-1 bg-ink-500 rounded-full"
              style={{
                transform: `rotate(${deg}deg) translateY(-${size === 'lg' ? 28 : size === 'md' ? 20 : 14}px)`,
                transformOrigin: 'center',
              }}
            />
          ))}
        </div>
      </div>
      <div className={`${dim} relative`}>
        <div
          className={`w-full h-full rounded-full border-2 border-ink-500 bg-ink-800 ${
            spinning ? 'animate-spin-reverse-slow' : ''
          }`}
        >
          <div className="absolute inset-2 rounded-full border border-ink-600" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-gold-500/60" />
          </div>
          {[0, 72, 144, 216, 288].map((deg) => (
            <div
              key={deg}
              className="absolute top-1/2 left-1/2 w-3 h-1 bg-ink-500 rounded-full"
              style={{
                transform: `rotate(${deg}deg) translateY(-${size === 'lg' ? 28 : size === 'md' ? 20 : 14}px)`,
                transformOrigin: 'center',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Knob ──────────────────────────────────────────────────
// A decorative analog knob with indicator dot.

export function Knob({
  value = 50,
  label = 'LEVEL',
  size = 'md',
}: {
  value?: number;
  label?: string;
  size?: 'sm' | 'md';
}) {
  const dim = size === 'sm' ? 'w-10 h-10' : 'w-14 h-14';
  const angle = -135 + (value / 100) * 270;

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div className={`${dim} relative rounded-full bg-gradient-to-br from-ink-600 to-ink-800 border border-ink-500/50 shadow-inner`}>
        <div
          className="absolute top-1/2 left-1/2 w-1 h-3 bg-gold-500 rounded-full"
          style={{
            transform: `translate(-50%, -100%) rotate(${angle}deg)`,
            transformOrigin: 'bottom center',
          }}
        />
        <div className="absolute inset-2 rounded-full bg-ink-850 border border-ink-600/30" />
      </div>
      <span className="font-mono text-[8px] uppercase tracking-widest text-cream-300/50">{label}</span>
    </div>
  );
}

// ─── Star Rating ───────────────────────────────────────────

export function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const starSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.floor(rating);
        const half = !filled && i - 0.5 <= rating;
        return (
          <svg
            key={i}
            className={`${starSize} ${filled || half ? 'text-gold-500' : 'text-ink-500'}`}
            viewBox="0 0 24 24"
            fill={filled ? 'currentColor' : half ? 'url(#half)' : 'none'}
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <defs>
              <linearGradient id="half">
                <stop offset="50%" stopColor="#d4a843" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      })}
      <span className="ml-1 font-mono text-xs text-cream-300/70">{rating.toFixed(1)}</span>
    </div>
  );
}
