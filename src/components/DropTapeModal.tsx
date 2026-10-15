import { useState, useEffect } from 'react';
import { X, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DropTapeModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

const classifications = [
  { value: 'ai', label: 'AI', desc: 'AI-generated music' },
  { value: 'organic', label: 'Organic', desc: 'Human-made music' },
  { value: 'hybrid', label: 'Hybrid', desc: 'AI + human collaboration' },
] as const;

const skillOptions = [
  'Vocalist', 'Guitarist', 'Drummer', 'Bassist', 'Producer',
  'Songwriter', 'Mix Engineer', 'Mastering Engineer', 'Remixer',
  'Visual Artist', 'Arranger', 'Session Musician',
];

export function DropTapeModal({ open, onClose, onSubmitted }: DropTapeModalProps) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [classification, setClassification] = useState<'ai' | 'organic' | 'hybrid'>('organic');
  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');
  const [bpm, setBpm] = useState('120');
  const [musicalKey, setMusicalKey] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim() || !artist.trim()) {
      setError('Title and artist name are required.');
      return;
    }
    if (!audioFile) {
      setError('Choose an audio file to upload.');
      return;
    }
    if (audioFile.size > 50 * 1024 * 1024) {
      setError('Audio files must be 50 MB or smaller.');
      return;
    }
    const allowedTypes = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav', 'audio/aac', 'audio/ogg', 'audio/flac', 'audio/webm'];
    if (audioFile.type && !allowedTypes.includes(audioFile.type)) {
      setError('Please upload an MP3, M4A, WAV, AAC, OGG, FLAC, or WebM audio file.');
      return;
    }

    setSubmitting(true);
    setError('');

    let uploadedPath: string | null = null;
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Please sign in before uploading a Tape.');
      }

      const safeName = audioFile.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      uploadedPath = `${user.id}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from('tape-audio')
        .upload(uploadedPath, audioFile, { contentType: audioFile.type || 'application/octet-stream', upsert: false });
      if (uploadError) throw new Error(`Audio upload failed: ${uploadError.message}`);

      const { data: publicData } = supabase.storage.from('tape-audio').getPublicUrl(uploadedPath);
      const duration = await new Promise<string>((resolve) => {
        const audio = new Audio();
        const objectUrl = URL.createObjectURL(audioFile);
        audio.preload = 'metadata';
        audio.onloadedmetadata = () => {
          const seconds = Number.isFinite(audio.duration) ? Math.floor(audio.duration) : 0;
          URL.revokeObjectURL(objectUrl);
          resolve(`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve('0:00');
        };
        audio.src = objectUrl;
      });

      const { error: insertError } = await supabase.from('tapes').insert({
        title: title.trim(),
        artist: artist.trim(),
        classification,
        genre: genre.trim(),
        mood: mood.trim(),
        bpm: parseInt(bpm) || 120,
        musical_key: musicalKey.trim(),
        duration,
        audio_url: publicData.publicUrl,
        cover_url: coverUrl.trim() || 'https://images.pexels.com/photos/8168566/pexels-photo-8168566.png?auto=compress&cs=tinysrgb&h=650&w=940',
        description: description.trim(),
        skills_needed: skills,
        collaboration_status: 'open',
        rating: 0,
        plays: '0',
      });
      if (insertError) {
        await supabase.storage.from('tape-audio').remove([uploadedPath]);
        uploadedPath = null;
        throw new Error(`Tape details could not be saved: ${insertError.message}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload this Tape. Please try again.');
      setSubmitting(false);
      return;
    }

    setSubmitting(false);

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setTitle('');
      setArtist('');
      setGenre('');
      setMood('');
      setBpm('120');
      setMusicalKey('');
      setDescription('');
      setCoverUrl('');
      setAudioFile(null);
      setSkills([]);
      onSubmitted();
      onClose();
    }, 1800);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-ink-950/80 backdrop-blur-sm overflow-y-auto p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl my-8 panel grain overflow-hidden animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-ink-600/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
              <Upload className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h2 className="font-display text-2xl text-cream-50">DROP A TAPE</h2>
              <p className="font-mono text-[10px] uppercase tracking-wider text-cream-300/40">Upload your music project</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-ink-800/80 border border-ink-600/50 flex items-center justify-center text-cream-300/60 hover:text-gold-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {success ? (
          <div className="p-10 text-center">
            <CheckCircle2 className="w-16 h-16 text-signal-green mx-auto mb-4" />
            <h3 className="font-display text-3xl text-cream-50">TAPE DROPPED</h3>
            <p className="text-cream-200/60 mt-2">Your Tape is now live on Tape Deck.</p>
          </div>
        ) : (
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Audio upload, placed first so it's immediately visible */}
            <div className="rounded-lg border-2 border-gold-400 bg-ink-900 p-5">
              <label htmlFor="tape-audio-file" className="block cursor-pointer">
                <span className="block font-heading text-base font-bold text-gold-300 mb-2">1. CHOOSE YOUR MP3 / AUDIO FILE *</span>
                <span className="block text-sm text-cream-100 mb-4">Tap the button below to select a song from your phone or computer. MP3, M4A, WAV, AAC, OGG, FLAC, or WebM. Maximum 50 MB.</span>
                <span className="inline-flex items-center gap-2 rounded-md bg-gold-400 px-5 py-3 font-bold text-ink-950">
                  <Upload className="h-5 w-5" />
                  {audioFile ? 'Choose a different audio file' : 'BROWSE FILES'}
                </span>
              </label>
              <input
                id="tape-audio-file"
                type="file"
                accept="audio/mpeg,audio/mp4,audio/wav,audio/x-wav,audio/aac,audio/ogg,audio/flac,audio/webm,.mp3,.m4a,.wav,.aac,.ogg,.flac,.webm"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                style={{ display: 'block', width: '100%', marginTop: '12px', color: '#fff', fontSize: '14px', minHeight: '44px', opacity: 1, visibility: 'visible' }}
              />
              {audioFile && <p className="mt-3 text-sm font-semibold text-signal-green">Selected: {audioFile.name} · {(audioFile.size / (1024 * 1024)).toFixed(1)} MB</p>}
            </div>

            {/* Title + Artist */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-cream-300/50 mb-1.5 block">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Song or project name"
                  className="w-full bg-ink-900/60 border border-ink-600/40 rounded-md px-3 py-2.5 text-sm text-cream-100 placeholder:text-cream-300/30 focus:border-gold-500/50 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-cream-300/50 mb-1.5 block">Artist *</label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Your artist name"
                  className="w-full bg-ink-900/60 border border-ink-600/40 rounded-md px-3 py-2.5 text-sm text-cream-100 placeholder:text-cream-300/30 focus:border-gold-500/50 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Classification */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-cream-300/50 mb-1.5 block">Classification</label>
              <div className="grid grid-cols-3 gap-2">
                {classifications.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setClassification(c.value)}
                    className={`p-3 rounded-md border text-center transition-all ${
                      classification === c.value
                        ? c.value === 'ai'
                          ? 'border-teal-500/50 bg-teal-500/10'
                          : c.value === 'organic'
                          ? 'border-amber-500/50 bg-amber-500/10'
                          : 'border-gold-500/50 bg-gold-500/10'
                        : 'border-ink-600/40 bg-ink-900/30 hover:border-ink-500'
                    }`}
                  >
                    <div className="font-heading text-sm text-cream-50">{c.label}</div>
                    <div className="font-mono text-[9px] text-cream-300/40 mt-0.5">{c.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Genre + Mood + BPM + Key */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-cream-300/50 mb-1.5 block">Genre</label>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="e.g. Alt R&B"
                  className="w-full bg-ink-900/60 border border-ink-600/40 rounded-md px-3 py-2.5 text-sm text-cream-100 placeholder:text-cream-300/30 focus:border-gold-500/50 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-cream-300/50 mb-1.5 block">Mood</label>
                <input
                  type="text"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  placeholder="e.g. Late Night"
                  className="w-full bg-ink-900/60 border border-ink-600/40 rounded-md px-3 py-2.5 text-sm text-cream-100 placeholder:text-cream-300/30 focus:border-gold-500/50 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-cream-300/50 mb-1.5 block">BPM</label>
                <input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value)}
                  className="w-full bg-ink-900/60 border border-ink-600/40 rounded-md px-3 py-2.5 text-sm text-cream-100 placeholder:text-cream-300/30 focus:border-gold-500/50 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-cream-300/50 mb-1.5 block">Key</label>
                <input
                  type="text"
                  value={musicalKey}
                  onChange={(e) => setMusicalKey(e.target.value)}
                  placeholder="e.g. F# minor"
                  className="w-full bg-ink-900/60 border border-ink-600/40 rounded-md px-3 py-2.5 text-sm text-cream-100 placeholder:text-cream-300/30 focus:border-gold-500/50 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Cover URL */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-cream-300/50 mb-1.5 block">Cover Artwork URL (optional)</label>
              <input
                type="text"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-ink-900/60 border border-ink-600/40 rounded-md px-3 py-2.5 text-sm text-cream-100 placeholder:text-cream-300/30 focus:border-gold-500/50 focus:outline-none transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-cream-300/50 mb-1.5 block">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe your Tape — what it is, what it needs, where it could go..."
                className="w-full bg-ink-900/60 border border-ink-600/40 rounded-md px-3 py-2.5 text-sm text-cream-100 placeholder:text-cream-300/30 focus:border-gold-500/50 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Skills needed */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-cream-300/50 mb-1.5 block">Skills Needed (optional)</label>
              <div className="flex flex-wrap gap-2">
                {skillOptions.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded font-mono text-xs border transition-all ${
                      skills.includes(skill)
                        ? 'border-gold-500/50 bg-gold-500/10 text-gold-400'
                        : 'border-ink-600/40 bg-ink-900/30 text-cream-300/50 hover:border-ink-500'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm text-rust-500 bg-rust-500/10 border border-rust-500/30 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={onClose} className="btn-ghost">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Dropping...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Drop Tape
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
