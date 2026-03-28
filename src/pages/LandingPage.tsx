import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';
import { Market } from '../types';
import { MarketCard } from '../components/MarketCard';
import { cn } from '../lib/utils';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, TrendingUp, Shield, Zap, Globe, BarChart3, Users } from 'lucide-react';

const LandingPage: React.FC = () => {
  const [featuredMarkets, setFeaturedMarkets] = useState<Market[]>([]);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const markets = await supabaseService.getFeaturedMarkets(3);
        setFeaturedMarkets(markets);
      } catch (err) {
        console.error('Error fetching featured markets:', err);
      }
    };
    fetchMarkets();
  }, []);

  return (
    <div className="relative space-y-32 pb-32">
      {/* Hero Section */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden pt-20 text-center">
        <motion.div
          style={{ y: y1, opacity }}
          className="absolute inset-0 -z-10 flex items-center justify-center"
        >
          <div className="h-[600px] w-[600px] rounded-full bg-orange-500/20 blur-[150px]" />
          <div className="absolute h-[400px] w-[800px] -rotate-12 rounded-full bg-blue-500/10 blur-[120px]" />
        </motion.div>
        
        <div className="container relative z-10 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-orange-500 backdrop-blur-md"
          >
            <Zap className="h-3 w-3 fill-orange-500" />
            The Future of Prediction Markets
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mx-auto max-w-5xl text-6xl font-black leading-[1.1] tracking-tighter text-white sm:text-8xl lg:text-9xl"
          >
            PREDICT <br />
            <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-500 bg-clip-text text-transparent">EVERYTHING.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto mt-8 max-w-2xl text-lg font-medium leading-relaxed text-zinc-400 sm:text-xl"
          >
            ForecastX is the world's most advanced binary prediction platform. 
            Trade on global events, tech breakthroughs, and market trends with zero risk.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-12 flex flex-wrap justify-center gap-6"
          >
            <Link 
              to="/markets" 
              className="group relative flex items-center gap-3 overflow-hidden rounded-full bg-orange-500 px-10 py-5 text-lg font-black uppercase tracking-widest text-black transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(249,115,22,0.4)] active:scale-95"
            >
              <span className="relative z-10">Start Trading</span>
              <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link 
              to="/leaderboard" 
              className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-10 py-5 text-lg font-black uppercase tracking-widest text-white transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
            >
              Leaderboard
            </Link>
          </motion.div>
        </div>

        {/* Floating Stats */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="container mt-24 grid grid-cols-2 gap-8 px-4 sm:grid-cols-4"
        >
          {[
            { label: 'Active Markets', value: '500+', icon: Globe },
            { label: 'Total Volume', value: '$12.4M', icon: BarChart3 },
            { label: 'Top Trader P/L', value: '+420%', icon: TrendingUp },
            { label: 'Active Users', value: '25K+', icon: Users },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center space-y-2">
              <stat.icon className="h-5 w-5 text-orange-500/50" />
              <span className="text-2xl font-black text-white">{stat.value}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Featured Markets */}
      <section className="container mx-auto px-4">
        <div className="mb-12 flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-end">
          <div className="text-center sm:text-left">
            <h2 className="text-4xl font-black tracking-tighter text-white sm:text-5xl">TRENDING MARKETS</h2>
            <p className="mt-2 text-lg font-medium text-zinc-500">The most anticipated outcomes right now.</p>
          </div>
          <Link to="/markets" className="group flex items-center gap-2 text-sm font-black uppercase tracking-widest text-orange-500 transition-colors hover:text-orange-400">
            View All Markets <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featuredMarkets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
          {featuredMarkets.length === 0 && (
             [1,2,3].map(i => (
               <div key={i} className="aspect-[16/10] animate-pulse rounded-[2rem] bg-zinc-900/50" />
             ))
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4">
        <div className="grid gap-8 lg:grid-cols-3">
          {[
            {
              title: "Pick Your Market",
              desc: "Browse hundreds of high-stakes markets across crypto, tech, sports, and global politics.",
              icon: Zap,
              color: "text-orange-500",
              bg: "bg-orange-500/10"
            },
            {
              title: "Trade with Precision",
              desc: "Buy YES or NO shares with real-time pricing. Our engine ensures instant execution and fair odds.",
              icon: TrendingUp,
              color: "text-blue-500",
              bg: "bg-blue-500/10"
            },
            {
              title: "Secure Settlement",
              desc: "Markets settle automatically based on verified outcomes. Build your reputation and virtual wealth.",
              icon: Shield,
              color: "text-green-500",
              bg: "bg-green-500/10"
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group flex flex-col items-center space-y-6 rounded-[2.5rem] border border-white/5 bg-zinc-900/30 p-10 text-center transition-all hover:bg-zinc-900/50 hover:border-white/10"
            >
              <div className={cn("flex h-20 w-20 items-center justify-center rounded-3xl transition-transform group-hover:scale-110 group-hover:rotate-6", feature.bg, feature.color)}>
                <feature.icon className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black text-white">{feature.title}</h3>
              <p className="text-lg font-medium leading-relaxed text-zinc-500">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-[3rem] bg-zinc-900 px-8 py-24 text-center border border-white/5">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-orange-500/10 via-transparent to-blue-500/10" />
          <div className="relative z-10 mx-auto max-w-3xl">
            <h2 className="text-5xl font-black tracking-tighter text-white sm:text-7xl">READY TO PREDICT?</h2>
            <p className="mt-6 text-xl font-medium text-zinc-400">Join thousands of traders and start building your virtual portfolio today.</p>
            <div className="mt-12 flex flex-wrap justify-center gap-6">
              <Link 
                to="/markets" 
                className="rounded-full bg-white px-12 py-5 text-lg font-black uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
