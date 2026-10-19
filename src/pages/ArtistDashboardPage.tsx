import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, ExternalLink, MessageSquareText, Music2, Star, UserRound } from 'lucide-react';
import { supabase, type TapeRow, type TapeReviewRow } from '@/lib/supabase';

const gold = '#ff3b5c';
const panel: React.CSSProperties = { background: '#191919', border: '1px solid #303030', borderRadius: 16, padding: 20 };
const muted: React.CSSProperties = { color: '#9ba7b8', fontSize: 13, lineHeight: 1.6 };
const button: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, background: '#202020', color: '#e2e8f0', border: '1px solid #383838', borderRadius: 10, padding: '10px 13px', textDecoration: 'none', fontWeight: 750 };

export function ArtistDashboardPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [tracks, setTracks] = useState<TapeRow[]>([]);
  const [reviews, setReviews] = useState<TapeReviewRow[]>([]);
  const [profileName, setProfileName] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) { navigate('/tapedeck/auth', { replace: true }); return; }
      if (alive) { setUserId(user.id); setEmail(user.email || ''); }
      const [{ data: tapeData, error: tapeError }, { data: profileData, error: profileError }] = await Promise.all([
        supabase.from('tapes').select('*').eq('artist_id', user.id).order('created_at', { ascending: false }).limit(100),
        supabase.from('artist_profiles').select('display_name').eq('id', user.id).maybeSingle()
      ]);
      if (!alive) return;
      if (tapeError) setError('Could not load your tracks: ' + tapeError.message);
      if (profileError) setError('Could not load your profile: ' + profileError.message);
      const ownTracks = (tapeData || []) as TapeRow[];
      setTracks(ownTracks);
      setProfileName(profileData?.display_name || ownTracks.find(t => t.artist)?.artist || user.email?.split('@')[0] || 'Artist');
      if (ownTracks.length) {
        const { data: reviewData, error: reviewError } = await supabase.from('tape_reviews').select('*').in('tape_id', ownTracks.map(t => t.id)).order('created_at', { ascending: false }).limit(100);
        if (!alive) return;
        if (reviewError) setError(old => old ? old + ' · Reviews: ' + reviewError.message : 'Could not load reviews: ' + reviewError.message);
        setReviews((reviewData || []) as TapeReviewRow[]);
      } else setReviews([]);
      setBusy(false);
    }
    void load();
    return () => { alive = false; };
  }, [navigate]);

  const average = useMemo(() => reviews.length ? (reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length).toFixed(1) : '—', [reviews]);
  const reviewsByTrack = useMemo(() => reviews.reduce<Record<string, number>>((all, review) => { all[review.tape_id] = (all[review.tape_id] || 0) + 1; return all; }, {}), [reviews]);
  const trackNames = useMemo(() => Object.fromEntries(tracks.map(t => [t.id, t.title || 'Untitled Tape'])), [tracks]);

  return <div style={{ minHeight: '100vh', background: '#090909', color: '#f4f5f7', fontFamily: 'Inter,system-ui,sans-serif', paddingBottom: 48 }}>
    <style>{`*{box-sizing:border-box}body{margin:0}.dash-wrap{width:min(1050px,calc(100% - 32px));margin:0 auto}.dash-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}.dash-card{background:#141414;border:1px solid #303030;border-radius:12px;padding:15px}.dash-muted{color:#9ba7b8;font-size:13px;line-height:1.6}`}</style>
    <header style={{ borderBottom: '1px solid #2b2b2b', padding: 18 }}><div className="dash-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
      <Link to="/tapedeck" style={{ color: '#f4f5f7', textDecoration: 'none', fontWeight: 900 }}><span style={{ color: gold }}>◈</span> TAPE DECK.</Link>
      <span className="dash-muted">{email}</span>
    </div></header>
    <main className="dash-wrap" style={{ paddingTop: 28 }}>
      <Link to="/tapedeck" style={{ ...button, marginBottom: 20 }}><ArrowLeft size={15} /> Back to discovery</Link>
      {busy ? <p className="dash-muted">Loading your artist dashboard…</p> : <>
        {error && <p role="alert" style={{ background: '#351a22', color: '#fecaca', padding: 12, borderRadius: 10, overflowWrap: 'anywhere' }}>{error}</p>}
        <section style={{ ...panel, marginTop: 8, marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 18 }}>
          <div><div style={{ color: gold, fontSize: 10, fontWeight: 900, letterSpacing: 2.5 }}>ARTIST WORKSPACE</div><h1 style={{ fontSize: 'clamp(28px,4vw,40px)', margin: '8px 0' }}>Welcome back, {profileName}</h1><p style={{ ...muted, margin: 0 }}>Your tracks, community feedback, and artist profile in one place.</p></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}><Link to="/tapedeck/profile" style={{ ...button, background: gold, color: '#111111', borderColor: '#c92749' }}><UserRound size={16} /> Edit profile</Link><Link to="/tapedeck" style={button}><Music2 size={16} /> Discover music</Link></div>
        </section>
        <section className="dash-grid" style={{ marginBottom: 22 }}>
          <div style={panel}><Music2 color={gold} size={21} /><div style={{ fontSize: 29, fontWeight: 900, marginTop: 8 }}>{tracks.length}</div><div style={muted}>Your tracks</div></div>
          <div style={panel}><MessageSquareText color={gold} size={21} /><div style={{ fontSize: 29, fontWeight: 900, marginTop: 8 }}>{reviews.length}</div><div style={muted}>Reviews received</div></div>
          <div style={panel}><Star color={gold} size={21} /><div style={{ fontSize: 29, fontWeight: 900, marginTop: 8 }}>{average}{average !== '—' && <span style={{ fontSize: 13, color: gold }}> / 5</span>}</div><div style={muted}>Average review rating</div></div>
          <div style={panel}><BarChart3 color={gold} size={21} /><div style={{ fontSize: 29, fontWeight: 900, marginTop: 8 }}>{tracks.filter(t => (reviewsByTrack[t.id] || 0) > 0).length}</div><div style={muted}>Tracks with feedback</div></div>
        </section>
        <section style={{ ...panel, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}><h2 style={{ margin: 0, fontSize: 21 }}>Your music</h2><span style={muted}>Most recent first</span></div>
          {tracks.length ? <div style={{ display: 'grid', gap: 10 }}>{tracks.map(track => <article key={track.id} className="dash-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0, flex: 1 }}><div style={{ fontWeight: 850, overflowWrap: 'anywhere' }}>{track.title || 'Untitled Tape'}</div><div className="dash-muted">{track.genre || 'Independent music'} · {track.classification || 'Track'} · {reviewsByTrack[track.id] || 0} {(reviewsByTrack[track.id] || 0) === 1 ? 'review' : 'reviews'}</div></div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Link to={'/tapedeck/track/' + track.id} style={button}>Open track <ExternalLink size={14} /></Link></div>
          </article>)}</div> : <div className="dash-card"><p style={muted}>No tracks are linked to this account yet.</p><Link to="/tapedeck" style={{ ...button, background: gold, color: '#111111' }}>Explore Tape Deck</Link></div>}
        </section>
        <section style={panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}><h2 style={{ margin: 0, fontSize: 21 }}>Latest community feedback</h2><span style={muted}>Newest first</span></div>
          {reviews.length ? <div style={{ display: 'grid', gap: 12 }}>{reviews.slice(0, 10).map(review => <article key={review.id} className="dash-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}><strong>{trackNames[review.tape_id] || 'Your track'}</strong><span style={{ color: gold, fontWeight: 800 }}>★ {review.rating}/5</span></div>
            <div className="dash-muted" style={{ marginTop: 4 }}>By {review.reviewer_name || 'Tape Deck listener'}{review.reviewer_role ? ' · ' + review.reviewer_role : ''}{review.created_at ? ' · ' + new Date(review.created_at).toLocaleDateString() : ''}</div>
            <p style={{ whiteSpace: 'pre-wrap', color: '#cbd5e1', fontSize: 13, lineHeight: 1.65, marginBottom: 0 }}>{review.body}</p>
            <div style={{ marginTop: 10 }}><Link to={'/tapedeck/track/' + review.tape_id} style={{ color: gold, textDecoration: 'none', fontSize: 13 }}>View track and reviews →</Link></div>
          </article>)}</div> : <p style={muted}>No feedback yet. Once listeners review your tracks, their ratings and comments will appear here.</p>}
        </section>
      </>}
    </main>
  </div>;
}
