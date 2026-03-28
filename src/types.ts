export type UserRole = 'user' | 'admin';
export type MarketStatus = 'draft' | 'active' | 'resolving' | 'resolved' | 'cancelled';
export type Outcome = 'YES' | 'NO';
export type TradeAction = 'BUY' | 'SELL';
export type TransactionType = 'deposit' | 'trade' | 'settlement' | 'refund' | 'adjustment';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: UserRole;
  cashBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Market {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  description?: string;
  image?: string;
  categoryId?: string;
  rules?: string;
  resolutionSource?: string;
  status: MarketStatus;
  endDate: string;
  closeDate: string;
  resolvedOutcome: Outcome | null;
  yesPrice: number; // 0 to 1
  noPrice: number;  // 0 to 1
  volume: number;
  liquidity: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Trade {
  id: string;
  userId: string;
  marketId: string;
  side: Outcome;
  action: TradeAction;
  shares: number;
  pricePerShare: number;
  totalCost: number;
  createdAt: string;
}

export interface Position {
  id: string; // userId_marketId
  userId: string;
  marketId: string;
  yesShares: number;
  noShares: number;
  avgYesEntry: number;
  avgNoEntry: number;
  realizedPnL: number;
  updatedAt: string;
}

export interface PriceHistory {
  id: string;
  marketId: string;
  timestamp: string;
  yesPrice: number;
  noPrice: number;
  volumeSnapshot: number;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  marketId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId?: string;
  createdAt: string;
}
