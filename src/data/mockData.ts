import { Trait, GiftCard, VaultPerson, MapNode, RecipientProfile, GiftDNA } from '@/types';

export const personalityTraits: Trait[] = [
  { id: 'coffee', emoji: '☕', label: 'Coffee Snob' },
  { id: 'bookworm', emoji: '📚', label: 'Bookworm' },
  { id: 'adventurer', emoji: '🏕️', label: 'Adventurer' },
  { id: 'chef', emoji: '🍳', label: 'Home Chef' },
  { id: 'tech', emoji: '🖥️', label: 'Tech Nerd' },
  { id: 'nightowl', emoji: '🦉', label: 'Night Owl' },
  { id: 'creative', emoji: '🎨', label: 'Creative' },
  { id: 'gamer', emoji: '🎮', label: 'Gamer' },
  { id: 'wellness', emoji: '🧘', label: 'Wellness Seeker' },
  { id: 'traveler', emoji: '🌍', label: 'Traveler' },
];

export const quirkTraits: Trait[] = [
  { id: 'mornings', emoji: '🌑', label: 'Hates mornings' },
  { id: 'late', emoji: '⏰', label: 'Always late' },
  { id: 'overthinker', emoji: '🌀', label: 'Overthinker' },
  { id: 'chaotic', emoji: '😂', label: 'Chaotic funny' },
  { id: 'researcher', emoji: '🤓', label: 'Obsessive researcher' },
  { id: 'bougie', emoji: '💸', label: 'Secretly bougie' },
  { id: 'dramatic', emoji: '🎭', label: 'Dramatic' },
  { id: 'introvert', emoji: '🔇', label: 'Introvert' },
];

export const hobbyTraits: Trait[] = [
  { id: 'truecrime', emoji: '🎙️', label: 'True Crime Podcasts' },
  { id: 'binge', emoji: '🎬', label: 'Binge-watching' },
  { id: 'gym', emoji: '🏋️', label: 'Gym obsessed' },
  { id: 'garden', emoji: '🌱', label: 'Gardening' },
  { id: 'wine', emoji: '🍷', label: 'Wine nights' },
  { id: 'shopping', emoji: '📦', label: 'Online shopping' },
  { id: 'music', emoji: '🎵', label: 'Music nerd' },
  { id: 'puzzles', emoji: '🧩', label: 'Puzzles & games' },
];

export const occasions: Trait[] = [
  { id: 'birthday', emoji: '🎂', label: 'Birthday' },
  { id: 'breakup', emoji: '💔', label: 'Breakup Recovery' },
  { id: 'promotion', emoji: '🏆', label: 'Promotion' },
  { id: 'justbecause', emoji: '❤️', label: 'Just Because' },
  { id: 'holiday', emoji: '🎄', label: 'Holiday' },
  { id: 'anniversary', emoji: '💍', label: 'Anniversary' },
];

export const mockRecipient: RecipientProfile = {
  name: 'Alex',
  personalities: ['coffee', 'nightowl'],
  quirks: ['mornings'],
  hobbies: ['truecrime'],
  notes: 'They already have an Aeropress. Hates anything with glitter. Obsessed with true crime aesthetic...',
  budget: 50,
  occasion: 'birthday',
  deliveryDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
};

export const mockDNA: GiftDNA = {
  sentimental: 65,
  practical: 40,
  adventurous: 55,
  luxurious: 30,
  quirky: 85,
};

