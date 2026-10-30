'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import {
  Sparkles,
  X,
  ShieldCheck,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  CarFront,
  Building2,
  HelpCircle,
  DollarSign,
  Clock,
  Target,
  Layers,
  ShoppingBag,
} from 'lucide-react';

interface DecisionScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DecisionScoreModal({ isOpen, onClose }: DecisionScoreModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'brands' | 'vehicles' | 'formula' | 'overview'>('brands');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.get('/analytics/decision-score')
        .then((res) => setData(res.data))
        .catch((err) => console.error('Failed to load decision score', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatCurrency = (val?: number) => {
    const num = Number(val || 0);
    return `₹${Math.round(num).toLocaleString('en-IN')}`;
  };

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case 'STRONG_BUY':
        return {
          label: 'STRONG BUY 🔥',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          desc: 'High demand & rapid turnover. Priority purchase.',
        };
      case 'BUY':
        return {
          label: 'BUY ✓',
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          desc: 'Steady demand & healthy margins. Safe procurement.',
        };
      case 'CAUTION':
        return {
          label: 'CAUTION ⚠',
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          desc: 'Only procure if price is discounted by >=10%.',
        };
      default:
        return {
          label: 'DO NOT BUY ✕',
          color: 'bg-rose-50 text-rose-700 border-rose-200',
          desc: 'High holding days or low margin. High capital risk.',
        };
    }
  };

  const brandScores: any[] = data?.brand_decision_scores || [];
  const vehicleScores: any[] = data?.vehicle_decision_scores || [];

  const filteredBrands = brandScores.filter((b) =>
    b.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVehicles = vehicleScores.filter((v) =>
    v.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs font-sans animate-in fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-800">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 shadow-2xs">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Procurement Decision Intelligence
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                  Buy / Do Not Buy Model
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5 font-medium">
                Brand &amp; Vehicle purchase scores derived from previous purchase orders, sales velocity, and gross margins
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Tab navigation */}
            <div className="flex rounded-xl bg-slate-100 border border-slate-200 p-1 text-xs font-bold">
              <button
                onClick={() => setActiveTab('brands')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'brands' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Brand Buy Scores
              </button>
              <button
                onClick={() => setActiveTab('vehicles')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'vehicles' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Vehicle Buy Scores
              </button>
              <button
                onClick={() => setActiveTab('formula')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'formula' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Calculation Formula
              </button>
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'overview' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Dealership Health
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-text-secondary hover:text-slate-900 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-text-secondary font-mono font-medium">
                Calculating brand &amp; vehicle procurement decision scores from purchase orders...
              </p>
            </div>
          ) : (
            <>
              {/* TAB 1: BRAND DECISION SCORES */}
              {activeTab === 'brands' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        Brand-Level Buy Decision Matrix
                      </h3>
                      <p className="text-xs text-text-secondary font-medium">
                        Evaluates which automobile manufacturers yield the fastest turnover and highest margins
                      </p>
                    </div>
                    <input
                      type="text"
                      placeholder="Filter by brand (e.g. Maruti, Hyundai)..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white w-full sm:w-64 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredBrands.map((b) => {
                      const badge = getRecommendationBadge(b.recommendation);
                      return (
                        <div
                          key={b.brand}
                          className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 hover:border-purple-300 transition-all shadow-2xs hover:shadow-md"
                        >
                          {/* Brand Header & Score */}
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-lg font-black text-slate-900 block">
                                {b.brand}
                              </span>
                              <span className="text-[11px] text-text-secondary font-medium">
                                {b.totalProcured} past purchase orders • {b.totalSold} sold • {b.inStock} on lot
                              </span>
                            </div>

                            <div className="text-right">
                              <div className="flex items-baseline gap-1 justify-end">
                                <span className="text-3xl font-black text-purple-700 font-mono leading-none">
                                  {b.decision_score}
                                </span>
                                <span className="text-[10px] text-text-secondary font-bold">/100</span>
                              </div>
                              <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${badge.color}`}>
                                {badge.label}
                              </span>
                            </div>
                          </div>

                          {/* 4 Component Weights Progress Bars */}
                          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                              <div className="flex justify-between text-[10px] text-slate-600 font-bold">
                                <span>Turnover Velocity (30%)</span>
                                <span className="font-mono font-bold text-slate-900">{b.components?.turnoverScore}/100</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                                <div className="h-full bg-purple-600 rounded-full" style={{ width: `${b.components?.turnoverScore}%` }} />
                              </div>
                              <span className="text-[9px] text-text-secondary mt-1 block font-medium">Avg {b.avgDaysToSell} days to sell</span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                              <div className="flex justify-between text-[10px] text-slate-600 font-bold">
                                <span>Margin Yield (30%)</span>
                                <span className="font-mono font-bold text-emerald-700">{b.components?.marginScore}/100</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                                <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${b.components?.marginScore}%` }} />
                              </div>
                              <span className="text-[9px] text-text-secondary mt-1 block font-medium">{b.grossMarginPct}% gross margin</span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                              <div className="flex justify-between text-[10px] text-slate-600 font-bold">
                                <span>Demand Conversion (25%)</span>
                                <span className="font-mono font-bold text-blue-700">{b.components?.demandScore}/100</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${b.components?.demandScore}%` }} />
                              </div>
                              <span className="text-[9px] text-text-secondary mt-1 block font-medium">{b.leadsCount} leads • {b.testDrivesCount} drives</span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                              <div className="flex justify-between text-[10px] text-slate-600 font-bold">
                                <span>Lot Stock Urgency (15%)</span>
                                <span className="font-mono font-bold text-amber-700">{b.components?.riskScore}/100</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${b.components?.riskScore}%` }} />
                              </div>
                              <span className="text-[9px] text-text-secondary mt-1 block font-medium">{b.inStock} units in stock</span>
                            </div>
                          </div>

                          {/* Purchase Order Guidance */}
                          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 flex items-center justify-between text-xs">
                            <div>
                              <span className="text-[10px] text-text-secondary uppercase font-bold block">
                                Recommended Max Buy Price
                              </span>
                              <span className="font-mono font-black text-emerald-700 text-sm">
                                {formatCurrency(b.recommendedBuyCeiling)}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-text-secondary uppercase font-bold block">
                                Past Avg Selling Price
                              </span>
                              <span className="font-mono font-bold text-slate-900">
                                {formatCurrency(b.avgSellingPrice)}
                              </span>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-600 leading-relaxed italic font-medium">
                            "{b.rationale}"
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: VEHICLE MODEL DECISION SCORES */}
              {activeTab === 'vehicles' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        Vehicle Model Procurement Decision Table
                      </h3>
                      <p className="text-xs text-text-secondary font-medium">
                        Specific vehicle models ranked by procurement viability from previous purchase orders
                      </p>
                    </div>
                    <input
                      type="text"
                      placeholder="Filter model (e.g. Swift, Creta, Innova)..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white w-full sm:w-64 transition"
                    />
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-text-secondary font-bold uppercase tracking-wider">
                          <tr>
                            <th className="py-3 px-4">Vehicle Model</th>
                            <th className="py-3 px-4 text-center">Score</th>
                            <th className="py-3 px-4">Procurement Action</th>
                            <th className="py-3 px-4 text-right">Avg Acquisition</th>
                            <th className="py-3 px-4 text-right">Avg Selling Price</th>
                            <th className="py-3 px-4 text-right">Gross Margin</th>
                            <th className="py-3 px-4 text-right">Days to Sell</th>
                            <th className="py-3 px-4 text-right">Max Buy Ceiling</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredVehicles.map((v) => {
                            const badge = getRecommendationBadge(v.recommendation);
                            return (
                              <tr key={v.displayName} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4 font-bold text-slate-900">
                                  <div className="text-xs">{v.displayName}</div>
                                  <span className="text-[10px] text-text-secondary font-normal">
                                    {v.totalProcured} procured • {v.totalSold} sold • {v.inStock} lot
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center font-mono font-black text-purple-700 text-sm">
                                  {v.decision_score}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${badge.color}`}>
                                    {badge.label}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                                  {formatCurrency(v.avgAcquisitionCost)}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                                  {formatCurrency(v.avgSellingPrice)}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">
                                  {v.grossMarginPct}%
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-slate-600">
                                  {v.avgDaysToSell}d
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-black text-blue-700">
                                  {formatCurrency(v.recommendedBuyCeiling)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CALCULATION & WEIGHTAGE FORMULA EXPLANATION */}
              {activeTab === 'formula' && (
                <div className="space-y-6">
                  <div className="rounded-2xl bg-purple-50/70 border border-purple-200 p-6 space-y-3">
                    <span className="text-xs font-black uppercase tracking-wider text-purple-700 flex items-center gap-2">
                      <HelpCircle size={16} /> How the Procurement Decision Score is Calculated
                    </span>
                    <h3 className="text-lg font-mono font-black text-slate-900">
                      Decision Score = (Turnover × 30%) + (Margin × 30%) + (Demand × 25%) + (Risk × 15%)
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Unlike generic scores, CarRevive calculates procurement viability dynamically from historical dealership transactions, trade-in purchase orders, and sales receipts. This ensures managers only procure vehicles with proven demand and profitable margins.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Pillar 1 */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-900">
                        <span className="flex items-center gap-1.5 text-purple-700 font-black">
                          <Clock size={15} /> 1. Turnover Velocity (Weight: 30%)
                        </span>
                        <span className="font-mono text-purple-700 font-extrabold">Max 30 pts</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                        Measures the days elapsed between vehicle procurement (<code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono">purchase_date</code>) and customer contract closure (<code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono">sale_date</code>). Vehicles selling in under 25 days score 95–100 points, avoiding capital depreciation.
                      </p>
                    </div>

                    {/* Pillar 2 */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-900">
                        <span className="flex items-center gap-1.5 text-emerald-700 font-black">
                          <DollarSign size={15} /> 2. Realized Gross Margin (Weight: 30%)
                        </span>
                        <span className="font-mono text-emerald-700 font-extrabold">Max 30 pts</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                        Calculates actual realized gross margin from past sales (<code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono">(Selling Price - Acquisition Cost) / Selling Price</code>). Brands yielding &gt;18% gross margin score 95+ points; low-margin models (&lt;8%) are penalized.
                      </p>
                    </div>

                    {/* Pillar 3 */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-900">
                        <span className="flex items-center gap-1.5 text-blue-700 font-black">
                          <Target size={15} /> 3. Customer Demand &amp; Conversion (Weight: 25%)
                        </span>
                        <span className="font-mono text-blue-700 font-extrabold">Max 25 pts</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                        Evaluates customer inquiries, website booking leads, and test drives requested for this brand/model. High inquiry volume coupled with strong lead-to-booking conversions increases buy priority.
                      </p>
                    </div>

                    {/* Pillar 4 */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-900">
                        <span className="flex items-center gap-1.5 text-amber-700 font-black">
                          <ShieldCheck size={15} /> 4. Stock Holding Risk &amp; Urgency (Weight: 15%)
                        </span>
                        <span className="font-mono text-amber-700 font-extrabold">Max 15 pts</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                        Evaluates showroom stockyard status. If lot inventory is completely sold out with active inquiries, urgency scores 95. If 4+ units of this model are already sitting unsold on the lot, procurement priority drops to avoid overstock.
                      </p>
                    </div>

                  </div>

                  {/* Recommendation Boundaries */}
                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-3">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                      Admin Purchase Decision Thresholds
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-white border border-emerald-200 shadow-2xs">
                        <strong className="text-emerald-700 block font-mono text-sm font-black">85 – 100 pts</strong>
                        <span className="text-slate-900 font-bold block mt-1">STRONG BUY</span>
                        <p className="text-[10px] text-text-secondary mt-1 font-medium">Issue Purchase Order immediately. Maximum stock allocation.</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-blue-200 shadow-2xs">
                        <strong className="text-blue-700 block font-mono text-sm font-black">70 – 84 pts</strong>
                        <span className="text-slate-900 font-bold block mt-1">BUY</span>
                        <p className="text-[10px] text-text-secondary mt-1 font-medium">Standard procurement at benchmark trade-in pricing.</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-amber-200 shadow-2xs">
                        <strong className="text-amber-700 block font-mono text-sm font-black">55 – 69 pts</strong>
                        <span className="text-slate-900 font-bold block mt-1">CAUTION</span>
                        <p className="text-[10px] text-text-secondary mt-1 font-medium">Only procure if acquired at &gt;=10% below standard valuation.</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-rose-200 shadow-2xs">
                        <strong className="text-rose-700 block font-mono text-sm font-black">&lt; 55 pts</strong>
                        <span className="text-slate-900 font-bold block mt-1">DO NOT BUY</span>
                        <p className="text-[10px] text-text-secondary mt-1 font-medium">Avoid purchasing. Reallocate capital to high-turnover models.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: OVERALL DEALERSHIP HEALTH */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-50 via-white to-blue-50 border border-slate-200 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-6">
                      <div className="relative w-20 h-20 rounded-full bg-white border-4 border-purple-600 flex flex-col items-center justify-center text-center shadow-md">
                        <span className="text-2xl font-black font-mono text-slate-900 leading-none">
                          {data?.decision_score || 82}
                        </span>
                        <span className="text-[9px] font-extrabold text-text-secondary uppercase mt-0.5">/ 100</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-black text-slate-900">{data?.status || 'Strong Operations'}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            High Confidence
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary font-medium max-w-md">
                          Overall dealership operations score across sales execution, inventory health, and margin yields.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 6 Pillars */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data?.pillars && Object.entries(data.pillars).map(([key, p]: any) => (
                      <div key={key} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 capitalize">
                            {key.replace('_', ' ')} <small className="text-text-secondary font-normal">({p.weight})</small>
                          </span>
                          <span className="font-mono font-black text-slate-900">{p.score}/100</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              p.score >= 80 ? 'bg-emerald-500' : p.score >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${p.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs">
          <span className="text-text-secondary font-mono text-[11px] font-medium">
            CarRevive Procurement Engine • Based on historical purchase orders &amp; verified sales
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-bg-surface-alt hover:bg-black text-text-primary font-bold transition-all cursor-pointer shadow-xs"
          >
            Close Intelligence
          </button>
        </div>

      </div>
    </div>
  );
}
