'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface BranchComparisonChartProps {
  data: Array<{
    branchName: string;
    totalRevenue: number;
    totalSalesCount: number;
    availableInventoryCount?: number;
  }>;
  loading?: boolean;
}

export function BranchComparisonChart({ data, loading }: BranchComparisonChartProps) {
  if (loading) {
    return <div className="h-72 rounded-2xl bg-secondary/50 animate-pulse border border-border" />;
  }

  const chartData = data && data.length > 0 ? data : [];

  const formatLakhs = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(0)}L`;
    return `₹${value}`;
  };

  return (
    <div className="rounded-lg bg-bg-surface border border-border p-5">
      <div className="mb-4">
        <h3 className="text-base font-bold text-text-primary tracking-tight">Cross-Branch Comparison</h3>
        <p className="text-xs text-text-secondary">Revenue & unit sales breakdown by branch location</p>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis dataKey="branchName" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
            <YAxis stroke="var(--text-secondary)" fontSize={11} tickFormatter={formatLakhs} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12px' }}
              formatter={(value: any, name: any) => [
                name === 'totalRevenue' ? formatLakhs(Number(value)) : value,
                name === 'totalRevenue' ? 'Revenue' : 'Units Sold',
              ]}
            />

            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar dataKey="totalRevenue" name="Total Revenue" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="totalSalesCount" name="Units Sold" fill="var(--text-secondary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
