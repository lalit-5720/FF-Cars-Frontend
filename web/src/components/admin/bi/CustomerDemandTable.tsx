'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  X,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
} from 'lucide-react';

interface CustomerDemandTableProps {
  branchId?: string;
  startDate?: string;
  endDate?: string;
}

export function CustomerDemandTable({ branchId, startDate, endDate }: CustomerDemandTableProps) {
  const router = useRouter();
  const [demandData, setDemandData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fuelFilter, setFuelFilter] = useState('ALL');
  const [transmissionFilter, setTransmissionFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'demandScore' | 'customers' | 'stock' | 'enquiries'>('demandScore');
  const [selectedModelForCustomers, setSelectedModelForCustomers] = useState<any | null>(null);
  const [selectedModelForViewers, setSelectedModelForViewers] = useState<any | null>(null);

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
              <span className="text-text-secondary block text-[10px] font-semibold">Petrol</span>
              <strong className="text-slate-900 text-sm font-mono font-bold">{fuels.Petrol ?? 0} units</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-text-secondary block text-[10px] font-semibold">Diesel</span>
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
              <span className="text-text-secondary block text-[10px] font-semibold">Automatic</span>
              <strong className="text-slate-900 text-sm font-mono font-bold">{transmissions.Automatic ?? 0} units</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-text-secondary block text-[10px] font-semibold">Manual</span>
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
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
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
                  <td colSpan={9} className="py-16 text-center text-text-secondary">
                    <Loader2 size={24} className="animate-spin mx-auto text-blue-600 mb-2" />
                    <span className="font-medium">Aggregating real showroom customer demand signals...</span>
                  </td>
                </tr>
              ) : filteredModels.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-text-secondary font-medium">
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
                          <span className="text-[10px] font-mono text-text-secondary">#{idx + 1}</span>
                          <span>{item.make} {item.model}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-text-secondary font-medium">
                          {item.samplePrice > 0 && (
                            <span>Avg ₹{(item.samplePrice / 100000).toFixed(1)}L</span>
                          )}
                          {item.fuelTypes.length > 0 && <span>&bull; {item.fuelTypes.join(', ')}</span>}
                        </div>
                      </td>

                      {/* Distinct Customers */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedModelForCustomers(item)}
                          className="inline-flex items-center gap-1.5 font-bold font-mono text-blue-700 hover:text-blue-900 px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 group"
                          title="Click to view interested customer details & contact"
                        >
                          <Users size={12} className="text-blue-600 group-hover:scale-110 transition-transform" />
                          <span>{item.distinctInterestedCustomers}</span>
                          <span className="text-[10px] text-blue-600 font-sans font-semibold underline decoration-blue-300 ml-0.5">
                            View
                          </span>
                        </button>
                      </td>

                      {/* Views */}
                      <td className="py-3.5 px-3 text-center">
                        {item.views > 0 ? (
                          <button
                            type="button"
                            onClick={() => setSelectedModelForViewers(item)}
                            className="inline-flex items-center gap-1 font-mono font-semibold text-slate-700 hover:text-blue-700 px-2 py-0.5 rounded-full hover:bg-blue-50 border border-transparent hover:border-blue-200 transition cursor-pointer"
                            title="See who viewed this car's detail page"
                          >
                            <Eye size={12} className="text-text-secondary" />
                            <span>{item.views}</span>
                          </button>
                        ) : (
                          <span className="font-mono text-slate-400 font-semibold">0</span>
                        )}
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

      {/* INTERESTED CUSTOMERS DRILLDOWN MODAL */}
      {selectedModelForCustomers && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                  <Users size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      Interested Customers: {selectedModelForCustomers.make} {selectedModelForCustomers.model}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      selectedModelForCustomers.demandIndicator === 'HIGH_DEMAND'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : selectedModelForCustomers.demandIndicator === 'MODERATE_DEMAND'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {selectedModelForCustomers.demandIndicator.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {selectedModelForCustomers.distinctInterestedCustomers} distinct customer(s) evaluated this vehicle ({selectedModelForCustomers.enquiries} enquiries • {selectedModelForCustomers.testDrives} test drives • {selectedModelForCustomers.wishlists} wishlists)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedModelForCustomers(null)}
                className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-text-secondary hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body: Customer List */}
            <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
              {(!selectedModelForCustomers.interestedCustomers || selectedModelForCustomers.interestedCustomers.length === 0) ? (
                <div className="p-8 text-center text-text-secondary space-y-2">
                  <Users size={32} className="mx-auto text-text-primary" />
                  <p className="text-xs font-medium text-slate-600">
                    Demand telemetry for this model is currently recorded from anonymous online visitor browsing &amp; view interactions.
                  </p>
                  <p className="text-[11px] text-text-secondary">
                    Once a visitor fills an enquiry form or schedules a test drive, their profile, phone number, and conversation notes will appear here immediately.
                  </p>
                </div>
              ) : (
                selectedModelForCustomers.interestedCustomers.map((cust: any, cIdx: number) => {
                  const initials = (cust.name || 'C')
                    .split(' ')
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  const isLead = cust.type === 'Lead Inquiry';
                  const isTestDrive = cust.type === 'Scheduled Test Drive';

                  return (
                    <div
                      key={cust.id || cIdx}
                      className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-blue-200 transition-all shadow-2xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 text-sm">
                                {cust.name}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isLead
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : isTestDrive
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}>
                                {cust.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5">
                              {cust.city && (
                                <span className="flex items-center gap-1">
                                  <MapPin size={11} className="text-text-secondary" />
                                  {cust.city}
                                </span>
                              )}
                              {cust.date && (
                                <span className="text-[11px] text-text-secondary">
                                  • {new Date(cust.date).toLocaleDateString()}
                                </span>
                              )}
                              {cust.status && (
                                <span className="text-[11px] font-semibold text-slate-600">
                                  ({cust.status})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quick Contact Actions */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          {cust.phone && (
                            <a
                              href={`tel:${cust.phone}`}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 transition"
                              title="Call customer"
                            >
                              <Phone size={12} />
                              <span>{cust.phone}</span>
                            </a>
                          )}
                          {cust.email && (
                            <a
                              href={`mailto:${cust.email}`}
                              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 flex items-center justify-center transition"
                              title={`Email: ${cust.email}`}
                            >
                              <Mail size={13} />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedModelForCustomers(null);
                              router.push(`/admin/leads?search=${encodeURIComponent(cust.name)}`);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-blue-600 text-xs font-bold border border-slate-200 flex items-center gap-1 transition cursor-pointer"
                            title="Open in Leads Management"
                          >
                            <span>Leads</span>
                            <ExternalLink size={11} />
                          </button>
                        </div>
                      </div>

                      {cust.remarks && (
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200/70 text-xs text-slate-600">
                          <span className="font-bold text-slate-700 text-[10px] uppercase block mb-0.5">Customer Notes / Interest</span>
                          {cust.remarks}
                        </div>
                      )}

                      {cust.assignedTo && (
                        <div className="text-[11px] text-text-secondary font-medium flex items-center justify-between pt-1 border-t border-slate-100">
                          <span>Assigned Sales Executive: <strong>{cust.assignedTo}</strong></span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <span className="text-xs text-text-secondary font-medium">
                Tip: Follow up proactively while buyer intent is warm.
              </span>
              <button
                type="button"
                onClick={() => setSelectedModelForCustomers(null)}
                className="px-4 py-2 rounded-xl bg-bg-surface-alt hover:bg-black text-text-primary text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* VIEWED BY DRILLDOWN MODAL */}
      {selectedModelForViewers && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">

            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                  <Eye size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Viewed By: {selectedModelForViewers.make} {selectedModelForViewers.model}
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {selectedModelForViewers.views} view(s) • {(selectedModelForViewers.viewers || []).length} logged-in visitor(s) • {selectedModelForViewers.anonymousViews ?? 0} anonymous view(s)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedModelForViewers(null)}
                className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-text-secondary hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body: Viewer List */}
            <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
              {(!selectedModelForViewers.viewers || selectedModelForViewers.viewers.length === 0) ? (
                <div className="p-8 text-center text-text-secondary space-y-2">
                  <Eye size={32} className="mx-auto text-text-primary" />
                  <p className="text-xs font-medium text-slate-600">
                    All views for this model came from visitors who were not logged in.
                  </p>
                  <p className="text-[11px] text-text-secondary">
                    Visitors are identified only when they view a car while signed in to their customer account.
                  </p>
                </div>
              ) : (
                selectedModelForViewers.viewers.map((viewer: any) => {
                  const initials = (viewer.name || 'C')
                    .split(' ')
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <div
                      key={viewer.id}
                      className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-blue-200 transition-all shadow-2xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 text-sm">{viewer.name}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                {viewer.viewCount} view{viewer.viewCount === 1 ? '' : 's'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5">
                              {viewer.city && (
                                <span className="flex items-center gap-1">
                                  <MapPin size={11} className="text-text-secondary" />
                                  {viewer.city}
                                </span>
                              )}
                              {viewer.lastViewedAt && (
                                <span className="text-[11px] text-text-secondary">
                                  • Last viewed {new Date(viewer.lastViewedAt).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quick Contact Actions */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          {viewer.phone && (
                            <a
                              href={`tel:${viewer.phone}`}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 transition"
                              title="Call customer"
                            >
                              <Phone size={12} />
                              <span>{viewer.phone}</span>
                            </a>
                          )}
                          {viewer.email && (
                            <a
                              href={`mailto:${viewer.email}`}
                              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 flex items-center justify-center transition"
                              title={`Email: ${viewer.email}`}
                            >
                              <Mail size={13} />
                            </a>
                          )}
                        </div>
                      </div>

                      {viewer.vehiclesViewed?.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200/70 text-xs text-slate-600 space-y-1">
                          <span className="font-bold text-slate-700 text-[10px] uppercase block">Listings Viewed</span>
                          {viewer.vehiclesViewed.map((listing: any) => (
                            <div key={listing.vehicleId} className="flex items-center justify-between gap-2">
                              <span>{listing.label}</span>
                              <span className="font-mono text-[11px] text-text-secondary">{listing.viewCount}×</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <span className="text-xs text-text-secondary font-medium">
                Repeat views within 5 minutes are counted once.
              </span>
              <button
                type="button"
                onClick={() => setSelectedModelForViewers(null)}
                className="px-4 py-2 rounded-xl bg-bg-surface-alt hover:bg-black text-text-primary text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
