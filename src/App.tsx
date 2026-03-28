import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { isSupabaseConfigured } from './supabase';

// Lazy load pages
import LandingPage from './pages/LandingPage';
import MarketsPage from './pages/MarketsPage';
import MarketDetailPage from './pages/MarketDetailPage';
import PortfolioPage from './pages/PortfolioPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/" />;
  return <>{children}</>;
};

const SupabaseSetup = () => {
  const hasUrl = Boolean(import.meta.env.VITE_SUPABASE_URL);
  const hasKey = Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-4 text-zinc-100">
      <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <h1 className="mb-4 text-2xl font-bold text-orange-500">Supabase Configuration Required</h1>
        <p className="mb-6 text-zinc-400">
          It looks like your Supabase environment variables are missing or misnamed. Here is what the app currently sees:
        </p>
        <div className="mb-6 space-y-4 rounded-lg bg-black p-4 font-mono text-sm text-zinc-300">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-zinc-500">Key:</span> VITE_SUPABASE_URL
            </div>
            <span className={hasUrl ? "text-green-500" : "text-red-500"}>
              {hasUrl ? "✅ Found" : "❌ Missing"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-zinc-500">Key:</span> VITE_SUPABASE_ANON_KEY
            </div>
            <span className={hasKey ? "text-green-500" : "text-red-500"}>
              {hasKey ? "✅ Found" : "❌ Missing"}
            </span>
          </div>
        </div>
        <div className="mb-6 rounded bg-red-950/50 p-4 text-sm text-red-200 border border-red-900">
          <strong>Common mistakes to check:</strong>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Did you forget the <code>VITE_</code> prefix in the name?</li>
            <li>Are there accidental spaces before or after the name?</li>
            <li>Did you save the secrets after entering them?</li>
          </ul>
        </div>
        <p className="text-sm text-zinc-500">
          After fixing the variables, the app will automatically restart and connect.
        </p>
      </div>
    </div>
  );
};

export default function App() {
  if (!isSupabaseConfigured) {
    return <SupabaseSetup />;
  }

  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/markets" element={<MarketsPage />} />
            <Route path="/markets/:slug" element={<MarketDetailPage />} />
            <Route path="/portfolio" element={<ProtectedRoute><PortfolioPage /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}
