import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockGifts, mockMapNodes, mockVault, mockRecipient } from '@/data/mockData';
import { CartItem, GiftCard, VaultPerson } from '@/types';
import AdventureMap from '@/components/AdventureMap';
import AgentThoughtStream from '@/components/AgentThoughtStream';
import NarratorBox from '@/components/NarratorBox';
import RedirectBar from '@/components/RedirectBar';
import DiscoveryCard from '@/components/DiscoveryCard';
import GiftBattle from '@/components/GiftBattle';
import QuestCart from '@/components/QuestCart';
import CheckoutPortal from '@/components/CheckoutPortal';
import GifterVault from '@/components/GifterVault';
import EmptyState from '@/components/EmptyState';
import SkeletonCard from '@/components/SkeletonCard';

const QuestPage = () => {
  const navigate = useNavigate();

  // Load profile from session or use mock
  const profile = useMemo(() => {
    const stored = sessionStorage.getItem('questProfile');
    return stored ? JSON.parse(stored) : mockRecipient;
  }, []);

  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [extraThoughts, setExtraThoughts] = useState<string[]>([]);
  const [lastRedirect, setLastRedirect] = useState<string | null>(null);
  const [vault, setVault] = useState<VaultPerson[]>(mockVault);
  const [loading, setLoading] = useState(false);

  const cartIds = new Set(cart.map(c => c.gift.id));

  const toggleSave = (id: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addToCart = (gift: GiftCard) => {
    if (cartIds.has(gift.id)) {
      setCart(prev => prev.filter(c => c.gift.id !== gift.id));
    } else {
      setCart(prev => [...prev, { gift, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(c => c.gift.id !== id));
  };

  const handleRedirect = (msg: string) => {
    setExtraThoughts(prev => [...prev, `> Redirecting: ${msg}...`]);
    setLastRedirect(`Pivoting: ${msg}`);
  };

  const handleCheckoutComplete = (orderNumber: string) => {
    sessionStorage.setItem('orderData', JSON.stringify({
      orderNumber,
      recipientName: profile.name,
      giftName: cart[0]?.gift.name || 'Gift Bundle',
      deliveryDate: profile.deliveryDate,
      totalPaid: cart.reduce((s, c) => s + c.gift.priceValue, 0) + 4.99,
    }));
    navigate('/confirmation');
  };

  return (
    <div className="min-h-screen p-4 page-enter">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/profile')} className="text-gold/50 hover:text-gold transition-colors font-cinzel text-sm">← Profile</button>
          <h1 className="font-cinzel text-xl text-gold">Quest Dashboard</h1>
        </div>

        {/* Adventure Map */}
        <div className="p-4 rounded-xl border border-gold/20 bg-secondary/20">
          <AdventureMap
            nodes={mockMapNodes}
            recipientName={profile.name}
            occasion={profile.occasion}
            budget={profile.budget}
          />
        </div>

        {/* Three columns */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr,300px] gap-6">
          {/* Left: Agent Intelligence */}
          <div className="space-y-4">
            <AgentThoughtStream extraLines={extraThoughts} />
            <NarratorBox />
            <RedirectBar onRedirect={handleRedirect} lastRedirect={lastRedirect} />
          </div>

          {/* Center: Discoveries */}
          <div className="space-y-6">
            <h3 className="font-cinzel text-sm text-gold tracking-wider">🔍 Discoveries</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              ) : (
                mockGifts.map((gift, i) => (
                  <DiscoveryCard
                    key={gift.id}
                    gift={gift}
                    index={i}
                    isSaved={savedIds.has(gift.id)}
                    isInCart={cartIds.has(gift.id)}
                    onSave={() => toggleSave(gift.id)}
                    onAddToCart={() => addToCart(gift)}
                  />
                ))
              )}
            </div>

            {/* Gift Battle */}
            {mockGifts.length >= 4 && (
              <GiftBattle
                giftA={mockGifts[0]}
                giftB={mockGifts[1]}
                onCrown={() => {}}
              />
            )}
          </div>

          {/* Right: Commerce */}
          <div className="space-y-6">
            {showCheckout ? (
              <CheckoutPortal
                items={cart}
                recipientName={profile.name}
                deliveryDate={profile.deliveryDate}
                onComplete={handleCheckoutComplete}
              />
            ) : (
              <QuestCart
                items={cart}
                onRemove={removeFromCart}
                onCheckout={() => setShowCheckout(true)}
              />
            )}

            <div className="border-t border-gold/10 pt-4">
              <GifterVault
                people={vault}
                onSelect={() => navigate('/profile')}
                onAdd={() => navigate('/profile')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestPage;
