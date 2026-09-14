'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueTrendChartProps {
  data: Array<{ period: string; revenue: number; sales: number }>;
  loading?: boolean;
}

export function RevenueTrendChart({ data, loading }: RevenueTrendChartProps) {
  if (loading) {
    return <div className="h-72 rounded-2xl bg-secondary/50 animate-pulse border border-border" />;
  }

  const chartData = data && data.length > 0 ? data : [
    { period: 'Jan', revenue: 4200000, sales: 2 },
    { period: 'Feb', revenue: 7800000, sales: 3 },
    { period: 'Mar', revenue: 11500000, sales: 4 },
    { period: 'Apr', revenue: 9200000, sales: 3 },
    { period: 'May', revenue: 14800000, sales: 5 },
    { period: 'Jun', revenue: 18500000, sales: 6 },
  ];

  const formatLakhs = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(0)}L`;
    return `₹${value}`;
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-extrabold text-foreground tracking-tight">Revenue Trend</h3>
          <p className="text-xs text-muted-foreground">Monthly sales performance & total collections</p>
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={formatLakhs} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
              formatter={(value: any) => [formatLakhs(Number(value)), 'Revenue']}
            />
            <Area type="monotone" dataKey="revenue" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#revenueGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
