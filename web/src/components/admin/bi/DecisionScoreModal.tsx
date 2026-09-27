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
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/30',
          desc: 'High demand & rapid turnover. Priority purchase.',
        };
      case 'BUY':
        return {
          label: 'BUY ✓',
          color: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          desc: 'Steady demand & healthy margins. Safe procurement.',
        };
      case 'CAUTION':
        return {
          label: 'CAUTION ⚠',
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          desc: 'Only procure if price is discounted by >=10%.',
        };
      default:
        return {
          label: 'DO NOT BUY ✕',
          color: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md font-sans animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col text-foreground">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-border bg-secondary/30 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 shadow-sm">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-white tracking-tight font-display">
                  Procurement Decision Intelligence
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  Buy / Do Not Buy Model
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Brand &amp; Vehicle purchase scores derived from previous purchase orders, sales velocity, and gross margins
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Tab navigation */}
            <div className="flex rounded-xl bg-slate-900 border border-border p-1 text-xs font-bold">
              <button
                onClick={() => setActiveTab('brands')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'brands' ? 'bg-purple-600 text-white shadow-sm font-extrabold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Brand Buy Scores
              </button>
              <button
                onClick={() => setActiveTab('vehicles')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'vehicles' ? 'bg-purple-600 text-white shadow-sm font-extrabold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Vehicle Buy Scores
              </button>
              <button
                onClick={() => setActiveTab('formula')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'formula' ? 'bg-purple-600 text-white shadow-sm font-extrabold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Calculation Formula
              </button>
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'overview' ? 'bg-purple-600 text-white shadow-sm font-extrabold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Dealership Health
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground font-mono">
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
                      <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
                        Brand-Level Buy Decision Matrix
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Evaluates which automobile manufacturers yield the fastest turnover and highest margins
                      </p>
                    </div>
                    <input
                      type="text"
                      placeholder="Filter by brand (e.g. Maruti, Hyundai)..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-secondary/60 border border-border rounded-xl px-3.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500 w-full sm:w-64"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredBrands.map((b) => {
                      const badge = getRecommendationBadge(b.recommendation);
                      return (
                        <div
                          key={b.brand}
                          className="rounded-2xl border border-border bg-secondary/20 p-5 space-y-4 hover:border-purple-500/40 transition-all shadow-md"
                        >
                          {/* Brand Header & Score */}
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-lg font-black text-white font-display block">
                                {b.brand}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {b.totalProcured} past purchase orders • {b.totalSold} sold • {b.inStock} on lot
                              </span>
                            </div>

                            <div className="text-right">
                              <div className="flex items-baseline gap-1 justify-end">
                                <span className="text-3xl font-black text-purple-400 font-mono leading-none">
                                  {b.decision_score}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-bold">/100</span>
                              </div>
                              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${badge.color}`}>
                                {badge.label}
                              </span>
                            </div>
                          </div>

                          {/* 4 Component Weights Progress Bars */}
                          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                            <div className="p-2 rounded-xl bg-slate-900/60 border border-border/60">
                              <div className="flex justify-between text-[10px] text-slate-300">
                                <span>Turnover Velocity (30%)</span>
                                <span className="font-mono font-bold text-white">{b.components?.turnoverScore}/100</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-800 rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${b.components?.turnoverScore}%` }} />
                              </div>
                              <span className="text-[9px] text-muted-foreground mt-0.5 block">Avg {b.avgDaysToSell} days to sell</span>
                            </div>

                            <div className="p-2 rounded-xl bg-slate-900/60 border border-border/60">
                              <div className="flex justify-between text-[10px] text-slate-300">
                                <span>Margin Yield (30%)</span>
                                <span className="font-mono font-bold text-emerald-400">{b.components?.marginScore}/100</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-800 rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${b.components?.marginScore}%` }} />
                              </div>
                              <span className="text-[9px] text-muted-foreground mt-0.5 block">{b.grossMarginPct}% gross margin</span>
                            </div>

                            <div className="p-2 rounded-xl bg-slate-900/60 border border-border/60">
                              <div className="flex justify-between text-[10px] text-slate-300">
                                <span>Demand Conversion (25%)</span>
                                <span className="font-mono font-bold text-sky-400">{b.components?.demandScore}/100</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-800 rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-sky-500 rounded-full" style={{ width: `${b.components?.demandScore}%` }} />
                              </div>
                              <span className="text-[9px] text-muted-foreground mt-0.5 block">{b.leadsCount} leads • {b.testDrivesCount} drives</span>
                            </div>

                            <div className="p-2 rounded-xl bg-slate-900/60 border border-border/60">
                              <div className="flex justify-between text-[10px] text-slate-300">
                                <span>Lot Stock Urgency (15%)</span>
                                <span className="font-mono font-bold text-amber-400">{b.components?.riskScore}/100</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-800 rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${b.components?.riskScore}%` }} />
                              </div>
                              <span className="text-[9px] text-muted-foreground mt-0.5 block">{b.inStock} units in stock</span>
                            </div>
                          </div>

                          {/* Purchase Order Guidance */}
                          <div className="rounded-xl bg-slate-900 p-3 border border-border flex items-center justify-between text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                                Recommended Max Buy Price
                              </span>
                              <span className="font-mono font-extrabold text-emerald-400 text-sm">
                                {formatCurrency(b.recommendedBuyCeiling)}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                                Past Avg Selling Price
                              </span>
                              <span className="font-mono text-slate-200">
                                {formatCurrency(b.avgSellingPrice)}
                              </span>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-400 leading-relaxed italic">
                            {b.rationale}
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
                      <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
                        Vehicle Model Procurement Decision Table
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Specific vehicle models ranked by procurement viability from previous purchase orders
                      </p>
                    </div>
                    <input
                      type="text"
                      placeholder="Filter model (e.g. Swift, Creta, Innova)..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-secondary/60 border border-border rounded-xl px-3.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500 w-full sm:w-64"
                    />
                  </div>

                  <div className="border border-border rounded-2xl overflow-hidden bg-card/60">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-secondary/40 border-b border-border text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                          <tr>
                            <th className="py-3 px-4">Vehicle Model</th>
                            <th className="py-3 px-4 text-center">Score</th>
                            <th className="py-3 px-4">Procurement Action</th>
                            <th className="py-3 px-4 text-right">Avg Acquisition Cost</th>
                            <th className="py-3 px-4 text-right">Avg Selling Price</th>
                            <th className="py-3 px-4 text-right">Gross Margin</th>
                            <th className="py-3 px-4 text-right">Days to Sell</th>
                            <th className="py-3 px-4 text-right">Max Buy Ceiling</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {filteredVehicles.map((v) => {
                            const badge = getRecommendationBadge(v.recommendation);
                            return (
                              <tr key={v.displayName} className="hover:bg-secondary/30 transition-colors">
                                <td className="py-3 px-4 font-bold text-white">
                                  <div className="text-xs">{v.displayName}</div>
                                  <span className="text-[10px] text-muted-foreground font-normal">
                                    {v.totalProcured} procured • {v.totalSold} sold • {v.inStock} lot
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center font-mono font-extrabold text-purple-400 text-sm">
                                  {v.decision_score}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${badge.color}`}>
                                    {badge.label}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-amber-400">
                                  {formatCurrency(v.avgAcquisitionCost)}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-slate-200">
                                  {formatCurrency(v.avgSellingPrice)}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                                  {v.grossMarginPct}%
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-slate-300">
                                  {v.avgDaysToSell}d
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-300">
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
                  <div className="rounded-2xl bg-purple-950/20 border border-purple-500/30 p-6 space-y-4">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                      <HelpCircle size={16} /> How the Procurement Decision Score is Calculated
                    </span>
                    <h3 className="text-xl font-mono font-black text-white">
                      Decision Score = (Turnover × 30%) + (Margin × 30%) + (Demand × 25%) + (Risk × 15%)
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Unlike generic scores, CarRevive calculates procurement viability dynamically from historical dealership transactions, trade-in purchase orders, and sales receipts. This ensures managers only procure vehicles with proven demand and profitable margins.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Pillar 1 */}
                    <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                        <span className="flex items-center gap-1.5 text-purple-400">
                          <Clock size={15} /> 1. Turnover Velocity (Weight: 30%)
                        </span>
                        <span className="font-mono text-purple-300">Max 30 pts</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Measures the days elapsed between vehicle procurement (<code className="text-slate-300">purchase_date</code>) and customer contract closure (<code className="text-slate-300">sale_date</code>). Vehicles selling in under 25 days score 95–100 points, avoiding capital depreciation.
                      </p>
                    </div>

                    {/* Pillar 2 */}
                    <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <DollarSign size={15} /> 2. Realized Gross Margin (Weight: 30%)
                        </span>
                        <span className="font-mono text-emerald-300">Max 30 pts</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Calculates actual realized gross margin from past sales (<code className="text-slate-300">(Selling Price - Acquisition Cost) / Selling Price</code>). Brands yielding &gt;18% gross margin score 95+ points; low-margin models (&lt;8%) are penalized.
                      </p>
                    </div>

                    {/* Pillar 3 */}
                    <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                        <span className="flex items-center gap-1.5 text-sky-400">
                          <Target size={15} /> 3. Customer Demand &amp; Conversion (Weight: 25%)
                        </span>
                        <span className="font-mono text-sky-300">Max 25 pts</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Evaluates customer inquiries, website booking leads, and test drives requested for this brand/model. High inquiry volume coupled with strong lead-to-booking conversions increases buy priority.
                      </p>
                    </div>

                    {/* Pillar 4 */}
                    <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                        <span className="flex items-center gap-1.5 text-amber-400">
                          <ShieldCheck size={15} /> 4. Stock Holding Risk &amp; Urgency (Weight: 15%)
                        </span>
                        <span className="font-mono text-amber-300">Max 15 pts</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Evaluates showroom stockyard status. If lot inventory is completely sold out with active inquiries, urgency scores 95. If 4+ units of this model are already sitting unsold on the lot, procurement priority drops to avoid overstock.
                      </p>
                    </div>

                  </div>

                  {/* Recommendation Boundaries */}
                  <div className="rounded-2xl bg-slate-900 p-4 border border-border space-y-3">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 block">
                      Admin Purchase Decision Thresholds
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                        <strong className="text-emerald-400 block font-mono text-sm">85 – 100 pts</strong>
                        <span className="text-white font-bold block mt-1">STRONG BUY</span>
                        <p className="text-[10px] text-slate-300 mt-1">Issue Purchase Order immediately. Maximum stock allocation.</p>
                      </div>
                      <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30">
                        <strong className="text-sky-400 block font-mono text-sm">70 – 84 pts</strong>
                        <span className="text-white font-bold block mt-1">BUY</span>
                        <p className="text-[10px] text-slate-300 mt-1">Standard procurement at benchmark trade-in pricing.</p>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        <strong className="text-amber-400 block font-mono text-sm">55 – 69 pts</strong>
                        <span className="text-white font-bold block mt-1">CAUTION</span>
                        <p className="text-[10px] text-slate-300 mt-1">Only procure if acquired at &gt;=10% below standard valuation.</p>
                      </div>
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
                        <strong className="text-rose-400 block font-mono text-sm">&lt; 55 pts</strong>
                        <span className="text-white font-bold block mt-1">DO NOT BUY</span>
                        <p className="text-[10px] text-slate-300 mt-1">Avoid purchasing. Reallocate capital to high-turnover models.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: OVERALL DEALERSHIP HEALTH */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#1e293b] border border-border flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-6">
                      <div className="relative w-20 h-20 rounded-full bg-slate-900 border-4 border-purple-500 flex flex-col items-center justify-center text-center shadow-inner">
                        <span className="text-2xl font-black font-mono text-white leading-none">
                          {data?.decision_score || 82}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">/ 100</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-extrabold text-white">{data?.status || 'Strong Operations'}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            High Confidence
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground max-w-md">
                          Overall dealership operations score across sales execution, inventory health, and margin yields.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 6 Pillars */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data?.pillars && Object.entries(data.pillars).map(([key, p]: any) => (
                      <div key={key} className="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-200 capitalize">
                            {key.replace('_', ' ')} <small className="text-muted-foreground">({p.weight})</small>
                          </span>
                          <span className="font-mono font-extrabold text-white">{p.score}/100</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
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
        <div className="p-4 border-t border-border bg-secondary/20 flex justify-between items-center text-xs">
          <span className="text-muted-foreground font-mono text-[11px]">
            CarRevive Procurement Engine • Based on historical purchase orders &amp; verified sales
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold transition-all"
          >
            Close Intelligence
          </button>
        </div>

      </div>
    </div>
  );
}
