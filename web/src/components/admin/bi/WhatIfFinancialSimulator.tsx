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
    <div className="bg-[#141A2A] border border-[#5468F0]/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden text-slate-100 font-sans">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#5468F0]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#2D374A]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5468F0] to-[#7B8CFF] flex items-center justify-center text-white shadow-lg shadow-[#5468F0]/30 shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Financial What-If Repricing & Carrying Cost Engine
              <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                DECISION MODEL
              </span>
            </h3>
            <p className="text-xs text-gray-400">Simulate pricing markdown impact on aging inventory liquidity, holding cost savings & capital velocity</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Formula Explanation Toggle Button */}
          <button
            onClick={() => setShowFormulaExplanation(!showFormulaExplanation)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5468F0]/20 hover:bg-[#5468F0]/30 text-[#7B8CFF] border border-[#5468F0]/40 text-xs font-semibold transition-colors"
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
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            title="Reset Simulation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Mathematical Formula Breakdown Guide */}
      {showFormulaExplanation && (
        <div className="mb-6 p-5 rounded-xl bg-[#0B0F1A] border border-[#5468F0]/30 text-xs leading-relaxed animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-3">
            <Info className="w-4 h-4" />
            <span>Mathematical Mechanics of Dealership What-If Repricing</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-gray-900/80 border border-gray-800">
              <span className="font-bold text-white block mb-1 text-xs">1. Capital Carrying Cost (Interest)</span>
              <p className="text-gray-400 text-[11px]">
                Dealership inventory tied up in showroom lots costs money daily in floorplan financing interest (<strong className="text-gray-200">10.5% APR</strong>). 
              </p>
              <div className="mt-2 font-mono text-[10px] text-amber-300 bg-black/40 p-2 rounded">
                Daily Cost = (Capital × 10.5%) / 365
              </div>
            </div>

            <div className="p-3 rounded-lg bg-gray-900/80 border border-gray-800">
              <span className="font-bold text-white block mb-1 text-xs">2. Markdown Elasticity Multiplier</span>
              <p className="text-gray-400 text-[11px]">
                Lowering vehicle prices increases buyer inquiry velocity. Every 1% price markdown yields ~4.2% faster conversion on aging stock.
              </p>
              <div className="mt-2 font-mono text-[10px] text-indigo-300 bg-black/40 p-2 rounded">
                Velocity Boost % = Markdown % × 4.2
              </div>
            </div>

            <div className="p-3 rounded-lg bg-gray-900/80 border border-gray-800">
              <span className="font-bold text-white block mb-1 text-xs">3. Net Working Capital Unlocked</span>
              <p className="text-gray-400 text-[11px]">
                Selling aging stock recovers liquid cash immediately to purchase high-demand fresh vehicles rather than holding stagnant inventory.
              </p>
              <div className="mt-2 font-mono text-[10px] text-emerald-300 bg-black/40 p-2 rounded">
                Unlocked Cash = Capital - Markdown Amt
              </div>
            </div>
          </div>

          <div className="text-[11px] text-gray-400 bg-gray-900/50 p-2.5 rounded-lg border border-gray-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-white">Executive Rule of Thumb:</strong> If daily carrying interest exceeds projected profit margin on an aging car (&gt;60 days), applying a 5-10% markdown yields net positive cash flow!
            </span>
          </div>
        </div>
      )}

      {/* Controls & Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Discount Slider */}
        <div className="p-4 rounded-xl bg-[#0B0F1A] border border-[#2D374A] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" /> Proposed Markdown Percentage
            </label>
            <span className="text-sm font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-lg border border-amber-400/20">
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
            className="w-full accent-amber-400 cursor-pointer h-2 bg-gray-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-gray-500 font-medium">
            <span>2% Mild</span>
            <span>10% Recommended</span>
            <span>20% Clearance</span>
          </div>
        </div>

        {/* Target Units Slider */}
        <div className="p-4 rounded-xl bg-[#0B0F1A] border border-[#2D374A] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-indigo-400" /> Aging Inventory Scope (&gt;60 Days Stock)
            </label>
            <span className="text-sm font-bold text-indigo-400 bg-indigo-400/10 px-2.5 py-0.5 rounded-lg border border-indigo-400/20">
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
            className="w-full accent-indigo-400 cursor-pointer h-2 bg-gray-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-gray-500 font-medium">
            <span>1 Selective Vehicle</span>
            <span>50% Scope</span>
            <span>All {agingCount60Plus} Aging Stock</span>
          </div>
        </div>
      </div>

      {/* Simulated Outcomes KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Unlocked Working Capital */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 to-[#0B0F1A] border border-emerald-500/30">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold mb-1">
            <span>Unlocked Capital</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-lg font-black text-white font-mono">
            ₹{(calculations.unlockedCash / 100000).toFixed(2)} Lakhs
          </div>
          <p className="text-[10px] text-emerald-400/80 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> Net liquid cash recovered
          </p>
        </div>

        {/* Projected Sales Velocity Boost */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#5468F0]/20 to-[#0B0F1A] border border-[#5468F0]/30">
          <div className="flex items-center justify-between text-[#7B8CFF] text-xs font-semibold mb-1">
            <span>Demand Velocity Boost</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-lg font-black text-white font-mono">
            +{calculations.estimatedVelocityIncrease}%
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            Lead inquiry conversion speed
          </p>
        </div>

        {/* Days Saved on Lot */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/40 to-[#0B0F1A] border border-amber-500/30">
          <div className="flex items-center justify-between text-amber-400 text-xs font-semibold mb-1">
            <span>Lot Turnover Speedup</span>
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="text-lg font-black text-white font-mono">
            -{calculations.projectedDaysSaved} Days
          </div>
          <p className="text-[10px] text-amber-400/80 mt-1">
            Earlier capital release
          </p>
        </div>

        {/* Floorplan Interest Saved */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-950/40 to-[#0B0F1A] border border-purple-500/30">
          <div className="flex items-center justify-between text-purple-400 text-xs font-semibold mb-1">
            <span>Carrying Interest Saved</span>
            <Zap className="w-4 h-4" />
          </div>
          <div className="text-lg font-black text-white font-mono">
            ₹{(calculations.totalHoldingCostSaved / 1000).toFixed(1)}k
          </div>
          <p className="text-[10px] text-purple-300/80 mt-1">
            Floorplan interest penalty saved
          </p>
        </div>
      </div>
    </div>
  );
}
