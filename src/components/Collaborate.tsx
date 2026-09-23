import { useState, useEffect } from 'react';
import { Mic, Music, Drum, Sliders, PenTool, Headphones, ArrowRight, Loader2 } from 'lucide-react';
import type { TapeRow } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

const typeIcons: Record<string, typeof Mic> = {
  Vocalist: Mic,
  Producer: Sliders,
  Cellist: Music,
  'Mastering Engineer': Headphones,
  Guitarist: Music,
  Drummer: Drum,
  Songwriter: PenTool,
  Remixer: Sliders,
  'Mix Engineer': Sliders,
  'Visual Artist': PenTool,
};

const classTag: Record<string, string> = {
  ai: 'tag-ai',
  organic: 'tag-organic',
  hybrid: 'tag-hybrid',
};

interface CollaborateProps {
  onTapeClick: (tape: TapeRow) => void;
}

export function Collaborate({ onTapeClick }: CollaborateProps) {
  const [tapes, setTapes] = useState<TapeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('tapes')
      .select('*')
      .eq('collaboration_status', 'open')
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data, error }) => {
        if (!error && data) {
          setTapes(data as TapeRow[]);
        }
        setLoading(false);
      });
  }, []);

  return (
    <section id="collaborate" className="relative py-24 px-5 sm:px-8 border-t border-ink-800/50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <span className="section-label">004 · Collaboration Marketplace</span>
            <h2 className="font-display text-5xl sm:text-6xl text-cream-50 mt-2">
              FIND YOUR PEOPLE
            </h2>
            <p className="text-cream-200/50 mt-2 max-w-lg">
              Musicians find work. Creators find collaborators. Tapes find what they need
              to become finished records.
            </p>
          </div>
        </div>

        {/* Opportunity grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-gold-500/50 animate-spin" />
          </div>
        ) : tapes.length === 0 ? (
          <div className="text-center py-20 text-cream-300/40">No open collaborations right now.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tapes.map((tape) => {
              const primarySkill = tape.skills_needed[0] || 'Collaborator';
              const Icon = typeIcons[primarySkill] || Music;
              return (
                <div
                  key={tape.id}
                  onClick={() => onTapeClick(tape)}
                  className="panel panel-hover group p-5 flex flex-col gap-3 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-ink-800 border border-ink-600/50 flex items-center justify-center group-hover:border-gold-500/40 transition-colors">
                        <Icon className="w-5 h-5 text-gold-400" />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-base text-cream-50 group-hover:text-gold-400 transition-colors">
                          {primarySkill} Wanted
                        </h3>
                        <p className="font-mono text-[10px] text-cream-300/50 mt-0.5">
                          {tape.title} · {tape.artist}
                        </p>
                      </div>
                    </div>
                    <span className={`tag ${classTag[tape.classification]}`}>
                      {tape.classification}
                    </span>
                  </div>

                  <p className="text-xs text-cream-200/50 leading-relaxed line-clamp-2">{tape.description}</p>

                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {tape.skills_needed.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded font-mono text-[10px] text-cream-300/60 bg-ink-700/50 border border-ink-600/40"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-end pt-2 mt-auto border-t border-ink-600/30">
                    <span className="flex items-center gap-1 text-xs text-gold-400 group-hover:text-gold-300 transition-colors">
                      Apply
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* All roles strip */}
        <div className="mt-10 panel p-5">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <span className="font-mono text-xs uppercase tracking-widest text-gold-500/60">All Roles:</span>
            {[
              'Vocalist',
              'Guitarist',
              'Drummer',
              'Bassist',
              'Producer',
              'Songwriter',
              'Mix Engineer',
              'Mastering Engineer',
              'Remixer',
              'Visual Artist',
              'Arranger',
              'Session Musician',
            ].map((role) => (
              <span key={role} className="font-mono text-xs text-cream-300/40 hover:text-gold-400 transition-colors cursor-pointer">
                {role}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
