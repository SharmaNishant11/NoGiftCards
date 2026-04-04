import { VaultPerson } from '@/types';

interface GifterVaultProps {
  people: VaultPerson[];
  onSelect: (person: VaultPerson) => void;
  onAdd: () => void;
}

const GifterVault = ({ people, onSelect, onAdd }: GifterVaultProps) => (
  <div className="space-y-3">
    <h4 className="font-cinzel text-sm text-gold tracking-wider">🔮 Your People</h4>
    {people.length === 0 ? (
      <p className="font-crimson italic text-muted-foreground text-sm">
        🔮 No adventurers saved yet. Complete a quest to add someone.
      </p>
    ) : (
      <div className="flex flex-wrap gap-2">
        {people.map(p => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className="chip-alchemy text-sm hover:border-gold"
          >
            {p.name} {p.emoji}
          </button>
        ))}
      </div>
    )}
    <button
      onClick={onAdd}
      className="text-sm font-crimson text-gold/70 hover:text-gold transition-colors"
    >
      + Add New Person
    </button>
    <p className="text-xs font-crimson italic text-muted-foreground">
      So next time, the agent already knows them.
    </p>
  </div>
);

export default GifterVault;
