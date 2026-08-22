import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Eye, EyeOff, ArrowRight } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TripCard({ trip, compact = false }) {
  const navigate = useNavigate();

  const stopCities = trip.stops?.map(s => s.city?.name).filter(Boolean) || [];
  const coverPhoto = trip.coverPhotoUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828';

  return (
    <div
      onClick={() => navigate(`/trips/${trip.id}`)}
      className={`group relative flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-slate-800 hover:border-slate-600 transition-all duration-300 hover:shadow-xl hover:shadow-black/30 hover:scale-[1.02]
        ${compact ? 'w-52 h-60' : 'w-64 h-72'}`}
    >
      {/* Cover Photo */}
      <div className="absolute inset-0">
        <img
          src={coverPhoto}
          alt={trip.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
      </div>

      {/* Public / Private Badge */}
      <div className={`absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
        ${trip.isPublic ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800/80 text-slate-400 border border-slate-700'}`}>
        {trip.isPublic ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
        {trip.isPublic ? 'Public' : 'Private'}
      </div>

      {/* Arrow hover indicator */}
      <div className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="w-3.5 h-3.5 text-white" />
      </div>

      {/* Content Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <h3 className={`font-bold text-white leading-tight line-clamp-2 ${compact ? 'text-sm' : 'text-base'}`}>{trip.name}</h3>

        {stopCities.length > 0 && (
          <div className="flex items-center gap-1 mt-1 text-slate-300">
            <MapPin className="w-3 h-3 shrink-0 text-blue-400" />
            <span className="text-xs truncate">{stopCities.slice(0, 2).join(' → ')}
              {stopCities.length > 2 && ` +${stopCities.length - 2}`}
            </span>
          </div>
        )}

        {(trip.startDate || trip.endDate) && (
          <div className="flex items-center gap-1 mt-1 text-slate-400">
            <Calendar className="w-3 h-3 shrink-0" />
            <span className="text-[11px]">
              {formatDate(trip.startDate)} {trip.endDate && `— ${formatDate(trip.endDate)}`}
            </span>
          </div>
        )}

        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] font-medium bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
            {trip.stops?.length || 0} {(trip.stops?.length || 0) === 1 ? 'stop' : 'stops'}
          </span>
        </div>
      </div>
    </div>
  );
}
