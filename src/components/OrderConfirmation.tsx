interface OrderConfirmationProps {
  orderNumber: string;
  recipientName: string;
  giftName: string;
  deliveryDate: string;
  totalPaid: number;
  onNewQuest: () => void;
}

const steps = ['Order Placed', 'Processing', 'Dispatched', 'Delivered'];

const OrderConfirmation = ({ orderNumber, recipientName, giftName, deliveryDate, totalPaid, onNewQuest }: OrderConfirmationProps) => {
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 page-enter">
      <div className="max-w-lg w-full space-y-8 text-center">
        {/* Animated icon */}
        <div className="text-7xl gold-pulse" style={{ animation: 'goldPulse 1.5s ease-in-out infinite, countPulse 0.6s ease 0.2s' }}>
          ⚗️
        </div>

        <h1 className="font-cinzel text-3xl text-gold">Quest Complete, Brave Gifter!</h1>

        {/* Order card */}
        <div className="parchment-card rounded-xl p-6 space-y-3 text-left">
          <div className="grid grid-cols-2 gap-3 text-sm font-crimson">
            <div>
              <span className="text-card-foreground/50">Gift</span>
              <p className="text-card-foreground font-medium">{giftName}</p>
            </div>
            <div>
              <span className="text-card-foreground/50">Recipient</span>
              <p className="text-card-foreground font-medium">{recipientName}</p>
            </div>
            <div>
              <span className="text-card-foreground/50">Delivery Date</span>
              <p className="text-card-foreground font-medium">{deliveryDate}</p>
            </div>
            <div>
              <span className="text-card-foreground/50">Order #</span>
              <p className="text-card-foreground font-medium font-mono text-xs">{orderNumber}</p>
            </div>
          </div>
          <div className="border-t border-gold/20 pt-3">
            <div className="flex justify-between font-cinzel">
              <span className="text-card-foreground/70 text-sm">Total Paid</span>
              <span className="text-gold-dark text-lg">${totalPaid.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <p className="font-crimson italic text-muted-foreground">
          Your gift is being dispatched from the realm...
        </p>

        {/* Timeline */}
        <div className="flex items-center justify-between px-4">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-cinzel ${
                  i === 0 ? 'bg-gold text-navy' : 'bg-secondary text-muted-foreground border border-gold/20'
                }`}>
                  {i === 0 ? '✓' : i + 1}
                </div>
                <span className="text-[10px] font-crimson text-muted-foreground">{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-px mx-1 ${i === 0 ? 'bg-gold' : 'border-t border-dashed border-gold/20'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button onClick={onNewQuest} className="btn-alchemy py-3 rounded-lg font-cinzel text-sm tracking-wider w-full">
            🔮 Start a New Quest
          </button>
          <button onClick={handleShare} className="btn-alchemy py-2.5 rounded-lg font-cinzel text-xs tracking-wider w-full opacity-80">
            📤 Share this Quest
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
