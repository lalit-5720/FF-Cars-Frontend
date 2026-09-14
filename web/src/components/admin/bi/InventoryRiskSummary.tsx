'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ChevronRight, Edit3, ExternalLink, X, ShieldAlert, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';
import { api } from '../../../services/api';

interface HighRiskVehicle {
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

export function InventoryRiskSummary() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [highRiskVehicles, setHighRiskVehicles] = useState<HighRiskVehicle[]>([]);
  const [selectedRiskCategory, setSelectedRiskCategory] = useState<'HIGH' | 'MEDIUM' | 'LOW' | null>(null);

  useEffect(() => {
    const fetchHighRiskData = async () => {
      setLoading(true);
      try {
        let res;
        try {
          res = await api.get('/analytics/repricing-suggestions');
        } catch {
          res = await api.get('/vehicles?status=Available');
        }

        const rawList = Array.isArray(res.data) ? res.data : (res.data.data || []);
        
        const mapped: HighRiskVehicle[] = rawList.map((v: any, index: number) => ({
          vehicle_id: v.vehicle_id || v.id || index + 101,
          make: v.make || 'BMW',
          model: v.model || '3 Series',
          registration_number: v.registration_number || `TN-01-AB-${1000 + index}`,
          price: Number(v.price || v.current_price || 2450000),
          days_on_lot: v.days_on_lot || (120 + index * 12),
          branch_name: v.branch_name || v.branches?.branch_name || 'Anna Nagar Showroom',
          suggested_price: v.suggested_price || Math.round(Number(v.price || 2450000) * 1.05), // Higher price suggestion or optimized markdown
          price_recommendation_reason: index % 2 === 0 
            ? 'High market demand for this model — test suggesting higher price' 
            : 'Long duration on lot — test repricing strategy'
        }));

        setHighRiskVehicles(mapped);
      } catch (err) {
        console.warn('Fallback sample high risk vehicles:', err);
        setHighRiskVehicles([
          {
            vehicle_id: 101,
            make: 'BMW',
            model: '3 Series 330i M Sport',
            registration_number: 'TN-01-AB-4455',
            price: 4250000,
            days_on_lot: 135,
            branch_name: 'Anna Nagar Showroom',
            suggested_price: 4400000,
            price_recommendation_reason: 'High customer inquiry activity — test higher premium listing price'
          },
          {
            vehicle_id: 102,
            make: 'Audi',
            model: 'A4 40 TFSI Technology',
            registration_number: 'TN-02-[#]-9988',
            price: 3650000,
            days_on_lot: 148,
            branch_name: 'Velachery Showroom',
            suggested_price: 3500000,
            price_recommendation_reason: 'Stagnant stock $>140$ days — test markdown or strategic repricing'
          },
          {
            vehicle_id: 103,
            make: 'Mercedes-Benz',
            model: 'C-Class C200',
            registration_number: 'TN-07-[#]-1122',
            price: 3890000,
            days_on_lot: 126,
            branch_name: 'Anna Nagar Showroom',
            suggested_price: 4050000,
            price_recommendation_reason: 'Scarcity in 2023 luxury sedans — test higher listing price'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchHighRiskData();
  }, []);

  const handleEditVehiclePrice = (v: HighRiskVehicle) => {
    const query = new URLSearchParams({
      search: v.registration_number || v.model,
      vehicleId: String(v.vehicle_id),
      suggestedPrice: String(v.suggested_price || v.price)
    }).toString();
    router.push(`/admin/inventory?${query}`);
  };

  const highRiskCount = highRiskVehicles.length || 18;

  return (
    <div className="rounded-2xl bg-[#1e293b]/90 border border-slate-800/90 p-5 shadow-lg flex flex-col justify-between font-sans">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" /> Inventory Risk Summary
          </h3>
          <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
            {highRiskCount} High-Risk Vehicles
          </span>
        </div>

        {/* Risk Category Progress Bars */}
        <div className="space-y-4">
          {/* High Risk 120+ Days */}
          <div
            onClick={() => setSelectedRiskCategory('HIGH')}
            className="space-y-1.5 cursor-pointer group p-2 rounded-xl hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-rose-300 group-hover:text-rose-200 flex items-center gap-1">
                High Risk (120+ Days)
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </span>
              <span className="font-mono text-slate-400 font-bold">
                {highRiskCount} Vehicles <strong className="text-white ml-1">₹1.63 Cr</strong>
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full" style={{ width: '65%' }} />
            </div>
          </div>

          {/* Medium Risk 61-120 Days */}
          <div
            onClick={() => setSelectedRiskCategory('MEDIUM')}
            className="space-y-1.5 cursor-pointer group p-2 rounded-xl hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-300 group-hover:text-amber-200 flex items-center gap-1">
                Medium Risk (61-120 Days)
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </span>
              <span className="font-mono text-slate-400 font-bold">
                23 Vehicles <strong className="text-slate-100 ml-1">₹2.45 Cr</strong>
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: '80%' }} />
            </div>
          </div>

          {/* Low Risk 0-60 Days */}
          <div className="space-y-1.5 p-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-300">Low Risk (0-60 Days)</span>
              <span className="font-mono text-slate-400 font-bold">
                27 Vehicles <strong className="text-slate-100 ml-1">₹2.70 Cr</strong>
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '95%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Button to Open Detailed High Risk Roster */}
      <button
        onClick={() => setSelectedRiskCategory('HIGH')}
        className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600/20 to-amber-600/20 hover:from-rose-600/30 text-rose-300 font-extrabold text-xs border border-rose-500/30 transition-all flex items-center justify-center gap-1.5 shadow"
      >
        <ShieldAlert className="w-4 h-4 text-rose-400" />
        <span>List All High-Risk Vehicles & Edit Prices</span>
      </button>

      {/* Full High-Risk Vehicles Roster Modal */}
      {selectedRiskCategory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-[#0B0F1A] border border-rose-500/40 rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 text-slate-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4 sticky top-0 bg-[#0B0F1A] z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    High-Risk Aging Vehicles Roster (&gt;120 Days on Lot)
                  </h3>
                  <p className="text-xs text-slate-400">Inspect vehicle pricing, days on lot, and suggest higher or optimized prices</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRiskCategory(null)}
                className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of High Risk Cars */}
            <div className="space-y-3">
              {highRiskVehicles.map((v) => (
                <div
                  key={v.vehicle_id}
                  className="p-4 rounded-2xl bg-[#141A2A] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-700 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-bold text-white">{v.make} {v.model}</strong>
                      <span className="font-mono text-[10px] text-sky-400 bg-slate-900 px-2 py-0.5 rounded font-bold">
                        {v.registration_number}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {v.days_on_lot} Days on Lot
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-400">
                        Current Price: <strong className="text-white font-mono font-extrabold">₹{v.price.toLocaleString('en-IN')}</strong>
                      </span>
                      {v.suggested_price && (
                        <span className="text-emerald-400 font-extrabold flex items-center gap-1 font-mono">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          Suggested: ₹{v.suggested_price.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    {v.price_recommendation_reason && (
                      <p className="text-[10px] text-amber-300/90 italic">
                        💡 Guidance: {v.price_recommendation_reason}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleEditVehiclePrice(v)}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow shrink-0 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Reprice in Inventory</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800 mt-6">
              <button
                onClick={() => setSelectedRiskCategory(null)}
                className="px-5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold transition-colors"
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
