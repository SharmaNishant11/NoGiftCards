import { personalityTraits, quirkTraits, hobbyTraits } from '@/data/mockData';

interface ProfileTagCloudProps {
  selectedIds: string[];
}

const allTraits = [...personalityTraits, ...quirkTraits, ...hobbyTraits];

const ProfileTagCloud = ({ selectedIds }: ProfileTagCloudProps) => {
  const selected = allTraits.filter(t => selectedIds.includes(t.id));

  if (selected.length === 0) {
    return (
      <p className="text-sm text-muted-foreground font-crimson italic">
        Select traits to build the Gift DNA...
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {selected.map((trait, i) => (
        <span
          key={trait.id}
          className="px-3 py-1 rounded-full text-sm font-crimson border border-gold/60 bg-gold/10 text-gold-light card-appear"
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          {trait.emoji} {trait.label}
        </span>
      ))}
    </div>
  );
};

export default ProfileTagCloud;
