'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface InventoryAgingDonutProps {
  data?: Array<{
    label: string;
    valueFormatted: string;
    percentage: number;
  }>;
  loading?: boolean;
}

export function InventoryAgingDonut({ data, loading }: InventoryAgingDonutProps) {
  if (loading) {
    return <div className="h-72 rounded-2xl bg-[#1e293b]/60 animate-pulse border border-slate-800" />;
  }

  const defaultData = [
    { label: '0 - 30 Days', valNum: 1.25, valueFormatted: '₹1.25 Cr', percentage: 18.4, color: '#3b82f6' },
    { label: '31 - 60 Days', valNum: 1.45, valueFormatted: '₹1.45 Cr', percentage: 21.4, color: '#10b981' },
    { label: '61 - 90 Days', valNum: 1.35, valueFormatted: '₹1.35 Cr', percentage: 19.9, color: '#f59e0b' },
    { label: '91 - 120 Days', valNum: 1.10, valueFormatted: '₹1.10 Cr', percentage: 16.2, color: '#ef4444' },
    { label: '120+ Days', valNum: 1.63, valueFormatted: '₹1.63 Cr', percentage: 24.1, color: '#b91c1c' },
  ];

  return (
    <div className="rounded-2xl bg-[#1e293b]/90 border border-slate-800/90 p-5 shadow-lg flex flex-col justify-between font-sans">
      <h3 className="text-sm font-extrabold text-white tracking-tight mb-2">
        Inventory Aging (By Value)
      </h3>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-2">
        {/* Donut Chart */}
        <div className="relative w-44 h-44 flex items-center justify-center flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                formatter={(val: any, name: any, item: any) => [item.payload.valueFormatted, item.payload.label]}
              />
              <Pie
                data={defaultData}
                dataKey="valNum"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={72}
                paddingAngle={3}
              >
                {defaultData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-lg font-extrabold text-white font-mono leading-none">₹6.78 Cr</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Total</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 space-y-2 text-xs">
          {defaultData.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300 font-semibold">{item.label}</span>
              </div>
              <span className="font-mono text-slate-400 font-bold">
                {item.valueFormatted} <span className="text-[10px] text-slate-500">({item.percentage}%)</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
