'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import {
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CarFront,
  ArrowRight,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Layers,
  HelpCircle,
  Percent,
  Calculator,
} from 'lucide-react';

interface GrossProfitBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GrossProfitBreakdownModal({ isOpen, onClose }: GrossProfitBreakdownModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'breakdown' | 'simulator'>('breakdown');

  // Profit reduction simulator state
  const [profitReductionPct, setProfitReductionPct] = useState<number>(10); // default 10%
  const [profitReductionFixed, setProfitReductionFixed] = useState<number>(0);
  const [reductionMode, setReductionMode] = useState<'PERCENT' | 'FIXED'>('PERCENT');

  useEffect(() => {
    if (!isOpen) return;

    const fetchProfitBreakdown = async () => {
      setLoading(true);
      try {
        const res = await api.get('/bi/gross-profit-breakdown');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load gross profit breakdown', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfitBreakdown();
  }, [isOpen]);

  if (!isOpen) return null;

  const formatCurrency = (val?: number) => {
    const num = Number(val || 0);
    return `₹${Math.round(num).toLocaleString('en-IN')}`;
  };

  const totalSelling = data?.totalSellingPrice || 0;
  const totalCost = data?.totalAcquisitionCost || 0;
  const rawDifference = data?.totalRawDifference || (totalSelling - totalCost);
  const totalDiscounts = data?.totalDiscounts || 0;
  const totalCommission = data?.totalDealerBankCommission || 0;
  const totalGrossProfit = data?.totalGrossProfit || 0;
  const overallMarginPct = data?.overallMarginPct || 0;
  const totalContract = data?.totalContractValue || 1;

  // Simulator calculations
  const calculatedReduction =
    reductionMode === 'PERCENT'
      ? Math.round(totalGrossProfit * (profitReductionPct / 100))
      : Math.min(totalGrossProfit, profitReductionFixed);

  const reducedGrossProfit = Math.max(0, totalGrossProfit - calculatedReduction);
  const reducedMarginPct = totalContract > 0 ? Number(((reducedGrossProfit / totalContract) * 100).toFixed(1)) : 0;
  const marginDrop = (overallMarginPct - reducedMarginPct).toFixed(1);

  const filteredDeals = (data?.deals || []).filter((deal: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      deal.customer_name?.toLowerCase().includes(term) ||
      deal.vehicle_name?.toLowerCase().includes(term) ||
      deal.registration_number?.toLowerCase().includes(term) ||
      deal.branch_name?.toLowerCase().includes(term) ||
      String(deal.sale_id).includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-card border border-border rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden font-sans">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-foreground font-display">
                  Gross Profit & Difference Breakdown
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Audited Margin Ledger
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Exact difference between vehicle selling price and trade-in acquisition cost with loan commissions
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-slate-800/80 p-1 border border-border text-xs font-bold">
              <button
                onClick={() => setActiveTab('breakdown')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'breakdown' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Difference Analysis
              </button>
              <button
                onClick={() => setActiveTab('simulator')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'simulator' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders size={13} />
                Profit Reduction Simulator
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Calculating audited gross profit difference...</p>
            </div>
          ) : (
            <>
              {/* Formula & Explanation Banner */}
              <div className="rounded-2xl bg-purple-950/20 border border-purple-500/30 p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-purple-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <HelpCircle size={14} className="text-purple-400" />
                    How Gross Profit &amp; Differences Are Calculated
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 text-[10px] font-mono font-bold">
                    GAAP Financial Standard
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-slate-300">
                  <div className="bg-slate-900/60 rounded-xl p-3 border border-purple-500/20">
                    <p className="text-[10px] font-bold uppercase text-slate-400">1. Raw Difference (Spread)</p>
                    <p className="font-mono text-xs text-white mt-1">Selling Price - Acquisition Cost</p>
                    <p className="text-[10px] text-slate-400 mt-1">Direct markup on vehicle stock before customer negotiations</p>
                  </div>
                  <div className="bg-slate-900/60 rounded-xl p-3 border border-purple-500/20">
                    <p className="text-[10px] font-bold uppercase text-slate-400">2. Net Vehicle Margin</p>
                    <p className="font-mono text-xs text-white mt-1">Contract Value - Acquisition Cost</p>
                    <p className="text-[10px] text-slate-400 mt-1">Incorporates commercial discounts and statutory tax adjustments</p>
                  </div>
                  <div className="bg-slate-900/60 rounded-xl p-3 border border-purple-500/20">
                    <p className="text-[10px] font-bold uppercase text-slate-400">3. Final Audited Gross Profit</p>
                    <p className="font-mono text-xs text-emerald-400 mt-1">Net Margin + 2% Loan Commission</p>
                    <p className="text-[10px] text-slate-400 mt-1">Total revenue accrued to dealership including bank finance fees</p>
                  </div>
                </div>
              </div>

              {/* Difference Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Vehicle Selling Value */}
                <div className="rounded-2xl bg-secondary/30 border border-border p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-bold">
                    <span>Total Selling Value</span>
                    <CarFront size={16} className="text-sky-400" />
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-extrabold text-foreground font-mono">
                      {formatCurrency(totalSelling)}
                    </span>
                    <span className="block text-[11px] text-muted-foreground mt-1">
                      From {data?.totalSalesCount || 0} vehicle deals closed
                    </span>
                  </div>
                </div>

                {/* 2. Acquisition Cost */}
                <div className="rounded-2xl bg-secondary/30 border border-border p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-bold">
                    <span>Total Acquisition Cost</span>
                    <DollarSign size={16} className="text-amber-400" />
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-extrabold text-foreground font-mono">
                      {formatCurrency(totalCost)}
                    </span>
                    <span className="block text-[11px] text-muted-foreground mt-1">
                      Stockyard procurement &amp; trade-in cost
                    </span>
                  </div>
                </div>

                {/* 3. Raw Difference / Spread */}
                <div className="rounded-2xl bg-purple-500/10 border border-purple-500/30 p-4 flex flex-col justify-between ring-1 ring-purple-500/20">
                  <div className="flex items-center justify-between text-xs text-purple-300 font-bold">
                    <span>The Difference (Spread)</span>
                    <TrendingUp size={16} className="text-purple-400" />
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-extrabold text-purple-300 font-mono">
                      {formatCurrency(rawDifference)}
                    </span>
                    <span className="block text-[11px] text-purple-400/80 mt-1 font-semibold">
                      Raw markup difference (Selling - Cost)
                    </span>
                  </div>
                </div>

                {/* 4. Audited Net Gross Profit */}
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 flex flex-col justify-between ring-1 ring-emerald-500/20">
                  <div className="flex items-center justify-between text-xs text-emerald-300 font-bold">
                    <span>Net Gross Profit</span>
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  </div>
                  <div className="mt-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                        {formatCurrency(totalGrossProfit)}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                        {overallMarginPct}%
                      </span>
                    </div>
                    <span className="block text-[11px] text-emerald-400/80 mt-1">
                      Includes +{formatCurrency(totalCommission)} bank loan commission
                    </span>
                  </div>
                </div>

              </div>

              {/* TAB 1: DIFFERENCE BREAKDOWN & DEALS LEDGER */}
              {activeTab === 'breakdown' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-foreground font-display">
                        Vehicle-by-Vehicle Profit Difference Ledger
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Click on any transaction to inspect procurement cost vs realized contract margin
                      </p>
                    </div>
                    <div className="relative w-full sm:w-72">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search vehicle, buyer, branch..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-secondary/50 border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="border border-border rounded-2xl overflow-hidden bg-card/60">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-secondary/40 border-b border-border text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                          <tr>
                            <th className="py-3 px-4">Deal / Vehicle</th>
                            <th className="py-3 px-4">Customer</th>
                            <th className="py-3 px-4 text-right">Selling Price</th>
                            <th className="py-3 px-4 text-right">Acquisition Cost</th>
                            <th className="py-3 px-4 text-right">Difference (Spread)</th>
                            <th className="py-3 px-4 text-right">Discount</th>
                            <th className="py-3 px-4 text-right">2% Loan Comm.</th>
                            <th className="py-3 px-4 text-right font-extrabold text-foreground">Net Gross Profit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {filteredDeals.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-10 text-center text-muted-foreground text-xs">
                                No sales matching search filter.
                              </td>
                            </tr>
                          ) : (
                            filteredDeals.map((d: any) => {
                              const isPositive = d.net_gross_profit >= 0;
                              return (
                                <tr key={d.sale_id} className="hover:bg-secondary/30 transition-colors">
                                  <td className="py-3 px-4 font-semibold text-foreground">
                                    <div className="font-extrabold">{d.vehicle_name}</div>
                                    <div className="text-[10px] text-muted-foreground font-mono">
                                      {d.registration_number} • Sale #{d.sale_id}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-slate-300">
                                    <div>{d.customer_name}</div>
                                    <div className="text-[10px] text-muted-foreground">{d.branch_name}</div>
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono text-slate-200">
                                    {formatCurrency(d.selling_price)}
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono text-amber-400/90">
                                    {formatCurrency(d.acquisition_cost)}
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono font-bold">
                                    <span className="px-2 py-0.5 rounded-full text-[11px] bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                      +{formatCurrency(d.raw_spread)}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono text-rose-400">
                                    {d.discount > 0 ? `-${formatCurrency(d.discount)}` : '₹0'}
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono text-sky-400">
                                    {d.bank_commission > 0 ? `+${formatCurrency(d.bank_commission)}` : '₹0'}
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono font-extrabold">
                                    <div className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                                      {formatCurrency(d.net_gross_profit)}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground font-normal">
                                      {d.margin_pct}% margin
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: INTERACTIVE PROFIT REDUCTION SIMULATOR */}
              {activeTab === 'simulator' && (
                <div className="space-y-6">
                  <div className="rounded-2xl bg-secondary/20 border border-border p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                          <Sliders className="w-5 h-5 text-purple-400" />
                          What-If Profit Reduction &amp; Concession Analyzer
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Simulate how reducing profit margins or giving commercial discounts impacts total gross earnings
                        </p>
                      </div>

                      {/* Mode Toggle */}
                      <div className="flex rounded-xl bg-slate-900 border border-border p-1 text-xs">
                        <button
                          onClick={() => setReductionMode('PERCENT')}
                          className={`px-3 py-1 rounded-lg font-bold transition-all ${
                            reductionMode === 'PERCENT' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Percentage (%)
                        </button>
                        <button
                          onClick={() => setReductionMode('FIXED')}
                          className={`px-3 py-1 rounded-lg font-bold transition-all ${
                            reductionMode === 'FIXED' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Fixed Amount (₹)
                        </button>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      {reductionMode === 'PERCENT' ? (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-slate-300">Target Profit Reduction Percentage</span>
                            <span className="font-mono text-purple-400 text-base font-extrabold">{profitReductionPct}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="50"
                            step="1"
                            value={profitReductionPct}
                            onChange={(e) => setProfitReductionPct(Number(e.target.value))}
                            className="w-full accent-purple-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>0% (Full Price)</span>
                            <span>15% (Competitive Discount)</span>
                            <span>30% (Aggressive Clearance)</span>
                            <span>50% (Max Floor)</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-slate-300">Target Profit Concession (₹ INR)</span>
                            <span className="font-mono text-purple-400 text-base font-extrabold">
                              {formatCurrency(profitReductionFixed)}
                            </span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            max={totalGrossProfit}
                            step="10000"
                            value={profitReductionFixed}
                            onChange={(e) => setProfitReductionFixed(Math.max(0, Number(e.target.value)))}
                            placeholder="Enter amount to reduce in ₹"
                            className="w-full bg-secondary/60 border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                          />
                        </div>
                      )}

                      {/* Quick Scenarios */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-400 block">Quick Concession Presets</span>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => {
                              setReductionMode('PERCENT');
                              setProfitReductionPct(5);
                            }}
                            className="p-2.5 rounded-xl border border-border bg-slate-900/60 hover:border-purple-500/50 text-left transition-all"
                          >
                            <span className="text-[10px] text-muted-foreground block font-bold">Festive Concession</span>
                            <span className="text-xs font-extrabold text-white font-mono">-5% Profit</span>
                          </button>
                          <button
                            onClick={() => {
                              setReductionMode('PERCENT');
                              setProfitReductionPct(15);
                            }}
                            className="p-2.5 rounded-xl border border-border bg-slate-900/60 hover:border-purple-500/50 text-left transition-all"
                          >
                            <span className="text-[10px] text-muted-foreground block font-bold">High Volume Push</span>
                            <span className="text-xs font-extrabold text-white font-mono">-15% Profit</span>
                          </button>
                          <button
                            onClick={() => {
                              setReductionMode('PERCENT');
                              setProfitReductionPct(25);
                            }}
                            className="p-2.5 rounded-xl border border-border bg-slate-900/60 hover:border-purple-500/50 text-left transition-all"
                          >
                            <span className="text-[10px] text-muted-foreground block font-bold">Aged Stock Liquidation</span>
                            <span className="text-xs font-extrabold text-white font-mono">-25% Profit</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Impact Results Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    
                    {/* 1. Original Gross Profit */}
                    <div className="rounded-2xl bg-secondary/30 border border-border p-4">
                      <span className="text-xs font-bold text-muted-foreground">Original Baseline Profit</span>
                      <div className="mt-2">
                        <span className="text-xl font-extrabold text-foreground font-mono">
                          {formatCurrency(totalGrossProfit)}
                        </span>
                        <span className="block text-[11px] text-muted-foreground mt-1">
                          Margin: {overallMarginPct}%
                        </span>
                      </div>
                    </div>

                    {/* 2. Total Concession Given */}
                    <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-4">
                      <span className="text-xs font-bold text-rose-300">Profit Given Away</span>
                      <div className="mt-2">
                        <span className="text-xl font-extrabold text-rose-400 font-mono">
                          -{formatCurrency(calculatedReduction)}
                        </span>
                        <span className="block text-[11px] text-rose-300/80 mt-1 font-semibold">
                          Concession to buyers
                        </span>
                      </div>
                    </div>

                    {/* 3. Revised Gross Profit */}
                    <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 ring-2 ring-emerald-500/30">
                      <span className="text-xs font-bold text-emerald-300">Revised Gross Profit You Get</span>
                      <div className="mt-2">
                        <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                          {formatCurrency(reducedGrossProfit)}
                        </span>
                        <span className="block text-[11px] text-emerald-300/90 mt-1 font-bold">
                          New Margin: {reducedMarginPct}% ({marginDrop > '0' ? `-${marginDrop}%` : '0%'})
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Negotiation Guidance Card */}
                  <div className="rounded-2xl bg-slate-900/90 border border-border p-4 text-xs space-y-2">
                    <span className="font-extrabold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <AlertTriangle size={14} /> Dealership Negotiation Boundary
                    </span>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      At this concession level, the average gross profit per car becomes{' '}
                      <strong className="text-white font-mono">
                        {formatCurrency(data?.totalSalesCount ? reducedGrossProfit / data.totalSalesCount : 0)}
                      </strong>. Sales consultants can safely negotiate discounts up to{' '}
                      <strong className="text-emerald-400 font-mono">
                        {formatCurrency(data?.totalSalesCount ? calculatedReduction / data.totalSalesCount : 0)}
                      </strong>{' '}
                      per vehicle before dipping below the dealership minimum margin floor.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-secondary/20 flex justify-between items-center text-xs">
          <span className="text-muted-foreground font-mono">
            CarRevive Financial Engine • Real-time relational accounting
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold transition-all"
          >
            Close Analysis
          </button>
        </div>

      </div>
    </div>
  );
}
