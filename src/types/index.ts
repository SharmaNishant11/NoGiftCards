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
  claudeSummary?: string;
  dnaScores?: GiftDNA;
  signalCount?: number;
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
  source: string;
  price: string;
  priceValue: number;
  matchPercent: number;
  reason: string;
  url: string;
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

export interface QuestStatusResponse {
  questId: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  currentNode: string;
  visitedNodes: string[];
  liveUrl: string | null;
  messages: QuestMessage[];
  discoveries?: Discovery[];
  output?: string;
}

export interface QuestMessage {
  id: string;
  quest_id: string;
  role: string;
  summary: string;
  created_at: string;
}

export interface Discovery {
  id: string;
  quest_id: string;
  name: string;
  emoji: string;
  site: string;
  price: number;
  url: string;
  image_url?: string;
  why_text: string;
  alchemy_score: number;
  sub_scores: AlchemyScore;
  created_at: string;
}

export type ProfileMethod = 'conversation' | 'manual';
