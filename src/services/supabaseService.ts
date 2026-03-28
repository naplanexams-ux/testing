import { supabase } from '../supabase';
import { Market, Category, Trade, Position, Transaction, User, Comment, PriceHistory } from '../types';

// Mappers to convert snake_case (Supabase) to camelCase (Frontend)
export const mapMarket = (data: any): Market => ({
  id: data.id,
  slug: data.slug,
  title: data.title,
  summary: data.summary,
  description: data.description,
  image: data.image,
  categoryId: data.category_id,
  rules: data.rules,
  resolutionSource: data.resolution_source,
  status: data.status,
  endDate: data.end_date,
  closeDate: data.close_date,
  resolvedOutcome: data.resolved_outcome,
  yesPrice: data.yes_price,
  noPrice: data.no_price,
  volume: data.volume,
  liquidity: data.liquidity,
  createdBy: data.created_by,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

export const mapCategory = (data: any): Category => ({
  id: data.id,
  name: data.name,
  slug: data.slug,
  description: data.description,
});

export const mapTrade = (data: any): Trade => ({
  id: data.id,
  userId: data.user_id,
  marketId: data.market_id,
  side: data.side,
  action: data.action,
  shares: data.shares,
  pricePerShare: data.price_per_share,
  totalCost: data.total_cost,
  createdAt: data.created_at,
});

export const mapPosition = (data: any): Position => ({
  id: data.id,
  userId: data.user_id,
  marketId: data.market_id,
  yesShares: data.yes_shares,
  noShares: data.no_shares,
  avgYesEntry: data.avg_yes_entry,
  avgNoEntry: data.avg_no_entry,
  realizedPnL: data.realized_pnl,
  updatedAt: data.updated_at,
});

export const mapTransaction = (data: any): Transaction => ({
  id: data.id,
  userId: data.user_id,
  type: data.type,
  amount: data.amount,
  balanceBefore: data.balance_before,
  balanceAfter: data.balance_after,
  referenceId: data.reference_id,
  createdAt: data.created_at,
});

export const mapUser = (data: any): User => ({
  id: data.id,
  username: data.username,
  email: data.email,
  avatar: data.avatar,
  role: data.role,
  cashBalance: data.cash_balance,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

export const mapComment = (data: any): Comment => ({
  id: data.id,
  userId: data.user_id,
  username: data.username,
  marketId: data.market_id,
  body: data.body,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

export const mapPriceHistory = (data: any): PriceHistory => ({
  id: data.id,
  marketId: data.market_id,
  timestamp: data.timestamp,
  yesPrice: data.yes_price,
  noPrice: data.no_price,
  volumeSnapshot: data.volume_snapshot,
});

// Service Methods
export const supabaseService = {
  // Markets
  async getMarkets(categoryId?: string, status: string = 'active') {
    let query = supabase
      .from('markets')
      .select('*')
      .eq('status', status)
      .order('volume', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapMarket);
  },

  async getMarketBySlug(slug: string) {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return mapMarket(data);
  },

  async getMarketById(id: string) {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapMarket(data);
  },

  async getFeaturedMarkets(limit: number = 3) {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .eq('status', 'active')
      .order('volume', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(mapMarket);
  },

  // Categories
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return (data || []).map(mapCategory);
  },

  // Trades & Positions
  async getMarketTrades(marketId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('market_id', marketId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(mapTrade);
  },

  async getUserPositions(userId: string) {
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('user_id', userId)
      .or('yes_shares.gt.0,no_shares.gt.0');

    if (error) throw error;
    return (data || []).map(mapPosition);
  },

  async getUserTransactions(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapTransaction);
  },

  // Leaderboard
  async getLeaderboard(limit: number = 10) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('cash_balance', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(mapUser);
  },

  // Comments
  async getMarketComments(marketId: string) {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('market_id', marketId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapComment);
  },

  async addComment(comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: comment.userId,
        username: comment.username,
        market_id: comment.marketId,
        body: comment.body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return mapComment(data);
  },

  // Price History
  async getPriceHistory(marketId: string) {
    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .eq('market_id', marketId)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapPriceHistory);
  },

  // Admin Actions
  async createMarket(market: any) {
    const { data, error } = await supabase
      .from('markets')
      .insert({
        slug: market.slug,
        title: market.title,
        summary: market.summary,
        description: market.description,
        image: market.image,
        category_id: market.categoryId,
        rules: market.rules,
        resolution_source: market.resolutionSource,
        status: market.status,
        end_date: market.endDate,
        close_date: market.closeDate,
        yes_price: market.yesPrice,
        no_price: market.noPrice,
        volume: market.volume,
        liquidity: market.liquidity,
        created_by: market.createdBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return mapMarket(data);
  },

  // API Route Wrappers (for complex logic)
  async placeTrade(userId: string, marketId: string, side: 'YES' | 'NO', amount: number) {
    const response = await fetch('/api/trade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, marketId, side, amount }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Trade failed');
    return result;
  },

  async resolveMarket(marketId: string, outcome: 'YES' | 'NO', adminId: string) {
    const response = await fetch('/api/admin/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketId, outcome, adminId }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Resolution failed');
    return result;
  },

  async seedData(adminId: string) {
    const response = await fetch('/api/admin/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Seeding failed');
    return result;
  }
};
