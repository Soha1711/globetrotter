import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, DollarSign, TrendingUp } from 'lucide-react';

const COST_LABELS = { 1: 'Budget', 2: 'Affordable', 3: 'Moderate', 4: 'Pricey', 5: 'Luxury' };
const COST_COLORS = {
  1: 'bg-emerald-500/20 text-emerald-400',
  2: 'bg-teal-500/20 text-teal-400',
  3: 'bg-blue-500/20 text-blue-400',
  4: 'bg-orange-500/20 text-orange-400',
  5: 'bg-rose-500/20 text-rose-400'
};

export default function CityCard({ city, onClick, selected = false, compact = false }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) return onClick(city);
    navigate(`/cities/${city.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300
        ${compact ? 'w-44 h-56' : 'w-52 h-64'}
        ${selected
          ? 'border-blue-500 ring-2 ring-blue-500/40 scale-[1.02] shadow-xl shadow-blue-500/20'
          : 'border-slate-800 hover:border-slate-600 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/30'
        }`}
    >
      {/* Cover Image */}
      <div className="absolute inset-0">
        <img
          src={city.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828'}
          alt={city.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828'; }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
      </div>

      {/* Selected Indicator */}
      {selected && (
        <div className="absolute top-3 right-3 z-10 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Cost Badge */}
      <div className={`absolute top-3 left-3 z-10 px-2 py-0.5 rounded-full text-[10px] font-bold ${COST_COLORS[city.costIndex] || COST_COLORS[3]}`}>
        {COST_LABELS[city.costIndex] || 'Moderate'}
      </div>

      {/* Content Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <h3 className={`font-bold text-white leading-tight ${compact ? 'text-base' : 'text-lg'}`}>{city.name}</h3>
        <div className="flex items-center gap-1 mt-0.5 text-slate-300">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="text-xs truncate">{city.country}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1 text-amber-400">
            <TrendingUp className="w-3 h-3" />
            <span className="text-[10px] font-semibold">{city.popularity}/100</span>
          </div>
          {city._count?.activities != null && (
            <span className="text-[10px] text-slate-400 font-medium">{city._count.activities} activities</span>
          )}
        </div>
      </div>
    </div>
  );
}
