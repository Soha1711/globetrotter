import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AddToTripModal from '../components/shared/AddToTripModal';
import {
  Globe, Search, SlidersHorizontal, ChevronDown, X, LogOut,
  MapPin, Clock, DollarSign, Star, Compass, Sparkles, User as UserIcon,
  Grid3X3, List, TrendingUp, Loader2, AlertCircle, Plus
} from 'lucide-react';

const CATEGORIES = ['SIGHTSEEING', 'FOOD', 'ADVENTURE', 'CULTURE', 'RELAXATION', 'OTHER'];

const CATEGORY_META = {
  SIGHTSEEING: { label: 'Sightseeing', color: 'bg-sky-500/20 text-sky-400 border-sky-500/30' },
  FOOD:        { label: 'Food',        color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  ADVENTURE:   { label: 'Adventure',   color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  CULTURE:     { label: 'Culture',     color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
  RELAXATION:  { label: 'Relaxation',  color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
  OTHER:       { label: 'Other',       color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
};

const COST_INDEX_LABEL = { 1: 'Budget', 2: 'Affordable', 3: 'Moderate', 4: 'Upscale', 5: 'Luxury' };

// ── City Result Row ────────────────────────────────────────────────
function CityRow({ city, onAddToTrip }) {
  return (
    <div className="group flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 hover:bg-slate-900/80 transition-all">
      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-800">
        {city.imageUrl
          ? <img src={city.imageUrl} alt={city.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center"><Globe className="w-6 h-6 text-slate-600" /></div>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-bold text-white text-sm">{city.name}</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">{city.country}</span>
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {COST_INDEX_LABEL[city.costIndex] || 'Moderate'}
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-500" />
            {city.popularity}/100
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {city._count?.activities ?? 0} activities
          </span>
        </div>
      </div>

      {/* Actions */}
      <button
        id={`add-city-${city.id}`}
        onClick={() => onAddToTrip(city, 'city')}
        className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-blue-600/15 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold hover:bg-blue-600/25 hover:border-blue-400/50 transition-all active:scale-[0.97]"
      >
        <Plus className="w-3.5 h-3.5" /> Add to Trip
      </button>
    </div>
  );
}

// ── Activity Result Row ────────────────────────────────────────────
function ActivityRow({ activity, onAddToTrip }) {
  const meta = CATEGORY_META[activity.category] || CATEGORY_META.OTHER;
  return (
    <div className="group flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 hover:bg-slate-900/80 transition-all">
      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-800">
        {activity.imageUrl
          ? <img src={activity.imageUrl} alt={activity.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center"><Sparkles className="w-6 h-6 text-slate-600" /></div>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-bold text-white text-sm truncate">{activity.name}</h3>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${meta.color}`}>
            {meta.label}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 flex-wrap">
          {activity.city && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />{activity.city.name}, {activity.city.country}
            </span>
          )}
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />${Number(activity.cost).toFixed(0)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />{activity.durationHours}h
          </span>
        </div>
        {activity.description && (
          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{activity.description}</p>
        )}
      </div>

      {/* Actions */}
      <button
        id={`add-activity-${activity.id}`}
        onClick={() => onAddToTrip(activity, 'activity')}
        className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-bold hover:bg-indigo-600/25 hover:border-indigo-400/50 transition-all active:scale-[0.97]"
      >
        <Plus className="w-3.5 h-3.5" /> Add to Trip
      </button>
    </div>
  );
}

// ── Dropdown helper ────────────────────────────────────────────────
function Dropdown({ label, icon: Icon, active, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors whitespace-nowrap
          ${active ? 'border-blue-500 text-blue-400 bg-blue-500/10' : 'border-slate-800 text-slate-400 bg-slate-900 hover:border-slate-600 hover:text-slate-200'}`}
      >
        {Icon && <Icon className="w-4 h-4" />}
        {label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-2 right-0 z-30 min-w-[175px] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                ${value === opt.value ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Search Page ───────────────────────────────────────────────
export default function SearchPage() {
  const { user, token, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode: 'cities' | 'activities'
  const [mode, setMode] = useState(searchParams.get('mode') || 'cities');

  // Shared state
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // City-specific filters
  const [filterCountry, setFilterCountry] = useState('');
  const [sortCity, setSortCity] = useState('popularity');

  // Activity-specific filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMinCost, setFilterMinCost] = useState('');
  const [filterMaxCost, setFilterMaxCost] = useState('');
  const [sortActivity, setSortActivity] = useState('name');

  // "Add to Trip" modal
  const [modalItem, setModalItem] = useState(null);    // { item, itemType }

  // Countries derived from results (for cities mode filter)
  const [countryOptions, setCountryOptions] = useState([]);

  // Debounce search query
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(id);
  }, [query]);

  // Sync URL params on mode/query change
  useEffect(() => {
    const params = {};
    if (mode !== 'cities') params.mode = mode;
    if (query) params.q = query;
    setSearchParams(params, { replace: true });
  }, [mode, query]);

  // Fetch results
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError('');

    const fetchData = async () => {
      try {
        let url = '';
        if (mode === 'cities') {
          const p = new URLSearchParams();
          if (debouncedQuery) p.set('search', debouncedQuery);
          if (filterCountry) p.set('country', filterCountry);
          url = `/api/cities?${p.toString()}`;
        } else {
          const p = new URLSearchParams();
          if (debouncedQuery) p.set('search', debouncedQuery);
          if (filterCategory) p.set('category', filterCategory);
          if (filterMinCost) p.set('minCost', filterMinCost);
          if (filterMaxCost) p.set('maxCost', filterMaxCost);
          url = `/api/activities?${p.toString()}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        if (cancelled) return;

        if (mode === 'cities') {
          let items = data.cities || [];
          // Client-side sort
          if (sortCity === 'popularity') items = [...items].sort((a, b) => b.popularity - a.popularity);
          else if (sortCity === 'name') items = [...items].sort((a, b) => a.name.localeCompare(b.name));
          else if (sortCity === 'cost_asc') items = [...items].sort((a, b) => a.costIndex - b.costIndex);
          else if (sortCity === 'cost_desc') items = [...items].sort((a, b) => b.costIndex - a.costIndex);
          setResults(items);
          // Build unique countries for dropdown
          const countries = [...new Set(items.map(c => c.country))].sort();
          setCountryOptions(countries);
        } else {
          let items = data.activities || [];
          if (sortActivity === 'name') items = [...items].sort((a, b) => a.name.localeCompare(b.name));
          else if (sortActivity === 'cost_asc') items = [...items].sort((a, b) => a.cost - b.cost);
          else if (sortActivity === 'cost_desc') items = [...items].sort((a, b) => b.cost - a.cost);
          else if (sortActivity === 'duration') items = [...items].sort((a, b) => b.durationHours - a.durationHours);
          setResults(items);
        }
      } catch {
        if (!cancelled) setFetchError('Failed to load results. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [mode, debouncedQuery, filterCountry, filterCategory, filterMinCost, filterMaxCost, sortCity, sortActivity]);

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setResults([]);
    setFilterCountry('');
    setFilterCategory('');
    setFilterMinCost('');
    setFilterMaxCost('');
  };

  const handleAddToTrip = (item, itemType) => {
    setModalItem({ item, itemType });
  };

  const clearAllFilters = () => {
    setQuery('');
    setFilterCountry('');
    setFilterCategory('');
    setFilterMinCost('');
    setFilterMaxCost('');
  };

  const hasActiveFilters = query || filterCountry || filterCategory || filterMinCost || filterMaxCost;

  const cityCountryOpts = [
    { value: '', label: 'All Countries' },
    ...countryOptions.map(c => ({ value: c, label: c }))
  ];

  const citySortOpts = [
    { value: 'popularity', label: 'Most Popular' },
    { value: 'name', label: 'Name (A–Z)' },
    { value: 'cost_asc', label: 'Cost (Low → High)' },
    { value: 'cost_desc', label: 'Cost (High → Low)' },
  ];

  const activityCategoryOpts = [
    { value: '', label: 'All Categories' },
    ...CATEGORIES.map(c => ({ value: c, label: CATEGORY_META[c].label }))
  ];

  const activitySortOpts = [
    { value: 'name', label: 'Name (A–Z)' },
    { value: 'cost_asc', label: 'Cost (Low → High)' },
    { value: 'cost_desc', label: 'Cost (High → Low)' },
    { value: 'duration', label: 'Longest Duration' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight gradient-text">GlobeTrotter</span>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <Link to="/" className="hover:text-white transition-colors">Dashboard</Link>
            <Link to="/trips" className="hover:text-white transition-colors">My Trips</Link>
            <Link to="/search" className="text-white font-semibold flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-blue-400" /> Explore
            </Link>
            <Link to="/trips/new" className="hover:text-white transition-colors">Plan Trip</Link>
          </nav>

          {/* User + Logout */}
          <div className="flex items-center gap-3">
            {user?.profilePhotoUrl
              ? <img src={user.profilePhotoUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-blue-500" />
              : <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-slate-300" />
                </div>
            }
            <div className="hidden md:block">
              <p className="text-xs font-bold leading-tight">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] text-slate-400">{user?.city || 'Traveller'}</p>
            </div>
            <button onClick={logout} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden border-b border-slate-800/60">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-slate-950 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-10">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Explore & Discover</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
            Find Cities & <span className="gradient-text">Activities</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-lg">
            Discover destinations and experiences worldwide. Add them directly to your planned itineraries.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* ── Mode Toggle ── */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl gap-1">
            <button
              id="mode-cities-btn"
              onClick={() => handleModeSwitch('cities')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === 'cities'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4" /> Cities
            </button>
            <button
              id="mode-activities-btn"
              onClick={() => handleModeSwitch('activities')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === 'activities'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" /> Activities
            </button>
          </div>

          {/* Result count badge */}
          {!loading && (
            <span className="text-xs font-semibold text-slate-500 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* ── Search + Filters Bar ── */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
          {/* Search input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              id="search-input"
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={mode === 'cities' ? 'Search cities or countries…' : 'Search activities…'}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* City-specific filters */}
          {mode === 'cities' && (
            <>
              <Dropdown
                label={filterCountry || 'Country'}
                icon={MapPin}
                active={!!filterCountry}
                options={cityCountryOpts}
                value={filterCountry}
                onChange={setFilterCountry}
              />
              <Dropdown
                label={citySortOpts.find(o => o.value === sortCity)?.label || 'Sort'}
                icon={TrendingUp}
                active={sortCity !== 'popularity'}
                options={citySortOpts}
                value={sortCity}
                onChange={setSortCity}
              />
            </>
          )}

          {/* Activity-specific filters */}
          {mode === 'activities' && (
            <>
              <Dropdown
                label={filterCategory ? CATEGORY_META[filterCategory]?.label : 'Category'}
                icon={SlidersHorizontal}
                active={!!filterCategory}
                options={activityCategoryOpts}
                value={filterCategory}
                onChange={setFilterCategory}
              />

              {/* Cost range */}
              <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl">
                <DollarSign className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  id="min-cost-input"
                  type="number"
                  min="0"
                  placeholder="Min $"
                  value={filterMinCost}
                  onChange={e => setFilterMinCost(e.target.value)}
                  className="w-16 bg-transparent text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                />
                <span className="text-slate-600 text-xs">–</span>
                <input
                  id="max-cost-input"
                  type="number"
                  min="0"
                  placeholder="Max $"
                  value={filterMaxCost}
                  onChange={e => setFilterMaxCost(e.target.value)}
                  className="w-16 bg-transparent text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                />
              </div>

              <Dropdown
                label={activitySortOpts.find(o => o.value === sortActivity)?.label || 'Sort'}
                icon={TrendingUp}
                active={sortActivity !== 'name'}
                options={activitySortOpts}
                value={sortActivity}
                onChange={setSortActivity}
              />
            </>
          )}

          {/* Clear all */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:text-rose-400 border border-slate-800 rounded-xl hover:border-rose-500/30 transition-all bg-slate-900"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* ── Results ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm text-slate-400">Searching…</p>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <AlertCircle className="w-8 h-8 text-rose-500" />
            <p className="text-slate-400 text-sm">{fetchError}</p>
            <button onClick={clearAllFilters} className="text-blue-400 hover:text-blue-300 text-sm font-semibold">
              Reset & retry
            </button>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-1">
              {mode === 'cities' ? <Globe className="w-7 h-7 text-slate-600" /> : <Sparkles className="w-7 h-7 text-slate-600" />}
            </div>
            <p className="text-slate-300 font-semibold">No {mode} found</p>
            <p className="text-slate-500 text-sm">Try adjusting your search or filters.</p>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="text-blue-400 hover:text-blue-300 text-sm font-medium mt-1 flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {mode === 'cities'
              ? results.map(city => (
                  <CityRow key={city.id} city={city} onAddToTrip={handleAddToTrip} />
                ))
              : results.map(activity => (
                  <ActivityRow key={activity.id} activity={activity} onAddToTrip={handleAddToTrip} />
                ))
            }
          </div>
        )}
      </div>

      {/* ── Add to Trip Modal ── */}
      {modalItem && (
        <AddToTripModal
          item={modalItem.item}
          itemType={modalItem.itemType}
          onClose={() => setModalItem(null)}
          onSuccess={() => setModalItem(null)}
        />
      )}

    </div>
  );
}
