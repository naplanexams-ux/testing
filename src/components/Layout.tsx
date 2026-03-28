import React from 'react';
import { Navbar } from './Navbar';
import { Toaster } from 'sonner';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-black text-zinc-100 selection:bg-orange-500/30 selection:text-orange-500">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
      <footer className="mt-auto border-t border-white/5 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} ForecastX. Virtual money only. No real gambling.
          </p>
        </div>
      </footer>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
};
