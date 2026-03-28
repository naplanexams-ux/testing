import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, 
  LayoutDashboard, 
  User as UserIcon, 
  LogOut, 
  LogIn,
  ShieldCheck,
  Trophy,
  Menu,
  X
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar: React.FC = () => {
  const { user, login, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { label: 'Markets', path: '/markets', icon: TrendingUp },
    { label: 'Portfolio', path: '/portfolio', icon: LayoutDashboard, protected: true },
    { label: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-10">
          <Link to="/" className="group flex items-center gap-2.5">
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 font-black text-black shadow-[0_0_15px_rgba(249,115,22,0.3)]"
            >
              F
            </motion.div>
            <span className="text-xl font-black tracking-tighter text-white">ForecastX</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              (!item.protected || user) && (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300",
                    location.pathname === item.path ? "text-orange-500" : "text-zinc-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {location.pathname === item.path && (
                    <motion.div 
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-full border border-orange-500/20 bg-orange-500/5"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              )
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-5">
              <div className="hidden flex-col items-end sm:flex">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Balance</span>
                <span className="font-mono text-sm font-black text-green-400">
                  {formatCurrency(user.cashBalance)}
                </span>
              </div>
              
              <div className="h-8 w-px bg-white/10 hidden sm:block" />

              {user.role === 'admin' && (
                <Link 
                  to="/admin" 
                  className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white"
                  title="Admin Dashboard"
                >
                  <ShieldCheck className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                  </span>
                </Link>
              )}

              <div className="group relative">
                <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-zinc-900 p-0.5 transition-all hover:border-orange-500/50 hover:ring-4 hover:ring-orange-500/10">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username} className="h-full w-full rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <UserIcon className="h-5 w-5 text-zinc-400" />
                  )}
                </button>
                
                <div className="invisible absolute right-0 top-full mt-2 w-56 origin-top-right scale-95 opacity-0 transition-all group-hover:visible group-hover:scale-100 group-hover:opacity-100">
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 p-1.5 shadow-2xl backdrop-blur-xl">
                    <div className="px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Account</p>
                      <p className="mt-1 truncate text-sm font-bold text-white">{user.username}</p>
                      <p className="truncate text-[10px] text-zinc-500">{user.email}</p>
                    </div>
                    <div className="h-px bg-white/5" />
                    <button
                      onClick={() => logout()}
                      className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-red-400 transition-all hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => login()}
              className="flex items-center gap-2 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-black text-black shadow-[0_4px_15px_rgba(249,115,22,0.3)] transition-all hover:shadow-[0_8px_25px_rgba(249,115,22,0.4)]"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </motion.button>
          )}

          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-zinc-400 md:hidden"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/5 bg-black md:hidden"
          >
            <div className="space-y-1 px-4 py-4">
              {navItems.map((item) => (
                (!item.protected || user) && (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all",
                      location.pathname === item.path ? "bg-orange-500/10 text-orange-500" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
