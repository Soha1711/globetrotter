import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X, Calendar, MapPin, Plus, CheckCircle2, AlertCircle, Loader2, Globe, Sparkles
} from 'lucide-react';

export default function AddToTripModal({ item, itemType = 'city', onClose, onSuccess }) {
  const { token } = useAuth();

  const [trips, setTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [selectedStopId, setSelectedStopId] = useState('');
  
  // Date/Time fields
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch user's trips on mount
  useEffect(() => {
    fetch('/api/trips', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        const tripList = data.trips || [];
        setTrips(tripList);
        if (tripList.length > 0) {
          setSelectedTripId(tripList[0].id);
        }
        setLoadingTrips(false);
      })
      .catch(() => {
        setError('Failed to load trips.');
        setLoadingTrips(false);
      });
  }, [token]);

  const selectedTrip = trips.find(t => t.id === selectedTripId);

  // When selected trip changes, set initial stop if activity mode
  useEffect(() => {
    if (selectedTrip && selectedTrip.stops && selectedTrip.stops.length > 0) {
      setSelectedStopId(selectedTrip.stops[0].id);
    } else {
      setSelectedStopId('');
    }
  }, [selectedTripId, trips]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!selectedTripId) {
      setError('Please select a trip.');
      return;
    }

    try {
      setSubmitting(true);

      if (itemType === 'city') {
        // Add City Stop: POST /api/trips/:tripId/stops
        const res = await fetch(`/api/trips/${selectedTripId}/stops`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            cityId: item.id,
            startDate: startDate || null,
            endDate: endDate || null
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to add city stop to trip.');
        }

        setSuccessMsg(`Added ${item.name} to ${selectedTrip.name}!`);
      } else {
        // Add Activity: POST /api/stops/:stopId/activities
        if (!selectedStopId) {
          // If the selected trip has no stop for this city, create one first
          let stopIdToUse = selectedStopId;
          if (!stopIdToUse) {
            const createStopRes = await fetch(`/api/trips/${selectedTripId}/stops`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                cityId: item.cityId || item.city?.id,
              })
            });
            const createStopData = await createStopRes.json();
            if (!createStopRes.ok || !createStopData.success) {
              throw new Error(createStopData.message || 'Failed to create stop for activity.');
            }
            stopIdToUse = createStopData.stop.id;
          }

          const res = await fetch(`/api/stops/${stopIdToUse}/activities`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              activityId: item.id,
              scheduledDate: scheduledDate || null,
              scheduledTime: scheduledTime || null
            })
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.message || 'Failed to add activity.');
          }
        } else {
          const res = await fetch(`/api/stops/${selectedStopId}/activities`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              activityId: item.id,
              scheduledDate: scheduledDate || null,
              scheduledTime: scheduledTime || null
            })
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.message || 'Failed to add activity.');
          }
        }

        setSuccessMsg(`Added "${item.name}" to ${selectedTrip.name}!`);
      }

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);

    } catch (err) {
      setError(err.message || 'Failed to add item.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              {itemType === 'city' ? <Globe className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">
                Add {itemType === 'city' ? 'City' : 'Activity'} to Trip
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-xs">{item.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {loadingTrips ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <p className="text-xs text-slate-400">Loading your trips...</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-slate-400 text-sm mb-3">You don't have any trips created yet.</p>
            <a
              href="/trips/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-500 transition-colors"
            >
              <Plus className="w-4 h-4" /> Create a New Trip First
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Select Trip */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Target Trip *
              </label>
              <select
                id="select-trip-dropdown"
                value={selectedTripId}
                onChange={e => setSelectedTripId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
              >
                {trips.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.stops?.length || 0} stops)
                  </option>
                ))}
              </select>
            </div>

            {/* City Stop Fields */}
            {itemType === 'city' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Start Date</label>
                  <input
                    id="city-start-date"
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">End Date</label>
                  <input
                    id="city-end-date"
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                  />
                </div>
              </div>
            )}

            {/* Activity Fields */}
            {itemType === 'activity' && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Select Trip Section / Stop *
                  </label>
                  {selectedTrip?.stops?.length > 0 ? (
                    <select
                      id="select-stop-dropdown"
                      value={selectedStopId}
                      onChange={e => setSelectedStopId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      {selectedTrip.stops.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.city?.name || 'City Stop'} (Stop #{s.orderIndex + 1})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                      This trip has no city stops yet. A new stop for {item.city?.name || 'this city'} will be created automatically.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Scheduled Date</label>
                    <input
                      id="activity-scheduled-date"
                      type="date"
                      value={scheduledDate}
                      onChange={e => setScheduledDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Scheduled Time</label>
                    <input
                      id="activity-scheduled-time"
                      type="time"
                      value={scheduledTime}
                      onChange={e => setScheduledTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                id="confirm-add-to-trip-btn"
                type="submit"
                disabled={submitting || successMsg}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:from-blue-500 hover:to-indigo-500 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Adding...</>
                ) : (
                  <><Plus className="w-3.5 h-3.5" /> Add to Itinerary</>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
