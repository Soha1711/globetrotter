import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Globe, ArrowLeft, MapPin, Calendar, DollarSign, Search, Plus, Trash2,
  ChevronUp, ChevronDown, Loader2, AlertCircle, CheckCircle2, Sparkles,
  GripVertical, Clock, X, Layers
} from 'lucide-react';

const CATEGORY_COLORS = {
  SIGHTSEEING: 'bg-sky-500/20 text-sky-400',
  FOOD: 'bg-amber-500/20 text-amber-400',
  ADVENTURE: 'bg-rose-500/20 text-rose-400',
  CULTURE: 'bg-violet-500/20 text-violet-400',
  RELAXATION: 'bg-teal-500/20 text-teal-400',
  OTHER: 'bg-slate-500/20 text-slate-400',
};

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toDateInput(d) {
  if (!d) return '';
  const date = new Date(d);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-CA');
}

// Authenticated fetch wrapper following the AuthContext convention:
// throws Error(serverMessage) so callers can surface specific API failures.
async function api(url, token, method = 'GET', body = null) {
  const res = await fetch(url, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`
    },
    body: body ? JSON.stringify(body) : undefined
  });

  let data = {};
  try { data = await res.json(); } catch { /* non-JSON response */ }

  if (!res.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${res.status}).`);
  }
  return data;
}

let localKeyCounter = 0;
const nextLocalKey = () => `local_${Date.now()}_${localKeyCounter++}`;

function buildSectionFromStop(stop) {
  const attachedIds = (stop.stopActivities || []).map(sa => sa.activityId);
  return {
    key: stop.id,
    stopId: stop.id,
    title: stop.title || '',
    titleEdited: Boolean(stop.title),
    cityId: stop.city?.id || null,
    cityName: stop.city?.name || '',
    cityQuery: '',
    cityResults: [],
    citySearching: false,
    cityDropdownOpen: false,
    lastFetchedQuery: '',
    startDate: toDateInput(stop.startDate),
    endDate: toDateInput(stop.endDate),
    budget: stop.budget ?? '',
    selectedActivityIds: new Set(attachedIds),
    initialActivityIds: new Set(attachedIds),
    actsExpanded: false,
    cityActivities: [],
    activitiesLoading: false,
    activitiesLoaded: false,
  };
}

function blankSection() {
  return {
    key: nextLocalKey(),
    stopId: null,
    title: '',
    titleEdited: false,
    cityId: null,
    cityName: '',
    cityQuery: '',
    cityResults: [],
    citySearching: false,
    cityDropdownOpen: false,
    lastFetchedQuery: '',
    startDate: '',
    endDate: '',
    budget: '',
    selectedActivityIds: new Set(),
    initialActivityIds: new Set(),
    actsExpanded: false,
    cityActivities: [],
    activitiesLoading: false,
    activitiesLoaded: false,
  };
}

