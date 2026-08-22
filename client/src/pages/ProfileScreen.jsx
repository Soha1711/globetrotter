import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Globe, ArrowLeft, MapPin, Calendar, DollarSign, Eye, EyeOff,
  Loader2, Plus, Trash2, Edit3, Save, X, AlertCircle, CheckCircle2
} from 'lucide-react';

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showPreplanned, setShowPreplanned] = useState(true);
  const [preplannedTrips, setPreplannedTrips] = useState([]);
  const [previousTrips, setPreviousTrips] = useState([]);

  // Load user profile and trips on mount
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // Load user profile
        const userRes = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const userData = await userRes.json();
        if (cancelled) return;
        if (!userData.success) throw new Error(userData.message || 'Failed to load profile.');
        setProfile(userData.user);

        // Load all user trips
        const tripsRes = await fetch('/api/trips', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const tripsData = await tripsRes.json();
        if (cancelled) return;
        if (!tripsData.success) throw new Error(tripsData.message || 'Failed to load trips.');

        setPreplannedTrips(tripsData.trips.filter(t => t.isPublic || true)); // show all for now
        setPreviousTrips([]); // will be filtered client-side by date

        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err.message || 'Failed to load profile.');
        setLoading(false);
      }
    };

    if (token) load();
    return () => { cancelled = true; };
  }, [token]);

  // Helper: bucket trip by status
  const today = new Date();
  const bucketTrip = (trip) => {
    const start = trip.startDate ? new Date(trip.startDate) : null;
    const end = trip.endDate ? new Date(trip.endDate) : null;

    if (!start && !end) return 'preplanned';
    if (start && end) return today >= start && today <= end ? 'preplanned' : 'previous';
    if (start && !end) return today >= start ? 'preplanned' : 'previous';
    if (!start && end) return today <= end ? 'preplanned' : 'previous';
    return 'previous';
  };

  // Update profile
  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const data = {
      firstName: document.getElementById('first-name').value.trim(),
      lastName: document.getElementById('last-name').value.trim(),
      email: document.getElementById('email').value.trim(),
      city: document.getElementById('city').value.trim(),
      country: document.getElementById('country').value.trim(),
      additionalInfo: document.getElementById('additional-info').value.trim(),
      profilePhotoUrl: document.getElementById('photo-url').value.trim() || undefined,
    };

    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || 'Failed to update profile.');
      setSuccess('Profile updated successfully!');
      setProfile(result.user);
      // Reload after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    }
  };

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
        <button onClick={() => window.location.reload()} className="text-blue-400 hover:text-blue-300 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (!profile) {
    return <div>Profile not found</div>;
  }

  // Bucket trips
  const preplanned = preplannedTrips.filter(t => bucketTrip(t) === 'preplanned');
  const previous = previousTrips.filter(t => bucketTrip(t) === 'previous');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight gradient-text">Profile</span>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </button>
            <button onClick={logout} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Success/Error Banners ── */}
        {success && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> <span>{error}</span>
          </div>
        )}

        {/* ── Profile Form ── */}
        <div className="mb-6 p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <h2 className="text-2xl font-extrabold text-white mb-4">Edit Profile</h2>

          <form onSubmit={handleUpdate} className="grid grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">First Name *</label>
              <input
                id="first-name"
                type="text"
                value={profile.firstName || ''}
                onChange={e => profile.firstName = e.target.value}
                placeholder="First Name"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Last Name *</label>
              <input
                id="last-name"
                type="text"
                value={profile.lastName || ''}
                onChange={e => profile.lastName = e.target.value}
                placeholder="Last Name"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email *</label>
              <input
                id="email"
                type="email"
                value={profile.email || ''}
                onChange={e => profile.email = e.target.value}
                placeholder="name@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                required
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">City</label>
              <input
                id="city"
                type="text"
                value={profile.city || ''}
                onChange={e => profile.city = e.target.value}
                placeholder="City"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Country</label>
              <input
                id="country"
                type="text"
                value={profile.country || ''}
                onChange={e => profile.country = e.target.value}
                placeholder="Country"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            {/* Additional Info */}
            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Additional Information</label>
              <textarea
                id="additional-info"
                rows={3}
                value={profile.additionalInfo || ''}
                onChange={e => profile.additionalInfo = e.target.value}
                placeholder="Tell us about your travel style, interests, or travel preferences..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
              />
            </div>

            {/* Profile Photo URL */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Profile Photo URL</span>
              </label>
              <input
                id="photo-url"
                type="url"
                value={profile.profilePhotoUrl || ''}
                onChange={e => profile.profilePhotoUrl = e.target.value}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
              {profile.profilePhotoUrl && (
                <div className="mt-2">
                  <img
                    src={profile.profilePhotoUrl}
                    alt="Profile photo"
                    className="w-24 h-24 rounded-object mt-2"
                  />
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="col-span-2">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:from-blue-500 hover:to-indigo-500 transition-all active:scale-[0.98]"
                disabled={profile.firstName === '' || profile.lastName === '' || profile.email === ''}
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* ── Trips Grids ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Preplanned Trips ── */}
          <div>
            <h2 className="text-xl font-extrabold text-white mb-3">Preplanned Trips</h2>
            <p className="text-sm text-slate-400 mb-3">Trips you're planning or currently experiencing</p>
            {preplanned.length === 0 ? (
              <p className="text-sm text-slate-500">No preplanned trips yet. <a href="/trips/new" className="text-blue-400 hover:text-blue-300">Create your first trip</a>.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {preplanned.map(trip => {
                  const start = trip.startDate ? new Date(trip.startDate) : null;
                  const end = trip.endDate ? new Date(trip.endDate) : null;
                  const isActive = today >= start && today <= end;
                  const statusClass = isActive ? 'text-emerald-400' : 'text-slate-400';
                  const statusText = isActive ? 'Ongoing' : 'Upcoming';
                  return (
                    <div
                      key={trip.id}
                      className={`group rounded-2xl border border-slate-800 bg-slate-950 hover:border-slate-700 hover:scale-[1.02] transition-all p-4 flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <div>
                          <h3 className="font-bold text-white truncate">{trip.name}</h3>
                          <p className="text-xs text-slate-400">
                            {start ? start.toLocaleDateString() : '—'} → {end ? end.toLocaleDateString() : '—'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <Link
                          to={`/trips/${trip.id}/view`}
                          className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* ── Previous Trips ── */}
          <div>
            <h2 className="text-xl font-extrabold text-white mb-3">Previous Trips</h2>
            <p className="text-sm text-slate-400 mb-3">Trips you've already experienced</p>
            {previous.length === 0 ? (
              <p className="text-sm text-slate-500">No previous trips yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {previous.map(trip => {
                  const start = trip.startDate ? new Date(trip.startDate) : null;
                  const end = trip.endDate ? new Date(trip.endDate) : null;
                  return (
                    <div
                      key={trip.id}
                      className={`group rounded-2xl border border-slate-800 bg-slate-950 hover:border-slate-700 hover:scale-[1.02] transition-all p-4 flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-3">
                        <Clock1 className="w-4 h-4 text-slate-500" />
                        <div>
                          <h3 className="font-bold text-white truncate">{trip.name}</h3>
                          <p className="text-xs text-slate-400">
                            {start ? start.toLocaleDateString() : '—'} → {end ? end.toLocaleDateString() : '—'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <Link
                          to={`/trips/${trip.id}/view`}
                          className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}