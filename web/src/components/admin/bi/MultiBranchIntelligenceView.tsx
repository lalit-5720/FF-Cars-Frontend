'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import {
  Building2,
  CarFront,
  Users,
  CircleDollarSign,
  ArrowRight,
  ArrowLeftRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Sparkles,
  Calendar,
} from 'lucide-react';

interface MultiBranchIntelligenceViewProps {
  onSelectBranch?: (branchId: string) => void;
}

export function MultiBranchIntelligenceView({ onSelectBranch }: MultiBranchIntelligenceViewProps) {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBranchIntelligence = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bi/branches');
      setBranches(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn('Failed to load multi-branch intelligence:', err);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranchIntelligence();
  }, []);

  const totalAvailableStock = branches.reduce((sum, b) => sum + (b.availableStockCount ?? 0), 0);
  const totalStockValue = branches.reduce((sum, b) => sum + (b.availableStockValue ?? 0), 0);
  const totalInterest = branches.reduce((sum, b) => sum + (b.customerInterest ?? 0), 0);
  const totalSales = branches.reduce((sum, b) => sum + (b.confirmedSalesCount ?? 0), 0);
  const totalRevenue = branches.reduce((sum, b) => sum + (b.totalRevenue ?? 0), 0);

  // Collect unique transfer opportunities across all branches
  const transferOpportunities: any[] = [];
  branches.forEach((b) => {
    if (Array.isArray(b.transferOpportunities)) {
      b.transferOpportunities.forEach((opp: any) => {
        // Only consider if target branch has deficit (gap > 0)
        const targetBranchData = branches.find((item) => item.branchId === opp.targetBranchId);
        if (targetBranchData && targetBranchData.demandToStockGap > 0) {
          transferOpportunities.push(opp);
        }
      });
    }
  });

  return (
    <div className="space-y-5 font-sans text-slate-800">
      {/* Network Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-semibold block">Active Showrooms</span>
          <strong className="text-xl font-bold font-mono text-slate-900 mt-1 block">
            {branches.length} Branches
          </strong>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-semibold block">Available Stock (Dealership)</span>
          <strong className="text-xl font-bold font-mono text-emerald-600 mt-1 block">
            {totalAvailableStock} Units
          </strong>
          <span className="text-[10px] text-slate-400">Excludes reserved &amp; sold</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-semibold block">Active Inventory Value</span>
          <strong className="text-xl font-bold font-mono text-slate-900 mt-1 block">
            ₹{(totalStockValue / 10000000).toFixed(2)} Cr
          </strong>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-semibold block">Network Customer Interest</span>
          <strong className="text-xl font-bold font-mono text-blue-600 mt-1 block">
            {totalInterest} Enquiries
          </strong>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-semibold block">Total Revenue Realized</span>
          <strong className="text-xl font-bold font-mono text-purple-600 mt-1 block">
            ₹{(totalRevenue / 100000).toFixed(1)} L
          </strong>
          <span className="text-[10px] text-slate-400">{totalSales} closed sales</span>
        </div>
      </div>

      {/* Branch Comparison Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-blue-600" />
            <h3 className="font-extrabold text-sm text-slate-900">Branch Comparison Matrix</h3>
          </div>
          <button
            onClick={fetchBranchIntelligence}
            disabled={loading}
            className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={12} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Showroom Branch</th>
                <th className="py-3 px-4 text-center">Available Stock</th>
                <th className="py-3 px-4 text-center">Reserved / Sold</th>
                <th className="py-3 px-4 text-center">Stock Capital</th>
                <th className="py-3 px-4 text-center">Enquiries</th>
                <th className="py-3 px-4 text-center">Test Drives</th>
                <th className="py-3 px-4 text-center">Closed Sales</th>
                <th className="py-3 px-4 text-center">Realized Revenue</th>
                <th className="py-3 px-4 text-center">Demand-to-Stock Gap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto text-blue-600 mb-1" />
                    <span>Comparing branch inventory and demand metrics...</span>
                  </td>
                </tr>
              ) : branches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No branches configured.
                  </td>
                </tr>
              ) : (
                branches.map((b) => {
                  const hasDeficit = b.demandToStockGap > 0;
                  const hasSurplus = b.demandToStockGap < 0;

                  return (
                    <tr key={b.branchId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                          <span>{b.branchName}</span>
                          {onSelectBranch && (
                            <button
                              onClick={() => onSelectBranch(String(b.branchId))}
                              className="text-[10px] text-blue-600 hover:underline cursor-pointer font-bold"
                            >
                              (Filter)
                            </button>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">{b.city}, {b.state}</span>
                      </td>

                      {/* Available Stock */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600">
                        {b.availableStockCount}
                      </td>

                      {/* Reserved / Sold */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                        {b.reservedStockCount} res / {b.soldStockCount} sold
                      </td>

                      {/* Available Stock Value */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-700 font-semibold">
                        ₹{(b.availableStockValue / 100000).toFixed(1)} L
                      </td>

                      {/* Enquiries */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-purple-700">
                        {b.enquiriesCount}
                      </td>

                      {/* Test Drives */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-700">
                        {b.testDrivesCount}
                      </td>

                      {/* Closed Sales */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                        {b.confirmedSalesCount}
                      </td>

                      {/* Realized Revenue */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600">
                        ₹{(b.totalRevenue / 100000).toFixed(1)} L
                      </td>

                      {/* Demand to Stock Gap */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-mono inline-flex items-center gap-1 ${
                            hasDeficit
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : hasSurplus
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {hasDeficit && `+${b.demandToStockGap} Deficit`}
                          {hasSurplus && `${b.demandToStockGap} Surplus`}
                          {!hasDeficit && !hasSurplus && 'Balanced'}
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

      {/* Inter-Branch Vehicle Transfer Opportunities */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <ArrowLeftRight size={16} />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Inter-Branch Vehicle Transfer Opportunities</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Matches show surplus available inventory in one branch against unmet buyer demand in another branch.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
            {transferOpportunities.length} Match(es) Found
          </span>
        </div>

        {transferOpportunities.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-medium">
            No active cross-branch stock mismatches detected. Showroom allocations are currently aligned with regional demand.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {transferOpportunities.slice(0, 6).map((opp, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 hover:border-blue-300 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                    <CarFront size={13} className="text-purple-600" />
                    {opp.make} {opp.model}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500 font-bold">
                    {opp.registrationNumber || `#${opp.vehicleId}`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-white border border-slate-200">
                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 block font-semibold">Surplus Branch:</span>
                    <strong className="text-slate-800 text-[11px]">{opp.sourceBranchName}</strong>
                    <span className="text-[9px] text-amber-700 block font-mono font-bold">{opp.daysInStock} days on lot</span>
                  </div>

                  <ArrowRight size={14} className="text-blue-600 shrink-0" />

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold">Unmet Demand Branch:</span>
                    <strong className="text-emerald-700 text-[11px]">{opp.targetBranchName}</strong>
                    <span className="text-[9px] text-slate-500 block font-medium">Active Inquiries</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 font-medium">
                  <span>Price: ₹{(opp.price / 100000).toFixed(1)}L</span>
                  <span className="text-blue-600 text-[10px] font-bold">Available for reallocation</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
