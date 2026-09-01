import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { ComplaintRecord } from '../types';
import { AlertTriangle, Plus, CheckCircle2, Clock, UserCheck } from 'lucide-react';

export const ComplaintsPage: React.FC = () => {
  const complaints = useLiveQuery(() => db.complaints.orderBy('createdAt').reverse().toArray()) || [];
  const [showModal, setShowModal] = useState(false);

  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [reporter, setReporter] = useState('');

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    const newComplaint: ComplaintRecord = {
      id: `cmp-${Date.now()}`,
      complaintNumber: `CMP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      productName,
      brand,
      manufacturer: 'Reported Manufacturer',
      category: 'Packaged Food',
      issueDescription,
      reporter: reporter || 'Anonymous Consumer',
      reporterContact: '+91 9000000000',
      status: 'VERIFIED',
      createdAt: new Date().toISOString()
    };

    await db.complaints.put(newComplaint);
    setShowModal(false);
    setProductName('');
    setBrand('');
    setIssueDescription('');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Consumer Complaint Intelligence</h2>
          <p className="text-xs text-slate-500">Public feedback and MRP overcharging reports mapped to products</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Log Consumer Complaint</span>
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateComplaint} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Log New Consumer Complaint</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Product Name</label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. NutriBake Oats Biscuits"
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Brand Name</label>
                <input
                  type="text"
                  required
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. NutriBake"
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Issue Description</label>
                <textarea
                  required
                  rows={3}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Describe MRP alteration, missing date, or smudged declaration..."
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Reporter Name</label>
                <input
                  type="text"
                  value={reporter}
                  onChange={(e) => setReporter(e.target.value)}
                  placeholder="Consumer Name"
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                Save Complaint
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {complaints.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No active complaints logged</div>
        ) : (
          complaints.map((cmp) => (
            <div key={cmp.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{cmp.productName}</span>
                  <span className="mono-font text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {cmp.complaintNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{cmp.issueDescription}</p>
                <div className="text-[11px] text-slate-400">
                  Reported by: <span className="font-semibold text-slate-700">{cmp.reporter}</span> on {new Date(cmp.createdAt).toLocaleDateString()}
                </div>
              </div>

              <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 self-start md:self-center">
                {cmp.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
