'use client';

import React, { useState, useEffect } from 'react';
import { RequireRole } from '../../../components/auth/RequireRole';
import { api } from '../../../services/api';
import { Gauge, ShoppingBag, TrendingUp, AlertTriangle, CarFront, CheckCircle2, RefreshCw, ArrowRight } from 'lucide-react';
import { showLocalToast } from '../../../components/Toast';
import { CustomerDemandIntelligenceReport } from '../../../components/admin/bi/CustomerDemandIntelligenceReport';

interface DemandItem {
  make: string;
  model: string;
  vehicleName: string;
  leadsCount: number;
  testDrivesCount: number;
  salesCount: number;
  availableStock: number;
  demandScore: number;
  status: 'HIGH_DEMAND_BUY' | 'MODERATE_BUY' | 'HOLD_OVERSTOCKED' | 'BALANCED';
  buySuggestion: string;
}

export default function AdminDemandPage() {
  const [loading, setLoading] = useState(true);
  const [demandList, setDemandList] = useState<DemandItem[]>([]);

  const fetchDemand = async () => {
    setLoading(true);
    try {
      let res;
      try {
        res = await api.get('/analytics/vehicle-demand');
      } catch {
        res = await api.get('/bi/vehicle-demand');
      }
      if (res.data) setDemandList(res.data);
    } catch (err) {
      console.error('Failed to load vehicle demand:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemand();
  }, []);

  return (
    <RequireRole allow={['SYSTEM_ADMIN', 'BRANCH_MANAGER', 'SALES_EXECUTIVE']}>
      <div className="space-y-6 text-slate-100 font-sans pb-10">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-extrabold uppercase tracking-wider border border-sky-500/30">
                Live Database Intelligence
              </span>
              <span className="text-xs text-slate-400 font-medium">Customer Inquiries & Test Drive Signals</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white mt-1 flex items-center gap-2.5">
              <Gauge size={24} className="text-sky-400" />
              Vehicle Demand & Purchase Suggestions
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Real-time vehicle buy suggestions calculated from lead inquiries, test drives, and stock levels (e.g. Mahindra XUV300, Kia Seltos)
            </p>
          </div>

          <button
            onClick={fetchDemand}
            className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 text-xs font-bold transition-all border border-slate-700 cursor-pointer shadow"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Demand Scores</span>
          </button>
        </div>

        {/* Customer Preference & Procurement Evidence Report */}
        <CustomerDemandIntelligenceReport />

        {/* Top KPI Cards Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-[#1e293b]/90 border border-slate-800 p-4 shadow-lg">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">TOTAL MODELS ANALYZED</span>
            <strong className="text-2xl font-black text-white">{demandList.length} Models</strong>
          </div>
          <div className="rounded-2xl bg-[#1e293b]/90 border border-sky-500/30 p-4 shadow-lg">
            <span className="text-[10px] font-extrabold uppercase text-sky-400 block">HIGH BUY SIGNALS</span>
            <strong className="text-2xl font-black text-sky-400">
              {demandList.filter((d) => d.status === 'HIGH_DEMAND_BUY').length} Models
            </strong>
          </div>
          <div className="rounded-2xl bg-[#1e293b]/90 border border-emerald-500/30 p-4 shadow-lg">
            <span className="text-[10px] font-extrabold uppercase text-emerald-400 block">MODERATE BUY SIGNALS</span>
            <strong className="text-2xl font-black text-emerald-400">
              {demandList.filter((d) => d.status === 'MODERATE_BUY').length} Models
            </strong>
          </div>
          <div className="rounded-2xl bg-[#1e293b]/90 border border-amber-500/30 p-4 shadow-lg">
            <span className="text-[10px] font-extrabold uppercase text-amber-400 block">ZERO STOCK DEFICIT</span>
            <strong className="text-2xl font-black text-amber-400">
              {demandList.filter((d) => d.availableStock === 0).length} Models
            </strong>
          </div>
        </div>

        {/* Vehicle Demand & Buy Suggestion Cards */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-slate-800/40 animate-pulse border border-slate-700/50" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag size={16} className="text-sky-400" />
              <span>Calculated Vehicle Purchase Recommendations</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {demandList.map((item) => {
                const isHighBuy = item.status === 'HIGH_DEMAND_BUY';
                const isModerateBuy = item.status === 'MODERATE_BUY';
                const isOverstocked = item.status === 'HOLD_OVERSTOCKED';

                return (
                  <div
                    key={item.vehicleName}
                    className={`rounded-2xl border p-5 shadow-xl transition-all flex flex-col justify-between space-y-4 ${
                      isHighBuy
                        ? 'bg-sky-950/30 border-sky-500/40 hover:border-sky-400'
                        : isModerateBuy
                        ? 'bg-emerald-950/30 border-emerald-500/40 hover:border-emerald-400'
                        : isOverstocked
                        ? 'bg-rose-950/30 border-rose-500/40 hover:border-rose-400'
                        : 'bg-[#1e293b]/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            isHighBuy
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              : isModerateBuy
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isOverstocked
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {isHighBuy ? '🟢 HIGH PRIORITY BUY' : isModerateBuy ? '🟢 BUY SUGGESTION' : isOverstocked ? '🔴 HOLD STOCK' : '⚪ BALANCED'}
                        </span>
                        <span className="text-[11px] font-extrabold text-slate-400">
                          Score: <strong className="text-white">{item.demandScore}</strong>
                        </span>
                      </div>

                      <h3 className="text-base font-black text-white flex items-center gap-2">
                        <CarFront size={18} className="text-sky-400" />
                        {item.vehicleName}
                      </h3>

                      {/* Demand Signals Metrics */}
                      <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800 text-center text-xs">
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                          <span className="text-[9px] text-slate-400 block font-semibold">LEADS</span>
                          <strong className="text-white font-extrabold">{item.leadsCount}</strong>
                        </div>
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                          <span className="text-[9px] text-slate-400 block font-semibold">TEST DRIVES</span>
                          <strong className="text-sky-400 font-extrabold">{item.testDrivesCount}</strong>
                        </div>
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                          <span className="text-[9px] text-slate-400 block font-semibold">SALES</span>
                          <strong className="text-emerald-400 font-extrabold">{item.salesCount}</strong>
                        </div>
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                          <span className="text-[9px] text-slate-400 block font-semibold">STOCK</span>
                          <strong className={item.availableStock === 0 ? 'text-rose-400 font-black' : 'text-amber-400 font-extrabold'}>
                            {item.availableStock}
                          </strong>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 mt-3 font-medium leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                        {item.buySuggestion}
                      </p>
                    </div>

                    <button
                      onClick={() => showLocalToast(`Creating procurement request for ${item.vehicleName}`)}
                      className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer"
                    >
                      <ShoppingBag size={14} />
                      <span>Procure {item.make} {item.model}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </RequireRole>
  );
}
