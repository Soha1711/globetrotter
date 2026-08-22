import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CityCard from '../components/CityCard';
import TripCard from '../components/TripCard';
import { CityCardSkeleton, TripCardSkeleton } from '../components/SkeletonLoader';
import {
  Globe, Search, SlidersHorizontal, LogOut, Plus, User as UserIcon,
  MapPin, ChevronDown, X, Compass, Clock, Calendar, TrendingUp
} from 'lucide-react';

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Name (A-Z)', value: 'name_asc' },
  { label: 'Name (Z-A)', value: 'name_desc' },
];

const FILTER_OPTIONS = [
  { label: 'All Trips', value: 'all' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Past', value: 'past' },
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
];

export default function MainLanding() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [cities, setCities] = useState([]);
  const [trips, setTrips] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [tripsLoading, setTripsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('all');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Fetch top cities
  useEffect(() => {
    fetch('/api/cities?limit=5')
      .then(r => r.json())
      .then(data => { setCities(data.cities || []); setCitiesLoading(false); })
      .catch(() => setCitiesLoading(false));
  }, []);

  // Fetch user trips
  useEffect(() => {
    fetch('/api/trips', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { setTrips(data.trips || []); setTripsLoading(false); })
      .catch(() => setTripsLoading(false));
  }, [token]);

  // Client-side filtered + sorted trips
  const filteredTrips = useMemo(() => {
    const now = new Date();
    let result = [...trips];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.stops?.some(s => s.city?.name?.toLowerCase().includes(q) || s.city?.country?.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (filterBy === 'upcoming') result = result.filter(t => t.startDate && new Date(t.startDate) >= now);
    else if (filterBy === 'past') result = result.filter(t => t.endDate && new Date(t.endDate) < now);
    else if (filterBy === 'public') result = result.filter(t => t.isPublic);
    else if (filterBy === 'private') result = result.filter(t => !t.isPublic);

    // Sort
    if (sortBy === 'newest') result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sortBy === 'oldest') result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    else if (sortBy === 'name_asc') result.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'name_desc') result.sort((a, b) => b.name.localeCompare(a.name));

    return result;
  }, [trips, searchQuery, sortBy, filterBy]);

  const activeFilter = FILTER_OPTIONS.find(f => f.value === filterBy);
  const activeSort = SORT_OPTIONS.find(s => s.value === sortBy);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight gradient-text">GlobeTrotter</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <Link to="/" className="text-white font-semibold">Dashboard</Link>
            <Link to="/trips" className="hover:text-white transition-colors">My Trips</Link>
            <Link to="/search" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Compass className="w-4 h-4" /> Explore
            </Link>
            <Link to="/trips/new" className="hover:text-white transition-colors">Plan Trip</Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="flex items-center gap-2">
              {user?.profilePhotoUrl
                ? <img src={user.profilePhotoUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-blue-500" />
                : <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-slate-300" />
                  </div>
              }
              <div className="hidden md:block">
                <p className="text-xs font-bold leading-tight">{user?.firstName} {user?.lastName}</p>
                <p className="text-[10px] text-slate-400 leading-tight">{user?.city || user?.country || 'Traveller'}</p>
              </div>
            </div>
            <button onClick={logout} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <div className="relative h-72 md:h-96 overflow-hidden flex-shrink-0">
        <img
          src="https://images.unsplash.com/photo-1488646953014-85cb44e25828"
          alt="World travel banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/20 to-slate-950" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p className="text-xs font-semibold tracking-widest uppercase text-blue-400 mb-3">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-xl mb-3">
            Welcome back, <span className="gradient-text">{user?.firstName}</span> ✈️
          </h1>
          <p className="text-slate-300 text-base max-w-lg">
            Explore destinations, plan itineraries, and track your travel memories across the globe.
          </p>
          <button
            id="plan-trip-hero-btn"
            onClick={() => navigate('/trips/new')}
            className="mt-6 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Plan a Trip
          </button>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="max-w-7xl mx-auto px-6 py-6 w-full">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              id="trip-search-input"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search trips by name, city, or country..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter dropdown */}
          <div className="relative">
            <button
              id="filter-btn"
              onClick={() => { setShowFilterMenu(!showFilterMenu); setShowSortMenu(false); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors
                ${filterBy !== 'all' ? 'border-blue-500 text-blue-400 bg-blue-500/10' : 'border-slate-800 text-slate-400 bg-slate-900 hover:border-slate-600 hover:text-slate-200'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilter?.label}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
            </button>
            {showFilterMenu && (
              <div className="absolute top-full mt-2 right-0 z-30 min-w-[160px] bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
                {FILTER_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setFilterBy(opt.value); setShowFilterMenu(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                      ${filterBy === opt.value ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-slate-300 hover:bg-slate-800'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              id="sort-btn"
              onClick={() => { setShowSortMenu(!showSortMenu); setShowFilterMenu(false); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-200 text-sm font-medium transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              {activeSort?.label}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
            </button>
            {showSortMenu && (
              <div className="absolute top-full mt-2 right-0 z-30 min-w-[180px] bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                      ${sortBy === opt.value ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-slate-300 hover:bg-slate-800'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-16 w-full flex-1 space-y-12">

        {/* ── Top Regional Selections ── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-extrabold text-white">Top Regional Selections</h2>
              <p className="text-sm text-slate-400 mt-0.5">Hottest destinations right now</p>
            </div>
            <Link to="/cities" className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
              View all <Compass className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory">
            {citiesLoading
              ? Array.from({ length: 5 }).map((_, i) => <CityCardSkeleton key={i} />)
              : cities.map(city => <div key={city.id} className="snap-start"><CityCard city={city} /></div>)
            }
          </div>
        </section>

        {/* ── Previous Trips ── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-extrabold text-white">Previous Trips</h2>
              <p className="text-sm text-slate-400 mt-0.5">
                {filteredTrips.length} {filteredTrips.length === 1 ? 'trip' : 'trips'}
                {(searchQuery || filterBy !== 'all') && ' matching your filters'}
              </p>
            </div>
            <button
              id="plan-trip-btn"
              onClick={() => navigate('/trips/new')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:from-blue-500 hover:to-indigo-500 transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Plan a Trip
            </button>
          </div>

          {tripsLoading ? (
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
              {Array.from({ length: 3 }).map((_, i) => <TripCardSkeleton key={i} />)}
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-5">
                <MapPin className="w-8 h-8 text-slate-600" />
              </div>
              {searchQuery || filterBy !== 'all' ? (
                <>
                  <h3 className="text-lg font-bold text-slate-300 mb-2">No trips match your filters</h3>
                  <p className="text-sm text-slate-500 mb-5">Try adjusting your search or filter options.</p>
                  <button onClick={() => { setSearchQuery(''); setFilterBy('all'); }} className="text-sm text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Clear filters
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-slate-300 mb-2">No trips planned yet</h3>
                  <p className="text-sm text-slate-500 mb-5">Start planning your first adventure!</p>
                  <button
                    onClick={() => navigate('/trips/new')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl"
                  >
                    <Plus className="w-4 h-4" /> Plan Your First Trip
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory">
              {filteredTrips.map(trip => <div key={trip.id} className="snap-start"><TripCard trip={trip} /></div>)}
            </div>
          )}
        </section>

      </div>

      {/* Floating + Plan a trip button (mobile) */}
      <button
        onClick={() => navigate('/trips/new')}
        className="fixed bottom-6 right-6 md:hidden z-40 flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-2xl shadow-blue-600/40 hover:from-blue-500 hover:to-indigo-500 transition-all"
      >
        <Plus className="w-5 h-5" />
        Plan a Trip
      </button>

    </div>
  );
}
