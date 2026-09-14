'use client';

import React, { useState } from 'react';
import { ManufactureYearDemandChart } from './ManufactureYearDemandChart';
import { PricePreferenceChart } from './PricePreferenceChart';
import { PurchaseOrderModal } from './PurchaseOrderModal';
import { DynamicRepricingWidget } from './DynamicRepricingWidget';
import { BranchEvidenceReportWidget } from './BranchEvidenceReportWidget';
import {
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Filter,
  ArrowRight,
  ShieldAlert,
  CarFront,
  Sparkles,
  PlusCircle,
} from 'lucide-react';

interface ProcurementIntelligenceHubProps {
  data: any;
  loading?: boolean;
  onRefresh?: () => void;
}

export function ProcurementIntelligenceHub({ data, loading, onRefresh }: ProcurementIntelligenceHubProps) {
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [priceFilter, setPriceFilter] = useState<string>('ALL');

  // Purchase Order Modal State
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [poInitialData, setPoInitialData] = useState<any>(null);

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-48 rounded-2xl bg-slate-800/40 animate-pulse border border-slate-700/50" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-72 rounded-2xl bg-slate-800/40 animate-pulse border border-slate-700/50" />
          <div className="h-72 rounded-2xl bg-slate-800/40 animate-pulse border border-slate-700/50" />
        </div>
      </div>
    );
  }

  const { manufactureYearDemand, priceBandPreferences, buyingAlerts, summary } = data;

  const filteredManufactureYear = yearFilter === 'ALL'
    ? manufactureYearDemand
    : manufactureYearDemand?.filter((y: any) => y.yearRange.includes(yearFilter));

  const filteredPriceBand = priceFilter === 'ALL'
    ? priceBandPreferences
    : priceBandPreferences?.filter((p: any) => p.priceBand.includes(priceFilter));

  const openPoModalForAlert = (alert: any) => {
    setPoInitialData({
      manufactureYear: alert.manufactureYear,
      priceBand: alert.priceBand,
      vehicleCategory: alert.vehicleCategory,
    });
    setIsPoModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls Bar */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-sky-500/20 p-5 shadow-xl">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0 shadow-lg">
              <ShoppingBag size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-extrabold uppercase tracking-wider border border-sky-400/30">
                  Car Buying Intelligence Hub
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                  <Sparkles size={12} />
                  Live Customer Signals
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight mt-1">
                Vehicle Procurement & Stock Advisor
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                AI buying recommendations based on {summary?.totalLeadsAnalyzed || 0} customer leads & {summary?.totalTestDrivesAnalyzed || 0} test drive bookings
              </p>
            </div>
          </div>

          {/* Interactive Filter & Action Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Create PO Button */}
            <button
              onClick={() => {
                setPoInitialData(null);
                setIsPoModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-3.5 py-2 text-xs font-extrabold transition-all shadow-md cursor-pointer border border-sky-400/30"
            >
              <PlusCircle size={14} />
              <span>Create Purchase Order (PO)</span>
            </button>

            {/* Manufacture Year Filter */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-200">
              <Filter size={13} className="text-sky-400" />
              <span className="text-slate-400 text-[11px]">Year:</span>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="ALL" className="bg-slate-900">All Manufacture Years</option>
                <option value="2023" className="bg-slate-900">2023 - 2024 Models</option>
                <option value="2021" className="bg-slate-900">2021 - 2022 Models</option>
                <option value="2018" className="bg-slate-900">2018 - 2020 Models</option>
                <option value="Before" className="bg-slate-900">Before 2018 Models</option>
              </select>
            </div>

            {/* Price Band Filter */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-200">
              <Filter size={13} className="text-indigo-400" />
              <span className="text-slate-400 text-[11px]">Budget:</span>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="ALL" className="bg-slate-900">All Price Bands</option>
                <option value="10" className="bg-slate-900">Under ₹10L</option>
                <option value="10L" className="bg-slate-900">₹10L - ₹20L</option>
                <option value="20L" className="bg-slate-900">₹20L - ₹35L</option>
                <option value="35L" className="bg-slate-900">₹35L - ₹50L</option>
                <option value="50" className="bg-slate-900">&gt; ₹50L</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Summary Pill Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs">
          <div className="rounded-xl bg-slate-900/60 p-2.5 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold">PREFERRED YEAR</span>
            <strong className="text-sm font-extrabold text-sky-400">{summary?.preferredManufactureYear || '2021 - 2024'}</strong>
          </div>
          <div className="rounded-xl bg-slate-900/60 p-2.5 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold">PREFERRED BUDGET</span>
            <strong className="text-sm font-extrabold text-indigo-400">{summary?.preferredPriceBand || '₹10L - ₹35L'}</strong>
          </div>
          <div className="rounded-xl bg-slate-900/60 p-2.5 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold">AVAILABLE STOCK</span>
            <strong className="text-sm font-extrabold text-emerald-400">{summary?.activeStockCount || 0} Vehicles</strong>
          </div>
          <div className="rounded-xl bg-slate-900/60 p-2.5 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold">BUYING ALERTS</span>
            <strong className="text-sm font-extrabold text-amber-400">{buyingAlerts?.length || 0} Recommended Actions</strong>
          </div>
        </div>
      </div>

      {/* Actionable Car Buying Recommendation Alert Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
          <ShieldAlert size={16} className="text-sky-400" />
          <span>Procurement Buying Decision Recommendations</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {buyingAlerts?.map((alert: any) => {
            const isBuy = alert.action === 'BUY_NOW';
            const isHold = alert.action === 'HOLD_PROCUREMENT';

            return (
              <div
                key={alert.id}
                className={`rounded-2xl border p-4 shadow-md transition-all flex flex-col justify-between ${
                  isBuy
                    ? 'bg-emerald-950/30 border-emerald-500/30 hover:border-emerald-500/50'
                    : isHold
                    ? 'bg-rose-950/30 border-rose-500/30 hover:border-rose-500/50'
                    : 'bg-amber-950/30 border-amber-500/30 hover:border-amber-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        isBuy
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isHold
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {isBuy ? '🟢 BUY NOW SIGNAL' : isHold ? '🔴 HOLD PROCUREMENT' : '🟡 REALLOCATE'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {alert.priority} PRIORITY
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-white mb-1">{alert.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">{alert.evidence}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Target Year: <strong className="text-slate-200">{alert.manufactureYear}</strong></span>
                  <button
                    onClick={() => openPoModalForAlert(alert)}
                    className="flex items-center gap-1 font-extrabold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20"
                  >
                    <span>Create Order</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FEATURE 2: AI DYNAMIC REPRICING WIDGET */}
      <DynamicRepricingWidget />

      {/* FEATURE 3: BRANCH DEMAND & CUSTOMER EVIDENCE REPORT */}
      <BranchEvidenceReportWidget />

      {/* 2 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ManufactureYearDemandChart data={filteredManufactureYear} />
        <PricePreferenceChart data={filteredPriceBand} />
      </div>

      {/* Feature 1: Purchase Order Creation Modal */}
      <PurchaseOrderModal
        isOpen={isPoModalOpen}
        onClose={() => setIsPoModalOpen(false)}
        initialData={poInitialData}
        onSuccess={onRefresh}
      />
    </div>
  );
}
