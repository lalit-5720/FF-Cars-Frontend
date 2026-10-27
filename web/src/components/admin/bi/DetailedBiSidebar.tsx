'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  ExternalLink,
  CarFront,
  Building2,
  Sparkles,
  Calculator,
  TrendingUp,
  Tag,
  Filter,
  Search,
  ArrowRight,
  Clock,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldAlert,
  Percent,
  CheckCircle2,
  SlidersHorizontal,
  Target,
  BarChart3,
  Flame,
} from 'lucide-react';
import { DynamicRepricingWidget } from './DynamicRepricingWidget';
import { ManufactureYearDemandChart } from './ManufactureYearDemandChart';
import { PricePreferenceChart } from './PricePreferenceChart';

interface DetailedBiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: 'procurement' | 'math' | 'repricing' | 'trends';
  onTabChange?: (tab: 'procurement' | 'math' | 'repricing' | 'trends') => void;
  data: any;
  branchSales?: any[];
  inventoryAging?: any[];
  revenueTrend?: any[];
}

export function DetailedBiSidebar({
  isOpen,
  onClose,
  activeTab: controlledTab,
  onTabChange,
  data,
}: DetailedBiSidebarProps) {
  const router = useRouter();
  const [internalTab, setInternalTab] = useState<'procurement' | 'math' | 'repricing' | 'trends'>('procurement');
  const currentTab = controlledTab || internalTab;

  const setTab = (tab: 'procurement' | 'math' | 'repricing' | 'trends') => {
    if (onTabChange) onTabChange(tab);
    else setInternalTab(tab);
  };

  // Procurement sub-states
  const [segregationMode, setSegregationMode] = useState<'model' | 'brand'>('model');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [recommendationFilter, setRecommendationFilter] = useState<string>('ALL');
  const [expandedItemKey, setExpandedItemKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const {
    vehicle_decision_scores = [],
    brand_decision_scores = [],
    manufactureYearDemand = [],
    priceBandPreferences = [],
    summary = {},
  } = data || {};

  const rawList = segregationMode === 'model' ? vehicle_decision_scores : brand_decision_scores;

  const filteredList = rawList.filter((item: any) => {
    const name = (segregationMode === 'model' ? item.displayName : item.brand) || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRec = recommendationFilter === 'ALL' || item.recommendation === recommendationFilter;
    return matchesSearch && matchesRec;
  });

  const formatCurrency = (val?: number) => {
    const num = Number(val || 0);
    return `₹${Math.round(num).toLocaleString('en-IN')}`;
  };

  const getRecBadge = (rec: string) => {
    switch (rec) {
      case 'STRONG_BUY':
        return { label: 'STRONG BUY 🔥', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'BUY':
        return { label: 'BUY 🟢', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'CAUTION':
        return { label: 'CAUTION 🟡', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { label: 'DO NOT BUY ⛔', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Dark backdrop blur */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6">
        <div className="w-screen max-w-2xl bg-white border-l border-slate-200 shadow-2xl flex flex-col text-slate-800">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-200 bg-white flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase border border-blue-200">
                  Detailed Intelligence Side Panel
                </span>
                <span className="text-xs text-slate-500 font-medium">Deep-Dive Analytics</span>
              </div>
              <h2 className="text-lg font-black text-slate-900">
                Business Intelligence &amp; Technical Breakdown
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Inspect 4-pillar algorithms, procurement price ceilings, and market demand models.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/admin/bi')}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-xs flex items-center gap-1 border border-slate-200 cursor-pointer shadow-2xs"
                title="Open Dedicated Full Page"
              >
                <ExternalLink size={14} />
                <span className="hidden sm:inline">Full Page</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition-colors border border-slate-200 cursor-pointer"
                title="Close Sidebar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-1.5 overflow-x-auto text-xs font-bold scrollbar-none">
            <button
              onClick={() => setTab('procurement')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                currentTab === 'procurement'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <CarFront size={14} />
              <span>Buying Matrix</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/10 font-mono">
                {rawList.length}
              </span>
            </button>

            <button
              onClick={() => setTab('math')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                currentTab === 'math'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <Calculator size={14} />
              <span>4-Pillar Math</span>
            </button>

            <button
              onClick={() => setTab('repricing')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                currentTab === 'repricing'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <Tag size={14} />
              <span>Dynamic Repricing</span>
            </button>

            <button
              onClick={() => setTab('trends')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                currentTab === 'trends'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <BarChart3 size={14} />
              <span>Market Trends</span>
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">

            {/* TAB 1: BUYING MATRIX */}
            {currentTab === 'procurement' && (
              <div className="space-y-4">
                {/* Segregation Mode Switcher */}
                <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSegregationMode('model')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        segregationMode === 'model'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Segregate by Model ({vehicle_decision_scores.length})
                    </button>
                    <button
                      onClick={() => setSegregationMode('brand')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        segregationMode === 'brand'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Segregate by Brand ({brand_decision_scores.length})
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-500 pr-2 hidden sm:inline font-medium">
                    Live Dealership Data
                  </span>
                </div>

                {/* Search & Filter */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder={`Search ${segregationMode === 'model' ? 'models (e.g. EcoSport, i20)...' : 'brands...'}`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <select
                    value={recommendationFilter}
                    onChange={(e) => setRecommendationFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">All Recommendations</option>
                    <option value="STRONG_BUY">Strong Buy (75+)</option>
                    <option value="BUY">Buy (65–74)</option>
                    <option value="CAUTION">Caution (50–64)</option>
                    <option value="AVOID">Do Not Buy (&lt;50)</option>
                  </select>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  {filteredList.map((item: any) => {
                    const itemKey = segregationMode === 'model' ? item.displayName : item.brand;
                    const isExpanded = expandedItemKey === itemKey;
                    const recBadge = getRecBadge(item.recommendation);
                    const score = item.decision_score || 0;

                    return (
                      <div
                        key={itemKey}
                        className="rounded-2xl border border-slate-200/90 bg-white p-4 hover:border-slate-300 hover:shadow-md transition-all space-y-3 shadow-2xs"
                      >
                        <div
                          className="flex items-start justify-between gap-3 cursor-pointer"
                          onClick={() => setExpandedItemKey(isExpanded ? null : itemKey)}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${recBadge.bg}`}>
                                {recBadge.label}
                              </span>
                              {item.inStock === 0 ? (
                                <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[9px] font-bold border border-rose-200">
                                  0 on lot &bull; High Urgency
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200">
                                  {item.inStock} in stock
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-black text-slate-900">{itemKey}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                              {item.rationale || 'Derived from live dealership sales velocity & margin history.'}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[9px] text-emerald-700 block font-bold uppercase tracking-wider">
                              Max Buy Ceiling
                            </span>
                            <strong className="text-sm font-black text-slate-900 font-mono">
                              {formatCurrency(item.recommendedBuyCeiling)}
                            </strong>
                            <div className="text-[10px] text-blue-600 font-mono font-bold mt-0.5">
                              Score: {score}/100
                            </div>
                          </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                            <span className="text-slate-400 block text-[9px] font-bold">Avg Selling Price</span>
                            <strong className="text-slate-800 font-mono">{formatCurrency(item.avgSellingPrice)}</strong>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                            <span className="text-slate-400 block text-[9px] font-bold">Dealer Margin</span>
                            <strong className="text-emerald-700 font-mono">+{item.grossMarginPct}%</strong>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                            <span className="text-slate-400 block text-[9px] font-bold">Turnover Velocity</span>
                            <strong className="text-blue-700 font-mono">{item.avgDaysToSell} Days</strong>
                          </div>
                        </div>

                        {/* Toggle 4-Pillar Drawer */}
                        {isExpanded && (
                          <div className="pt-3 border-t border-slate-200 bg-slate-50 p-3 rounded-xl space-y-2 text-xs">
                            <span className="text-[10px] font-bold text-blue-700 block uppercase">
                              4-Pillar Empirical Score Breakdown
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div className="bg-white p-2 rounded-lg border border-slate-200/90 shadow-2xs">
                                <span className="text-slate-400 block font-bold">Turnover (30%)</span>
                                <strong className="text-slate-900 font-mono">{item.components?.turnoverScore ?? 70}/100</strong>
                                <span className="text-[9px] text-slate-500 block">{item.avgDaysToSell} days on lot</span>
                              </div>
                              <div className="bg-white p-2 rounded-lg border border-slate-200/90 shadow-2xs">
                                <span className="text-slate-400 block font-bold">Margin (30%)</span>
                                <strong className="text-emerald-700 font-mono">{item.components?.marginScore ?? 65}/100</strong>
                                <span className="text-[9px] text-slate-500 block">+{item.grossMarginPct}% profit</span>
                              </div>
                              <div className="bg-white p-2 rounded-lg border border-slate-200/90 shadow-2xs">
                                <span className="text-slate-400 block font-bold">Demand (25%)</span>
                                <strong className="text-blue-700 font-mono">{item.components?.demandScore ?? 60}/100</strong>
                                <span className="text-[9px] text-slate-500 block">{item.leadsCount} buyer leads</span>
                              </div>
                              <div className="bg-white p-2 rounded-lg border border-slate-200/90 shadow-2xs">
                                <span className="text-slate-400 block font-bold">Stock Risk (15%)</span>
                                <strong className="text-amber-800 font-mono">{item.components?.riskScore ?? 75}/100</strong>
                                <span className="text-[9px] text-slate-500 block">{item.inStock} currently in lot</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-600 pt-1 font-medium">
                              <strong className="text-slate-900">Rule:</strong> Do not buy {itemKey} above {formatCurrency(item.recommendedBuyCeiling)} to protect dealer profit margins on resale.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: 4-PILLAR MATH & FORMULAS */}
            {currentTab === 'math' && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-blue-50/70 border border-blue-200 p-4">
                  <div className="flex items-center gap-2 mb-2 text-blue-700">
                    <Calculator size={18} />
                    <h3 className="text-sm font-black text-slate-900">How the Decision Score is Calculated</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    CarRevive calculates procurement viability using dynamic dealership sales transactions, trade-in records, and customer demand.
                  </p>
                  <div className="mt-3 p-3 bg-white rounded-xl border border-blue-200 font-mono text-xs text-blue-900 font-bold shadow-2xs">
                    Score = (Turnover &times; 30%) + (Margin &times; 30%) + (Demand &times; 25%) + (Stock Risk &times; 15%)
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Pillar 1 */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <Clock size={16} className="text-blue-600" />
                        Pillar 1: Turnover Velocity
                      </strong>
                      <span className="text-xs font-mono font-bold text-blue-700 px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                        30% Weight
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Measures the days elapsed between car acquisition and customer sale. Vehicles selling in under 30 days receive full points (95–100), avoiding capital lockup in the showroom yard.
                    </p>
                  </div>

                  {/* Pillar 2 */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <Percent size={16} className="text-emerald-600" />
                        Pillar 2: Realized Gross Profit Margin
                      </strong>
                      <span className="text-xs font-mono font-bold text-emerald-700 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                        30% Weight
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Evaluates historical profit margins. Models yielding &ge;15% gross profit get top ranking, ensuring dealership owners preserve cash flow on every trade-in deal.
                    </p>
                  </div>

                  {/* Pillar 3 */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <Target size={16} className="text-purple-600" />
                        Pillar 3: Active Customer Inquiries
                      </strong>
                      <span className="text-xs font-mono font-bold text-purple-700 px-2 py-0.5 rounded bg-purple-50 border border-purple-200">
                        25% Weight
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Aggregates qualified buyer inquiries and completed test drives for each model. Models with high inbound buyer demand rank highest for acquisition.
                    </p>
                  </div>

                  {/* Pillar 4 */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <ShieldAlert size={16} className="text-amber-600" />
                        Pillar 4: Stockyard Urgency &amp; Risk
                      </strong>
                      <span className="text-xs font-mono font-bold text-amber-800 px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
                        15% Weight
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      If showroom stock for a model is zero with active buyers waiting, urgency is rated 95. If 4+ units are already sitting unsold, score drops to prevent overstocking.
                    </p>
                  </div>
                </div>

                {/* Plain English Takeaway */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-3">
                  <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block mb-1 font-bold">Why this protects dealership owners:</strong>
                    <span>
                      Non-technical managers don't need to do complex math manually &mdash; the system automatically flags safe buy prices to prevent buying cars that sit unsold.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: DYNAMIC REPRICING */}
            {currentTab === 'repricing' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Tag size={16} className="text-purple-600" />
                    Aging-Based Repricing Engine
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    Vehicles that sit in the yard for over 30 days suffer capital depreciation. The engine suggests modest price drops to trigger quick customer sales.
                  </p>
                </div>
                <DynamicRepricingWidget />
              </div>
            )}

            {/* TAB 4: MARKET TRENDS */}
            {currentTab === 'trends' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <BarChart3 size={16} className="text-blue-600" />
                    Market Preference Curves
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Historical customer demand segregated by manufacture year and target budget band.
                  </p>
                </div>
                <ManufactureYearDemandChart data={manufactureYearDemand} />
                <PricePreferenceChart data={priceBandPreferences} />
              </div>
            )}

          </div>

          {/* Footer Bar */}
          <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
            <span>CarRevive Intelligence Engine &bull; v2.4</span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors border border-slate-200 cursor-pointer"
            >
              Close Side Panel
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
