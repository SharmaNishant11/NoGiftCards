import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import RecipientWizard from '@/components/RecipientWizard';
import ConversationAnalyzer from '@/components/ConversationAnalyzer';
import GiftDNARadar from '@/components/GiftDNARadar';
import ProfileTagCloud from '@/components/ProfileTagCloud';
import { GiftDNA, WizardStep, ProfileMethod } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import BudgetSlider from '@/components/BudgetSlider';
import OccasionSelector from '@/components/OccasionSelector';
import DeliveryDatePicker from '@/components/DeliveryDatePicker';

const computeDNA = (traits: string[]): GiftDNA => {
  let dna = { sentimental: 30, practical: 30, adventurous: 30, luxurious: 30, quirky: 30 };
  const modifiers: Record<string, Partial<GiftDNA>> = {
    coffee: { practical: 20, quirky: 10 }, bookworm: { sentimental: 20, practical: 15 },
    adventurer: { adventurous: 30, practical: 10 }, chef: { practical: 25, luxurious: 10 },
    tech: { practical: 20, luxurious: 15 }, nightowl: { quirky: 15, adventurous: 10 },
    creative: { sentimental: 15, quirky: 20 }, gamer: { quirky: 20, adventurous: 15 },
    wellness: { sentimental: 15, luxurious: 20 }, traveler: { adventurous: 25, luxurious: 10 },
    mornings: { quirky: 15 }, late: { quirky: 10 }, overthinker: { sentimental: 15 },
    chaotic: { quirky: 25 }, researcher: { practical: 15 }, bougie: { luxurious: 25 },
    dramatic: { sentimental: 20, quirky: 10 }, introvert: { sentimental: 15, practical: 10 },
    truecrime: { quirky: 20, adventurous: 10 }, binge: { practical: 10 }, gym: { practical: 20 },
    garden: { sentimental: 10, practical: 15 }, wine: { luxurious: 20 }, shopping: { practical: 15 },
    music: { sentimental: 15, quirky: 10 }, puzzles: { quirky: 15, practical: 10 },
  };
  traits.forEach(t => {
    const mod = modifiers[t];
    if (mod) (Object.keys(mod) as (keyof GiftDNA)[]).forEach(k => { dna[k] = Math.min(100, dna[k] + (mod[k] || 0)); });
  });
  return dna;
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState<ProfileMethod>('conversation');
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [step, setStep] = useState<WizardStep>(1);
  const [name, setName] = useState('');
  const [occasion, setOccasion] = useState('');
  const [budget, setBudget] = useState(50);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [claudeSummary, setClaudeSummary] = useState('');
  const [dnaOverride, setDnaOverride] = useState<GiftDNA | null>(null);
  const [signalCount, setSignalCount] = useState(0);
  const [launching, setLaunching] = useState(false);
  const [notes, setNotes] = useState('');

  const dna = dnaOverride || computeDNA(selectedTraits);

  const handleTraitToggle = useCallback((id: string) => {
    setSelectedTraits(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const handleProfileExtracted = (result: any) => {
    setSelectedTraits([...result.traits, ...result.quirks, ...result.hobbies]);
    setDnaOverride(result.dnaScores);
    setClaudeSummary(result.summary);
    setSignalCount(result.signalCount);
  };

  const canLaunch = name.trim() && (method === 'conversation' ? claudeSummary : selectedTraits.length > 0);

  const handleLaunchQuest = async () => {
    if (!canLaunch) return;
    setLaunching(true);

    const profile = {
      name,
      personalities: selectedTraits.filter(t => ['coffee', 'bookworm', 'adventurer', 'chef', 'tech', 'nightowl', 'creative', 'gamer', 'wellness', 'traveler'].includes(t)),
      quirks: selectedTraits.filter(t => ['mornings', 'late', 'overthinker', 'chaotic', 'researcher', 'bougie', 'dramatic', 'introvert'].includes(t)),
      hobbies: selectedTraits.filter(t => ['truecrime', 'binge', 'gym', 'garden', 'wine', 'shopping', 'music', 'puzzles'].includes(t)),
      notes,
      budget,
      occasion,
      deliveryDate,
      claudeSummary,
    };

    try {
      const { data, error } = await supabase.functions.invoke('launch-quest', { body: profile });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      sessionStorage.setItem('questProfile', JSON.stringify(profile));
      sessionStorage.setItem('questId', data.questId);
      if (data.liveUrl) sessionStorage.setItem('questLiveUrl', data.liveUrl);

      toast.success('🏃 Agents deployed! They\'re already judging your friend\'s taste.');
      setTimeout(() => navigate('/quest'), 600);
    } catch (e) {
      console.error('Launch error:', e);
      toast.error('Failed to launch. Falling back to demo mode.');
      sessionStorage.setItem('questProfile', JSON.stringify(profile));
      sessionStorage.setItem('questId', 'mock');
      navigate('/quest');
    } finally {
      setLaunching(false);
    }
  };

  const handleManualComplete = (data: any) => {
    setName(data.name);
    setNotes(data.notes);
    setBudget(data.budget);
    setOccasion(data.occasion);
    setDeliveryDate(data.deliveryDate);
  };

  return (
    <div className="min-h-screen p-6 page-enter">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/')} className="text-gold/50 hover:text-gold transition-colors font-cinzel text-sm">← Back</button>
          <h1 className="font-cinzel text-2xl text-gold">Tell Us About Your Victim</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-8">
          {/* Left: Input Panel */}
          <div className="space-y-6">
            {/* Method Toggle */}
            <div className="flex rounded-lg border border-gold/30 overflow-hidden">
              <button
                onClick={() => setMethod('conversation')}
                className={`flex-1 py-3 px-4 font-cinzel text-sm transition-all ${method === 'conversation' ? 'bg-gold/20 text-gold' : 'text-muted-foreground hover:text-foreground'}`}
              >
                📱 Dump Their Texts
              </button>
              <button
                onClick={() => setMethod('manual')}
                className={`flex-1 py-3 px-4 font-cinzel text-sm transition-all ${method === 'manual' ? 'bg-gold/20 text-gold' : 'text-muted-foreground hover:text-foreground'}`}
              >
                🧠 I'll Describe Them Myself (Unreliably)
              </button>
            </div>

            {method === 'conversation' ? (
              <div className="space-y-6">
                <ConversationAnalyzer
                  onProfileExtracted={handleProfileExtracted}
                  recipientName={name}
                  onNameChange={setName}
                />

                {claudeSummary && (
                  <div className="space-y-5 card-appear">
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Anything else? Allergies, exes to avoid gifting similarly to, that one time they said they 'don't need anything'..."
                      className="w-full bg-input border border-gold/20 rounded-md p-3 text-sm font-crimson text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold h-20 resize-none transition-all"
                    />
                    <BudgetSlider value={budget} onChange={setBudget} />
                    <OccasionSelector selected={occasion} onSelect={setOccasion} />
                    <DeliveryDatePicker value={deliveryDate} onChange={setDeliveryDate} />
                  </div>
                )}
              </div>
            ) : (
              <RecipientWizard
                onComplete={handleManualComplete}
                onStepChange={setStep}
                onTraitToggle={handleTraitToggle}
                selectedTraits={selectedTraits}
              />
            )}

            {/* Launch Button */}
            {canLaunch && (
              <button
                onClick={handleLaunchQuest}
                disabled={launching}
                className={`btn-alchemy w-full py-4 rounded-lg font-cinzel text-sm tracking-wider card-appear ${launching ? '' : 'gold-pulse'}`}
              >
                {launching ? (
                  <span className="gold-pulse">🏃 The agents are putting on pants...</span>
                ) : (
                  '🚀 Release The Agents (No Turning Back)'
                )}
              </button>
            )}
          </div>

          {/* Right: DNA Sidebar */}
          <div className="space-y-6 p-5 rounded-xl border border-gold/20 bg-secondary/30">
            <GiftDNARadar
              dna={dna}
              recipientName={name || '???'}
              occasion={occasion}
              budget={budget}
              deliveryDate={deliveryDate}
            />

            {claudeSummary && (
              <div className="border-t border-gold/10 pt-4 card-appear">
                <h4 className="font-cinzel text-xs text-gold tracking-wider mb-2">🧠 What We Extracted From Their Soul</h4>
                <p className="font-crimson italic text-sm text-foreground/80 leading-relaxed">"{claudeSummary}"</p>
                {signalCount > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    {Array.from({ length: Math.min(signalCount, 10) }).map((_, i) => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-gold" style={{ animationDelay: `${i * 0.1}s` }} />
                    ))}
                    <span className="text-[10px] font-crimson text-muted-foreground ml-1">{signalCount} signals</span>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-gold/10 pt-4">
              <h4 className="font-cinzel text-xs text-muted-foreground mb-3 tracking-wider">Selected Traits</h4>
              <ProfileTagCloud selectedIds={selectedTraits} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
