import React from 'react';
import { Link } from 'react-router-dom';
import { Market } from '../types';
import { formatCurrency, formatProbability, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { Clock, TrendingUp, Users, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MarketCardProps {
  market: Market;
}

export const MarketCard: React.FC<MarketCardProps> = ({ market }) => {
  const isEndingSoon = new Date(market.endDate).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-900/40 backdrop-blur-sm transition-all duration-500 hover:border-orange-500/30 hover:bg-zinc-900/60 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]"
    >
      <Link to={`/markets/${market.slug}`} className="absolute inset-0 z-10" />
      
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {market.image ? (
          <img 
            src={market.image} 
            alt={market.title} 
            className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" 
            referrerPolicy="no-referrer" 
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
            <TrendingUp className="h-12 w-12 text-zinc-700 opacity-50" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent opacity-80" />
        
        <div className="absolute left-6 top-6 flex gap-2">
          <div className="rounded-full bg-black/60 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-300 backdrop-blur-xl border border-white/10">
            {market.categoryId}
          </div>
          {isEndingSoon && (
            <motion.div 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="rounded-full bg-orange-500/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-orange-500 backdrop-blur-xl border border-orange-500/20"
            >
              Ending Soon
            </motion.div>
          )}
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <h3 className="line-clamp-2 text-2xl font-black leading-tight tracking-tighter text-white transition-colors duration-300 group-hover:text-orange-500">
            {market.title}
          </h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-8 pt-4">
        <p className="mb-8 line-clamp-2 text-sm font-medium leading-relaxed text-zinc-500">
          {market.summary}
        </p>

        <div className="mt-auto space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">
              <Clock className={cn("h-3.5 w-3.5", isEndingSoon ? "text-orange-500" : "text-zinc-600")} />
              <span>{formatDistanceToNow(new Date(market.endDate))} left</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">
              <Users className="h-3.5 w-3.5" />
              <span>{formatCurrency(market.volume)} Vol</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="group/btn relative flex flex-col items-center justify-center rounded-2xl bg-green-500/5 p-4 border border-green-500/10 transition-all hover:bg-green-500/10 hover:border-green-500/30">
              <span className="mb-1 text-[10px] font-black uppercase tracking-widest text-green-500/60">Yes</span>
              <span className="text-2xl font-mono font-black text-green-400">{formatProbability(market.yesPrice)}</span>
            </div>
            <div className="group/btn relative flex flex-col items-center justify-center rounded-2xl bg-red-500/5 p-4 border border-red-500/10 transition-all hover:bg-red-500/10 hover:border-red-500/30">
              <span className="mb-1 text-[10px] font-black uppercase tracking-widest text-red-500/60">No</span>
              <span className="text-2xl font-mono font-black text-red-400">{formatProbability(market.noPrice)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center pt-2 opacity-0 -translate-y-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
            <span className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-orange-500">
              Trade Now <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
