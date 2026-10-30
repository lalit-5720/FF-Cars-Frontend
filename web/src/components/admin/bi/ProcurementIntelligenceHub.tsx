'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { ManufactureYearDemandChart } from './ManufactureYearDemandChart';
import { PricePreferenceChart } from './PricePreferenceChart';
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
  Search,
  Building2,
  ChevronDown,
  ChevronUp,
  Percent,
  Clock,
  Target,
  Layers,
  Flame,
  Info,
  SlidersHorizontal,
  RotateCcw,
  LayoutGrid,
  List,
  Minimize2,
  Maximize2,
} from 'lucide-react';

interface ProcurementIntelligenceHubProps {
  data: any;
  loading?: boolean;
  onRefresh?: () => void;
}

export function ProcurementIntelligenceHub({ data, loading, onRefresh }: ProcurementIntelligenceHubProps) {
  // Owner Segregation Mode: 'model' or 'brand'
  const [segregationMode, setSegregationMode] = useState<'model' | 'brand'>('model');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [recommendationFilter, setRecommendationFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'score' | 'margin' | 'days' | 'stock'>('score');
  const [expandedItemKey, setExpandedItemKey] = useState<string | null>(null);

  // Expansion & Minimisation State Controls for Dealer Buying Intelligence
  const [isMatrixMinimized, setIsMatrixMinimized] = useState<boolean>(false);
  const [isAllExpanded, setIsAllExpanded] = useState<boolean>(false);
  const [viewDensity, setViewDensity] = useState<'detailed' | 'compact'>('detailed');

  // Self-healing fallback: fetch directly if parent passed empty or stale data
  const [internalData, setInternalData] = useState<any>(null);

  useEffect(() => {
    // If incoming data already has live vehicle decision scores, we're good
    if (data?.vehicle_decision_scores && data.vehicle_decision_scores.length > 0) {
      return;
    }
    // Otherwise fetch live from backend API
    api.get('/analytics/procurement-intelligence')
      .then((res) => {
        if (res.data) setInternalData(res.data);
      })
      .catch((err) => {
        console.error('Failed to fetch fallback procurement data:', err);
      });
  }, [data]);

  // Macro charts filters
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [priceFilter, setPriceFilter] = useState<string>('ALL');

  if (loading && !internalData && !data) {
    return (
      <div className="space-y-4">
        <div className="h-48 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-72 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
          <div className="h-72 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
        </div>
      </div>
    );
  }

  // Resolve effective data source
  const effectiveData = (data?.vehicle_decision_scores && data.vehicle_decision_scores.length > 0)
    ? data
    : (internalData || data || {});

  const {
    manufactureYearDemand = [],
    priceBandPreferences = [],
    buyingAlerts = [],
    summary = {},
    brand_decision_scores = [],
    vehicle_decision_scores = [],
    formula_breakdown = {},
  } = effectiveData;

  const filteredManufactureYear = yearFilter === 'ALL'
    ? manufactureYearDemand
    : manufactureYearDemand?.filter((y: any) => y.yearRange.includes(yearFilter));

  const filteredPriceBand = priceFilter === 'ALL'
    ? priceBandPreferences
    : priceBandPreferences?.filter((p: any) => p.priceBand.includes(priceFilter));

  // Current active dataset based on owner's choice
  const rawList = segregationMode === 'model' ? vehicle_decision_scores : brand_decision_scores;

  // Filter & Search
  const filteredList = rawList.filter((item: any) => {
    const name = (segregationMode === 'model' ? item.displayName : item.brand) || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRec = recommendationFilter === 'ALL' || item.recommendation === recommendationFilter;
    return matchesSearch && matchesRec;
  });

  // Sort
  const sortedList = [...filteredList].sort((a: any, b: any) => {
    if (sortBy === 'score') return (b.decision_score || 0) - (a.decision_score || 0);
    if (sortBy === 'margin') return (b.grossMarginPct || 0) - (a.grossMarginPct || 0);
    if (sortBy === 'days') return (a.avgDaysToSell || 0) - (b.avgDaysToSell || 0);
    if (sortBy === 'stock') return (a.inStock || 0) - (b.inStock || 0);
    return 0;
  });

  const formatCurrency = (val?: number) => {
    const num = Number(val || 0);
    return `₹${Math.round(num).toLocaleString('en-IN')}`;
  };

  const getRecBadge = (rec: string) => {
    switch (rec) {
      case 'STRONG_BUY':
        return {
          label: 'STRONG BUY 🔥',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-200',
          dot: 'bg-emerald-500',
        };
      case 'BUY':
        return {
          label: 'BUY 🟢',
          bg: 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-200',
          dot: 'bg-blue-500',
        };
      case 'CAUTION':
        return {
          label: 'CAUTION 🟡',
          bg: 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-200',
          dot: 'bg-amber-500',
        };
      case 'AVOID':
      default:
        return {
          label: 'DO NOT BUY ⛔',
          bg: 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-200',
          dot: 'bg-rose-500',
        };
    }
  };

  const handleAlertClick = (alert: any) => {
    setIsMatrixMinimized(false);
    if (alert.targetModel) {
      setSegregationMode('model');
      setSearchTerm(alert.targetModel);
      setRecommendationFilter('ALL');
      setExpandedItemKey(alert.targetModel);
    } else if (alert.targetBrand) {
      setSegregationMode('brand');
      setSearchTerm(alert.targetBrand);
      setRecommendationFilter('ALL');
      setExpandedItemKey(alert.targetBrand);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
              <ShoppingBag size={24} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider border border-blue-200">
                  Car Buying &amp; Procurement Advisor
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                  <Sparkles size={12} />
                  Live PostgreSQL Inventory Driven
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                Vehicle Procurement &amp; Stock Advisor
              </h2>
              <p className="text-xs text-text-secondary mt-0.5 font-medium">
                Dynamic buying recommendations &amp; maximum acquisition price ceilings calculated automatically from live inventory, sales velocity, and customer demand.
              </p>
            </div>
          </div>

          {/* Quick Summary Pill Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200/90">
              <span className="text-[10px] text-text-secondary block font-bold">TOP BUY BRAND</span>
              <strong className="text-xs font-black text-blue-700">{summary?.topRecommendedBrand || 'Porsche'}</strong>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200/90">
              <span className="text-[10px] text-text-secondary block font-bold">TOP BUY MODEL</span>
              <strong className="text-xs font-black text-blue-700">{summary?.topRecommendedModel || 'Porsche 911 Carrera S'}</strong>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200/90">
              <span className="text-[10px] text-text-secondary block font-bold">ACTIVE LOT STOCK</span>
              <strong className="text-xs font-black text-emerald-700">{summary?.activeStockCount || 0} Vehicles</strong>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200/90">
              <span className="text-[10px] text-text-secondary block font-bold">SIGNALS ANALYZED</span>
              <strong className="text-xs font-black text-amber-800">
                {(summary?.totalLeadsAnalyzed || 0) + (summary?.totalTestDrivesAnalyzed || 0)} Signals
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Car Buying Alert Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 tracking-wide uppercase flex items-center gap-2">
            <ShieldAlert size={16} className="text-blue-600" />
            <span>High-Priority Buying Action Signals</span>
          </h3>
          <span className="text-[11px] text-text-secondary font-medium">
            Click any alert to inspect model analytics below
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {buyingAlerts?.map((alert: any) => {
            const isBuy = alert.action === 'BUY_NOW';
            const isHold = alert.action === 'HOLD_PROCUREMENT';

            return (
              <div
                key={alert.id}
                onClick={() => handleAlertClick(alert)}
                className={`rounded-2xl border p-4 shadow-2xs transition-all flex flex-col justify-between cursor-pointer group ${
                  isBuy
                    ? 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50'
                    : isHold
                    ? 'bg-rose-50/60 border-rose-200 hover:border-rose-300 hover:bg-rose-50'
                    : 'bg-amber-50/60 border-amber-200 hover:border-amber-300 hover:bg-amber-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        isBuy
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : isHold
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {isBuy ? '🟢 BUY ADVISORY' : isHold ? '🔴 HOLD PROCUREMENT' : '🟡 REALLOCATE'}
                    </span>
                    <span className="text-[10px] font-bold text-text-secondary uppercase">
                      {alert.priority} PRIORITY
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                    {alert.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3 font-medium">
                    {alert.evidence}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                  {alert.recommendedBuyCeiling ? (
                    <span className="text-emerald-700 font-extrabold">
                      Max Buy: <strong className="text-slate-900">{formatCurrency(alert.recommendedBuyCeiling)}</strong>
                    </span>
                  ) : (
                    <span className="text-text-secondary font-medium">
                      Tier: <strong className="text-slate-700">{alert.priceBand}</strong>
                    </span>
                  )}
                  <span className="flex items-center gap-1 font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
                    <span>Inspect</span>
                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CORE FEATURE: OWNER'S CHOICE — SEGREGATE BY MODEL VS BRAND (WITH EXPANSION & MINIMISATION) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-5 transition-all">
        {/* Segregation Switcher Header with Minimize/Expand Toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider border border-blue-200">
                Dealer Buying Intelligence
              </span>
              <span className="text-xs text-text-secondary font-medium">Owner Decision Matrix</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">
              Procurement Decision Score &amp; Price Ceilings
            </h3>
            <p className="text-xs text-text-secondary font-medium">
              Select whether to analyze procurement opportunities segregated by vehicle model or by manufacturer brand.
            </p>
          </div>

          {/* Header Action Controls: Segregation Switcher + Minimize/Expand Button */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Interactive Toggle Switcher: Model vs Brand */}
            <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button
                onClick={() => {
                  setSegregationMode('model');
                  setSearchTerm('');
                  if (isMatrixMinimized) setIsMatrixMinimized(false);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  segregationMode === 'model'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CarFront size={14} />
                <span>Segregate by Model</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 font-mono">
                  {vehicle_decision_scores.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setSegregationMode('brand');
                  setSearchTerm('');
                  if (isMatrixMinimized) setIsMatrixMinimized(false);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  segregationMode === 'brand'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 size={14} />
                <span>Segregate by Brand</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 font-mono">
                  {brand_decision_scores.length}
                </span>
              </button>
            </div>

            {/* Minimize / Expand Master Toggle Button */}
            <button
              onClick={() => setIsMatrixMinimized(!isMatrixMinimized)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer shadow-2xs"
              title={isMatrixMinimized ? 'Expand Dealer Buying Intelligence Matrix' : 'Minimize Dealer Buying Intelligence Matrix'}
            >
              {isMatrixMinimized ? (
                <>
                  <Maximize2 size={13} className="text-blue-600" />
                  <span>Expand Matrix</span>
                  <ChevronDown size={14} />
                </>
              ) : (
                <>
                  <Minimize2 size={13} className="text-text-secondary" />
                  <span>Minimize</span>
                  <ChevronUp size={14} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* MINIMIZED STATE: Sleek Single-Line Summary Strip */}
        {isMatrixMinimized ? (
          <div
            onClick={() => setIsMatrixMinimized(false)}
            className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:border-slate-300 hover:bg-slate-100 transition-all group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                {segregationMode === 'model' ? <CarFront size={20} /> : <Building2 size={20} />}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                    {segregationMode === 'model' ? `${vehicle_decision_scores.length} Vehicle Models Analyzed` : `${brand_decision_scores.length} Brands Analyzed`}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200">
                    Top Buy: {summary?.topRecommendedModel || 'Porsche 911'}
                  </span>
                  <span className="text-[11px] text-text-secondary hidden md:inline font-medium">
                    • Active Stock: <strong className="text-slate-800">{summary?.activeStockCount || 0} units</strong>
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary mt-0.5 truncate font-medium">
                  Matrix minimized to save vertical space • Click anywhere to expand full buying decision matrix and price ceilings
                </p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMatrixMinimized(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <span>Expand Matrix</span>
              <ChevronDown size={14} />
            </button>
          </div>
        ) : (
          /* EXPANDED FULL MATRIX */
          <>
            {/* Search, Filter & Sort Toolbar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={14} />
                <input
                  type="text"
                  placeholder={segregationMode === 'model' ? 'Search vehicle models (e.g. Swift, EcoSport, Creta)...' : 'Search brands (e.g. Maruti, Ford, Porsche)...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              {/* Recommendation Filter */}
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs">
                <Filter size={13} className="text-blue-600 shrink-0" />
                <span className="text-text-secondary text-[11px] shrink-0 font-medium">Recommendation:</span>
                <select
                  value={recommendationFilter}
                  onChange={(e) => setRecommendationFilter(e.target.value)}
                  className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer w-full text-xs"
                >
                  <option value="ALL">All Recommendations ({rawList.length})</option>
                  <option value="STRONG_BUY">Strong Buy (Score 75+)</option>
                  <option value="BUY">Buy (Score 65–74)</option>
                  <option value="CAUTION">Caution (Score 50–64)</option>
                  <option value="AVOID">Do Not Buy (&lt; 50)</option>
                </select>
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs">
                <SlidersHorizontal size={13} className="text-blue-600 shrink-0" />
                <span className="text-text-secondary text-[11px] shrink-0 font-medium">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer w-full text-xs"
                >
                  <option value="score">Highest Buy Decision Score</option>
                  <option value="margin">Highest Gross Profit Margin %</option>
                  <option value="days">Fastest Turnover (Days to Sell)</option>
                  <option value="stock">Lowest Lot Stock (Buy Urgency)</option>
                </select>
              </div>
            </div>

            {/* Granular Density & Expansion Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
              {/* Density Mode: Detailed Cards vs Compact Rows */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-text-secondary font-semibold">View Density:</span>
                <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-[10px]">
                  <button
                    onClick={() => setViewDensity('detailed')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                      viewDensity === 'detailed'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid size={12} />
                    <span>Detailed Cards</span>
                  </button>
                  <button
                    onClick={() => setViewDensity('compact')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                      viewDensity === 'compact'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <List size={12} />
                    <span>Compact Rows</span>
                  </button>
                </div>
              </div>

              {/* Master Expand/Collapse All Calculation Drawers */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAllExpanded(!isAllExpanded)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                >
                  {isAllExpanded ? (
                    <>
                      <ChevronUp size={13} />
                      <span>Collapse All Calculations</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown size={13} />
                      <span>Expand All 4-Pillar Calculations</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Filter Indicator / Status Bar */}
            {(recommendationFilter !== 'ALL' || searchTerm.trim() !== '') && (
              <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-medium">
                <span>
                  Showing <strong>{sortedList.length}</strong> of <strong>{rawList.length}</strong> {segregationMode === 'model' ? 'models' : 'brands'}
                  {recommendationFilter !== 'ALL' && ` matching "${recommendationFilter}"`}
                  {searchTerm && ` matching "${searchTerm}"`}
                </span>
                <button
                  onClick={() => {
                    setRecommendationFilter('ALL');
                    setSearchTerm('');
                  }}
                  className="flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Reset Filters</span>
                </button>
              </div>
            )}

            {/* Segregated Items List */}
            {sortedList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-text-secondary text-xs space-y-3">
                <p className="text-slate-700 font-semibold">
                  {rawList.length === 0
                    ? `Loading live ${segregationMode === 'model' ? 'vehicle models' : 'brands'} from database...`
                    : `No ${segregationMode === 'model' ? 'models' : 'brands'} matched "${recommendationFilter !== 'ALL' ? recommendationFilter : ''} ${searchTerm}".`}
                </p>
                {rawList.length > 0 && (
                  <button
                    onClick={() => {
                      setRecommendationFilter('ALL');
                      setSearchTerm('');
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <RotateCcw size={12} />
                    <span>Show All {rawList.length} {segregationMode === 'model' ? 'Models' : 'Brands'}</span>
                  </button>
                )}
              </div>
            ) : viewDensity === 'compact' ? (
              /* COMPACT ROWS VIEW (Minimised per-item layout) */
              <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden shadow-2xs">
                {sortedList.map((item: any, idx: number) => {
                  const itemKey = segregationMode === 'model' ? item.displayName : item.brand;
                  const isExpanded = isAllExpanded || expandedItemKey === itemKey;
                  const recBadge = getRecBadge(item.recommendation);
                  const score = item.decision_score || 0;

                  return (
                    <div key={itemKey} className="transition-colors hover:bg-slate-50/60">
                      {/* Compact Row Header */}
                      <div
                        onClick={() => setExpandedItemKey(isExpanded ? null : itemKey)}
                        className="p-3 sm:px-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-[11px] font-mono text-text-secondary font-bold w-5 shrink-0">
                            #{idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900 text-xs truncate">
                                {itemKey}
                              </span>
                              <span className={`px-2 py-0.2 rounded-full text-[9px] font-extrabold border ${recBadge.bg}`}>
                                {recBadge.label}
                              </span>
                            </div>
                            <span className="text-[10px] text-text-secondary block font-medium">
                              {item.inStock === 0 ? '0 on lot (Stockout Urgency)' : `${item.inStock} on lot`} &bull; {item.avgDaysToSell}d turnover
                            </span>
                          </div>
                        </div>

                        {/* Right Quick Stats */}
                        <div className="flex items-center gap-4 shrink-0 self-end md:self-auto text-xs">
                          <div className="text-right">
                            <span className="text-[9px] text-emerald-700 block font-bold">MAX BUY CEILING</span>
                            <strong className="text-slate-900 font-mono font-black text-xs">
                              {formatCurrency(item.recommendedBuyCeiling)}
                            </strong>
                          </div>

                          <div className="text-right">
                            <span className="text-[9px] text-text-secondary block font-semibold">MARGIN</span>
                            <strong className="text-emerald-700 font-mono font-bold text-xs">
                              +{item.grossMarginPct}%
                            </strong>
                          </div>

                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center">
                            <span className="text-[8px] text-text-secondary uppercase font-bold">Score</span>
                            <strong className="text-xs font-black text-slate-900 font-mono">{score}</strong>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedItemKey(isExpanded ? null : itemKey);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* 4-Pillar Drawer in Compact Mode */}
                      {isExpanded && (
                        <div className="border-t border-slate-200 bg-slate-50 p-4 rounded-b-xl space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
                              <span className="text-text-secondary block font-bold">Turnover (30%)</span>
                              <strong className="text-slate-900 font-mono text-xs">{item.components?.turnoverScore ?? 70}/100</strong>
                              <span className="text-[9px] text-text-secondary block mt-0.5">{item.avgDaysToSell} days to sell</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
                              <span className="text-text-secondary block font-bold">Margin (30%)</span>
                              <strong className="text-emerald-700 font-mono text-xs">{item.components?.marginScore ?? 65}/100</strong>
                              <span className="text-[9px] text-text-secondary block mt-0.5">+{item.grossMarginPct}% profit</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
                              <span className="text-text-secondary block font-bold">Demand (25%)</span>
                              <strong className="text-blue-700 font-mono text-xs">{item.components?.demandScore ?? 60}/100</strong>
                              <span className="text-[9px] text-text-secondary block mt-0.5">{item.leadsCount} leads</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
                              <span className="text-text-secondary block font-bold">Stock Risk (15%)</span>
                              <strong className="text-amber-800 font-mono text-xs">{item.components?.riskScore ?? 75}/100</strong>
                              <span className="text-[9px] text-text-secondary block mt-0.5">{item.inStock} on lot</span>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium">
                            <strong className="text-slate-900">Owner Buying Rule:</strong> Do not acquire {itemKey} above{' '}
                            <strong className="text-emerald-700 font-mono">{formatCurrency(item.recommendedBuyCeiling)}</strong> to lock in a 15% dealer gross margin on resale at{' '}
                            <strong className="text-slate-900 font-mono">{formatCurrency(item.avgSellingPrice)}</strong>.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* DETAILED CARDS VIEW (Standard full layout) */
              <div className="grid grid-cols-1 gap-4">
                {sortedList.map((item: any) => {
                  const itemKey = segregationMode === 'model' ? item.displayName : item.brand;
                  const isExpanded = isAllExpanded || expandedItemKey === itemKey;
                  const recBadge = getRecBadge(item.recommendation);
                  const score = item.decision_score || 0;

                  return (
                    <div
                      key={itemKey}
                      className={`rounded-2xl border transition-all ${
                        isExpanded
                          ? 'border-blue-400 bg-white shadow-md'
                          : 'border-slate-200/90 bg-white shadow-2xs hover:border-slate-300 hover:shadow-md'
                      }`}
                    >
                      {/* Item Main Row */}
                      <div className="p-4 sm:p-5">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          {/* Left: Identity, Badges & Urgency */}
                          <div className="flex items-start gap-3.5">
                            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
                              {segregationMode === 'model' ? <CarFront size={22} /> : <Building2 size={22} />}
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${recBadge.bg}`}>
                                  {recBadge.label}
                                </span>

                                {segregationMode === 'model' && (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                                    {item.make}
                                  </span>
                                )}

                                {item.inStock === 0 ? (
                                  <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-extrabold border border-rose-200">
                                    0 on lot &bull; High Urgency to Procure
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                    {item.inStock} on lot
                                  </span>
                                )}
                              </div>

                              <h4 className="text-base font-black text-slate-900 tracking-tight">
                                {itemKey}
                              </h4>
                              <p className="text-xs text-text-secondary mt-0.5 font-medium">
                                {item.rationale || `Analyzed from direct dealership acquisitions and sales.`}
                              </p>
                            </div>
                          </div>

                          {/* Right: Score + Max Buy Ceiling */}
                          <div className="flex items-center gap-4 shrink-0">
                            {/* Max Buy Ceiling Card */}
                            <div className="text-right px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
                              <span className="text-[10px] text-emerald-800 font-extrabold uppercase block tracking-wider">
                                Max Buy Ceiling
                              </span>
                              <strong className="text-base font-black text-slate-900 font-mono">
                                {formatCurrency(item.recommendedBuyCeiling)}
                              </strong>
                              <span className="text-[9px] text-text-secondary block font-medium">
                                Protects 15% dealer gross margin
                              </span>
                            </div>

                            {/* Decision Score Badge */}
                            <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
                              <span className="text-[9px] text-text-secondary font-extrabold uppercase">Score</span>
                              <strong className="text-xl font-black text-slate-900 font-mono">{score}</strong>
                              <span className="text-[8px] text-text-secondary">/ 100</span>
                            </div>

                            {/* Expand Details Button */}
                            <button
                              onClick={() => setExpandedItemKey(isExpanded ? null : itemKey)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200"
                              title="View 4-Pillar Calculation Breakdown"
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </div>
                        </div>

                        {/* Operational KPI Metric Strip */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4 pt-3.5 border-t border-slate-100 text-xs">
                          <div className="bg-slate-50 rounded-xl p-2 border border-slate-200/80">
                            <span className="text-[10px] text-text-secondary block font-bold">AVG BUY PRICE</span>
                            <strong className="text-xs font-bold text-slate-800 font-mono">
                              {formatCurrency(item.avgAcquisitionCost)}
                            </strong>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-2 border border-slate-200/80">
                            <span className="text-[10px] text-text-secondary block font-bold">AVG SELLING PRICE</span>
                            <strong className="text-xs font-bold text-slate-800 font-mono">
                              {formatCurrency(item.avgSellingPrice)}
                            </strong>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-2 border border-slate-200/80">
                            <span className="text-[10px] text-text-secondary block font-bold">GROSS MARGIN %</span>
                            <strong className={`text-xs font-extrabold font-mono ${item.grossMarginPct >= 15 ? 'text-emerald-700' : 'text-amber-800'}`}>
                              +{item.grossMarginPct}%
                            </strong>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-2 border border-slate-200/80">
                            <span className="text-[10px] text-text-secondary block font-bold">DAYS TO SELL</span>
                            <strong className="text-xs font-bold text-blue-700 font-mono flex items-center gap-1">
                              <Clock size={11} />
                              {item.avgDaysToSell} Days
                            </strong>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-2 border border-slate-200/80">
                            <span className="text-[10px] text-text-secondary block font-bold">PROCURRED / SOLD</span>
                            <strong className="text-xs font-bold text-slate-800 font-mono">
                              {item.totalProcured} in / {item.totalSold} sold
                            </strong>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-2 border border-slate-200/80">
                            <span className="text-[10px] text-text-secondary block font-bold">BUYER INQUIRIES</span>
                            <strong className="text-xs font-bold text-purple-700 font-mono">
                              {item.leadsCount || 0} Leads &bull; {item.testDrivesCount || 0} Drives
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Expandable 4-Pillar Calculation Breakdown Drawer */}
                      {isExpanded && (
                        <div className="border-t border-slate-200 bg-slate-50/70 p-4 sm:p-5 rounded-b-2xl space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Target size={15} className="text-blue-600" />
                              <h5 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                                Empirical 4-Pillar Scoring Calculation for {itemKey}
                              </h5>
                            </div>
                            <span className="text-[10px] text-text-secondary font-mono font-medium">
                              Weight: Turnover (30%) + Margin (30%) + Demand (25%) + Stock Risk (15%)
                            </span>
                          </div>

                          {/* 4 Pillar Cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Pillar 1: Turnover Velocity */}
                            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className="font-bold text-slate-700">Turnover Velocity</span>
                                <span className="text-blue-600 font-extrabold font-mono">30% Weight</span>
                              </div>
                              <div className="flex items-baseline gap-2 mb-1">
                                <strong className="text-lg font-black text-slate-900 font-mono">
                                  {item.components?.turnoverScore ?? 70}
                                </strong>
                                <span className="text-[10px] text-text-secondary">/ 100</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
                                <div
                                  className="bg-blue-600 h-full rounded-full"
                                  style={{ width: `${item.components?.turnoverScore ?? 70}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-text-secondary leading-tight font-medium">
                                Averages <strong className="text-slate-800">{item.avgDaysToSell} days</strong> on lot before customer sale.
                              </p>
                            </div>

                            {/* Pillar 2: Realized Profit Margin */}
                            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className="font-bold text-slate-700">Gross Profit Margin</span>
                                <span className="text-emerald-700 font-extrabold font-mono">30% Weight</span>
                              </div>
                              <div className="flex items-baseline gap-2 mb-1">
                                <strong className="text-lg font-black text-slate-900 font-mono">
                                  {item.components?.marginScore ?? 65}
                                </strong>
                                <span className="text-[10px] text-text-secondary">/ 100</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
                                <div
                                  className="bg-emerald-600 h-full rounded-full"
                                  style={{ width: `${item.components?.marginScore ?? 65}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-text-secondary leading-tight font-medium">
                                Generates <strong className="text-slate-800">+{item.grossMarginPct}% gross profit</strong> on closed transactions.
                              </p>
                            </div>

                            {/* Pillar 3: Customer Demand */}
                            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className="font-bold text-slate-700">Customer Demand</span>
                                <span className="text-purple-700 font-extrabold font-mono">25% Weight</span>
                              </div>
                              <div className="flex items-baseline gap-2 mb-1">
                                <strong className="text-lg font-black text-slate-900 font-mono">
                                  {item.components?.demandScore ?? 60}
                                </strong>
                                <span className="text-[10px] text-text-secondary">/ 100</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
                                <div
                                  className="bg-purple-600 h-full rounded-full"
                                  style={{ width: `${item.components?.demandScore ?? 60}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-text-secondary leading-tight font-medium">
                                Driven by <strong className="text-slate-800">{item.leadsCount} leads</strong> and <strong className="text-slate-800">{item.testDrivesCount} test drives</strong>.
                              </p>
                            </div>

                            {/* Pillar 4: Stock Risk & Urgency */}
                            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className="font-bold text-slate-700">Stock Risk &amp; Urgency</span>
                                <span className="text-amber-700 font-extrabold font-mono">15% Weight</span>
                              </div>
                              <div className="flex items-baseline gap-2 mb-1">
                                <strong className="text-lg font-black text-slate-900 font-mono">
                                  {item.components?.riskScore ?? 75}
                                </strong>
                                <span className="text-[10px] text-text-secondary">/ 100</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
                                <div
                                  className="bg-amber-500 h-full rounded-full"
                                  style={{ width: `${item.components?.riskScore ?? 75}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-text-secondary leading-tight font-medium">
                                {item.inStock === 0
                                  ? 'Zero stock in inventory! High procurement urgency.'
                                  : `${item.inStock} vehicle(s) currently held in stockyard.`}
                              </p>
                            </div>
                          </div>

                          {/* Owner Buying Rule Guidance */}
                          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs flex items-start gap-2.5 text-slate-700">
                            <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-slate-900 block font-bold">Dealership Owner Buying Rule:</strong>
                              <span>
                                If buying this {segregationMode === 'model' ? 'model' : 'brand'} from a customer or auction, do NOT pay more than{' '}
                                <strong className="text-emerald-700 font-mono">{formatCurrency(item.recommendedBuyCeiling)}</strong>. This ensures at least a 15% gross profit margin upon retail sale at the average price of{' '}
                                <strong className="text-slate-800 font-mono">{formatCurrency(item.avgSellingPrice)}</strong>.
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* FEATURE 2: AGING-BASED DYNAMIC REPRICING WIDGET */}
      <DynamicRepricingWidget />

      {/* FEATURE 3: BRANCH DEMAND & CUSTOMER EVIDENCE REPORT */}
      <BranchEvidenceReportWidget />

      {/* 2 Charts Grid: Year Demand & Price Preference */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ManufactureYearDemandChart data={filteredManufactureYear} />
        <PricePreferenceChart data={filteredPriceBand} />
      </div>
    </div>
  );
}
