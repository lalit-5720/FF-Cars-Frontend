'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface InventoryAgingChartProps {
  data: Array<{ label: string; count: number; value?: number }>;
  loading?: boolean;
}

export function InventoryAgingChart({ data, loading }: InventoryAgingChartProps) {
  if (loading) {
    return <div className="h-72 rounded-2xl bg-secondary/50 animate-pulse border border-border" />;
  }

  const chartData = data && data.length > 0 ? data : [
    { label: '0-30 days', count: 5 },
    { label: '31-60 days', count: 3 },
    { label: '61-90 days', count: 2 },
    { label: '91-120 days', count: 1 },
    { label: '120+ days', count: 0 },
  ];

  const colors = ['#34d399', '#38bdf8', '#fbbf24', '#fb923c', '#f87171'];

  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-extrabold text-foreground tracking-tight">Inventory Aging & Health</h3>
        <p className="text-xs text-muted-foreground">Days-on-lot distribution across active vehicles</p>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
              formatter={(value: any) => [`${value} Vehicles`, 'Count']}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
