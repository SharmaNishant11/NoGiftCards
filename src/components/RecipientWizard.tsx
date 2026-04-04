import { useState } from 'react';
import { WizardStep, Trait } from '@/types';
import { personalityTraits, quirkTraits, hobbyTraits } from '@/data/mockData';
import PotionProgress from './PotionProgress';
import OccasionSelector from './OccasionSelector';
import BudgetSlider from './BudgetSlider';
import DeliveryDatePicker from './DeliveryDatePicker';

interface RecipientWizardProps {
  onComplete: (data: {
    name: string;
    personalities: string[];
    quirks: string[];
    hobbies: string[];
    notes: string;
    budget: number;
    occasion: string;
    deliveryDate: string;
  }) => void;
  onStepChange: (step: WizardStep) => void;
  onTraitToggle: (id: string) => void;
  selectedTraits: string[];
}

const ChipGrid = ({ traits, selected, onToggle }: { traits: Trait[]; selected: string[]; onToggle: (id: string) => void }) => (
  <div className="flex flex-wrap gap-2">
    {traits.map(t => (
      <button
        key={t.id}
        onClick={() => onToggle(t.id)}
        className={`chip-alchemy text-sm ${selected.includes(t.id) ? 'selected' : ''}`}
      >
        {t.emoji} {t.label}
      </button>
    ))}
  </div>
);

const RecipientWizard = ({ onComplete, onStepChange, onTraitToggle, selectedTraits }: RecipientWizardProps) => {
  const [step, setStep] = useState<WizardStep>(1);
  const [personalities, setPersonalities] = useState<string[]>([]);
  const [quirks, setQuirks] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [budget, setBudget] = useState(50);
  const [occasion, setOccasion] = useState('');
  const [name, setName] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [pulsing, setPulsing] = useState(false);

  const goTo = (s: WizardStep) => {
    setStep(s);
    onStepChange(s);
  };

  const toggleTrait = (list: string[], setList: (v: string[]) => void, id: string) => {
    const next = list.includes(id) ? list.filter(x => x !== id) : [...list, id];
    setList(next);
    onTraitToggle(id);
  };

  const canComplete = step === 4 && name.trim() && occasion;

  const handleComplete = () => {
    setPulsing(true);
    setTimeout(() => {
      onComplete({ name, personalities, quirks, hobbies, notes, budget, occasion, deliveryDate });
    }, 600);
  };

  const stepTitles: Record<WizardStep, string> = {
    1: 'Who walks this realm?',
    2: 'What quirk defines them?',
    3: 'What ritual consumes their free time?',
    4: 'Final secrets for the agent',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-6">
        <PotionProgress currentStep={step} />
        <div className="flex-1 space-y-6">
          <h2 className="font-cinzel text-xl text-gold">{stepTitles[step]}</h2>

          <div className="page-enter" key={step}>
            {step === 1 && (
              <ChipGrid traits={personalityTraits} selected={personalities} onToggle={id => toggleTrait(personalities, setPersonalities, id)} />
            )}
            {step === 2 && (
              <ChipGrid traits={quirkTraits} selected={quirks} onToggle={id => toggleTrait(quirks, setQuirks, id)} />
            )}
            {step === 3 && (
              <ChipGrid traits={hobbyTraits} selected={hobbies} onToggle={id => toggleTrait(hobbies, setHobbies, id)} />
            )}
            {step === 4 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="font-cinzel text-sm text-gold tracking-wider">What do you call them?</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Their name or nickname"
                    className="w-full bg-input border border-gold/30 rounded-md px-3 py-2 text-foreground font-crimson placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all"
                  />
                </div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="They already have an Aeropress. Hates anything with glitter. Obsessed with true crime aesthetic..."
                  className="w-full bg-input border border-gold/20 rounded-md p-3 text-sm font-crimson text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold h-24 resize-none transition-all"
                />
                <BudgetSlider value={budget} onChange={setBudget} />
                <OccasionSelector selected={occasion} onSelect={setOccasion} />
                <DeliveryDatePicker value={deliveryDate} onChange={setDeliveryDate} />
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={() => goTo((step - 1) as WizardStep)}
                className="btn-alchemy px-6 py-2.5 rounded-lg text-sm"
              >
                ← Back
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={() => goTo((step + 1) as WizardStep)}
                className="btn-alchemy px-6 py-2.5 rounded-lg text-sm"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!canComplete}
                className={`btn-alchemy px-8 py-3 rounded-lg text-sm tracking-wider ${
                  pulsing ? 'gold-pulse scale-105' : ''
                }`}
              >
                ⚗️ Seal the Profile & Launch Quest
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipientWizard;
