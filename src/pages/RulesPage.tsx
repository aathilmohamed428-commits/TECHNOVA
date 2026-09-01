import React from 'react';
import { OFFICIAL_RULES_2026 } from '../services/ruleEngine';
import { BookOpen, ShieldCheck, Scale } from 'lucide-react';

export const RulesPage: React.FC = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Legal Metrology Rules & Versioning Registry</h2>
        <p className="text-xs text-slate-500">Official statutory rule definitions under Packaged Commodities Rules, 2011 (Version 2026.1)</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {OFFICIAL_RULES_2026.map((rule) => (
          <div key={rule.id} className="p-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="mono-font text-xs font-extrabold bg-blue-50 text-blue-800 px-3 py-1 rounded-lg border border-blue-200">
                  {rule.ruleCode}
                </span>
                <h3 className="font-bold text-slate-900 text-sm">{rule.title}</h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Version: {rule.version}
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    rule.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {rule.severity}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{rule.description}</p>
            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-blue-600" />
              <span>Reference: {rule.legalActReference}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
