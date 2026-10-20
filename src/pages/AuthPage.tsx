import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const currentSite = window.location.origin;
const field: React.CSSProperties = {
  display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 7,
  padding: '13px 14px', borderRadius: 10, border: '1px solid #383838',
  background: '#101010', color: '#f8fafc', fontSize: 16
};
const primary: React.CSSProperties = {
  width: '100%', border: '1px solid #c92749', borderRadius: 10, padding: '14px 16px',
  background: '#ff3b5c', color: '#111111', fontWeight: 900, fontSize: 15, cursor: 'pointer'
};

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<'artist' | 'reviewer'>('artist');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) {
        const type = data.session.user.user_metadata?.account_type;
        navigate(type === 'reviewer' ? '/tapedeck/reviewer' : '/tapedeck/dashboard', { replace: true });
      }
    });
    return () => { active = false; };
  }, [navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'signup') {
        const { error: authError } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: {
            data: { display_name: name.trim(), account_type: accountType },
            emailRedirectTo: currentSite + '/tapedeck/auth',
          },
        });
        if (authError) setError(authError.message);
        else setMessage('Account created. Check your email to confirm it, then return to this Tape Deck sign-in page.');
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) setError(authError.message);
        else {
          const { data: sessionData } = await supabase.auth.getSession();
          const signedInUser = sessionData.session?.user;
          const type = signedInUser?.user_metadata?.account_type;
          if (signedInUser && type === 'reviewer') {
            const { data: roleRow } = await supabase.from('tapedeck_user_roles').select('role').eq('user_id', signedInUser.id).maybeSingle();
            if (roleRow?.role !== 'reviewer' && roleRow?.role !== 'admin') {
              const { data: existingRequest } = await supabase.from('tapedeck_reviewer_requests').select('id').eq('user_id', signedInUser.id).maybeSingle();
              if (!existingRequest) {
                await supabase.from('tapedeck_reviewer_requests').insert({ user_id: signedInUser.id, status: 'pending', message: 'Reviewer access requested during signup.' });
              }
              setMessage('You are signed in as an artist while your reviewer access request awaits administrator approval.');
              navigate('/tapedeck/dashboard', { replace: true });
              return;
            }
          }
          navigate(type === 'reviewer' ? '/tapedeck/reviewer' : '/tapedeck/dashboard', { replace: true });
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign-in failed. Please try again.');
    } finally { setBusy(false); }
  };

  const google = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: currentSite + '/tapedeck' },
      });
      if (authError) { setError(authError.message); setBusy(false); }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Google sign-in failed.');
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#090909', color: '#f4f5f7', fontFamily: 'Inter, system-ui, sans-serif', padding: '28px 18px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 470, margin: '0 auto' }}>
        <Link to="/tapedeck" style={{ color: '#ff3b5c', textDecoration: 'none', fontWeight: 700 }}>← Back to Tape Deck</Link>
        <header style={{ margin: '34px 0 24px' }}>
          <div style={{ color: '#ff3b5c', fontSize: 12, fontWeight: 900, letterSpacing: 3 }}>LOSOMEDIA / MUSIC COMMUNITY</div>
          <h1 style={{ fontSize: 38, margin: '8px 0 5px', letterSpacing: 1, fontWeight: 900 }}>TAPE DECK<span style={{ color: '#ff3b5c' }}>.</span></h1>
          <p style={{ color: '#9ba7b8', margin: 0, lineHeight: 1.6 }}>One place for independent artists, AI creators, and the people who listen closely.</p>
        </header>
        <section style={{ padding: 24, border: '1px solid #303030', borderRadius: 18, background: '#191919', boxShadow: '0 24px 70px #0006' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
            <button type="button" onClick={() => { setMode('signin'); setError(''); setMessage(''); }} style={{ ...primary, background: mode === 'signin' ? '#ff3b5c' : '#182131', borderColor: mode === 'signin' ? '#c92749' : '#383838', color: mode === 'signin' ? '#111111' : '#e2e8f0' }}>Sign In</button>
            <button type="button" onClick={() => { setMode('signup'); setError(''); setMessage(''); }} style={{ ...primary, background: mode === 'signup' ? '#ff3b5c' : '#182131', borderColor: mode === 'signup' ? '#c92749' : '#383838', color: mode === 'signup' ? '#111111' : '#e2e8f0' }}>Create Account</button>
          </div>
          <form onSubmit={submit}>
            {mode === 'signup' && <>
              <label style={{ display: 'block', marginBottom: 15, color: '#cbd5e1', fontSize: 14, fontWeight: 700 }}>Display name<input value={name} onChange={e => setName(e.target.value)} placeholder="Artist or reviewer name" style={field} /></label>
              <fieldset style={{ border: '1px solid #383838', borderRadius: 12, padding: 14, margin: '0 0 16px' }}>
                <legend style={{ color: '#cbd5e1', padding: '0 6px', fontSize: 13, fontWeight: 800 }}>How will you use Tape Deck?</legend>
                <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 10, borderRadius: 9, background: accountType === 'artist' ? '#ff3b5c14' : 'transparent', cursor: 'pointer' }}>
                  <input type="radio" name="accountType" value="artist" checked={accountType === 'artist'} onChange={() => setAccountType('artist')} style={{ accentColor: '#ff3b5c', marginTop: 4 }} />
                  <span><strong style={{ display: 'block', color: '#f4f5f7' }}>Artist / Music Creator</strong><span style={{ display: 'block', color: '#9ba7b8', fontSize: 12, lineHeight: 1.5, marginTop: 3 }}>Upload tracks, manage submissions, and receive feedback.</span></span>
                </label>
                <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 10, borderRadius: 9, background: accountType === 'reviewer' ? '#ff3b5c14' : 'transparent', cursor: 'pointer' }}>
                  <input type="radio" name="accountType" value="reviewer" checked={accountType === 'reviewer'} onChange={() => setAccountType('reviewer')} style={{ accentColor: '#ff3b5c', marginTop: 4 }} />
                  <span><strong style={{ display: 'block', color: '#f4f5f7' }}>Reviewer</strong><span style={{ display: 'block', color: '#9ba7b8', fontSize: 12, lineHeight: 1.5, marginTop: 3 }}>Open the reviewer console, claim tracks, and submit structured feedback.</span></span>
                </label>
              </fieldset>
            </>}
            <label style={{ display: 'block', marginBottom: 15, color: '#cbd5e1', fontSize: 14, fontWeight: 700 }}>Email address<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={field} /></label>
            <label style={{ display: 'block', marginBottom: 18, color: '#cbd5e1', fontSize: 14, fontWeight: 700 }}>Password<input required minLength={6} type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" style={field} /></label>
            <button type="submit" disabled={busy} style={{ ...primary, opacity: busy ? .65 : 1 }}>{busy ? 'PLEASE WAIT…' : mode === 'signin' ? 'SIGN IN TO TAPE DECK' : 'CREATE TAPE DECK ACCOUNT'}</button>
          </form>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0', color: '#777777', fontSize: 12 }}><span style={{ height: 1, flex: 1, background: '#383838' }} /> OR <span style={{ height: 1, flex: 1, background: '#383838' }} /></div>
          <button type="button" onClick={google} disabled={busy} style={{ ...primary, background: '#182131', color: '#f8fafc', border: '1px solid #383838' }}>Continue with Google</button>
          {message && <p role="status" style={{ color: '#86efac', background: '#052e16', padding: 12, borderRadius: 8, lineHeight: 1.5 }}>{message}</p>}
          {error && <p role="alert" style={{ color: '#fecaca', background: '#450a0a', padding: 12, borderRadius: 8, lineHeight: 1.5, overflowWrap: 'anywhere' }}>{error}</p>}
        </section>
        <p style={{ color: '#777777', fontSize: 12, marginTop: 18, lineHeight: 1.5 }}>Your account opens the right workspace: artists get the Artist Dashboard; reviewers get the Reviewer Console. Reviewer access still needs server-side role approval before public launch.</p>
      </div>
    </div>
  );
}
