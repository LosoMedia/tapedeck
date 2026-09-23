import { useState, useEffect } from 'react';
import { Play, Users, Star, ArrowUpRight, Loader2 } from 'lucide-react';
import type { TapeRow } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { Waveform, StarRating } from './analog';

const classConfig = {
  ai: { label: 'AI', tag: 'tag-ai' },
  organic: { label: 'Organic', tag: 'tag-organic' },
  hybrid: { label: 'Hybrid', tag: 'tag-hybrid' },
};

type FilterKey = 'all' | 'ai' | 'organic' | 'hybrid' | 'open';

const filters: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'ai', label: 'AI' },
  { key: 'organic', label: 'Organic' },
  { key: 'hybrid', label: 'Hybrid' },
  { key: 'open', label: 'Open Collabs' },
];

interface FreshTapesProps {
  onTapeClick: (tape: TapeRow) => void;
  refreshKey: number;
}

function TapeCard({ tape, onClick }: { tape: TapeRow; onClick: () => void }) {
  const cls = classConfig[tape.classification];

  return (
    <div
      onClick={onClick}
      className="panel panel-hover group overflow-hidden flex flex-col cursor-pointer"
    >
      {/* Cover */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={tape.cover_url}
          alt={tape.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />

        {/* Classification tag */}
        <div className="absolute top-3 left-3">
          <span className={`tag ${cls.tag}`}>{cls.label}</span>
        </div>

        {/* Play button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-14 h-14 rounded-full bg-gold-500/90 flex items-center justify-center backdrop-blur-sm shadow-lg">
            <Play className="w-6 h-6 text-ink-950 fill-current ml-0.5" />
          </div>
        </div>

        {/* Collab status */}
        {tape.collaboration_status === 'open' && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded bg-signal-green/20 border border-signal-green/40 backdrop-blur-sm">
            <Users className="w-3 h-3 text-signal-green" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-signal-green">Open</span>
          </div>
        )}
        {tape.collaboration_status === 'pitch-ready' && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded bg-gold-500/20 border border-gold-500/40 backdrop-blur-sm">
            <Star className="w-3 h-3 text-gold-400" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-gold-400">Pitch Ready</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="font-heading font-bold text-lg text-cream-50 leading-tight group-hover:text-gold-400 transition-colors">
            {tape.title}
          </h3>
          <p className="text-sm text-cream-300/60 mt-0.5">{tape.artist}</p>
        </div>

        <p className="text-xs text-cream-200/50 leading-relaxed line-clamp-2">{tape.description}</p>

        {/* Metadata strip */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-cream-300/50">
          <span>{tape.genre}</span>
          <span className="w-1 h-1 rounded-full bg-ink-500" />
          <span>{tape.bpm} BPM</span>
          <span className="w-1 h-1 rounded-full bg-ink-500" />
          <span>{tape.musical_key}</span>
        </div>

        {/* Mini waveform */}
        <Waveform bars={32} progress={0} className="h-6" />

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 mt-auto border-t border-ink-600/30">
          <StarRating rating={tape.rating} />
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-cream-300/40">{tape.plays} plays</span>
            <ArrowUpRight className="w-4 h-4 text-cream-300/40 group-hover:text-gold-400 transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FreshTapes({ onTapeClick, refreshKey }: FreshTapesProps) {
  const [tapes, setTapes] = useState<TapeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  useEffect(() => {
    setLoading(true);
    supabase
      .from('tapes')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setTapes(data as TapeRow[]);
        }
        setLoading(false);
      });
  }, [refreshKey]);

  const filtered = tapes.filter((t) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'open') return t.collaboration_status === 'open';
    return t.classification === activeFilter;
  });

  return (
    <section id="fresh-tapes" className="relative py-24 px-5 sm:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <span className="section-label">001 · Fresh Tapes</span>
            <h2 className="font-display text-5xl sm:text-6xl text-cream-50 mt-2">FRESH TAPES</h2>
            <p className="text-cream-200/50 mt-2 max-w-lg">
              New music from AI artists, human musicians, and hybrid creators. Find something worth taking further.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded border transition-all ${
                  activeFilter === f.key
                    ? 'border-gold-500/50 bg-gold-500/10 text-gold-400'
                    : 'border-ink-600 text-cream-300/50 hover:border-ink-500 hover:text-cream-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-gold-500/50 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-cream-300/40">No tapes match this filter.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((tape) => (
              <TapeCard key={tape.id} tape={tape} onClick={() => onTapeClick(tape)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
