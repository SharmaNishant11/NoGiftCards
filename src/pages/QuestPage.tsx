import { useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { mockGifts, mockMapNodes, mockRecipient } from '@/data/mockData';
import { CartItem, GiftCard, Discovery, MapNode } from '@/types';
import { useQuestPolling } from '@/hooks/useQuestPolling';
import AdventureMap from '@/components/AdventureMap';
import AgentThoughtStream from '@/components/AgentThoughtStream';

import RedirectBar from '@/components/RedirectBar';
import DiscoveryCard from '@/components/DiscoveryCard';
import GiftBattle from '@/components/GiftBattle';
import QuestCart from '@/components/QuestCart';
import EmptyState from '@/components/EmptyState';
import SkeletonCard from '@/components/SkeletonCard';
import { toast } from 'sonner';

function discoveryToGiftCard(d: Discovery): GiftCard {
  return {
    id: d.id, name: d.name, emoji: d.emoji, source: d.site,
    price: `$${d.price.toFixed(2)}`, priceValue: d.price,
    matchPercent: Math.round(d.alchemy_score),
    reason: d.why_text, url: d.url,
    scores: d.sub_scores || { personalityMatch: 80, uniqueness: 70, budgetFit: 80, surpriseFactor: 70 },
  };
}

const QuestPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sharedQuestId = searchParams.get('id');

  const profile = useMemo(() => {
    const stored = sessionStorage.getItem('questProfile');
    return stored ? JSON.parse(stored) : mockRecipient;
  }, []);

  const questId = useMemo(() => {
    return sharedQuestId || sessionStorage.getItem('questId') || null;
  }, [sharedQuestId]);

  const liveUrl = useMemo(() => {
    return sessionStorage.getItem('questLiveUrl') || null;
  }, []);

  const isSharedView = !!sharedQuestId;
  const isMockMode = !questId || questId === 'mock';

  const { status, discoveries, mapNodes: realMapNodes, thoughts, loading: questLoading, error: questError, redirect } = useQuestPolling(
    isMockMode ? null : questId
  );

  const realGifts = useMemo(() => discoveries.map(discoveryToGiftCard), [discoveries]);

  const gifts = isMockMode ? mockGifts : realGifts;
  const currentMapNodes = isMockMode ? mockMapNodes : realMapNodes;
  const isLoading = isMockMode ? false : (questLoading && gifts.length === 0);
  const questComplete = isMockMode ? true : status?.status === 'complete';

  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastRedirect, setLastRedirect] = useState<string | null>(null);
  const [showLiveBrowser, setShowLiveBrowser] = useState(false);

  const cartIds = new Set(cart.map(c => c.gift.id));

  const toggleSave = (id: string) => {
    setSavedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
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
    if (!isMockMode) redirect(msg);
    setLastRedirect(`Pivoting: ${msg}`);
  };

  const shareQuest = () => {
    if (!questId || isMockMode) return;
    const shareUrl = `${window.location.origin}/quest?id=${questId}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('🔗 Quest link copied! Share it with anyone.');
  };

  return (
    <div className="min-h-screen p-4 page-enter">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isSharedView && (
              <button onClick={() => navigate('/profile')} className="text-gold/50 hover:text-gold transition-colors font-cinzel text-sm">← Profile</button>
            )}
            <h1 className="font-cinzel text-xl text-gold">Quest Dashboard</h1>
            {!isMockMode && status?.status === 'running' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-cinzel bg-gold/20 text-gold border border-gold/30 gold-pulse">LIVE</span>
            )}
            {questComplete && !isMockMode && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-cinzel bg-emerald-900/30 text-emerald-300 border border-emerald-500/30">COMPLETE</span>
            )}
            {isMockMode && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-cinzel bg-secondary text-muted-foreground border border-gold/10">DEMO</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isMockMode && (
              <button onClick={shareQuest} className="btn-alchemy px-3 py-1.5 rounded-md text-xs">
                📤 Share Quest
              </button>
            )}
            {liveUrl && !isSharedView && (
              <button onClick={() => setShowLiveBrowser(!showLiveBrowser)} className="btn-alchemy px-3 py-1.5 rounded-md text-xs">
                {showLiveBrowser ? '🔍 Hide' : '🔍 Watch'} Live Browser
              </button>
            )}
          </div>
        </div>

        {/* Live Browser Embed */}
        {showLiveBrowser && liveUrl && (
          <div className="rounded-xl border border-gold/30 overflow-hidden card-appear" style={{ height: '400px' }}>
            <iframe src={liveUrl} className="w-full h-full" title="Live Agent Browser" allow="autoplay" />
          </div>
        )}

        {/* Adventure Map */}
        <div className="p-4 rounded-xl border border-gold/20 bg-secondary/20">
          <AdventureMap nodes={currentMapNodes} recipientName={profile.name} occasion={profile.occasion} budget={profile.budget} />
        </div>

        {/* Three columns */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr,300px] gap-6">
          {/* Left: Agent Intelligence */}
          <div className="space-y-4">
            <AgentThoughtStream extraLines={isMockMode ? [] : thoughts} />
            
            {!isSharedView && <RedirectBar onRedirect={handleRedirect} lastRedirect={lastRedirect} />}
          </div>

          {/* Center: Discoveries */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-cinzel text-sm text-gold tracking-wider">🔍 Discoveries</h3>
              {gifts.length > 0 && (
                <span className="text-xs font-crimson text-muted-foreground">{gifts.length} gifts found</span>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
                <p className="text-center font-crimson italic text-muted-foreground text-sm card-appear">⚗️ The agents are hunting...</p>
              </div>
            ) : gifts.length === 0 ? (
              <EmptyState emoji="⚗️" message={isMockMode ? "Complete the profile to begin your quest" : "Waiting for discoveries..."} />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gifts.map((gift, i) => (
                    <DiscoveryCard
                      key={gift.id} gift={gift} index={i}
                      isSaved={savedIds.has(gift.id)} isInCart={cartIds.has(gift.id)}
                      onSave={() => toggleSave(gift.id)} onAddToCart={() => addToCart(gift)}
                    />
                  ))}
                </div>
                {gifts.length >= 4 && <GiftBattle giftA={gifts[0]} giftB={gifts[1]} onCrown={() => {}} />}
              </>
            )}

            {/* Loading more indicator when quest is running but we already have some */}
            {!isMockMode && status?.status === 'running' && gifts.length > 0 && (
              <p className="text-center font-crimson italic text-muted-foreground text-sm gold-pulse">
                ⚗️ Still hunting for more gifts...
              </p>
            )}
          </div>

          {/* Right: Cart + Buy Links */}
          {!isSharedView ? (
            <div className="space-y-6">
              <QuestCart
                items={cart}
                onRemove={removeFromCart}
                onCheckout={() => {
                  sessionStorage.setItem('selectedGifts', JSON.stringify(cart.map(c => c.gift)));
                  sessionStorage.setItem('orderData', JSON.stringify({
                    orderNumber: `ALC-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
                    recipientName: profile.name,
                    giftName: cart.length === 1 ? cart[0].gift.name : `${cart.length} gifts`,
                    deliveryDate: profile.deliveryDate,
                    questId: questId,
                    gifts: cart.map(c => ({ name: c.gift.name, url: c.gift.url, price: c.gift.price, emoji: c.gift.emoji, source: c.gift.source })),
                  }));
                  navigate('/confirmation');
                }}
              />
            </div>
          ) : (
            <div className="space-y-4 p-4 rounded-xl border border-gold/20 bg-secondary/20">
              <h3 className="font-cinzel text-sm text-gold">👀 Viewing Shared Quest</h3>
              <p className="font-crimson text-xs text-muted-foreground">This quest was shared with you. Start your own quest to add gifts to cart!</p>
              <button onClick={() => navigate('/profile')} className="btn-alchemy w-full py-2 rounded-lg font-cinzel text-xs">
                🔮 Start Your Own Quest
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestPage;
