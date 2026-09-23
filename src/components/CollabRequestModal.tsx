import { useState, useEffect } from 'react';
import { X, Users, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase, type TapeRow } from '@/lib/supabase';

interface CollabRequestModalProps {
  tape: TapeRow | null;
  onClose: () => void;
}

export function CollabRequestModal({ tape, onClose }: CollabRequestModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!tape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [tape, onClose]);

  if (!tape) return null;

  const skillOptions = tape.skills_needed.length > 0 ? tape.skills_needed : [
    'Vocals', 'Guitar', 'Bass', 'Drums', 'Production', 'Mixing',
    'Mastering', 'Songwriting', 'Arrangement', 'Remix',
  ];

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim() || !role.trim()) {
      setError('Your name and role are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    const { error: insertError } = await supabase.from('collab_requests').insert({
      tape_id: tape.id,
      applicant_name: name.trim(),
      applicant_role: role.trim(),
      message: message.trim(),
      skills,
      contact: contact.trim(),
      status: 'pending',
    });

    setSubmitting(false);

    if (insertError) {
      setError('Something went wrong. Please try again.');
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setName('');
      setRole('');
      setContact('');
      setMessage('');
      setSkills([]);
      onClose();
    }, 1800);
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start sm:items-center justify-center bg-ink-950/80 backdrop-blur-sm overflow-y-auto p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg my-8 panel grain overflow-hidden animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-ink-600/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h2 className="font-display text-2xl text-cream-50">MAKE IT REAL</h2>
              <p className="font-mono text-[10px] uppercase tracking-wider text-cream-300/40">
                Apply to collaborate on "{tape.title}"
              </p>
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
            <h3 className="font-display text-3xl text-cream-50">APPLICATION SENT</h3>
            <p className="text-cream-200/60 mt-2">Your collaboration request has been submitted.</p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Name + Role */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-cream-300/50 mb-1.5 block">Your Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-ink-900/60 border border-ink-600/40 rounded-md px-3 py-2.5 text-sm text-cream-100 placeholder:text-cream-300/30 focus:border-gold-500/50 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-cream-300/50 mb-1.5 block">Your Role *</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Vocalist, Producer"
                  className="w-full bg-ink-900/60 border border-ink-600/40 rounded-md px-3 py-2.5 text-sm text-cream-100 placeholder:text-cream-300/30 focus:border-gold-500/50 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Contact */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-cream-300/50 mb-1.5 block">Contact (email or social)</label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="How can the creator reach you?"
                className="w-full bg-ink-900/60 border border-ink-600/40 rounded-md px-3 py-2.5 text-sm text-cream-100 placeholder:text-cream-300/30 focus:border-gold-500/50 focus:outline-none transition-colors"
              />
            </div>

            {/* Skills */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-cream-300/50 mb-1.5 block">Your Skills</label>
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

            {/* Message */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-cream-300/50 mb-1.5 block">Message to the Creator</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="What would you bring to this project? How would you take it further?"
                className="w-full bg-ink-900/60 border border-ink-600/40 rounded-md px-3 py-2.5 text-sm text-cream-100 placeholder:text-cream-300/30 focus:border-gold-500/50 focus:outline-none transition-colors resize-none"
              />
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
                    Sending...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    Submit Application
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
