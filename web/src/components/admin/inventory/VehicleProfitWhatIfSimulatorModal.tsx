'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../services/api';
import { showLocalToast } from '../../Toast';
import {
  CarFront,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Percent,
  Sliders,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Clock,
  Building2,
  X,
  ExternalLink,
  Info,
  Check,
  ChevronRight,
  Calculator,
  Loader2,
  Save,
} from 'lucide-react';

export interface InventoryVehicle {
  vehicle_id?: number;
  id?: number;
  make: string;
  model: string;
  manufacture_year?: number;
  year?: number;
  registration_number?: string;
  price?: number;
  purchase_price?: number;
  status?: string;
  color?: string;
  fuel_type?: string;
  transmission?: string;
  branch_id?: number;
  branches?: {
    branch_name?: string;
    city?: string;
  };
  created_at?: string;
  createdAt?: string;
  image_url?: string;
}

interface VehicleProfitWhatIfSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVehicle: InventoryVehicle | null;
  allVehicles: InventoryVehicle[];
  onPriceUpdated?: (vehicleId: number, newPrice: number) => void;
  onOpenFullDealSimulator?: (vehicleId: number) => void;
}

export function VehicleProfitWhatIfSimulatorModal({
  isOpen,
  onClose,
  selectedVehicle,
  allVehicles = [],
  onPriceUpdated,
  onOpenFullDealSimulator,
}: VehicleProfitWhatIfSimulatorModalProps) {
  const [currentVehicleId, setCurrentVehicleId] = useState<string>('');
  
  // Financial parameters
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [acquisitionCost, setAcquisitionCost] = useState<number>(0);
  const [reconditioningCost, setReconditioningCost] = useState<number>(25000); // Standard refurbishment & RTO intake
  const [reducedPrice, setReducedPrice] = useState<number>(0);
  const [reductionMode, setReductionMode] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [reductionPct, setReductionPct] = useState<number>(5); // default 5% markdown
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when vehicle is selected or modal opens
  useEffect(() => {
    if (selectedVehicle) {
      const vId = String(selectedVehicle.vehicle_id || selectedVehicle.id || '');
      setCurrentVehicleId(vId);
      loadVehicleData(selectedVehicle);
    }
  }, [selectedVehicle, isOpen]);

  const loadVehicleData = (v: InventoryVehicle) => {
    const listPrice = Number(v.price || 0);
    // If acquisition cost is not recorded in DB, estimate standard 82% dealer trade-in benchmark
    const defaultCost = v.purchase_price ? Number(v.purchase_price) : Math.round(listPrice * 0.82);
    
    setOriginalPrice(listPrice);
    setAcquisitionCost(defaultCost);
    setReconditioningCost(25000);
    
    // Default 5% markdown simulation
    const initialReduced = Math.max(defaultCost, Math.round(listPrice * 0.95));
    setReducedPrice(initialReduced);
    setReductionPct(5);
  };

  const handleVehicleChange = (vId: string) => {
    setCurrentVehicleId(vId);
    const found = allVehicles.find(
      (v) => String(v.vehicle_id || v.id) === String(vId)
    );
    if (found) {
      loadVehicleData(found);
    }
  };

  // Currently active vehicle object
  const activeVehicle = useMemo(() => {
    return (
      allVehicles.find(
        (v) => String(v.vehicle_id || v.id) === String(currentVehicleId)
      ) || selectedVehicle
    );
  }, [allVehicles, currentVehicleId, selectedVehicle]);

  // Handle Preset Markdown Percentage
  const applyPctReduction = (pct: number) => {
    setReductionMode('PERCENT');
    setReductionPct(pct);
    const newPrice = Math.max(0, Math.round(originalPrice * (1 - pct / 100)));
    setReducedPrice(newPrice);
  };

  // Handle Preset Fixed Discount Amount
  const applyFixedReduction = (amount: number) => {
    setReductionMode('FIXED');
    const newPrice = Math.max(0, originalPrice - amount);
    setReducedPrice(newPrice);
    if (originalPrice > 0) {
      setReductionPct(Number(((amount / originalPrice) * 100).toFixed(1)));
    }
  };

  // When user directly inputs new price
  const handlePriceInput = (val: number) => {
    setReducedPrice(val);
    if (originalPrice > 0) {
      const diff = Math.max(0, originalPrice - val);
      setReductionPct(Number(((diff / originalPrice) * 100).toFixed(1)));
    }
  };

  // Calculate Days in Inventory
  const daysInStock = useMemo(() => {
    if (!activeVehicle) return 30;
    const dateStr = activeVehicle.created_at || activeVehicle.createdAt;
    if (!dateStr) return 38; // standard showroom average
    const created = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diffDays = Math.max(1, Math.round((now - created) / (1000 * 60 * 60 * 24)));
    return diffDays;
  }, [activeVehicle]);

  // ===================== CORE FINANCIAL FORMULAS =====================
  // Dealership annual inventory financing interest rate (Floorplan APR ~10.5%)
  const FLOORPLAN_APR = 10.5;

  const calculations = useMemo(() => {
    // 1. Baseline Calculations
    const baselineTotalCost = acquisitionCost + reconditioningCost;
    const baselineGrossProfit = originalPrice - baselineTotalCost;
    const baselineMarginPct =
      originalPrice > 0 ? Number(((baselineGrossProfit / originalPrice) * 100).toFixed(1)) : 0;

    // 2. Simulated Reduced Calculations
    const priceDifference = originalPrice - reducedPrice; // Profit given away to customer
    const revisedTotalCost = acquisitionCost + reconditioningCost;
    const revisedGrossProfit = reducedPrice - revisedTotalCost;
    const revisedMarginPct =
      reducedPrice > 0 ? Number(((revisedGrossProfit / reducedPrice) * 100).toFixed(1)) : 0;
    const marginCompressionPct = Number((baselineMarginPct - revisedMarginPct).toFixed(1));

    // 3. Absolute Breakeven Floor (Zero gross profit boundary)
    const absoluteBreakevenFloor = acquisitionCost + reconditioningCost;
    const isBelowCost = reducedPrice < absoluteBreakevenFloor;
    const distanceToFloor = reducedPrice - absoluteBreakevenFloor;

    // 4. Holding Carrying Cost & Velocity Advantage
    // Daily carrying cost of capital tied up in vehicle = (Acquisition Cost * 10.5% APR) / 365
    const dailyHoldingCost = (acquisitionCost * (FLOORPLAN_APR / 100)) / 365;
    
    // Price Elasticity: each 1% price markdown accelerates sales cycle by ~3.5 days
    const markdownPct = originalPrice > 0 ? Math.max(0, (priceDifference / originalPrice) * 100) : 0;
    const projectedDaysSaved = Math.min(Math.round(markdownPct * 3.5), Math.max(1, daysInStock));
    const projectedHoldingCostSaved = Math.round(dailyHoldingCost * projectedDaysSaved);
    
    // Net Dealership Financial Tradeoff
    // Sacrificed Gross Margin vs Holding Cost Saved
    const netTradeoffDifference = revisedGrossProfit - baselineGrossProfit + projectedHoldingCostSaved;

    // Deal Health Status
    let dealStatus = {
      badge: 'HEALTHY MARGIN',
      color: 'badge badge-success',
      description: 'Solid gross profit margin. Safe for sales team execution without branch escalation.',
      level: 'HEALTHY',
    };

    if (isBelowCost || revisedMarginPct <= 0) {
      dealStatus = {
        badge: 'CRITICAL: LOSS BREACH',
        color: 'badge badge-danger',
        description: 'DANGER: Simulated price falls below total acquisition + reconditioning cost!',
        level: 'CRITICAL',
      };
    } else if (revisedMarginPct < 6) {
      dealStatus = {
        badge: 'FLOOR COMPRESSION WARNING',
        color: 'badge badge-danger',
        description: 'Very thin margin (<6%). High risk of net overhead deficit after showroom sales commissions.',
        level: 'WARNING',
      };
    } else if (revisedMarginPct < 12) {
      dealStatus = {
        badge: 'MODERATE CONCESSION',
        color: 'badge badge-warning',
        description: 'Acceptable volume concession. Recommended to liquidate aging stock.',
        level: 'MODERATE',
      };
    }

    return {
      baselineGrossProfit,
      baselineMarginPct,
      priceDifference,
      revisedGrossProfit,
      revisedMarginPct,
      marginCompressionPct,
      absoluteBreakevenFloor,
      isBelowCost,
      distanceToFloor,
      dailyHoldingCost,
      projectedDaysSaved,
      projectedHoldingCostSaved,
      netTradeoffDifference,
      dealStatus,
    };
  }, [originalPrice, acquisitionCost, reconditioningCost, reducedPrice, daysInStock, FLOORPLAN_APR]);

  // Handle saving the simulated price back to database
  const handleApplyPriceToInventory = async () => {
    if (!activeVehicle) return;
    const vehicleId = activeVehicle.vehicle_id || activeVehicle.id;
    if (!vehicleId) return;

    if (reducedPrice <= 0) {
      showLocalToast('Please specify a valid positive selling price.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await api.patch(`/vehicles/${vehicleId}`, {
        price: reducedPrice,
      });

      showLocalToast(
        `✨ Updated price for ${activeVehicle.make} ${activeVehicle.model} to ₹${reducedPrice.toLocaleString('en-IN')}!`,
        'success'
      );

      // Notify parent to refresh table state
      if (onPriceUpdated) {
        onPriceUpdated(Number(vehicleId), reducedPrice);
      }

      // Update current baseline price to newly saved price
      setOriginalPrice(reducedPrice);
      setReductionPct(0);
    } catch (err: any) {
      console.error('Failed to update vehicle price from simulator:', err);
      showLocalToast(err.response?.data?.message || 'Failed to update vehicle price.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (val?: number) => {
    const num = Number(val || 0);
    return `₹${Math.round(num).toLocaleString('en-IN')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-bg-surface border border-border rounded-lg shadow-xl overflow-hidden my-auto text-text-primary">
        
        {/* ===================== MODAL HEADER ===================== */}
        <div className="px-5 py-4 border-b border-border bg-bg-surface-alt flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-bg-surface border border-border flex items-center justify-center text-accent shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="badge badge-info">
                  Inventory What-If Simulator
                </span>
                <span className="text-xs text-text-secondary">• Real-Time Gross Margin Forecasting</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight mt-0.5">
                Vehicle Price Reduction &amp; Profit Simulator
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            {/* Vehicle Quick Switcher Dropdown */}
            <div className="flex items-center gap-2 bg-bg-surface border border-border rounded-lg px-2.5 py-1">
              <CarFront className="w-4 h-4 text-accent shrink-0" />
              <select
                value={currentVehicleId}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className="bg-transparent text-xs text-text-primary font-bold focus:outline-none cursor-pointer max-w-[200px] truncate"
              >
                {allVehicles.map((v) => (
                  <option key={v.vehicle_id || v.id} value={v.vehicle_id || v.id} className="bg-bg-surface text-text-primary">
                    {v.make} {v.model} ({v.registration_number || 'Stock'})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="btn-neutral w-8 h-8 p-0 flex items-center justify-center rounded-lg"
              title="Close Simulator"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ===================== ACTIVE VEHICLE SUMMARY BANNER ===================== */}
        {activeVehicle && (
          <div className="px-5 py-3 bg-bg-surface border-b border-border flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              {activeVehicle.image_url ? (
                <img
                  src={activeVehicle.image_url}
                  alt={activeVehicle.make}
                  className="w-12 h-9 object-cover rounded-lg border border-border"
                />
              ) : (
                <div className="w-12 h-9 bg-bg-surface-alt rounded-lg flex items-center justify-center border border-border">
                  <CarFront className="w-5 h-5 text-text-secondary" />
                </div>
              )}
              <div>
                <span className="font-bold text-text-primary text-sm">
                  {activeVehicle.make} {activeVehicle.model}{' '}
                  <span className="text-text-secondary font-normal">({activeVehicle.manufacture_year || activeVehicle.year})</span>
                </span>
                <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5">
                  <span className="font-bold text-accent">{activeVehicle.registration_number || 'UNREGISTERED'}</span>
                  <span>•</span>
                  <span>{activeVehicle.fuel_type || 'Petrol'}</span>
                  <span>•</span>
                  <span>{activeVehicle.transmission || 'Automatic'}</span>
                  <span>•</span>
                  <span>
                    {activeVehicle.branches?.branch_name || `Branch #${activeVehicle.branch_id || 1}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-bg-surface-alt border border-border">
                <Clock className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs text-text-secondary">Inventory Age:</span>
                <span className="text-xs font-bold text-accent">{daysInStock} Days on Lot</span>
              </div>
              <span className="badge badge-info">
                Status: {activeVehicle.status || 'Available'}
              </span>
            </div>
          </div>
        )}

        {/* ===================== MAIN SIMULATOR BODY ===================== */}
        <div className="p-5 space-y-4 max-h-[72vh] overflow-y-auto">
          
          {/* TOP SUMMARY CARDS: BASELINE vs WHAT-IF COMPARISON */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* CURRENT BASELINE CARD */}
            <div className="rounded-lg bg-bg-surface border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-accent" /> Current Baseline Listing
                </span>
                <span className="badge badge-info">
                  ORIGINAL
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-2xl font-bold text-text-primary tracking-tight">
                    {formatCurrency(originalPrice)}
                  </span>
                  <span className="text-xs text-text-secondary block mt-0.5">Showroom Listed Price</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-status-success">
                    {formatCurrency(calculations.baselineGrossProfit)}
                  </span>
                  <span className="text-xs font-bold text-status-success block">
                    {calculations.baselineMarginPct}% Gross Margin
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-text-secondary">
                <span>Acquisition Cost: <strong className="text-text-primary">{formatCurrency(acquisitionCost)}</strong></span>
                <span>Prep &amp; RTO: <strong className="text-text-primary">{formatCurrency(reconditioningCost)}</strong></span>
              </div>
            </div>

            {/* WHAT-IF SIMULATED RESULT CARD */}
            <div className={`rounded-lg border p-4 space-y-3 bg-bg-surface ${
              calculations.isBelowCost ? 'border-status-danger' : 'border-border'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent" /> Simulated Proposed Deal
                </span>
                <span className={calculations.dealStatus.color}>
                  {calculations.dealStatus.badge}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-2xl font-bold text-accent tracking-tight">
                    {formatCurrency(reducedPrice)}
                  </span>
                  <span className="text-xs text-text-secondary block mt-0.5 flex items-center gap-1 font-bold">
                    <TrendingDown className="w-3 h-3 text-status-danger" />
                    -{formatCurrency(calculations.priceDifference)} ({reductionPct}% markdown)
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${
                    calculations.revisedGrossProfit > 0 ? 'text-status-success' : 'text-status-danger'
                  }`}>
                    {formatCurrency(calculations.revisedGrossProfit)}
                  </span>
                  <span className="text-xs font-bold text-text-secondary block">
                    {calculations.revisedMarginPct}% Margin ({calculations.marginCompressionPct > 0 ? `-${calculations.marginCompressionPct}%` : '0%'})
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                <span className="text-text-secondary">
                  Breakeven Floor Price:{' '}
                  <strong className="text-text-primary">{formatCurrency(calculations.absoluteBreakevenFloor)}</strong>
                </span>
                <span className={calculations.distanceToFloor >= 0 ? 'text-status-success font-bold' : 'text-status-danger font-bold'}>
                  {calculations.distanceToFloor >= 0
                    ? `+${formatCurrency(calculations.distanceToFloor)} above floor`
                    : `${formatCurrency(calculations.distanceToFloor)} BELOW FLOOR!`}
                </span>
              </div>
            </div>

          </div>

          {/* SENSITIVITY CONTROLS: SLIDERS & PRESETS */}
          <div className="rounded-lg bg-bg-surface border border-border p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-accent" />
                  Interactive Price Markdown Controls
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Adjust the price drop slider to test elasticity and see instantaneous profit compression.
                </p>
              </div>

              {/* Reset to Baseline Button */}
              <button
                type="button"
                onClick={() => {
                  setReducedPrice(originalPrice);
                  setReductionPct(0);
                }}
                className="btn-neutral text-xs h-8 px-3 flex items-center gap-1.5 self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Original Price</span>
              </button>
            </div>

            {/* Quick Reduction Presets */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
                Quick Markdown Presets (% Discount):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[2.5, 5.0, 7.5, 10.0, 15.0].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => applyPctReduction(pct)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex flex-col items-center gap-0.5 ${
                      reductionMode === 'PERCENT' && reductionPct === pct
                        ? 'btn-primary'
                        : 'btn-neutral'
                    }`}
                  >
                    <span>-{pct}%</span>
                    <span className="text-xs font-normal opacity-80">
                      -{formatCurrency(originalPrice * (pct / 100))}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Markdown Amount Presets (Fixed Rupees) */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
                Direct Amount Reductions (₹ Flat):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[25000, 50000, 100000, 150000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => applyFixedReduction(amt)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      reductionMode === 'FIXED' && originalPrice - reducedPrice === amt
                        ? 'btn-primary'
                        : 'btn-neutral'
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>-{formatCurrency(amt)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Range Slider & Direct Numeric Input */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-2">
              <div className="md:col-span-8 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-primary font-bold">Slide to Adjust Selling Price:</span>
                  <span className="text-accent font-bold">
                    {reductionPct}% Lower (-{formatCurrency(calculations.priceDifference)})
                  </span>
                </div>
                <input
                  type="range"
                  min={Math.max(0, Math.round(originalPrice * 0.6))}
                  max={originalPrice}
                  step={5000}
                  value={reducedPrice}
                  onChange={(e) => handlePriceInput(Number(e.target.value))}
                  className="w-full h-2 bg-bg-surface-alt rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span>Min: {formatCurrency(originalPrice * 0.6)} (-40%)</span>
                  <span className="text-accent">Breakeven: {formatCurrency(calculations.absoluteBreakevenFloor)}</span>
                  <span>Max: {formatCurrency(originalPrice)}</span>
                </div>
              </div>

              {/* Exact Number Input Box */}
              <div className="md:col-span-4 bg-bg-surface-alt rounded-lg border border-border p-3 space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block">
                  Exact New Selling Price (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent font-bold text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={reducedPrice}
                    onChange={(e) => handlePriceInput(Number(e.target.value))}
                    className="input-base w-full text-xs h-9 pl-7 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Adjustable Internal Cost Parameters */}
            <div className="pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-xs font-bold text-text-secondary block mb-1">
                  Dealer Acquisition / Trade-In Cost (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={acquisitionCost}
                  onChange={(e) => setAcquisitionCost(Number(e.target.value))}
                  className="input-base w-full text-xs h-9"
                />
                <span className="text-xs text-text-secondary mt-0.5 block">Purchase cost recorded in inventory</span>
              </div>
              <div>
                <label className="text-xs font-bold text-text-secondary block mb-1">
                  Refurbishment &amp; Overhead Burden (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={reconditioningCost}
                  onChange={(e) => setReconditioningCost(Number(e.target.value))}
                  className="input-base w-full text-xs h-9"
                />
                <span className="text-xs text-text-secondary mt-0.5 block">Mechanical detailing, RTO, and staging fees</span>
              </div>
            </div>

          </div>

          {/* ===================== VELOCITY & HOLDING COST SAVINGS ===================== */}
          <div className="rounded-lg bg-bg-surface-alt border border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-bg-surface border border-border text-accent flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  The Velocity Advantage: Holding Cost Offsets
                </h4>
                <p className="text-xs text-text-secondary">
                  Reducing price speeds up liquidation, saving floorplan carrying interest and parking overhead.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-bg-surface border border-border">
                <span className="text-xs text-text-secondary block">Daily Floorplan Carrying Cost</span>
                <span className="text-sm font-bold text-text-primary mt-0.5 block">
                  {formatCurrency(calculations.dailyHoldingCost)} / day
                </span>
                <span className="text-xs text-text-secondary">Based on {FLOORPLAN_APR}% APR</span>
              </div>

              <div className="p-3 rounded-lg bg-bg-surface border border-border">
                <span className="text-xs text-text-secondary block">Projected Days Saved on Lot</span>
                <span className="text-sm font-bold text-accent mt-0.5 block">
                  ~{calculations.projectedDaysSaved} Days Faster
                </span>
                <span className="text-xs text-text-secondary">Accelerated customer purchase</span>
              </div>

              <div className="p-3 rounded-lg bg-bg-surface border border-border">
                <span className="text-xs text-text-secondary block">Carrying Costs Saved</span>
                <span className="text-sm font-bold text-status-success mt-0.5 block">
                  +{formatCurrency(calculations.projectedHoldingCostSaved)}
                </span>
                <span className="text-xs text-status-success font-medium">Interest avoided by quick sale</span>
              </div>
            </div>

            {/* Strategic Summary Box */}
            <div className="p-3 rounded-lg bg-bg-surface border border-border flex items-center justify-between text-xs">
              <span className="text-text-secondary font-medium">
                Strategic Net Dealer Outcome:
              </span>
              <span className={`font-bold ${
                calculations.netTradeoffDifference >= 0 ? 'text-status-success' : 'text-text-primary'
              }`}>
                Sacrificing {formatCurrency(calculations.priceDifference)} gross margin saves {formatCurrency(calculations.projectedHoldingCostSaved)} in holding debt.
              </span>
            </div>
          </div>

          {/* GUARDRAIL ADVISORY */}
          <div className="p-4 rounded-lg border border-border bg-bg-surface-alt flex items-start gap-3 text-xs">
            {calculations.isBelowCost ? (
              <ShieldAlert className="w-5 h-5 text-status-danger shrink-0 mt-0.5" />
            ) : calculations.revisedMarginPct < 10 ? (
              <AlertTriangle className="w-5 h-5 text-status-warning shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-status-success shrink-0 mt-0.5" />
            )}
            <div>
              <strong className="block font-bold text-sm text-text-primary">
                Executive Status: {calculations.dealStatus.badge}
              </strong>
              <p className="mt-0.5 text-xs text-text-secondary leading-normal">
                {calculations.dealStatus.description}
              </p>
            </div>
          </div>

        </div>

        {/* ===================== MODAL FOOTER & ACTIONS ===================== */}
        <div className="px-5 py-3 border-t border-border bg-bg-surface-alt flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            {/* Deep link to Full Deal Simulator */}
            {onOpenFullDealSimulator && activeVehicle && (
              <button
                type="button"
                onClick={() => {
                  const vId = Number(activeVehicle.vehicle_id || activeVehicle.id);
                  onOpenFullDealSimulator(vId);
                }}
                className="btn-neutral text-xs h-9 px-3 flex items-center gap-1.5"
                title="Model with customer financing loan & bank commission"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Full Deal Simulator</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-neutral text-xs h-9 px-4"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApplyPriceToInventory}
              disabled={isSaving || calculations.isBelowCost}
              className="btn-primary text-xs h-9 px-4 flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Applying to Showroom...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Apply New Price to Inventory</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
