import { Disc3, Instagram, Youtube, Music2, AudioLines } from 'lucide-react';

const footerLinks = {
  Platform: ['Discover', 'Fresh Tapes', 'Reviews', 'Collaborate', 'Make It Real', 'Drop a Tape'],
  Creators: ['AI Artists', 'Human Artists', 'Hybrid Artists', 'Producers', 'Songwriters', 'Engineers'],
  About: ['The Mission', 'Ownership & Credits', 'Pitch Platform', 'Tape Deck Radio', 'Privacy', 'Terms'],
};

const socials = [
  { icon: AudioLines, href: 'https://on.soundcloud.com/v0cLtHZAnlulIhb8UE', label: 'SoundCloud' },
  { icon: Youtube, href: 'https://youtube.com/@losomedia?si=-SpFSXmMtqZnSpEu', label: 'YouTube' },
  { icon: Music2, href: 'https://open.spotify.com/artist/32WISuWgR93g29jcK6Ujqf?si=W44fykA4S4GMuQC6ae60mQ', label: 'Spotify' },
  { icon: Disc3, href: 'https://suno.com/@nakajoneso33', label: 'Suno' },
  { icon: Music2, href: 'https://www.tiktok.com/@3_loso_3?_r=1&_t=ZP-97b162l7M9X', label: 'TikTok' },
  { icon: Instagram, href: 'https://www.instagram.com/losojones33?igsh=N3Z2dmRtOWU5YXF4', label: 'Instagram' },
];

export function Footer() {
  return (
    <footer className="relative border-t border-ink-800/50 bg-ink-950 grain">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16">
        {/* Top section */}
        <div className="grid lg:grid-cols-12 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-full bg-ink-800 border border-gold-500/40 flex items-center justify-center">
                <Disc3 className="w-5 h-5 text-gold-500 animate-spin-slow" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display text-2xl text-cream-50 tracking-wider">TAPE DECK</span>
                <span className="font-mono text-[9px] text-gold-500/70 uppercase tracking-[0.25em]">LosoMedia</span>
              </div>
            </div>
            <p className="text-sm text-cream-200/50 leading-relaxed max-w-xs">
              Where AI meets human musicians. Create, pitch, review, collaborate, and make it real.
            </p>

            {/* LosoMedia social links */}
            <div className="mt-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-gold-500/60 mb-3">Find LosoMedia</p>
              <div className="grid grid-cols-3 gap-2 max-w-sm">
                {socials.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`LosoMedia on ${social.label}`}
                      title={social.label}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-ink-800 border border-ink-600/50 text-cream-300/60 hover:text-gold-400 hover:border-gold-500/40 transition-all"
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-xs">{social.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="font-mono text-xs uppercase tracking-widest text-gold-500/60 mb-4">
                  {category}
                </h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-cream-200/50 hover:text-gold-400 transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="divider-line mb-8" />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-cream-300/40">
            <span>© 2026</span>
            <a
              href="https://losojones.art"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-400 hover:text-gold-300 transition-colors font-semibold"
            >
              LosoMedia™
            </a>
            <span>·</span>
            <span className="text-cream-300/50">Tape Deck</span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-cream-300/30">
            <span>Create</span>
            <span className="text-gold-500/40">→</span>
            <span>Pitch</span>
            <span className="text-gold-500/40">→</span>
            <span>Review</span>
            <span className="text-gold-500/40">→</span>
            <span>Collaborate</span>
            <span className="text-gold-500/40">→</span>
            <span className="text-gold-400">Make It Real</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
