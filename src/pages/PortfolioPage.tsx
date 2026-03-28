import React, { useEffect, useState } from 'react';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Position, Transaction, Market } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  TrendingUp, 
  History, 
  ArrowUpRight, 
  ArrowDownRight,
  LayoutGrid,
  Activity,
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

const PortfolioPage: React.FC = () => {
  const { user } = useAuth();
  const [positions, setPositions] = useState<(Position & { market?: Market })[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchPortfolio = async () => {
      setLoading(true);
      try {
        const [posList, transList] = await Promise.all([
          supabaseService.getUserPositions(user.id),
          supabaseService.getUserTransactions(user.id)
        ]);
        
        // Fetch associated markets for each position
        const enrichedPositions = await Promise.all(posList.map(async (pos) => {
          try {
            const market = await supabaseService.getMarketById(pos.marketId);
            return { ...pos, market };
          } catch (e) {
            return pos;
          }
        }));
        
        setPositions(enrichedPositions);
        setTransactions(transList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching portfolio:", error);
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [user]);

  if (!user) return null;

  const activePositions = positions.filter(p => p.market?.status === 'active' && (p.yesShares > 0 || p.noShares > 0));

  const totalPortfolioValue = user.cashBalance + activePositions.reduce((acc, p) => {
    const yesValue = p.yesShares * (p.market?.yesPrice || 0);
    const noValue = p.noShares * (p.market?.noPrice || 0);
    return acc + yesValue + noValue;
  }, 0);

  const unrealizedPnL = activePositions.reduce((acc, p) => {
    const yesPnL = p.yesShares * ((p.market?.yesPrice || 0) - p.avgYesEntry);
    const noPnL = p.noShares * ((p.market?.noPrice || 0) - p.avgNoEntry);
    return acc + yesPnL + noPnL;
  }, 0);

  const pnlPercentage = ((totalPortfolioValue - 1000) / 1000) * 100;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto space-y-12 px-4 pb-20"
    >
      <header className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter text-white sm:text-6xl">PORTFOLIO</h1>
          <p className="text-lg font-medium text-zinc-500">Real-time performance and asset tracking.</p>
        </div>
        <div className="group flex items-center gap-6 rounded-[2rem] border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-sm transition-all hover:bg-zinc-900/60">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 transition-transform group-hover:scale-110 group-hover:rotate-3">
            <Wallet className="h-7 w-7" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Available Cash</span>
            <div className="text-3xl font-black text-white">{formatCurrency(user.cashBalance)}</div>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Net Worth', value: formatCurrency(totalPortfolioValue), icon: BarChart3, color: 'text-white' },
          { 
            label: 'Total P/L', 
            value: `${unrealizedPnL >= 0 ? '+' : ''}${formatCurrency(unrealizedPnL)}`, 
            icon: unrealizedPnL >= 0 ? ArrowUpRight : ArrowDownRight,
            color: unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400',
            sub: `${pnlPercentage.toFixed(2)}% all time`
          },
          { label: 'Open Positions', value: activePositions.length, icon: LayoutGrid, color: 'text-white' },
          { label: 'Total Trades', value: transactions.filter(t => t.type === 'trade').length, icon: Activity, color: 'text-white' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group rounded-[2rem] border border-white/5 bg-zinc-900/20 p-8 transition-all hover:bg-zinc-900/40 hover:border-white/10"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{stat.label}</span>
              <stat.icon className={cn("h-4 w-4 opacity-50 transition-transform group-hover:scale-110", stat.color)} />
            </div>
            <div className={cn("text-3xl font-black tracking-tight", stat.color)}>{stat.value}</div>
            {stat.sub && <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">{stat.sub}</div>}
          </motion.div>
        ))}
      </div>

      {/* Positions Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-3 text-2xl font-black tracking-tighter text-white">
            <LayoutGrid className="h-6 w-6 text-orange-500" />
            ACTIVE POSITIONS
          </h2>
        </div>
        
        <div className="overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-900/20 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  <th className="px-8 py-6">Market</th>
                  <th className="px-8 py-6">Side</th>
                  <th className="px-8 py-6">Shares</th>
                  <th className="px-8 py-6">Avg Entry</th>
                  <th className="px-8 py-6">Market Price</th>
                  <th className="px-8 py-6 text-right">Value</th>
                  <th className="px-8 py-6 text-right">P/L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence>
                  {activePositions.map((pos) => {
                    const side = pos.yesShares > 0 ? 'YES' : 'NO';
                    const shares = side === 'YES' ? pos.yesShares : pos.noShares;
                    const avgEntry = side === 'YES' ? pos.avgYesEntry : pos.avgNoEntry;
                    const currentPrice = side === 'YES' ? (pos.market?.yesPrice || 0) : (pos.market?.noPrice || 0);
                    const value = shares * currentPrice;
                    const pnl = shares * (currentPrice - avgEntry);

                    return (
                      <motion.tr 
                        key={pos.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="group hover:bg-white/5 transition-colors"
                      >
                        <td className="px-8 py-6">
                          <Link to={`/markets/${pos.market?.slug}`} className="flex items-center gap-3 font-black text-white hover:text-orange-500 transition-colors">
                            <span className="line-clamp-1">{pos.market?.title}</span>
                            <ChevronRight className="h-3 w-3 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                          </Link>
                        </td>
                        <td className="px-8 py-6">
                          <span className={cn(
                            "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                            side === 'YES' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                          )}>
                            {side}
                          </span>
                        </td>
                        <td className="px-8 py-6 font-mono text-sm font-bold text-zinc-300">{shares.toFixed(2)}</td>
                        <td className="px-8 py-6 font-mono text-sm font-bold text-zinc-500">{formatCurrency(avgEntry)}</td>
                        <td className="px-8 py-6 font-mono text-sm font-bold text-zinc-500">{formatCurrency(currentPrice)}</td>
                        <td className="px-8 py-6 text-right font-mono text-sm font-black text-white">{formatCurrency(value)}</td>
                        <td className={cn(
                          "px-8 py-6 text-right font-mono text-sm font-black",
                          pnl >= 0 ? "text-green-400" : "text-red-400"
                        )}>
                          {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
                {activePositions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-8 py-32 text-center">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="rounded-full bg-zinc-900 p-6 border border-white/5">
                          <LayoutGrid className="h-8 w-8 text-zinc-700" />
                        </div>
                        <h3 className="text-xl font-black tracking-tighter text-white">NO ACTIVE POSITIONS</h3>
                        <p className="text-sm font-medium text-zinc-500">Your open trades will appear here once you start trading.</p>
                        <Link to="/markets" className="mt-4 text-xs font-black uppercase tracking-widest text-orange-500 hover:underline">
                          Browse Markets
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Transaction History */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <History className="h-6 w-6 text-orange-500" />
          <h2 className="text-2xl font-black tracking-tighter text-white">TRANSACTION LOG</h2>
        </div>
        
        <div className="overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-900/20 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  <th className="px-8 py-6">Timestamp</th>
                  <th className="px-8 py-6">Type</th>
                  <th className="px-8 py-6">Amount</th>
                  <th className="px-8 py-6 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.slice(0, 10).map((t) => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-8 py-6 text-xs font-bold text-zinc-500">
                      {format(new Date(t.createdAt), 'MMM d, yyyy • HH:mm:ss')}
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">{t.type}</span>
                    </td>
                    <td className={cn(
                      "px-8 py-6 font-mono text-sm font-black",
                      t.amount >= 0 ? "text-green-400" : "text-red-400"
                    )}>
                      {t.amount >= 0 ? '+' : ''}{formatCurrency(t.amount)}
                    </td>
                    <td className="px-8 py-6 text-right font-mono text-sm font-black text-zinc-300">
                      {formatCurrency(t.balanceAfter)}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-sm font-medium text-zinc-600 italic">
                      No transaction history found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default PortfolioPage;
