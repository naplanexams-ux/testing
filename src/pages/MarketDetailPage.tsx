import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import { Market, PriceHistory, Comment, Trade, Position } from '../types';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import { 
  Clock, 
  Users, 
  TrendingUp, 
  MessageSquare, 
  Info, 
  ArrowUpRight, 
  ChevronRight,
  History,
  Activity,
  Zap,
  ShieldCheck,
  Share2,
  Bookmark
} from 'lucide-react';
import { formatCurrency, formatProbability, cn } from '../lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

const MarketDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, login } = useAuth();
  const [market, setMarket] = useState<Market | null>(null);
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);
  const [tradeSide, setTradeSide] = useState<'YES' | 'NO'>('YES');
  const [amount, setAmount] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [commentBody, setCommentBody] = useState('');

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      try {
        const marketData = await supabaseService.getMarketBySlug(slug);
        setMarket(marketData);

        const [hist, comms, trds] = await Promise.all([
          supabaseService.getPriceHistory(marketData.id),
          supabaseService.getMarketComments(marketData.id),
          supabaseService.getMarketTrades(marketData.id, 10)
        ]);

        setHistory(hist);
        setComments(comms);
        setTrades(trds);

        // Real-time market updates
        const marketChannel = supabase
          .channel(`market-${marketData.id}`)
          .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'markets',
            filter: `id=eq.${marketData.id}`
          }, (payload) => {
            setMarket(prev => prev ? { ...prev, ...payload.new } : null);
          })
          .subscribe();

        // Real-time trades
        const tradeChannel = supabase
          .channel(`trades-${marketData.id}`)
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'trades',
            filter: `market_id=eq.${marketData.id}`
          }, (payload) => {
            const newTrade = payload.new as any;
            setTrades(prev => [newTrade, ...prev].slice(0, 10));
          })
          .subscribe();

        // Real-time comments
        const commentChannel = supabase
          .channel(`comments-${marketData.id}`)
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'comments',
            filter: `market_id=eq.${marketData.id}`
          }, (payload) => {
            const newComment = payload.new as any;
            setComments(prev => [newComment, ...prev]);
          })
          .subscribe();

        setLoading(false);

        return () => {
          supabase.removeChannel(marketChannel);
          supabase.removeChannel(tradeChannel);
          supabase.removeChannel(commentChannel);
        };
      } catch (err) {
        console.error('Error fetching market data:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  useEffect(() => {
    if (user && market) {
      const fetchPosition = async () => {
        const { data, error } = await supabase
          .from('positions')
          .select('*')
          .eq('user_id', user.id)
          .eq('market_id', market.id)
          .single();
        
        if (!error && data) {
          setPosition({
            id: data.id,
            userId: data.user_id,
            marketId: data.market_id,
            yesShares: data.yes_shares,
            noShares: data.no_shares,
            avgYesEntry: data.avg_yes_entry,
            avgNoEntry: data.avg_no_entry,
            realizedPnL: data.realized_pnl,
            updatedAt: data.updated_at
          });
        }
      };

      fetchPosition();

      // Real-time position updates
      const posChannel = supabase
        .channel(`position-${user.id}-${market.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'positions',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          if (payload.new && (payload.new as any).market_id === market.id) {
            const data = payload.new as any;
            setPosition({
              id: data.id,
              userId: data.user_id,
              marketId: data.market_id,
              yesShares: data.yes_shares,
              noShares: data.no_shares,
              avgYesEntry: data.avg_yes_entry,
              avgNoEntry: data.avg_no_entry,
              realizedPnL: data.realized_pnl,
              updatedAt: data.updated_at
            });
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(posChannel);
      };
    }
  }, [user, market]);

  const handleTrade = async () => {
    if (!user) {
      login();
      return;
    }
    if (!market || !amount || parseFloat(amount) <= 0) return;
    if (parseFloat(amount) > user.cashBalance) {
      toast.error("Insufficient balance");
      return;
    }

    setSubmitting(true);
    try {
      const data = await supabaseService.placeTrade(user.id, market.id, tradeSide, parseFloat(amount));
      toast.success(`Bought ${Math.round(data.shares)} ${tradeSide} shares!`);
      setAmount('');
    } catch (error: any) {
      toast.error(error.message || "Trade failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !market || !commentBody.trim()) return;

    try {
      await supabaseService.addComment({
        userId: user.id,
        username: user.username,
        marketId: market.id,
        body: commentBody.trim()
      });
      setCommentBody('');
    } catch (error) {
      toast.error("Failed to post comment");
    }
  };

  if (loading) return (
    <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      <p className="text-sm font-black uppercase tracking-widest text-zinc-500">Syncing Market Data...</p>
    </div>
  );

  if (!market) return (
    <div className="flex h-[60vh] flex-col items-center justify-center space-y-6 text-center">
      <div className="rounded-full bg-zinc-900 p-8 border border-white/5">
        <Zap className="h-12 w-12 text-zinc-700" />
      </div>
      <h2 className="text-3xl font-black tracking-tighter text-white">MARKET NOT FOUND</h2>
      <Link to="/markets" className="text-sm font-black uppercase tracking-widest text-orange-500 hover:underline">
        Back to Markets
      </Link>
    </div>
  );

  const chartData = history.length > 0 ? history : [
    { timestamp: market.createdAt, yesPrice: market.yesPrice, noPrice: market.noPrice },
    { timestamp: new Date().toISOString(), yesPrice: market.yesPrice, noPrice: market.noPrice }
  ];

  const currentPrice = tradeSide === 'YES' ? market.yesPrice : market.noPrice;
  const estShares = amount ? parseFloat(amount) / currentPrice : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 pb-20"
    >
      <div className="grid gap-12 lg:grid-cols-3">
        {/* Left Column: Market Info & Chart */}
        <div className="lg:col-span-2 space-y-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
              <Link to="/markets" className="hover:text-orange-400 transition-colors">Markets</Link>
              <ChevronRight className="h-3 w-3 text-zinc-700" />
              <span className="text-zinc-500">{market.categoryId}</span>
            </div>
            
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-4">
                <h1 className="text-4xl font-black leading-[1.1] tracking-tighter text-white sm:text-6xl">
                  {market.title}
                </h1>
                <p className="text-xl font-medium leading-relaxed text-zinc-400">
                  {market.summary}
                </p>
              </div>
              <div className="flex gap-3">
                <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-zinc-900/50 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white">
                  <Share2 className="h-5 w-5" />
                </button>
                <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-zinc-900/50 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white">
                  <Bookmark className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-8 pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">Volume</span>
                  <span className="text-lg font-black text-white">{formatCurrency(market.volume)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">Ends In</span>
                  <span className="text-lg font-black text-white">{formatDistanceToNow(new Date(market.endDate))}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-500">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">Participants</span>
                  <span className="text-lg font-black text-white">1.2K</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-900/30 p-8 backdrop-blur-sm transition-all hover:border-white/10">
            <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">Current Probability</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white">{formatProbability(market.yesPrice)}</span>
                    <span className="text-sm font-bold text-green-500">+2.4%</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 rounded-2xl bg-black/40 p-1 border border-white/5">
                {['1D', '1W', '1M', 'ALL'].map(t => (
                  <button 
                    key={t} 
                    className={cn(
                      "rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                      t === 'ALL' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorYes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="timestamp" 
                    hide 
                  />
                  <YAxis 
                    domain={[0, 1]} 
                    tickFormatter={(val) => `${Math.round(val * 100)}%`}
                    stroke="#ffffff10"
                    fontSize={10}
                    fontWeight="bold"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#09090b', 
                      border: '1px solid #ffffff10', 
                      borderRadius: '20px',
                      padding: '12px 16px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                    }}
                    labelStyle={{ color: '#71717a', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}
                    itemStyle={{ color: '#22c55e', fontSize: '14px', fontWeight: '900' }}
                    labelFormatter={(label) => format(new Date(label), 'MMM d, h:mm a')}
                    formatter={(val: number) => [formatProbability(val), 'Yes Price']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="yesPrice" 
                    stroke="#22c55e" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorYes)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Details Tabs */}
          <div className="space-y-12">
            <section className="space-y-6">
              <h2 className="flex items-center gap-3 text-2xl font-black tracking-tighter text-white">
                <Info className="h-6 w-6 text-orange-500" />
                MARKET OVERVIEW
              </h2>
              <div className="prose prose-invert max-w-none rounded-[2.5rem] border border-white/5 bg-zinc-900/20 p-10 text-lg font-medium leading-relaxed text-zinc-400">
                <ReactMarkdown>{market.description}</ReactMarkdown>
              </div>
            </section>

            <div className="grid gap-8 sm:grid-cols-2">
              <div className="space-y-4 rounded-[2rem] border border-white/5 bg-zinc-900/20 p-8">
                <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  Resolution Criteria
                </h3>
                <p className="text-lg font-medium leading-relaxed text-zinc-300">{market.rules}</p>
              </div>
              <div className="space-y-4 rounded-[2rem] border border-white/5 bg-zinc-900/20 p-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Resolution Source</h3>
                <a 
                  href={market.resolutionSource} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="group flex items-center gap-2 text-lg font-black text-orange-500 hover:text-orange-400"
                >
                  <span className="truncate">{market.resolutionSource}</span>
                  <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </a>
              </div>
            </div>

            {/* Discussion */}
            <section className="space-y-8">
              <h2 className="flex items-center gap-3 text-2xl font-black tracking-tighter text-white">
                <MessageSquare className="h-6 w-6 text-orange-500" />
                DISCUSSION
              </h2>
              
              <div className="space-y-8">
                {user ? (
                  <form onSubmit={handleComment} className="flex gap-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-800">
                      {user.avatar ? <img src={user.avatar} className="h-full w-full rounded-2xl object-cover" referrerPolicy="no-referrer" /> : <Users className="h-6 w-6 text-zinc-500" />}
                    </div>
                    <div className="flex-1 space-y-4">
                      <textarea
                        value={commentBody}
                        onChange={(e) => setCommentBody(e.target.value)}
                        placeholder="Share your prediction strategy..."
                        className="w-full rounded-[2rem] border border-white/5 bg-zinc-900/50 p-6 text-lg font-medium text-white transition-all focus:border-orange-500/50 focus:bg-zinc-900 focus:outline-none"
                        rows={3}
                      />
                      <div className="flex justify-end">
                        <button
                          disabled={!commentBody.trim()}
                          className="rounded-full bg-orange-500 px-8 py-3 text-sm font-black uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                        >
                          Post Comment
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="rounded-[2.5rem] border border-dashed border-white/10 p-12 text-center">
                    <p className="text-lg font-medium text-zinc-500">Sign in to join the conversation and share your insights.</p>
                    <button onClick={login} className="mt-6 text-sm font-black uppercase tracking-widest text-orange-500 hover:underline">Sign In Now</button>
                  </div>
                )}

                <div className="space-y-6">
                  <AnimatePresence>
                    {comments.map((comment, i) => (
                      <motion.div 
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex gap-6 rounded-[2rem] border border-white/5 bg-zinc-900/20 p-6 transition-all hover:bg-zinc-900/40"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-xs font-black text-zinc-500">
                          {comment.username[0].toUpperCase()}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-white">{comment.username}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                              {formatDistanceToNow(new Date(comment.createdAt))} ago
                            </span>
                          </div>
                          <p className="text-lg font-medium leading-relaxed text-zinc-400">{comment.body}</p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {comments.length === 0 && <p className="py-12 text-center text-lg font-medium italic text-zinc-600">No insights shared yet. Be the first to comment!</p>}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Right Column: Trade Panel & Activity */}
        <div className="space-y-8">
          {/* Trade Panel */}
          <div className="sticky top-24 space-y-8">
            <div className="overflow-hidden rounded-[3rem] border border-white/10 bg-zinc-900 p-8 shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
              <div className="mb-8 flex rounded-2xl bg-black/40 p-1.5 border border-white/5">
                <button
                  onClick={() => setTradeSide('YES')}
                  className={cn(
                    "flex-1 rounded-xl py-4 text-xs font-black uppercase tracking-widest transition-all",
                    tradeSide === 'YES' ? "bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)]" : "text-zinc-500 hover:text-white"
                  )}
                >
                  YES {formatProbability(market.yesPrice)}
                </button>
                <button
                  onClick={() => setTradeSide('NO')}
                  className={cn(
                    "flex-1 rounded-xl py-4 text-xs font-black uppercase tracking-widest transition-all",
                    tradeSide === 'NO' ? "bg-red-500 text-black shadow-[0_0_20px_rgba(239,68,68,0.3)]" : "text-zinc-500 hover:text-white"
                  )}
                >
                  NO {formatProbability(market.noPrice)}
                </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    <span>Investment Amount</span>
                    {user && <span>Available: {formatCurrency(user.cashBalance)}</span>}
                  </div>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-600">$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-2xl border border-white/5 bg-black/60 py-6 pl-12 pr-6 text-3xl font-black text-white transition-all focus:border-orange-500/50 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-4 rounded-2xl bg-white/5 p-6 border border-white/5">
                  <div className="flex justify-between text-sm">
                    <span className="font-black uppercase tracking-widest text-zinc-500">Avg Price</span>
                    <span className="font-mono font-black text-white">{formatCurrency(currentPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-black uppercase tracking-widest text-zinc-500">Est Shares</span>
                    <span className="font-mono font-black text-white">{estShares.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="flex justify-between text-sm">
                    <span className="font-black uppercase tracking-widest text-zinc-500">Max Payout</span>
                    <span className="font-mono font-black text-green-400">{formatCurrency(estShares)}</span>
                  </div>
                </div>

                <button
                  onClick={handleTrade}
                  disabled={submitting || !amount || parseFloat(amount) <= 0 || market.status !== 'active'}
                  className={cn(
                    "group relative w-full overflow-hidden rounded-2xl py-6 text-lg font-black uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50",
                    tradeSide === 'YES' ? "bg-green-500 text-black" : "bg-red-500 text-black"
                  )}
                >
                  <span className="relative z-10">{submitting ? "Processing..." : `Confirm ${tradeSide}`}</span>
                  <div className="absolute inset-0 -translate-x-full bg-white/20 transition-transform group-hover:translate-x-0" />
                </button>

                {market.status !== 'active' && (
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-red-500/10 py-3 text-[10px] font-black uppercase tracking-widest text-red-500">
                    <ShieldCheck className="h-3 w-3" />
                    Market is {market.status}
                  </div>
                )}
              </div>
            </div>

            {/* User Position */}
            <AnimatePresence>
              {position && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-[2.5rem] border border-white/5 bg-zinc-900/50 p-8 backdrop-blur-sm"
                >
                  <h3 className="mb-6 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-zinc-500">
                    <History className="h-4 w-4 text-orange-500" />
                    YOUR POSITION
                  </h3>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-600">YES Shares</span>
                      <span className="text-2xl font-black text-green-400">{position.yesShares.toFixed(2)}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-600">NO Shares</span>
                      <span className="text-2xl font-black text-red-400">{position.noShares.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between rounded-xl bg-black/40 p-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total Value</span>
                    <span className="text-lg font-black text-white">
                      {formatCurrency(position.yesShares * market.yesPrice + position.noShares * market.noPrice)}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Activity Feed */}
            <div className="rounded-[2.5rem] border border-white/5 bg-zinc-900/30 p-8">
              <h3 className="mb-6 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-zinc-500">
                <Activity className="h-4 w-4 text-orange-500" />
                RECENT ACTIVITY
              </h3>
              <div className="space-y-6">
                {trades.map((trade, i) => (
                  <motion.div 
                    key={trade.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-2 w-2 rounded-full shadow-[0_0_10px_currentColor]",
                        trade.side === 'YES' ? "text-green-500 bg-green-500" : "text-red-500 bg-red-500"
                      )} />
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-white">
                          TRADER BOUGHT {trade.side}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                          {formatCurrency(trade.totalCost)}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">
                      {formatDistanceToNow(new Date(trade.createdAt))}
                    </span>
                  </motion.div>
                ))}
                {trades.length === 0 && <p className="py-4 text-center text-xs font-black uppercase tracking-widest text-zinc-700 italic">No activity yet</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MarketDetailPage;
