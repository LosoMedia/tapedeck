import { useEffect, useState } from 'react';
import { Menu, X, Disc3 } from 'lucide-react';

const navLinks = [
  { label: 'Discover', href: '#discover' },
  { label: 'Tapes', href: '#fresh-tapes' },
  { label: 'Reviews', href: '#reviews' },
  { label: 'Collaborate', href: '#collaborate' },
  { label: 'Make It Real', href: '#make-it-real' },
];

interface NavbarProps {
  onDropTape: () => void;
}

export function Navbar({ onDropTape }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-ink-950/90 backdrop-blur-md border-b border-ink-700/50'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 rounded-full bg-ink-800 border border-gold-500/40 flex items-center justify-center group-hover:border-gold-500 transition-colors">
            <Disc3 className="w-5 h-5 text-gold-500 animate-spin-slow" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-xl text-cream-50 tracking-wider">TAPE DECK</span>
            <span className="font-mono text-[8px] text-gold-500/70 uppercase tracking-[0.25em]">LosoMedia</span>
          </div>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-heading text-sm text-cream-200/80 hover:text-gold-400 transition-colors relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-gold-500 group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        {/* CTA + mobile toggle */}
        <div className="flex items-center gap-3">
          <button onClick={onDropTape} className="hidden sm:inline-flex btn-ghost text-sm py-2 px-4">
            Drop a Tape
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-cream-100"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-ink-900/95 backdrop-blur-md border-t border-ink-700/50">
          <div className="px-5 py-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="font-heading text-sm text-cream-200/80 hover:text-gold-400 py-2"
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={() => { setMenuOpen(false); onDropTape(); }}
              className="btn-ghost text-sm py-2 px-4 mt-2 self-start"
            >
              Drop a Tape
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
