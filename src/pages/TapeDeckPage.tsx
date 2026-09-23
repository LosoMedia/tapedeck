import { useState, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { FreshTapes } from '@/components/FreshTapes';
import { Classification } from '@/components/Classification';
import { Reviews } from '@/components/Reviews';
import { Collaborate } from '@/components/Collaborate';
import { MakeItReal } from '@/components/MakeItReal';
import { DropATape } from '@/components/DropATape';
import { Footer } from '@/components/Footer';
import { TapeDetailModal } from '@/components/TapeDetailModal';
import { DropTapeModal } from '@/components/DropTapeModal';
import { CollabRequestModal } from '@/components/CollabRequestModal';
import type { TapeRow } from '@/lib/supabase';

export function TapeDeckPage() {
  const [selectedTape, setSelectedTape] = useState<TapeRow | null>(null);
  const [collabTape, setCollabTape] = useState<TapeRow | null>(null);
  const [dropModalOpen, setDropModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const scrollToTapes = useCallback(() => {
    document.getElementById('fresh-tapes')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const scrollToMakeItReal = useCallback(() => {
    document.getElementById('make-it-real')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const openDropModal = useCallback(() => {
    setDropModalOpen(true);
  }, []);

  const handleTapeClick = useCallback((tape: TapeRow) => {
    setSelectedTape(tape);
  }, []);

  const handleCollabClick = useCallback((tape: TapeRow) => {
    setSelectedTape(null);
    setCollabTape(tape);
  }, []);

  const handleDropSubmitted = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="min-h-screen bg-ink-950 text-cream-100">
      <Navbar onDropTape={openDropModal} />
      <main>
        <Hero onDiscover={scrollToTapes} onMakeItReal={scrollToMakeItReal} />
        <FreshTapes onTapeClick={handleTapeClick} refreshKey={refreshKey} />
        <Classification />
        <Reviews />
        <Collaborate onTapeClick={handleTapeClick} />
        <MakeItReal onFindTape={scrollToTapes} onDropTape={openDropModal} />
        <DropATape onDropClick={openDropModal} />
      </main>
      <Footer />

      <TapeDetailModal
        tape={selectedTape}
        onClose={() => setSelectedTape(null)}
        onCollabClick={handleCollabClick}
      />
      <DropTapeModal
        open={dropModalOpen}
        onClose={() => setDropModalOpen(false)}
        onSubmitted={handleDropSubmitted}
      />
      <CollabRequestModal
        tape={collabTape}
        onClose={() => setCollabTape(null)}
      />
    </div>
  );
}
