import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Disc3, Music2, Star, UserRound } from 'lucide-react';
import { supabase, type TapeRow, type TapeReviewRow } from '@/lib/supabase';

const gold = '#d8b45a';
const panel: React.CSSProperties = { background: '#191919', border: '1px solid #303030', borderRadius: 18, padding: 22 };

const reviewStages = [
  { title: 'First Impression', questions: [
    'What is your honest first impression of this track?',
    'What moment, sound, lyric, or hook grabbed your attention first?',
    'What mood or expectation does the track create for a listener?',
  ]},
  { title: 'Craft & Performance', questions: [
    'What is working best in the songwriting or musical ideas?',
    'How effective is the vocal or instrumental performance?',
    'What specific detail could make the writing or performance stronger?',
  ]},
  { title: 'Production', questions: [
    'Which production choice works especially well?',
    'How do the beat, sound selection, mix, and dynamics support the track?',
    'What one production change would most improve the listening experience?',
  ]},
  { title: 'Constructive Feedback', questions: [
    'What is the track’s biggest strength that the artist should keep?',
    'What is the most important area for improvement, and why?',
    'What practical change would you suggest the artist try next?',
  ]},
  { title: 'Final Assessment', questions: [
    'Who do you think is the natural audience for this track?',
    'What makes this track memorable or distinct from similar music?',
    'What final advice would help the artist move this track forward?',
  ]},
];

type ReviewAnswers = Record<string, string[]>;

function freshAnswers(): ReviewAnswers {
  return Object.fromEntries(reviewStages.map((stage) => [stage.title, ['', '', '']]));
}
function reviewBody(answers: ReviewAnswers) {
  return reviewStages.map((stage) => [
    stage.title.toUpperCase(),
    ...stage.questions.map((question, index) => 'Q: ' + question + '\\nA: ' + (answers[stage.title]?.[index] || '').trim()),
  ].join('\\n')).join('\\n\\n');
}

