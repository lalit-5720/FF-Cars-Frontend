'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Filter } from 'lucide-react';
import { api } from '../../../services/api';

interface FunnelStage {
  label: string;
  count: number;
}

interface VisualSalesFunnelProps {
  branchId?: string | number;
}

export function VisualSalesFunnel({ branchId }: VisualSalesFunnelProps = {}) {
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [conversionRate, setConversionRate] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const branchQuery = branchId && branchId !== 'all' ? `?branchId=${branchId}` : '';
    api.get(`/bi/funnel${branchQuery}`)
      .then((res) => {
        if (!isMounted) return;
        const resStages = res.data?.stages || [];
        setStages(resStages);
        if (res.data?.conversionRate !== undefined) {
          setConversionRate(res.data.conversionRate);
        } else {
          const leadCount = resStages.find((s: any) => s.label.toLowerCase().includes('lead'))?.count || 0;
          const saleCount = resStages.find((s: any) => s.label.toLowerCase().includes('sale'))?.count || 0;
          setConversionRate(leadCount > 0 ? Number(((saleCount / leadCount) * 100).toFixed(1)) : 0);
        }
      })
      .catch((err) => {
        console.warn('Failed to load sales funnel:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [branchId]);

  const leads = stages.find((s) => s.label.toLowerCase().includes('lead'))?.count ?? 0;
  const testDrives = stages.find((s) => s.label.toLowerCase().includes('test'))?.count ?? 0;
  const qualified = stages.find((s) => s.label.toLowerCase().includes('qual'))?.count ?? 0;
  const sales = stages.find((s) => s.label.toLowerCase().includes('sale'))?.count ?? 0;

  const topCount = Math.max(leads, 1);
  const tdPercent = topCount > 0 ? ((testDrives / topCount) * 100).toFixed(1) : '0';
  const qualPercent = topCount > 0 ? ((qualified / topCount) * 100).toFixed(1) : '0';
  const salePercent = topCount > 0 ? ((sales / topCount) * 100).toFixed(1) : '0';

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between font-sans text-slate-800">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Lead to Sale Funnel</span>
          </h3>
          <span className="text-[10px] text-text-secondary font-bold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            Live Pipeline
          </span>
        </div>

        {loading ? (
          <div className="space-y-2 py-4">
            <div className="h-10 rounded-lg bg-slate-100 animate-pulse border border-slate-200" />
            <div className="h-10 rounded-lg bg-slate-100 animate-pulse border border-slate-200" />
            <div className="h-10 rounded-lg bg-slate-100 animate-pulse border border-slate-200" />
            <div className="h-10 rounded-lg bg-slate-100 animate-pulse border border-slate-200" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 py-1 font-sans">
            {/* Level 1: Leads */}
            <div
              className="w-full bg-blue-600 text-white text-center py-2.5 px-4 font-bold text-xs shadow-sm rounded-t-lg"
              style={{ clipPath: 'polygon(0 0, 100% 0, 88% 100%, 12% 100%)' }}
            >
              <span>Leads</span>
              <strong className="block text-sm font-mono font-black">{leads}</strong>
            </div>

            {/* Level 2: Test Drives */}
            <div
              className="w-[84%] bg-emerald-600 text-white text-center py-2.5 px-4 font-bold text-xs shadow-sm"
              style={{ clipPath: 'polygon(0 0, 100% 0, 86% 100%, 14% 100%)' }}
            >
              <span>Test Drives</span>
              <strong className="block text-sm font-mono font-black">
                {testDrives} ({tdPercent}%)
              </strong>
            </div>

            {/* Level 3: Qualified */}
            <div
              className="w-[68%] bg-amber-500 text-slate-950 text-center py-2.5 px-4 font-bold text-xs shadow-sm"
              style={{ clipPath: 'polygon(0 0, 100% 0, 84% 100%, 16% 100%)' }}
            >
              <span>Qualified</span>
              <strong className="block text-sm font-mono font-black">
                {qualified} ({qualPercent}%)
              </strong>
            </div>

            {/* Level 4: Sales */}
            <div
              className="w-[52%] bg-rose-600 text-white text-center py-2.5 px-4 font-bold text-xs shadow-sm rounded-b-lg"
            >
              <span>Sales</span>
              <strong className="block text-sm font-mono font-black">
                {sales} ({salePercent}%)
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* Footer conversion rate indicator */}
      <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs font-bold text-slate-600">
        Conversion Rate:{' '}
        <span className="font-mono font-black text-slate-900">{conversionRate}%</span>
        {conversionRate > 0 && (
          <span className="text-emerald-700 font-extrabold inline-flex items-center gap-0.5 ml-1.5 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <TrendingUp size={12} /> Live Conversion
          </span>
        )}
      </div>
    </div>
  );
}
