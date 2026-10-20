import { useState, useEffect, useCallback } from 'react';
import { Disc3, PenSquare, Star, Loader2, X, CheckCircle2, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { supabase, type TapeRow, type TapeReviewRow } from '@/lib/supabase';
import { AudioPlayer } from '@/components/AudioPlayer';
import { StarRating } from '@/components/analog';

const classConfig = {
  ai: { label: 'AI', tag: 'tag-ai' },
  organic: { label: 'Organic', tag: 'tag-organic' },
  hybrid: { label: 'Hybrid', tag: 'tag-hybrid' },
};

const reviewSteps = [
  {
    title: 'Songwriting',
    questions: [
      'What is working best in the writing?',
      'What lyric, hook, melody, or idea stands out?',
      'What could make the writing clearer, stronger, or more memorable?',
    ],
  },
  {
    title: 'Production',
    questions: [
      'What production choice supports the song most effectively?',
      'How do the beat, sound selection, mix, and dynamics serve the record?',
      'What production change would most improve the listening experience?',
    ],
  },
  {
    title: 'Performance',
    questions: [
      'What works about the vocal or instrumental performance?',
      'Where does the delivery create the strongest moment?',
      'What could make the performance more convincing or expressive?',
    ],
  },
  {
    title: 'Originality',
    questions: [
      'What feels distinctive or personal about this record?',
      'Which element gives the song its own identity?',
      'What could help the artist separate this from similar records?',
    ],
  },
  {
    title: 'Arrangement',
    questions: [
      'How well does the song build and move from section to section?',
      'Where is the strongest transition, payoff, or structural moment?',
      'What could improve pacing, dynamics, or song structure?',
    ],
  },
  {
    title: 'Emotional Impact',
    questions: [
      'What emotion does the record communicate most clearly?',
      'Which moment made the strongest emotional impression?',
      'What could deepen the emotional connection with the listener?',
    ],
  },
  {
    title: 'Commercial Potential',
    questions: [
      'Who is the natural audience for this record?',
      'What element is most likely to make a listener remember or replay it?',
      'What practical change could improve its release or market potential?',
    ],
  },
];

const DRAFT_KEY = 'tapedeck-review-draft';

type Answers = Record<string, string[]>;

function emptyAnswers(): Answers {
  return Object.fromEntries(reviewSteps.map((step) => [step.title, ['', '', '']]));
}

function hasStepAnswers(answers: Answers, stepIndex: number) {
  return answers[reviewSteps[stepIndex].title]?.every((answer) => answer.trim().length > 0) ?? false;
}

function buildReviewBody(answers: Answers) {
  return reviewSteps
    .map((step) => {
      const responses = answers[step.title] || [];
      return [
        step.title.toUpperCase(),
        ...step.questions.map((question, index) => `Q: ${question}\nA: ${responses[index]?.trim() || ''}`),
      ].join('\n');
    })
    .join('\n\n');
}

export function ReviewerPage() {
  const [tapes, setTapes] = useState<TapeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTape, setSelectedTape] = useState<TapeRow | null>(null);
  const [reviewsByTape, setReviewsByTape] = useState<Record<string, TapeReviewRow[]>>({});

  const [reviewingTape, setReviewingTape] = useState<TapeRow | null>(null);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerRole, setReviewerRole] = useState('');
  const [rating, setRating] = useState(4);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>(emptyAnswers());
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      const displayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
      if (displayName) setReviewerName(displayName);
    });

    supabase
      .from('tapes')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const loadedTapes = (data || []) as TapeRow[];
        setTapes(loadedTapes);
        const requestedTrackId = new URLSearchParams(window.location.search).get('trackId');
        if (requestedTrackId) {
          const requestedTape = loadedTapes.find((tape) => tape.id === requestedTrackId);
          if (requestedTape) setSelectedTape(requestedTape);
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
        if (data) setReviewsByTape((prev) => ({ ...prev, [tapeId]: data as TapeReviewRow[] }));
      });
  }, [reviewsByTape]);

  const handleTapeClick = (tape: TapeRow) => {
    setSelectedTape(tape);
    loadReviews(tape.id);
  };

  const openReviewForm = (tape: TapeRow) => {
    setReviewingTape(tape);
    setStepIndex(0);
    setRating(4);
    setError('');
    setDraftSaved(false);

    try {
      const raw = localStorage.getItem(`${DRAFT_KEY}:${tape.id}`);
      if (raw) {
        const draft = JSON.parse(raw);
        setReviewerName(draft.reviewerName || reviewerName);
        setReviewerRole(draft.reviewerRole || '');
        setRating(draft.rating || 4);
        setStepIndex(Math.min(draft.stepIndex || 0, reviewSteps.length - 1));
        setAnswers(draft.answers || emptyAnswers());
        return;
      }
    } catch {
      // Ignore an invalid local draft and start clean.
    }

    setAnswers(emptyAnswers());
  };

  const updateAnswer = (questionIndex: number, value: string) => {
    const stepTitle = reviewSteps[stepIndex].title;
    setAnswers((prev) => ({
      ...prev,
      [stepTitle]: prev[stepTitle].map((answer, index) => index === questionIndex ? value : answer),
    }));
    setDraftSaved(false);
  };

  const saveDraft = () => {
    if (!reviewingTape) return;
    localStorage.setItem(`${DRAFT_KEY}:${reviewingTape.id}`, JSON.stringify({
      reviewerName,
      reviewerRole,
      rating,
      stepIndex,
      answers,
    }));
    setDraftSaved(true);
  };

  const submitReview = async () => {
    if (!reviewingTape) return;

    if (!reviewerName.trim()) {
      setError('Your name is required.');
      return;
    }

    const missingStep = reviewSteps.findIndex((_, index) => !hasStepAnswers(answers, index));
    if (missingStep !== -1) {
      setStepIndex(missingStep);
      setError('Every review step requires all three answers before you can post.');
      return;
    }

    setSubmitting(true);
    setError('');

    const { error: insertError } = await supabase.from('tape_reviews').insert({
      tape_id: reviewingTape.id,
      reviewer_name: reviewerName.trim(),
      reviewer_role: reviewerRole.trim(),
      rating,
      body: buildReviewBody(answers),
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message || 'Something went wrong. Please try again.');
      return;
    }

    localStorage.removeItem(`${DRAFT_KEY}:${reviewingTape.id}`);
    const { error: queueCompleteError } = await supabase.rpc('complete_tape_review_queue_item', { p_tape_id: reviewingTape.id });
    if (queueCompleteError) {
      setError('Review posted successfully, but the queue status could not be updated: ' + queueCompleteError.message);
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
      setAnswers(emptyAnswers());
      if (selectedTape) loadReviews(selectedTape.id);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-ink-950 text-cream-100">
      <header className="sticky top-0 z-50 bg-ink-950/90 backdrop-blur-md border-b border-ink-700/50">
        <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-full bg-ink-800 border border-[#ff3b5c]/40 flex items-center justify-center">
              <Disc3 className="w-5 h-5 text-[#ff3b5c] animate-spin-slow" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-xl text-cream-50 tracking-wider">TAPE DECK</span>
              <span className="font-mono text-[8px] text-[#ff91a6]/70 uppercase tracking-[0.25em]">Reviewer Console</span>
            </div>
          </div>
          <a href="/tapedeck" className="font-heading text-sm text-cream-200/80 hover:text-[#ff91a6] transition-colors">Back to Tape Deck</a>
        </nav>
      </header>

      <main className="max-w-[1600px] mx-auto px-3 sm:px-5 py-5 lg:py-7">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[330px_minmax(0,1fr)] gap-4 lg:gap-6 items-start">
          <aside className="space-y-4 min-w-0">
            <section className="panel p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#ff3b5c]/10 border border-[#ff3b5c]/30 flex items-center justify-center">
                  <Disc3 className="w-5 h-5 text-[#ff91a6]" />
                </div>
                <div>
                  <div className="font-display text-xl text-cream-50">REVIEW DECK</div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-cream-300/40">Reviewer workspace</div>
                </div>
              </div>
              <nav className="space-y-1">
                <a href="#review-queue" className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-[#ff3b5c]/10 border border-[#ff3b5c]/25 text-[#ff91a6] text-sm">
                  <PenSquare className="w-4 h-4" /> Review Queue
                </a>
                <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-cream-200/70 border border-transparent text-sm">
                  <Disc3 className="w-4 h-4" /> Random Pool <span className="ml-auto text-[9px] font-mono text-emerald-300">FREE BETA</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-cream-200/70 border border-transparent text-sm">
                  <Star className="w-4 h-4" /> Skippers &amp; Tippers
                </div>
                <a href="/tapedeck/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-cream-200/70 hover:bg-ink-800/70 border border-transparent text-sm transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Artist Dashboard
                </a>
                <a href="/tapedeck/admin" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-cream-200/70 hover:bg-ink-800/70 border border-transparent text-sm transition-colors">
                  <CheckCircle2 className="w-4 h-4" /> Admin Access
                </a>
              </nav>
              <p className="mt-4 pt-3 border-t border-ink-700/40 text-[11px] leading-relaxed text-cream-300/45">
                Random Pool stays free during beta. Paid priority never buys a better rating.
              </p>
            </section>

            <section id="review-queue" className="panel p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ff91a6]/70">Up next</div>
                  <h1 className="font-display text-2xl text-cream-50 mt-1">REVIEW QUEUE</h1>
                </div>
                <span className="rounded-full bg-ink-800 border border-ink-600/50 px-2.5 py-1 font-mono text-xs text-cream-200/70">{tapes.length}</span>
              </div>
              <p className="text-xs text-cream-300/45 mb-4">Choose a track to load it in the player.</p>
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-[#ff91a6]/60 animate-spin" /></div>
              ) : tapes.length === 0 ? (
                <div className="rounded-lg border border-dashed border-ink-600/50 p-5 text-center">
                  <Disc3 className="w-8 h-8 text-cream-300/20 mx-auto mb-2" />
                  <p className="text-sm text-cream-300/50">No tracks are waiting right now.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1">
                  {tapes.map((tape) => {
                    const cls = classConfig[tape.classification] || classConfig.hybrid;
                    const isActive = selectedTape?.id === tape.id;
                    return (
                      <button type="button" key={tape.id} onClick={() => handleTapeClick(tape)} className={`w-full text-left rounded-xl p-3 border transition-colors ${isActive ? 'bg-[#ff3b5c]/10 border-[#ff3b5c]/50' : 'bg-ink-900/50 border-ink-600/40 hover:border-ink-500'}`}>
                        <div className="flex items-center gap-3">
                          <img src={tape.cover_url || ''} alt={tape.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-ink-800" />
                          <div className="flex-1 min-w-0">
                            <div className="font-heading font-semibold text-sm text-cream-50 truncate">{tape.title}</div>
                            <div className="text-xs text-cream-300/55 truncate mt-0.5">{tape.artist}</div>
                            <div className="flex items-center gap-2 mt-1.5"><span className={`tag ${cls.tag}`}>{cls.label}</span><span className="font-mono text-[9px] text-cream-300/40 truncate">{tape.genre || 'Uncategorized'}</span></div>
                          </div>
                          {isActive && <span className="w-2 h-2 rounded-full bg-[#ff3b5c] flex-shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </aside>

          <section className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3 px-1">
              <div>
                <span className="section-label">Live listening workspace</span>
                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-cream-50 mt-1">PLAYING NOW</h2>
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-cream-300/40">Listen first · Review honestly</div>
            </div>

            {!selectedTape ? (
              <div className="panel min-h-[440px] flex flex-col items-center justify-center text-center p-8 sm:p-12">
                <div className="w-24 h-24 rounded-full bg-[#ff3b5c]/10 border border-[#ff3b5c]/25 flex items-center justify-center mb-5">
                  <Disc3 className="w-12 h-12 text-[#ff91a6]/70" />
                </div>
                <h3 className="font-display text-2xl sm:text-3xl text-cream-50">YOUR DECK IS READY</h3>
                <p className="text-sm text-cream-300/50 max-w-md mt-2">Pick a track from the queue on the left. Its artwork, playback controls, and review details will appear here.</p>
              </div>
            ) : (
              <div className="panel overflow-hidden">
                <div className="grid md:grid-cols-[minmax(220px,0.85fr)_minmax(0,1.15fr)]">
                  <div className="relative min-h-[280px] md:min-h-[440px] bg-ink-900">
                    <img src={selectedTape.cover_url || ''} alt={selectedTape.title} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/15 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ff91a6]">Selected Tape</span>
                      <h3 className="font-display text-3xl sm:text-4xl text-white mt-2 leading-tight break-words">{selectedTape.title}</h3>
                      <p className="text-white/75 mt-1 text-lg">{selectedTape.artist}</p>
                    </div>
                  </div>
                  <div className="p-5 sm:p-7 lg:p-9 flex flex-col justify-center min-w-0">
                    <div className="flex flex-wrap gap-2 mb-5 font-mono text-[10px] text-cream-300/60">
                      {selectedTape.genre && <span className="rounded-full bg-ink-800 px-3 py-1.5">{selectedTape.genre}</span>}
                      {selectedTape.bpm && <span className="rounded-full bg-ink-800 px-3 py-1.5">{selectedTape.bpm} BPM</span>}
                      {selectedTape.musical_key && <span className="rounded-full bg-ink-800 px-3 py-1.5">{selectedTape.musical_key}</span>}
                      {selectedTape.mood && <span className="rounded-full bg-ink-800 px-3 py-1.5">{selectedTape.mood}</span>}
                    </div>
                    <div className="rounded-xl border border-ink-600/50 bg-ink-900/70 p-4 sm:p-5">
                      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ff91a6]/75 mb-3">Now Playing</div>
                      <AudioPlayer title={selectedTape.title} artist={selectedTape.artist} duration={selectedTape.duration} />
                    </div>
                    {selectedTape.description && <p className="text-sm text-cream-200/60 leading-relaxed mt-5">{selectedTape.description}</p>}
                    <div className="mt-6">
                      <button onClick={() => openReviewForm(selectedTape)} className="btn-primary w-full justify-center py-3"><PenSquare className="w-4 h-4" />Start Structured Review</button>
                    </div>
                    <div className="mt-5 flex items-center gap-3 text-xs text-cream-300/45">
                      <Star className="w-4 h-4 text-[#ff91a6]" />
                      <span>Seven review categories · Specific, constructive feedback</span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-ink-700/40 p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="font-display text-xl text-cream-50">EXISTING REVIEWS</h3>
                    <span className="font-mono text-xs text-cream-300/45">{reviewsByTape[selectedTape.id]?.length ?? 0} posted</span>
                  </div>
                  {!reviewsByTape[selectedTape.id] ? (
                    <div className="text-sm text-cream-300/40 py-2">Loading reviews...</div>
                  ) : reviewsByTape[selectedTape.id].length === 0 ? (
                    <div className="text-sm text-cream-300/40 py-2">No reviews yet. Be the first.</div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-3">
                      {reviewsByTape[selectedTape.id].map((review) => (
                        <div key={review.id} className="bg-ink-900/40 border border-ink-600/30 rounded-lg p-4">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <div className="text-sm text-cream-50 truncate">{review.reviewer_name}</div>
                              <div className="font-mono text-[9px] text-cream-300/40 truncate">{review.reviewer_role}</div>
                            </div>
                            <StarRating rating={review.rating} />
                          </div>
                          <p className="text-xs text-cream-200/60 leading-relaxed whitespace-pre-line line-clamp-6">{review.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {reviewingTape && (
        <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-ink-950/80 backdrop-blur-sm overflow-y-auto p-4" onClick={() => !submitting && !success && setReviewingTape(null)}>
          <div className="relative w-full max-w-2xl my-8 panel grain overflow-hidden animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-ink-600/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#ff3b5c]/10 border border-[#ff3b5c]/30 flex items-center justify-center"><PenSquare className="w-5 h-5 text-[#ff91a6]" /></div>
                <div>
                  <h2 className="font-display text-2xl text-cream-50">VETTED REVIEW</h2>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-cream-300/40">"{reviewingTape.title}" by {reviewingTape.artist}</p>
                </div>
              </div>
              <button onClick={() => !submitting && setReviewingTape(null)} className="w-9 h-9 rounded-full bg-ink-800/80 border border-ink-600/50 flex items-center justify-center text-cream-300/60 hover:text-[#ff91a6] transition-colors"><X className="w-4 h-4" /></button>
            </div>

            {success ? (
              <div className="p-10 text-center">
                <CheckCircle2 className="w-16 h-16 text-signal-green mx-auto mb-4" />
                <h3 className="font-display text-3xl text-cream-50">REVIEW POSTED</h3>
                <p className="text-cream-200/60 mt-2">Your complete Vetted review is now live on Tape Deck.</p>
              </div>
            ) : (
              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-[#ff91a6]/70">Step {stepIndex + 1} of {reviewSteps.length}</div>
                    <h3 className="font-display text-3xl text-cream-50 mt-1">{reviewSteps[stepIndex].title}</h3>
                  </div>
                  <button onClick={saveDraft} className="btn-ghost text-xs"><Save className="w-4 h-4" />{draftSaved ? 'Draft Saved' : 'Save Draft'}</button>
                </div>

                <div className="w-full h-1.5 bg-ink-800 rounded-full mb-6 overflow-hidden">
                  <div className="h-full bg-[#ff3b5c] transition-all" style={{ width: `${((stepIndex + 1) / reviewSteps.length) * 100}%` }} />
                </div>

                <div className="space-y-5">
                  {reviewSteps[stepIndex].questions.map((question, index) => {
                    const value = answers[reviewSteps[stepIndex].title]?.[index] || '';
                    return (
                      <div key={question}>
                        <label className="font-mono text-[10px] uppercase tracking-wider text-cream-300/60 mb-1.5 block">
                          {index + 1}. {question} *
                        </label>
                        <textarea
                          value={value}
                          onChange={(e) => updateAnswer(index, e.target.value)}
                          rows={4}
                          placeholder="Give specific, useful feedback. Generic praise does not help the artist improve."
                          className="w-full bg-ink-900/60 border border-ink-600/40 rounded-md px-3 py-2.5 text-sm text-cream-100 placeholder:text-cream-300/30 focus:border-[#ff3b5c]/50 focus:outline-none transition-colors resize-none"
                        />
                      </div>
                    );
                  })}
                </div>

                {stepIndex === 0 && (
                  <div className="grid sm:grid-cols-2 gap-4 mt-6 pt-5 border-t border-ink-700/40">
                    <div>
                      <label className="font-mono text-[10px] uppercase tracking-wider text-cream-300/50 mb-1.5 block">Your Name *</label>
                      <input value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} placeholder="Your name" className="w-full bg-ink-900/60 border border-ink-600/40 rounded-md px-3 py-2.5 text-sm text-cream-100 placeholder:text-cream-300/30 focus:border-[#ff3b5c]/50 focus:outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] uppercase tracking-wider text-cream-300/50 mb-1.5 block">Your Role</label>
                      <input value={reviewerRole} onChange={(e) => setReviewerRole(e.target.value)} placeholder="e.g. Producer · 10 years" className="w-full bg-ink-900/60 border border-ink-600/40 rounded-md px-3 py-2.5 text-sm text-cream-100 placeholder:text-cream-300/30 focus:border-[#ff3b5c]/50 focus:outline-none transition-colors" />
                    </div>
                  </div>
                )}

                {stepIndex === reviewSteps.length - 1 && (
                  <div className="mt-6 pt-5 border-t border-ink-700/40">
                    <label className="font-mono text-[10px] uppercase tracking-wider text-cream-300/50 mb-2 block">Overall Rating</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <button key={i} onClick={() => setRating(i)} className="transition-transform hover:scale-110">
                          <Star className={`w-7 h-7 ${i <= rating ? 'text-[#ff3b5c] fill-current' : 'text-ink-500'}`} />
                        </button>
                      ))}
                      <span className="ml-2 font-mono text-sm text-cream-300/70">{rating.toFixed(1)}</span>
                    </div>
                  </div>
                )}

                {error && <div className="mt-5 text-sm text-rust-500 bg-rust-500/10 border border-rust-500/30 rounded-md px-3 py-2">{error}</div>}

                <div className="flex justify-between gap-3 pt-6 mt-2 border-t border-ink-700/40">
                  <button
                    onClick={() => {
                      setError('');
                      if (stepIndex === 0) setReviewingTape(null);
                      else setStepIndex((index) => index - 1);
                    }}
                    className="btn-ghost"
                  >
                    <ChevronLeft className="w-4 h-4" />{stepIndex === 0 ? 'Cancel' : 'Back'}
                  </button>

                  {stepIndex < reviewSteps.length - 1 ? (
                    <button
                      onClick={() => {
                        if (!hasStepAnswers(answers, stepIndex)) {
                          setError('Answer all three questions before moving to the next step.');
                          return;
                        }
                        setError('');
                        setStepIndex((index) => index + 1);
                        setDraftSaved(false);
                      }}
                      disabled={!hasStepAnswers(answers, stepIndex)}
                      className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next Step<ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={submitReview}
                      disabled={submitting || !hasStepAnswers(answers, stepIndex)}
                      className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Posting...</> : <><CheckCircle2 className="w-4 h-4" />Post Vetted Review</>}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