export function TrackDetailPage() {
  const { trackId } = useParams();
  const [track, setTrack] = useState<TapeRow | null>(null);
  const [artistName, setArtistName] = useState('Independent artist');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState<TapeReviewRow[]>([]);
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [answers, setAnswers] = useState<ReviewAnswers>(freshAnswers);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerRole, setReviewerRole] = useState('');
  const [rating, setRating] = useState(4);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewNotice, setReviewNotice] = useState('');

  async function loadReviews(id: string) {
    const { data, error: reviewLoadError } = await supabase.from('tape_reviews').select('*').eq('tape_id', id).order('created_at', { ascending: false });
    if (reviewLoadError) setReviewError('Reviews could not load: ' + reviewLoadError.message);
    else setReviews((data || []) as TapeReviewRow[]);
  }

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!trackId) { setError('Track not found.'); setBusy(false); return; }
      const [{ data, error: loadError }, { data: authData }] = await Promise.all([
        supabase.from('tapes').select('*').eq('id', trackId).maybeSingle(),
        supabase.auth.getUser(),
      ]);
      if (!alive) return;
      const user = authData.user;
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || '');
        setReviewerName(String(user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || ''));
      }
      if (loadError) setError('Could not load this track: ' + loadError.message);
      else if (!data) setError('This track could not be found. It may have been removed.');
      else {
        const found = data as TapeRow;
        setTrack(found);
        setArtistName(found.artist || 'Independent artist');
        await loadReviews(found.id);
      }
      setBusy(false);
    }
    void load();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id || '');
      setUserEmail(session?.user.email || '');
      if (session?.user) setReviewerName(String(session.user.user_metadata?.display_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || ''));
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, [trackId]);

  const currentStage = reviewStages[stageIndex];
  const completedCount = useMemo(() => reviewStages.filter((stage) => stage.questions.every((_, index) => (answers[stage.title]?.[index] || '').trim().length >= 15)).length, [answers]);

  function updateAnswer(questionIndex: number, value: string) {
    setAnswers((prev) => ({ ...prev, [currentStage.title]: prev[currentStage.title].map((answer, index) => index === questionIndex ? value : answer) }));
    setReviewError('');
  }

  function openReview() {
    if (!userId) {
      window.location.href = '/tapedeck/auth';
      return;
    }
    setAnswers(freshAnswers());
    setStageIndex(0);
    setRating(4);
    setReviewError('');
    setReviewNotice('');
    setReviewOpen(true);
  }

  async function submitReview() {
    if (!track || !userId) {
      setReviewError('Sign in before submitting a review.');
      return;
    }
    if (!reviewerName.trim()) {
      setReviewError('Enter your name before submitting.');
      setStageIndex(0);
      return;
    }
    const incomplete = reviewStages.findIndex((stage) => !stage.questions.every((_, index) => (answers[stage.title]?.[index] || '').trim().length >= 15));
    if (incomplete !== -1) {
      setStageIndex(incomplete);
      setReviewError('Every stage needs three useful answers of at least 15 characters each. Empty praise is not a review.');
      return;
    }
    setReviewBusy(true);
    setReviewError('');
    const { error: saveError } = await supabase.from('tape_reviews').insert({
      tape_id: track.id,
      reviewer_name: reviewerName.trim(),
      reviewer_role: reviewerRole.trim(),
      rating,
      body: reviewBody(answers),
    });
    setReviewBusy(false);
    if (saveError) {
      setReviewError('Review could not be saved: ' + saveError.message);
      return;
    }
    setReviewNotice('Your review is live. Thanks for giving the artist something useful to work with.');
    setReviewOpen(false);
    setAnswers(freshAnswers());
    await loadReviews(track.id);
  }

  return <div style={{ minHeight: '100vh', background: '#090909', color: '#f4f5f7', fontFamily: 'Inter,system-ui,sans-serif', paddingBottom: 48 }}>
    <style>{`*{box-sizing:border-box}body{margin:0}.track-wrap{width:min(900px,calc(100% - 32px));margin:0 auto}.track-muted{color:#9ba7b8;font-size:13px;line-height:1.7}.track-link{color:#d8b45a;text-decoration:none}.track-button{display:inline-flex;align-items:center;gap:8px;border:1px solid #b89b50;border-radius:10px;padding:10px 14px;background:#d8b45a;color:#111111;text-decoration:none;font-weight:800}.review-field{width:100%;resize:vertical;background:#101010;border:1px solid #383838;border-radius:10px;padding:12px;color:#f4f5f7;font:inherit;line-height:1.55}.review-field:focus{outline:1px solid #d8b45a;border-color:#d8b45a}.review-small{font-size:12px;color:#9ba7b8;line-height:1.6}`}</style>
    <header style={{ borderBottom: '1px solid #2b2b2b', padding: 18 }}>
      <div className="track-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <Link to="/tapedeck" style={{ color: '#f4f5f7', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 9 }}><Disc3 color={gold} size={24} /> <strong>TAPE DECK<span style={{ color: gold }}>.</span></strong></Link>
        <Link to="/tapedeck" className="track-muted" style={{ textDecoration: 'none' }}><ArrowLeft size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Back to discovery</Link>
      </div>
    </header>
    <main className="track-wrap" style={{ paddingTop: 30 }}>
      {busy ? <p className="track-muted">Loading track…</p> : error ? <div role="alert" style={{ ...panel, color: '#fecaca' }}>{error}<p><Link className="track-link" to="/tapedeck">Return to Tape Deck</Link></p></div> : track && <>
        <section style={{ ...panel, display: 'grid', gridTemplateColumns: 'minmax(0,300px) minmax(0,1fr)', gap: 26, alignItems: 'center' }}>
          <div style={{ aspectRatio: '1 / 1', borderRadius: 14, overflow: 'hidden', background: 'radial-gradient(circle at 70% 25%,#d8b45a66,transparent 28%),linear-gradient(145deg,#2a2a2a,#191919 65%,#080808)', border: '1px solid #383838', display: 'grid', placeItems: 'center' }}>
            {track.cover_url ? <img src={track.cover_url} alt={track.title + ' cover'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center', color: gold }}><Music2 size={52} /><div style={{ fontSize: 11, letterSpacing: 3, marginTop: 12, fontWeight: 900 }}>TAPE DECK</div></div>}
          </div>
          <div>
            <div style={{ color: gold, fontSize: 10, fontWeight: 900, letterSpacing: 2.5 }}>TRACK DETAILS</div>
            <h1 style={{ fontSize: 'clamp(30px,5vw,48px)', lineHeight: 1.05, margin: '12px 0', overflowWrap: 'anywhere' }}>{track.title || 'Untitled Tape'}</h1>
            <div style={{ marginBottom: 18 }}>{track.artist_id ? <Link className="track-link" to={'/tapedeck/artist/' + track.artist_id}>{artistName}</Link> : <span>{artistName}</span>}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {[track.genre || 'Independent music', track.classification === 'ai' ? 'AI-generated' : track.classification === 'hybrid' ? 'Hybrid creation' : 'Human-made', track.musical_key || 'Key not listed', track.bpm ? track.bpm + ' BPM' : 'BPM not listed'].map((tag) => <span key={tag} style={{ border: '1px solid #383838', background: '#101010', color: '#cbd5e1', borderRadius: 999, padding: '7px 10px', fontSize: 12 }}>{tag}</span>)}
            </div>
            {track.audio_url ? <audio controls preload="metadata" src={track.audio_url} style={{ width: '100%', minWidth: 0 }}>Audio playback not supported.</audio> : <p className="track-muted">Audio preview unavailable.</p>}
          </div>
        </section>
        <section style={{ ...panel, marginTop: 18 }}>
          <h2 style={{ margin: '0 0 10px', fontSize: 20 }}>About this track</h2>
          <p className="track-muted" style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{track.description?.trim() || 'The artist has not added a description for this track yet.'}</p>
          <div className="track-muted" style={{ borderTop: '1px solid #303030', marginTop: 20, paddingTop: 14 }}>Published {track.created_at ? new Date(track.created_at).toLocaleDateString() : 'date unavailable'}</div>
        </section>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
          {track.artist_id && <Link className="track-button" to={'/tapedeck/artist/' + track.artist_id}><UserRound size={16} /> View artist profile</Link>}
          <Link to="/tapedeck" className="track-button" style={{ background: '#202020', color: '#e2e8f0', borderColor: '#383838' }}>Explore more music</Link>
          <button className="track-button" onClick={openReview} style={{ cursor: 'pointer' }}>Write a review</button>
        </div>

        <section style={{ ...panel, marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div><h2 style={{ margin: 0, fontSize: 22 }}>Community reviews</h2><p className="track-muted" style={{ margin: '5px 0 0' }}>Specific, constructive feedback. Five stages, three answers per stage.</p></div>
            <span style={{ color: gold, fontSize: 13, fontWeight: 800 }}>{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span>
          </div>
          {reviewNotice && <p role="status" style={{ marginTop: 16, padding: 12, borderRadius: 10, background: '#10281c', color: '#b9f6ce', border: '1px solid #27563c' }}><CheckCircle2 size={16} style={{ verticalAlign: 'middle', marginRight: 7 }} />{reviewNotice}</p>}
          {reviewError && !reviewOpen && <p role="alert" style={{ marginTop: 16, color: '#fecaca' }}>{reviewError}</p>}
          {reviews.length === 0 ? <p className="track-muted" style={{ marginTop: 20 }}>No reviews yet. Be the first to give this track useful feedback.</p> : <div style={{ display: 'grid', gap: 14, marginTop: 20 }}>
            {reviews.map((review) => <article key={review.id} style={{ borderTop: '1px solid #303030', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div><strong>{review.reviewer_name || 'Tape Deck reviewer'}</strong>{review.reviewer_role && <span className="track-muted"> · {review.reviewer_role}</span>}</div>
                <span aria-label={review.rating + ' out of 5 stars'} style={{ color: gold, display: 'inline-flex', alignItems: 'center', gap: 3 }}>{[1,2,3,4,5].map((n) => <Star key={n} size={14} fill={n <= review.rating ? gold : 'transparent'} />)}</span>
              </div>
              <p className="track-muted" style={{ whiteSpace: 'pre-wrap', marginTop: 10 }}>{review.body}</p>
              <div className="review-small">{review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}</div>
            </article>)}
          </div>}
        </section>
      </>}
    </main>

    {reviewOpen && track && <div role="dialog" aria-modal="true" aria-labelledby="review-title" style={{ position: 'fixed', inset: 0, zIndex: 30, background: '#030303dd', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
      <div style={{ width: 'min(720px,100%)', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', ...panel, borderColor: '#4a4434' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
          <div><div style={{ color: gold, textTransform: 'uppercase', letterSpacing: 2, fontSize: 10, fontWeight: 900 }}>Tape Deck guided review</div><h2 id="review-title" style={{ fontSize: 26, margin: '8px 0' }}>{track.title}</h2><p className="track-muted" style={{ margin: 0 }}>Stage {stageIndex + 1} of {reviewStages.length}: {currentStage.title}</p></div>
          <button onClick={() => !reviewBusy && setReviewOpen(false)} aria-label="Close review" style={{ background: '#101010', border: '1px solid #383838', color: '#f4f5f7', borderRadius: 8, padding: '8px 11px', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ height: 5, background: '#303030', borderRadius: 99, overflow: 'hidden', margin: '18px 0' }}><div style={{ height: '100%', width: ((stageIndex + 1) / reviewStages.length * 100) + '%', background: gold }} /></div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>{reviewStages.map((stage, index) => <span key={stage.title} style={{ fontSize: 10, padding: '6px 8px', borderRadius: 999, border: '1px solid ' + (index === stageIndex ? gold : '#383838'), color: index === stageIndex ? gold : '#9ba7b8' }}>{index + 1}. {stage.title}</span>)}</div>
        <div style={{ display: 'grid', gap: 15 }}>
          {currentStage.questions.map((question, index) => <label key={question} style={{ display: 'grid', gap: 7, fontSize: 13, lineHeight: 1.5, color: '#d7deea' }}>
            <span>{index + 1}. {question} <span style={{ color: gold }}>*</span></span>
            <textarea className="review-field" rows={3} value={answers[currentStage.title][index]} onChange={(event) => updateAnswer(index, event.target.value)} placeholder="Be specific. Explain what works, what doesn't, and why." />
            <span className="review-small">{answers[currentStage.title][index].trim().length}/15 minimum characters</span>
          </label>)}
        </div>
        {stageIndex === 0 && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, marginTop: 18, borderTop: '1px solid #303030', paddingTop: 16 }}>
          <label className="review-small">Your display name<input className="review-field" style={{ marginTop: 6 }} value={reviewerName} onChange={(event) => setReviewerName(event.target.value)} placeholder={userEmail || 'Your name'} /></label>
          <label className="review-small">Your role (optional)<input className="review-field" style={{ marginTop: 6 }} value={reviewerRole} onChange={(event) => setReviewerRole(event.target.value)} placeholder="Artist, producer, listener…" /></label>
        </div>}
        {stageIndex === reviewStages.length - 1 && <div style={{ marginTop: 18, borderTop: '1px solid #303030', paddingTop: 16 }}><div className="review-small" style={{ marginBottom: 8 }}>Overall rating</div><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{[1,2,3,4,5].map((n) => <button key={n} onClick={() => setRating(n)} aria-label={n + ' stars'} style={{ color: gold, background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}><Star size={27} fill={n <= rating ? gold : 'transparent'} /></button>)}<span className="track-muted">{rating}/5</span></div></div>}
        {reviewError && <p role="alert" style={{ color: '#fecaca', background: '#351a22', padding: 11, borderRadius: 9, fontSize: 13, marginTop: 16 }}>{reviewError}</p>}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 22, paddingTop: 16, borderTop: '1px solid #303030' }}>
          <button disabled={reviewBusy} onClick={() => { setReviewError(''); if (stageIndex === 0) setReviewOpen(false); else setStageIndex((index) => index - 1); }} style={{ background: '#202020', border: '1px solid #383838', color: '#e2e8f0', padding: '10px 14px', borderRadius: 9, cursor: 'pointer' }}>{stageIndex === 0 ? 'Cancel' : 'Back'}</button>
          {stageIndex < reviewStages.length - 1 ? <button onClick={() => { const complete = currentStage.questions.every((_, index) => answers[currentStage.title][index].trim().length >= 15); if (!complete) setReviewError('Answer all three questions with at least 15 characters each before moving on.'); else { setReviewError(''); setStageIndex((index) => index + 1); } }} style={{ background: gold, border: '1px solid #b89b50', color: '#111111', fontWeight: 850, padding: '10px 15px', borderRadius: 9, cursor: 'pointer' }}>Next stage →</button> : <button disabled={reviewBusy} onClick={() => void submitReview()} style={{ background: gold, border: '1px solid #b89b50', color: '#111111', fontWeight: 850, padding: '10px 15px', borderRadius: 9, cursor: reviewBusy ? 'wait' : 'pointer', opacity: reviewBusy ? .65 : 1 }}>{reviewBusy ? 'Publishing…' : 'Publish review'}</button>}
        </div>
        <p className="review-small" style={{ marginTop: 13 }}>Completed stages: {completedCount}/{reviewStages.length}. All 15 answers are required before publishing.</p>
      </div>
    </div>}
  </div>;
}
