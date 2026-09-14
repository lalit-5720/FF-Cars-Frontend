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
    return <div className="h-64 rounded-2xl bg-slate-800/40 animate-pulse border border-slate-700/50" />;
  }

  if (!repricingList || repricingList.length === 0) {
    return (
      <div className="rounded-2xl bg-[#1e293b]/90 border border-slate-800 p-5 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3 text-emerald-400">
          <Check size={20} />
          <span className="text-xs font-bold text-slate-200">
            Optimal Pricing Maintained! All active inventory pricing is well-tuned to market demand.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#1e293b]/90 border border-purple-500/20 p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-400">
            <Tag size={16} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
              AI Dynamic Price Optimization
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-extrabold uppercase border border-purple-500/30">
                Feature 2
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Recommended price drops for aging vehicles (&gt;30 days) to trigger instant customer test drives
            </p>
          </div>
        </div>

        <button
          onClick={fetchRepricingSuggestions}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
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
            className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-sm">
                  {item.make} {item.model}
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {item.registration_number}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                    item.aging_risk === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {item.days_on_lot} Days on Lot
                </span>
              </div>

              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-slate-400">
                  Current: <span className="line-through text-slate-500 font-semibold">{formatRupees(item.current_price)}</span>
                </span>
                <span className="text-purple-400 font-extrabold flex items-center gap-1">
                  <ArrowDownRight size={14} />
                  Suggested: {formatRupees(item.suggested_price)} (-{item.discount_percent}%)
                </span>
              </div>
              <p className="text-[10px] text-emerald-400 font-medium">{item.projected_demand_uplift}</p>
            </div>

            {/* Redirect to Inventory Intelligence Action Button */}
            <button
              onClick={() => handleNavigateToInventory(item)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer shrink-0"
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
