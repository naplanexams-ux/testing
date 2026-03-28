import React, { useEffect, useState } from 'react';
import { supabaseService } from '../services/supabaseService';
import { User } from '../types';
import { Trophy, Medal, Crown, Star, ArrowUp } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const LeaderboardPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await supabaseService.getLeaderboard(50);
        setUsers(data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const topThree = users.slice(0, 3);
  const rest = users.slice(3);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto space-y-20 px-4 pb-20"
    >
      <header className="relative flex flex-col items-center space-y-6 text-center">
        <div className="absolute -top-20 -z-10 h-64 w-64 rounded-full bg-orange-500/10 blur-[100px]" />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-orange-500 to-yellow-500 p-1 shadow-[0_20px_40px_rgba(249,115,22,0.3)]"
        >
          <div className="flex h-full w-full items-center justify-center rounded-[1.8rem] bg-zinc-900">
            <Trophy className="h-10 w-10 text-orange-500" />
          </div>
        </motion.div>
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter text-white sm:text-7xl">HALL OF FAME</h1>
          <p className="text-lg font-medium text-zinc-500">The world's most elite predictors, ranked by performance.</p>
        </div>
      </header>

      {/* Podium */}
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3 lg:items-end">
        {/* Silver - Rank 2 */}
        {topThree[1] && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="order-2 flex flex-col items-center space-y-6 lg:order-1"
          >
            <div className="relative">
              <div className="absolute -inset-4 animate-pulse rounded-full bg-zinc-400/10 blur-xl" />
              <div className="relative h-24 w-24 overflow-hidden rounded-[2rem] border-4 border-zinc-400 bg-zinc-800 shadow-2xl">
                {topThree[1].avatar ? (
                  <img src={topThree[1].avatar} alt={topThree[1].username} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-black text-zinc-400">
                    {topThree[1].username[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-400 text-black shadow-lg">
                <Medal className="h-6 w-6" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black text-white">{topThree[1].username}</h3>
              <p className="text-lg font-black text-zinc-400">{formatCurrency(topThree[1].cashBalance)}</p>
            </div>
            <div className="h-32 w-full rounded-t-[2.5rem] bg-gradient-to-b from-zinc-400/20 to-transparent border-x border-t border-zinc-400/20" />
          </motion.div>
        )}

        {/* Gold - Rank 1 */}
        {topThree[0] && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="order-1 flex flex-col items-center space-y-6 lg:order-2 lg:pb-12"
          >
            <div className="relative">
              <div className="absolute -inset-8 animate-pulse rounded-full bg-yellow-500/20 blur-2xl" />
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="absolute -top-12 left-1/2 -translate-x-1/2"
              >
                <Crown className="h-12 w-12 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
              </motion.div>
              <div className="relative h-32 w-32 overflow-hidden rounded-[2.5rem] border-4 border-yellow-500 bg-zinc-800 shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                {topThree[0].avatar ? (
                  <img src={topThree[0].avatar} alt={topThree[0].username} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-black text-yellow-500">
                    {topThree[0].username[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-3 -right-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-500 text-black shadow-xl">
                <Star className="h-7 w-7 fill-black" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-3xl font-black text-white">{topThree[0].username}</h3>
              <p className="text-2xl font-black text-yellow-500">{formatCurrency(topThree[0].cashBalance)}</p>
            </div>
            <div className="h-48 w-full rounded-t-[3rem] bg-gradient-to-b from-yellow-500/20 to-transparent border-x border-t border-yellow-500/20" />
          </motion.div>
        )}

        {/* Bronze - Rank 3 */}
        {topThree[2] && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="order-3 flex flex-col items-center space-y-6"
          >
            <div className="relative">
              <div className="absolute -inset-4 animate-pulse rounded-full bg-orange-700/10 blur-xl" />
              <div className="relative h-24 w-24 overflow-hidden rounded-[2rem] border-4 border-orange-700 bg-zinc-800 shadow-2xl">
                {topThree[2].avatar ? (
                  <img src={topThree[2].avatar} alt={topThree[2].username} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-black text-orange-700">
                    {topThree[2].username[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-700 text-white shadow-lg">
                <Medal className="h-6 w-6" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black text-white">{topThree[2].username}</h3>
              <p className="text-lg font-black text-orange-700">{formatCurrency(topThree[2].cashBalance)}</p>
            </div>
            <div className="h-24 w-full rounded-t-[2rem] bg-gradient-to-b from-orange-700/20 to-transparent border-x border-t border-orange-700/20" />
          </motion.div>
        )}
      </div>

      {/* Rest of Leaderboard */}
      <div className="mx-auto max-w-4xl overflow-hidden rounded-[3rem] border border-white/5 bg-zinc-900/20 backdrop-blur-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
              <th className="px-10 py-6">Rank</th>
              <th className="px-10 py-6">Trader</th>
              <th className="px-10 py-6 text-right">Portfolio Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <AnimatePresence>
              {rest.map((trader, index) => (
                <motion.tr 
                  key={trader.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="group hover:bg-white/5 transition-all"
                >
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-sm font-black text-zinc-500 border border-white/5 group-hover:border-orange-500/30 group-hover:text-orange-500 transition-all">
                        {index + 4}
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 overflow-hidden rounded-2xl bg-zinc-800 border border-white/5">
                        {trader.avatar ? (
                          <img src={trader.avatar} alt={trader.username} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-black text-zinc-600">
                            {trader.username[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-lg font-black text-white group-hover:text-orange-500 transition-colors">
                          {trader.username}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-green-500">
                          <ArrowUp className="h-3 w-3" />
                          Rising
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <span className="font-mono text-xl font-black text-white">
                      {formatCurrency(trader.cashBalance)}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {loading && (
              [1,2,3,4,5].map(i => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={3} className="px-10 py-10">
                    <div className="h-12 w-full rounded-2xl bg-zinc-800/50" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default LeaderboardPage;
