import { useState } from 'react';
import { GiftCard } from '@/types';

interface GiftBattleProps {
  giftA: GiftCard;
  giftB: GiftCard;
  onCrown: (winner: GiftCard) => void;
}

const GiftBattle = ({ giftA, giftB, onCrown }: GiftBattleProps) => {
  const [winner, setWinner] = useState<string | null>(null);

  const handleCrown = (gift: GiftCard) => {
    setWinner(gift.id);
    setTimeout(() => onCrown(gift), 800);
  };

  return (
    <div className="space-y-3">
      <h4 className="font-cinzel text-sm text-gold text-center tracking-wider">⚔️ THUNDERDOME: Two Gifts Enter, One Gift Leaves</h4>
      <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-center">
        {/* Gift A */}
        <div className={`parchment-card rounded-lg p-3 text-center transition-all duration-400 ${
          winner === giftB.id ? 'opacity-40 scale-95' : ''
        } ${winner === giftA.id ? 'ring-2 ring-gold shadow-lg' : ''}`}>
          <span className="text-3xl">{giftA.emoji}</span>
          <p className="font-cinzel text-xs text-card-foreground mt-1">{giftA.name}</p>
          <p className="text-gold-dark font-cinzel text-sm mt-1">{giftA.price}</p>
          {winner === giftA.id && <span className="text-lg">👑</span>}
          {winner === giftB.id && <span className="text-xs font-crimson italic text-card-foreground/50">sent home crying</span>}
          {!winner && (
            <button onClick={() => handleCrown(giftA)} className="btn-alchemy text-[10px] px-3 py-1 rounded mt-2">
              Crown this gift 👑
            </button>
          )}
        </div>

        {/* VS */}
        <div className="text-gold text-2xl font-cinzel gold-pulse">⚡</div>

        {/* Gift B */}
        <div className={`parchment-card rounded-lg p-3 text-center transition-all duration-400 ${
          winner === giftA.id ? 'opacity-40 scale-95' : ''
        } ${winner === giftB.id ? 'ring-2 ring-gold shadow-lg' : ''}`}>
          <span className="text-3xl">{giftB.emoji}</span>
          <p className="font-cinzel text-xs text-card-foreground mt-1">{giftB.name}</p>
          <p className="text-gold-dark font-cinzel text-sm mt-1">{giftB.price}</p>
          {winner === giftB.id && <span className="text-lg">👑</span>}
          {winner === giftA.id && <span className="text-xs font-crimson italic text-card-foreground/50">sent home crying</span>}
          {!winner && (
            <button onClick={() => handleCrown(giftB)} className="btn-alchemy text-[10px] px-3 py-1 rounded mt-2">
              Crown this gift 👑
            </button>
          )}
        </div>
      </div>
      {winner && (
        <p className="text-xs font-crimson italic text-muted-foreground text-center card-appear">
          Noted. We're updating your permanent file.
        </p>
      )}
    </div>
  );
};

export default GiftBattle;
