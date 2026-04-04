import { AlchemyScore } from '@/types';

interface Props {
  scores: AlchemyScore;
  expanded: boolean;
}

const labels: { key: keyof AlchemyScore; label: string }[] = [
  { key: 'personalityMatch', label: 'Personality Match' },
  { key: 'uniqueness', label: 'Uniqueness' },
  { key: 'budgetFit', label: 'Budget Fit' },
  { key: 'surpriseFactor', label: 'Surprise Factor' },
];

const AlchemyScoreBreakdown = ({ scores, expanded }: Props) => {
  if (!expanded) return null;

  return (
    <div className="space-y-2 pt-3 border-t border-gold/20 card-appear">
      {labels.map(({ key, label }, i) => (
        <div key={key} className="space-y-1">
          <div className="flex justify-between text-xs font-crimson">
            <span className="text-card-foreground/70">{label}</span>
            <span className="text-card-foreground/90 font-medium">{scores[key]}%</span>
          </div>
          <div className="h-1.5 bg-card-foreground/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold rounded-full transition-all duration-600 ease-out"
              style={{
                width: expanded ? `${scores[key]}%` : '0%',
                transitionDelay: `${i * 0.1}s`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlchemyScoreBreakdown;
