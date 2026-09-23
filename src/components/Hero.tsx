import { ArrowRight, Play } from 'lucide-react';
import { VUMeter, TapeReels, Waveform, Knob } from './analog';

interface HeroProps {
  onDiscover: () => void;
  onMakeItReal: () => void;
}

export function Hero({ onDiscover, onMakeItReal }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden grain pt-16">
      {/* Background image with heavy overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.pexels.com/photos/8197364/pexels-photo-8197364.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
          alt=""
          className="w-full h-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/85 to-ink-950/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-ink-950/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 w-full">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          {/* Left: text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold-500/30 bg-gold-500/5">
              <span className="w-2 h-2 rounded-full bg-signal-green animate-pulse-soft" />
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-gold-400">
                Where AI meets human musicians
              </span>
            </div>

            <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl text-cream-50 leading-[0.95]">
              MAKE IT
              <br />
              <span className="text-gradient-gold">REAL.</span>
            </h1>

            <p className="text-lg text-cream-200/70 max-w-xl leading-relaxed">
              Tape Deck is a music platform built to connect AI-created and human-created
              music with the people who can take those ideas further. Discover music,
              pitch projects, review records, find collaborators, and turn unfinished
              ideas into finished work.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button onClick={onDiscover} className="btn-primary">
                <Play className="w-4 h-4 fill-current" />
                Discover Tapes
              </button>
              <button onClick={onMakeItReal} className="btn-ghost">
                Make It Real
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Stats strip */}
            <div className="flex items-center gap-8 pt-6 divider-line-wrap">
              <div className="divider-line flex-1 hidden sm:block" />
              <div className="flex gap-8">
                <div>
                  <div className="font-display text-3xl text-cream-50">847</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-cream-300/50">Tapes</div>
                </div>
                <div>
                  <div className="font-display text-3xl text-cream-50">312</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-cream-300/50">Artists</div>
                </div>
                <div>
                  <div className="font-display text-3xl text-gold-400">64</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-cream-300/50">Open Collabs</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: console panel */}
          <div className="lg:col-span-5 hidden lg:block">
            <div className="panel p-6 space-y-5">
              {/* Top row: reels + metering */}
              <div className="flex items-start justify-between">
                <TapeReels spinning size="md" />
                <VUMeter active label="MASTER" />
              </div>

              {/* Waveform display */}
              <div className="bg-ink-900/60 border border-ink-600/40 rounded-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-cream-300/50">NOW PLAYING</span>
                  <span className="font-mono text-[9px] text-gold-500/70">— REEL TO REEL · Loso Jones</span>
                </div>
                <Waveform bars={56} active progress={0.35} className="h-12" />
                <div className="flex justify-between mt-1.5">
                  <span className="font-mono text-[9px] text-cream-300/40">1:18</span>
                  <span className="font-mono text-[9px] text-cream-300/40">3:42</span>
                </div>
              </div>

              {/* Knob row */}
              <div className="flex items-center justify-around pt-1">
                <Knob value={65} label="GAIN" />
                <Knob value={40} label="TONE" />
                <Knob value={75} label="MIX" />
                <Knob value={30} label="LEVEL" />
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between pt-1 border-t border-ink-600/40">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-signal-red animate-pulse-soft" />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-cream-300/60">REC</span>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-cream-300/40">HYBRID · 72 BPM · F# MIN</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-ink-950 to-transparent z-10" />
    </section>
  );
}
