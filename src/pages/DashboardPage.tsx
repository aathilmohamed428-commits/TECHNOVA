import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { Camera, AlertCircle, CheckCircle2, FileText, ArrowRight, ShieldAlert, Layers } from 'lucide-react';
import { InspectionRecord } from '../types';

interface DashboardPageProps {
  onStartInspection: () => void;
  onSelectInspection: (inspection: InspectionRecord) => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onStartInspection,
  onSelectInspection,
  onNavigateTab
}) => {
  const inspections = useLiveQuery(() => db.inspections.orderBy('timestamp').reverse().toArray()) || [];
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const complaints = useLiveQuery(() => db.complaints.toArray()) || [];

  const totalInspections = inspections.length;
  const compliantCount = inspections.filter(i => i.status === 'COMPLIANT').length;
  const nonCompliantCount = inspections.filter(i => i.status === 'NON_COMPLIANT' || i.status === 'REVIEW_REQUIRED').length;
  const complianceRate = totalInspections > 0 ? Math.round((compliantCount / totalInspections) * 100) : 0;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold border border-blue-400/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>AI Enforcement Assistant Active</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Packaged Commodities Compliance Dashboard</h2>
          <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
            Real-time computer vision, OCR text extraction, and legal rule validation under Legal Metrology (Packaged Commodities) Rules, 2011.
          </p>
        </div>

        <button
          onClick={onStartInspection}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition shadow-lg flex items-center justify-center gap-3 shrink-0 active:scale-95"
        >
          <Camera className="w-5 h-5" />
          <span>START LIVE CAMERA INSPECTION</span>
        </button>
      </div>

      {/* Metric Cards derived from IndexedDB */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Inspections</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{totalInspections}</div>
          <div className="text-[11px] text-slate-500 font-medium">Stored in IndexedDB</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Compliant Packages</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">{compliantCount}</div>
          <div className="text-[11px] text-slate-500 font-medium">{complianceRate}% Pass Rate</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Violations / Reviews</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-extrabold text-rose-600">{nonCompliantCount}</div>
          <div className="text-[11px] text-slate-500 font-medium">Inspector Action Pending</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Active Complaints</span>
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600">{complaints.length}</div>
          <div className="text-[11px] text-slate-500 font-medium">Consumer Submissions</div>
        </div>
      </div>

      {/* Recent Inspections Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Recent Package Inspections</h3>
            <p className="text-xs text-slate-500">Live inspection records with full evidence trace</p>
          </div>
          <button
            onClick={() => onNavigateTab('history')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {inspections.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Camera className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-semibold text-slate-700">No Package Inspections Yet</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Place a physical product in front of your camera to trigger automated view detection, real OCR, and compliance checking.
            </p>
            <button
              onClick={onStartInspection}
              className="inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg"
            >
              Start First Inspection
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {inspections.slice(0, 5).map((insp) => (
              <div
                key={insp.id}
                onClick={() => onSelectInspection(insp)}
                className="p-4 hover:bg-slate-50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  {insp.images[0] ? (
                    <img
                      src={insp.images[0].dataUrl}
                      alt={insp.productName}
                      className="w-14 h-14 object-cover rounded-lg border border-slate-200 bg-slate-100 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-bold text-xs shrink-0">
                      IMG
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{insp.productName}</span>
                      <span className="mono-font text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {insp.inspectionNumber}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Brand: <span className="font-medium text-slate-700">{insp.brand}</span> • Mfr: {insp.manufacturer}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Inspected: {new Date(insp.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      insp.status === 'COMPLIANT'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : insp.status === 'NON_COMPLIANT'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {insp.status.replace('_', ' ')}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
