import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConversationAnalyzerProps {
  onProfileExtracted: (result: {
    traits: string[];
    quirks: string[];
    hobbies: string[];
    dnaScores: { sentimental: number; practical: number; adventurous: number; luxurious: number; quirky: number };
    summary: string;
    signalCount: number;
  }) => void;
  recipientName: string;
  onNameChange: (name: string) => void;
}

const ConversationAnalyzer = ({ onProfileExtracted, recipientName, onNameChange }: ConversationAnalyzerProps) => {
  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!text.trim() || !recipientName.trim()) {
      toast.error('Please enter both a name and conversation text.');
      return;
    }

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-profile', {
        body: { text, name: recipientName },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      onProfileExtracted(data);
      toast.success(`✨ Profile extracted! Claude found ${data.signalCount} personality signals.`);
    } catch (e) {
      console.error('Analysis error:', e);
      toast.error('Failed to analyze conversation. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="font-cinzel text-sm text-gold tracking-wider">What do you call them?</label>
        <input
          value={recipientName}
          onChange={e => onNameChange(e.target.value)}
          placeholder="Their name or nickname"
          className="w-full bg-input border border-gold/30 rounded-md px-3 py-2 text-foreground font-crimson placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all"
        />
      </div>

      <div className="space-y-2">
        <label className="font-cinzel text-sm text-gold tracking-wider">Paste a conversation</label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={10}
          placeholder={`Paste a WhatsApp, iMessage, or any chat conversation with or about this person. Our AI will read between the lines...

Example:
Alex: ugh another monday, at least i have my cold brew
You: lol you and your coffee
Alex: currently investigating whether my neighbor is a murderer
You: ...what
Alex: true crime podcast got me paranoid again 😂`}
          className="w-full bg-input border border-gold/20 rounded-md p-4 text-sm font-crimson text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold resize-none transition-all leading-relaxed"
        />
      </div>

      <button
        onClick={handleAnalyze}
        disabled={analyzing || !text.trim() || !recipientName.trim()}
        className="btn-alchemy w-full py-3 rounded-lg font-cinzel text-sm tracking-wider"
      >
        {analyzing ? (
          <span className="gold-pulse">🧠 Reading between the lines...</span>
        ) : (
          '🧠 Analyze with AI →'
        )}
      </button>

      {analyzing && (
        <div className="text-center card-appear">
          <p className="font-crimson italic text-muted-foreground text-sm">
            AI is reading between the lines...
          </p>
          <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gold/60 rounded-full" style={{ animation: 'goldShimmer 1.5s ease infinite', width: '60%' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationAnalyzer;
