import React from 'react';

export function CityCardSkeleton({ compact = false }) {
  return (
    <div className={`flex-shrink-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 animate-pulse
      ${compact ? 'w-44 h-56' : 'w-52 h-64'}`}>
      <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-900" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
        <div className="h-3 bg-slate-800 rounded w-1/2" />
      </div>
    </div>
  );
}

export function TripCardSkeleton({ compact = false }) {
  return (
    <div className={`flex-shrink-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 animate-pulse
      ${compact ? 'w-52 h-60' : 'w-64 h-72'}`}>
      <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-900" />
    </div>
  );
}

export function GridCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 animate-pulse h-52">
      <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-900" />
    </div>
  );
}

export function SectionHeaderSkeleton() {
  return (
    <div className="h-6 bg-slate-800 rounded w-48 animate-pulse" />
  );
}
