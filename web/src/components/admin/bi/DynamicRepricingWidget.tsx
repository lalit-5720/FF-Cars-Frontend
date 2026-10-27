'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tag, TrendingDown, ArrowDownRight, Check, AlertCircle, RefreshCw, ExternalLink, Edit3 } from 'lucide-react';
import { api } from '../../../services/api';
import { showLocalToast } from '../../Toast';

interface RepricingItem {
  vehicle_id: number;
  make: string;
  model: string;
  registration_number: string;
  current_price: number;
  suggested_price: number;
  discount_amount: number;
  discount_percent: number;
  days_on_lot: number;
  aging_risk: 'CRITICAL' | 'HIGH' | 'MODERATE';
  projected_demand_uplift: string;
  branch_name: string;
}

export function DynamicRepricingWidget() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [repricingList, setRepricingList] = useState<RepricingItem[]>([]);

  const fetchRepricingSuggestions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/repricing-suggestions');
      setRepricingList(res.data);
    } catch (err) {
      console.error('Failed to load repricing suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepricingSuggestions();
  }, []);

  const handleNavigateToInventory = (item: RepricingItem) => {
    const query = new URLSearchParams({
      search: item.registration_number || item.model || '',
      vehicleId: String(item.vehicle_id),
      suggestedPrice: String(item.suggested_price)
    }).toString();
    showLocalToast(`Redirecting to Inventory Intelligence to edit price for ${item.make} ${item.model}...`);
    router.push(`/admin/inventory?${query}`);
  };

  const formatRupees = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} Lakhs`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return <div className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />;
  }

  if (!repricingList || repricingList.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3 text-emerald-600">
          <Check size={20} />
          <span className="text-xs font-bold text-slate-700">
            Optimal Pricing Maintained! All active inventory pricing is well-tuned to market demand.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-purple-200/90 p-5 shadow-2xs hover:shadow-md transition-all space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <Tag size={16} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              Aging-Based Dynamic Repricing
              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-extrabold uppercase border border-purple-200">
                Action Advisor
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Recommended price drops for aging vehicles (&gt;30 days) to trigger instant customer test drives
            </p>
          </div>
        </div>

        <button
          onClick={fetchRepricingSuggestions}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          title="Refresh Price Suggestions"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Repricing Suggestions List */}
      <div className="space-y-3">
        {repricingList.slice(0, 3).map((item) => (
          <div
            key={item.vehicle_id}
            className="rounded-xl bg-slate-50 border border-slate-200/90 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 text-sm">
                  {item.make} {item.model}
                </span>
                <span className="text-[10px] font-mono text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded font-bold">
                  {item.registration_number}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                    item.aging_risk === 'CRITICAL'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {item.days_on_lot} Days on Lot
                </span>
              </div>

              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-slate-500">
                  Current: <span className="line-through text-slate-400 font-semibold">{formatRupees(item.current_price)}</span>
                </span>
                <span className="text-purple-700 font-extrabold flex items-center gap-1">
                  <ArrowDownRight size={14} />
                  Suggested: {formatRupees(item.suggested_price)} (-{item.discount_percent}%)
                </span>
              </div>
              <p className="text-[10px] text-emerald-700 font-bold">{item.projected_demand_uplift}</p>
            </div>

            {/* Redirect to Inventory Intelligence Action Button */}
            <button
              onClick={() => handleNavigateToInventory(item)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
            >
              <Edit3 size={14} />
              <span>Edit Price in Inventory</span>
              <ExternalLink size={12} className="text-purple-200" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
