import { useState } from 'react';
import { GiftCard } from '@/types';
import AlchemyScoreBreakdown from './AlchemyScoreBreakdown';

interface DiscoveryCardProps {
  gift: GiftCard;
  index: number;
  isSaved: boolean;
  isInCart: boolean;
  onSave: () => void;
  onAddToCart: () => void;
}

const sourceBadgeColors: Record<string, string> = {
  Etsy: 'bg-orange-900/30 text-orange-300 border-orange-500/30',
  Amazon: 'bg-blue-900/30 text-blue-300 border-blue-500/30',
  Specialty: 'bg-emerald-900/30 text-emerald-300 border-emerald-500/30',
  Niche: 'bg-violet-900/30 text-violet-300 border-violet-500/30',
};

const DiscoveryCard = ({ gift, index, isSaved, isInCart, onSave, onAddToCart }: DiscoveryCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const badgeColor = sourceBadgeColors[gift.source] || 'bg-secondary text-muted-foreground border-gold/20';

  return (
    <div
      className={`parchment-card rounded-lg overflow-hidden card-appear ${
        isSaved ? 'ring-1 ring-gold/50' : ''
      } ${isInCart ? '!bg-navy border-gold/60' : ''}`}
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <span className="px-2 py-0.5 rounded-full text-xs font-cinzel bg-gold/20 text-gold-dark border border-gold/30"
            title={`${gift.matchPercent}% alchemy match`}>
            {gift.matchPercent}%
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] border ${badgeColor}`}>
            {gift.source}
          </span>
        </div>

        {/* Emoji + Name */}
        <div className="flex items-center gap-3">
          <span className="text-4xl">{gift.emoji}</span>
          <div>
            <h4 className={`font-cinzel text-sm ${isInCart ? 'text-foreground' : 'text-card-foreground'}`}>
              {gift.name}
            </h4>
            <p className={`font-crimson italic text-xs ${isInCart ? 'text-foreground/70' : 'text-card-foreground/60'}`}>
              {gift.reason}
            </p>
          </div>
        </div>

        {/* Price */}
        <div className={`font-cinzel text-lg ${isInCart ? 'text-gold' : 'text-gold-dark'}`}>
          {gift.price}
        </div>

        {/* Score breakdown toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`text-xs font-crimson ${isInCart ? 'text-gold/70' : 'text-card-foreground/50'} hover:text-gold transition-colors`}
        >
          🔬 {expanded ? 'Hide' : 'Show'} Why We Think This Slaps
        </button>

        <AlchemyScoreBreakdown scores={gift.scores} expanded={expanded} />

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onSave}
            className={`text-xs font-crimson px-3 py-1.5 rounded-md border transition-all duration-250 ${
              isSaved
                ? 'border-gold bg-gold/10 text-gold'
                : isInCart
                  ? 'border-gold/30 text-foreground/70 hover:border-gold hover:text-gold'
                  : 'border-card-foreground/20 text-card-foreground/60 hover:border-gold hover:text-gold-dark'
            }`}
          >
            {isSaved ? '♥ Saved' : '♡ Save'}
          </button>
          <button
            onClick={onAddToCart}
            className={`text-xs font-crimson px-3 py-1.5 rounded-md border transition-all duration-250 ${
              isInCart
                ? 'bg-secondary border-gold/50 text-gold'
                : 'border-card-foreground/20 text-card-foreground/60 hover:border-gold hover:text-gold-dark'
            }`}
          >
            {isInCart ? '✓ In Cart' : '🛒 Add to Cart'}
          </button>
          {gift.url && gift.url !== '#' && (
            <a
              href={gift.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-crimson px-3 py-1.5 rounded-md border border-card-foreground/20 text-card-foreground/60 hover:border-gold hover:text-gold-dark transition-all duration-250"
            >
              View →
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscoveryCard;
