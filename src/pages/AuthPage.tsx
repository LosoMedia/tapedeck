import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const TAPE_DECK_ORIGIN = 'https://tapedeck-git-rebuild-tapedeck-clean-loso-media.vercel.app';

const field: React.CSSProperties = {
  display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 7,
  padding: '13px 14px', borderRadius: 10, border: '1px solid #475569',
  background: '#020617', color: '#f8fafc', fontSize: 16
};
const primary: React.CSSProperties = {
  width: '100%', border: 0, borderRadius: 10, padding: '14px 16px',
  background: '#f5c451', color: '#111827', fontWeight: 900, fontSize: 15, cursor: 'pointer'
};

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) navigate('/tapedeck', { replace: true });
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
            data: { display_name: name.trim() },
            emailRedirectTo: TAPE_DECK_ORIGIN + '/tapedeck/auth',
          },
        });
        if (authError) setError(authError.message);
        else setMessage('Account created. Check your email to confirm it, then return to this Tape Deck sign-in page.');
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) setError(authError.message);
        else window.location.assign(TAPE_DECK_ORIGIN + '/tapedeck');
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
        options: { redirectTo: TAPE_DECK_ORIGIN + '/tapedeck' },
      });
      if (authError) { setError(authError.message); setBusy(false); }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Google sign-in failed.');
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#070b14', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif', padding: '28px 18px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 470, margin: '0 auto' }}>
        <Link to="/tapedeck" style={{ color: '#f5c451', textDecoration: 'none', fontWeight: 700 }}>← Back to Tape Deck</Link>
        <header style={{ margin: '34px 0 24px' }}>
          <div style={{ color: '#f5c451', fontSize: 12, fontWeight: 900, letterSpacing: 4 }}>LOSOMEDIA PRESENTS</div>
          <h1 style={{ fontSize: 34, margin: '8px 0 5px', letterSpacing: 1 }}>TAPE DECK</h1>
          <p style={{ color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>Member access for the new Tape Deck music platform.</p>
        </header>
        <section style={{ padding: 24, border: '1px solid #263244', borderRadius: 18, background: '#111827' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
            <button type="button" onClick={() => { setMode('signin'); setError(''); setMessage(''); }} style={{ ...primary, background: mode === 'signin' ? '#f5c451' : '#1e293b', color: mode === 'signin' ? '#111827' : '#e2e8f0' }}>Sign In</button>
            <button type="button" onClick={() => { setMode('signup'); setError(''); setMessage(''); }} style={{ ...primary, background: mode === 'signup' ? '#f5c451' : '#1e293b', color: mode === 'signup' ? '#111827' : '#e2e8f0' }}>Create Account</button>
          </div>
          <form onSubmit={submit}>
            {mode === 'signup' && <label style={{ display: 'block', marginBottom: 15, color: '#cbd5e1', fontSize: 14, fontWeight: 700 }}>Display name<input value={name} onChange={e => setName(e.target.value)} placeholder="Artist or member name" style={field} /></label>}
            <label style={{ display: 'block', marginBottom: 15, color: '#cbd5e1', fontSize: 14, fontWeight: 700 }}>Email address<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={field} /></label>
            <label style={{ display: 'block', marginBottom: 18, color: '#cbd5e1', fontSize: 14, fontWeight: 700 }}>Password<input required minLength={6} type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" style={field} /></label>
            <button type="submit" disabled={busy} style={{ ...primary, opacity: busy ? .65 : 1 }}>{busy ? 'PLEASE WAIT…' : mode === 'signin' ? 'SIGN IN TO TAPE DECK' : 'CREATE TAPE DECK ACCOUNT'}</button>
          </form>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0', color: '#64748b', fontSize: 12 }}><span style={{ height: 1, flex: 1, background: '#334155' }} /> OR <span style={{ height: 1, flex: 1, background: '#334155' }} /></div>
          <button type="button" onClick={google} disabled={busy} style={{ ...primary, background: '#1e293b', color: '#f8fafc', border: '1px solid #475569' }}>Continue with Google</button>
          {message && <p role="status" style={{ color: '#86efac', background: '#052e16', padding: 12, borderRadius: 8, lineHeight: 1.5 }}>{message}</p>}
          {error && <p role="alert" style={{ color: '#fecaca', background: '#450a0a', padding: 12, borderRadius: 8, lineHeight: 1.5, overflowWrap: 'anywhere' }}>{error}</p>}
        </section>
        <p style={{ color: '#64748b', fontSize: 12, marginTop: 18, lineHeight: 1.5 }}>You stay on this Tape Deck site during sign-in. After successful sign-in, you return to the new Tape Deck upload page.</p>
      </div>
    </div>
  );
}
