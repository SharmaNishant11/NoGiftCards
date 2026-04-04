export interface Trait {
  id: string;
  emoji: string;
  label: string;
}

export interface RecipientProfile {
  name: string;
  personalities: string[];
  quirks: string[];
  hobbies: string[];
  notes: string;
  budget: number;
  occasion: string;
  deliveryDate: string;
}

export interface GiftDNA {
  sentimental: number;
  practical: number;
  adventurous: number;
  luxurious: number;
  quirky: number;
}

export interface AlchemyScore {
  personalityMatch: number;
  uniqueness: number;
  budgetFit: number;
  surpriseFactor: number;
}

export interface GiftCard {
  id: string;
  name: string;
  emoji: string;
  source: 'Etsy' | 'Amazon' | 'Specialty' | 'Niche';
  price: string;
  priceValue: number;
  matchPercent: number;
  reason: string;
  scores: AlchemyScore;
}

export interface CartItem {
  gift: GiftCard;
  quantity: number;
}

export interface VaultPerson {
  id: string;
  name: string;
  emoji: string;
}

export type MapNodeStatus = 'queued' | 'active' | 'visited';

export interface MapNode {
  id: string;
  emoji: string;
  label: string;
  status: MapNodeStatus;
}

export type WizardStep = 1 | 2 | 3 | 4;
