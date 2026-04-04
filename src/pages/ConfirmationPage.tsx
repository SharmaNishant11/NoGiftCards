import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface GiftLink {
  name: string;
  url: string;
  price: string;
  emoji: string;
  source: string;
}

const steps = ['Quest Complete', 'Browse Links', 'Purchase', 'Gift Received'];

const ConfirmationPage = () => {
  const navigate = useNavigate();

  const orderData = useMemo(() => {
    const stored = sessionStorage.getItem('orderData');
    return stored ? JSON.parse(stored) : {
      orderNumber: 'ALC-DEMO1234',
      recipientName: 'Alex',
      giftName: 'Cold Brew Ritual Kit',
      deliveryDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      questId: null,
      gifts: [
        { name: 'Cold Brew Ritual Kit', url: 'https://www.etsy.com/search?q=cold+brew+kit', price: '$42', emoji: '☕', source: 'Etsy' },
      ],
    };
  }, []);

  const gifts: GiftLink[] = orderData.gifts || [];

  const handleShare = () => {
    if (orderData.questId) {
      const shareUrl = `${window.location.origin}/quest?id=${orderData.questId}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success('🔗 Quest link copied!');
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('📋 Link copied!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 page-enter">
      <div className="max-w-lg w-full space-y-8 text-center">
        <div className="text-7xl gold-pulse" style={{ animation: 'goldPulse 1.5s ease-in-out infinite, countPulse 0.6s ease 0.2s' }}>⚗️</div>
        <h1 className="font-cinzel text-3xl text-gold">Quest Complete, Brave Gifter!</h1>
        <p className="font-crimson italic text-muted-foreground">
          Your quest for {orderData.recipientName} has been fulfilled. Here are your curated gift links!
        </p>

        <div className="parchment-card rounded-xl p-6 space-y-4 text-left">
          <h3 className="font-cinzel text-sm text-card-foreground/70 tracking-wider text-center">🎁 Your Curated Gifts</h3>
          <div className="space-y-3">
            {gifts.map((gift, i) => (
              <a key={i} href={gift.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg border border-gold/20 hover:border-gold/50 hover:bg-gold/5 transition-all group">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{gift.emoji}</span>
                  <div>
                    <p className="font-cinzel text-sm text-card-foreground group-hover:text-gold-dark transition-colors">{gift.name}</p>
                    <p className="text-[10px] font-crimson text-card-foreground/50">{gift.source}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-cinzel text-sm text-gold-dark">{gift.price}</span>
                  <span className="text-card-foreground/40 group-hover:text-gold transition-colors">→</span>
                </div>
              </a>
            ))}
          </div>
          <p className="text-[10px] font-crimson italic text-card-foreground/40 text-center">Click each link to buy directly from the store</p>
        </div>

        <div className="flex items-center justify-between px-4">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-cinzel ${
                  i <= 1 ? 'bg-gold text-navy' : 'bg-secondary text-muted-foreground border border-gold/20'
                }`}>{i <= 1 ? '✓' : i + 1}</div>
                <span className="text-[10px] font-crimson text-muted-foreground">{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-px mx-1 ${i < 1 ? 'bg-gold' : 'border-t border-dashed border-gold/20'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={() => navigate('/profile')} className="btn-alchemy py-3 rounded-lg font-cinzel text-sm tracking-wider w-full">
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

export default ConfirmationPage;
