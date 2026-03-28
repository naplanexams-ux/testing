import React, { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import { Market, Category } from '../types';
import { Plus, LayoutDashboard, CheckCircle2, XCircle, RefreshCw, ChevronRight, BarChart3, Globe, ShieldCheck } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    summary: '',
    description: '',
    categoryId: '',
    rules: '',
    resolutionSource: '',
    endDate: '',
    image: '',
    initialLiquidity: '1000'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cats, mrkts] = await Promise.all([
        supabaseService.getCategories(),
        supabaseService.getMarkets()
      ]);
      setCategories(cats);
      setMarkets(mrkts);
    } catch (error) {
      toast.error("Failed to fetch admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const slug = formData.slug || `market-${Date.now()}`;
      const title = formData.title || 'Untitled Market';
      const categoryId = formData.categoryId || 'general';
      const endDate = formData.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const newMarket: Partial<Market> = {
        ...formData,
        slug,
        title,
        categoryId,
        endDate,
        status: 'active',
        yesPrice: 0.5,
        noPrice: 0.5,
        volume: 0,
        liquidity: parseFloat(formData.initialLiquidity || '1000'),
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        closeDate: endDate,
        resolvedOutcome: null
      };

      await supabaseService.createMarket(newMarket as Market);
      toast.success("Market created successfully!");
      setShowForm(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to create market");
    }
  };

  const handleResolve = async (marketId: string, outcome: 'YES' | 'NO') => {
    if (!user) return;
    if (!window.confirm(`Are you sure you want to resolve this market to ${outcome}?`)) return;

    try {
      await supabaseService.resolveMarket(marketId, outcome, user.id);
      toast.success(`Market resolved to ${outcome}`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Resolution failed");
    }
  };

  const handleSeed = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      await supabaseService.seedData(user.id);
      toast.success("Demo data seeded!");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Seeding failed");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto space-y-12 px-4 pb-20"
    >
      <header className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter text-white sm:text-6xl">ADMIN</h1>
          <p className="text-lg font-medium text-zinc-500">System control and market management.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-3 rounded-2xl border border-white/5 bg-zinc-900/40 px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-zinc-800 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", seeding && "animate-spin")} />
            Seed Demo Data
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-3 rounded-2xl bg-orange-500 px-8 py-3 text-xs font-black uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Create Market
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showForm && (
          <motion.section 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-900/40 p-10 backdrop-blur-sm"
          >
            <h2 className="mb-8 text-2xl font-black tracking-tighter text-white">NEW MARKET</h2>
            <form onSubmit={handleCreateMarket} className="grid gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-2xl border border-white/5 bg-black/40 p-4 text-sm font-medium text-white focus:border-orange-500/50 focus:outline-none"
                  placeholder="e.g. Will Bitcoin hit $100k?"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full rounded-2xl border border-white/5 bg-black/40 p-4 text-sm font-medium text-white focus:border-orange-500/50 focus:outline-none"
                  placeholder="btc-100k"
                />
              </div>
              <div className="space-y-3 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Summary</label>
                <input
                  type="text"
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full rounded-2xl border border-white/5 bg-black/40 p-4 text-sm font-medium text-white focus:border-orange-500/50 focus:outline-none"
                  placeholder="Short one-line summary"
                />
              </div>
              <div className="space-y-3 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Description (Markdown)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-2xl border border-white/5 bg-black/40 p-4 text-sm font-medium text-white focus:border-orange-500/50 focus:outline-none"
                  rows={4}
                  placeholder="Detailed description and context"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Category</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full rounded-2xl border border-white/5 bg-black/40 p-4 text-sm font-medium text-white focus:border-orange-500/50 focus:outline-none cursor-pointer"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">End Date</label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full rounded-2xl border border-white/5 bg-black/40 p-4 text-sm font-medium text-white focus:border-orange-500/50 focus:outline-none"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Resolution Source</label>
                <input
                  type="text"
                  value={formData.resolutionSource}
                  onChange={(e) => setFormData({ ...formData, resolutionSource: e.target.value })}
                  className="w-full rounded-2xl border border-white/5 bg-black/40 p-4 text-sm font-medium text-white focus:border-orange-500/50 focus:outline-none"
                  placeholder="URL or official source"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Initial Liquidity</label>
                <input
                  type="number"
                  value={formData.initialLiquidity}
                  onChange={(e) => setFormData({ ...formData, initialLiquidity: e.target.value })}
                  className="w-full rounded-2xl border border-white/5 bg-black/40 p-4 text-sm font-medium text-white focus:border-orange-500/50 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-6 md:col-span-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-orange-500 px-10 py-4 text-xs font-black uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95"
                >
                  Create Market
                </button>
              </div>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Markets List */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-6 w-6 text-orange-500" />
          <h2 className="text-2xl font-black tracking-tighter text-white">MANAGE MARKETS</h2>
        </div>

        <div className="overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-900/20 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  <th className="px-8 py-6">Market</th>
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6">Volume</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {markets.map((m) => (
                  <tr key={m.id} className="group hover:bg-white/5 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-zinc-500">
                          <Globe className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-lg font-black text-white group-hover:text-orange-500 transition-colors">{m.title}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{m.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                        m.status === 'active' ? "bg-green-500/10 text-green-500" :
                        m.status === 'resolved' ? "bg-blue-500/10 text-blue-500" :
                        "bg-zinc-500/10 text-zinc-500"
                      )}>
                        {m.status}
                      </span>
                      {m.resolvedOutcome && (
                        <span className="ml-3 text-xs font-black text-white">({m.resolvedOutcome})</span>
                      )}
                    </td>
                    <td className="px-8 py-6 font-mono text-sm font-black text-zinc-400">{formatCurrency(m.volume)}</td>
                    <td className="px-8 py-6 text-right">
                      {m.status === 'active' && (
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => handleResolve(m.id, 'YES')}
                            className="flex items-center gap-2 rounded-xl bg-green-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-green-500 hover:bg-green-500 hover:text-black transition-all"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            YES
                          </button>
                          <button
                            onClick={() => handleResolve(m.id, 'NO')}
                            className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-black transition-all"
                          >
                            <XCircle className="h-3 w-3" />
                            NO
                          </button>
                        </div>
                      )}
                      {m.status === 'resolved' && (
                        <div className="flex justify-end items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                          <ShieldCheck className="h-4 w-4" />
                          Resolved
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default AdminDashboard;
