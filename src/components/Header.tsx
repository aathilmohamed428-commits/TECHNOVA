import React from 'react';
import { Shield, User, Camera, Bell, CheckCircle2 } from 'lucide-react';
import { DEFAULT_INSPECTOR } from '../services/seedData';

interface HeaderProps {
  onStartInspection: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onStartInspection }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Brand & Badge */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-lg tracking-tight text-slate-900 leading-none">
              LegalMetri<span className="text-blue-600">X</span>
            </h1>
            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wider">
              GovTech SIH26034
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Packaged Commodities Compliance Engine</p>
        </div>
      </div>

      {/* Center Action */}
      <button
        onClick={onStartInspection}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-sm hover:shadow active:scale-95"
      >
        <Camera className="w-4 h-4" />
        <span>START NEW CAMERA INSPECTION</span>
      </button>

      {/* Inspector Profile */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Rules Engine 2026.1 Active</span>
        </div>

        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="text-right hidden md:block">
            <div className="text-xs font-bold text-slate-900">{DEFAULT_INSPECTOR.name}</div>
            <div className="text-[10px] text-slate-500">{DEFAULT_INSPECTOR.badgeNumber} • {DEFAULT_INSPECTOR.jurisdiction}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 font-bold text-xs">
            RS
          </div>
        </div>
      </div>
    </header>
  );
};
