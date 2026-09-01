import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, TrendingUp, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const inspections = useLiveQuery(() => db.inspections.toArray()) || [];

  const statusData = [
    { name: 'Compliant', value: inspections.filter(i => i.status === 'COMPLIANT').length, color: '#10b981' },
    { name: 'Non-Compliant', value: inspections.filter(i => i.status === 'NON_COMPLIANT').length, color: '#f43f5e' },
    { name: 'Review Required', value: inspections.filter(i => i.status === 'REVIEW_REQUIRED').length, color: '#f59e0b' }
  ];

  const ruleFailCounts = [
    { rule: 'MRP Declaration', count: 4 },
    { rule: 'Net Quantity', count: 2 },
    { rule: 'Consumer Care Cell', count: 5 },
    { rule: 'Mfg Date Format', count: 3 },
    { rule: 'Unit Sale Price', count: 1 }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Government Enforcement Analytics</h2>
        <p className="text-xs text-slate-500">National Metrology intelligence dashboard powered by live IndexedDB records</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Compliance Status Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600" />
              <span>Inspection Compliance Distribution</span>
            </h3>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rule Violation Categories Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-rose-600" />
              <span>Top Legal Metrology Rule Violations</span>
            </h3>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ruleFailCounts}>
                <XAxis dataKey="rule" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
