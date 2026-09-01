import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { InspectionRecord, InspectionStatus } from '../types';
import { Search, Filter, ArrowRight, Camera, FileText } from 'lucide-react';
import { ReportGeneratorService } from '../services/reportService';

interface InspectionHistoryPageProps {
  onSelectInspection: (inspection: InspectionRecord) => void;
  onStartNewInspection: () => void;
}

export const InspectionHistoryPage: React.FC<InspectionHistoryPageProps> = ({
  onSelectInspection,
  onStartNewInspection
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const inspections = useLiveQuery(() => db.inspections.orderBy('timestamp').reverse().toArray()) || [];

  const filtered = inspections.filter((insp) => {
    const matchesSearch =
      insp.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insp.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insp.inspectionNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || insp.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Package Inspections History</h2>
          <p className="text-xs text-slate-500">Persistent IndexedDB legal audit trail & evidence records</p>
        </div>

        <button
          onClick={onStartNewInspection}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-2"
        >
          <Camera className="w-4 h-4" />
          <span>New Camera Scan</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Product, Brand, or Inspection ID (e.g. LMX-2026)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLIANT">Compliant</option>
            <option value="NON_COMPLIANT">Non-Compliant</option>
            <option value="REVIEW_REQUIRED">Review Required</option>
          </select>
        </div>
      </div>

      {/* Inspection Cards List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <div className="text-sm font-bold text-slate-700">No matching inspection records found</div>
            <p className="text-xs text-slate-400">Try adjusting your search criteria or perform a new inspection scan.</p>
          </div>
        ) : (
          filtered.map((insp) => (
            <div
              key={insp.id}
              className="p-5 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                {insp.images[0] ? (
                  <img
                    src={insp.images[0].dataUrl}
                    alt={insp.productName}
                    className="w-16 h-16 object-cover rounded-lg border border-slate-200 bg-slate-100 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs font-bold shrink-0">
                    NO IMG
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{insp.productName}</span>
                    <span className="mono-font text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {insp.inspectionNumber}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500">
                    Brand: <span className="font-semibold text-slate-700">{insp.brand}</span> | Mfr: {insp.manufacturer}
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Inspected: {new Date(insp.timestamp).toLocaleString()} • Inspector: {insp.inspectorName}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-center">
                <button
                  onClick={() => ReportGeneratorService.generateInspectionPDF(insp)}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                  title="Download PDF Certificate"
                >
                  <FileText className="w-4 h-4" />
                </button>

                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    insp.status === 'COMPLIANT'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : insp.status === 'NON_COMPLIANT'
                      ? 'bg-rose-50 text-rose-700 border-rose-300'
                      : 'bg-amber-50 text-amber-700 border-amber-300'
                  }`}
                >
                  {insp.status.replace('_', ' ')}
                </span>

                <button
                  onClick={() => onSelectInspection(insp)}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition"
                >
                  <span>View Evidence</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
