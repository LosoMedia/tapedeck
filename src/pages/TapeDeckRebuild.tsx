import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Headphones, Search, UploadCloud, Music2, Sparkles, Users, Radio, Disc3, LogOut, ArrowUpRight, Play, RefreshCw } from 'lucide-react';
import { supabase, type TapeRow } from '@/lib/supabase';

const gold = '#d8b45a';
const panel: React.CSSProperties = { background: '#111824', border: '1px solid #273244', borderRadius: 16 };
const field: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1px solid #344154', borderRadius: 10, background: '#0b1220', color: '#f4f5f7', fontSize: 15 };
const label: React.CSSProperties = { display: 'block', color: '#c5cedb', fontSize: 13, fontWeight: 700, marginTop: 14 };
const button: React.CSSProperties = { border: '1px solid #b89b50', borderRadius: 10, padding: '11px 15px', background: gold, color: '#10151f', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' };

const genres = ['All music', 'Hip-hop', 'R&B', 'Pop', 'Electronic', 'Rock', 'Experimental'];

function coverStyle(index: number): React.CSSProperties {
  const covers = [
    'radial-gradient(circle at 75% 22%,#f5d68b 0,transparent 24%),linear-gradient(140deg,#7c2d46,#171a2b 65%,#080b12)',
    'radial-gradient(circle at 25% 70%,#50c8bd 0,transparent 28%),linear-gradient(145deg,#162b4c,#111824 58%,#362a48)',
    'radial-gradient(circle at 68% 35%,#ff9a62 0,transparent 25%),linear-gradient(135deg,#412b69,#131927 58%,#080b12)',
    'radial-gradient(circle at 40% 25%,#e2d4b0 0,transparent 18%),linear-gradient(145deg,#344a40,#121b21 60%,#080b12)',
    'radial-gradient(circle at 72% 70%,#8ca9f7 0,transparent 30%),linear-gradient(145deg,#33213d,#121824 60%,#080b12)',
  ];
  return { background: covers[index % covers.length] };
}

export function TapeDeckRebuild() {
  const [sessionUser, setSessionUser] = useState<{ id: string; email?: string } | null>(null);
  const [tapes, setTapes] = useState<TapeRow[]>([]);
  const [search, setSearch] = useState('');
  const [activeGenre, setActiveGenre] = useState('All music');
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [classification, setClassification] = useState<'ai' | 'organic' | 'hybrid'>('organic');
  const [genre, setGenre] = useState('Hip-hop');
  const [description, setDescription] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadTapes() {
    setLoading(true);
    const { data, error: loadError } = await supabase.from('tapes').select('*').order('created_at', { ascending: false }).limit(60);
    if (loadError) setError('Could not load tracks: ' + loadError.message);
    else setTapes((data || []) as TapeRow[]);
    setLoading(false);
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

  const visibleTapes = useMemo(() => tapes.filter((tape) => {
    const text = [tape.title, tape.artist, tape.genre, tape.description, tape.classification].filter(Boolean).join(' ').toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase().trim());
    const matchesGenre = activeGenre === 'All music' || (tape.genre || '').toLowerCase().includes(activeGenre.toLowerCase());
    return matchesSearch && matchesGenre;
  }), [tapes, search, activeGenre]);

  async function submitTape(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); setNotice('');
    if (!sessionUser) { setError('Sign in first, then publish your track.'); return; }
    if (!audioFile) { setError('Choose an audio file first.'); return; }
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
        artist_id: sessionUser.id,
        title: title.trim(),
        artist: artist.trim() || sessionUser.email?.split('@')[0] || 'Independent artist',
        classification,
        genre: genre.trim(),
        mood: '',
        bpm: 120,
        musical_key: '',
        duration: '0:00',
        audio_url: urlData.publicUrl,
        cover_url: '',
        description: description.trim(),
        skills_needed: [],
        collaboration_status: 'open',
        rating: 0,
        plays: '0'
      });
      if (saveError) throw new Error('Audio uploaded, but the track record was not saved: ' + saveError.message);
      setTitle(''); setArtist(''); setGenre('Hip-hop'); setDescription(''); setAudioFile(null);
      const picker = document.getElementById('tape-audio-picker') as HTMLInputElement | null;
      if (picker) picker.value = '';
      setNotice('Your Tape has been published.');
      setShowUpload(false);
      await loadTapes();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed unexpectedly.');
    } finally { setBusy(false); }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSessionUser(null);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#090d14', color: '#f4f5f7', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        .td-wrap { width: min(1180px, calc(100% - 36px)); margin: 0 auto; }
        .td-nav { display:flex; align-items:center; justify-content:space-between; gap:20px; padding:18px 0; }
        .td-logo { font-weight:950; letter-spacing:1px; font-size:22px; }
        .td-link { color:#aeb8c8; text-decoration:none; font-size:14px; font-weight:650; }
        .td-link:hover { color:#fff; }
        .td-hero { display:grid; grid-template-columns:minmax(0,1.15fr) minmax(260px,.85fr); gap:28px; align-items:center; padding:44px 0 36px; }
        .td-hero-title { font-size:clamp(36px,5.4vw,64px); line-height:.98; letter-spacing:-2px; margin:14px 0 18px; font-weight:950; max-width:720px; }
        .td-hero-copy { color:#a3adbd; line-height:1.7; font-size:16px; max-width:560px; }
        .td-feature { min-height:260px; border-radius:22px; border:1px solid #354052; background:radial-gradient(circle at 70% 20%,#6e5c2f55,transparent 30%),linear-gradient(145deg,#18253a,#0d121c 68%); padding:25px; display:flex; flex-direction:column; justify-content:space-between; overflow:hidden; position:relative; }
        .td-feature:after { content:''; position:absolute; width:190px; height:190px; right:-35px; bottom:-45px; border:1px solid #d8b45a66; border-radius:50%; box-shadow:0 0 0 18px #d8b45a0b,0 0 0 38px #d8b45a08; }
        .td-chip { display:inline-flex; align-items:center; gap:7px; border:1px solid #3b4658; background:#121a27; color:#d4dbe5; border-radius:999px; padding:7px 10px; font-size:11px; letter-spacing:1px; text-transform:uppercase; font-weight:800; }
        .td-section-head { display:flex; align-items:end; justify-content:space-between; gap:16px; margin:12px 0 18px; }
        .td-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; }
        .td-card { min-width:0; background:#111824; border:1px solid #273244; border-radius:15px; padding:11px; transition:transform .18s,border-color .18s; }
        .td-card:hover { transform:translateY(-3px); border-color:#6b634b; }
        .td-cover { aspect-ratio:1/1; border-radius:10px; display:flex; align-items:end; padding:12px; overflow:hidden; }
        .td-cover-mark { font-size:11px; letter-spacing:2px; font-weight:900; color:#ffffffc9; text-shadow:0 2px 12px #000; }
        .td-track-title { font-size:15px; font-weight:850; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin:12px 0 5px; }
        .td-muted { color:#8995a7; font-size:12px; }
        .td-search { position:relative; width:min(330px,100%); }
        .td-search input { width:100%; background:#101722; border:1px solid #2c3749; border-radius:10px; padding:12px 12px 12px 38px; color:#f4f5f7; outline:none; }
        .td-search input:focus { border-color:#a88d4d; }
        .td-genre { border:1px solid #2b3648; background:#101722; color:#aeb8c8; padding:9px 13px; border-radius:999px; font-size:13px; cursor:pointer; }
        .td-genre.active { color:#f4f5f7; border-color:#a88d4d; background:#d8b45a18; }
        .td-bottom { border-top:1px solid #222c3b; margin-top:54px; padding:25px 0 32px; color:#758195; font-size:12px; display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap; }
        @media(max-width:800px) { .td-hero { grid-template-columns:1fr; padding-top:30px; } .td-feature { min-height:200px; } .td-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .td-section-head { align-items:stretch; flex-direction:column; } .td-search { width:100%; } }
        @media(max-width:430px) { .td-wrap { width:calc(100% - 24px); } .td-nav { align-items:flex-start; } .td-nav-links { display:none !important; } .td-hero-title { letter-spacing:-1px; } .td-grid { gap:10px; } }
      `}</style>

      <header style={{ borderBottom: '1px solid #222c3b', background: '#0b1019eF', position: 'sticky', top: 0, zIndex: 5, backdropFilter: 'blur(14px)' }}>
        <div className="td-wrap td-nav">
          <Link to="/tapedeck" style={{ color: '#f4f5f7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 35, height: 35, border: '1px solid #a88d4d', borderRadius: 10, display: 'grid', placeItems: 'center', color: gold }}><Disc3 size={21} /></span>
            <span className="td-logo">TAPE DECK<span style={{ color: gold }}>.</span><small style={{ display: 'block', color: '#738095', fontSize: 9, letterSpacing: 2, marginTop: 2 }}>BY LOSOMEDIA</small></span>
          </Link>
          <nav className="td-nav-links" style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
            <a className="td-link" href="#discover">Discover</a><a className="td-link" href="#community">Community</a><a className="td-link" href="#upload">Upload music</a>
          </nav>
          <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
            {sessionUser ? <><Link to="/tapedeck/profile" className="td-link" style={{ color: gold }}>My Profile</Link><span className="td-muted" style={{ maxWidth: 145, overflow: 'hidden', textOverflow: 'ellipsis' }}>{sessionUser.email || 'Member'}</span><button onClick={signOut} title="Sign out" style={{ ...button, background: '#151d2a', color: '#e2e8f0', borderColor: '#354052', padding: '9px 10px' }}><LogOut size={15} /></button></> : <Link to="/tapedeck/auth" style={{ ...button, padding: '10px 14px' }}>Sign in <ArrowUpRight size={15} /></Link>}
          </div>
        </div>
      </header>

      <main className="td-wrap">
        <section className="td-hero">
          <div>
            <span className="td-chip"><Sparkles size={13} color={gold} /> Independent music, all in one place</span>
            <h1 className="td-hero-title">Your next favorite<br /><span style={{ color: gold }}>starts here.</span></h1>
            <p className="td-hero-copy">Discover new sounds, put your own music out there, and connect with the people building what comes next. AI-made, human-made, and everything in between.</p>
            <div style={{ display: 'flex', gap: 11, flexWrap: 'wrap', marginTop: 23 }}>
              <a href="#discover" style={button}><Headphones size={17} /> Explore music</a>
              <button onClick={() => { setError(''); setShowUpload(true); }} style={{ ...button, background: 'transparent', color: '#f4f5f7', borderColor: '#3a4659' }}><UploadCloud size={17} /> Drop a Tape</button>
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 28, color: '#9ba7b8', fontSize: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Music2 size={15} color={gold} /> Artist-first discovery</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Users size={15} color={gold} /> Real collaboration</span>
            </div>
          </div>
          <div className="td-feature">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}><span className="td-chip">THE TAPE DECK COMMUNITY</span><Radio size={20} color={gold} /></div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ color: gold, textTransform: 'uppercase', letterSpacing: 3, fontSize: 10, fontWeight: 900, marginBottom: 9 }}>Made to be heard</div>
              <div style={{ fontSize: 27, lineHeight: 1.1, fontWeight: 900, maxWidth: 290 }}>Not just another place to upload.</div>
              <p style={{ color: '#9ba7b8', fontSize: 13, lineHeight: 1.6, maxWidth: 330 }}>A growing home for tracks, feedback, and creative connections.</p>
            </div>
          </div>
        </section>

        <section id="community" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, margin: '5px 0 42px' }}>
          {[
            { icon: <Headphones size={19} />, title: 'Listen & discover', text: 'Find your next repeat track.' },
            { icon: <UploadCloud size={19} />, title: 'Share your sound', text: 'Get your music in front of listeners.' },
            { icon: <Users size={19} />, title: 'Build together', text: 'Meet artists and collaborators.' },
          ].map((item) => <article key={item.title} style={{ ...panel, padding: 17, display: 'flex', gap: 13, alignItems: 'flex-start' }}><span style={{ color: gold, paddingTop: 2 }}>{item.icon}</span><div><div style={{ fontSize: 14, fontWeight: 850 }}>{item.title}</div><div style={{ color: '#8f9bad', fontSize: 12, lineHeight: 1.5, marginTop: 5 }}>{item.text}</div></div></article>)}
        </section>

        <section id="discover">
          <div className="td-section-head">
            <div><div style={{ color: gold, fontSize: 10, fontWeight: 900, letterSpacing: 2.5, marginBottom: 7 }}>FIND YOUR SOUND</div><h2 style={{ fontSize: 27, margin: 0, letterSpacing: -.5 }}>Explore the deck</h2></div>
            <div className="td-search"><Search size={16} color="#8d99aa" style={{ position: 'absolute', left: 13, top: 13 }} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tracks, artists, genres…" aria-label="Search music" /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16, marginBottom: 8 }}>
            {genres.map(item => <button key={item} className={'td-genre' + (activeGenre === item ? ' active' : '')} onClick={() => setActiveGenre(item)}>{item}</button>)}
          </div>
          {error && <p role="alert" style={{ color: '#fecaca', background: '#351a22', border: '1px solid #6e303b', padding: 12, borderRadius: 10, overflowWrap: 'anywhere' }}>{error}</p>}
          {notice && <p role="status" style={{ color: '#b9f6ce', background: '#10281c', border: '1px solid #27563c', padding: 12, borderRadius: 10 }}>{notice}</p>}
          {loading ? <p style={{ color: '#8f9bad', padding: '20px 0' }}>Loading the latest Tapes…</p> : visibleTapes.length === 0 ? (
            <div style={{ ...panel, padding: '38px 22px', textAlign: 'center' }}>
              <span style={{ display: 'inline-grid', placeItems: 'center', width: 52, height: 52, borderRadius: 16, border: '1px solid #39465a', color: gold, marginBottom: 13 }}><Music2 size={24} /></span>
              <h3 style={{ margin: '0 0 7px', fontSize: 18 }}>{search || activeGenre !== 'All music' ? 'No matching tracks yet' : 'The first track could be yours.'}</h3>
              <p style={{ margin: '0 auto 18px', color: '#8f9bad', fontSize: 13, lineHeight: 1.6, maxWidth: 430 }}>{search || activeGenre !== 'All music' ? 'Try a different search or genre.' : 'This deck is just getting warmed up. Publish a track and help start the collection.'}</p>
              <button onClick={() => { setError(''); setShowUpload(true); }} style={button}><UploadCloud size={16} /> Drop a Tape</button>
            </div>
          ) : <div className="td-grid">
            {visibleTapes.map((tape, index) => {
              const description = (tape.description || '').split('\n').filter(line => !line.startsWith('Type: ') && !line.startsWith('Genre: ') && !line.startsWith('Artist: ')).join(' ').trim();
              const artistName = (tape as TapeRow & { artist_name?: string }).artist || (tape as TapeRow & { artist_name?: string }).artist_name || 'Independent artist';
              return <article key={tape.id} className="td-card">
                <div className="td-cover" style={coverStyle(index)}>{tape.cover_url ? <img src={tape.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} /> : <span className="td-cover-mark">TAPE DECK / {String(index + 1).padStart(2, '0')}</span>}</div>
                <Link className="td-track-title" title={tape.title} to={"/tapedeck/track/" + tape.id} style={{ display: "block", color: "#f4f5f7", textDecoration: "none" }}>{tape.title || 'Untitled Tape'}</Link>
                <div className="td-muted" style={{ marginBottom: 8 }}>{tape.artist_id ? <Link to={"/tapedeck/artist/" + tape.artist_id} style={{ color: "#b7c2d3", textDecoration: "none" }}>{artistName}</Link> : artistName}</div>
                {description && <p style={{ color: '#9ba7b8', fontSize: 12, lineHeight: 1.5, margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{description}</p>}
                {tape.audio_url ? <audio controls preload="none" src={tape.audio_url} style={{ width: '100%', height: 34 }} aria-label={'Play ' + tape.title}>Audio playback not supported.</audio> : <span className="td-muted">Audio preview unavailable</span>}
              </article>;
            })}
          </div>}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}><button onClick={() => { setError(''); void loadTapes(); }} style={{ ...button, background: 'transparent', color: '#c8d0dc', borderColor: '#344154' }}><RefreshCw size={14} /> Refresh tracks</button></div>
        </section>

        <section id="upload" style={{ ...panel, marginTop: 48, padding: '25px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', background: 'linear-gradient(110deg,#131d2b,#101620)' }}>
          <div><div style={{ color: gold, fontSize: 10, fontWeight: 900, letterSpacing: 2.5, marginBottom: 8 }}>YOUR TURN</div><h2 style={{ fontSize: 23, margin: '0 0 7px' }}>Got something worth hearing?</h2><p style={{ color: '#9ba7b8', margin: 0, fontSize: 13, lineHeight: 1.6 }}>Put your latest work on the deck and let people press play.</p></div>
          <button onClick={() => { setError(''); setShowUpload(true); }} style={button}><UploadCloud size={17} /> Publish a Tape</button>
        </section>

        <footer className="td-bottom"><span>© {new Date().getFullYear()} LosoMedia · Tape Deck</span><span>Built for independent music and creative community.</span></footer>
      </main>

      {showUpload && <div role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setShowUpload(false); }} style={{ position: 'fixed', inset: 0, zIndex: 20, background: '#02050bd9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
        <form onSubmit={submitTape} style={{ ...panel, width: 'min(540px,100%)', padding: 23, margin: 'auto', boxShadow: '0 30px 100px #0009' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}><div><div style={{ color: gold, fontSize: 10, letterSpacing: 2, fontWeight: 900 }}>PUBLISH YOUR MUSIC</div><h2 style={{ margin: '7px 0 5px', fontSize: 25 }}>Drop a Tape</h2><p style={{ color: '#8f9bad', margin: 0, fontSize: 13 }}>MP3, M4A, WAV, AAC, OGG, FLAC or WebM. Max 50 MB.</p></div><button type="button" aria-label="Close upload" onClick={() => setShowUpload(false)} style={{ background: '#1b2534', border: '1px solid #39465a', color: '#f4f5f7', borderRadius: 9, padding: '7px 10px', cursor: 'pointer' }}>✕</button></div>
          <label style={label}>Audio file *
            <input id="tape-audio-picker" type="file" accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg,.flac,.webm" required onChange={e => setAudioFile(e.currentTarget.files?.[0] || null)} style={{ ...field, marginTop: 7, padding: 12 }} />
          </label>
          {audioFile && <p style={{ color: '#a7e9bd', fontSize: 12 }}>{audioFile.name} · {(audioFile.size / 1048576).toFixed(1)} MB</p>}
          <label style={label}>Track title *<input style={field} value={title} onChange={e => setTitle(e.target.value)} required placeholder="Name your track" /></label>
          <label style={label}>Artist name<input style={field} value={artist} onChange={e => setArtist(e.target.value)} placeholder="Your artist name" /></label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={label}>Creation type<select style={field} value={classification} onChange={e => setClassification(e.target.value as 'ai' | 'organic' | 'hybrid')}><option value="organic">Human-made</option><option value="ai">AI-generated</option><option value="hybrid">Hybrid</option></select></label>
            <label style={label}>Genre<select style={field} value={genre} onChange={e => setGenre(e.target.value)}>{genres.filter(g => g !== 'All music').map(g => <option key={g} value={g}>{g}</option>)}<option value="Other">Other</option></select></label>
          </div>
          <label style={label}>About this track<textarea style={{ ...field, minHeight: 82, resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="What should listeners know?" /></label>
          {!sessionUser && <p style={{ color: '#e9d29a', fontSize: 13, lineHeight: 1.5 }}>You need an account before publishing. <Link to="/tapedeck/auth" style={{ color: gold }}>Sign in or join here.</Link></p>}
          {error && <p role="alert" style={{ color: '#fecaca', background: '#351a22', border: '1px solid #6e303b', padding: 11, borderRadius: 9, overflowWrap: 'anywhere', fontSize: 13 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}><button type="button" onClick={() => setShowUpload(false)} style={{ ...button, flex: 1, background: '#151d2a', color: '#d7deea', borderColor: '#344154' }}>Cancel</button><button type="submit" disabled={busy || !sessionUser} style={{ ...button, flex: 1, opacity: busy || !sessionUser ? .55 : 1 }}>{busy ? 'UPLOADING…' : <><Play size={15} /> Publish Tape</>}</button></div>
        </form>
      </div>}
    </div>
  );
}
