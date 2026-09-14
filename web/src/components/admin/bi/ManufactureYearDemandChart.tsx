'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Calendar, ShoppingBag } from 'lucide-react';

interface ManufactureYearDemandProps {
  data: Array<{
    yearRange: string;
    leadsCount: number;
    testDrivesCount: number;
    salesCount: number;
    availableStock: number;
    demandScore: number;
    recommendation: string;
    recommendationMessage: string;
  }>;
  loading?: boolean;
}

export function ManufactureYearDemandChart({ data, loading }: ManufactureYearDemandProps) {
  if (loading) {
    return <div className="h-72 rounded-2xl bg-slate-800/40 animate-pulse border border-slate-700/50" />;
  }

  const chartData = (data && data.length > 0)
    ? data.map((d) => ({
        year: d.yearRange,
        CustomerDemand: d.leadsCount + d.testDrivesCount * 2,
        SalesCount: d.salesCount,
        ActiveStock: d.availableStock,
      }))
    : [
        { year: '2023 - 2024', CustomerDemand: 18, SalesCount: 8, ActiveStock: 3 },
        { year: '2021 - 2022', CustomerDemand: 24, SalesCount: 12, ActiveStock: 5 },
        { year: '2018 - 2020', CustomerDemand: 12, SalesCount: 5, ActiveStock: 4 },
        { year: 'Before 2018', CustomerDemand: 4, SalesCount: 2, ActiveStock: 2 },
      ];

  return (
    <div className="rounded-2xl bg-[#1e293b]/90 border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Calendar size={14} />
            <span>Manufacture Year Analytics</span>
          </div>
          <h3 className="text-base font-extrabold text-white tracking-tight">
            Customer Demand vs Active Stock
          </h3>
          <p className="text-xs text-slate-400">
            Compare customer inquiry & test drive signals against current inventory by year
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
          <ShoppingBag size={13} />
          <span>Procurement Signals</span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '12px',
                color: '#f8fafc',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />
            <Bar dataKey="CustomerDemand" name="Customer Interest (Leads + Test Drives)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="SalesCount" name="Completed Sales" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ActiveStock" name="Available Stock" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>💡 High gap between Demand and Stock indicates prime cars to procure.</span>
      </div>
    </div>
  );
}
