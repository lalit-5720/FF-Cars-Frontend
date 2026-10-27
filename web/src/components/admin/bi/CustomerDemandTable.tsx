'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import {
  Users,
  Eye,
  Heart,
  MessageSquare,
  CarFront,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  Search,
  Filter,
  Fuel,
  Gauge,
  CircleDollarSign,
  Loader2,
  TrendingUp,
} from 'lucide-react';

interface CustomerDemandTableProps {
  branchId?: string;
  startDate?: string;
  endDate?: string;
}

export function CustomerDemandTable({ branchId, startDate, endDate }: CustomerDemandTableProps) {
  const [demandData, setDemandData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fuelFilter, setFuelFilter] = useState('ALL');
  const [transmissionFilter, setTransmissionFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'demandScore' | 'customers' | 'stock' | 'enquiries'>('demandScore');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const params: any = {};
    if (branchId && branchId !== 'all') params.branchId = branchId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (fuelFilter !== 'ALL') params.fuelType = fuelFilter;
    if (transmissionFilter !== 'ALL') params.transmission = transmissionFilter;

    api.get('/bi/demand', { params })
      .then((res) => {
        if (isMounted) setDemandData(res.data);
      })
      .catch((err) => {
        console.warn('Failed to fetch demand intelligence:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [branchId, startDate, endDate, fuelFilter, transmissionFilter]);

  const rawModels: any[] = demandData?.rankedModels || [];

  const filteredModels = rawModels
    .filter((m) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return m.make.toLowerCase().includes(term) || m.model.toLowerCase().includes(term);
    })
    .sort((a, b) => {
      if (sortBy === 'demandScore') return b.demandScore - a.demandScore;
      if (sortBy === 'customers') return b.distinctInterestedCustomers - a.distinctInterestedCustomers;
      if (sortBy === 'stock') return b.availableStock - a.availableStock;
      if (sortBy === 'enquiries') return b.enquiries - a.enquiries;
      return 0;
    });

  const fuels = demandData?.fuelTypePreferences || {};
  const transmissions = demandData?.transmissionPreferences || {};
  const budgets: any[] = demandData?.budgetRangePreferences || [];

  return (
    <div className="space-y-5 font-sans text-slate-800">
      {/* Preferences Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Fuel Preference */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Fuel size={14} className="text-amber-600" />
            <span>Preferred Fuel Types</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block text-[10px] font-semibold">Petrol</span>
              <strong className="text-slate-900 text-sm font-mono font-bold">{fuels.Petrol ?? 0} units</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block text-[10px] font-semibold">Diesel</span>
              <strong className="text-slate-900 text-sm font-mono font-bold">{fuels.Diesel ?? 0} units</strong>
            </div>
          </div>
        </div>

        {/* Transmission Preference */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Gauge size={14} className="text-blue-600" />
            <span>Transmission Distribution</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block text-[10px] font-semibold">Automatic</span>
              <strong className="text-slate-900 text-sm font-mono font-bold">{transmissions.Automatic ?? 0} units</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block text-[10px] font-semibold">Manual</span>
              <strong className="text-slate-900 text-sm font-mono font-bold">{transmissions.Manual ?? 0} units</strong>
            </div>
          </div>
        </div>

        {/* Strong vs Soft Demand Note */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <TrendingUp size={14} className="text-emerald-600" />
            <span>Intent Level Scoring</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
            Browsing actions (<span className="text-slate-700 font-semibold">Views: 1x, Wishlists: 3x</span>) represent exploration. High purchase intent (<span className="text-emerald-700 font-bold">Enquiries: 5x, Test Drives: 8x</span>) directly guides procurement.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Make or Model (e.g. BMW, City)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl pl-9 pr-3 py-1.5 focus:outline-none focus:border-blue-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={fuelFilter}
            onChange={(e) => setFuelFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
          >
            <option value="ALL">All Fuels</option>
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
            <option value="Electric">Electric</option>
            <option value="Hybrid">Hybrid</option>
          </select>

          <select
            value={transmissionFilter}
            onChange={(e) => setTransmissionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
          >
            <option value="ALL">All Transmissions</option>
            <option value="Automatic">Automatic</option>
            <option value="Manual">Manual</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none font-bold cursor-pointer"
          >
            <option value="demandScore">Sort: Highest Demand Score</option>
            <option value="customers">Sort: Distinct Customers</option>
            <option value="enquiries">Sort: Most Enquiries</option>
            <option value="stock">Sort: Available Stock</option>
          </select>
        </div>
      </div>

      {/* Ranked Vehicle Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Vehicle Model</th>
                <th className="py-3.5 px-4 text-center">Interested Customers</th>
                <th className="py-3.5 px-3 text-center">Views</th>
                <th className="py-3.5 px-3 text-center">Wishlists</th>
                <th className="py-3.5 px-3 text-center">Enquiries</th>
                <th className="py-3.5 px-3 text-center">Test Drives</th>
                <th className="py-3.5 px-4 text-center">Available Stock</th>
                <th className="py-3.5 px-4 text-center">Demand Level</th>
                <th className="py-3.5 px-4 text-left">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto text-blue-600 mb-2" />
                    <span className="font-medium">Aggregating real showroom customer demand signals...</span>
                  </td>
                </tr>
              ) : filteredModels.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    No models matching your selected filters.
                  </td>
                </tr>
              ) : (
                filteredModels.map((item, idx) => {
                  const isHigh = item.demandIndicator === 'HIGH_DEMAND';
                  const isModerate = item.demandIndicator === 'MODERATE_DEMAND';

                  return (
                    <tr key={item.key} className="hover:bg-slate-50/80 transition-colors">
                      {/* Model & Make */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                          <span>{item.make} {item.model}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-medium">
                          {item.samplePrice > 0 && (
                            <span>Avg ₹{(item.samplePrice / 100000).toFixed(1)}L</span>
                          )}
                          {item.fuelTypes.length > 0 && <span>&bull; {item.fuelTypes.join(', ')}</span>}
                        </div>
                      </td>

                      {/* Distinct Customers */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold font-mono text-slate-800 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-xs">
                          <Users size={11} className="text-blue-600" />
                          {item.distinctInterestedCustomers}
                        </span>
                      </td>

                      {/* Views */}
                      <td className="py-3.5 px-3 text-center font-mono text-slate-600 font-semibold">
                        {item.views}
                      </td>

                      {/* Wishlists */}
                      <td className="py-3.5 px-3 text-center font-mono text-slate-600 font-semibold">
                        {item.wishlists}
                      </td>

                      {/* Enquiries */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`font-mono font-extrabold ${item.enquiries > 0 ? 'text-purple-700' : 'text-slate-400'}`}>
                          {item.enquiries}
                        </span>
                      </td>

                      {/* Test Drives */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`font-mono font-extrabold ${item.testDrives > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                          {item.testDrives}
                        </span>
                      </td>

                      {/* Available Stock */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold font-mono ${
                            item.availableStock === 0
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : item.availableStock === 1
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {item.availableStock} in stock
                        </span>
                      </td>

                      {/* Demand Level */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            isHigh
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isModerate
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {item.demandIndicator.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Recommended Action */}
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-semibold text-slate-700 block">
                          {item.recommendedAction}
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
  );
}
