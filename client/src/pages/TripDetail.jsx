import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Globe, ArrowLeft, MapPin, Calendar, DollarSign, Eye, EyeOff,
  Loader2, Plus, Edit3, Sparkles
} from 'lucide-react';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const CATEGORY_COLORS = {
  SIGHTSEEING: 'bg-sky-500/20 text-sky-400',
  FOOD: 'bg-amber-500/20 text-amber-400',
  ADVENTURE: 'bg-rose-500/20 text-rose-400',
  CULTURE: 'bg-violet-500/20 text-violet-400',
  RELAXATION: 'bg-teal-500/20 text-teal-400',
  OTHER: 'bg-slate-500/20 text-slate-400',
};

export default function TripDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/trips/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) setTrip(data.trip);
        else setError(data.message || 'Trip not found.');
        setLoading(false);
      })
      .catch(() => { setError('Failed to load trip.'); setLoading(false); });
  }, [id, token]);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
      <p className="text-lg font-semibold">{error}</p>
      <button onClick={() => navigate('/')} className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>
    </div>
  );

  const totalBudget = trip.budget
    ? ((parseFloat(trip.budget.transportCost) || 0) + (parseFloat(trip.budget.stayCost) || 0) +
       (parseFloat(trip.budget.activitiesCost) || 0) + (parseFloat(trip.budget.mealsCost) || 0))
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-colors">
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

      {/* Hero Cover */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={trip.coverPhotoUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828'}
          alt={trip.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/20 to-slate-950" />
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-xl">{trip.name}</h1>
          {trip.description && <p className="text-slate-300 text-sm mt-1 max-w-2xl line-clamp-2">{trip.description}</p>}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: <MapPin className="w-4 h-4" />, label: 'Stops', value: trip.stops?.length || 0, color: 'text-blue-400' },
            { icon: <Calendar className="w-4 h-4" />, label: 'Dates', value: `${formatDate(trip.startDate)} → ${formatDate(trip.endDate)}`, color: 'text-indigo-400', small: true },
            { icon: <DollarSign className="w-4 h-4" />, label: 'Budget', value: totalBudget > 0 ? `$${totalBudget.toFixed(0)}` : 'Not set', color: 'text-emerald-400' },
            { icon: <Sparkles className="w-4 h-4" />, label: 'Activities', value: trip.stops?.reduce((acc, s) => acc + (s.stopActivities?.length || 0), 0) || 0, color: 'text-amber-400' },
          ].map((stat, i) => (
            <div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className={`flex items-center gap-2 text-xs font-semibold mb-1.5 ${stat.color}`}>
                {stat.icon}
                <span className="uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className={`font-bold text-white ${stat.small ? 'text-xs' : 'text-xl'}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Itinerary Stops */}
        <div>
          <h2 className="text-lg font-extrabold text-white mb-5 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-400" /> Itinerary
          </h2>

          {trip.stops?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center border border-dashed border-slate-800 rounded-2xl">
              <MapPin className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-slate-400 font-semibold mb-1">No stops planned yet</p>
              <p className="text-sm text-slate-500">Add cities and activities to build your itinerary.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {trip.stops.map((stop, idx) => (
                <div key={stop.id} className="relative pl-8">
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-4 w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-md shadow-blue-500/30">
                    {idx + 1}
                  </div>
                  {idx < trip.stops.length - 1 && (
                    <div className="absolute left-2.5 top-9 bottom-0 w-px bg-slate-800" style={{ height: 'calc(100% + 1.5rem)' }} />
                  )}

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    {/* City header */}
                    <div className="flex items-center gap-3 p-4 border-b border-slate-800/60">
                      {stop.city?.imageUrl && (
                        <img src={stop.city.imageUrl} alt={stop.city.name} className="w-12 h-12 rounded-xl object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-base">{stop.city?.name}</h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{stop.city?.country}
                        </p>
                      </div>
                      {(stop.startDate || stop.endDate) && (
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-slate-400">{formatDate(stop.startDate)}</p>
                          {stop.endDate && <p className="text-xs text-slate-400">→ {formatDate(stop.endDate)}</p>}
                        </div>
                      )}
                    </div>

                    {/* Activities */}
                    {stop.stopActivities?.length > 0 && (
                      <div className="p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-3">Scheduled Activities</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {stop.stopActivities.map(sa => (
                            <div key={sa.id} className="flex items-start gap-2.5 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
                              <div className={`mt-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold ${CATEGORY_COLORS[sa.activity?.category] || CATEGORY_COLORS.OTHER}`}>
                                {sa.activity?.category?.replace('_', ' ')}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-200 truncate">{sa.activity?.name}</p>
                                {sa.scheduledDate && (
                                  <p className="text-[10px] text-slate-500">{formatDate(sa.scheduledDate)} {sa.scheduledTime || ''}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Budget Summary */}
        {trip.budget && (
          <div className="mt-10 p-6 bg-slate-900 border border-slate-800 rounded-2xl">
            <h2 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" /> Budget Breakdown
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Transport', value: trip.budget.transportCost },
                { label: 'Stay', value: trip.budget.stayCost },
                { label: 'Activities', value: trip.budget.activitiesCost },
                { label: 'Meals', value: trip.budget.mealsCost },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <p className="text-xs text-slate-500 font-medium mb-1">{item.label}</p>
                  <p className="text-lg font-bold text-white">${parseFloat(item.value).toFixed(0)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400">Total Estimated Budget</p>
              <p className="text-2xl font-extrabold gradient-text">${totalBudget.toFixed(0)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
