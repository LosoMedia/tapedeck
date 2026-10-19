import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Music2, Save, UserRound } from 'lucide-react';
import { supabase, type TapeRow } from '@/lib/supabase';

type ArtistProfile = {
  id: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  soundcloud_url: string;
  spotify_url: string;
  youtube_url: string;
  instagram_url: string;
  tiktok_url: string;
};

const blankProfile = (id: string, name = ''): ArtistProfile => ({
  id, display_name: name, bio: '', avatar_url: '', soundcloud_url: '', spotify_url: '',
  youtube_url: '', instagram_url: '', tiktok_url: ''
});
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '12px 13px', marginTop: 6, background: '#101010', color: '#f4f5f7', border: '1px solid #383838', borderRadius: 10, font: 'inherit' };
const labelStyle: React.CSSProperties = { display: 'block', marginTop: 14, color: '#c5cedb', fontSize: 13, fontWeight: 700 };
const gold = '#d8b45a';

export function ArtistProfilePage() {
  const { artistId } = useParams();
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [draft, setDraft] = useState<ArtistProfile | null>(null);
  const [tracks, setTracks] = useState<TapeRow[]>([]);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const isOwnProfile = !artistId || artistId === userId;

  useEffect(() => {
    let alive = true;
    async function load() {
      setBusy(true); setError('');
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (user && alive) { setUserId(user.id); setEmail(user.email || ''); }
      const targetId = artistId || user?.id;
      if (!targetId) {
        if (alive) { setError('Sign in to create your artist profile.'); setBusy(false); }
        return;
      }
      const [{ data: profileData, error: profileError }, { data: tapeData, error: tapeError }] = await Promise.all([
        supabase.from('artist_profiles').select('*').eq('id', targetId).maybeSingle(),
        supabase.from('tapes').select('*').eq('artist_id', targetId).order('created_at', { ascending: false }).limit(60)
      ]);
      if (!alive) return;
      if (profileError) setError('Profiles need the Tape Deck profile database update before they can load: ' + profileError.message);
      if (tapeError) setError((old) => old ? old + ' · ' + tapeError.message : 'Could not load this artist’s tracks: ' + tapeError.message);
      const fallbackName = (tapeData || []).find((t: any) => t.artist)?.artist || user?.email?.split('@')[0] || 'Independent artist';
      const loaded = { ...blankProfile(targetId, fallbackName), ...(profileData || {}) } as ArtistProfile;
      setProfile(loaded); setDraft({ ...loaded }); setTracks((tapeData || []) as TapeRow[]);
      setBusy(false);
    }
    void load();
    return () => { alive = false; };
  }, [artistId]);

  function change(key: keyof ArtistProfile, value: string) {
    setDraft((current) => current ? { ...current, [key]: value } : current);
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || !userId) { setError('Sign in before saving your profile.'); return; }
    setSaving(true); setError(''); setNotice('');
    const payload = { ...draft, id: userId, updated_at: new Date().toISOString() };
    const { data, error: saveError } = await supabase.from('artist_profiles').upsert(payload, { onConflict: 'id' }).select().single();
    if (saveError) setError('Could not save profile: ' + saveError.message);
    else { setProfile(data as ArtistProfile); setDraft(data as ArtistProfile); setNotice('Profile saved. Your artist page is live.'); }
    setSaving(false);
  }

  const shown = draft || profile;
  const socialLinks = shown ? [
    ['SoundCloud', shown.soundcloud_url], ['Spotify', shown.spotify_url], ['YouTube', shown.youtube_url],
    ['Instagram', shown.instagram_url], ['TikTok', shown.tiktok_url]
  ].filter((item) => item[1]) : [];

  return <div style={{ minHeight: '100vh', background: '#090909', color: '#f4f5f7', fontFamily: 'Inter,system-ui,sans-serif', paddingBottom: 50 }}>
    <style>{`*{box-sizing:border-box}body{margin:0}.ap-wrap{width:min(900px,calc(100% - 32px));margin:0 auto}.ap-card{background:#191919;border:1px solid #303030;border-radius:16px;padding:22px}.ap-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:${gold};color:#111111;border:1px solid #b89b50;border-radius:10px;padding:11px 15px;font-weight:800;text-decoration:none;cursor:pointer}.ap-muted{color:#9ba7b8;font-size:13px;line-height:1.6}.ap-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}.ap-track{background:#141414;border:1px solid #303030;border-radius:12px;padding:14px}@media(max-width:520px){.ap-card{padding:16px}}`}</style>
    <header style={{ borderBottom: '1px solid #2b2b2b', padding: '18px 0' }}><div className="ap-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <Link to="/tapedeck" style={{ color: '#f4f5f7', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}><ArrowLeft size={17} /> Back to Tape Deck</Link>
      {userId && <span className="ap-muted">Signed in as {email}</span>}
    </div></header>
    <main className="ap-wrap" style={{ paddingTop: 28 }}>
      {busy ? <p className="ap-muted">Loading artist profile…</p> : <>
        {error && <p role="alert" style={{ color: '#fecaca', background: '#351a22', padding: 12, borderRadius: 10, overflowWrap: 'anywhere' }}>{error}</p>}
        {notice && <p role="status" style={{ color: '#b9f6ce', background: '#10281c', padding: 12, borderRadius: 10 }}>{notice}</p>}
        <section className="ap-card" style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
          {shown?.avatar_url ? <img src={shown.avatar_url} alt="" style={{ width: 104, height: 104, objectFit: 'cover', borderRadius: 24, border: '1px solid #3a3a3a' }} /> : <div style={{ width: 104, height: 104, display: 'grid', placeItems: 'center', borderRadius: 24, background: '#252525', border: '1px solid #3a3a3a', color: gold }}><UserRound size={43} /></div>}
          <div style={{ flex: 1, minWidth: 180 }}><div style={{ color: gold, fontSize: 10, letterSpacing: 2.5, fontWeight: 900 }}>ARTIST PROFILE</div><h1 style={{ margin: '8px 0', fontSize: 32, overflowWrap: 'anywhere' }}>{shown?.display_name || 'Independent artist'}</h1><p className="ap-muted" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{shown?.bio || 'This artist has not added a bio yet.'}</p></div>
        </section>
        {isOwnProfile && userId && draft && <form className="ap-card" onSubmit={saveProfile} style={{ marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 21 }}>Edit your profile</h2><p className="ap-muted" style={{ marginTop: 0 }}>Make it easy for listeners to know who you are and find your other work.</p>
          <label style={labelStyle}>Artist / display name<input style={inputStyle} maxLength={80} value={draft.display_name} onChange={e => change('display_name', e.target.value)} placeholder="Your artist name" required /></label>
          <label style={labelStyle}>Profile image URL<input style={inputStyle} type="url" value={draft.avatar_url} onChange={e => change('avatar_url', e.target.value)} placeholder="https://… (direct image link)" /></label>
          <label style={labelStyle}>Artist bio<textarea style={{ ...inputStyle, minHeight: 105, resize: 'vertical' }} maxLength={1200} value={draft.bio} onChange={e => change('bio', e.target.value)} placeholder="Your story, sound, influences, and what you are building." /></label>
          <div className="ap-grid">{([
            ['soundcloud_url','SoundCloud URL'],['spotify_url','Spotify URL'],['youtube_url','YouTube URL'],['instagram_url','Instagram URL'],['tiktok_url','TikTok URL']
          ] as [keyof ArtistProfile,string][]).map(([key, caption]) => <label key={key} style={labelStyle}>{caption}<input style={inputStyle} type="url" value={draft[key]} onChange={e => change(key, e.target.value)} placeholder="https://…" /></label>)}</div>
          <button className="ap-button" type="submit" disabled={saving} style={{ marginTop: 20, opacity: saving ? .6 : 1 }}><Save size={16} /> {saving ? 'Saving…' : 'Save profile'}</button>
        </form>}
        <section style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}><h2 style={{ fontSize: 22, margin: 0 }}>Music by {shown?.display_name || 'this artist'}</h2><span className="ap-muted">{tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}</span></div>
          {tracks.length ? <div className="ap-grid">{tracks.map((track) => <article key={track.id} className="ap-track"><div style={{ fontWeight: 850, marginBottom: 6 }}>{track.title || 'Untitled Tape'}</div><div className="ap-muted" style={{ marginBottom: 10 }}>{track.genre || 'Independent music'} · {track.classification || 'Track'}</div>{track.description && <p className="ap-muted">{track.description}</p>}{track.audio_url ? <audio controls preload="none" src={track.audio_url} style={{ width: '100%', height: 36 }} /> : <span className="ap-muted">Audio unavailable</span>}</article>)}</div> : <div className="ap-card ap-muted"><Music2 size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />No tracks published under this account yet.</div>}
        </section>
        {socialLinks.length > 0 && <section className="ap-card" style={{ marginTop: 22 }}><h2 style={{ marginTop: 0, fontSize: 19 }}>Find this artist</h2><div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>{socialLinks.map(([name,url]) => <a key={name} href={url} target="_blank" rel="noreferrer" className="ap-button" style={{ background: '#202020', color: '#e2e8f0', borderColor: '#383838' }}>{name} <ExternalLink size={14} /></a>)}</div></section>}
        {!userId && !artistId && <Link className="ap-button" to="/tapedeck/auth">Sign in to create your profile</Link>}
        {artistId && artistId !== userId && <div style={{ marginTop: 24 }}><Link to="/tapedeck" className="ap-button" style={{ background: '#202020', color: '#e2e8f0', borderColor: '#383838' }}>Explore more music</Link></div>}
      </>}
    </main>
  </div>;
}
