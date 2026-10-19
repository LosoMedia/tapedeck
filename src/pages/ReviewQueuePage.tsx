import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock3, Dices, ListOrdered, Loader2, Radio, RefreshCw, ShieldCheck } from 'lucide-react';
import { supabase, type TapeRow } from '@/lib/supabase';

type QueueType = 'dedicated' | 'random';
type QueueRow = {
  id: string; tape_id: string; artist_id: string; queue_type: QueueType;
  status: 'waiting' | 'reviewing' | 'reviewed' | 'cancelled';
  claimed_by: string | null; claimed_at: string | null; completed_at: string | null; created_at: string;
};
const red = '#ff3b5c';
const card: React.CSSProperties = { background: '#171717', border: '1px solid #303030', borderRadius: 14, padding: 16 };
const action: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: red, color: '#fff', border: '1px solid #c92749', borderRadius: 10, padding: '10px 13px', fontWeight: 800, cursor: 'pointer', textDecoration: 'none' };
const muted: React.CSSProperties = { color: '#9ba7b8', fontSize: 13, lineHeight: 1.6 };

export function ReviewQueuePage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [tapes, setTapes] = useState<Record<string, TapeRow>>({});
  const [queueType, setQueueType] = useState<QueueType>('random');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { data: q, error: qError } = await supabase.from('tape_review_queue').select('*').neq('status', 'cancelled').order('created_at', { ascending: true }).limit(150);
    if (qError) { setError('Queue setup may still be needed: ' + qError.message); setLoading(false); return; }
    const queueRows = (q || []) as QueueRow[];
    setRows(queueRows);
    const ids = [...new Set(queueRows.map(row => row.tape_id))];
    if (ids.length) {
      const { data: trackRows } = await supabase.from('tapes').select('*').in('id', ids);
      setTapes(Object.fromEntries(((trackRows || []) as TapeRow[]).map(t => [t.id, t])));
    } else setTapes({});
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (!data.user) { navigate('/tapedeck/auth', { replace: true }); return; }
      setUserId(data.user.id);
      void load();
    });
    const channel = supabase.channel('tape-review-queue-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tape_review_queue' }, () => { void load(); })
      .subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, [load, navigate]);

  const claimNext = async () => {
    setBusy(true); setError(''); setMessage('');
    const { data, error: claimError } = await supabase.rpc('claim_next_tape_review', { p_queue_type: queueType });
    setBusy(false);
    if (claimError) { setError('Could not claim a tape: ' + claimError.message); return; }
    const claimed = Array.isArray(data) ? data[0] : data;
    if (!claimed?.tape_id) { setMessage('No waiting tapes in this queue right now.'); return; }
    setMessage('Tape claimed. Opening the reviewer console…');
    await load();
    navigate('/tapedeck/reviewer?trackId=' + encodeURIComponent(claimed.tape_id));
  };

  const cancelEntry = async (entry: QueueRow) => {
    setError(''); setMessage('');
    const { error: cancelError } = await supabase.from('tape_review_queue').update({ status: 'cancelled' }).eq('id', entry.id).eq('artist_id', userId).eq('status', 'waiting');
    if (cancelError) setError(cancelError.message);
    else { setMessage('Your waiting submission was removed from the queue.'); await load(); }
  };

  const currentRows = rows.filter(row => row.queue_type === queueType);
  const waiting = currentRows.filter(row => row.status === 'waiting');
  const reviewing = currentRows.filter(row => row.status === 'reviewing');
  const reviewed = currentRows.filter(row => row.status === 'reviewed');

  return <div style={{ minHeight: '100vh', background: '#090909', color: '#f4f5f7', fontFamily: 'Inter,system-ui,sans-serif' }}>
    <style>{'*{box-sizing:border-box}body{margin:0}.rq-wrap{width:min(1050px,calc(100% - 28px));margin:0 auto}.rq-tabs{display:flex;gap:8px;flex-wrap:wrap}.rq-tab{border:1px solid #353535;background:#151515;color:#cbd5e1;border-radius:999px;padding:10px 14px;font-weight:800;cursor:pointer}.rq-tab.active{border-color:#c92749;background:#ff3b5c1a;color:#ffc0cb}'}</style>
    <header style={{ borderBottom: '1px solid #292929', padding: '16px 0' }}><div className="rq-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <Link to="/tapedeck" style={{ color: '#f4f5f7', textDecoration: 'none', fontWeight: 950, letterSpacing: 1 }}><span style={{ color: red }}>◈</span> TAPE DECK.</Link>
      <Link to="/tapedeck" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: 13 }}>Back to discovery</Link>
    </div></header>
    <main className="rq-wrap" style={{ padding: '28px 0 50px' }}>
      <div style={{ color: '#ff91a6', fontSize: 10, letterSpacing: 2.5, fontWeight: 900 }}>COMMUNITY REVIEW SYSTEM</div>
      <h1 style={{ fontSize: 'clamp(30px,6vw,48px)', margin: '8px 0' }}>The Review Queue</h1>
      <p style={{ ...muted, maxWidth: 650, marginTop: 0 }}>Choose an organized line or let the random pool pick the next tape. Queue updates stream live while this page is open.</p>
      <div className="rq-tabs" style={{ margin: '22px 0 16px' }}>
        <button className={'rq-tab' + (queueType === 'random' ? ' active' : '')} onClick={() => setQueueType('random')}><Dices size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />Random Pool</button>
        <button className={'rq-tab' + (queueType === 'dedicated' ? ' active' : '')} onClick={() => setQueueType('dedicated')}><ListOrdered size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />Dedicated Queue</button>
      </div>
      <section style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', marginBottom: 16 }}>
        <div><div style={{ color: '#ff91a6', fontWeight: 900, fontSize: 11, letterSpacing: 1.5 }}>{queueType === 'random' ? 'FREE DURING BETA' : 'FIRST IN, FIRST UP'}</div><h2 style={{ margin: '7px 0', fontSize: 22 }}>{queueType === 'random' ? 'Random Pool' : 'Dedicated Queue'}</h2><p style={{ ...muted, margin: 0 }}>{queueType === 'random' ? 'Available tapes are selected at random. No payment required during beta.' : 'Waiting submissions are handled in the order they entered the queue.'}</p></div>
        <button onClick={claimNext} disabled={busy || waiting.length === 0} style={{ ...action, opacity: busy || waiting.length === 0 ? .5 : 1 }}><Radio size={16} />{busy ? 'Claiming…' : 'Claim next tape'}</button>
      </section>
      {message && <p role="status" style={{ ...muted, color: '#a7e9bd', background: '#10281c', padding: 12, borderRadius: 10 }}>{message}</p>}
      {error && <p role="alert" style={{ ...muted, color: '#fecaca', background: '#351a22', padding: 12, borderRadius: 10, overflowWrap: 'anywhere' }}>{error}</p>}
      {loading ? <div style={{ padding: 40, textAlign: 'center', ...muted }}><Loader2 size={22} /> Loading queue…</div> : <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(125px,1fr))', gap: 10, marginBottom: 18 }}>
          {[['Waiting',waiting.length],['Now reviewing',reviewing.length],['Reviewed',reviewed.length]].map(([labelText,count]) => <div key={String(labelText)} style={card}><div style={muted}>{labelText}</div><div style={{ fontSize: 28, fontWeight: 900, marginTop: 5 }}>{count}</div></div>)}
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {currentRows.map((entry, index) => {
            const tape = tapes[entry.tape_id];
            return <article key={entry.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 13, flexWrap: 'wrap' }}>
              <div style={{ width: 46, height: 46, flex: '0 0 46px', borderRadius: 10, background: '#272727', border: '1px solid #3a3a3a', display: 'grid', placeItems: 'center', color: '#ff91a6' }}>{entry.status === 'reviewed' ? <CheckCircle2 /> : entry.status === 'reviewing' ? <Radio /> : <Clock3 />}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 850, overflowWrap: 'anywhere' }}>{tape?.title || 'Loading tape details…'}</div>
                <div style={muted}>{tape?.artist || 'Independent artist'} · {entry.status === 'waiting' && queueType === 'dedicated' ? 'Position ' + (waiting.findIndex(r => r.id === entry.id) + 1) : entry.status.replace('_',' ')}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ color: entry.status === 'reviewed' ? '#a7e9bd' : entry.status === 'reviewing' ? '#ff91a6' : '#b7c2d3', fontSize: 12, fontWeight: 800 }}>{entry.status.toUpperCase()}</span>
                {entry.status === 'waiting' && entry.artist_id === userId && <button onClick={() => void cancelEntry(entry)} style={{ ...action, background: '#202020', borderColor: '#3a3a3a', fontSize: 12 }}>Cancel</button>}
                {entry.status === 'reviewed' && tape && <Link to={'/tapedeck/track/' + tape.id} style={{ ...action, fontSize: 12, background: '#202020', borderColor: '#3a3a3a' }}>View review</Link>}
              </div>
            </article>;
          })}
          {!currentRows.length && <div style={{ ...card, textAlign: 'center', padding: 32 }}><Dices size={28} color={red} /><h3 style={{ margin: '10px 0 5px' }}>Nothing in this pool yet</h3><p style={muted}>Publish a Tape and select {queueType === 'random' ? 'Random Pool' : 'Dedicated Queue'} to get started.</p><Link to="/tapedeck" style={action}>Submit a Tape</Link></div>}
        </div>
      </>}
      <p style={{ ...muted, marginTop: 24 }}><ShieldCheck size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />One active claim per queue entry. Random Pool is free during beta; no surprise charges.</p>
      <button onClick={() => void load()} style={{ ...action, background: '#202020', borderColor: '#383838', marginTop: 8 }}><RefreshCw size={14} />Refresh queue</button>
    </main>
  </div>;
}
