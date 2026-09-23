import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Disc3, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/tapedeck', { replace: true });
    });
  }, [navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(''); setMessage('');
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: { data: { display_name: name.trim() } },
      });
      if (error) setError(error.message);
      else setMessage('Account created. Check your email if confirmation is required.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setError(error.message);
      else navigate('/tapedeck', { replace: true });
    }
    setBusy(false);
  };

  const google = async () => {
    setBusy(true); setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/tapedeck' },
    });
    if (error) { setError(error.message); setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-ink-950 text-cream-100 flex items-center justify-center px-5 py-12 grain">
      <div className="w-full max-w-md">
        <Link to="/tapedeck" className="inline-flex items-center gap-2 text-cream-300/60 hover:text-gold-400 text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Tape Deck
        </Link>
        <div className="panel p-7 sm:p-9">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-11 h-11 rounded-full bg-ink-800 border border-gold-500/40 flex items-center justify-center">
              <Disc3 className="w-6 h-6 text-gold-500" />
            </div>
            <div>
              <div className="font-display text-2xl tracking-wider text-cream-50">TAPE DECK</div>
              <div className="section-label">Member Access</div>
            </div>
          </div>
          <div className="flex gap-2 mb-6">
            <button onClick={() => setMode('signin')} className={`flex-1 py-2 rounded border ${mode === 'signin' ? 'border-gold-500/50 text-gold-400 bg-gold-500/10' : 'border-ink-600 text-cream-300/50'}`}>Sign In</button>
            <button onClick={() => setMode('signup')} className={`flex-1 py-2 rounded border ${mode === 'signup' ? 'border-gold-500/50 text-gold-400 bg-gold-500/10' : 'border-ink-600 text-cream-300/50'}`}>Create Account</button>
          </div>
          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && <input value={name} onChange={e=>setName(e.target.value)} placeholder="Display name" className="w-full bg-ink-900 border border-ink-600 rounded px-4 py-3 outline-none focus:border-gold-500/60" />}
            <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" className="w-full bg-ink-900 border border-ink-600 rounded px-4 py-3 outline-none focus:border-gold-500/60" />
            <input required minLength={6} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full bg-ink-900 border border-ink-600 rounded px-4 py-3 outline-none focus:border-gold-500/60" />
            <button disabled={busy} className="btn-primary w-full justify-center disabled:opacity-50">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}{mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          <div className="flex items-center gap-3 my-5"><div className="divider-line flex-1"/><span className="font-mono text-[10px] text-cream-300/30">OR</span><div className="divider-line flex-1"/></div>
          <button onClick={google} disabled={busy} className="btn-ghost w-full justify-center">Continue with Google</button>
          {message && <p className="mt-4 text-sm text-signal-green/80">{message}</p>}
          {error && <p className="mt-4 text-sm text-signal-red/80">{error}</p>}
        </div>
      </div>
    </div>
  );
}