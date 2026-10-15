import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Waveform } from './analog';

interface AudioPlayerProps {
  title: string;
  artist: string;
  duration: string;
  audioUrl?: string | null;
}

export function AudioPlayer({ title, artist, duration: durationStr, audioUrl }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [muted, setMuted] = useState(false);
  const [playError, setPlayError] = useState('');

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    setPlayError('');
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setPlayError('This audio could not be played. Check the file format or try again.');
      }
    } else {
      audio.pause();
    }
  };

  const seek = (pct: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    audio.currentTime = Math.max(0, Math.min(1, pct)) * audio.duration;
  };

  return (
    <div className="bg-ink-900/60 border border-ink-600/40 rounded-lg p-4 space-y-3">
      {audioUrl ? <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) => {
          const audio = e.currentTarget;
          setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
        }}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => { setIsPlaying(false); setProgress(0); }}
        onError={() => setPlayError('The audio file could not be loaded.')}
      /> : null}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={togglePlay}
            disabled={!audioUrl}
            aria-label={isPlaying ? 'Pause track' : 'Play track'}
            className="w-12 h-12 rounded-full bg-gold-500 flex items-center justify-center hover:bg-gold-400 transition-colors flex-shrink-0 shadow-lg shadow-gold-500/20 disabled:opacity-40"
          >
            {isPlaying ? <Pause className="w-5 h-5 text-ink-950 fill-current" /> : <Play className="w-5 h-5 text-ink-950 fill-current ml-0.5" />}
          </button>
          <div className="min-w-0">
            <div className="font-heading text-sm text-cream-50 truncate">{title}</div>
            <div className="font-mono text-[10px] text-cream-300/50 truncate">{artist}</div>
            {!audioUrl && <div className="text-xs text-cream-300/40 mt-1">No audio file attached to this Tape.</div>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setMuted((value) => !value)} aria-label={muted ? 'Unmute' : 'Mute'} className="text-cream-300/50 hover:text-gold-400 transition-colors">
            {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input aria-label="Volume" type="range" min={0} max={1} step={0.01} value={muted ? 0 : volume} onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false); }} className="w-16 accent-gold-500 cursor-pointer" />
        </div>
      </div>
      <div
        className={`relative ${audioUrl ? 'cursor-pointer' : 'cursor-not-allowed'}`}
        onClick={(e) => {
          if (!audioUrl) return;
          const rect = e.currentTarget.getBoundingClientRect();
          seek((e.clientX - rect.left) / rect.width);
        }}
      >
        <Waveform bars={64} active={isPlaying} progress={progress} className="h-10" />
      </div>
      {playError && <p role="alert" className="text-xs text-rust-500">{playError}</p>}
      <div className="flex items-center justify-between font-mono text-[10px] text-cream-300/40">
        <span>{formatTime(progress * (duration || 0))}</span>
        <span>{duration ? formatTime(duration) : durationStr}</span>
      </div>
    </div>
  );
}
