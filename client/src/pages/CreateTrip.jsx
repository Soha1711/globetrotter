import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CityCard from '../components/CityCard';
import { GridCardSkeleton } from '../components/SkeletonLoader';
import {
  Globe, ArrowLeft, Calendar, FileText, Image as ImageIcon,
  Loader2, AlertCircle, CheckCircle2, Sparkles, MapPin
} from 'lucide-react';

export default function CreateTrip() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    coverPhotoUrl: '',
    isPublic: false
  });

  const [selectedCityId, setSelectedCityId] = useState(null);
  const [suggestedCities, setSuggestedCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch 6 suggested cities
  useEffect(() => {
    fetch('/api/cities?limit=6')
      .then(r => r.json())
      .then(data => { setSuggestedCities(data.cities || []); setCitiesLoading(false); })
      .catch(() => setCitiesLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCitySelect = (city) => {
    setSelectedCityId(prev => prev === city.id ? null : city.id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Please provide a trip name.');
      return;
    }
    if (form.startDate && form.endDate && new Date(form.startDate) > new Date(form.endDate)) {
      setError('End date cannot be before start date.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        coverPhotoUrl: form.coverPhotoUrl.trim() || null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        isPublic: form.isPublic,
        initialCityId: selectedCityId || null
      };

      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create trip.');
      }

      navigate(`/trips/${data.trip.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create trip.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCity = suggestedCities.find(c => c.id === selectedCityId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-extrabold gradient-text">Create New Trip</span>
            </div>
          </div>
          <button
            form="create-trip-form"
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:from-blue-500 hover:to-indigo-500 transition-all disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Save Trip
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">

          {/* ── Left: Form ── */}
          <div>
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form id="create-trip-form" onSubmit={handleSubmit} className="space-y-6">

              {/* Trip Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Trip Name *
                </label>
                <input
                  id="trip-name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Grand European Adventure"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Description</span>
                </label>
                <textarea
                  id="trip-description"
                  name="description"
                  rows={4}
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe your trip — highlights, goals, travel style..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Start Date</span>
                  </label>
                  <input
                    id="trip-start-date"
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> End Date</span>
                  </label>
                  <input
                    id="trip-end-date"
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    onChange={handleChange}
                    min={form.startDate || undefined}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Cover Photo URL */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  <span className="flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Cover Photo URL</span>
                </label>
                <input
                  id="trip-cover-photo"
                  type="url"
                  name="coverPhotoUrl"
                  value={form.coverPhotoUrl}
                  onChange={handleChange}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                {/* Preview */}
                {form.coverPhotoUrl && (
                  <div className="mt-3 h-36 rounded-xl overflow-hidden border border-slate-800">
                    <img
                      src={form.coverPhotoUrl}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>

              {/* Public toggle */}
              <div className="flex items-center gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <input
                  id="trip-public"
                  type="checkbox"
                  name="isPublic"
                  checked={form.isPublic}
                  onChange={handleChange}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
                <label htmlFor="trip-public" className="text-sm text-slate-300 cursor-pointer">
                  <span className="font-semibold text-white">Make trip public</span>
                  <span className="block text-xs text-slate-500 mt-0.5">Allow other GlobeTrotter users to discover your itinerary</span>
                </label>
              </div>

              {/* Mobile submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full lg:hidden py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm rounded-xl shadow-lg hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><CheckCircle2 className="w-4 h-4" /> Save Trip</>}
              </button>

            </form>
          </div>

          {/* ── Right: City Suggestions ── */}
          <div>
            <div className="sticky top-24">
              <div className="mb-5">
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  Suggestions for Places to Visit
                </h2>
                <p className="text-xs text-slate-400 mt-1">Click a city to pre-select it as your first stop</p>
              </div>

              {selectedCity && (
                <div className="mb-4 flex items-center gap-2.5 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-blue-300 truncate">Starting in: {selectedCity.name}</p>
                    <p className="text-[10px] text-slate-400">{selectedCity.country}</p>
                  </div>
                  <button onClick={() => setSelectedCityId(null)} className="ml-auto text-slate-500 hover:text-slate-300 shrink-0">
                    <span className="text-xs">✕</span>
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {citiesLoading
                  ? Array.from({ length: 6 }).map((_, i) => <GridCardSkeleton key={i} />)
                  : suggestedCities.map(city => (
                    <div key={city.id} className="relative">
                      <CityCard
                        city={city}
                        onClick={handleCitySelect}
                        selected={selectedCityId === city.id}
                        compact
                      />
                    </div>
                  ))
                }
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
