'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Award,
  Users,
  Calendar,
  CircleDollarSign,
  Phone,
  Star,
} from 'lucide-react';
import { api } from '../../../services/api';

interface CustomerDemandReportProps {
  data?: any;
}

export function CustomerDemandIntelligenceReport({ data: initialData }: CustomerDemandReportProps) {
  const [activeTab, setActiveTab] = useState<'year' | 'budget' | 'evidence'>('year');
  const [procData, setProcData] = useState<any>(initialData || null);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        const [procRes, evRes] = await Promise.allSettled([
          initialData ? Promise.resolve({ data: initialData }) : api.get('/analytics/procurement-intelligence'),
          api.get('/analytics/branch-evidence-report'),
        ]);

        if (isMounted) {
          if (procRes.status === 'fulfilled' && procRes.value.data) {
            setProcData(procRes.value.data);
          }
          if (evRes.status === 'fulfilled' && evRes.value.data?.branch_reports) {
            const allEv: any[] = [];
            for (const b of evRes.value.data.branch_reports) {
              if (Array.isArray(b.customer_evidence_records)) {
                for (const rec of b.customer_evidence_records) {
                  allEv.push({
                    ...rec,
                    branch_name: b.branch_name,
                  });
                }
              }
            }
            setEvidenceList(allEv);
          }
        }
      } catch (err) {
        console.warn('Failed to load customer demand evidence:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [initialData]);

  const rawYearDemand = procData?.manufactureYearDemand || [];
  const rawPriceBands = procData?.priceBandPreferences || [];

  const yearInsights = rawYearDemand.map((yd: any) => ({
    yearRange: yd.yearRange,
    share: yd.demandScore > 0 ? Math.min(100, yd.demandScore * 10) : 0,
    status: yd.recommendation === 'HIGH_BUY' ? 'HIGHLY RECOMMENDED' : yd.recommendation === 'HOLD_OVERSTOCKED' ? 'OVERSTOCKED' : 'BALANCED DEMAND',
    color: yd.recommendation === 'HIGH_BUY' ? 'emerald' : yd.recommendation === 'HOLD_OVERSTOCKED' ? 'amber' : 'indigo',
    why: yd.recommendationMessage || `Demand score: ${yd.demandScore} (${yd.leadsCount} leads, ${yd.testDrivesCount} test drives, ${yd.availableStock} in stock)`,
    action: `Available stock: ${yd.availableStock} units. ${yd.recommendation === 'HIGH_BUY' ? 'Procure more units.' : 'Maintain current level.'}`,
  }));

  const budgetInsights = rawPriceBands.map((pb: any) => ({
    priceBand: pb.priceBand,
    share: pb.preferencePercent || 0,
    velocity: `${pb.inquiriesCount + pb.testDrivesCount} Inquiries`,
    status: pb.recommendation === 'HIGH_DEMAND' ? 'HIGH DEMAND' : pb.recommendation === 'LOW_DEMAND' ? 'LOW TURNOVER' : 'STEADY DEMAND',
    color: pb.recommendation === 'HIGH_DEMAND' ? 'emerald' : pb.recommendation === 'LOW_DEMAND' ? 'amber' : 'indigo',
    why: `${pb.preferencePercent}% of buyer inquiries belong to the ${pb.priceBand} price bracket (${pb.availableStock} in inventory).`,
    stockInfo: `${pb.availableStock} active vehicles in stock`,
  }));

  const topYear = yearInsights[0]?.yearRange || 'Current Models';
  const topBudget = budgetInsights.find((b: any) => b.share > 30)?.priceBand || 'Mid-range Budget';

  return (
    <div className="bg-[#141A2A] border border-[#5468F0]/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-100 font-sans relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#5468F0]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#2D374A] relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-extrabold uppercase tracking-widest border border-amber-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              CUSTOMER DECISION EVIDENCE REPORT
            </span>
            <span className="text-xs text-slate-400 font-semibold">Live Database Analytics</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white font-display">
            Customer Demand &amp; Procurement Analysis
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Evidence-backed procurement guide derived dynamically from customer inquiries, test drives, and stock turnover in the database.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0B0F1A] border border-[#2D374A] rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab('year')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'year'
                ? 'bg-[#5468F0] text-white shadow-lg shadow-[#5468F0]/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Manufacture Year Demand
          </button>

          <button
            onClick={() => setActiveTab('budget')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'budget'
                ? 'bg-[#5468F0] text-white shadow-lg shadow-[#5468F0]/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CircleDollarSign className="w-3.5 h-3.5" />
            Budget &amp; Price Bands
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'evidence'
                ? 'bg-[#5468F0] text-white shadow-lg shadow-[#5468F0]/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Customer Activity Evidence
          </button>
        </div>
      </div>

      {/* TAB 1: MANUFACTURE YEAR DEMAND ANALYSIS */}
      {activeTab === 'year' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 relative z-10">
          {/* Key Executive Callout Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-[#0B0F1A] to-[#141A2A] border border-emerald-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Primary Procurement Recommendation</span>
                <h3 className="text-lg font-bold text-white mt-0.5">Procure {topYear} Vehicles</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Customer lead and test drive inquiries strongly indicate optimal turnover for modern pre-owned models.
                </p>
              </div>
            </div>

            <div className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center shrink-0">
              <span className="text-[10px] font-bold text-emerald-300 uppercase block">Top Category</span>
              <span className="text-base font-black text-white font-mono">{topYear}</span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {yearInsights.map((item: any) => (
              <div
                key={item.yearRange}
                className={`p-5 rounded-2xl border bg-[#0B0F1A] flex flex-col justify-between space-y-4 shadow-lg ${
                  item.color === 'emerald'
                    ? 'border-emerald-500/40 shadow-emerald-950/20'
                    : item.color === 'indigo'
                    ? 'border-indigo-500/30'
                    : 'border-amber-500/30'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-black text-white">{item.yearRange}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                        item.color === 'emerald'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : item.color === 'indigo'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    <strong className="text-white">Customer Signal:</strong> {item.why}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Suggested Action</span>
                  <span className="font-semibold text-white mt-0.5 block">{item.action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: BUDGET & PRICE BAND DEMAND ANALYSIS */}
      {activeTab === 'budget' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {budgetInsights.map((item: any) => (
              <div
                key={item.priceBand}
                className="p-5 rounded-2xl border border-slate-800 bg-[#0B0F1A] flex flex-col justify-between space-y-4 shadow-lg hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black text-white">{item.priceBand}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      {item.velocity}
                    </span>
                  </div>

                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-xs font-semibold text-slate-300">
                      <span>Buyer Volume Share</span>
                      <span className="font-mono font-bold text-emerald-400">{item.share}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full bg-sky-400" style={{ width: `${item.share}%` }} />
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    <strong className="text-white">Evidence:</strong> {item.why}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Stock Status</span>
                  <span className="font-semibold text-emerald-400 mt-0.5 block">{item.stockInfo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: REAL CUSTOMER EVIDENCE */}
      {activeTab === 'evidence' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 relative z-10">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Verified Customer Activity from Database</span>
            <span className="text-emerald-400 font-bold">{evidenceList.length} Customer Records</span>
          </div>

          {evidenceList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No customer inquiries recorded yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {evidenceList.map((cust) => (
                <div
                  key={cust.evidence_id}
                  className="p-5 rounded-2xl bg-[#0B0F1A] border border-[#5468F0]/30 flex flex-col justify-between space-y-4 shadow-lg hover:border-[#5468F0]/60 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#5468F0]/20 text-[#5468F0] font-bold text-xs flex items-center justify-center border border-[#5468F0]/40">
                          {(cust.customer_name || 'C').charAt(0)}
                        </div>
                        <div>
                          <strong className="text-xs text-white block">{cust.customer_name}</strong>
                          <span className="text-[10px] text-slate-400">{cust.branch_name || cust.customer_phone}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {cust.status}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 mb-3 text-xs">
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Vehicle Activity</div>
                      <div className="font-bold text-white">{cust.vehicle_preferred}</div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed italic">
                      "{cust.evidence_details}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">{cust.date}</span>
                    <span className="text-[#7B8CFF] font-bold flex items-center gap-1">
                      Verified DB Record ✓
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
