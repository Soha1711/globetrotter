import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import { Compass, Globe, MapPin, Sparkles, Server, CheckCircle2, AlertCircle, LogOut, User as UserIcon } from 'lucide-react';

function Dashboard() {
  const { user, logout } = useAuth();
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
    <div id="globetrotter-dashboard" className="min-h-screen relative flex flex-col justify-between overflow-hidden bg-slate-950 text-slate-100">
      {/* Background Glows */}
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
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-900 border border-slate-800">
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

            {/* User Profile Badge & Logout */}
            <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
              <div className="flex items-center gap-2">
                {user?.profilePhotoUrl ? (
                  <img src={user.profilePhotoUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-blue-500" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold leading-tight text-slate-200">{user?.firstName} {user?.lastName}</p>
                  <p className="text-[10px] text-slate-400 leading-tight">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={logout}
                title="Logout"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 relative z-10 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mb-8">
          <Sparkles className="w-4 h-4" /> Welcome back, {user?.firstName}!
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
          Ready to plan your next <br />
          <span className="gradient-text">multi-city adventure?</span>
        </h1>

        <p className="text-base md:text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed">
          GlobeTrotter helps you explore destinations, build personalized multi-city stops, track activity budgets, and save unforgettable itineraries.
        </p>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all duration-300">
            <div className="p-3 w-fit rounded-xl bg-blue-500/10 text-blue-400 mb-4">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Smart Multi-City Planner</h3>
            <p className="text-sm text-slate-400">Organize ordered city stops and itinerary schedules seamlessly.</p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all duration-300">
            <div className="p-3 w-fit rounded-xl bg-indigo-500/10 text-indigo-400 mb-4">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Global City Activities</h3>
            <p className="text-sm text-slate-400">Discover sight-seeing, food, adventure, and culture recommendations.</p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all duration-300">
            <div className="p-3 w-fit rounded-xl bg-teal-500/10 text-teal-400 mb-4">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Authenticated Session</h3>
            <p className="text-sm text-slate-400">Secured with JWT tokens & bcrypt password encryption.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>© 2026 GlobeTrotter Application. Built by <a href="https://github.com/Soha1711" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Soha1711</a>.</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
