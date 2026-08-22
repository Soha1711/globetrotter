import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Globe, ArrowLeft, MapPin, Calendar as CalendarIcon, DollarSign, Eye, Loader2, Plus, Trash2,
  ChevronLeft, ChevronRight, X, AlertCircle, CheckCircle2
} from 'lucide-react';

function formatDateMD(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function daysInMonth(month, year) {
  return new Date(year, month + 1, 0).getDate();
}

function startOfMonth(month, year) {
  return new Date(Date.UTC(year, month, 1));
}

function endOfMonth(month, year) {
  return new Date(Date.UTC(year, month + 1, 0));
}

export default function CalendarView() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load trips for the selected month/year
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/trips/calendar?month=${month}&year=${year}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (cancelled) return;
        if (!data.success) throw new Error(data.message || 'Failed to load calendar trips.');
        setTrips(data.trips);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err.message || 'Failed to load calendar.');
        setLoading(false);
      }
    };

    if (token) load();
    return () => { cancelled = true; };
  }, [month, year, token]);

  // Compute trip bars for each day of the month
  const tripBars = useMemo(() => {
    const bars = [];
    const daysInMonth = daysInMonth(month, year);
    const monthStart = startOfMonth(month, year);
    const monthEnd = endOfMonth(month, year);

    // Collect all stop date ranges from all trips
    const dateRanges = [];
    trips.forEach(trip => {
      if (trip.stops) {
        trip.stops.forEach(stop => {
          const stopStart = stop.startDate ? new Date(stop.startDate) : null;
          const stopEnd = stop.endDate ? new Date(stop.endDate) : null;
          if (stopStart && stopEnd) {
            dateRanges.push({ start: stopStart, end: stopEnd, tripId: trip.id, tripName: trip.name });
          }
        });
      }
    });

    // For each day, determine which trips have a bar on that day
    for (let day = 1; day <= daysInMonth(month, year); day++) {
      const dayDate = new Date(Date.UTC(year, month, day));
      const dayEnd = new Date(Date.UTC(year, month, day + 1));

      // Find trips that overlap this day
      const overlapping = trips.filter(trip => {
        if (!trip.stops) return false;
        return trip.stops.some(stop => {
          const s = new Date(stop.startDate || 0);
          const e = new Date(stop.endDate || 0);
          return !(e <= monthStart || s >= monthEnd);
        });
      });

      bars.push({
        day,
        overlapping: overlapping.map(t => ({ trip: t, stops: t.stops || [] })),
      });
    }

    return bars;
  }, [trips, month, year]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <p className="text-lg font-semibold">{error}</p>
        <button onClick={() => navigate('/trips')} className="text-blue-400 hover:text-blue-300 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Trips
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight gradient-text">Calendar</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setMonth(m => (m - 1 + 12) % 12)}
              className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
              disabled={month === 0}
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-400">{formatDateMD(1, year)} – {formatDateMD(daysInMonth(month, year), year)} {year}</span>
            <button
              onClick={() => setMonth(m => (m + 1) % 12)}
              className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
              disabled={month === 11}
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Trip Bars for Each Day ── */}
        <div className="space-y-3">
          {tripBars.map(bar => {
            const day = bar.day;
            const tripData = bar.overlapping;
            const dayDate = new Date(Date.UTC(year, month, day));

            // Determine the "primary" trip for this day (the one with the longest span, or first)
            const primaryTrip = tripData.length > 0 ? tripData[0] : null;

            return (
              <div
                key={day}
                className={`p-2 rounded-xl bg-slate-950 border border-slate-800/60 hover:border-slate-700 transition-colors cursor-pointer ${primaryTrip ? '' : 'opacity-50'}`}
                onClick={() => primaryTrip && navigate(`/trips/${primaryTrip.id}/view`)}
                title={primaryTrip ? `View ${primaryTrip.name}` : ''}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">{day}</span>
                  {primaryTrip && (
                    <span className="text-xs font-medium text-white bg-blue-600/20 text-blue-400 rounded-xl px-2 py-0.5">
                      {primaryTrip.name}
                    </span>
                  )}
                </div>
                {primaryTrip && primaryTrip.stops && primaryTrip.stops.length > 0 && (
                  <div className="text-xs text-slate-500 mt-1">
                    {primaryTrip.stops.length} stop{primaryTrip.stops.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── No trips message ── */}
        {trips.length === 0 && month === new Date().getMonth() && year === new Date().getFullYear() && (
          <div className="p-8 text-center text-slate-500">
            <CalendarIcon className="w-10 h-10 text-slate-600 mb-3" />
            <p>No trips for this month</p>
            <p className="text-sm">Add a trip or change the month to see your schedule.</p>
          </div>
        )}
      </div>
    </div>
  );
}