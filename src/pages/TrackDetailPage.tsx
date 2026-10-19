import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Disc3, Music2, UserRound } from 'lucide-react';
import { supabase, type TapeRow } from '@/lib/supabase';

const gold = '#d8b45a';
const panel: React.CSSProperties = { background: '#111824', border: '1px solid #273244', borderRadius: 18, padding: 22 };

export function TrackDetailPage() {
  const { trackId } = useParams();
  const [track, setTrack] = useState<TapeRow | null>(null);
  const [artistName, setArtistName] = useState('Independent artist');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!trackId) { setError('Track not found.'); setBusy(false); return; }
      const { data, error: loadError } = await supabase.from('tapes').select('*').eq('id', trackId).maybeSingle();
      if (!alive) return;
      if (loadError) setError('Could not load this track: ' + loadError.message);
      else if (!data) setError('This track could not be found. It may have been removed.');
      else {
        const found = data as TapeRow;
        setTrack(found);
        setArtistName(found.artist || 'Independent artist');
      }
      setBusy(false);
    }
    void load();
    return () => { alive = false; };
  }, [trackId]);

  return <div style={{ minHeight: '100vh', background: '#090d14', color: '#f4f5f7', fontFamily: 'Inter,system-ui,sans-serif', paddingBottom: 48 }}>
    <style>{`*{box-sizing:border-box}body{margin:0}.track-wrap{width:min(900px,calc(100% - 32px));margin:0 auto}.track-muted{color:#9ba7b8;font-size:13px;line-height:1.7}.track-link{color:#d8b45a;text-decoration:none}.track-button{display:inline-flex;align-items:center;gap:8px;border:1px solid #b89b50;border-radius:10px;padding:10px 14px;background:#d8b45a;color:#10151f;text-decoration:none;font-weight:800}`}</style>
    <header style={{ borderBottom: '1px solid #222c3b', padding: 18 }}>
      <div className="track-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <Link to="/tapedeck" style={{ color: '#f4f5f7', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 9 }}><Disc3 color={gold} size={24} /> <strong>TAPE DECK<span style={{ color: gold }}>.</span></strong></Link>
        <Link to="/tapedeck" className="track-muted" style={{ textDecoration: 'none' }}><ArrowLeft size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Back to discovery</Link>
      </div>
    </header>
    <main className="track-wrap" style={{ paddingTop: 30 }}>
      {busy ? <p className="track-muted">Loading track…</p> : error ? <div role="alert" style={{ ...panel, color: '#fecaca' }}>{error}<p><Link className="track-link" to="/tapedeck">Return to Tape Deck</Link></p></div> : track && <>
        <section style={{ ...panel, display: 'grid', gridTemplateColumns: 'minmax(0,300px) minmax(0,1fr)', gap: 26, alignItems: 'center' }}>
          <div style={{ aspectRatio: '1 / 1', borderRadius: 14, overflow: 'hidden', background: 'radial-gradient(circle at 70% 25%,#d8b45a66,transparent 28%),linear-gradient(145deg,#26364e,#111824 65%,#080b12)', border: '1px solid #354052', display: 'grid', placeItems: 'center' }}>
            {track.cover_url ? <img src={track.cover_url} alt={track.title + ' cover'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center', color: gold }}><Music2 size={52} /><div style={{ fontSize: 11, letterSpacing: 3, marginTop: 12, fontWeight: 900 }}>TAPE DECK</div></div>}
          </div>
          <div>
            <div style={{ color: gold, fontSize: 10, fontWeight: 900, letterSpacing: 2.5 }}>TRACK DETAILS</div>
            <h1 style={{ fontSize: 'clamp(30px,5vw,48px)', lineHeight: 1.05, margin: '12px 0', overflowWrap: 'anywhere' }}>{track.title || 'Untitled Tape'}</h1>
            <div style={{ marginBottom: 18 }}>{track.artist_id ? <Link className="track-link" to={'/tapedeck/artist/' + track.artist_id}>{artistName}</Link> : <span>{artistName}</span>}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {[track.genre || 'Independent music', track.classification === 'ai' ? 'AI-generated' : track.classification === 'hybrid' ? 'Hybrid creation' : 'Human-made', track.musical_key || 'Key not listed', track.bpm ? track.bpm + ' BPM' : 'BPM not listed'].map((tag) => <span key={tag} style={{ border: '1px solid #354052', background: '#0b1220', color: '#cbd5e1', borderRadius: 999, padding: '7px 10px', fontSize: 12 }}>{tag}</span>)}
            </div>
            {track.audio_url ? <audio controls preload="metadata" src={track.audio_url} style={{ width: '100%', minWidth: 0 }}>Audio playback not supported.</audio> : <p className="track-muted">Audio preview unavailable.</p>}
          </div>
        </section>
        <section style={{ ...panel, marginTop: 18 }}>
          <h2 style={{ margin: '0 0 10px', fontSize: 20 }}>About this track</h2>
          <p className="track-muted" style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{track.description?.trim() || 'The artist has not added a description for this track yet.'}</p>
          <div className="track-muted" style={{ borderTop: '1px solid #273244', marginTop: 20, paddingTop: 14 }}>Published {track.created_at ? new Date(track.created_at).toLocaleDateString() : 'date unavailable'}</div>
        </section>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
          {track.artist_id && <Link className="track-button" to={'/tapedeck/artist/' + track.artist_id}><UserRound size={16} /> View artist profile</Link>}
          <Link to="/tapedeck" className="track-button" style={{ background: '#151d2a', color: '#e2e8f0', borderColor: '#354052' }}>Explore more music</Link>
        </div>
      </>}
    </main>
  </div>;
}
