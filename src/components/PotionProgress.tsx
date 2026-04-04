import { WizardStep } from '@/types';

interface PotionProgressProps {
  currentStep: WizardStep;
}

const PotionProgress = ({ currentStep }: PotionProgressProps) => {
  const fillPercent = (currentStep / 4) * 100;

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm font-cinzel text-gold tracking-wider">Quest Progress</span>
      <div className="relative w-12 h-32">
        {/* Vial outline */}
        <div className="absolute inset-0 rounded-b-2xl rounded-t-lg border border-gold/40 overflow-hidden"
          style={{ animation: fillPercent > 50 ? 'potionGlow 2s ease-in-out infinite' : 'none' }}>
          {/* Fill */}
          <div
            className="absolute bottom-0 left-0 right-0 rounded-b-xl transition-all duration-700 ease-out"
            style={{
              height: `${fillPercent}%`,
              background: `linear-gradient(to top, hsl(38 66% 35%), hsl(38 70% 55% / 0.8))`,
              boxShadow: fillPercent > 75 ? '0 0 12px hsl(38 66% 47% / 0.5)' : 'none',
            }}
          />
          {/* Bubbles */}
          {fillPercent > 25 && (
            <>
              <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-gold-light/40" style={{ animation: 'sparkleFloat 3s linear infinite' }} />
              <div className="absolute bottom-4 right-3 w-1 h-1 rounded-full bg-gold-light/30" style={{ animation: 'sparkleFloat 4s linear infinite 1s' }} />
            </>
          )}
        </div>
        {/* Vial neck */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-4 border border-gold/40 rounded-t-md bg-navy-deep" />
      </div>
      <span className="text-xs text-muted-foreground font-crimson">Step {currentStep} of 4</span>
    </div>
  );
};

export default PotionProgress;
