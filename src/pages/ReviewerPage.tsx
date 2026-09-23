import { useState, useEffect, useCallback } from 'react';
import { Disc3, PenSquare, Star, Loader2, X, CheckCircle2 } from 'lucide-react';
import { supabase, type TapeRow, type TapeReviewRow } from '@/lib/supabase';
import { AudioPlayer } from '@/components/AudioPlayer';
import { StarRating, Waveform } from '@/components/analog';

const classConfig = {
  ai: { label: 'AI', tag: 'tag-ai' },
  organic: { label: 'Organic', tag: 'tag-organic' },
  hybrid: { label: 'Hybrid', tag: 'tag-hybrid' },
};

const criteria = [
  'Songwriting', 'Production', 'Performance', 'Originality',
  'Arrangement', 'Emotional Impact', 'Commercial Potential',
];

export function ReviewerPage() {
  const [tapes, setTapes] = useState<TapeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTape, setSelectedTape] = useState<TapeRow | null>(null);
  const [reviewsByTape, setReviewsByTape] = useState<Record<string, TapeReviewRow[]>>({});

  // Review form state
  const [reviewingTape, setReviewingTape] = useState<TapeRow | null>(null);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerRole, setReviewerRole] = useState('');
  const [rating, setRating] = useState(4);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
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
  }, []);

  const loadReviews = useCallback((tapeId: string) => {
    if (reviewsByTape[tapeId]) return;
    supabase
      .from('tape_reviews')
      .select('*')
      .eq('tape_id', tapeId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setReviewsByTape((prev) => ({ ...prev, [tapeId]: data as TapeReviewRow[] }));
        }
      });
  }, [reviewsByTape]);

  const handleTapeClick = (tape: TapeRow) => {
    setSelectedTape(tape);
    loadReviews(tape.id);
  };

  const openReviewForm = (tape: TapeRow) => {
    setReviewingTape(tape);
    setRating(4);
    setBody('');
    setError('');
  };

  const submitReview = async () => {
    if (!reviewingTape) return;
    if (!reviewerName.trim() || !body.trim()) {
      setError('Your name and review body are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    const { error: insertError } = await supabase.from('tape_reviews').insert({
      tape_id: reviewingTape.id,
      reviewer_name: reviewerName.trim(),
      reviewer_role: reviewerRole.trim(),
      rating,
      body: body.trim(),
    });

    setSubmitting(false);

    if (insertError) {
      setError('Something went wrong. Please try again.');
      return;
    }

    setSuccess(true);
    setReviewsByTape((prev) => {
      const next = { ...prev };
      delete next[reviewingTape.id];
      return next;
    });

    setTimeout(() => {
      setSuccess(false);
      setReviewingTape(null);
      setBody('');
      if (selectedTape) loadReviews(selectedTape.id);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-ink-950 text-cream-100">
      {/* Reviewer Navbar */}
      <header className="sticky top-0 z-50 bg-ink-950/90 backdrop-blur-md border-b border-ink-700/50">
        <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-full bg-ink-800 border border-gold-500/40 flex items-center justify-center">
              <Disc3 className="w-5 h-5 text-gold-500 animate-spin-slow" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-xl text-cream-50 tracking-wider">TAPE DECK</span>
              <span className="font-mono text-[8px] text-gold-500/70 uppercase tracking-[0.25em]">Reviewer Console</span>
            </div>
          </div>
          <a href="/tapedeck" className="font-heading text-sm text-cream-200/80 hover:text-gold-400 transition-colors">
            Back to Tape Deck
          </a>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <span className="section-label">Reviewer Console</span>
          <h1 className="font-display text-5xl sm:text-6xl text-cream-50 mt-2">REVIEW DESK</h1>
          <p className="text-cream-200/50 mt-2 max-w-lg">
            Listen to Tapes, write meaningful critique, and help creators take their work further.
            Not "🔥🔥🔥" — real feedback on songwriting, production, performance, and potential.
          </p>
        </div>

        {/* Criteria chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          {criteria.map((c) => (
            <span
              key={c}
              className="px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider text-cream-300/50 bg-ink-800/50 border border-ink-600/40"
            >
              {c}
            </span>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-gold-500/50 animate-spin" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Tape list */}
            <div className="space-y-3">
              <div className="font-mono text-xs uppercase tracking-widest text-gold-500/60 mb-2">
                Tapes to Review ({tapes.length})
              </div>
              {tapes.map((tape) => {
                const cls = classConfig[tape.classification];
                const isActive = selectedTape?.id === tape.id;
                return (
                  <div
                    key={tape.id}
                    onClick={() => handleTapeClick(tape)}
                    className={`panel panel-hover p-4 cursor-pointer transition-all ${
                      isActive ? 'border-gold-500/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={tape.cover_url}
                        alt={tape.title}
                        className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading font-bold text-base text-cream-50 truncate">{tape.title}</h3>
                          <span className={`tag ${cls.tag}`}>{cls.label}</span>
                        </div>
                        <p className="text-sm text-cream-300/60 mt-0.5">{tape.artist}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <StarRating rating={tape.rating} />
                          <span className="font-mono text-[10px] text-cream-300/40">{tape.genre}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detail panel */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              {!selectedTape ? (
                <div className="panel p-10 text-center">
                  <PenSquare className="w-12 h-12 text-gold-500/20 mx-auto mb-4" />
                  <p className="text-cream-300/40">Select a Tape from the list to listen and review it.</p>
                </div>
              ) : (
                <div className="panel overflow-hidden">
                  {/* Cover */}
                  <div className="relative h-40 overflow-hidden">
                    <img src={selectedTape.cover_url} alt={selectedTape.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-850 to-transparent" />
                    <div className="absolute bottom-3 left-4">
                      <h2 className="font-display text-3xl text-cream-50 leading-none">{selectedTape.title}</h2>
                      <p className="text-cream-200/70 mt-1">{selectedTape.artist}</p>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <AudioPlayer title={selectedTape.title} artist={selectedTape.artist} duration={selectedTape.duration} />

                    <p className="text-sm text-cream-200/60 leading-relaxed">{selectedTape.description}</p>

                    <div className="flex flex-wrap gap-2 font-mono text-[10px] text-cream-300/50">
                      <span>{selectedTape.genre}</span>
                      <span className="w-1 h-1 rounded-full bg-ink-500" />
                      <span>{selectedTape.bpm} BPM</span>
                      <span className="w-1 h-1 rounded-full bg-ink-500" />
                      <span>{selectedTape.musical_key}</span>
                      <span className="w-1 h-1 rounded-full bg-ink-500" />
                      <span>{selectedTape.mood}</span>
                    </div>

                    {/* Write a review button */}
                    <button
                      onClick={() => openReviewForm(selectedTape)}
                      className="btn-primary w-full justify-center"
                    >
                      <PenSquare className="w-4 h-4" />
                      Write a Review
                    </button>

                    {/* Existing reviews */}
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-gold-500/60 mb-3">
                        Existing Reviews ({reviewsByTape[selectedTape.id]?.length ?? 0})
                      </div>
                      {!reviewsByTape[selectedTape.id] ? (
                        <div className="text-sm text-cream-300/40 py-2">Loading reviews...</div>
                      ) : reviewsByTape[selectedTape.id].length === 0 ? (
                        <div className="text-sm text-cream-300/40 py-2">No reviews yet. Be the first.</div>
                      ) : (
                        <div className="space-y-3">
                          {reviewsByTape[selectedTape.id].map((review) => (
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
              )}
            </div>
          </div>
        )}
      </main>

      {/* Review form modal */}
      {reviewingTape && (
        <div
          className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-ink-950/80 backdrop-blur-sm overflow-y-auto p-4"
          onClick={() => !submitting && !success && setReviewingTape(null)}
        >
          <div
            className="relative w-full max-w-lg my-8 panel grain overflow-hidden animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-ink-600/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
                  <PenSquare className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <h2 className="font-display text-2xl text-cream-50">WRITE A REVIEW</h2>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-cream-300/40">
                    Reviewing "{reviewingTape.title}" by {reviewingTape.artist}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReviewingTape(null)}
                className="w-9 h-9 rounded-full bg-ink-800/80 border border-ink-600/50 flex items-center justify-center text-cream-300/60 hover:text-gold-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {success ? (
              <div className="p-10 text-center">
                <CheckCircle2 className="w-16 h-16 text-signal-green mx-auto mb-4" />
                <h3 className="font-display text-3xl text-cream-50">REVIEW POSTED</h3>
                <p className="text-cream-200/60 mt-2">Your review is now live on Tape Deck.</p>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-wider text-cream-300/50 mb-1.5 block">Your Name *</label>
                    <input
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="Your name"
                      className="w-full bg-ink-900/60 border border-ink-600/40 rounded-md px-3 py-2.5 text-sm text-cream-100 placeholder:text-cream-300/30 focus:border-gold-500/50 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-wider text-cream-300/50 mb-1.5 block">Your Role</label>
                    <input
                      type="text"
                      value={reviewerRole}
                      onChange={(e) => setReviewerRole(e.target.value)}
                      placeholder="e.g. Producer · 10 years"
                      className="w-full bg-ink-900/60 border border-ink-600/40 rounded-md px-3 py-2.5 text-sm text-cream-100 placeholder:text-cream-300/30 focus:border-gold-500/50 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-cream-300/50 mb-1.5 block">Overall Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        onClick={() => setRating(i)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-7 h-7 ${i <= rating ? 'text-gold-500 fill-current' : 'text-ink-500'}`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 font-mono text-sm text-cream-300/70">{rating.toFixed(1)}</span>
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-cream-300/50 mb-1.5 block">Review *</label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={5}
                    placeholder="Focus on songwriting, production, performance, and what this record needs to reach its potential..."
                    className="w-full bg-ink-900/60 border border-ink-600/40 rounded-md px-3 py-2.5 text-sm text-cream-100 placeholder:text-cream-300/30 focus:border-gold-500/50 focus:outline-none transition-colors resize-none"
                  />
                </div>

                {error && (
                  <div className="text-sm text-rust-500 bg-rust-500/10 border border-rust-500/30 rounded-md px-3 py-2">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setReviewingTape(null)} className="btn-ghost">Cancel</button>
                  <button
                    onClick={submitReview}
                    disabled={submitting}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Posting...</>
                    ) : (
                      <><PenSquare className="w-4 h-4" /> Post Review</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
