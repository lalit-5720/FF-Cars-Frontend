'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface SalesByBranchDonutProps {
  data?: Array<{
    branchName: string;
    salesCount: number;
    percentage?: number;
  }>;
  loading?: boolean;
}

export function SalesByBranchDonut({ data, loading }: SalesByBranchDonutProps) {
  if (loading) {
    return <div className="h-72 rounded-2xl bg-[#1e293b]/60 animate-pulse border border-slate-800" />;
  }

  const defaultData = [
    { branchName: 'CarRevive HQ', salesCount: 18, percentage: 37.5, color: '#3b82f6' },
    { branchName: 'City Center', salesCount: 12, percentage: 25.0, color: '#10b981' },
    { branchName: 'North Point', salesCount: 8, percentage: 16.7, color: '#f59e0b' },
    { branchName: 'East Hub', salesCount: 6, percentage: 12.5, color: '#ec4899' },
    { branchName: 'West Drive', salesCount: 4, percentage: 8.3, color: '#8b5cf6' },
  ];

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  const chartData = data && data.length > 0
    ? data.map((item, idx) => ({
        ...item,
        color: colors[idx % colors.length],
        percentage: item.percentage ?? 20,
      }))
    : defaultData;

  const totalSales = chartData.reduce((sum, item) => sum + item.salesCount, 0);

  return (
    <div className="rounded-2xl bg-[#1e293b]/90 border border-slate-800/90 p-5 shadow-lg flex flex-col justify-between font-sans">
      <h3 className="text-sm font-extrabold text-white tracking-tight mb-2">
        Sales by Branch
      </h3>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-2">
        {/* Donut Chart with Center Text */}
        <div className="relative w-44 h-44 flex items-center justify-center flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                formatter={(val: any) => [`${val} Sales`, 'Volume']}
              />
              <Pie
                data={chartData}
                dataKey="salesCount"
                nameKey="branchName"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={72}
                paddingAngle={3}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-extrabold text-white font-mono leading-none">{totalSales}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Total Sales</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 space-y-2 text-xs">
          {chartData.map((item) => (
            <div key={item.branchName} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300 font-semibold">{item.branchName}</span>
              </div>
              <span className="font-mono text-slate-400 font-bold">
                {item.salesCount} <span className="text-[10px] text-slate-500">({item.percentage}%)</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
