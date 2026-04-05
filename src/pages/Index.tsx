import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const stats = [
  { emoji: '😤', value: 7, label: 'Gift Cards Prevented' },
  { emoji: '💀', value: 2847, label: 'Hours of Panicked Googling Saved' },
  { emoji: '🫠', value: 100, label: '% Chance You\'ll Cry At How Good These Are', suffix: '%' },
];

const features = [
  { emoji: '📱', title: 'Paste Their Texts (We Won\'t Judge)', desc: 'We read your friend\'s unhinged 2am messages so you don\'t have to summarize their personality yourself.' },
  { emoji: '🤖', title: 'Watch An AI Shop For You', desc: 'A real browser agent goes feral across Etsy, Amazon, and weird niche sites. You can literally watch it happen. It\'s oddly satisfying.' },
  { emoji: '📊', title: 'Scored By Science* (*Not Science)', desc: 'Every gift gets a match score. It\'s based on AI analysis, vibes, and a little bit of audacity.' },
];

const heroEmojis = ['🚨', '🎁', '😤', '💀', '🫠'];

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

const RotatingEmoji = () => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIdx(i => (i + 1) % heroEmojis.length), 1500);
    return () => clearInterval(timer);
  }, []);
  return <div className="text-7xl mb-6 gold-pulse">{heroEmojis[idx]}</div>;
};

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Sparkles />

      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center page-enter">
        <RotatingEmoji />

        <h1 className="font-cinzel text-4xl md:text-5xl text-gold leading-tight max-w-3xl">
          Stop Giving Gift Cards, You Coward
        </h1>

        <p className="font-crimson italic text-lg md:text-xl text-muted-foreground mt-4 max-w-xl leading-relaxed">
          Paste their texts. We'll psychoanalyze them (ethically, probably) and unleash AI agents to find a gift that proves you actually listen.
        </p>

        <button
          onClick={() => navigate('/profile')}
          className="btn-alchemy mt-8 px-10 py-4 rounded-xl font-cinzel text-base tracking-widest"
        >
          Fine, I'll Be A Good Friend →
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
          Built for people who once gave someone a candle and still think about it at <span className="text-gold/70">3am</span>
        </p>
      </section>

      <footer className="relative z-10 py-8 text-center border-t border-gold/10">
        <p className="font-crimson text-xs text-muted-foreground">
          Powered by <span className="font-cinzel text-gold/50 tracking-wider">Browser Use</span> · <span className="font-cinzel text-gold/50 tracking-wider">Gemini</span> · <span className="font-cinzel text-gold/50 tracking-wider">Lovable</span> · <span className="font-cinzel text-gold/50 tracking-wider">NoGiftCards</span>
        </p>
        <p className="font-crimson text-[10px] text-muted-foreground/50 mt-2 italic">No gift cards were harmed in the making of this website</p>
      </footer>
    </div>
  );
};

export default LandingPage;
