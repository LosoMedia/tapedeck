import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { TapeDeckRebuild } from '@/pages/TapeDeckRebuild';
import { ReviewerPage } from '@/pages/ReviewerPage';
import { AuthPage } from '@/pages/AuthPage';
import { ArtistProfilePage } from '@/pages/ArtistProfilePage';
import { ArtistDashboardPage } from '@/pages/ArtistDashboardPage';
import { TrackDetailPage } from '@/pages/TrackDetailPage';
import { ReviewQueuePage } from '@/pages/ReviewQueuePage';
import { AdminAccessPage } from '@/pages/AdminAccessPage';
import { supabase } from '@/lib/supabase';

function ProtectedReviewer() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    let active = true;
    async function checkAccess() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) { if (active) setChecking(false); return; }
      const { data: roleRow, error } = await supabase
        .from('tapedeck_user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!active) return;
      const approved = !error && (roleRow?.role === 'reviewer' || roleRow?.role === 'admin');
      setAllowed(approved);
      setChecking(false);
    }
    void checkAccess();
    return () => { active = false; };
  }, []);
  if (checking) return <div style={{ minHeight: '100vh', background: '#090909', color: '#f4f5f7', display: 'grid', placeItems: 'center' }}>Checking reviewer approval…</div>;
  return allowed ? <ReviewerPage /> : <Navigate to="/tapedeck/dashboard" replace />;
}

function App() {
  return <BrowserRouter><Routes>
    <Route path="/tapedeck" element={<TapeDeckRebuild />} />
    <Route path="/tapedeck/auth" element={<AuthPage />} />
    <Route path="/tapedeck/profile" element={<ArtistProfilePage />} />
    <Route path="/tapedeck/dashboard" element={<ArtistDashboardPage />} />
    <Route path="/tapedeck/artist/:artistId" element={<ArtistProfilePage />} />
    <Route path="/tapedeck/track/:trackId" element={<TrackDetailPage />} />
    <Route path="/tapedeck/reviewer" element={<ProtectedReviewer />} />
    <Route path="/tapedeck/admin" element={<AdminAccessPage />} />
    <Route path="/tapedeck/queue" element={<ReviewQueuePage />} />
    <Route path="*" element={<Navigate to="/tapedeck" replace />} />
  </Routes></BrowserRouter>;
}
export default App;
