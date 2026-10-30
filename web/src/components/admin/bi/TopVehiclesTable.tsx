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
    <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between font-sans text-slate-800">
      {/* Header with Minimize Toggle */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <CarFront size={15} />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>Top Performing Models</span>
              </h3>
              <span className="text-[10px] text-text-secondary font-semibold block -mt-0.5">
                Aggregated by Model Line
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-extrabold border border-emerald-200">
              Live Sales
            </span>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded-md bg-slate-50 hover:bg-slate-100 text-text-secondary hover:text-slate-800 transition-colors cursor-pointer border border-slate-200"
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
            className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center gap-2 truncate">
              <Award size={14} className="text-amber-500 shrink-0" />
              <span className="text-xs font-bold text-slate-800 truncate">
                #1 {selectedVehicle?.vehicle || 'Loading...'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono font-bold text-emerald-600">
                {selectedVehicle ? `${selectedVehicle.sales} sold • ${formatCurrency(selectedVehicle.revenue)}` : ''}
              </span>
              <ChevronDown size={13} className="text-text-secondary" />
            </div>
          </div>
        ) : loading ? (
          <div className="space-y-2 py-3">
            <div className="h-9 rounded-xl bg-slate-100 animate-pulse" />
            <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
          </div>
        ) : vehicles.length === 0 ? (
          <div className="py-6 text-center text-xs text-text-secondary font-medium">
            No completed vehicle sales recorded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {/* View Mode Switcher: Dropdown Details vs Compact List */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px]">
                <button
                  onClick={() => setViewMode('dropdown')}
                  className={`px-2 py-1 rounded font-bold transition-all cursor-pointer ${
                    viewMode === 'dropdown'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Dropdown Inspector
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`px-2 py-1 rounded font-bold transition-all cursor-pointer ${
                    viewMode === 'compact'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Compact List ({vehicles.length})
                </button>
              </div>
              <span className="text-[10px] text-text-secondary font-mono font-bold">
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
                    className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                  >
                    {vehicles.map((v, i) => (
                      <option key={v.vehicle || i} value={i} className="bg-white text-slate-900">
                        #{i + 1} {v.vehicle} • {v.sales} {v.sales === 1 ? 'sale' : 'sales'} ({formatCurrency(v.revenue)})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" size={13} />
                </div>

                {/* Selected Model Detailed Card */}
                {selectedVehicle && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {selectedVehicle.image_url ? (
                          <img
                            src={selectedVehicle.image_url}
                            alt={selectedVehicle.vehicle}
                            className="w-10 h-8 object-cover rounded-md border border-slate-200 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-8 bg-white rounded-md border border-slate-200 flex items-center justify-center text-text-secondary shrink-0">
                            <CarFront size={14} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-xs font-extrabold text-slate-900 block truncate">
                            {selectedVehicle.vehicle}
                          </span>
                          <span className="text-[10px] text-blue-600 font-semibold block">
                            {selectedVehicle.make || 'Certified Pre-Owned'} Lineup
                          </span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold shrink-0 border ${
                        selectedIndex === 0
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : selectedIndex === 1
                          ? 'bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        #{selectedIndex + 1} Rank
                      </span>
                    </div>

                    {/* 3 Metrics Strip */}
                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-200 text-[10px]">
                      <div className="bg-white rounded-lg p-1.5 text-center border border-slate-100">
                        <span className="text-text-secondary block text-[9px] font-semibold">UNITS SOLD</span>
                        <strong className="text-slate-900 font-mono text-xs font-black">
                          {selectedVehicle.sales}
                        </strong>
                      </div>
                      <div className="bg-white rounded-lg p-1.5 text-center border border-slate-100">
                        <span className="text-text-secondary block text-[9px] font-semibold">TOTAL REVENUE</span>
                        <strong className="text-emerald-600 font-mono text-xs font-black">
                          {formatCurrency(selectedVehicle.revenue)}
                        </strong>
                      </div>
                      <div className="bg-white rounded-lg p-1.5 text-center border border-slate-100">
                        <span className="text-text-secondary block text-[9px] font-semibold">AVG PRICE</span>
                        <strong className="text-blue-600 font-mono text-xs font-black">
                          {formatCurrency(avgPrice)}
                        </strong>
                      </div>
                    </div>

                    {/* Revenue Contribution Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[9px] text-text-secondary font-medium">
                        <span>Revenue Contribution</span>
                        <strong className="text-slate-800 font-mono font-bold">{revenueShare}% of top sales</strong>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all"
                          style={{ width: `${revenueShare}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* MODE 2: Clean Compact List */
              <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 max-h-52 overflow-y-auto">
                {vehicles.map((v, idx) => (
                  <div
                    key={v.vehicle || idx}
                    onClick={() => {
                      setSelectedIndex(idx);
                      setViewMode('dropdown');
                    }}
                    className="p-2 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono text-text-secondary w-4 shrink-0 font-bold">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 block truncate text-[11px]">
                          {v.vehicle}
                        </span>
                        <span className="text-[9px] text-text-secondary block -mt-0.5">
                          {v.make || 'Pre-Owned'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-emerald-600 block text-[11px]">
                        {formatCurrency(v.revenue)}
                      </span>
                      <span className="text-[9px] font-mono text-text-secondary block -mt-0.5 font-medium">
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
        className="mt-3 w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-blue-600 font-extrabold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
      >
        <span>View All Vehicles in Inventory</span>
        <ExternalLink size={12} />
      </button>
    </div>
  );
}
