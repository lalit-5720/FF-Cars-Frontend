'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';

export function VisualSalesFunnel() {
  return (
    <div className="rounded-2xl bg-[#1e293b]/90 border border-slate-800/90 p-5 shadow-lg flex flex-col justify-between font-sans">
      <div>
        <h3 className="text-sm font-extrabold text-white tracking-tight mb-4">
          Lead to Sale Funnel
        </h3>

        {/* Funnel Visual Stack */}
        <div className="flex flex-col items-center gap-1 py-1 font-sans">
          {/* Level 1: Leads */}
          <div
            className="w-full bg-[#3b82f6] text-white text-center py-2.5 px-4 font-bold text-xs shadow-md"
            style={{ clipPath: 'polygon(0 0, 100% 0, 88% 100%, 12% 100%)' }}
          >
            <span>Leads</span>
            <strong className="block text-sm font-mono font-extrabold">204</strong>
          </div>

          {/* Level 2: Test Drives */}
          <div
            className="w-[84%] bg-[#10b981] text-white text-center py-2.5 px-4 font-bold text-xs shadow-md"
            style={{ clipPath: 'polygon(0 0, 100% 0, 86% 100%, 14% 100%)' }}
          >
            <span>Test Drives</span>
            <strong className="block text-sm font-mono font-extrabold">96 (47.1%)</strong>
          </div>

          {/* Level 3: Qualified */}
          <div
            className="w-[68%] bg-[#f59e0b] text-slate-950 text-center py-2.5 px-4 font-bold text-xs shadow-md"
            style={{ clipPath: 'polygon(0 0, 100% 0, 84% 100%, 16% 100%)' }}
          >
            <span>Qualified</span>
            <strong className="block text-sm font-mono font-extrabold">64 (31.4%)</strong>
          </div>

          {/* Level 4: Sales */}
          <div
            className="w-[52%] bg-[#e11d48] text-white text-center py-2.5 px-4 font-bold text-xs shadow-md rounded-b-lg"
          >
            <span>Sales</span>
            <strong className="block text-sm font-mono font-extrabold">48 (23.5%)</strong>
          </div>
        </div>
      </div>

      {/* Footer conversion rate indicator */}
      <div className="mt-4 text-center text-xs font-bold text-slate-300">
        Conversion Rate: <span className="font-mono font-extrabold text-white">23.5%</span>{' '}
        <span className="text-emerald-400 font-extrabold inline-flex items-center gap-0.5 ml-1">
          <TrendingUp size={12} /> ↑ 3.2%
        </span>
      </div>
    </div>
  );
}
