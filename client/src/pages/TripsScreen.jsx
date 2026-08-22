import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Globe, Search, SlidersHorizontal, LogOut, Plus, User as UserIcon,
  MapPin, Calendar, ChevronDown, X, TrendingUp, Clock, Calendar as CalendarIcon,
  LayoutGrid, Filter, Clock1, Flag, Eye, EyeOff, Sliders
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
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
];

export default function TripsScreen() {
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

  // Fetch user trips
  useEffect(() => {
    fetch('/api/trips', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { 
        setTrips(data.trips || []); 
        setTripsLoading(false); 
      })
      .catch(() => setTripsLoading(false));
  }, [token]);

  // Fetch top cities (optional, for hero section)
  useEffect(() => {
    fetch('/api/cities?limit=5')
      .then(r => r.json())
      .then(data => { setCities(data.cities || []); setCitiesLoading(false); })
      .catch(() => setCitiesLoading(false));
  }, []);

  // Helper: bucket trip by status relative to today
  const today = new Date();
  const bucketTrip = (trip) => {
    const start = trip.startDate ? new Date(trip.startDate) : null;
    const end = trip.endDate ? new Date(trip.endDate) : null;
    const now = today;

    // If no dates, treat as ongoing/unspecified
    if (!start && !end) return 'ongoing';

    // Ongoing: today falls within start/end (inclusive)
    if (start && end) {
      return now >= start && now <= end ? 'ongoing' : 'past'; // simplified: if today is between, ongoing; else past
    }
    // If only start date, ongoing if today >= start
    if (start && !end) return now >= start ? 'ongoing' : 'past';
    // If only end date, ongoing if today <= end
    if (!start && end) return now <= end ? 'ongoing' : 'past';

    return 'past';
  };

  // Client-side filtered/sorted trips
  const filteredTrips = useMemo(() => {
    let result = [...trips];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Filter by status
    if (filterBy !== 'all') {
      result = result.filter(t => bucketTrip(t).value === filterBy || bucketTrip(t).label === filterBy);
    }

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
    <div className="min-h-screen bg-slate-950 text-slate-100">

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
            <Link to="/trips/new" className="hover:text-white transition-colors">Plan Trip</Link>
          </nav>

          <div className="flex items-center gap-3">
            {user?.profilePhotoUrl
              ? <img src={user.profilePhotoUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-blue-500" />
              : <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-slate-300" />
                </div>
              }
              <div className="hidden md:block">
                <p className="text-xs font-bold leading-tight">{user?.firstName} {user?.lastName}</p>
                <p className="text-[10px] text-slate-400">{user?.city || user?.country || 'Traveller'}</p>
              </div>
            }
            <button onClick={logout} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero Banner with City Selections ── */}
      <div className="relative h-72 md:h-96 overflow-hidden flex-shrink-0">
        <img
          src="https://images.unsplash.com/photo-1488646953014-85cb44e25828"
          alt="World travel banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/20 to-slate-950" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p className="text-xs font-semibold tracking-widest uppercase text-blue-400 mb-3">Your Travel Dashboard</p>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-xl mb-3">
            Welcome back, <span className="gradient-text">{user?.firstName}</span> 🌍
          </h1>
          <p className="text-slate-300 text-base max-w-lg">
            Overview of your trips organized by status and date range.
          </p>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="max-w-7xl mx-auto px-6 py-4 w-full">
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

      {/* ── Trips by Status Buckets ── */}
      <div className="max-w-7xl mx-auto px-6 pb-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">

          {/* ── Ongoing Trips ── */}
          <section>
            <div>
              <h2 className="text-xl font-extrabold text-white">Ongoing Trips</h2>
              <p className="text-sm text-slate-400 mt-1">Trips currently in progress</p>
            </div>
            <div className="space-y-4">
{filteredTrips
                .filter(t => bucketTrip(t) === 'ongoing')
                .map(trip => {
                  const stopCount = trip.stops?.length || 0;
                  const start = trip.startDate ? new Date(trip.startDate) : null;
                  const end = trip.endDate ? new Date(trip.endDate) : null;
                  const today = new Date();
                  const isOngoing = start && end ? today >= start && today <= end : start ? today >= start : end ? today <= end : true;
                  const statusClass = isOngoing ? 'text-emerald-400' : 'text-slate-500';
                  return (
                    <div
                      key={trip.id}
                      className={`group rounded-2xl border border-slate-800 bg-slate-950 hover:border-slate-700 hover:scale-[1.02] transition-all p-5 flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white truncate">{trip.name}</h3>
                          <p className="text-xs text-slate-400">
                            {start ? start.toLocaleDateString() : '—'} → {end ? end.toLocaleDateString() : '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${statusClass}`}>
                          {isOngoing ? 'Ongoing' : 'Completed'}
                        </span>
                        <span className="text-[10px] text-slate-500">({stopCount} {(stopCount === 1 ? 'stop' : 'stops')})</span>
                        <Link
                          to={`/trips/${trip.id}/view`}
                          className="ml-2 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  );
                })}
                {sections.length === 0 || !filteredTrips.some(t => bucketTrip(t) === 'ongoing') ? (
                  <p className="text-sm text-slate-500 py-6">No ongoing trips planned.</p>
                ) : null}
              </div>
            </section>

          {/* ── Upcoming Trips ── */}
          <section>
            <div>
              <h2 className="text-xl font-extrabold text-white">Upcoming Trips</h2>
              <p className="text-sm text-slate-400 mt-1">Trips starting in the future</p>
            </div>
            <div className="space-y-4">
              {filteredTrips
                .filter(t => bucketTrip(t) === 'upcoming')
                .map(trip => {
                  const stopCount = trip.stops?.length || 0;
                  const start = trip.startDate ? new Date(trip.startDate) : null;
                  const isUpcoming = start && new Date() < start;
                  const statusClass = isUpcoming ? 'text-emerald-400' : 'text-slate-500';
                  return (
                    <div
                      key={trip.id}
                      className={`group rounded-2xl border border-slate-800 bg-slate-950 hover:border-slate-700 hover:scale-[1.02] transition-all p-5 flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-3">
                        <CalendarIcon className="w-4 h-4 text-indigo-400" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white truncate">{trip.name}</h3>
                          <p className="text-xs text-slate-400">
                            Start: {start ? start.toLocaleDateString() : '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${statusClass}`}>
                          {isUpcoming ? 'Upcoming' : 'Past'}
                        </span>
                        <span className="text-[10px] text-slate-500">({stopCount} {(stopCount === 1 ? 'stop' : 'stops')})</span>
                        <Link
                          to={`/trips/${trip.id}/view`}
                          className="ml-2 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  );
                })}
                {filteredTrips.length === 0 || !filteredTrips.some(t => bucketTrip(t) === 'upcoming') ? (
                  <p className="text-sm text-slate-500 py-6">No upcoming trips planned.</p>
                ) : null}
            </div>
          </section>

          {/* ── Completed Trips ── */}
          <section>
            <div>
              <h2 className="text-xl font-extrabold text-white">Completed Trips</h2>
              <p className="text-sm text-slate-400 mt-1">Trips you've already experienced</p>
            </div>
            <div className="space-y-4">
              {filteredTrips
                .filter(t => bucketTrip(t) === 'past')
                .map(trip => {
                  const stopCount = trip.stops?.length || 0;
                  const start = trip.startDate ? new Date(trip.startDate) : null;
                  const end = trip.endDate ? new Date(trip.endDate) : null;
                  const statusClass = 'text-slate-500';
                  return (
                    <div
                      key={trip.id}
                      className={`group rounded-2xl border border-slate-800 bg-slate-950 hover:border-slate-700 hover:scale-[1.02] transition-all p-5 flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-3">
                        <Clock1 className="w-4 h-4 text-slate-500" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white truncate">{trip.name}</h3>
                          <p className="text-xs text-slate-400">
                            {start ? start.toLocaleDateString() : '—'} → {end ? end.toLocaleDateString() : '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${statusClass}`}>Completed</span>
                        <span className="text-[10px] text-slate-500">({stopCount} {(stopCount === 1 ? 'stop' : 'stops')})</span>
                        <Link
                          to={`/trips/${trip.id}/view`}
                          className="ml-2 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  );
                })}
                {filteredTrips.length === 0 || !filteredTrips.some(t => bucketTrip(t) === 'past') ? (
                  <p className="text-sm text-slate-500 py-6">No completed trips yet.</p>
                ) : null}
            </div>
          </section>

        </div>
      </div>

    </div>
  );
}