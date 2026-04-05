import { CartItem } from '@/types';
import EmptyState from './EmptyState';

interface QuestCartProps {
  items: CartItem[];
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

const QuestCart = ({ items, onRemove, onCheckout }: QuestCartProps) => {
  const subtotal = items.reduce((sum, item) => sum + item.gift.priceValue, 0);

  if (items.length === 0) {
    return <EmptyState emoji="🛒" message="Nothing here yet. Go add some gifts before we judge you." />;
  }

  return (
    <div className="space-y-4">
      <h4 className="font-cinzel text-sm text-gold tracking-wider">🛒 The Haul</h4>

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.gift.id} className="flex items-center justify-between py-2 border-b border-gold/10">
            <div className="flex items-center gap-2">
              <span>{item.gift.emoji}</span>
              <div>
                <span className="font-crimson text-sm text-foreground">{item.gift.name}</span>
                <span className="text-[10px] text-muted-foreground ml-1">({item.gift.source})</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-cinzel text-sm text-gold">{item.gift.price}</span>
              <button onClick={() => onRemove(item.gift.id)} className="text-muted-foreground hover:text-destructive transition-colors text-sm">×</button>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="border-t border-gold/20 pt-3 space-y-1 text-sm font-crimson">
        <div className="flex justify-between text-gold font-cinzel text-lg pt-1">
          <span>Estimated Total</span><span>${subtotal.toFixed(2)}</span>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Prices may vary. You'll buy directly from each store.
        </p>
      </div>

      <button onClick={onCheckout} className="btn-alchemy w-full py-3 rounded-lg font-cinzel text-sm tracking-wider gold-pulse">
        💳 Take My Money →
      </button>
    </div>
  );
};

export default QuestCart;
