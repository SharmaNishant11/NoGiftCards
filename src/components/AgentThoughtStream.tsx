import { useState, useEffect, useRef } from 'react';
import { mockThoughtStream } from '@/data/mockData';

interface AgentThoughtStreamProps {
  extraLines?: string[];
}

const AgentThoughtStream = ({ extraLines = [] }: AgentThoughtStreamProps) => {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const allLines = [...mockThoughtStream, ...extraLines];
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let idx = 0;
    const timer = setInterval(() => {
      if (idx < allLines.length) {
        setVisibleLines(prev => [...prev, allLines[idx]]);
        idx++;
      } else {
        idx = 0;
        setVisibleLines([]);
      }
    }, 1500);
    return () => clearInterval(timer);
  }, [extraLines.length]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleLines]);

  return (
    <div className="space-y-2">
      <h4 className="font-cinzel text-sm text-gold flex items-center gap-2">🧠 Agent Thinks Out Loud</h4>
      <div
        ref={containerRef}
        className="rounded-lg p-4 h-48 overflow-y-auto font-mono text-xs leading-relaxed"
        style={{ background: '#0D0A1A' }}
      >
        {visibleLines.map((line, i) => (
          <div key={i} className="text-gold/80 card-appear" style={{ animationDelay: '0s' }}>
            {line}
          </div>
        ))}
        <span className="text-gold cursor-blink">▊</span>
      </div>
    </div>
  );
};

export default AgentThoughtStream;
