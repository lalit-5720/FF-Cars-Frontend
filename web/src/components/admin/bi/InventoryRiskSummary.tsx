'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ChevronRight, Edit3, ExternalLink, X, ShieldAlert, ArrowDownRight, Tag } from 'lucide-react';
import { api } from '../../../services/api';

interface RiskVehicle {
  vehicle_id: number;
  make: string;
  model: string;
  registration_number: string;
  price: number;
  days_on_lot: number;
  branch_name?: string;
  suggested_price?: number;
  price_recommendation_reason?: string;
}

interface InventoryRiskSummaryProps {
  branchId?: string | number;
}

export function InventoryRiskSummary({ branchId }: InventoryRiskSummaryProps = {}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<RiskVehicle[]>([]);
  const [selectedRiskCategory, setSelectedRiskCategory] = useState<'HIGH' | 'MEDIUM' | 'LOW' | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const branchQuery = branchId && branchId !== 'all' ? `&branchId=${branchId}` : '';
    api.get(`/vehicles?status=Available${branchQuery}`)
      .then((res) => {
        if (!isMounted) return;
        const rawList = Array.isArray(res.data) ? res.data : (res.data.data || []);
        const now = Date.now();

        const mapped: RiskVehicle[] = rawList.map((v: any) => {
          const dateVal = v.purchase_date || v.created_at;
          const daysOnLot = dateVal 
            ? Math.max(0, Math.floor((now - new Date(dateVal).getTime()) / (1000 * 60 * 60 * 24)))
            : 0;
          const currentPrice = Number(v.price || 0);

          let discountPercent = 4;
          let reason = 'Stock turn optimization — suggested 4% discount to increase inquiries';
          if (daysOnLot > 120) {
            discountPercent = 12;
            reason = 'Critical aging (>120 days on lot) — suggested 12% discount to accelerate sale';
          } else if (daysOnLot > 60) {
            discountPercent = 8;
            reason = 'High aging (61–120 days on lot) — suggested 8% discount to attract buyers';
          }

          const suggestedPrice = Math.round(currentPrice * (1 - discountPercent / 100));

          return {
            vehicle_id: v.vehicle_id,
            make: v.make || 'Vehicle',
            model: v.model || '',
            registration_number: v.registration_number || `ID-${v.vehicle_id}`,
            price: currentPrice,
            days_on_lot: daysOnLot,
            branch_name: v.branches?.branch_name || 'Main Dealership',
            suggested_price: suggestedPrice,
            price_recommendation_reason: reason,
          };
        });

        setVehicles(mapped);
      })
      .catch((err) => {
        console.warn('Failed to load inventory for risk summary:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [branchId]);

  const highRiskList = useMemo(() => vehicles.filter((v) => v.days_on_lot > 120), [vehicles]);
  const mediumRiskList = useMemo(() => vehicles.filter((v) => v.days_on_lot > 60 && v.days_on_lot <= 120), [vehicles]);
  const lowRiskList = useMemo(() => vehicles.filter((v) => v.days_on_lot <= 60), [vehicles]);

  const totalVehiclesCount = vehicles.length || 1;

  const sumValue = (list: RiskVehicle[]) => list.reduce((sum, v) => sum + v.price, 0);

  const highRiskValue = useMemo(() => sumValue(highRiskList), [highRiskList]);
  const mediumRiskValue = useMemo(() => sumValue(mediumRiskList), [mediumRiskList]);
  const lowRiskValue = useMemo(() => sumValue(lowRiskList), [lowRiskList]);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${Math.round(val || 0).toLocaleString('en-IN')}`;
  };

  const handleEditVehiclePrice = (v: RiskVehicle) => {
    const query = new URLSearchParams({
      search: v.registration_number || v.model,
      vehicleId: String(v.vehicle_id),
      suggestedPrice: String(v.suggested_price || v.price),
    }).toString();
    router.push(`/admin/inventory?${query}`);
  };

  const activeRosterList = selectedRiskCategory === 'HIGH'
    ? highRiskList
    : selectedRiskCategory === 'MEDIUM'
    ? mediumRiskList
    : lowRiskList;

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between font-sans text-slate-800">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Inventory Risk Summary</span>
          </h3>
          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
            {highRiskList.length} High-Risk
          </span>
        </div>

        {loading ? (
          <div className="space-y-4 py-2">
            <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
            <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
            <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* High Risk (120+ Days) */}
            <div
              onClick={() => setSelectedRiskCategory('HIGH')}
              className="space-y-1.5 cursor-pointer group p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-700 flex items-center gap-1">
                  High Risk (120+ Days)
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
                <span className="font-mono text-text-secondary font-bold">
                  {highRiskList.length} Vehicles{' '}
                  <strong className="text-slate-900 ml-1">{formatCurrency(highRiskValue)}</strong>
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((highRiskList.length / totalVehiclesCount) * 100)}%` }}
                />
              </div>
            </div>

            {/* Medium Risk (61-120 Days) */}
            <div
              onClick={() => setSelectedRiskCategory('MEDIUM')}
              className="space-y-1.5 cursor-pointer group p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-700 flex items-center gap-1">
                  Medium Risk (61-120 Days)
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
                <span className="font-mono text-text-secondary font-bold">
                  {mediumRiskList.length} Vehicles{' '}
                  <strong className="text-slate-900 ml-1">{formatCurrency(mediumRiskValue)}</strong>
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((mediumRiskList.length / totalVehiclesCount) * 100)}%` }}
                />
              </div>
            </div>

            {/* Low Risk (0-60 Days) */}
            <div
              onClick={() => setSelectedRiskCategory('LOW')}
              className="space-y-1.5 cursor-pointer group p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  Low Risk (0-60 Days)
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
                <span className="font-mono text-text-secondary font-bold">
                  {lowRiskList.length} Vehicles{' '}
                  <strong className="text-slate-900 ml-1">{formatCurrency(lowRiskValue)}</strong>
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((lowRiskList.length / totalVehiclesCount) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Button to Open Detailed High Risk Roster */}
      <button
        onClick={() => setSelectedRiskCategory('HIGH')}
        className="mt-6 w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs border border-rose-200 transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
      >
        <ShieldAlert className="w-4 h-4 text-rose-600" />
        <span>Inspect Aging Vehicles &amp; Reprice</span>
      </button>

      {/* Full Aging Vehicles Roster Modal */}
      {selectedRiskCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 text-slate-800 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {selectedRiskCategory === 'HIGH'
                      ? 'High-Risk Aging Vehicles (>120 Days on Lot)'
                      : selectedRiskCategory === 'MEDIUM'
                      ? 'Medium-Risk Vehicles (61–120 Days on Lot)'
                      : 'Low-Risk Fresh Vehicles (0–60 Days on Lot)'}
                  </h3>
                  <p className="text-xs text-text-secondary font-medium">
                    Live database records with actual days on lot and recommended repricing
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRiskCategory(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-text-secondary hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of Cars */}
            <div className="space-y-3">
              {activeRosterList.length === 0 ? (
                <div className="py-12 text-center text-xs text-text-secondary font-medium">
                  No vehicles currently in this risk category.
                </div>
              ) : (
                activeRosterList.map((v) => (
                  <div
                    key={v.vehicle_id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-300 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-extrabold text-slate-900">
                          {v.make} {v.model}
                        </strong>
                        <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold border border-blue-200">
                          {v.registration_number}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                          {v.days_on_lot} Days on Lot
                        </span>
                      </div>

                      <div className="text-[11px] text-text-secondary">
                        Branch: <span className="text-slate-800 font-bold">{v.branch_name}</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-text-secondary">
                          Current Price:{' '}
                          <strong className="text-slate-900 font-mono font-extrabold">
                            ₹{v.price.toLocaleString('en-IN')}
                          </strong>
                        </span>
                        {v.suggested_price && v.suggested_price !== v.price && (
                          <span className="text-emerald-700 font-extrabold flex items-center gap-1 font-mono">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            Suggested: ₹{v.suggested_price.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      {v.price_recommendation_reason && (
                        <p className="text-[10px] text-amber-800 italic font-medium">
                          💡 Guidance: {v.price_recommendation_reason}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleEditVehiclePrice(v)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Reprice in Inventory</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200 mt-6">
              <button
                onClick={() => setSelectedRiskCategory(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
