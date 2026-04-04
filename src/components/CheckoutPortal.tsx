import { useState } from 'react';
import { CartItem } from '@/types';

interface CheckoutPortalProps {
  items: CartItem[];
  recipientName: string;
  deliveryDate: string;
  onComplete: (orderNumber: string) => void;
}

const CheckoutPortal = ({ items, recipientName, deliveryDate, onComplete }: CheckoutPortalProps) => {
  const [address, setAddress] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const total = items.reduce((s, i) => s + i.gift.priceValue, 0) + 4.99;

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      const orderNum = `ALC-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      onComplete(orderNum);
    }, 1500);
  };

  const inputClass = "w-full bg-input border border-gold/30 rounded-md px-3 py-2 text-sm font-crimson text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all";

  return (
    <div className="space-y-5 card-appear">
      <h4 className="font-cinzel text-sm text-gold tracking-wider">💳 Checkout Portal</h4>

      {/* Order summary */}
      <div className="p-3 rounded-lg bg-secondary/50 border border-gold/10 space-y-1">
        <p className="text-xs font-cinzel text-muted-foreground">Order Summary</p>
        {items.map(i => (
          <div key={i.gift.id} className="flex justify-between text-xs font-crimson text-foreground">
            <span>{i.gift.emoji} {i.gift.name}</span>
            <span className="text-gold">{i.gift.price}</span>
          </div>
        ))}
        <div className="border-t border-gold/10 pt-1 flex justify-between text-sm font-cinzel text-gold">
          <span>Total</span><span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Delivery */}
      <div className="space-y-3">
        <p className="text-xs font-cinzel text-muted-foreground tracking-wider">Delivery Details</p>
        <input value={recipientName} readOnly className={inputClass + ' opacity-70'} />
        <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Delivery address" className={inputClass} />
        <input value={deliveryDate} readOnly className={inputClass + ' opacity-70'} />
      </div>

      {/* Payment */}
      <div className="space-y-3">
        <p className="text-xs font-cinzel text-muted-foreground tracking-wider">Payment</p>
        <input value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="Card number" className={inputClass} />
        <div className="grid grid-cols-2 gap-3">
          <input value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="MM/YY" className={inputClass} />
          <input value={cvv} onChange={e => setCvv(e.target.value)} placeholder="CVV" className={inputClass} />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground font-crimson">
        🔒 Secured by <span className="font-cinzel tracking-wider">Stripe</span>
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="btn-alchemy w-full py-3 rounded-lg font-cinzel text-sm tracking-wider"
      >
        {submitting ? (
          <span className="gold-pulse">⚗️ Forging your order...</span>
        ) : (
          'Complete Quest & Send Gift →'
        )}
      </button>
    </div>
  );
};

export default CheckoutPortal;
