import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Globe, ArrowLeft, MapPin, Calendar, DollarSign, Eye, Loader2, Plus, Trash2, SlidersHorizontal, Filter, LayoutGrid, Clock, Calendar as CalendarIcon,
  ChevronDown, X, GitBranch
} from 'lucide-react';
import {
  BarChart, BarChart as RechartsBarChart, Bar as RechartsBar,
  PieChart, Pie as RechartsPie, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Category colors matching TripDetail.jsx
const CATEGORY_COLORS = {
  SIGHTSEEING: 'bg-sky-500/20 text-sky-400',
  FOOD: 'bg-amber-500/20 text-amber-400',
  ADVENTURE: 'bg-rose-500/20 text-rose-400',
  CULTURE: 'bg-violet-500/20 text-violet-400',
  RELAXATION: 'bg-teal-500/20 text-teal-400',
  OTHER: 'bg-slate-500/20 text-slate-400',
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function computeDayNumbers(stops) {
  // Given stops with startDate/endDate, compute sequential day numbers
  // A day number increments when a stop's start date passes the previous stop's end date
  if (!stops || stops.length === 0) return [];

  const sorted = [...stops].sort((a, b) =>
    (a.startDate || '').localeCompare(b.startDate || '')
  );

  const days = [];
  let currentDay = 1;
  let prevEnd = null;

  sorted.forEach((stop, i) => {
    const stopStart = stop.startDate ? new Date(stop.startDate) : null;
    const stopEnd = stop.endDate ? new Date(stop.endDate) : null;

    // If this is the first stop, or if the new stop starts after the previous ends,
    // increment the day number
    if (i === 0 || (prevEnd && stopStart > prevEnd)) {
      currentDay++;
    }

    days.push({
      stop,
      dayNumber: currentDay,
    });

    // Set prevEnd to this stop's end date (or start if no end)
    prevEnd = stopEnd || stopStart || null;
  });

  return days;
}

export default function ItineraryView() {
  const { tripId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [budgetData, setBudgetData] = useState({
    transportCost: 0,
    stayCost: 0,
    activitiesCost: 0,
    mealsCost: 0,
    grandTotal: 0,
  });
  const [dailyThreshold, setDailyThreshold] = useState(null);
  const [showBudget, setShowBudget] = useState(false);

  // Load trip detail + budget
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // Fetch full trip detail
        const tripRes = await fetch(`/api/trips/${tripId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const tripData = await tripRes.json();
        if (cancelled) return;
        if (!tripData.success) throw new Error(tripData.message || 'Trip not found.');
        setTrip(tripData.trip);

        // Fetch budget breakdown
        const budgetRes = await fetch(`/api/trips/${tripId}/budget`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const budgetData = await budgetRes.json();
        if (cancelled) return;
        if (budgetData.success) {
          setBudgetData({
            transportCost: budgetData.budget.transportCost || 0,
            stayCost: budgetData.budget.stayCost || 0,
            activitiesCost: budgetData.budget.activitiesCost || 0,
            mealsCost: budgetData.budget.mealsCost || 0,
            grandTotal: budgetData.grandTotal || 0,
          });
          setDailyThreshold(budgetData.dailyThreshold || null);
        }
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err.message || 'Failed to load itinerary.');
        setLoading(false);
      }
    };

    if (token) load();
    return () => { cancelled = true; };
  }, [tripId, token]);

  // Compute days from stops
  const daysData = useMemo(() => {
    if (!trip || !trip.stops) return [];
    return computeDayNumbers(trip.stops);
  }, [trip.stops]);

  // Group activities by day
  const activitiesByDay = useMemo(() => {
    const map = {};
    daysData.forEach(d => {
      if (!d.stop.stopActivities) return;
      d.stop.stopActivities.forEach(sa => {
        const act = sa.activity;
        if (!act) return;
        const dayKey = `day-${d.dayNumber}`;
        if (!map[dayKey]) map[dayKey] = [];
        map[dayKey].push({
          name: act.name,
          category: act.category,
          cost: act.cost || 0,
          duration: act.durationHours || 0,
          scheduledDate: sa.scheduledDate,
          scheduledTime: sa.scheduledTime,
        });
      });
    });
    return map;
  }, [daysData]);

  // Calculate per-day totals for threshold flagging
  const dayTotals = useMemo(() => {
    const totals = {};
    Object.keys(activitiesByDay).forEach(key => {
      const acts = activitiesByDay[key];
      totals[key] = acts.reduce((sum, a) => sum + a.cost, 0);
    });
    return totals;
  }, [activitiesByDay]);

  // Recharts chart components
  const BarChartComponent = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={[
        { name: 'Transport', cost: budgetData.transportCost },
        { name: 'Stay', cost: budgetData.stayCost },
        { name: 'Activities', cost: budgetData.activitiesCost },
        { name: 'Meals', cost: budgetData.mealsCost },
      ]}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend verticalAlign="bottom" height={36} />
        <Bar dataKey="cost" name="Cost" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );

  const PieChartComponent = () => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart data={[
        { name: 'Transport', cost: budgetData.transportCost },
        { name: 'Stay', cost: budgetData.stayCost },
        { name: 'Activities', cost: budgetData.activitiesCost },
        { name: 'Meals', cost: budgetData.mealsCost },
      ]}>
        <Tooltip />
        <Legend verticalAlign="bottom" height={36} />
        <Pie dataKey="cost" data={[
          { name: 'Transport', cost: budgetData.transportCost || 1 },
          { name: 'Stay', cost: budgetData.stayCost || 1 },
          { name: 'Activities', cost: budgetData.activitiesCost || 1 },
          { name: 'Meals', cost: budgetData.mealsCost || 1 },
        ]} fill={['#8884d8', '#82ca9e', '#8ad9ca', '#a3e635']} />
      </PieChart>
    </ResponsiveContainer>
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
          <ArrowLeft className="w-4 h-4" /> Back to Trips
        </button>
      </div>
    );
  }

  if (!trip) {
    return <div>Trip not found</div>;
  }

  const tripStart = formatDate(trip.startDate);
  const tripEnd = formatDate(trip.endDate);
  const stopCount = trip.stops?.length || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/trips/${tripId}`)}
              className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
              title="Back to trips list"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-extrabold gradient-text truncate max-w-xs">{trip.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border
              ${trip.isPublic ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
              {trip.isPublic ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              {trip.isPublic ? 'Public' : 'Private'}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ── Trip Overview ── */}
        <div className="mb-6 p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-white truncate">{trip.name}</h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
              <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
              {tripStart || tripEnd
                ? `Trip window: ${tripStart || '—'} → ${tripEnd || '—'}`
                : 'No overall trip dates set'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-slate-300">{stopCount} {stopCount === 1 ? 'stop' : 'stops'}</span>
          </div>
        </div>

        {/* ── Budget Summary Panel ── */}
        <div className="mb-6 p-4 bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-2xl">
          <h2 className="text-base font-extrabold text-white mb-3 flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5" /> Budget Summary
            {dailyThreshold !== null && (
              <span className="text-xs font-medium text-blue-400 ml-2">
                (per-day cap: ${dailyThreshold})
              </span>
            )}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="p-3 bg-slate-900 rounded-xl">
              <div className="font-bold text-white">Transport</div>
              <div className="text-xl font-medium text-white">${budgetData.transportCost.toFixed(0)}</div>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl">
              <div className="font-bold text-white">Stay</div>
              <div className="text-xl font-medium text-white">${budgetData.stayCost.toFixed(0)}</div>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl">
              <div className="font-bold text-white">Activities</div>
              <div className="text-xl font-medium text-white">${budgetData.activitiesCost.toFixed(0)}</div>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl">
              <div className="font-bold text-white">Meals</div>
              <div className="text-xl font-medium text-white">${budgetData.mealsCost.toFixed(0)}</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="font-bold text-xl text-white">Grand Total</div>
            <div className="text-2xl font-extrabold gradient-text mt-1">
              ${budgetData.grandTotal.toFixed(0)}
            </div>
          </div>

          {/* Recharts bar chart */}
          {budgetData.grandTotal > 0 && (
            <BarChartComponent />
          )}

          {/* Pie chart toggle */}
          <button
            onClick={() => setShowBudget(!showBudget)}
            className="mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {showBudget ? 'Show pie chart' : 'Show bar chart'}
          </button>

          {showBudget && <PieChartComponent />}
        </div>

        {/* ── Itinerary by Day ── */}
        <div>
          {daysData.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <CalendarIcon className="w-10 h-10 text-slate-600 mb-3" />
              <p>No stops planned yet for this trip.</p>
              <p className="text-sm">Add cities and activities to build your itinerary.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {daysData.map((d, dIdx) => {
                const dayNum = d.dayNumber;
                const dayActivities = activitiesByDay[`day-${dayNum}`] || [];
                const dayTotal = dayTotals[`day-${dayNum}`] || 0;
                const exceedsThreshold = dailyThreshold !== null && dayTotal > dailyThreshold;

                return (
                  <div
                    key={d.stop.id}
                    className={`rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden ${exceedsThreshold ? 'border-l-4 border-rose-500' : ''}`}>
                    {/* Day header with number */}
                    <div className="p-4 border-b border-slate-800/60 bg-slate-950">
                      <div className="flex items-center gap-2">
                        <Flag className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="font-bold text-white text-sm">Day {dayNum}</span>
                        <span className="text-xs text-slate-400 ml-auto">
                          Total: ${dayTotal.toFixed(0)}
                        </span>
                      </div>
                    </div>

                    {/* Activities vertical flow */}
                    <div className="p-4 space-y-3">
                      {dayActivities.map((act, aIdx) => {
                        const isLast = aIdx === dayActivities.length - 1;
                        return (
                          <div
                            key={act.name}
                            className={`flex items-start gap-3 p-2 rounded-md bg-slate-900/60 transition-colors ${isLast ? '' : 'border-b border-slate-800/40'}`}>
                            <div className={`mt-0.5 w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] font-bold ${CATEGORY_COLORS[act.category] || CATEGORY_COLORS.OTHER}`}>
                              {act.category ? act.category.replace('_', ' ') : 'OTHER'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-200 line-clamp-1">{act.name}</p>
                              <p className="text-[9px] text-slate-500">{act.scheduledTime || ''} {formatDate(act.scheduledDate)}</p>
                            </div>
                            <span className={`text-[9px] text-emerald-400 font-medium ml-2 ${isLast ? '' : 'arrow'}`}>
                              {/* Arrow between activities */}
                              {isLast ? (
                                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                              ) : (
                                <svg className="w-3 h-3 transform rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                                  <path d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </span>
                            <span className="text-[9px] text-emerald-400 font-medium">${act.cost.toFixed(0)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}