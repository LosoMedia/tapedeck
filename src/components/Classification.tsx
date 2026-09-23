import { Bot, Guitar, Shuffle, ArrowRight } from 'lucide-react';

const categories = [
  {
    id: 'ai',
    icon: Bot,
    label: 'AI Artists',
    tag: 'tag-ai',
    title: 'AI-Created Music',
    description:
      'Creators using AI as a primary part of their musical process. Upload concepts, pitch demos, and find the human musicians who can take them further.',
    points: [
      'Upload AI-generated demos',
      'Find vocalists, instrumentalists, and producers',
      'Develop AI concepts into hybrid productions',
      'Pitch AI-created music for collaboration',
    ],
    count: '234 artists',
  },
  {
    id: 'organic',
    icon: Guitar,
    label: 'Human Artists',
    tag: 'tag-organic',
    title: 'Organic / Human Music',
    description:
      'Traditional musicians and creators. Upload original music, offer collaboration, and discover AI-created concepts worth developing into finished records.',
    points: [
      'Upload original recordings and demos',
      'Offer vocals, instruments, production, or engineering',
      'Find AI concepts to develop with human performance',
      'Connect with producers and songwriters',
    ],
    count: '198 artists',
  },
  {
    id: 'hybrid',
    icon: Shuffle,
    label: 'Hybrid Artists',
    tag: 'tag-hybrid',
    title: 'Hybrid Productions',
    description:
      'Creators combining AI and human contributions. Tape Deck makes it possible to see how a project evolved from concept to finished record.',
    points: [
      'Track version history from AI demo to final',
      'Credit every contributor transparently',
      'Show the evolution of a record',
      'Release hybrid productions with full disclosure',
    ],
    count: '61 artists',
  },
];

export function Classification() {
  return (
    <section id="discover" className="relative py-24 px-5 sm:px-8 border-t border-ink-800/50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="section-label">002 · The Spectrum</span>
          <h2 className="font-display text-5xl sm:text-6xl text-cream-50 mt-2">
            AI · ORGANIC · HYBRID
          </h2>
          <p className="text-cream-200/50 mt-3">
            Every Tape on Tape Deck carries a classification. Not to separate — to connect.
            Know what you're hearing, who made it, and where it can go.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                className="panel panel-hover group p-6 flex flex-col gap-4 relative overflow-hidden"
              >
                {/* Decorative corner accent */}
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gold-500/5 group-hover:bg-gold-500/10 transition-colors duration-500" />

                <div className="flex items-center justify-between relative">
                  <div className="w-12 h-12 rounded-lg bg-ink-800 border border-ink-600/50 flex items-center justify-center group-hover:border-gold-500/40 transition-colors">
                    <Icon className="w-6 h-6 text-gold-400" />
                  </div>
                  <span className={`tag ${cat.tag}`}>{cat.label}</span>
                </div>

                <div>
                  <h3 className="font-heading font-bold text-xl text-cream-50">{cat.title}</h3>
                  <p className="text-sm text-cream-200/50 mt-2 leading-relaxed">{cat.description}</p>
                </div>

                <ul className="space-y-2 mt-1">
                  {cat.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-cream-200/60">
                      <span className="w-1 h-1 rounded-full bg-gold-500/60 mt-1.5 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between pt-3 mt-auto border-t border-ink-600/30">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-cream-300/40">
                    {cat.count}
                  </span>
                  <a href="#fresh-tapes" className="flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300 transition-colors">
                    Explore
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
