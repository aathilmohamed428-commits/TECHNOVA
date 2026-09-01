import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { Package, ShieldAlert, CheckCircle2, History, AlertTriangle } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const inspections = useLiveQuery(() => db.inspections.toArray()) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Product Identity Intelligence & Compliance Timeline</h2>
        <p className="text-xs text-slate-500">Longitudinal packaging changes and manufacturer risk tracking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((prod) => {
          const productInspections = inspections.filter(
            (i) => i.brand.toLowerCase() === prod.brand.toLowerCase() || i.productName.toLowerCase().includes(prod.productName.toLowerCase())
          );

          return (
            <div key={prod.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>

                <span
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                    prod.riskScore === 'LOW'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : prod.riskScore === 'HIGH'
                      ? 'bg-rose-50 text-rose-700 border-rose-300'
                      : 'bg-amber-50 text-amber-700 border-amber-300'
                  }`}
                >
                  RISK: {prod.riskScore}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-base">{prod.productName}</h3>
                <div className="text-xs text-slate-500 mt-1">Brand: <span className="font-semibold text-slate-700">{prod.brand}</span></div>
                <div className="text-[11px] text-slate-400">Mfr: {prod.manufacturer}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Compliance Rate</div>
                  <div className="font-extrabold text-slate-900 text-base">{prod.complianceRate}%</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Registered MRP</div>
                  <div className="font-extrabold text-blue-600 text-base">{prod.registeredMrp || '₹35.00'}</div>
                </div>
              </div>

              {/* Inspection Timeline */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <History className="w-3 h-3" />
                  <span>Inspection History ({productInspections.length})</span>
                </div>

                {productInspections.length === 0 ? (
                  <div className="text-[11px] text-slate-400 italic">No direct scan logs yet</div>
                ) : (
                  <div className="space-y-1.5">
                    {productInspections.map((i) => (
                      <div key={i.id} className="text-xs p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <span className="mono-font text-[10px] text-slate-500">{new Date(i.timestamp).toLocaleDateString()}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${i.status === 'COMPLIANT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {i.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
