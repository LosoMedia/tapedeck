import { useEffect, useState } from 'react';
import { X, Users, Star, Clock, Music2, Activity, KeyRound, Tag } from 'lucide-react';
import type { TapeRow, TapeReviewRow } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { AudioPlayer } from './AudioPlayer';
import { Waveform, StarRating, VUMeter } from './analog';

interface TapeDetailModalProps {
  tape: TapeRow | null;
  onClose: () => void;
  onCollabClick: (tape: TapeRow) => void;
}

const classConfig = {
  ai: { label: 'AI', tag: 'tag-ai' },
  organic: { label: 'Organic', tag: 'tag-organic' },
  hybrid: { label: 'Hybrid', tag: 'tag-hybrid' },
};

export function TapeDetailModal({ tape, onClose, onCollabClick }: TapeDetailModalProps) {
  const [reviews, setReviews] = useState<TapeReviewRow[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    if (!tape) return;
    setLoadingReviews(true);
    supabase
      .from('tape_reviews')
      .select('*')
      .eq('tape_id', tape.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReviews(data || []);
        setLoadingReviews(false);
      });
  }, [tape]);

  // Close on Escape
  useEffect(() => {
    if (!tape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [tape, onClose]);

  if (!tape) return null;

  const cls = classConfig[tape.classification];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-ink-950/80 backdrop-blur-sm overflow-y-auto p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl my-8 panel grain overflow-hidden animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-ink-800/80 border border-ink-600/50 flex items-center justify-center text-cream-300/60 hover:text-gold-400 hover:border-gold-500/40 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hero cover */}
        <div className="relative h-48 sm:h-64 overflow-hidden">
          <img src={tape.cover_url} alt={tape.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-850 via-ink-850/40 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
            <div>
              <span className={`tag ${cls.tag} mb-2`}>{cls.label}</span>
              <h2 className="font-display text-4xl sm:text-5xl text-cream-50 leading-none mt-1">{tape.title}</h2>
              <p className="text-cream-200/70 mt-1">{tape.artist}</p>
            </div>
            <div className="hidden sm:block">
              <VUMeter active label="TRACK" />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Audio player */}
          <AudioPlayer title={tape.title} artist={tape.artist} duration={tape.duration} />

          {/* Description */}
          <p className="text-sm text-cream-200/60 leading-relaxed">{tape.description}</p>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Music2, label: 'Genre', value: tape.genre },
              { icon: Activity, label: 'BPM', value: String(tape.bpm) },
              { icon: KeyRound, label: 'Key', value: tape.musical_key },
              { icon: Clock, label: 'Duration', value: tape.duration },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-ink-900/50 border border-ink-600/40 rounded-lg p-3">
                <Icon className="w-4 h-4 text-gold-400/60 mb-1.5" />
                <div className="font-mono text-[9px] uppercase tracking-wider text-cream-300/40">{label}</div>
                <div className="text-sm text-cream-100 mt-0.5">{value}</div>
              </div>
            ))}
          </div>

          {/* Mood + status */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink-800/50 border border-ink-600/40">
              <Tag className="w-3 h-3 text-cream-300/40" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-cream-300/60">{tape.mood}</span>
            </span>
            {tape.collaboration_status === 'open' && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-signal-green/15 border border-signal-green/40">
                <Users className="w-3 h-3 text-signal-green" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-signal-green">Open for Collaboration</span>
              </span>
            )}
            {tape.collaboration_status === 'pitch-ready' && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold-500/15 border border-gold-500/40">
                <Star className="w-3 h-3 text-gold-400" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-gold-400">Pitch Ready</span>
              </span>
            )}
          </div>

          {/* Skills needed */}
          {tape.skills_needed.length > 0 && (
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-gold-500/60 mb-2">Skills Needed</div>
              <div className="flex flex-wrap gap-2">
                {tape.skills_needed.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded font-mono text-xs text-cream-200/70 bg-ink-800/50 border border-ink-600/40"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ratings + plays */}
          <div className="flex items-center justify-between py-3 border-y border-ink-600/30">
            <StarRating rating={tape.rating} size="md" />
            <span className="font-mono text-xs text-cream-300/40">{tape.plays} plays</span>
          </div>

          {/* Make it real CTA */}
          {tape.collaboration_status !== 'closed' && (
            <button
              onClick={() => onCollabClick(tape)}
              className="btn-primary w-full justify-center"
            >
              <Users className="w-4 h-4" />
              Make It Real — Apply to Collaborate
            </button>
          )}

          {/* Reviews */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-gold-500/60 mb-3">
              Reviews ({reviews.length})
            </div>
            {loadingReviews ? (
              <div className="text-sm text-cream-300/40 py-4 text-center">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="text-sm text-cream-300/40 py-4 text-center">No reviews yet. Be the first to review this Tape.</div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-ink-900/40 border border-ink-600/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ink-600 to-ink-800 border border-ink-500/50 flex items-center justify-center">
                          <span className="font-display text-sm text-gold-400">{review.reviewer_name.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="text-sm text-cream-50">{review.reviewer_name}</div>
                          <div className="font-mono text-[9px] text-cream-300/40">{review.reviewer_role}</div>
                        </div>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="text-xs text-cream-200/60 leading-relaxed">{review.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
