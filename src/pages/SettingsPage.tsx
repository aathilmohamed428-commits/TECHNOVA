import React from 'react';
import { Settings, User, Shield, Server, Database } from 'lucide-react';
import { DEFAULT_INSPECTOR } from '../services/seedData';

export const SettingsPage: React.FC = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900">System Configuration & Inspector Roles</h2>
        <p className="text-xs text-slate-500">LegalMetriX local storage repository and device setup</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>Active Inspector Profile</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-semibold">Inspector Name</span>
              <span className="font-bold text-slate-900">{DEFAULT_INSPECTOR.name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-semibold">Badge ID</span>
              <span className="mono-font font-bold text-slate-900">{DEFAULT_INSPECTOR.badgeNumber}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-semibold">Role</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{DEFAULT_INSPECTOR.role}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-semibold">Jurisdiction</span>
              <span className="font-bold text-slate-900">{DEFAULT_INSPECTOR.jurisdiction}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>IndexedDB Local Storage State</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-semibold">Database Engine</span>
              <span className="font-bold text-slate-900">Dexie.js / Native IndexedDB</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-semibold">OCR Engine</span>
              <span className="font-bold text-slate-900">Tesseract.js (Client-Side WASM)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-semibold">Offline Capable</span>
              <span className="font-bold text-emerald-600">Yes (Zero External API Dependency)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
