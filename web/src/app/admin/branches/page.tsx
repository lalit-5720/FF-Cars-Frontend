'use client';

import React, { useState, useEffect } from 'react';
import { RequireRole } from '../../../components/auth/RequireRole';
import { api } from '../../../services/api';
import { Building2, TrendingUp, CarFront, Award, RefreshCw, MapPin, Phone, ArrowUpRight } from 'lucide-react';

interface BranchPerformanceItem {
  branch_id: number;
  branch_name: string;
  manager_name: string;
  city: string;
  total_revenue: number;
  total_sales: number;
  active_inventory_count: number;
  total_inventory_value: number;
  avg_days_to_sell: number;
  lead_conversion_rate: number;
  top_selling_model: string;
  efficiency_rating: string;
}

export default function AdminBranchesPage() {
  const [loading, setLoading] = useState(true);
  const [branchList, setBranchList] = useState<BranchPerformanceItem[]>([]);

  const fetchBranchPerformance = async () => {
    setLoading(true);
    try {
      let res;
      try {
        res = await api.get('/analytics/branch-performance');
      } catch {
        res = await api.get('/bi/branch-performance');
      }
      if (res.data) setBranchList(res.data);
    } catch (err) {
      console.error('Failed to load branch performance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranchPerformance();
  }, []);

  const formatRupees = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakhs`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <RequireRole allow={['SYSTEM_ADMIN', 'BRANCH_MANAGER', 'SALES_EXECUTIVE']}>
      <div className="space-y-6 text-slate-100 font-sans pb-10">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-extrabold uppercase tracking-wider border border-indigo-500/30">
                Multi-Location Reporting
              </span>
              <span className="text-xs text-slate-400 font-medium">Dealership Network Performance</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white mt-1 flex items-center gap-2.5">
              <Building2 size={24} className="text-indigo-400" />
              Branch Performance & Inventory Efficiency
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Live branch-by-branch sales revenue, inventory turnover, lead conversion rates, and top-selling car models
            </p>
          </div>

          <button
            onClick={fetchBranchPerformance}
            className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 text-xs font-bold transition-all border border-slate-700 cursor-pointer shadow"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Branch Metrics</span>
          </button>
        </div>

        {/* Branch Performance Cards Grid */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-48 bg-slate-800/40 rounded-2xl animate-pulse" />
            <div className="h-48 bg-slate-800/40 rounded-2xl animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {branchList.map((branch) => (
              <div
                key={branch.branch_id}
                className="rounded-2xl bg-[#1e293b]/90 border border-slate-800 p-6 shadow-xl space-y-5 hover:border-indigo-500/40 transition-all"
              >
                {/* Branch Card Header */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 font-extrabold">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-white">{branch.branch_name}</h2>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1"><MapPin size={12} /> {branch.city}</span>
                        <span>Manager: <strong className="text-slate-200">{branch.manager_name}</strong></span>
                      </div>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-extrabold uppercase border border-emerald-500/30">
                    {branch.efficiency_rating}
                  </span>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">TOTAL REVENUE</span>
                    <strong className="text-sm font-black text-sky-400">{formatRupees(branch.total_revenue)}</strong>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">TOTAL SALES</span>
                    <strong className="text-sm font-black text-emerald-400">{branch.total_sales} Cars</strong>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">ACTIVE INVENTORY</span>
                    <strong className="text-sm font-black text-amber-400">{branch.active_inventory_count} Vehicles</strong>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">CONVERSION RATE</span>
                    <strong className="text-sm font-black text-purple-400">{branch.lead_conversion_rate}%</strong>
                  </div>
                </div>

                {/* Additional Performance Details */}
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">Top Performing Model:</span>
                    <strong className="block text-white font-extrabold text-sm">{branch.top_selling_model}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[11px]">Avg Days on Lot:</span>
                    <strong className="block text-sky-400 font-extrabold text-sm">{branch.avg_days_to_sell} Days</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RequireRole>
  );
}
