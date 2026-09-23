import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Waveform } from './analog';

interface AudioPlayerProps {
  title: string;
  artist: string;
  duration: string;
}

// We synthesize a short ambient tone with the Web Audio API so the
// player is fully functional without hosting real audio files.
// A real deployment would swap this for an <audio src> stream.
export function AudioPlayer({ title, artist, duration: durationStr }: AudioPlayerProps) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [muted, setMuted] = useState(false);
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  const totalSeconds = parseDuration(durationStr);

  function parseDuration(d: string): number {
    const [m, s] = d.split(':').map(Number);
    return m * 60 + s;
  }

  function formatTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const stopSynth = useCallback(() => {
    if (oscRef.current) {
      try { oscRef.current.stop(); } catch { /* already stopped */ }
      oscRef.current.disconnect();
      oscRef.current = null;
    }
    if (lfoRef.current) {
      try { lfoRef.current.stop(); } catch { /* already stopped */ }
      lfoRef.current.disconnect();
      lfoRef.current = null;
    }
    if (gainRef.current) {
      gainRef.current.disconnect();
      gainRef.current = null;
    }
    if (filterRef.current) {
      filterRef.current.disconnect();
      filterRef.current = null;
    }
  }, []);

  const startSynth = useCallback(() => {
    if (!audioCtxRef.current) return;

    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    // Gain envelope
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(muted ? 0 : volume * 0.15, now + 0.5);
    gain.connect(ctx.destination);
    gainRef.current = gain;

    // Lowpass filter for warmth
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.value = 2;
    filter.connect(gain);
    filterRef.current = filter;

    // Main oscillator — ambient pad
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.connect(filter);
    osc.start(now);
    oscRef.current = osc;

    // LFO for subtle filter movement
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.3, now);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(300, now);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start(now);
    lfoRef.current = lfo;
  }, [muted, volume]);

  const tick = useCallback(() => {
    if (!audioCtxRef.current || !isPlaying) return;
    const elapsed = audioCtxRef.current.currentTime - startTimeRef.current + elapsedRef.current;
    const pct = Math.min(elapsed / totalSeconds, 1);
    setProgress(pct);

    if (pct >= 1) {
      setIsPlaying(false);
      setProgress(0);
      elapsedRef.current = 0;
      stopSynth();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [isPlaying, totalSeconds, stopSynth]);

  useEffect(() => {
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, tick]);

  useEffect(() => {
    return () => {
      stopSynth();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, [stopSynth]);

  const togglePlay = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }

    if (isPlaying) {
      // Pause: stop synth, remember elapsed time
      elapsedRef.current += audioCtxRef.current.currentTime - startTimeRef.current;
      stopSynth();
      setIsPlaying(false);
    } else {
      // Play
      audioCtxRef.current.resume();
      startTimeRef.current = audioCtxRef.current.currentTime;
      startSynth();
      setIsPlaying(true);
    }
  };

  const handleVolume = (v: number) => {
    setVolume(v);
    setMuted(false);
    if (gainRef.current && audioCtxRef.current) {
      gainRef.current.gain.setValueAtTime(v * 0.15, audioCtxRef.current.currentTime);
    }
  };

  const toggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    if (gainRef.current && audioCtxRef.current) {
      gainRef.current.gain.setValueAtTime(newMuted ? 0 : volume * 0.15, audioCtxRef.current.currentTime);
    }
  };

  const seek = (pct: number) => {
    const newElapsed = pct * totalSeconds;
    elapsedRef.current = newElapsed;
    if (isPlaying && audioCtxRef.current) {
      startTimeRef.current = audioCtxRef.current.currentTime;
    }
    setProgress(pct);
  };

  return (
    <div className="bg-ink-900/60 border border-ink-600/40 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-gold-500 flex items-center justify-center hover:bg-gold-400 transition-colors flex-shrink-0 shadow-lg shadow-gold-500/20"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-ink-950 fill-current" />
            ) : (
              <Play className="w-5 h-5 text-ink-950 fill-current ml-0.5" />
            )}
          </button>
          <div className="min-w-0">
            <div className="font-heading text-sm text-cream-50 truncate">{title}</div>
            <div className="font-mono text-[10px] text-cream-300/50 truncate">{artist}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={toggleMute} className="text-cream-300/50 hover:text-gold-400 transition-colors">
            {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => handleVolume(parseFloat(e.target.value))}
            className="w-16 accent-gold-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Waveform / seek bar */}
      <div
        className="relative cursor-pointer group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          seek(Math.max(0, Math.min(1, pct)));
        }}
      >
        <Waveform bars={64} active={isPlaying} progress={progress} className="h-10" />
      </div>

      <div className="flex items-center justify-between font-mono text-[10px] text-cream-300/40">
        <span>{formatTime(progress * totalSeconds)}</span>
        <span>{durationStr}</span>
      </div>
    </div>
  );
}
