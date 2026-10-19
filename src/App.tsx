import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { TapeDeckRebuild } from '@/pages/TapeDeckRebuild';
import { ReviewerPage } from '@/pages/ReviewerPage';
import { AuthPage } from '@/pages/AuthPage';
import { supabase } from '@/lib/supabase';

function ProtectedReviewer() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setAllowed(!!data.session); setChecking(false); });
  }, []);
  if (checking) return <div style={{ minHeight: '100vh', background: '#070b14' }} />;
  return allowed ? <ReviewerPage /> : <Navigate to="/tapedeck/auth" replace />;
}

function App() {
  return <BrowserRouter><Routes>
    <Route path="/tapedeck" element={<TapeDeckRebuild />} />
    <Route path="/tapedeck/auth" element={<AuthPage />} />
    <Route path="/tapedeck/reviewer" element={<ProtectedReviewer />} />
    <Route path="*" element={<Navigate to="/tapedeck" replace />} />
  </Routes></BrowserRouter>;
}
export default App;