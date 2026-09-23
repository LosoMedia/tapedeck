import { Sparkles, ArrowRight, Bot, Guitar, Disc3, Star, Users } from 'lucide-react';

const pathways = [
  {
    id: 'p1',
    icon: Bot,
    label: 'AI Concept',
    steps: ['AI Demo', 'Human Guitar Added', 'Human Vocal Recorded', 'Producer Reworked Arrangement', 'Hybrid Final'],
    color: 'text-teal-500',
  },
  {
    id: 'p2',
    icon: Guitar,
    label: 'Human Demo',
    steps: ['Human Demo', 'AI Experimentation', 'Human Performance', 'Finished Record'],
    color: 'text-amber-500',
  },
  {
    id: 'p3',
    icon: Disc3,
    label: 'Human Song',
    steps: ['Human Song', 'Producer Collaboration', 'Professional Release'],
    color: 'text-gold-400',
  },
];

interface MakeItRealProps {
  onFindTape: () => void;
  onDropTape: () => void;
}

export function MakeItReal({ onFindTape, onDropTape }: MakeItRealProps) {
  return (
    <section
      id="make-it-real"
      className="relative py-32 px-5 sm:px-8 border-t border-ink-800/50 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.pexels.com/photos/8382618/pexels-photo-8382618.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
          alt=""
          className="w-full h-full object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950 via-ink-950/80 to-ink-950" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold-500/30 bg-gold-500/5 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-gold-400">
              The Defining Feature
            </span>
          </div>
          <h2 className="font-display text-6xl sm:text-7xl text-cream-50 leading-tight">
            MAKE IT <span className="text-gradient-gold">REAL</span>
          </h2>
          <p className="text-cream-200/60 mt-4 text-lg leading-relaxed">
            A user discovers a Tape and sees an opportunity. "This needs a real guitar."
            "I could sing this." "I want to remix this." Instead of simply liking the song,
            they can collaborate with its creator.
          </p>
        </div>

        {/* Pathways */}
        <div className="grid md:grid-cols-3 gap-5 mb-16">
          {pathways.map((pathway) => {
            const Icon = pathway.icon;
            return (
              <div key={pathway.id} className="panel p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-ink-800 border border-ink-600/50 flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${pathway.color}`} />
                  </div>
                  <span className="font-mono text-xs uppercase tracking-widest text-cream-300/60">
                    {pathway.label}
                  </span>
                </div>

                <div className="space-y-2">
                  {pathway.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-7 h-7 rounded-full border flex items-center justify-center font-mono text-[10px] ${
                            i === pathway.steps.length - 1
                              ? 'border-gold-500/50 bg-gold-500/10 text-gold-400'
                              : 'border-ink-600 bg-ink-800 text-cream-300/50'
                          }`}
                        >
                          {i + 1}
                        </div>
                        {i < pathway.steps.length - 1 && (
                          <div className="w-px h-4 bg-ink-600/50" />
                        )}
                      </div>
                      <span
                        className={`text-sm ${
                          i === pathway.steps.length - 1
                            ? 'text-gold-400 font-semibold'
                            : 'text-cream-200/60'
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Journey callout */}
        <div className="panel p-8 lg:p-10">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="section-label">The Core Journey</span>
              <h3 className="font-display text-3xl sm:text-4xl text-cream-50 mt-2 leading-tight">
                EVERY GREAT RECORD STARTS SOMEWHERE.
              </h3>
              <p className="text-cream-200/50 mt-3 leading-relaxed">
                Tape Deck helps it find where it can go. Discover music, hear a Tape,
                read about it, notice an opportunity, find a collaborator, create a new
                version, credit contributors, and release the finished project.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <button onClick={onFindTape} className="btn-primary">
                  Find a Tape
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={onDropTape} className="btn-ghost">
                  Drop Your Own
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Users, label: 'Open Collaborations', value: '64', sub: 'active right now' },
                { icon: Star, label: 'Pitch-Ready Tapes', value: '23', sub: 'seeking placement' },
                { icon: Disc3, label: 'Hybrid Productions', value: '156', sub: 'AI + human credited' },
                { icon: Guitar, label: 'Human Performances', value: '412', sub: 'on AI concepts' },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-ink-900/50 border border-ink-600/40 rounded-lg p-4">
                    <Icon className="w-5 h-5 text-gold-400/70 mb-2" />
                    <div className="font-display text-3xl text-cream-50">{stat.value}</div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-cream-300/50 mt-1">
                      {stat.label}
                    </div>
                    <div className="font-mono text-[9px] text-cream-300/30 mt-0.5">{stat.sub}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
