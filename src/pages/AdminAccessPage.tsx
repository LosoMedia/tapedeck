import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

type RequestRow = { id: string; user_id: string; status: string; message: string | null; created_at: string };
type RoleRow = { user_id: string; role: string; approved_at: string | null };

const panel: React.CSSProperties = { background: '#191919', border: '1px solid #303030', borderRadius: 14, padding: 18 };
const button: React.CSSProperties = { border: '1px solid #c92749', borderRadius: 9, padding: '9px 12px', background: '#ff3b5c', color: '#111', fontWeight: 800, cursor: 'pointer' };

export function AdminAccessPage() {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    setError('');
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setChecking(false); return; }
    const { data: myRole, error: roleError } = await supabase.from('tapedeck_user_roles').select('role').eq('user_id', userData.user.id).maybeSingle();
    if (roleError || myRole?.role !== 'admin') { setIsAdmin(false); setChecking(false); return; }
    setIsAdmin(true);
    const [{ data: requestRows, error: requestError }, { data: roleRows, error: rolesError }] = await Promise.all([
      supabase.from('tapedeck_reviewer_requests').select('id,user_id,status,message,created_at').order('created_at', { ascending: true }),
      supabase.from('tapedeck_user_roles').select('user_id,role,approved_at').order('role')
    ]);
    if (requestError) setError(requestError.message);
    else setRequests((requestRows || []) as RequestRow[]);
    if (rolesError) setError(old => old ? old + ' · ' + rolesError.message : rolesError.message);
    else setRoles((roleRows || []) as RoleRow[]);
    setChecking(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const decide = async (request: RequestRow, decision: 'approved' | 'rejected') => {
    setBusyId(request.id); setError('');
    const { data: userData } = await supabase.auth.getUser();
    const adminId = userData.user?.id;
    if (!adminId) { setError('Please sign in again.'); setBusyId(''); return; }
    if (decision === 'approved') {
      const { error: upsertError } = await supabase.from('tapedeck_user_roles').upsert({ user_id: request.user_id, role: 'reviewer', approved_by: adminId, approved_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (upsertError) { setError(upsertError.message); setBusyId(''); return; }
    }
    const { error: updateError } = await supabase.from('tapedeck_reviewer_requests').update({ status: decision, reviewed_by: adminId, reviewed_at: new Date().toISOString() }).eq('id', request.id);
    if (updateError) setError(updateError.message);
    await load();
    setBusyId('');
  };

  const changeRole = async (userId: string, role: 'artist' | 'reviewer' | 'admin') => {
    setBusyId(userId); setError('');
    const { data: userData } = await supabase.auth.getUser();
    const { error: saveError } = await supabase.from('tapedeck_user_roles').upsert({ user_id: userId, role, approved_by: userData.user?.id, approved_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (saveError) setError(saveError.message);
    await load();
    setBusyId('');
  };

  if (checking) return <main style={{ minHeight: '100vh', background: '#090909', color: '#f4f5f7', padding: 24 }}>Checking administrator access…</main>;
  if (!isAdmin) return <Navigate to="/tapedeck/dashboard" replace />;

  return <main style={{ minHeight: '100vh', background: '#090909', color: '#f4f5f7', fontFamily: 'Inter,system-ui,sans-serif', padding: '24px 16px 48px' }}>
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Link to="/tapedeck" style={{ color: '#ff91a6', textDecoration: 'none' }}>← Tape Deck</Link>
      <p style={{ color: '#ff3b5c', fontSize: 11, fontWeight: 900, letterSpacing: 3, marginTop: 28 }}>LOSOMEDIA / ADMIN</p>
      <h1 style={{ fontSize: 'clamp(28px,5vw,42px)', margin: '6px 0' }}>Access Control</h1>
      <p style={{ color: '#9ba7b8', lineHeight: 1.6 }}>Approve reviewers and manage existing member roles. Only accounts already assigned the administrator role can access this page.</p>
      {error && <p role="alert" style={{ background: '#351a22', color: '#fecaca', padding: 12, borderRadius: 8, overflowWrap: 'anywhere' }}>{error}</p>}
      <section style={{ ...panel, marginTop: 20 }}>
        <h2 style={{ marginTop: 0 }}>Reviewer requests</h2>
        {requests.filter(r => r.status === 'pending').length === 0 ? <p style={{ color: '#9ba7b8' }}>No pending reviewer requests.</p> : requests.filter(r => r.status === 'pending').map(req => <article key={req.id} style={{ borderTop: '1px solid #303030', padding: '14px 0', display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0, flex: '1 1 250px' }}><strong>{req.user_id}</strong><p style={{ color: '#9ba7b8', fontSize: 13, margin: '5px 0' }}>{req.message || 'Reviewer access requested'} · {new Date(req.created_at).toLocaleDateString()}</p></div>
          <div style={{ display: 'flex', gap: 8 }}><button disabled={!!busyId} onClick={() => void decide(req, 'approved')} style={button}>{busyId === req.id ? 'Saving…' : 'Approve'}</button><button disabled={!!busyId} onClick={() => void decide(req, 'rejected')} style={{ ...button, background: '#202020', color: '#f4f5f7', borderColor: '#444' }}>Reject</button></div>
        </article>)}
      </section>
      <section style={{ ...panel, marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>Member roles</h2>
        <p style={{ color: '#9ba7b8', fontSize: 13 }}>Grant administrator access only to people you trust to manage Tape Deck.</p>
        <div style={{ display: 'grid', gap: 10 }}>{roles.map(member => <div key={member.user_id} style={{ borderTop: '1px solid #303030', paddingTop: 12, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <code style={{ fontSize: 12, overflowWrap: 'anywhere', flex: '1 1 250px' }}>{member.user_id}</code>
          <select aria-label={'Role for ' + member.user_id} value={member.role} disabled={!!busyId} onChange={e => void changeRole(member.user_id, e.target.value as 'artist' | 'reviewer' | 'admin')} style={{ background: '#101010', color: '#f4f5f7', border: '1px solid #444', borderRadius: 8, padding: 9 }}>
            <option value="artist">Artist</option><option value="reviewer">Reviewer</option><option value="admin">Administrator</option>
          </select>
        </div>)}</div>
      </section>
    </div>
  </main>;
}
