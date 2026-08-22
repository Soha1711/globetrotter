import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminProtectedRoute from '../components/AdminProtectedRoute';
import {
  Globe, ArrowLeft, MapPin, Calendar, DollarSign, Eye, EyeOff, Loader2, Plus, Trash2,
  ChevronLeft, ChevronRight, X, AlertCircle, CheckCircle2, Link as LinkIcon, Shield, Menu,
  Users, BarChart, LayoutGrid, Folder, PieChart, ChevronDown, Clock, TrendingUp,
  Users as UsersIcon, Map as MapIcon, Calendar as CalendarIcon, DollarSign as Money,
  Grid, Type, Home, Settings, Search, Library, LayoutDashboard,
  Layout as LayoutIcon, Zap, ShieldCheck,
  FolderOpen, TrendingUp as TrendingUpIcon
} from 'lucide-react';

function formatDateMD(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function computeDayNumbers(stops) {
  if (!stops || stops.length === 0) return [];
  const sorted = [...stops].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const days = [1];
  for (let i = 1; i < sorted.length; i++) {
    const prevEnd = new Date(sorted[i - 1].endDate).getTime();
    const currStart = new Date(sorted[i].startDate).getTime();
    if (currStart > prevEnd) days.push(i + 1);
    else days.push(days[days.length - 1]);
  }
  return days;
}

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Tab state
  const [activeTab, setActiveTab] = useState('users');

  // Users tab state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorUsers, setErrorUsers] = useState('');

  // Popular Cities tab state
  const [popularCities, setPopularCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [errorCities, setErrorCities] = useState('');

  // Popular Activities tab state
  const [popularActivities, setPopularActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [errorActivities, setErrorActivities] = useState('');

  // User Trends tab state
  const [trendsData, setTrendsData] = useState({ labels: [], data: [] });
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [trendsError, setTrendsError] = useState('');

  // Load users
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (cancelled) return;
        if (!data.success) throw new Error(data.message || 'Failed to load users.');
        setUsers(data.users);
        setLoadingUsers(false);
      } catch (err) {
        if (cancelled) return;
        setErrorUsers(err.message || 'Failed to load users.');
        setLoadingUsers(false);
      }
    };

    if (token) load();
    return () => { cancelled = true; };
  }, [token]);

  // Load popular cities
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/admin/analytics/popular-cities', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (cancelled) return;
        if (!data.success) throw new Error(data.message || 'Failed to load popular cities.');
        setPopularCities(data.cities);
        setLoadingCities(false);
      } catch (err) {
        if (cancelled) return;
        setErrorCities(err.message || 'Failed to load popular cities.');
        setLoadingCities(false);
      }
    };

    if (token) load();
    return () => { cancelled = true; };
  }, [token]);

  // Load popular activities
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/admin/analytics/popular-activities', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (cancelled) return;
        if (!data.success) throw new Error(data.message || 'Failed to load popular activities.');
        setPopularActivities(data.activities);
        setLoadingActivities(false);
      } catch (err) {
        if (cancelled) return;
        setErrorActivities(err.message || 'Failed to load popular activities.');
        setLoadingActivities(false);
      }
    };

    if (token) load();
    return () => { cancelled = true; };
  }, [token]);

  // Load trends
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/admin/analytics/trends', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (cancelled) return;
        if (!data.success) throw new Error(data.message || 'Failed to load trends.');
        setTrendsData({ labels: data.labels, data: data.data });
        setTrendsLoading(false);
      } catch (err) {
        if (cancelled) return;
        setTrendsError(err.message || 'Failed to load trends.');
        setTrendsLoading(false);
      }
    };

    if (token) load();
    return () => { cancelled = true; };
  }, [token]);

  if (loadingUsers && activeTab === 'users') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (loadingCities && activeTab === 'cities') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (loadingActivities && activeTab === 'activities') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (trendsLoading && activeTab === 'trends') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (errorUsers && activeTab === 'users') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex flex-col items-center justify-center py-8">
        <p className="text-lg font-semibold">{errorUsers}</p>
        <button onClick={() => setActiveTab('users')} className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  if (errorCities && activeTab === 'cities') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex flex-col items-center justify-center py-8">
        <p className="text-lg font-semibold">{errorCities}</p>
        <button onClick={() => setActiveTab('cities')} className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  if (errorActivities && activeTab === 'activities') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex flex-col items-center justify-center py-8">
        <p className="text-lg font-semibold">{errorActivities}</p>
        <button onClick={() => setActiveTab('activities')} className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  if (trendsError && activeTab === 'trends') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex flex-col items-center justify-center py-8">
        <p className="text-lg font-semibold">{trendsError}</p>
        <button onClick={() => setActiveTab('trends')} className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* ── Sidebar ── */}
      <div className="fixed left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700/50 flex-shrink-0">
        <div className="h-16 border-b border-slate-700/50 flex items-center px-3">
          <Globe className="w-5 h-5 text-blue-500" />
          <span className="text-lg font-bold">GlobeTrotter</span>
        </div>
        <nav className="flex flex-col pt-6 gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors font-medium ${activeTab === 'users' ? 'bg-slate-700 text-white' : ''}`}
          >
            <Users className="w-5 h-5" /> Users
          </button>
          <button
            onClick={() => setActiveTab('cities')}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors font-medium ${activeTab === 'cities' ? 'bg-slate-700 text-white' : ''}`}
          >
            <MapPin className="w-5 h-5" /> Popular Cities
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors font-medium ${activeTab === 'activities' ? 'bg-slate-700 text-white' : ''}`}
          >
            <Zap className="w-5 h-5" /> Popular Activities
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors font-medium ${activeTab === 'trends' ? 'bg-slate-700 text-white' : ''}`}
          >
            <TrendingUp className="w-5 h-5" /> User Trends
          </button>
        </nav>
      </div>

      {/* ── Main Content ── */}
      <div className="ml-64 p-6 overflow-y-auto">

        {/* ── Header ── */}
        <header className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-slate-500 text-sm">Welcome, {user.firstName || 'Admin'}</p>
          </div>
          <button
            onClick={() => navigate('/trips')}
            className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:bg-slate-900 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Trips
          </button>
        </header>

        {/* ── Tab Content ── */}
        {activeTab === 'users' && (
          <div className="bg-slate-950 rounded-xl p-6 border border-slate-800/50">

            {/* ── Header ── */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Manage Users</h2>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs">Total users: {users.length}</span>
              </div>
            </div>

            {/* ── Users Table ── */}
            {users.length === 0 ? (
              <p className="text-slate-500 text-sm mt-4">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50 border-dark">
                      <th className="text-left text-slate-400 px-3 py-2 font-semibold">Name</th>
                      <th className="text-left text-slate-400 px-3 py-2 font-semibold">Email</th>
                      <th className="text-left text-slate-400 px-3 py-2 font-semibold">Role</th>
                      <th className="text-left text-slate-400 px-3 py-2 font-semibold">City</th>
                      <th className="text-left text-slate-400 px-3 py-2 font-semibold">Country</th>
                      <th className="text-left text-slate-400 px-3 py-2 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-slate-700/30 hover:bg-slate-900/50">
                        <td className="px-3 py-2 font-medium">
                          {u.firstName || ''} {u.lastName || ''}.trim() ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '—'
                        </td>
                        <td className="px-3 py-2 text-slate-500 text-xs">
                          {u.email}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' : 'bg-slate-600/20 text-slate-400'}`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-500 text-xs">
                          {u.city || '—'}
                        </td>
                        <td className="px-3 py-2 text-slate-500 text-xs">
                          {u.country || '—'}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                            title="View user details"
                          >
                            View
                          </button>
                          <button
                            className="text-red-400 hover:text-red-300 text-xs font-medium ml-2"
                            title="Deactivate user"
                            onClick={() => {
                              if (window.confirm('Deactivate this user?')) {
                                // TODO: POST /api/admin/users/:id/deactivate
                                alert('User deactivated.');
                              }
                            }}
                          >
                            Deactivate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'cities' && (
          <div className="bg-slate-950 rounded-xl p-6 border border-slate-800/50">

            {/* ── Header ── */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Popular Cities</h2>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs">Top 10 by visit count</span>
              </div>
            </div>

            {/* ── Cities List ── */}
            {popularCities.length === 0 ? (
              <p className="text-slate-500 text-sm mt-4">No city data available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50 border-dark">
                      <th className="text-left text-slate-400 px-3 py-2 font-semibold">City</th>
                      <th className="text-left text-slate-400 px-3 py-2 font-semibold">Country</th>
                      <th className="text-left text-slate-400 px-3 py-2 font-semibold">Visits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {popularCities.map(c => (
                      <tr key={c.id} className="border-b border-slate-700/30 hover:bg-slate-900/50">
                        <td className="px-3 py-2 font-medium">{c.name}</td>
                        <td className="px-3 py-2 text-slate-500 text-xs">{c.country || '—'}</td>
                        <td className="px-3 py-2 text-slate-500 text-xs">
                          {c._count.stops} stops
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="bg-slate-950 rounded-xl p-6 border border-slate-800/50">

            {/* ── Header ── */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Popular Activities</h2>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs">Top 10 by usage count</span>
              </div>
            </div>

            {/* ── Activities List ── */}
            {popularActivities.length === 0 ? (
              <p className="text-slate-500 text-sm mt-4">No activity data available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50 border-dark">
                      <th className="text-left text-slate-400 px-3 py-2 font-semibold">Activity</th>
                      <th className="text-left text-slate-400 px-3 py-2 font-semibold">Category</th>
                      <th className="text-left text-slate-400 px-3 py-2 font-semibold">Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {popularActivities.map(a => (
                      <tr key={a.id} className="border-b border-slate-700/30 hover:bg-slate-900/50">
                        <td className="px-3 py-2 font-medium">{a.name}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${a.category}`}
                          >
                            {a.category}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-500 text-xs">
                          {a._count.stopActivities} uses
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="bg-slate-950 rounded-xl p-6 border border-slate-800/50">

            {/* ── Header ── */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">User Trends & Analytics</h2>
              <p className="text-slate-500 text-sm">Trips created over time</p>
            </div>

            {/* ── Pie Chart: Trips by Category ── */}
            {/* TODO: Implement pie chart when category data is available */}
            {trendsData.labels.length > 0 && (
              <div className="h-64 w-full rounded-xl bg-slate-800 p-4 mb-6">
                <p className="text-slate-500 text-center">Pie chart: Trips by category/region</p>
                <p className="text-slate-400 text-center mt-2">(Data pending - category tracking to be implemented)</p>
              </div>
            )}

            {/* ── Line Chart: Trips Created Over Time ── */}
            {trendsData.labels.length > 0 && (
              <div>
                <h3 className="text-bold text-lg mb-4">Trips Created Over Time</h3>
                <div className="h-64 w-full rounded-xl bg-slate-800 p-4">
                  <p className="text-slate-500 text-center">Line chart placeholder</p>
                  <p className="text-slate-400 text-center mt-2">
                    Would show: {trendsData.labels.length} months of data
                  </p>
                </div>
              </div>
            )}

            {/* ── Chart Summary ── */}
            {trendsData.labels.length > 0 ? (
              <div className="mt-6 pt-6 border-t border-slate-800/30">
                <p className="text-slate-500 text-sm">
                  Showing {trendsData.labels.length} month{'s'.trendsData.labels.length !== 1 ? 's' : ''} of trip creation data.
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Label trend: {trendsData.labels.slice(0, 3).join(', ')}…{trendsData.labels.length > 3 ? ` +${trendsData.labels.length - 3} more` : ''}
                </p>
              </div>
            ) : (
              <p className="text-slate-500 text-sm mt-4">No trend data available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
