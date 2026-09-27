'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import {
  Sliders,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CarFront,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Percent,
  Layers,
  HelpCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface VehicleOption {
  vehicle_id: number;
  make: string;
  model: string;
  manufacture_year?: number;
  registration_number?: string;
  price?: number;
  purchase_price?: number;
  status?: string;
}

export default function AdvancedDealProfitSimulatorPage() {
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('custom');

  // Core Financial Inputs
  const [sellingPrice, setSellingPrice] = useState<number>(1850000);
  const [acquisitionCost, setAcquisitionCost] = useState<number>(1520000);
  const [discount, setDiscount] = useState<number>(45000);
  const [tax, setTax] = useState<number>(35000);
  const [loanFinancedAmount, setLoanFinancedAmount] = useState<number>(1200000);
  const [hasLoan, setHasLoan] = useState<boolean>(true);

  // Profit Reduction & Negotiation Sensitivity
  const [profitReductionPct, setProfitReductionPct] = useState<number>(15); // e.g. reduce profit by 15%
  const [activePreset, setActivePreset] = useState<string>('custom');

  // Load vehicles from API for real-data testing
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const res = await api.get('/vehicles?limit=50');
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setVehicles(list);
      } catch (err) {
        console.error('Failed to load inventory for simulator', err);
      }
    };
    loadVehicles();
  }, []);

  // When a real vehicle is chosen from the inventory
  const handleSelectVehicle = (vId: string) => {
    setSelectedVehicleId(vId);
    if (vId === 'custom') return;

    const found = vehicles.find((v) => String(v.vehicle_id) === vId);
    if (found) {
      const vPrice = Number(found.price || 1500000);
      const vCost = Number(found.purchase_price || vPrice * 0.82);
      setSellingPrice(vPrice);
      setAcquisitionCost(vCost);
      setDiscount(Math.round(vPrice * 0.025)); // 2.5% standard discount
      setTax(Math.round(vPrice * 0.02)); // 2% RTO/tax
      setLoanFinancedAmount(Math.round(vPrice * 0.7)); // 70% loan standard
    }
  };

  const formatCurrency = (val?: number) => {
    const num = Number(val || 0);
    return `₹${Math.round(num).toLocaleString('en-IN')}`;
  };

  // 1. BASELINE GROSS PROFIT CALCULATIONS
  // Raw difference between MSRP selling price and acquisition cost
  const rawSpread = sellingPrice - acquisitionCost;
  // Contract value = Selling Price - Discount + Tax
  const finalContractValue = sellingPrice - discount + tax;
  // 2% Bank Partner Loan Commission
  const bankCommission = hasLoan ? Math.round(loanFinancedAmount * 0.02) : 0;
  // Baseline Net Gross Profit
  const baseGrossProfit = (finalContractValue - acquisitionCost) + bankCommission;
  const baseMarginPct = finalContractValue > 0 ? Number(((baseGrossProfit / finalContractValue) * 100).toFixed(1)) : 0;

  // 2. PROFIT REDUCTION & CONCESSION CALCULATIONS
  // Exact amount of gross profit given away
  const profitGivenAway = Math.round(baseGrossProfit * (profitReductionPct / 100));
  // Revised gross profit dealership gets
  const revisedGrossProfit = Math.max(0, baseGrossProfit - profitGivenAway);
  const revisedMarginPct = finalContractValue > 0 ? Number(((revisedGrossProfit / finalContractValue) * 100).toFixed(1)) : 0;
  const marginDelta = (baseMarginPct - revisedMarginPct).toFixed(1);

  // Maximum allowable customer discount at this reduced profit target
  const maxAllowableDiscount = discount + profitGivenAway;
  // Minimum floor price to breakeven (zero profit)
  const breakevenFloorPrice = acquisitionCost - bankCommission - tax;

  // Deal Health Classification
  let dealStatus = {
    badge: 'HEALTHY MARGIN',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    description: 'Highly profitable deal. Safe for sales rep sign-off without manager escalation.',
  };
  if (revisedMarginPct < 5) {
    dealStatus = {
      badge: 'LOSS WARNING / FLOOR BREACH',
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      description: 'Dangerous margin compression! Dealership earns minimal return or risks loss.',
    };
  } else if (revisedMarginPct < 12) {
    dealStatus = {
      badge: 'MODERATE CONCESSION',
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      description: 'Acceptable volume concession. Requires Branch Manager verbal approval.',
    };
  }

  const applyPreset = (name: string, pct: number) => {
    setActivePreset(name);
    setProfitReductionPct(pct);
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 text-foreground font-sans space-y-6">
      <div className="mx-auto max-w-6xl space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Executive Financial Tool
              </span>
              <span className="text-xs text-muted-foreground">• Real-time GAAP Margin Modeler</span>
            </div>
            <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white">
              Deal Profitability &amp; Margin Simulator
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Calculate exact gross profit differences, model commercial discounts, and test how profit reductions impact net dealership earnings.
            </p>
          </div>

          {/* Quick Reset */}
          <button
            onClick={() => {
              setSellingPrice(1850000);
              setAcquisitionCost(1520000);
              setDiscount(45000);
              setTax(35000);
              setLoanFinancedAmount(1200000);
              setProfitReductionPct(15);
              setSelectedVehicleId('custom');
              setActivePreset('custom');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary/60 hover:bg-secondary border border-border text-xs font-bold text-slate-300 transition-all self-start md:self-auto"
          >
            <RotateCcw size={13} />
            Reset Defaults
          </button>
        </div>

        {/* Live Inventory Quick Loader */}
        <div className="rounded-2xl bg-secondary/30 border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CarFront size={18} className="text-sky-400" />
            <div>
              <span className="text-xs font-extrabold text-foreground block">Simulate from Live Showroom Stock</span>
              <span className="text-[11px] text-muted-foreground">
                Load actual purchase costs and list prices from your inventory database
              </span>
            </div>
          </div>
          <select
            value={selectedVehicleId}
            onChange={(e) => handleSelectVehicle(e.target.value)}
            className="bg-card border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500 max-w-xs font-medium"
          >
            <option value="custom">⚡ Manual / Custom Deal Input</option>
            {vehicles.map((v) => (
              <option key={v.vehicle_id} value={v.vehicle_id}>
                {v.make} {v.model} ({v.manufacture_year || ''}) - {formatCurrency(v.price)}
              </option>
            ))}
          </select>
        </div>

        {/* Main Grid: Inputs vs Real-time Output */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: FINANCIAL INPUTS & REDUCTION SLIDER (7 COLS) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Core Deal Inputs Card */}
            <div className="rounded-3xl border border-border bg-card p-6 space-y-5 shadow-xl">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <DollarSign size={16} className="text-purple-400" />
                1. Vehicle Financial Parameters
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Selling Price */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Agreed Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-secondary/50 px-3.5 py-2.5 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">Showroom listing price</span>
                </div>

                {/* Acquisition Cost */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Vehicle Acquisition Cost (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={acquisitionCost}
                    onChange={(e) => setAcquisitionCost(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-secondary/50 px-3.5 py-2.5 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">Trade-in / Stockyard procurement cost</span>
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Customer Discount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-secondary/50 px-3.5 py-2.5 text-xs font-mono font-bold text-rose-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">Negotiated commercial concession</span>
                </div>

                {/* Statutory Tax */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Statutory Taxes &amp; RTO (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={tax}
                    onChange={(e) => setTax(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-secondary/50 px-3.5 py-2.5 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">Government registration &amp; road tax</span>
                </div>

              </div>

              {/* 2% Loan Financing Toggle & Amount */}
              <div className="rounded-2xl bg-secondary/20 border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="hasLoanToggle"
                      checked={hasLoan}
                      onChange={(e) => setHasLoan(e.target.checked)}
                      className="w-4 h-4 rounded accent-purple-500 cursor-pointer"
                    />
                    <label htmlFor="hasLoanToggle" className="text-xs font-bold text-foreground cursor-pointer">
                      Customer Financed via Partner Bank Loan
                    </label>
                  </div>
                  {hasLoan && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      +2% Dealership Commission Earned
                    </span>
                  )}
                </div>

                {hasLoan && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[11px] text-muted-foreground block font-medium">Financed Loan Amount (₹)</span>
                      <input
                        type="number"
                        min="0"
                        step="50000"
                        value={loanFinancedAmount}
                        onChange={(e) => setLoanFinancedAmount(Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-border bg-secondary/50 px-3 py-1.5 text-xs font-mono font-bold text-sky-300"
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-[11px] text-muted-foreground">Dealership Commission (2%)</span>
                      <span className="mt-1 font-mono text-sm font-extrabold text-sky-400">
                        +{formatCurrency(bankCommission)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Profit Reduction Slider Card */}
            <div className="rounded-3xl border border-purple-500/30 bg-purple-950/10 p-6 space-y-4 shadow-xl ring-1 ring-purple-500/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                    <Sliders size={16} className="text-purple-400" />
                    2. Profit Reduction &amp; Sensitivity Slider
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Adjust how much profit you are willing to concede to close the deal
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-purple-400 font-mono">
                    {profitReductionPct}%
                  </span>
                  <span className="text-[10px] text-muted-foreground block">Concession</span>
                </div>
              </div>

              {/* Range Slider */}
              <input
                type="range"
                min="0"
                max="60"
                step="1"
                value={profitReductionPct}
                onChange={(e) => {
                  setProfitReductionPct(Number(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full accent-purple-500 h-2.5 bg-slate-800 rounded-lg cursor-pointer"
              />

              {/* Slider Scale Points */}
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>0% (Full Price)</span>
                <span>10% (Minor Offer)</span>
                <span>20% (Volume Deal)</span>
                <span>35% (Aggressive Push)</span>
                <span>60% (Max Floor)</span>
              </div>

              {/* Preset Buttons */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 block mb-2">Target Strategy Presets:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Firm MSRP', pct: 0, id: 'firm' },
                    { label: 'Weekend Offer', pct: 10, id: 'weekend' },
                    { label: 'Month-End Push', pct: 20, id: 'monthend' },
                    { label: 'Stock Clearance', pct: 35, id: 'clearance' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => applyPreset(p.id, p.pct)}
                      className={`p-2 rounded-xl text-left border transition-all text-xs ${
                        activePreset === p.id && profitReductionPct === p.pct
                          ? 'border-purple-500 bg-purple-600/20 text-white font-extrabold'
                          : 'border-border bg-secondary/30 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="block text-[10px] text-muted-foreground">{p.label}</span>
                      <span className="font-mono font-bold">-{p.pct}% Profit</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: DETAILED DIFFERENCE BREAKDOWN & REVISED PROFIT (5 COLS) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Master Result Card */}
            <div className="rounded-3xl border border-border bg-card p-6 space-y-6 shadow-2xl">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Audited Deal Output
                </span>
                <h3 className="text-lg font-extrabold text-foreground mt-0.5 font-display">
                  Profit Difference &amp; Net Earnings
                </h3>
              </div>

              {/* Revised Gross Profit Spotlight */}
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-5 ring-2 ring-emerald-500/20">
                <span className="text-xs font-bold text-emerald-300 block">
                  Revised Gross Profit You Get
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono tracking-tight">
                    {formatCurrency(revisedGrossProfit)}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 font-mono">
                    {revisedMarginPct}% Margin
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-emerald-400/80 pt-2 border-t border-emerald-500/20">
                  <span>Concession given away:</span>
                  <span className="font-mono font-bold text-rose-400">
                    -{formatCurrency(profitGivenAway)} (-{profitReductionPct}%)
                  </span>
                </div>
              </div>

              {/* Exact Difference Waterfall */}
              <div className="space-y-3 text-xs">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Exact Accounting Breakdown
                </span>

                <div className="space-y-2 rounded-2xl bg-secondary/20 p-4 border border-border">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>1. Vehicle Selling Price</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(sellingPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>2. Vehicle Acquisition Cost</span>
                    <span className="font-mono font-bold text-amber-400">-{formatCurrency(acquisitionCost)}</span>
                  </div>
                  
                  {/* Highlight: RAW DIFFERENCE / SPREAD */}
                  <div className="flex justify-between items-center py-1.5 px-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 font-bold">
                    <span className="flex items-center gap-1">
                      <TrendingUp size={13} /> Raw Difference (Spread)
                    </span>
                    <span className="font-mono font-extrabold text-purple-300">
                      +{formatCurrency(rawSpread)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-300">
                    <span>3. Commercial Discount</span>
                    <span className="font-mono font-bold text-rose-400">-{formatCurrency(discount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>4. Statutory Tax (GST / RTO)</span>
                    <span className="font-mono font-bold text-slate-400">+{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>5. 2% Bank Partner Loan Comm.</span>
                    <span className="font-mono font-bold text-sky-400">+{formatCurrency(bankCommission)}</span>
                  </div>

                  <div className="pt-2 border-t border-border/80 flex justify-between items-center text-slate-300">
                    <span className="font-bold">Original Baseline Gross Profit:</span>
                    <span className="font-mono font-extrabold text-slate-200">{formatCurrency(baseGrossProfit)}</span>
                  </div>
                </div>
              </div>

              {/* Negotiation Health Badge */}
              <div className={`rounded-2xl p-4 border ${dealStatus.color} space-y-1.5`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider font-mono">
                    {dealStatus.badge}
                  </span>
                  <span className="text-[11px] font-bold">
                    Margin Drop: -{marginDelta}%
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  {dealStatus.description}
                </p>
              </div>

              {/* Sales Rep Floor & Guidance */}
              <div className="rounded-2xl bg-slate-900 border border-border p-4 text-xs space-y-2.5">
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                  Sales Rep Negotiation Limits
                </span>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Max Allowable Discount:</span>
                  <span className="font-mono font-bold text-emerald-400">{formatCurrency(maxAllowableDiscount)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Absolute Breakeven Floor:</span>
                  <span className="font-mono font-bold text-rose-400">{formatCurrency(breakevenFloorPrice)}</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
