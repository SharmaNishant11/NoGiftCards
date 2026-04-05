import { useState } from 'react';

interface RedirectBarProps {
  onRedirect: (msg: string) => void;
  lastRedirect: string | null;
}

const RedirectBar = ({ onRedirect, lastRedirect }: RedirectBarProps) => {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (!input.trim()) return;
    onRedirect(input.trim());
    setInput('');
  };

  return (
    <div className="space-y-2">
      <h4 className="font-cinzel text-sm text-gold flex items-center gap-2">📢 Yell At The AI</h4>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="e.g. No more mugs, try something weird..."
          className="flex-1 bg-input border border-gold/30 rounded-md px-3 py-2 text-sm text-foreground font-crimson placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold transition-all"
        />
        <button onClick={handleSubmit} className="btn-alchemy px-4 py-2 rounded-md text-sm">
          SEND IT
        </button>
      </div>
      {lastRedirect && (
        <p className="text-xs text-muted-foreground font-crimson italic card-appear">
          ↳ {lastRedirect}
        </p>
      )}
    </div>
  );
};

export default RedirectBar;
