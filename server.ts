import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";

// Admin client for server-side operations (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Debug endpoint to check environment variables
  app.get("/api/debug-env", (req, res) => {
    const keys = Object.keys(process.env).filter(k => k.toLowerCase().includes('supa') || k.toLowerCase().includes('vite'));
    res.json({ keys });
  });

  // API Routes
  
  // 1. Execute Trade
  app.post("/api/trade", async (req, res) => {
    const { userId, marketId, side, amount } = req.body;

    if (!userId || !marketId || !side || !amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid trade parameters" });
    }

    try {
      // 1. Get User and Market data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      const { data: marketData, error: marketError } = await supabase
        .from('markets')
        .select('*')
        .eq('id', marketId)
        .single();

      if (userError || !userData) throw new Error("User not found");
      if (marketError || !marketData) throw new Error("Market not found");

      if (marketData.status !== 'active') throw new Error("Market is not active");
      if (userData.cash_balance < amount) throw new Error("Insufficient balance");

      // 2. Pricing Engine (Simplified CPMM)
      const currentPrice = side === 'YES' ? marketData.yes_price : marketData.no_price;
      const slippage = amount / (marketData.liquidity * 10);
      const avgPrice = Math.min(0.99, currentPrice + slippage / 2);
      const shares = amount / avgPrice;

      // 3. Update User Balance
      const newBalance = userData.cash_balance - amount;
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ cash_balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (userUpdateError) throw userUpdateError;

      // 4. Update Market Pricing & Volume
      const newYesPrice = side === 'YES' 
        ? Math.min(0.99, marketData.yes_price + slippage)
        : Math.max(0.01, marketData.yes_price - slippage);
      const newNoPrice = 1 - newYesPrice;

      const { error: marketUpdateError } = await supabase
        .from('markets')
        .update({
          yes_price: newYesPrice,
          no_price: newNoPrice,
          volume: marketData.volume + amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', marketId);

      if (marketUpdateError) throw marketUpdateError;

      // 5. Update Position
      const { data: posData, error: posFetchError } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', userId)
        .eq('market_id', marketId)
        .single();

      let positionData = posData || {
        user_id: userId,
        market_id: marketId,
        yes_shares: 0,
        no_shares: 0,
        avg_yes_entry: 0,
        avg_no_entry: 0,
        realized_pnl: 0,
        updated_at: new Date().toISOString()
      };

      if (side === 'YES') {
        const totalCost = (positionData.yes_shares * positionData.avg_yes_entry) + amount;
        positionData.yes_shares += shares;
        positionData.avg_yes_entry = totalCost / positionData.yes_shares;
      } else {
        const totalCost = (positionData.no_shares * positionData.avg_no_entry) + amount;
        positionData.no_shares += shares;
        positionData.avg_no_entry = totalCost / positionData.no_shares;
      }
      positionData.updated_at = new Date().toISOString();

      const { error: posUpdateError } = await supabase
        .from('positions')
        .upsert(positionData);

      if (posUpdateError) throw posUpdateError;

      // 6. Record Trade
      const { data: tradeData, error: tradeError } = await supabase
        .from('trades')
        .insert({
          user_id: userId,
          market_id: marketId,
          side,
          action: 'BUY',
          shares,
          price_per_share: avgPrice,
          total_cost: amount,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (tradeError) throw tradeError;

      // 7. Record Transaction
      const { error: transError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'trade',
          amount: -amount,
          balance_before: userData.cash_balance,
          balance_after: newBalance,
          reference_id: tradeData.id,
          created_at: new Date().toISOString()
        });

      if (transError) throw transError;

      // 8. Record Price History
      const { error: historyError } = await supabase
        .from('price_history')
        .insert({
          market_id: marketId,
          timestamp: new Date().toISOString(),
          yes_price: newYesPrice,
          no_price: newNoPrice,
          volume_snapshot: marketData.volume + amount
        });

      if (historyError) throw historyError;

      res.json({ shares, avgPrice, newBalance });
    } catch (error: any) {
      console.error("Trade Error:", error);
      res.status(500).json({ error: error.message || error.toString() });
    }
  });

  // 2. Resolve Market (Admin Only)
  app.post("/api/admin/resolve", async (req, res) => {
    const { marketId, outcome, adminId } = req.body;

    try {
      const { data: adminData, error: adminError } = await supabase
        .from('users')
        .select('role')
        .eq('id', adminId)
        .single();

      if (adminError || !adminData || adminData.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Update Market Status
      const { error: marketUpdateError } = await supabase
        .from('markets')
        .update({
          status: 'resolved',
          resolved_outcome: outcome,
          updated_at: new Date().toISOString()
        })
        .eq('id', marketId);

      if (marketUpdateError) throw marketUpdateError;

      // Settle all positions
      const { data: positions, error: posError } = await supabase
        .from('positions')
        .select('*')
        .eq('market_id', marketId);

      if (posError) throw posError;

      for (const pos of positions) {
        const winningShares = outcome === 'YES' ? pos.yes_shares : pos.no_shares;
        const payout = winningShares * 1;

        if (payout > 0) {
          const { data: userData, error: userFetchError } = await supabase
            .from('users')
            .select('cash_balance')
            .eq('id', pos.user_id)
            .single();

          if (userFetchError || !userData) continue;

          const newBalance = userData.cash_balance + payout;
          await supabase
            .from('users')
            .update({ cash_balance: newBalance, updated_at: new Date().toISOString() })
            .eq('id', pos.user_id);

          // Record Transaction
          await supabase
            .from('transactions')
            .insert({
              user_id: pos.user_id,
              type: 'settlement',
              amount: payout,
              balance_before: userData.cash_balance,
              balance_after: newBalance,
              reference_id: marketId,
              created_at: new Date().toISOString()
            });
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Resolve Error:", error);
      res.status(500).json({ error: error.message || error.toString() });
    }
  });

  // 3. Seed Data (Admin Only)
  app.post("/api/admin/seed", async (req, res) => {
    const { adminId } = req.body;
    try {
      const { data: adminData, error: adminError } = await supabase
        .from('users')
        .select('role')
        .eq('id', adminId)
        .single();

      if (adminError || !adminData || adminData.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const categories = [
        { name: "Crypto", slug: "crypto", description: "Cryptocurrency markets" },
        { name: "Tech", slug: "tech", description: "Technology and AI" },
        { name: "Sports", slug: "sports", description: "Sports events" },
        { name: "Politics", slug: "politics", description: "Political outcomes" }
      ];

      await supabase.from('categories').upsert(categories, { onConflict: 'slug' });

      const markets = [
        {
          slug: "btc-120k-2026",
          title: "Will Bitcoin close above $120k by Dec 31, 2026?",
          summary: "Bitcoin price prediction for end of 2026.",
          description: "This market resolves to YES if the Bitcoin price is above $120,000 at 11:59 PM UTC on Dec 31, 2026.",
          category_id: "crypto",
          rules: "Price source: CoinGecko or Binance.",
          resolution_source: "CoinGecko",
          status: "active",
          end_date: "2026-12-31T23:59:59Z",
          close_date: "2026-12-31T23:59:59Z",
          yes_price: 0.65,
          no_price: 0.35,
          volume: 12500,
          liquidity: 5000,
          created_by: adminId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          slug: "gpt-6-2027",
          title: "Will OpenAI release GPT-6 before Jan 1, 2027?",
          summary: "AI model release prediction.",
          description: "Resolves to YES if OpenAI officially announces and releases GPT-6 to any user group before 2027.",
          category_id: "tech",
          rules: "Official OpenAI announcement required.",
          resolution_source: "OpenAI Blog",
          status: "active",
          end_date: "2027-01-01T00:00:00Z",
          close_date: "2027-01-01T00:00:00Z",
          yes_price: 0.42,
          no_price: 0.58,
          volume: 8400,
          liquidity: 3000,
          created_by: adminId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      await supabase.from('markets').upsert(markets, { onConflict: 'slug' });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Seed Error:", error);
      res.status(500).json({ error: error.message || error.toString() });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