export const mockGifts: GiftCard[] = [
  {
    id: '1', name: 'Cold Brew Ritual Kit', emoji: '☕', source: 'Etsy',
    price: '$42', priceValue: 42, matchPercent: 98, url: 'https://www.etsy.com/search?q=cold+brew+kit',
    reason: "Perfect for a coffee snob who hates mornings — cold brew ready when they wake up.",
    scores: { personalityMatch: 96, uniqueness: 88, budgetFit: 100, surpriseFactor: 94 },
  },
  {
    id: '2', name: 'True Crime Mug Set', emoji: '🔍', source: 'Specialty',
    price: '$28', priceValue: 28, matchPercent: 94, url: 'https://www.uncommongoods.com/search?q=true+crime+mug',
    reason: "True crime aesthetic meets morning caffeine ritual — mugshots on mugs.",
    scores: { personalityMatch: 98, uniqueness: 82, budgetFit: 100, surpriseFactor: 87 },
  },
  {
    id: '3', name: 'Blackout Coffee Blend', emoji: '🌑', source: 'Amazon',
    price: '$19', priceValue: 19, matchPercent: 91, url: 'https://www.amazon.com/s?k=blackout+coffee+blend',
    reason: "Extra-strong dark roast for someone who battles mornings daily.",
    scores: { personalityMatch: 90, uniqueness: 75, budgetFit: 100, surpriseFactor: 80 },
  },
  {
    id: '4', name: 'Mystery Podcast Subscription', emoji: '🎙️', source: 'Niche',
    price: '$72/yr', priceValue: 72, matchPercent: 89, url: 'https://www.stitcher.com/premium',
    reason: "Premium true crime podcast network — a year of obsession fuel.",
    scores: { personalityMatch: 94, uniqueness: 91, budgetFit: 72, surpriseFactor: 96 },
  },
  {
    id: '5', name: 'Detective Journal + Pen Set', emoji: '🕵️', source: 'Etsy',
    price: '$35', priceValue: 35, matchPercent: 86, url: 'https://www.etsy.com/search?q=detective+journal',
    reason: "Handmade leather journal for their inner detective to take notes.",
    scores: { personalityMatch: 88, uniqueness: 84, budgetFit: 100, surpriseFactor: 78 },
  },
  {
    id: '6', name: 'Pour-Over Constellation Set', emoji: '✨', source: 'Specialty',
    price: '$58', priceValue: 58, matchPercent: 83, url: 'https://www.uncommongoods.com/search?q=pour+over+coffee',
    reason: "Artisan pour-over with star map design — for night owl coffee rituals.",
    scores: { personalityMatch: 85, uniqueness: 90, budgetFit: 88, surpriseFactor: 72 },
  },
  {
    id: '7', name: 'Crime Scene Coaster Set', emoji: '🔪', source: 'Etsy',
    price: '$22', priceValue: 22, matchPercent: 80, url: 'https://www.etsy.com/search?q=crime+scene+coasters',
    reason: "Chalk outline coasters — dark humor for their coffee table.",
    scores: { personalityMatch: 82, uniqueness: 78, budgetFit: 100, surpriseFactor: 70 },
  },
  {
    id: '8', name: 'Morning Grump Candle Bundle', emoji: '🕯️', source: 'Amazon',
    price: '$31', priceValue: 31, matchPercent: 77, url: 'https://www.amazon.com/s?k=morning+grump+candle',
    reason: "Scents designed for people who hate mornings — including 'Don't Talk To Me'.",
    scores: { personalityMatch: 80, uniqueness: 72, budgetFit: 100, surpriseFactor: 68 },
  },
];

export const mockThoughtStream = [
  '> Analyzing: Coffee Snob + Hates Mornings + True Crime...',
  '> Detected pattern: dark humor + caffeine dependency',
  '> Navigating to etsy.com...',
  '> Scanning search results for "cold brew gifts"...',
  '> Found: Cold Brew Ritual Kit — $42 — checking match...',
  '> Embedding similarity: 0.94 — strong match',
  '> Adding to discoveries...',
  '> Moving to Amazon Bazaar...',
  '> Scanning specialty coffee gear...',
  '> Filtering out Aeropress-related items (user exclusion)...',
  '> Found 2 matches in Amazon Bazaar',
  '> Compiling final Alchemy Scores...',
];

export const mockNarration = [
  "The agent ventures into the Etsy Forest, seeking treasures for a caffeine-addicted night owl...",
  "Through winding digital paths, three gleaming artifacts emerge from the artisan stalls...",
  "The quest pivots to the Amazon Bazaar — vast halls of dark roasts and peculiar gadgets...",
  "A specialty shop reveals a constellation-etched pour-over set, glimmering under starlight...",
  "The Alchemy Scores are being forged — each gift weighed against the soul of the recipient...",
];

export const mockVault: VaultPerson[] = [
  { id: '1', name: 'Mom', emoji: '👩' },
  { id: '2', name: 'Best Friend', emoji: '🎮' },
  { id: '3', name: 'Jake from work', emoji: '💻' },
];

export const mockMapNodes: MapNode[] = [
  { id: '1', emoji: '🏰', label: 'Base Camp', status: 'visited' },
  { id: '2', emoji: '🌿', label: 'Etsy Forest', status: 'visited' },
  { id: '3', emoji: '📦', label: 'Amazon Bazaar', status: 'active' },
  { id: '4', emoji: '☕', label: 'Specialty Shops', status: 'queued' },
  { id: '5', emoji: '🎙️', label: 'Niche Stores', status: 'queued' },
  { id: '6', emoji: '⚗️', label: 'Alchemy Score', status: 'queued' },
];
