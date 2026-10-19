import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, type TapeRow } from '@/lib/supabase';

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '12px 14px',
  border: '1px solid #475569', borderRadius: 10, background: '#0f172a',
  color: '#f8fafc', fontSize: 16, marginTop: 6
};
const labelStyle: React.CSSProperties = { display: 'block', color: '#cbd5e1', fontSize: 14, fontWeight: 700, marginTop: 16 };
const buttonStyle: React.CSSProperties = {
  border: 0, borderRadius: 10, padding: '13px 18px', background: '#f5c451',
  color: '#111827', fontWeight: 800, fontSize: 15, cursor: 'pointer'
};

export function TapeDeckRebuild() {
  const [sessionUser, setSessionUser] = useState<{ id: string; email?: string } | null>(null);
  const [tapes, setTapes] = useState<TapeRow[]>([]);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [classification, setClassification] = useState<'ai' | 'organic' | 'hybrid'>('organic');
  const [genre, setGenre] = useState('');
  const [description, setDescription] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function loadTapes() {
    const { data, error: loadError } = await supabase.from('tapes').select('*').order('created_at', { ascending: false }).limit(30);
    if (loadError) setError('Could not load tracks: ' + loadError.message);
    else setTapes((data || []) as TapeRow[]);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      setSessionUser(user ? { id: user.id, email: user.email } : null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setSessionUser(user ? { id: user.id, email: user.email } : null);
    });
    void loadTapes();
    return () => listener.subscription.unsubscribe();
  }, []);

  async function submitTape(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!sessionUser) { setError('Sign in first, then upload your track.'); return; }
    if (!audioFile) { setError('Choose an audio file using the file picker above.'); return; }
    if (audioFile.size > 50 * 1024 * 1024) { setError('The audio file must be 50 MB or smaller.'); return; }
    setBusy(true);
    let uploadedPath: string | null = null;
    try {
      const safeName = audioFile.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      uploadedPath = sessionUser.id + '/' + Date.now() + '-' + safeName;
      const { error: storageError } = await supabase.storage.from('tape-audio').upload(uploadedPath, audioFile, {
        contentType: audioFile.type || 'application/octet-stream', upsert: false
      });
      if (storageError) throw new Error('Audio upload failed: ' + storageError.message);
      const { data: urlData } = supabase.storage.from('tape-audio').getPublicUrl(uploadedPath);
      const { error: saveError } = await supabase.from('tapes').insert({
        title: title.trim(), artist: artist.trim(), classification, genre: genre.trim(),
        mood: '', bpm: 120, musical_key: '', duration: '0:00', audio_url: urlData.publicUrl,
        cover_url: '', description: description.trim(), skills_needed: [],
        collaboration_status: 'open', rating: 0, plays: '0'
      });
      if (saveError) throw new Error('File uploaded, but track details were not saved: ' + saveError.message);
      setTitle(''); setArtist(''); setGenre(''); setDescription(''); setAudioFile(null);
      const picker = document.getElementById('fresh-audio-picker') as HTMLInputElement | null;
      if (picker) picker.value = '';
      setNotice('Track uploaded and saved.');
      await loadTapes();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed unexpectedly.');
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSessionUser(null);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070b14', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={{ borderBottom: '1px solid #263244', background: '#0b1220' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '22px 20px', display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: '#f5c451', fontSize: 12, fontWeight: 900, letterSpacing: 4 }}>LOSOMEDIA PRESENTS</div>
            <h1 style={{ fontSize: 30, lineHeight: 1.1, margin: '7px 0 0', fontWeight: 900 }}>TAPE DECK</h1>
            <p style={{ color: '#94a3b8', margin: '6px 0 0' }}>A home for AI artists, human musicians, and the music they make together.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {sessionUser ? <><span style={{ color: '#cbd5e1', fontSize: 13 }}>{sessionUser.email || 'Signed in'}</span><button style={{ ...buttonStyle, background: '#1e293b', color: '#f8fafc' }} onClick={signOut}>Sign out</button></> : <Link to="/tapedeck/auth" style={{ ...buttonStyle, textDecoration: 'none' }}>Sign in / Join</Link>}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '30px 20px 70px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 24 }}>
        <section style={{ padding: '28px 24px', border: '1px solid #263244', borderRadius: 18, background: 'linear-gradient(130deg,#111c2e,#0b1220)' }}>
          <p style={{ color: '#f5c451', fontWeight: 800, letterSpacing: 2, fontSize: 12, margin: 0 }}>DROP YOUR NEXT TRACK</p>
          <h2 style={{ fontSize: 26, margin: '8px 0' }}>Upload music. Find collaborators. Get heard.</h2>
          <p style={{ color: '#94a3b8', margin: 0 }}>A fresh upload form, written independently of the previous modal.</p>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: 24, alignItems: 'start' }}>
          <form onSubmit={submitTape} style={{ padding: 22, border: '1px solid #334155', borderRadius: 18, background: '#111827' }}>
            <h2 style={{ fontSize: 22, margin: '0 0 6px' }}>Drop a Tape</h2>
            <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 14px' }}>Step 1 is the actual native file input, not a hidden button.</p>

            <label htmlFor="fresh-audio-picker" style={{ ...labelStyle, marginTop: 8, color: '#f5c451', fontSize: 16 }}>STEP 1: CHOOSE AUDIO FILE *</label>
            <input id="fresh-audio-picker" name="audio" type="file" accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg,.flac,.webm" required
              onChange={(event) => setAudioFile(event.currentTarget.files?.[0] || null)}
              style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 8, padding: 14, minHeight: 58, border: '2px solid #f5c451', borderRadius: 10, background: '#020617', color: '#fff', fontSize: 15 }} />
            <p style={{ color: '#94a3b8', fontSize: 12, margin: '8px 0 0' }}>MP3, M4A, WAV, AAC, OGG, FLAC or WebM. Maximum 50 MB.</p>
            {audioFile && <p style={{ color: '#86efac', fontSize: 13 }}>Selected: {audioFile.name} ({(audioFile.size / 1048576).toFixed(1)} MB)</p>}

            <label style={labelStyle}>Track title *
              <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Name of your track" />
            </label>
            <label style={labelStyle}>Artist name *
              <input style={inputStyle} value={artist} onChange={(e) => setArtist(e.target.value)} required placeholder="Your artist name" />
            </label>
            <label style={labelStyle}>Track type
              <select style={inputStyle} value={classification} onChange={(e) => setClassification(e.target.value as 'ai' | 'organic' | 'hybrid')}>
                <option value="organic">Organic / human-made</option><option value="ai">AI-generated</option><option value="hybrid">Hybrid / collaboration</option>
              </select>
            </label>
            <label style={labelStyle}>Genre
              <input style={inputStyle} value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Hip-hop, R&B, pop..." />
            </label>
            <label style={labelStyle}>Description
              <textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell listeners about this track." />
            </label>
            <button type="submit" disabled={busy} style={{ ...buttonStyle, width: '100%', marginTop: 20, opacity: busy ? .65 : 1 }}>{busy ? 'UPLOADING…' : 'UPLOAD AND PUBLISH TAPE'}</button>
            {!sessionUser && <p style={{ color: '#fcd34d', fontSize: 13, marginBottom: 0 }}>You need to <Link to="/tapedeck/auth" style={{ color: '#f5c451' }}>sign in or join</Link> before publishing.</p>}
            {error && <p role="alert" style={{ color: '#fca5a5', background: '#450a0a', padding: 12, borderRadius: 8, overflowWrap: 'anywhere' }}>{error}</p>}
            {notice && <p role="status" style={{ color: '#86efac', background: '#052e16', padding: 12, borderRadius: 8 }}>{notice}</p>}
          </form>

          <section style={{ padding: 22, border: '1px solid #334155', borderRadius: 18, background: '#111827' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <h2 style={{ fontSize: 22, margin: 0 }}>Latest Tapes</h2>
              <button type="button" onClick={() => { setError(''); void loadTapes(); }} style={{ ...buttonStyle, padding: '9px 12px', fontSize: 13 }}>Refresh</button>
            </div>
            {tapes.length === 0 ? <p style={{ color: '#94a3b8', marginTop: 18 }}>No published tracks to show yet.</p> : <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
              {tapes.map((tape) => <article key={tape.id} style={{ padding: 14, border: '1px solid #334155', borderRadius: 12, background: '#0b1220' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 17 }}>{tape.title}</h3>
                <p style={{ margin: '0 0 10px', color: '#94a3b8', fontSize: 13 }}>{tape.artist} · {tape.genre || tape.classification}</p>
                {tape.description && <p style={{ margin: '0 0 10px', color: '#cbd5e1', fontSize: 14 }}>{tape.description}</p>}
                {tape.audio_url ? <audio controls preload="none" src={tape.audio_url} style={{ width: '100%' }}>Your browser does not support audio playback.</audio> : <span style={{ color: '#94a3b8', fontSize: 12 }}>No audio URL on this record.</span>}
              </article>)}
            </div>}
          </section>
        </section>
      </main>
    </div>
  );
}
