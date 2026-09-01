import React from 'react';
import {
  LayoutDashboard,
  Camera,
  History,
  Package,
  AlertTriangle,
  BarChart3,
  BookOpen,
  Settings,
  ShieldCheck
} from 'lucide-react';

export type NavTab = 'dashboard' | 'camera' | 'history' | 'products' | 'complaints' | 'analytics' | 'rules' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'camera', label: 'Intelligent Inspection', icon: Camera, highlight: true },
    { id: 'history', label: 'Inspections History', icon: History },
    { id: 'products', label: 'Product Intelligence', icon: Package },
    { id: 'complaints', label: 'Consumer Complaints', icon: AlertTriangle },
    { id: 'analytics', label: 'Gov Intelligence', icon: BarChart3 },
    { id: 'rules', label: 'Rules & Compliance', icon: BookOpen },
    { id: 'settings', label: 'System & Roles', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col justify-between shrink-0">
      <div className="p-4 space-y-6">
        <div className="px-3 py-2 bg-slate-800/80 rounded-lg border border-slate-700/60">
          <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Operational Mode</div>
          <div className="text-xs font-semibold text-white flex items-center gap-1.5 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Field Enforcement Unit</span>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id as NavTab)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : item.highlight
                    ? 'text-teal-400 hover:bg-slate-800 hover:text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : item.highlight ? 'text-teal-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.highlight && !active && (
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
        <div className="font-semibold text-slate-400">LegalMetriX v2026.1.0</div>
        <div>Legal Metrology Rules 2011 Compliance</div>
        <div>National Informatics Engine</div>
      </div>
    </aside>
  );
};
