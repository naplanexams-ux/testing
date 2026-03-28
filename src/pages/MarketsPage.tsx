import React, { useEffect, useState } from 'react';
import { supabaseService } from '../services/supabaseService';
import { Market, Category } from '../types';
import { MarketCard } from '../components/MarketCard';
import { Search, Filter, SlidersHorizontal, LayoutGrid, List } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const MarketsPage: React.FC = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'volume' | 'newest' | 'ending'>('volume');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cats, allMarkets] = await Promise.all([
          supabaseService.getCategories(),
          supabaseService.getMarkets(selectedCategory || undefined)
        ]);
        
        setCategories(cats);
        
        // Sort markets based on selected criteria
        const sorted = [...allMarkets].sort((a, b) => {
          if (sortBy === 'volume') return b.volume - a.volume;
          if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          if (sortBy === 'ending') return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
          return 0;
        });

        setMarkets(sorted);
      } catch (error) {
        console.error("Error fetching markets:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sortBy, selectedCategory]);

  const filteredMarkets = markets.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase()) || 
                           (m.summary?.toLowerCase().includes(search.toLowerCase()) || false);
    return matchesSearch;
  });

  return (
    <div className="container mx-auto space-y-12 px-4 pb-20">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-5xl font-black tracking-tighter text-white sm:text-6xl"
          >
            MARKETS
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg font-medium text-zinc-500"
          >
            Discover and trade on the world's most anticipated outcomes.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative w-full max-w-md"
        >
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search markets, categories, or outcomes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-white/5 bg-zinc-900/50 py-4 pl-12 pr-4 text-sm font-medium text-white backdrop-blur-sm transition-all focus:border-orange-500/50 focus:bg-zinc-900 focus:outline-none"
          />
        </motion.div>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "whitespace-nowrap rounded-full px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-all",
              !selectedCategory 
                ? "bg-orange-500 text-black shadow-[0_0_20px_rgba(249,115,22,0.3)]" 
                : "bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-white"
            )}
          >
            All Markets
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={cn(
                "whitespace-nowrap rounded-full px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-all",
                selectedCategory === cat.slug 
                  ? "bg-orange-500 text-black shadow-[0_0_20px_rgba(249,115,22,0.3)]" 
                  : "bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-white"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-2xl bg-zinc-900/50 p-1 border border-white/5">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-xl transition-all",
                viewMode === 'grid' ? "bg-zinc-800 text-orange-500" : "text-zinc-500 hover:text-white"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-xl transition-all",
                viewMode === 'list' ? "bg-zinc-800 text-orange-500" : "text-zinc-500 hover:text-white"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-zinc-900/50 px-4 py-2 border border-white/5">
            <SlidersHorizontal className="h-4 w-4 text-zinc-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-black uppercase tracking-widest text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="volume">Volume</option>
              <option value="newest">Newest</option>
              <option value="ending">Ending</option>
            </select>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="aspect-[16/10] animate-pulse rounded-[2rem] bg-zinc-900/50" />
            ))}
          </motion.div>
        ) : filteredMarkets.length > 0 ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "grid gap-8",
              viewMode === 'grid' ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}
          >
            {filteredMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 animate-ping rounded-full bg-orange-500/20" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-zinc-900 border border-white/5">
                <Filter className="h-10 w-10 text-zinc-700" />
              </div>
            </div>
            <h3 className="text-3xl font-black tracking-tighter text-white">NO MARKETS FOUND</h3>
            <p className="mt-2 text-lg font-medium text-zinc-500">Try adjusting your filters or search terms to find what you're looking for.</p>
            <button 
              onClick={() => {
                setSearch('');
                setSelectedCategory(null);
              }}
              className="mt-8 text-sm font-black uppercase tracking-widest text-orange-500 hover:underline"
            >
              Clear All Filters
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MarketsPage;
