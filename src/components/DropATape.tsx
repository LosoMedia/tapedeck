import { Upload, ArrowRight } from 'lucide-react';
import { TapeReels } from './analog';

interface DropATapeProps {
  onDropClick: () => void;
}

export function DropATape({ onDropClick }: DropATapeProps) {
  return (
    <section id="drop-a-tape" className="relative py-24 px-5 sm:px-8 border-t border-ink-800/50">
      <div className="max-w-4xl mx-auto">
        <div className="panel grain p-8 sm:p-12 text-center relative overflow-hidden">
          {/* Decorative reels */}
          <div className="absolute top-6 left-6 opacity-30">
            <TapeReels spinning size="sm" />
          </div>
          <div className="absolute top-6 right-6 opacity-30">
            <TapeReels spinning size="sm" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/30 items-center justify-center mb-6">
              <Upload className="w-7 h-7 text-gold-400" />
            </div>

            <span className="section-label">005 · Upload</span>
            <h2 className="font-display text-5xl sm:text-6xl text-cream-50 mt-2">
              DROP A TAPE
            </h2>
            <p className="text-cream-200/60 mt-3 max-w-xl mx-auto leading-relaxed">
              Got an idea? A demo? An AI concept? An unfinished song? Upload it to Tape Deck
              and find the people who can take it further. Finished, unfinished, AI, organic,
              hybrid — every Tape has a place here.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <button onClick={onDropClick} className="btn-primary">
                Upload a Tape
                <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={onDropClick} className="btn-ghost">
                Learn How It Works
              </button>
            </div>

            {/* Format chips */}
            <div className="flex flex-wrap justify-center gap-2 mt-8">
              {[
                'Finished Song',
                'Unfinished Demo',
                'AI Concept',
                'Beat / Instrumental',
                'Vocal Idea',
                'Collaboration Project',
                'Pitch-Ready Recording',
              ].map((format) => (
                <span
                  key={format}
                  className="px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-wider text-cream-300/50 bg-ink-800/50 border border-ink-600/40"
                >
                  {format}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
