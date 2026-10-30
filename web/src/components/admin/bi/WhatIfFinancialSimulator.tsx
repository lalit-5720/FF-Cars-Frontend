'use client';

import React, { useState, useMemo } from 'react';
import { Sliders, DollarSign, TrendingUp, AlertTriangle, ArrowUpRight, Zap, RefreshCw, CheckCircle, Info, Calculator, HelpCircle, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

interface WhatIfSimulatorProps {
  agingCount60Plus?: number;
  totalAgingCapital?: number; // In Rupees
}

export function WhatIfFinancialSimulator({
  agingCount60Plus = 14,
  totalAgingCapital = 18500000 // Default 1.85 Cr
}: WhatIfSimulatorProps) {
  const [discountPercent, setDiscountPercent] = useState<number>(8);
  const [targetUnits, setTargetUnits] = useState<number>(agingCount60Plus);
  const [showFormulaExplanation, setShowFormulaExplanation] = useState<boolean>(false);

  // Dealership annual inventory financing interest / carrying cost rate (APR)
  const FLOORPLAN_APR = 10.5; // 10.5% per annum

  // Dynamic Financial Projections & Formulas
  const calculations = useMemo(() => {
    const avgCarValue = totalAgingCapital / Math.max(agingCount60Plus, 1);
    const affectedCapital = avgCarValue * targetUnits;
    const discountAmount = affectedCapital * (discountPercent / 100);
    const unlockedCash = affectedCapital - discountAmount;
    
    // Inventory Velocity Multiplier: Price elasticity factor ~4.2x demand boost per % markdown
    const estimatedVelocityIncrease = Math.min(Math.round(discountPercent * 4.2), 95); 
    
    // Days saved on lot estimation based on pricing markdown
    const projectedDaysSaved = Math.round((discountPercent / 100) * 45); 

    // Daily Holding Carrying Cost = (Capital * APR) / 365
    const dailyCarryingCost = (affectedCapital * (FLOORPLAN_APR / 100)) / 365;
    const totalHoldingCostSaved = dailyCarryingCost * projectedDaysSaved;

    return {
      discountAmount,
      unlockedCash,
      estimatedVelocityIncrease,
      projectedDaysSaved,
      affectedCapital,
      dailyCarryingCost,
      totalHoldingCostSaved
    };
  }, [discountPercent, targetUnits, totalAgingCapital, agingCount60Plus, FLOORPLAN_APR]);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all relative overflow-hidden text-slate-800 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              Financial What-If Repricing &amp; Carrying Cost Engine
              <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                DECISION MODEL
              </span>
            </h3>
            <p className="text-xs text-text-secondary font-medium">Simulate pricing markdown impact on aging inventory liquidity, holding cost savings &amp; capital velocity</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Formula Explanation Toggle Button */}
          <button
            onClick={() => setShowFormulaExplanation(!showFormulaExplanation)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{showFormulaExplanation ? 'Hide Logic Formulas' : 'How This Works (Formulas)'}</span>
            {showFormulaExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => {
              setDiscountPercent(8);
              setTargetUnits(agingCount60Plus);
            }}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200"
            title="Reset Simulation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Mathematical Formula Breakdown Guide */}
      {showFormulaExplanation && (
        <div className="mb-6 p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs leading-relaxed animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-3">
            <Info className="w-4 h-4 text-amber-600" />
            <span>Mathematical Mechanics of Dealership What-If Repricing</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="font-bold text-slate-900 block mb-1 text-xs">1. Capital Carrying Cost (Interest)</span>
              <p className="text-slate-600 text-[11px]">
                Dealership inventory tied up in showroom lots costs money daily in floorplan financing interest (<strong className="text-slate-900">10.5% APR</strong>). 
              </p>
              <div className="mt-2 font-mono text-[10px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 font-bold">
                Daily Cost = (Capital × 10.5%) / 365
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="font-bold text-slate-900 block mb-1 text-xs">2. Markdown Elasticity Multiplier</span>
              <p className="text-slate-600 text-[11px]">
                Lowering vehicle prices increases buyer inquiry velocity. Every 1% price markdown yields ~4.2% faster conversion on aging stock.
              </p>
              <div className="mt-2 font-mono text-[10px] text-blue-800 bg-blue-50 p-2 rounded border border-blue-200 font-bold">
                Velocity Boost % = Markdown % × 4.2
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="font-bold text-slate-900 block mb-1 text-xs">3. Net Working Capital Unlocked</span>
              <p className="text-slate-600 text-[11px]">
                Selling aging stock recovers liquid cash immediately to purchase high-demand fresh vehicles rather than holding stagnant inventory.
              </p>
              <div className="mt-2 font-mono text-[10px] text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200 font-bold">
                Unlocked Cash = Capital - Markdown Amt
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-700 bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong className="text-slate-900">Executive Rule of Thumb:</strong> If daily carrying interest exceeds projected profit margin on an aging car (&gt;60 days), applying a 5-10% markdown yields net positive cash flow!
            </span>
          </div>
        </div>
      )}

      {/* Controls & Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Discount Slider */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600" /> Proposed Markdown Percentage
            </label>
            <span className="text-sm font-extrabold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
              {discountPercent}% OFF
            </span>
          </div>
          <input
            type="range"
            min={2}
            max={20}
            step={1}
            value={discountPercent}
            onChange={(e) => setDiscountPercent(Number(e.target.value))}
            className="w-full accent-amber-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-text-secondary font-semibold">
            <span>2% Mild</span>
            <span>10% Recommended</span>
            <span>20% Clearance</span>
          </div>
        </div>

        {/* Target Units Slider */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-blue-600" /> Aging Inventory Scope (&gt;60 Days Stock)
            </label>
            <span className="text-sm font-extrabold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
              {targetUnits} / {agingCount60Plus} Cars
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={Math.max(agingCount60Plus, 1)}
            step={1}
            value={targetUnits}
            onChange={(e) => setTargetUnits(Number(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-text-secondary font-semibold">
            <span>1 Selective Vehicle</span>
            <span>50% Scope</span>
            <span>All {agingCount60Plus} Aging Stock</span>
          </div>
        </div>
      </div>

      {/* Simulated Outcomes KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Unlocked Working Capital */}
        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-bold mb-1">
            <span>Unlocked Capital</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            ₹{(calculations.unlockedCash / 100000).toFixed(2)} Lakhs
          </div>
          <p className="text-[10px] text-emerald-700 mt-1 flex items-center gap-1 font-semibold">
            <ArrowUpRight className="w-3 h-3" /> Net liquid cash recovered
          </p>
        </div>

        {/* Projected Sales Velocity Boost */}
        <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-700 text-xs font-bold mb-1">
            <span>Demand Velocity Boost</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            +{calculations.estimatedVelocityIncrease}%
          </div>
          <p className="text-[10px] text-text-secondary mt-1 font-semibold">
            Lead inquiry conversion speed
          </p>
        </div>

        {/* Days Saved on Lot */}
        <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 text-xs font-bold mb-1">
            <span>Lot Turnover Speedup</span>
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            -{calculations.projectedDaysSaved} Days
          </div>
          <p className="text-[10px] text-amber-700 mt-1 font-semibold">
            Earlier capital release
          </p>
        </div>

        {/* Floorplan Interest Saved */}
        <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 shadow-2xs">
          <div className="flex items-center justify-between text-purple-700 text-xs font-bold mb-1">
            <span>Carrying Interest Saved</span>
            <Zap className="w-4 h-4" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            ₹{(calculations.totalHoldingCostSaved / 1000).toFixed(1)}k
          </div>
          <p className="text-[10px] text-purple-700 mt-1 font-semibold">
            Floorplan interest penalty saved
          </p>
        </div>
      </div>
    </div>
  );
}
