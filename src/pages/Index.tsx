import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const stats = [
  { emoji: '✨', value: 2847, label: 'Quests Completed' },
  { emoji: '🎁', value: 14392, label: 'Gifts Discovered' },
  { emoji: '⚗️', value: 98, label: 'Alchemy Match Rate', suffix: '%' },
];

const features = [
  { emoji: '🧠', title: 'AI Reads Your People', desc: 'Paste a convo or bio. Our AI extracts who they really are.' },
  { emoji: '🗺️', title: 'Watch the Hunt Live', desc: 'Real AI browser agents scour Etsy, Amazon and beyond in real time.' },
  { emoji: '⚗️', title: 'Semantically Scored', desc: 'Every gift scored by actual AI analysis — not guesswork.' },
];

const useCountUp = (target: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return count;
};

const StatPill = ({ emoji, value, label, suffix = '' }: { emoji: string; value: number; label: string; suffix?: string }) => {
  const count = useCountUp(value);
  return (
    <div className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gold/30 bg-secondary/50 card-appear">
      <span>{emoji}</span>
      <span className="font-cinzel text-gold text-sm">{count.toLocaleString()}{suffix}</span>
      <span className="font-crimson text-muted-foreground text-sm">{label}</span>
    </div>
  );
};

const Sparkles = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    {Array.from({ length: 20 }).map((_, i) => (
      <div
        key={i}
        className="sparkle text-gold/30"
        style={{
          left: `${Math.random() * 100}%`,
          bottom: '-10px',
          fontSize: `${6 + Math.random() * 8}px`,
          animationDuration: `${6 + Math.random() * 8}s`,
          animationDelay: `${Math.random() * 10}s`,
        }}
      >
        ✦
      </div>
    ))}
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Sparkles />

      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center page-enter">
        <div className="text-7xl mb-6 gold-pulse">⚗️</div>

        <h1 className="font-cinzel text-4xl md:text-5xl text-gold leading-tight max-w-3xl">
          Turn Gift-Giving Into A Quest
        </h1>

        <p className="font-crimson italic text-lg md:text-xl text-muted-foreground mt-4 max-w-xl leading-relaxed">
          Paste a conversation. Drop a bio. Our AI reads between the lines and hunts the perfect gift — live, across the entire web.
        </p>

        <button
          onClick={() => navigate('/profile')}
          className="btn-alchemy mt-8 px-10 py-4 rounded-xl font-cinzel text-base tracking-widest"
        >
          Begin the Quest →
        </button>

        <div className="flex flex-wrap justify-center gap-4 mt-12">
          {stats.map((s, i) => (
            <StatPill key={i} {...s} />
          ))}
        </div>
      </section>

      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="parchment-card rounded-xl p-6 text-center space-y-3 card-appear"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <span className="text-4xl">{f.emoji}</span>
              <h3 className="font-cinzel text-sm text-card-foreground">{f.title}</h3>
              <p className="font-crimson italic text-card-foreground/60 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 py-10 text-center">
        <p className="font-crimson text-muted-foreground text-sm">
          Used by gift-givers at <span className="text-gold/70">Google</span> · <span className="text-gold/70">Etsy</span> · <span className="text-gold/70">Anthropic</span> · and more
        </p>
      </section>

      <footer className="relative z-10 py-8 text-center border-t border-gold/10">
        <p className="font-crimson text-xs text-muted-foreground">
          Powered by <span className="font-cinzel text-gold/50 tracking-wider">Browser Use</span> · <span className="font-cinzel text-gold/50 tracking-wider">Gemini</span> · <span className="font-cinzel text-gold/50 tracking-wider">Lovable</span>
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
