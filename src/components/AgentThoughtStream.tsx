import { useState, useEffect, useRef } from 'react';
import { mockThoughtStream } from '@/data/mockData';

interface AgentThoughtStreamProps {
  extraLines?: string[];
}

// Clean raw agent output to be human readable
function cleanLine(raw: string): string {
  if (!raw) return "";
  let s = raw;
  // Strip HTML tags
  s = s.replace(/<[^>]*>/g, "");
  // Strip markdown code blocks
  s = s.replace(/```[\s\S]*?```/g, "");
  // Strip JSON blobs
  s = s.replace(/\{[\s\S]{60,}\}/g, "[analyzing data...]");
  s = s.replace(/\[[\s\S]{100,}\]/g, "[found products]");
  // Strip very long URLs
  s = s.replace(/https?:\/\/\S{80,}/g, "[link]");
  // Clean up excessive whitespace
  s = s.replace(/\n{2,}/g, " ").replace(/\s{3,}/g, " ").trim();
  // Skip empty or too-short lines
  if (s.length < 3) return "";
  // Truncate very long lines
  if (s.length > 200) s = s.substring(0, 197) + "...";
  return s;
}

const AgentThoughtStream = ({ extraLines = [] }: AgentThoughtStreamProps) => {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const allLines = [...mockThoughtStream, ...extraLines];
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let idx = 0;
    const timer = setInterval(() => {
      if (idx < allLines.length) {
        const cleaned = cleanLine(allLines[idx]);
        if (cleaned) {
          setVisibleLines(prev => [...prev, cleaned]);
        }
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
