'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CarFront, ExternalLink, ChevronDown, ChevronUp, Award, TrendingUp, DollarSign, Layers } from 'lucide-react';
import { api } from '../../../services/api';

interface TopVehicle {
  vehicle_id?: number;
  vehicle: string;
  make?: string;
  model?: string;
  sales: number;
  revenue: number;
  avg_price?: number;
  image_url?: string;
}

interface TopVehiclesTableProps {
  branchId?: string | number;
}

export function TopVehiclesTable({ branchId }: TopVehiclesTableProps = {}) {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<TopVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'dropdown' | 'compact'>('dropdown');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const branchQuery = branchId && branchId !== 'all' ? `&branchId=${branchId}` : '';
    api.get(`/bi/top-vehicles?limit=6${branchQuery}`)
      .then((res) => {
        if (isMounted) {
          const list = Array.isArray(res.data) ? res.data : [];
          setVehicles(list);
          if (list.length > 0) setSelectedIndex(0);
        }
      })
      .catch((err) => {
        console.warn('Failed to load top vehicles:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [branchId]);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${Math.round(val || 0).toLocaleString('en-IN')}`;
  };

  const selectedVehicle = vehicles[selectedIndex] || vehicles[0];
  const totalTopRevenue = vehicles.reduce((sum, v) => sum + (v.revenue || 0), 0) || 1;
  const revenueShare = selectedVehicle ? Math.round(((selectedVehicle.revenue || 0) / totalTopRevenue) * 100) : 0;
  const avgPrice = selectedVehicle?.avg_price || (selectedVehicle?.sales > 0 ? Math.round(selectedVehicle.revenue / selectedVehicle.sales) : 0);

  return (
    <div className="rounded-2xl bg-[#1e293b]/90 border border-slate-800/90 p-4 shadow-lg flex flex-col justify-between font-sans transition-all">
      {/* Header with Minimize Toggle */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <CarFront size={15} />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-white tracking-tight flex items-center gap-1.5">
                <span>Top Performing Models</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold block -mt-0.5">
                Aggregated by Model Line
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-extrabold border border-emerald-500/20">
              Live Sales
            </span>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700/60"
              title={isMinimized ? 'Expand details' : 'Minimize widget'}
            >
              {isMinimized ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>
        </div>

        {/* Minimized 1-line View */}
        {isMinimized ? (
          <div
            onClick={() => setIsMinimized(false)}
            className="rounded-xl bg-slate-900/80 border border-slate-800 p-2.5 flex items-center justify-between cursor-pointer hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center gap-2 truncate">
              <Award size={14} className="text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-slate-200 truncate">
                #1 {selectedVehicle?.vehicle || 'Loading...'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono font-bold text-emerald-400">
                {selectedVehicle ? `${selectedVehicle.sales} sold • ${formatCurrency(selectedVehicle.revenue)}` : ''}
              </span>
              <ChevronDown size={13} className="text-slate-400" />
            </div>
          </div>
        ) : loading ? (
          <div className="space-y-2 py-3">
            <div className="h-9 rounded-xl bg-slate-800/60 animate-pulse" />
            <div className="h-24 rounded-xl bg-slate-800/40 animate-pulse" />
          </div>
        ) : vehicles.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No completed vehicle sales recorded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {/* View Mode Switcher: Dropdown Details vs Compact List */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                <button
                  onClick={() => setViewMode('dropdown')}
                  className={`px-2 py-1 rounded font-bold transition-all cursor-pointer ${
                    viewMode === 'dropdown'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dropdown Inspector
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`px-2 py-1 rounded font-bold transition-all cursor-pointer ${
                    viewMode === 'compact'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Compact List ({vehicles.length})
                </button>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {vehicles.length} top models
              </span>
            </div>

            {/* MODE 1: Interactive Dropdown Detail View */}
            {viewMode === 'dropdown' ? (
              <div className="space-y-2.5">
                {/* Vehicle Model Selector Dropdown */}
                <div className="relative">
                  <select
                    value={selectedIndex}
                    onChange={(e) => setSelectedIndex(Number(e.target.value))}
                    className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {vehicles.map((v, i) => (
                      <option key={v.vehicle || i} value={i} className="bg-slate-900 text-white">
                        #{i + 1} {v.vehicle} • {v.sales} {v.sales === 1 ? 'sale' : 'sales'} ({formatCurrency(v.revenue)})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
                </div>

                {/* Selected Model Detailed Card */}
                {selectedVehicle && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {selectedVehicle.image_url ? (
                          <img
                            src={selectedVehicle.image_url}
                            alt={selectedVehicle.vehicle}
                            className="w-10 h-8 object-cover rounded-md border border-slate-700 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-8 bg-slate-800 rounded-md border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                            <CarFront size={14} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-xs font-extrabold text-white block truncate">
                            {selectedVehicle.vehicle}
                          </span>
                          <span className="text-[10px] text-sky-400 font-semibold block">
                            {selectedVehicle.make || 'Certified Pre-Owned'} Lineup
                          </span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold shrink-0 border ${
                        selectedIndex === 0
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : selectedIndex === 1
                          ? 'bg-slate-300/20 text-slate-200 border-slate-400/30'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      }`}>
                        #{selectedIndex + 1} Rank
                      </span>
                    </div>

                    {/* 3 Metrics Strip */}
                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800/80 text-[10px]">
                      <div className="bg-slate-900 rounded-lg p-1.5 text-center">
                        <span className="text-slate-400 block text-[9px]">UNITS SOLD</span>
                        <strong className="text-white font-mono text-xs font-black">
                          {selectedVehicle.sales}
                        </strong>
                      </div>
                      <div className="bg-slate-900 rounded-lg p-1.5 text-center">
                        <span className="text-slate-400 block text-[9px]">TOTAL REVENUE</span>
                        <strong className="text-emerald-400 font-mono text-xs font-black">
                          {formatCurrency(selectedVehicle.revenue)}
                        </strong>
                      </div>
                      <div className="bg-slate-900 rounded-lg p-1.5 text-center">
                        <span className="text-slate-400 block text-[9px]">AVG PRICE</span>
                        <strong className="text-sky-300 font-mono text-xs font-black">
                          {formatCurrency(avgPrice)}
                        </strong>
                      </div>
                    </div>

                    {/* Revenue Contribution Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[9px] text-slate-400">
                        <span>Revenue Contribution</span>
                        <strong className="text-slate-200 font-mono">{revenueShare}% of top sales</strong>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all"
                          style={{ width: `${revenueShare}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* MODE 2: Clean Compact List (NO Registration Numbers) */
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 divide-y divide-slate-800/60 max-h-52 overflow-y-auto">
                {vehicles.map((v, idx) => (
                  <div
                    key={v.vehicle || idx}
                    onClick={() => {
                      setSelectedIndex(idx);
                      setViewMode('dropdown');
                    }}
                    className="p-2 flex items-center justify-between hover:bg-slate-800/40 transition-colors cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono text-slate-400 w-4 shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-200 block truncate text-[11px]">
                          {v.vehicle}
                        </span>
                        <span className="text-[9px] text-slate-400 block -mt-0.5">
                          {v.make || 'Pre-Owned'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-emerald-400 block text-[11px]">
                        {formatCurrency(v.revenue)}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 block -mt-0.5">
                        {v.sales} {v.sales === 1 ? 'unit' : 'units'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Link */}
      <button
        onClick={() => router.push('/admin/inventory')}
        className="mt-3 w-full py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-sky-400 font-bold text-xs border border-slate-700/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <span>View All Vehicles in Inventory</span>
        <ExternalLink size={12} />
      </button>
    </div>
  );
}
