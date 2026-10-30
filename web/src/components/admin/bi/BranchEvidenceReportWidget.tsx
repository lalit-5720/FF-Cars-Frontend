'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Users, Star, Calendar, FileText, CheckCircle2, ShieldCheck, Phone, Mail, Award, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../../../services/api';

interface CustomerEvidenceRecord {
  evidence_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  vehicle_preferred: string;
  vehicle_price: number;
  activity_type: string;
  status: string;
  rating: number;
  evidence_details: string;
  date: string;
  badge: string;
}

interface BranchReportItem {
  branch_id: number;
  branch_name: string;
  manager_name: string;
  city: string;
  phone: string;
  active_vehicles_count: number;
  total_sales_count: number;
  evidence_records_count: number;
  customer_evidence_records: CustomerEvidenceRecord[];
}

export function BranchEvidenceReportWidget() {
  const [loading, setLoading] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState<number>(1);
  const [reportData, setReportData] = useState<BranchReportItem[]>([]);

  const fetchEvidenceReport = async () => {
    setLoading(true);
    try {
      let res;
      try {
        res = await api.get('/analytics/branch-evidence-report');
      } catch {
        res = await api.get('/bi/branch-evidence-report');
      }

      if (res.data && res.data.branch_reports) {
        setReportData(res.data.branch_reports);
        if (res.data.branch_reports.length > 0) {
          setSelectedBranchId(res.data.branch_reports[0].branch_id);
        }
      }
    } catch (err) {
      console.warn('Failed to load branch evidence report:', err);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidenceReport();
  }, []);

  const activeBranchReport = reportData.find((b) => b.branch_id === selectedBranchId) || reportData[0];

  const formatRupees = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakhs`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return <div className="h-80 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />;
  }

  if (!activeBranchReport) return null;

  return (
    <div id="branch-evidence-report-section" className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-2xs hover:shadow-md transition-all space-y-5 font-sans">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
            <Award size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-200 flex items-center gap-1">
                <ShieldCheck size={12} />
                5 Deliveries &amp; Test Drives Available
              </span>
              <span className="text-[11px] text-text-secondary font-medium hidden sm:inline">
                Branch Reallocation Audit Trail
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
              Branch Reallocation &amp; 5 Delivery Availability Audit
            </h2>
            <p className="text-xs text-text-secondary mt-0.5 font-medium">
              Live customer preference signals &amp; scheduled test drives supporting stock transfers
            </p>
          </div>
        </div>

        {/* Branch Selector Tabs */}
        <div className="flex items-center gap-2">
          {reportData.map((b) => (
            <button
              key={b.branch_id}
              onClick={() => setSelectedBranchId(b.branch_id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border ${
                selectedBranchId === b.branch_id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50 shadow-2xs'
              }`}
            >
              <Building2 size={13} />
              <span>{b.branch_name}</span>
            </button>
          ))}
          <button
            onClick={fetchEvidenceReport}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
            title="Refresh Evidence Data"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Branch Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/90 text-xs">
        <div>
          <span className="text-[10px] text-text-secondary block font-bold">BRANCH MANAGER</span>
          <strong className="text-slate-900 font-extrabold">{activeBranchReport.manager_name}</strong>
        </div>
        <div>
          <span className="text-[10px] text-text-secondary block font-bold">LOCATION</span>
          <strong className="text-blue-600 font-extrabold">{activeBranchReport.city}</strong>
        </div>
        <div>
          <span className="text-[10px] text-text-secondary block font-bold">AVAILABLE INVENTORY</span>
          <strong className="text-emerald-700 font-extrabold">{activeBranchReport.active_vehicles_count} Vehicles</strong>
        </div>
        <div>
          <span className="text-[10px] text-text-secondary block font-bold">VERIFIED EVIDENCE ITEMS</span>
          <strong className="text-amber-800 font-extrabold">{activeBranchReport.customer_evidence_records.length} Customer Audits</strong>
        </div>
      </div>

      {/* 5 Customer Demand Evidence Cards List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Users size={15} className="text-blue-600" />
            <span>Top 5 Customer Demand Evidence Audits ({activeBranchReport.branch_name})</span>
          </h3>
          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 size={12} />
            Verified Database Records
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {activeBranchReport.customer_evidence_records.map((item, idx) => (
            <div
              key={item.evidence_id}
              className="rounded-xl bg-white border border-slate-200/90 p-3.5 shadow-2xs flex flex-col justify-between space-y-3 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px] flex items-center justify-center border border-blue-200">
                    #{idx + 1}
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {item.badge}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 leading-tight">{item.customer_name}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-text-secondary mt-0.5 font-medium">
                    <span className="flex items-center gap-0.5"><Phone size={10} /> {item.customer_phone}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-text-secondary block font-bold">PREFERRED CAR</span>
                  <p className="text-xs font-extrabold text-blue-700 leading-snug">{item.vehicle_preferred}</p>
                  <span className="text-[10px] text-text-secondary font-bold">{formatRupees(item.vehicle_price)}</span>
                </div>

                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/80 text-[10px] text-slate-600 italic leading-relaxed">
                  "{item.evidence_details}"
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-text-secondary font-medium">
                <span className="flex items-center gap-1"><Calendar size={10} /> {item.date}</span>
                <span className="flex items-center gap-0.5 text-amber-600 font-extrabold">
                  <Star size={10} className="fill-amber-500 text-amber-500" /> {item.rating}/5
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
