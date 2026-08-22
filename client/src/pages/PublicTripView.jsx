import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Globe, ArrowLeft, MapPin, Calendar, DollarSign, Eye, EyeOff, Loader2, Plus, Trash2,
  ChevronLeft, ChevronRight, X, CheckCircle2, Lock, Unlock, Copy, Shield
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

export default function PublicTripView() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { tripId } = useParams();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [isPublic, setIsPublic] = useState(null);
  const [showMakePublic, setShowMakePublic] = useState(false);
  const [tripCopied, setTripCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/trips/${tripId}`);
        if (!res.ok) {
          const errData = await res.json();
          if (cancelled) return;
          if (res.status === 404) {
            navigate('/trips');
            return;
          }
          if (res.status === 403) {
            setError('Access denied to this trip.');
            setLoading(false);
            return;
          }
          if (res.status === 404 && errData.message?.includes('private')) {
            setIsPublic(false);
            setLoading(false);
            return;
          }
          if (res.status === 404) {
            setIsPublic(false);
            setLoading(false);
            return;
          }
          if (res.status === 403) {
            setIsPublic(false);
            setLoading(false);
            return;
          }
          if (res.status === 404) {
            navigate('/trips');
            return;
          }
        }
        const data = await res.json();
        if (cancelled) return;
        setTrip(data.trip);
        setIsPublic(data.trip.isPublic);
        setIsOwner(data.isOwner || false);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err.message || 'Failed to load trip.');
        setLoading(false);
      }
    };

    if (token) load();
    return () => { cancelled = true; };
  }, [tripId, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex flex-col items-center justify-center py-8">
        <p className="text-lg">{error}</p>
        <button onClick={() => navigate('/trips')} className="mt-4 text-blue-400 hover:text-blue-300">
          <ArrowLeft className="w-4 h-4" /> Back to Trips
        </button>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">
        <p>Trip not found</p>
        <button onClick={() => navigate('/trips')} className="mt-4 text-blue-400 hover:text-blue-300">
          <ArrowLeft className="w-4 h-4" /> Back to Trips
        </button>
      </div>
    );
  }

  // Determine if user can make trip public
  // A user can make a trip public if they are the owner and the trip is currently private
  const canMakePublic = isOwner && !isPublic;

  // Compute trip badges/overview
  const stops = trip.stops || [];
  const dayNumbers = computeDayNumbers(stops);
  const totalDays = dayNumbers.length > 0 ? Math.max(...dayNumbers) : 0;
  const categories = [...new Set(stops.map(s => s.category).filter(Boolean))];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">
              {isPublic ? 'Trip' : 'Trip'}
            </span>

          </div>
          <div className="flex items-center gap-2">
            {isPublic ? (
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-400">Public</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-400">Private</span>
              </div>
            )}
            {user && isOwner && (
              <button
                onClick={() => setShowMakePublic(!showMakePublic)}
                className="p-2 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors text-slate-400"
                title={showMakePublic ? 'Cancel making public' : 'Make trip public'}
              >
                {showMakePublic ? (
                  <div className="flex items-center gap-1">
                    <Unlock className="w-3 h-3" />
                    <span>Cancel</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Public</span>
                  </div>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Trip Details & Action Toggle ── */}
        <div className="mb-6">
          {isPublic ? (
            <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700/50">
              <h2 className="text-xl font-bold mb-2">{trip.name}</h2>
              <p className="text-slate-500 text-sm">{trip.description || ''}</p>
              <p className="text-slate-500 text-xs mt-2">
                Shared link: <span className="font-mono text-blue-400 underline cursor-pointer"
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/trips/${trip.id}`)}
                >
                  Copy Link
                </span>
              </p>
            </div>
          ) : (
            <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700/50">
              <h2 className="text-xl font-bold mb-2">This trip is private</h2>
              <p className="text-slate-500 text-sm">
                This trip is currently private. Would you like to make it public?
              </p>
              {user && isOwner && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setShowMakePublic(true)}
                    className="flex-1 px-3 py-2 rounded-lg border border-blue-600 bg-blue-600/10 text-blue-400 hover:text-white hover:border-blue-500 transition-colors text-sm font-medium"
                  >
                    Make public
                  </button>
                  <button
                    onClick={() => navigate(`/trips/${tripId}/view`)}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 transition-colors text-sm font-medium"
                  >
                    View in my account
                  </button>
                </div>
              )}
              {!user || !isOwner && (
                <p className="mt-3 text-slate-500 text-xs">Only the trip owner can make it public.</p>
              )}
            </div>
          )}
        </div>

        {/* ── Make Public Form ── */}
        {showMakePublic && user && isOwner && (
          <div className="bg-slate-900/80 rounded-xl p-5 border border-blue-500/30 mb-6">
            <h3 className="font-bold mb-3 text-blue-400">Make trip public?</h3>
            <p className="text-slate-500 text-sm mb-4">
              Making this trip public will generate a shareable link that anyone can view.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // TODO: POST /api/trips/:tripId/make-public
                  setShowMakePublic(false);
                  setIsPublic(true);
                  // In a full implementation, would call the backend endpoint
                  alert('Trip made public! Shareable link generated.');
                }}
                className="flex-1 px-3 py-2 rounded-lg border border-blue-600 bg-blue-600/20 text-blue-400 hover:text-white hover:bg-blue-700 transition-colors text-sm font-medium">
                Yes, make public
              </button>
              <button
                onClick={() => setShowMakePublic(false)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Trip Stats Overview ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/50">
            <div className="text-3xl font-bold text-blue-500">{totalDays}</div>
            <div className="text-slate-500 text-xs mt-1">Days</div>
          </div>
          {categories.length > 0 && (
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/50">
              <div className="text-slate-500 text-xs mb-1">Categories</div>
              <div className="flex flex-wrap gap-1">
                {categories.map(c => (
                  <span
                    key={c}
                    className={`px-2 py-1 rounded text-xs font-medium ${{
                      SIGHTSEEING: 'bg-sky-500/20 text-sky-400',
                      FOOD: 'bg-amber-500/20 text-amber-400',
                      ADVENTURE: 'bg-rose-500/20 text-rose-400',
                      CULTURE: 'bg-violet-500/20 text-violet-400',
                      RELAXATION: 'bg-teal-500/20 text-teal-400',
                      OTHER: 'bg-slate-500/20 text-slate-400',
                    }[c] || 'bg-slate-500/20 text-slate-400'}`}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/50">
            <div className="text-3xl font-bold">{stops.length}</div>
            <div className="text-slate-500 text-xs">Stops</div>
          </div>
        </div>

        {/* ── Itinerary Grid ── */}
        {stops.length > 0 && (
          <div className="bg-slate-950 rounded-xl p-6 border border-slate-800/50">
            <h3 className="font-bold text-lg mb-4">Itinerary</h3>
            <div className="grid grid-cols-2 gap-3">
              {stops.map((stop, idx) => {
                const day = dayNumbers[idx] || 1;
                const date = stop.startDate ? new Date(stop.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
                const categoryColor = {
                  SIGHTSEEING: 'bg-sky-500/20 text-sky-400',
                  FOOD: 'bg-amber-500/20 text-amber-400',
                  ADVENTURE: 'bg-rose-500/20 text-rose-400',
                  CULTURE: 'bg-violet-500/20 text-violet-400',
                  RELAXATION: 'bg-teal-500/20 text-teal-400',
                  OTHER: 'bg-slate-500/20 text-slate-400',
                }[stop.category] || 'bg-slate-500/20 text-slate-400';

                return (
                  <div
                    key={stop.id}
                    className={`p-3 rounded-xl ${categoryColor} text-slate-100 ${day > 1 ? 'opacity-70' : 'font-medium'} ${day > 1 ? 'border-t-2 border-blue-500/30' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{date}</span>
                      <span className="text-xs">{stop.activity ? stop.activity.name : 'No activity'}</span>
                    </div>
                    <p className="text-slate-400 text-xs mt-1">{stop.note || ''}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Copy Trip Button (for logged-in visitors viewing public trip) ── */}
        {!isOwner && user && isPublic && !tripCopied && (
          <div className="mt-6 pt-6 border-t border-slate-800/30">
            <h3 className="font-bold mb-3">Save this trip to your account</h3>
            <p className="text-slate-500 text-sm mb-4">
              Copy this trip to your own account to edit it yourself.
            </p>
            <button
              onClick={() => {
                fetch(`/api/trips/${tripId}/copy`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}` }
                })
                  .then(res => res.json())
                  .then(data => {
                    if (data.success) {
                      setTripCopied(true);
                      navigate(`/trips/${data.newTripId}/view`);
                    } else {
                      alert('Failed to copy trip: ' + (data.message || 'unknown error'));
                    }
                  })
                  .catch(() => alert('Failed to copy trip.'));
              }}
              className="w-full px-4 py-2 rounded-lg border border-green-600 bg-green-600/20 text-green-400 hover:text-white hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Copy Trip
            </button>
          </div>
        )}

        {/* ── Copied trip confirmation ── */}
        {tripCopied && (
          <div className="bg-green-600/20 rounded-xl p-6 border border-green-600/30 mt-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <h3 className="font-bold text-green-400 mb-2">Trip copied!</h3>
            <p className="text-slate-400 text-sm">
              The trip has been saved to your account. You can now edit it from your trips.
            </p>
            <button
              onClick={() => navigate('/trips')}
              className="mt-3 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 transition-colors text-sm font-medium"
            >
              Go to Trips
            </button>
          </div>
        )}

      </div>
    </div>
  );
}