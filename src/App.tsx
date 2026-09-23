import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TapeDeckPage } from '@/pages/TapeDeckPage';
import { ReviewerPage } from '@/pages/ReviewerPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/tapedeck" element={<TapeDeckPage />} />
        <Route path="/tapedeck/reviewer" element={<ReviewerPage />} />
        <Route path="*" element={<Navigate to="/tapedeck" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
