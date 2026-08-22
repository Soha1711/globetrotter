import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Eye, EyeOff, ArrowRight } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TripCard({ trip, compact = false }) {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const stopCities = trip.stops?.map(s => s.city?.name).filter(Boolean) || [];
  const isPublic = trip.isPublic;

  return (
    <div
      onClick={() => navigate(`/trips/${trip.id}`)}
      className={`perforated-edge rounded-2xl border border-[var(--bg-subtle)] cursor-pointer overflow-hidden transition-all duration-300 ${
        compact ? 'w-52 h-60' : 'w-64 h-72'
      }`}
    >
      {/* Cover Photo */}
      <div className="absolute inset-0">
        <img
          src={trip.coverPhotoUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828'}
          alt={trip.name}
          className="w-full h-full object-cover transition-transform duration-500"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-subtle)] via-transparent to-transparent" />
      </div>

      {/* Public / Private Postmark Stripe */}
      <div className="postmark-stripe">
        {isPublic ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        {isPublic ? 'Public' : 'Private'}
      </div>

      {/* Arrow hover indicator */}
      <div className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-[var(--bg-subtle)] backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
      </div>

      {/* Content Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <h3 className={`font-bold text-[var(--text-primary)] leading-tight line-clamp-2 ${compact ? 'text-sm' : 'text-base'}`}>
          {trip.name}
        </h3>

        {stopCities.length > 0 && (
          <div className="flex items-center gap-1 mt-1 text-[var(--text-secondary)]">
            <MapPin className="w-3 h-3 shrink-0 text-[var(--text-secondary)]" />
            <span className="text-xs truncate">{stopCities.slice(0, 2).join(' → ')}
              {stopCities.length > 2 && ` +${stopCities.length - 2}`}
            </span>
          </div>
        )}

        {(trip.startDate || trip.endDate) && (
          <div className="flex items-center gap-1 mt-1 text-[var(--text-secondary)]">
            <Calendar className="w-3 h-3 shrink-0" />
            <span className="text-[11px]">
              {formatDate(trip.startDate)} {trip.endDate && `— ${formatDate(trip.endDate)}`}
            </span>
          </div>
        )}

        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] font-medium bg-[var(--accent-travel)]/20 text-[var(--accent-travel)] px-2 py-0.5 rounded-full border border-[var(--accent-travel)]/20">
            {trip.stops?.length || 0} {(trip.stops?.length || 0) === 1 ? 'stop' : 'stops'}
          </span>
        </div>
      </div>
    </div>
  );
}