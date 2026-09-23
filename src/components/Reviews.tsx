import { useState, useEffect } from 'react';
import { Quote, Loader2 } from 'lucide-react';
import type { TapeReviewRow } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { StarRating } from './analog';

function ReviewCard({ review, tapeTitle }: { review: TapeReviewRow; tapeTitle?: string }) {
  const dateStr = new Date(review.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="panel panel-hover p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <Quote className="w-8 h-8 text-gold-500/30" />
        <StarRating rating={review.rating} size="md" />
      </div>

      <p className="text-sm text-cream-100/80 leading-relaxed flex-1">
        "{review.body}"
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-ink-600/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ink-600 to-ink-800 border border-ink-500/50 flex items-center justify-center">
            <span className="font-display text-lg text-gold-400">
              {review.reviewer_name.charAt(0)}
            </span>
          </div>
          <div>
            <div className="font-heading text-sm font-semibold text-cream-50">{review.reviewer_name}</div>
            <div className="font-mono text-[10px] text-cream-300/50">{review.reviewer_role}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] text-cream-300/40">{dateStr}</div>
          {tapeTitle && (
            <div className="font-heading text-xs text-gold-400/70 mt-0.5">on {tapeTitle}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Reviews() {
  const [reviews, setReviews] = useState<(TapeReviewRow & { tape_title?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('tape_reviews')
      .select('*, tapes!inner(title)')
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data, error }) => {
        if (!error && data) {
          const mapped = data.map((row: Record<string, unknown>) => ({
            id: row.id as string,
            tape_id: row.tape_id as string,
            reviewer_name: row.reviewer_name as string,
            reviewer_role: row.reviewer_role as string,
            rating: row.rating as number,
            body: row.body as string,
            created_at: row.created_at as string,
            tape_title: (row.tapes as { title: string })?.title,
          }));
          setReviews(mapped);
        }
        setLoading(false);
      });
  }, []);

  return (
    <section id="reviews" className="relative py-24 px-5 sm:px-8 border-t border-ink-800/50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <span className="section-label">003 · Reviews</span>
            <h2 className="font-display text-5xl sm:text-6xl text-cream-50 mt-2">MEANINGFUL CRITIQUE</h2>
            <p className="text-cream-200/50 mt-2 max-w-lg">
              Not "🔥🔥🔥." Tape Deck reviews focus on songwriting, production, performance,
              and what a record needs to reach its potential.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-cream-300/40">
            <span className="font-mono text-xs uppercase tracking-widest">Recent</span>
          </div>
        </div>

        {/* Review grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-gold-500/50 animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20 text-cream-300/40">No reviews yet.</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} tapeTitle={review.tape_title} />
            ))}
          </div>
        )}

        {/* Criteria strip */}
        <div className="mt-12 panel p-5">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <span className="font-mono text-xs uppercase tracking-widest text-gold-500/60">Review Criteria:</span>
            {['Songwriting', 'Production', 'Performance', 'Originality', 'Arrangement', 'Emotional Impact', 'Commercial Potential'].map(
              (criterion) => (
                <span key={criterion} className="font-mono text-xs text-cream-300/50">
                  {criterion}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
