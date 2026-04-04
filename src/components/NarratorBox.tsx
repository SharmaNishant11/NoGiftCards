import { useState, useEffect } from 'react';
import { mockNarration } from '@/data/mockData';

const NarratorBox = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(i => (i + 1) % mockNarration.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="parchment-card rounded-lg p-4 space-y-3">
      <h4 className="font-cinzel text-sm text-card-foreground flex items-center gap-2">
        🎙️ Quest Narrator
      </h4>
      <p className="font-crimson italic text-card-foreground/80 text-sm leading-relaxed card-appear" key={index}>
        "{mockNarration[index]}"
      </p>
      <div className="flex items-center justify-end gap-1.5">
        <span className="text-[10px] font-crimson text-card-foreground/40">Powered by</span>
        <span className="text-[10px] font-cinzel text-card-foreground/50 tracking-wider">ElevenLabs</span>
      </div>
    </div>
  );
};

export default NarratorBox;
