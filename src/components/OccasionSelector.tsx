import { occasions } from '@/data/mockData';

interface OccasionSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
}

const OccasionSelector = ({ selected, onSelect }: OccasionSelectorProps) => (
  <div className="space-y-3">
    <label className="font-cinzel text-sm text-gold tracking-wider">Occasion</label>
    <div className="flex flex-wrap gap-2">
      {occasions.map(o => (
        <button
          key={o.id}
          onClick={() => onSelect(o.id)}
          className={`chip-alchemy text-sm ${selected === o.id ? 'selected' : ''}`}
        >
          {o.emoji} {o.label}
        </button>
      ))}
    </div>
  </div>
);

export default OccasionSelector;