export default function TripBuilder() {
  const { tripId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [bannerError, setBannerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [sectionErrors, setSectionErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const successTimerRef = useRef(null);

  // ── Initial load ──
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await api(`/api/trips/${tripId}`, token);
        if (cancelled) return;
        setTrip(data.trip);
        setSections(data.trip.stops.map(buildSectionFromStop));
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err.message || 'Failed to load trip.');
        setLoading(false);
      }
    };

    if (token) load();
    return () => { cancelled = true; };
  }, [tripId, token]);

  useEffect(() => () => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
  }, []);

  const flashSuccess = (msg) => {
    setSuccessMsg(msg);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setSuccessMsg(''), 4000);
  };

  const fail = (msg) => {
    setBannerError(msg);
    setSuccessMsg('');
  };

  // ── Section mutations ──
  const updateSection = (key, updater) => {
    setSections(prev => prev.map(s => (s.key === key ? updater(s) : s)));
  };

  const patchSection = (key, patch) => updateSection(key, s => ({ ...s, ...patch }));

  const clearSectionError = (key, field) => {
    setSectionErrors(prev => {
      if (!prev[key]) return prev;
      const rest = { ...prev[key] };
      delete rest[field];
      const next = { ...prev };
      if (Object.keys(rest).length === 0) delete next[key]; else next[key] = rest;
      return next;
    });
  };

  const addSection = () => {
    setSections(prev => [...prev, blankSection()]);
    setSuccessMsg('');
  };

  const moveSection = (index, direction) => {
    setSections(prev => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setSectionErrors({});
  };

  const removeSection = async (index) => {
    const s = sections[index];
    const label = s.title || s.cityName || `Section ${index + 1}`;

    if (!window.confirm(`Remove "${label}" from this itinerary? Any activities attached to it will be removed too.`)) {
      return;
    }

    setBannerError('');

    if (!s.stopId) {
      setSections(prev => prev.filter(x => x.key !== s.key));
      return;
    }

    try {
      await api(`/api/trips/${tripId}/stops/${s.stopId}`, token, 'DELETE');
      setSections(prev => prev.filter(x => x.key !== s.key));
      flashSuccess('Section removed.');
    } catch (err) {
      fail(`Failed to remove section: ${err.message}`);
    }
  };

  // ── City search (debounced, per section) ──
  useEffect(() => {
    const timers = [];

    sections.forEach(s => {
      const q = s.cityQuery.trim();
      if (s.cityDropdownOpen && q && q.toLowerCase() !== s.lastFetchedQuery.toLowerCase()) {
        const t = setTimeout(async () => {
          patchSection(s.key, { citySearching: true });
          try {
            const data = await api(`/api/cities?search=${encodeURIComponent(q)}&limit=8`, token);
            updateSection(s.key, cur => ({
              ...cur,
              cityResults: data.cities || [],
              citySearching: false,
              lastFetchedQuery: q,
            }));
          } catch (err) {
            updateSection(s.key, cur => ({ ...cur, citySearching: false }));
            fail(`City search failed: ${err.message}`);
          }
        }, 300);
        timers.push(t);
      }
    });

    return () => timers.forEach(clearTimeout);
  }, [sections, token]);

  const selectCity = (key, city) => {
    updateSection(key, s => ({
      ...s,
      cityId: city.id,
      cityName: city.name,
      // Default the section title to the city name unless the traveller
      // already typed a custom one.
      title: s.titleEdited && s.title.trim() ? s.title : city.name,
      // New city → previous activity selection no longer applies. The diff
      // computed at save time detaches those activities server-side.
      selectedActivityIds: new Set(),
      cityActivities: [],
      activitiesLoaded: false,
      actsExpanded: false,
      cityQuery: '',
      cityResults: [],
      cityDropdownOpen: false,
    }));
    clearSectionError(key, 'city');
  };

  // ── Activities panel ──
  const toggleActivitiesPanel = async (key) => {
    const s = sections.find(x => x.key === key);
    if (!s) return;
    const opening = !s.actsExpanded;
    patchSection(key, { actsExpanded: opening });

    if (opening && !s.activitiesLoaded && s.cityId) {
      patchSection(key, { activitiesLoading: true });
      try {
        const data = await api(`/api/cities/${s.cityId}/activities`, token);
        patchSection(key, {
          cityActivities: data.activities || [],
          activitiesLoading: false,
          activitiesLoaded: true,
        });
      } catch (err) {
        patchSection(key, { activitiesLoading: false, actsExpanded: false });
        fail(`Failed to load activities: ${err.message}`);
      }
    }
  };

  const toggleActivity = (key, activityId) => {
    updateSection(key, s => {
      const next = new Set(s.selectedActivityIds);
      if (next.has(activityId)) next.delete(activityId);
      else next.add(activityId);
      return { ...s, selectedActivityIds: next };
    });
  };

  // ── Validation ──
  const validateSections = () => {
    const errors = {};

    sections.forEach((s, i) => {
      const label = `Section ${i + 1}`;
      const errs = {};

      if (!s.cityId) {
        errs.city = 'Select a destination city for this section.';
      }

      const hasStart = Boolean(s.startDate);
      const hasEnd = Boolean(s.endDate);
      if (hasStart !== hasEnd) {
        errs.dates = 'Provide both a start and end date.';
      } else if (hasStart && hasEnd) {
        const start = new Date(`${s.startDate}T00:00:00`);
        const end = new Date(`${s.endDate}T00:00:00`);

        if (start > end) {
          errs.dates = 'End date cannot be before start date.';
        } else {
          const tripStart = trip.startDate ? new Date(trip.startDate) : null;
          const tripEnd = trip.endDate ? new Date(trip.endDate) : null;
          const dayEnd = d => { const c = new Date(d); c.setHours(23, 59, 59, 999); return c; };

          if (tripStart && start < new Date(`${toDateInput(tripStart)}T00:00:00`)) {
            errs.dates = `Outside trip dates — starts before the trip begins (${formatDate(tripStart)}).`;
          } else if (tripEnd && end > dayEnd(new Date(`${toDateInput(tripEnd)}T00:00:00`))) {
            errs.dates = `Outside trip dates — ends after the trip ends (${formatDate(tripEnd)}).`;
          }
        }
      }

      if (s.budget !== '') {
        const n = Number(s.budget);
        if (isNaN(n) || n < 0) {
          errs.budget = 'Budget must be a non-negative number.';
        }
      }

      if (Object.keys(errs).length > 0) errors[s.key] = { label, ...errs };
    });

    // Overlap check between fully-dated sections (back-to-back is allowed)
    const dated = sections
      .map((s, i) => ({ s, i, start: s.startDate, end: s.endDate }))
      .filter(x => x.s.startDate && x.s.endDate)
      .sort((a, b) => a.start.localeCompare(b.start));

    for (let k = 0; k < dated.length - 1; k++) {
      const a = dated[k];
      const b = dated[k + 1];
      if (b.start < a.end) {
        const msgA = `Dates overlap with ${b.s.title || b.s.cityName || `Section ${b.i + 1}`} (Section ${b.i + 1}).`;
        const msgB = `Dates overlap with ${a.s.title || a.s.cityName || `Section ${a.i + 1}`} (Section ${a.i + 1}).`;
        errors[a.s.key] = {
          ...(errors[a.s.key] || {}),
          label: `Section ${a.i + 1}`,
          general: errors[a.s.key]?.general
            ? `${errors[a.s.key].general} ${msgA}`
            : msgA,
        };
        errors[b.s.key] = {
          ...(errors[b.s.key] || {}),
          label: `Section ${b.i + 1}`,
          general: errors[b.s.key]?.general
            ? `${msgB} ${errors[b.s.key].general}`
            : msgB,
        };
      }
    }

    return errors;
  };

  // ── Save ──
  const saveItinerary = async () => {
    setBannerError('');
    setSuccessMsg('');

    const errors = validateSections();
    if (Object.keys(errors).length > 0) {
      setSectionErrors(errors);
      setBannerError('Some sections need attention before the itinerary can be saved.');
      return;
    }
    setSectionErrors({});

    setSaving(true);

    try {
      for (let i = 0; i < sections.length; i++) {
        const s = sections[i];
        const label = s.title || s.cityName || `Section ${i + 1}`;

        const payload = {
          title: s.title.trim() || null,
          cityId: s.cityId,
          startDate: s.startDate || null,
          endDate: s.endDate || null,
          budget: s.budget === '' ? null : Number(s.budget),
          orderIndex: i,
        };

        let stopId = s.stopId;
        if (stopId) {
          await api(`/api/trips/${tripId}/stops/${stopId}`, token, 'PUT', payload);
        } else {
          const created = await api(`/api/trips/${tripId}/stops`, token, 'POST', payload);
          stopId = created.stop.id;
        }

        const adds = [...s.selectedActivityIds].filter(id => !s.initialActivityIds.has(id));
        const removes = [...s.initialActivityIds].filter(id => !s.selectedActivityIds.has(id));

        for (const activityId of adds) {
          await api(`/api/stops/${stopId}/activities`, token, 'POST', { activityId });
        }
        for (const activityId of removes) {
          await api(`/api/stops/${stopId}/activities/${activityId}`, token, 'DELETE');
        }
      }

      // Re-fetch from the server so the UI reflects what actually persisted
      const fresh = await api(`/api/trips/${tripId}`, token);
      setTrip(fresh.trip);
      setSections(fresh.trip.stops.map(buildSectionFromStop));
      flashSuccess('Itinerary saved successfully!');
    } catch (err) {
      fail(`Failed to save itinerary: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ── Render helpers ──
  const renderFieldError = (s, field) => (
    sectionErrors[s.key]?.[field] ? (
      <p className="mt-1.5 text-xs text-rose-400 flex items-start gap-1">
        <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
        {sectionErrors[s.key][field]}
      </p>
    ) : null
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <p className="text-lg font-semibold">{loadError}</p>
        <button onClick={() => navigate('/')} className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  const tripStart = formatDate(trip.startDate);
  const tripEnd = formatDate(trip.endDate);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/trips/${tripId}`)}
              className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
              title="Back to trip overview"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-extrabold gradient-text truncate max-w-[220px] sm:max-w-xs">Itinerary Builder</span>
            </div>
          </div>

          <button
            onClick={saveItinerary}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:from-blue-500 hover:to-indigo-500 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Save Itinerary
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* ── Trip context card ── */}
        <div className="mb-6 p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold text-white truncate">{trip.name}</h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              {tripStart || tripEnd
                ? <>Trip window: {tripStart || '—'} → {tripEnd || '—'}</>
                : 'No overall trip dates set — sections can use any dates.'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-slate-300">{sections.length} {sections.length === 1 ? 'section' : 'sections'}</span>
          </div>
        </div>

        {/* ── Banners ── */}
        {bannerError && (
          <div className="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{bannerError}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ── Empty state ── */}
        {sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-800 rounded-2xl">
            <MapPin className="w-10 h-10 text-slate-700 mb-3" />
            <h2 className="text-lg font-bold text-slate-300 mb-1">No sections yet</h2>
            <p className="text-sm text-slate-500 max-w-sm mb-6">
              Build your itinerary by adding sections — each one is a city visit with its own dates, budget, and activities.
            </p>
            <button
              onClick={addSection}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:from-blue-500 hover:to-indigo-500 transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" /> Add your first section
            </button>
          </div>
        ) : (
          <div className="space-y-5">

            {sections.map((s, idx) => {
              const err = sectionErrors[s.key];
              return (
                <div
                  key={s.key}
                  className={`relative pl-10 ${err ? '[&>*:last-child]:border-rose-500/50' : ''}`}
                >
                  {/* Timeline rail */}
                  <div className={`absolute left-0 top-5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md transition-colors
                    ${err
                      ? 'bg-rose-500 text-white shadow-rose-500/30'
                      : 'bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-blue-500/30'}`}>
                    {idx + 1}
                  </div>
                  {idx < sections.length - 1 && (
                    <div className="absolute left-3 top-12 w-px bg-slate-800" style={{ height: 'calc(100% - 2rem)' }} />
                  )}

                  <div className={`rounded-2xl border overflow-hidden transition-colors
                    ${err ? 'border-rose-500/40 bg-slate-900' : 'border-slate-800 bg-slate-900 hover:border-slate-700'}`}>

                    {/* Card header: drag handle, editable title, reorder/remove */}
                    <div className="flex items-center gap-2 p-4 border-b border-slate-800/60">
                      <GripVertical className="w-4 h-4 text-slate-700 shrink-0" aria-hidden="true" />

                      <input
                        type="text"
                        value={s.title}
                        onChange={e => patchSection(s.key, { title: e.target.value, titleEdited: true })}
                        placeholder={s.cityName ? s.cityName : 'Untitled section'}
                        className="flex-1 min-w-0 bg-transparent border border-transparent rounded-lg px-2 py-1 text-base font-bold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-slate-950/60 transition-colors"
                        aria-label={`Section ${idx + 1} title`}
                      />

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => moveSection(idx, -1)}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-600 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                          title="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveSection(idx, 1)}
                          disabled={idx === sections.length - 1}
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-600 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                          title="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeSection(idx)}
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors ml-1"
                          title="Remove section"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Section-level error (e.g. overlap) */}
                      {renderFieldError(s, 'general')}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* City selector */}
                        <div className="relative">
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                            Destination City *
                          </label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                            <input
                              type="text"
                              value={s.cityQuery}
                              onChange={e => patchSection(s.key, {
                                cityQuery: e.target.value,
                                cityDropdownOpen: true,
                              })}
                              onFocus={() => patchSection(s.key, { cityDropdownOpen: !!s.cityQuery.trim() })}
                              onBlur={() => setTimeout(() => patchSection(s.key, { cityDropdownOpen: false }), 150)}
                              placeholder={s.cityName ? `Change city (current: ${s.cityName})` : 'Search cities…'}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-9 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            />
                            {s.citySearching && (
                              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-400 animate-spin" />
                            )}
                          </div>

                          {s.cityDropdownOpen && s.cityQuery.trim() && (
                            <div className="absolute z-30 top-full mt-2 left-0 right-0 max-h-60 overflow-auto bg-slate-900 border border-slate-800 rounded-xl shadow-xl">
                              {!s.citySearching && s.cityResults.length === 0 && (
                                <p className="px-4 py-3 text-xs text-slate-500">No cities found for “{s.cityQuery}”.</p>
                              )}
                              {s.cityResults.map(city => (
                                <button
                                  key={city.id}
                                  onMouseDown={e => e.preventDefault()}
                                  onClick={() => selectCity(s.key, city)}
                                  className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-800 transition-colors"
                                >
                                  <span className="min-w-0">
                                    <span className="block text-sm font-semibold text-slate-200 truncate">{city.name}</span>
                                    <span className="block text-[10px] text-slate-500 truncate">{city.country}</span>
                                  </span>
                                  <span className="text-[10px] font-semibold text-blue-400 shrink-0 ml-3">{city.popularity}/100</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {s.cityId && !s.cityDropdownOpen && (
                            <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-blue-400" /> Selected: <span className="text-slate-300 font-medium">{s.cityName}</span>
                            </p>
                          )}
                          {renderFieldError(s, 'city')}
                        </div>

                        {/* Budget of this section */}
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Budget of this section</span>
                          </label>
                          <input
                            id={`section-budget-${s.key}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={s.budget}
                            onChange={e => { patchSection(s.key, { budget: e.target.value }); clearSectionError(s.key, 'budget'); }}
                            placeholder="e.g. 1200"
                            className={`w-full bg-slate-950 border rounded-xl py-2.5 px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 transition-colors
                              ${sectionErrors[s.key]?.budget
                                ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500'
                                : 'border-slate-800 focus:border-blue-500 focus:ring-blue-500'}`}
                          />
                          {renderFieldError(s, 'budget')}
                        </div>
                      </div>

                      {/* Date range */}
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Section Dates</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <input
                              id={`section-start-${s.key}`}
                              type="date"
                              value={s.startDate}
                              onChange={e => { patchSection(s.key, { startDate: e.target.value }); clearSectionError(s.key, 'dates'); }}
                              className={`w-full bg-slate-950 border rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:ring-1 transition-colors [color-scheme:dark]
                                ${sectionErrors[s.key]?.dates
                                  ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500'
                                  : 'border-slate-800 focus:border-blue-500 focus:ring-blue-500'}`}
                            />
                          </div>
                          <div>
                            <input
                              id={`section-end-${s.key}`}
                              type="date"
                              value={s.endDate}
                              onChange={e => { patchSection(s.key, { endDate: e.target.value }); clearSectionError(s.key, 'dates'); }}
                              className={`w-full bg-slate-950 border rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:ring-1 transition-colors [color-scheme:dark]
                                ${sectionErrors[s.key]?.dates
                                  ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500'
                                  : 'border-slate-800 focus:border-blue-500 focus:ring-blue-500'}`}
                            />
                          </div>
                        </div>
                        {renderFieldError(s, 'dates')}
                      </div>

                      {/* Add Activities (expandable) */}
                      <div className="pt-1">
                        <button
                          onClick={() => toggleActivitiesPanel(s.key)}
                          disabled={!s.cityId}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all
                            ${!s.cityId
                              ? 'border-slate-800 bg-slate-950 text-slate-600 cursor-not-allowed'
                              : s.actsExpanded
                                ? 'border-blue-500/40 bg-blue-500/10 text-blue-400'
                                : s.selectedActivityIds.size > 0
                                  ? 'border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                                  : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600 hover:text-white'}`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {s.selectedActivityIds.size > 0
                            ? `Add Activities (${s.selectedActivityIds.size} selected)`
                            : 'Add Activities'}
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${s.actsExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {s.actsExpanded && (
                          <div className="mt-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                            {s.activitiesLoading ? (
                              <div className="py-6 flex items-center justify-center gap-2 text-slate-400 text-sm">
                                <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> Loading activities…
                              </div>
                            ) : s.cityActivities.length === 0 ? (
                              <p className="py-4 text-center text-xs text-slate-500">
                                No activities registered for {s.cityName} yet.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {s.cityActivities.map(act => {
                                  const selected = s.selectedActivityIds.has(act.id);
                                  return (
                                    <button
                                      key={act.id}
                                      onClick={() => toggleActivity(s.key, act.id)}
                                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all
                                        ${selected
                                          ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/40'
                                          : 'border-slate-800 bg-slate-900 hover:border-slate-600'}`}
                                    >
                                      <div className={`shrink-0 w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-colors
                                        ${selected ? 'bg-blue-500 border-blue-500' : 'border-slate-600'}`}>
                                        {selected && (
                                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                          </svg>
                                        )}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-slate-200 leading-snug">{act.name}</p>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${CATEGORY_COLORS[act.category] || CATEGORY_COLORS.OTHER}`}>
                                            {act.category.replace('_', ' ')}
                                          </span>
                                          <span className="text-[10px] text-emerald-400 font-semibold">${Number(act.cost).toFixed(0)}</span>
                                          <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                                            <Clock className="w-2.5 h-2.5" />{act.durationHours}h
                                          </span>
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add another section */}
            <button
              onClick={addSection}
              disabled={saving}
              className="w-full py-4 rounded-2xl border border-dashed border-slate-700 text-slate-400 text-sm font-bold hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Add another Section
            </button>

            {/* Mobile-friendly save */}
            <button
              onClick={saveItinerary}
              disabled={saving}
              className="w-full sm:hidden py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm rounded-xl shadow-lg hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><CheckCircle2 className="w-4 h-4" /> Save Itinerary</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
