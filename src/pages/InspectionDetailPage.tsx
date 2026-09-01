import React, { useState } from 'react';
import { InspectionRecord, InspectorDecisionType } from '../types';
import { ReportGeneratorService } from '../services/reportService';
import { db } from '../db/database';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  ArrowLeft,
  Eye,
  Check,
  X,
  Lock,
  Globe,
  Tag
} from 'lucide-react';

interface InspectionDetailPageProps {
  inspection: InspectionRecord;
  onBack: () => void;
}

export const InspectionDetailPage: React.FC<InspectionDetailPageProps> = ({
  inspection: initialInspection,
  onBack
}) => {
  const [inspection, setInspection] = useState<InspectionRecord>(initialInspection);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [activeHighlightDeclId, setActiveHighlightDeclId] = useState<string | null>(null);
  const [decisionRemarks, setDecisionRemarks] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const currentImage = inspection.images[selectedImageIdx] || inspection.images[0];

  const handleInspectorDecision = async (ruleId: string, decision: InspectorDecisionType) => {
    const newDecision = {
      ruleId,
      decision,
      inspectorId: inspection.inspectorId,
      timestamp: new Date().toISOString(),
      remarks: decisionRemarks || 'Inspector manual determination logged.'
    };

    const updatedDecisions = [...inspection.decisions.filter(d => d.ruleId !== ruleId), newDecision];

    // Recalculate status if inspector decisions change
    const hasConfirmedViolation = updatedDecisions.some(d => d.decision === 'CONFIRM_VIOLATION');
    const updatedStatus = hasConfirmedViolation ? 'NON_COMPLIANT' : 'COMPLIANT';

    const updated: InspectionRecord = {
      ...inspection,
      decisions: updatedDecisions,
      status: updatedStatus
    };

    setInspection(updated);
    await db.inspections.put(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const downloadPDF = () => {
    ReportGeneratorService.generateInspectionPDF(inspection);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">{inspection.productName}</h2>
              <span className="mono-font text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                {inspection.inspectionNumber}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspected on {new Date(inspection.timestamp).toLocaleString()} by {inspection.inspectorName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow"
          >
            <FileDown className="w-4 h-4" />
            <span>Generate Official PDF Certificate</span>
          </button>

          <span
            className={`text-xs font-extrabold px-3 py-1.5 rounded-full border ${
              inspection.status === 'COMPLIANT'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : inspection.status === 'NON_COMPLIANT'
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : 'bg-amber-50 text-amber-700 border-amber-300'
            }`}
          >
            {inspection.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Inspector determination permanently recorded in IndexedDB audit trail.</span>
        </div>
      )}

      {/* Main Grid: Interactive Evidence Viewer vs Declaration & Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Evidence Viewer */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2 font-bold">
                <Eye className="w-4 h-4 text-blue-400" />
                <span>Interactive Packaging Evidence Frame</span>
              </div>
              <span className="mono-font text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                View: {currentImage?.viewName || 'PRIMARY'}
              </span>
            </div>

            {/* Bounding Box Image Canvas */}
            <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-square flex items-center justify-center border border-slate-800">
              {currentImage ? (
                <img
                  src={currentImage.dataUrl}
                  alt="Packaging Evidence"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-slate-500 text-xs">No image evidence available</div>
              )}

              {/* Bounding Box Highlights */}
              {inspection.declarations.map((decl) => {
                if (!decl.boundingBox || decl.imageId !== currentImage?.id) return null;
                const isSelected = activeHighlightDeclId === decl.id;
                return (
                  <div
                    key={decl.id}
                    onClick={() => setActiveHighlightDeclId(decl.id)}
                    style={{
                      left: `${decl.boundingBox.x}%`,
                      top: `${decl.boundingBox.y}%`,
                      width: `${decl.boundingBox.w}%`,
                      height: `${decl.boundingBox.h}%`
                    }}
                    className={`absolute border-2 cursor-pointer transition rounded ${
                      isSelected
                        ? 'border-emerald-400 bg-emerald-500/30 ring-4 ring-emerald-400/40 z-20'
                        : 'border-blue-400/80 bg-blue-500/10 hover:bg-blue-500/20 z-10'
                    }`}
                  >
                    <span className="absolute -top-5 left-0 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                      {decl.type}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Image Selector Thumbnails */}
            {inspection.images.length > 1 && (
              <div className="flex items-center gap-2 pt-2">
                {inspection.images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-16 h-14 rounded-lg overflow-hidden border-2 transition ${
                      selectedImageIdx === idx ? 'border-blue-500 scale-105' : 'border-slate-700 opacity-60'
                    }`}
                  >
                    <img src={img.dataUrl} alt={img.viewName} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Evidence Checksum Integrity Card */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-700 font-bold">
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-slate-500" />
                Digital Traceability Checksum
              </span>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                AUDITABLE & TAMPER-AWARE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mono-font break-all bg-slate-50 p-2 rounded border border-slate-200">
              SHA-256: {inspection.evidenceIntegrityHash}
            </p>
          </div>
        </div>

        {/* Right Column: Declarations & Rule Verification */}
        <div className="lg:col-span-6 space-y-6">
          {/* Extracted Declarations Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Extracted Packaging Declarations</h3>
              <span className="text-xs text-slate-500 font-medium">Rule 6(1) Requirements</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {inspection.declarations.map((decl) => {
                const isHighlighted = activeHighlightDeclId === decl.id;
                return (
                  <div
                    key={decl.id}
                    onClick={() => setActiveHighlightDeclId(decl.id)}
                    className={`p-3.5 hover:bg-slate-50 transition cursor-pointer flex items-center justify-between gap-4 ${
                      isHighlighted ? 'bg-blue-50/70 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-900">{decl.label}</div>
                      <div className="text-xs text-slate-600 mono-font bg-slate-100 inline-block px-1.5 py-0.5 rounded">
                        {decl.rawValue}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          decl.status === 'DETECTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : decl.status === 'NOT_DETECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {decl.status}
                      </span>
                      <div className="text-[10px] text-slate-400">OCR: {decl.confidence}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legal Metrology Rule Evaluations */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Rule Engine Evaluations (Packaged Commodities 2011)</h3>
            </div>

            <div className="divide-y divide-slate-100 p-4 space-y-4">
              {inspection.evaluations.map((rule) => {
                const decision = inspection.decisions.find(d => d.ruleId === rule.ruleId);
                return (
                  <div key={rule.ruleId} className="p-4 rounded-xl border border-slate-200 space-y-3 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="mono-font text-xs font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                          {rule.ruleCode}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">{rule.ruleTitle}</h4>
                      </div>

                      <span
                        className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                          rule.result === 'PASS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rule.result === 'FAIL'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rule.result}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{rule.findings}</p>

                    {/* Human-in-the-Loop Inspector Actions */}
                    <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-[11px] text-slate-500">
                        Inspector Decision: <span className="font-bold text-slate-800">{decision ? decision.decision : 'Awaiting Review'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleInspectorDecision(rule.ruleId, 'CONFIRM_VIOLATION')}
                          className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Confirm Violation</span>
                        </button>

                        <button
                          onClick={() => handleInspectorDecision(rule.ruleId, 'MARK_COMPLIANT')}
                          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Compliant</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
