import { useState, useEffect, useRef } from 'react';

interface AgentThoughtStreamProps {
  extraLines?: string[];
  isActive?: boolean;
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

const AgentThoughtStream = ({ extraLines = [], isActive = true }: AgentThoughtStreamProps) => {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const seenLinesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (extraLines.length === 0) {
      seenLinesRef.current.clear();
      setVisibleLines([]);
      return;
    }

    const nextLines = extraLines
      .map(cleanLine)
      .filter((line): line is string => Boolean(line))
      .filter((line) => {
        if (seenLinesRef.current.has(line)) return false;
        seenLinesRef.current.add(line);
        return true;
      });

    if (nextLines.length > 0) {
      setVisibleLines((prev) => [...prev, ...nextLines]);
    }
  }, [extraLines]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleLines]);

  return (
    <div className="space-y-2">
      <h4 className="font-cinzel text-sm text-gold flex items-center gap-2">🧠 The AI Is Muttering To Itself</h4>
      <div
        ref={containerRef}
        className="rounded-lg p-4 h-48 overflow-y-auto font-mono text-xs leading-relaxed"
        style={{ background: '#0D0A1A' }}
      >
        {visibleLines.length === 0 ? (
          <div className="text-muted-foreground/70 italic">{isActive ? 'Waiting for a real update from the AI...' : 'All quiet. The AI is done.'}</div>
        ) : (
          visibleLines.map((line, i) => (
            <div key={i} className="text-gold/80 card-appear" style={{ animationDelay: '0s' }}>
              {line}
            </div>
          ))
        )}
        {isActive ? <span className="text-gold cursor-blink">▊</span> : <div className="mt-2 text-muted-foreground/60 italic">Done muttering.</div>}
      </div>
    </div>
  );
};

export default AgentThoughtStream;
