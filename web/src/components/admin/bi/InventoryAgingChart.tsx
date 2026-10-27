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

  const chartData = data && data.length > 0 ? data : [];

  const colors = ['var(--success)', 'var(--accent)', 'var(--warning)', 'var(--danger)', 'var(--text-secondary)'];

  return (
    <div className="rounded-lg bg-bg-surface border border-border p-5">
      <div className="mb-4">
        <h3 className="text-base font-bold text-text-primary tracking-tight">Inventory Aging & Health</h3>
        <p className="text-xs text-text-secondary">Days-on-lot distribution across active vehicles</p>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis dataKey="label" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
            <YAxis stroke="var(--text-secondary)" fontSize={11} allowDecimals={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12px' }}
              formatter={(value: any) => [`${value} Vehicles`, 'Count']}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
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
