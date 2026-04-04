import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import RecipientWizard from '@/components/RecipientWizard';
import GiftDNARadar from '@/components/GiftDNARadar';
import ProfileTagCloud from '@/components/ProfileTagCloud';
import { GiftDNA, WizardStep } from '@/types';

const computeDNA = (traits: string[]): GiftDNA => {
  let dna = { sentimental: 30, practical: 30, adventurous: 30, luxurious: 30, quirky: 30 };
  const modifiers: Record<string, Partial<GiftDNA>> = {
    coffee: { practical: 20, quirky: 10 },
    bookworm: { sentimental: 20, practical: 15 },
    adventurer: { adventurous: 30, practical: 10 },
    chef: { practical: 25, luxurious: 10 },
    tech: { practical: 20, luxurious: 15 },
    nightowl: { quirky: 15, adventurous: 10 },
    creative: { sentimental: 15, quirky: 20 },
    gamer: { quirky: 20, adventurous: 15 },
    wellness: { sentimental: 15, luxurious: 20 },
    traveler: { adventurous: 25, luxurious: 10 },
    mornings: { quirky: 15 },
    late: { quirky: 10 },
    overthinker: { sentimental: 15 },
    chaotic: { quirky: 25 },
    researcher: { practical: 15 },
    bougie: { luxurious: 25 },
    dramatic: { sentimental: 20, quirky: 10 },
    introvert: { sentimental: 15, practical: 10 },
    truecrime: { quirky: 20, adventurous: 10 },
    binge: { practical: 10 },
    gym: { practical: 20 },
    garden: { sentimental: 10, practical: 15 },
    wine: { luxurious: 20 },
    shopping: { practical: 15 },
    music: { sentimental: 15, quirky: 10 },
    puzzles: { quirky: 15, practical: 10 },
  };

  traits.forEach(t => {
    const mod = modifiers[t];
    if (mod) {
      (Object.keys(mod) as (keyof GiftDNA)[]).forEach(k => {
        dna[k] = Math.min(100, dna[k] + (mod[k] || 0));
      });
    }
  });
  return dna;
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [step, setStep] = useState<WizardStep>(1);
  const [name, setName] = useState('');
  const [occasion, setOccasion] = useState('');
  const [budget, setBudget] = useState(50);
  const [deliveryDate, setDeliveryDate] = useState('');

  const dna = computeDNA(selectedTraits);

  const handleTraitToggle = useCallback((id: string) => {
    setSelectedTraits(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const handleComplete = (data: any) => {
    // Store in sessionStorage for quest page
    sessionStorage.setItem('questProfile', JSON.stringify(data));
    navigate('/quest');
  };

  return (
    <div className="min-h-screen p-6 page-enter">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/')} className="text-gold/50 hover:text-gold transition-colors font-cinzel text-sm">
            ← Back
          </button>
          <h1 className="font-cinzel text-2xl text-gold">Recipient Profiler</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-8">
          {/* Left: Wizard */}
          <RecipientWizard
            onComplete={handleComplete}
            onStepChange={setStep}
            onTraitToggle={handleTraitToggle}
            selectedTraits={selectedTraits}
          />

          {/* Right: DNA Sidebar */}
          <div className="space-y-6 p-5 rounded-xl border border-gold/20 bg-secondary/30">
            <GiftDNARadar
              dna={dna}
              recipientName={name || 'Unknown'}
              occasion={occasion}
              budget={budget}
              deliveryDate={deliveryDate}
            />
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
