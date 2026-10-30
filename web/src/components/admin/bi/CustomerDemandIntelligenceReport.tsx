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
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6 text-slate-800 font-sans relative">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[10px] font-extrabold uppercase tracking-widest border border-amber-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              CUSTOMER DECISION EVIDENCE REPORT
            </span>
            <span className="text-xs text-text-secondary font-semibold">Live Database Analytics</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 font-display">
            Customer Demand &amp; Procurement Analysis
          </h2>
          <p className="text-xs text-text-secondary mt-1 max-w-2xl font-medium">
            Evidence-backed procurement guide derived dynamically from customer inquiries, test drives, and stock turnover in the database.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab('year')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'year'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Manufacture Year Demand
          </button>

          <button
            onClick={() => setActiveTab('budget')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'budget'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CircleDollarSign className="w-3.5 h-3.5" />
            Budget &amp; Price Bands
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'evidence'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Customer Activity Evidence
          </button>
        </div>
      </div>

      {/* TAB 1: MANUFACTURE YEAR DEMAND ANALYSIS */}
      {activeTab === 'year' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Key Executive Callout Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-emerald-50 border border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Primary Procurement Recommendation</span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">Procure {topYear} Vehicles</h3>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  Customer lead and test drive inquiries strongly indicate optimal turnover for modern pre-owned models.
                </p>
              </div>
            </div>

            <div className="px-4 py-2.5 rounded-xl bg-white border border-emerald-200 text-center shrink-0 shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block">Top Category</span>
              <span className="text-base font-black text-slate-900 font-mono">{topYear}</span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {yearInsights.map((item: any) => (
              <div
                key={item.yearRange}
                className={`p-5 rounded-2xl border bg-white flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-md transition-all ${
                  item.color === 'emerald'
                    ? 'border-emerald-200 hover:border-emerald-300'
                    : item.color === 'indigo'
                    ? 'border-blue-200 hover:border-blue-300'
                    : 'border-amber-200 hover:border-amber-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-black text-slate-900">{item.yearRange}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                        item.color === 'emerald'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : item.color === 'indigo'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    <strong className="text-slate-900">Customer Signal:</strong> {item.why}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 text-xs">
                  <span className="text-text-secondary block text-[10px] uppercase font-bold">Suggested Action</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{item.action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: BUDGET & PRICE BAND DEMAND ANALYSIS */}
      {activeTab === 'budget' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {budgetInsights.map((item: any) => (
              <div
                key={item.priceBand}
                className="p-5 rounded-2xl border border-slate-200/90 bg-white flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black text-slate-900">{item.priceBand}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                      {item.velocity}
                    </span>
                  </div>

                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>Buyer Volume Share</span>
                      <span className="font-mono font-bold text-emerald-600">{item.share}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-blue-600" style={{ width: `${item.share}%` }} />
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-3 font-medium">
                    <strong className="text-slate-900">Evidence:</strong> {item.why}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 text-xs">
                  <span className="text-text-secondary block text-[10px] uppercase font-bold">Stock Status</span>
                  <span className="font-bold text-emerald-700 mt-0.5 block">{item.stockInfo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: REAL CUSTOMER EVIDENCE */}
      {activeTab === 'evidence' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between text-xs text-text-secondary mb-2 font-medium">
            <span>Verified Customer Activity from Database</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{evidenceList.length} Customer Records</span>
          </div>

          {evidenceList.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-secondary">
              No customer inquiries recorded yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {evidenceList.map((cust) => (
                <div
                  key={cust.evidence_id}
                  className="p-5 rounded-2xl bg-white border border-slate-200/90 flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-md transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
                          {(cust.customer_name || 'C').charAt(0)}
                        </div>
                        <div>
                          <strong className="text-xs text-slate-900 block font-bold">{cust.customer_name}</strong>
                          <span className="text-[10px] text-text-secondary">{cust.branch_name || cust.customer_phone}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {cust.status}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 mb-3 text-xs">
                      <div className="text-text-secondary text-[10px] uppercase font-bold">Vehicle Activity</div>
                      <div className="font-bold text-slate-900">{cust.vehicle_preferred}</div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      "{cust.evidence_details}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-text-secondary font-medium">{cust.date}</span>
                    <span className="text-blue-600 font-bold flex items-center gap-1">
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
