import { useState } from 'react';
import { CartItem } from '@/types';
import EmptyState from './EmptyState';

interface QuestCartProps {
  items: CartItem[];
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

const QuestCart = ({ items, onRemove, onCheckout }: QuestCartProps) => {
  const [giftWrap, setGiftWrap] = useState(false);
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.gift.priceValue, 0);
  const wrapCost = giftWrap ? 5 : 0;
  const discount = promoApplied ? Math.round((subtotal + wrapCost) * 0.2) : 0;
  const shipping = subtotal > 0 ? 4.99 : 0;
  const total = subtotal + wrapCost - discount + shipping;

  const applyPromo = () => {
    if (promoCode.toUpperCase() === 'ALCHEMY20') {
      setPromoApplied(true);
      setPromoError(false);
    } else {
      setPromoError(true);
      setPromoApplied(false);
    }
  };

  if (items.length === 0) {
    return <EmptyState emoji="🛒" message="Your cauldron is empty. Add gifts from your discoveries." />;
  }

  return (
    <div className="space-y-4">
      <h4 className="font-cinzel text-sm text-gold tracking-wider">🛒 Quest Cart</h4>

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.gift.id} className="flex items-center justify-between py-2 border-b border-gold/10">
            <div className="flex items-center gap-2">
              <span>{item.gift.emoji}</span>
              <span className="font-crimson text-sm text-foreground">{item.gift.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-cinzel text-sm text-gold">{item.gift.price}</span>
              <button onClick={() => onRemove(item.gift.id)} className="text-muted-foreground hover:text-destructive transition-colors text-sm">×</button>
            </div>
          </div>
        ))}
      </div>

      {/* Gift wrap */}
      <button
        onClick={() => setGiftWrap(!giftWrap)}
        className={`flex items-center gap-2 text-sm font-crimson transition-colors ${giftWrap ? 'text-gold' : 'text-muted-foreground hover:text-foreground'}`}
      >
        <span className={`w-4 h-4 rounded border transition-all ${giftWrap ? 'bg-gold border-gold' : 'border-gold/30'}`} />
        🎁 Add Gift Wrapping (+$5) {giftWrap && '🎀'}
      </button>

      {/* Note */}
      <button onClick={() => setShowNote(!showNote)} className="text-sm font-crimson text-muted-foreground hover:text-foreground transition-colors">
        📝 {showNote ? 'Hide' : 'Add'} Personal Note
      </button>
      {showNote && (
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Write a heartfelt message..."
          className="w-full bg-input border border-gold/20 rounded-md p-3 text-sm font-crimson text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold h-20 resize-none transition-all card-appear"
        />
      )}

      {/* Promo */}
      <div className="flex gap-2">
        <input
          value={promoCode}
          onChange={e => { setPromoCode(e.target.value); setPromoError(false); }}
          placeholder="Promo code"
          className="flex-1 bg-input border border-gold/20 rounded-md px-3 py-2 text-sm font-crimson text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold transition-all"
        />
        <button onClick={applyPromo} className="btn-alchemy px-3 py-2 rounded-md text-xs">
          Apply Charm
        </button>
      </div>
      {promoApplied && <p className="text-xs font-crimson text-emerald-400 card-appear">✨ ALCHEMY20 applied — 20% off!</p>}
      {promoError && <p className="text-xs font-crimson text-destructive card-appear">Invalid charm code</p>}

      {/* Totals */}
      <div className="border-t border-gold/20 pt-3 space-y-1 text-sm font-crimson">
        <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
        {giftWrap && <div className="flex justify-between text-muted-foreground"><span>Gift Wrapping</span><span>$5.00</span></div>}
        {promoApplied && <div className="flex justify-between text-emerald-400"><span>Discount (20%)</span><span>-${discount.toFixed(2)}</span></div>}
        <div className="flex justify-between text-muted-foreground"><span>Est. Shipping</span><span>${shipping.toFixed(2)}</span></div>
        <div className="flex justify-between text-gold font-cinzel text-lg pt-2 border-t border-gold/20">
          <span>Total</span><span>${total.toFixed(2)}</span>
        </div>
      </div>

      <button onClick={onCheckout} className="btn-alchemy w-full py-3 rounded-lg font-cinzel text-sm tracking-wider gold-pulse">
        ⚗️ Proceed to Checkout →
      </button>
    </div>
  );
};

export default QuestCart;
