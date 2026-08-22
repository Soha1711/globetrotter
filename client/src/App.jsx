import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Compass, Globe, MapPin, Sparkles, Server, CheckCircle2, AlertCircle } from 'lucide-react';

function LandingPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Backend health check failed:', err);
        setHealth({ status: 'error', message: 'Backend unreachable' });
        setLoading(false);
      });
  }, []);

  return (
    <div id="globetrotter-landing" className="min-h-screen relative flex flex-col justify-between overflow-hidden bg-slate-950 text-slate-100">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-50 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
              <Globe className="w-6 h-6 animate-pulse" />
            </div>
            <span className="text-xl font-extrabold tracking-tight gradient-text">
              GlobeTrotter
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-900 border border-slate-800">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span>Backend:</span>
              {loading ? (
                <span className="text-amber-400 animate-pulse">Checking...</span>
              ) : health?.status === 'ok' ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" /> Online (200)
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-400">
                  <AlertCircle className="w-3 h-3" /> Offline
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Content Placeholder */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 relative z-10 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mb-8">
          <Sparkles className="w-4 h-4" /> Personalized Multi-City Travel Planner
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          Explore the world with <br />
          <span className="gradient-text">effortless multi-city routes</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
          GlobeTrotter crafts seamless, intelligent itineraries across multiple destinations tailored to your budget, pacing, and preferences.
        </p>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all duration-300">
            <div className="p-3 w-fit rounded-xl bg-blue-500/10 text-blue-400 mb-4">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Smart Multi-City Route</h3>
            <p className="text-sm text-slate-400">Optimize travel legs, transfers, and stay durations effortlessly.</p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all duration-300">
            <div className="p-3 w-fit rounded-xl bg-indigo-500/10 text-indigo-400 mb-4">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Curated Itineraries</h3>
            <p className="text-sm text-slate-400">Personalized attraction recommendations matched to your travel pace.</p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all duration-300">
            <div className="p-3 w-fit rounded-xl bg-teal-500/10 text-teal-400 mb-4">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Full-Stack Powered</h3>
            <p className="text-sm text-slate-400">Vite + React SPA backed by Express, Prisma ORM, and PostgreSQL.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>© 2026 GlobeTrotter Repository Scaffold. Built by <a href="https://github.com/Soha1711" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Soha1711</a>.</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}
