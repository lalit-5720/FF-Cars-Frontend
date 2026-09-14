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

  const chartData = data && data.length > 0 ? data : [
    { branchName: 'Anna Nagar', totalRevenue: 15400000, totalSalesCount: 4, availableInventoryCount: 12 },
    { branchName: 'Velachery', totalRevenue: 11340000, totalSalesCount: 3, availableInventoryCount: 8 },
  ];

  const formatLakhs = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(0)}L`;
    return `₹${value}`;
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-extrabold text-foreground tracking-tight">Cross-Branch Comparison</h3>
        <p className="text-xs text-muted-foreground">Revenue & unit sales breakdown by branch location</p>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey="branchName" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={formatLakhs} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
              formatter={(value: any, name: any) => [
                name === 'totalRevenue' ? formatLakhs(Number(value)) : value,
                name === 'totalRevenue' ? 'Revenue' : 'Units Sold',
              ]}
            />

            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            <Bar dataKey="totalRevenue" name="Total Revenue" fill="#38bdf8" radius={[6, 6, 0, 0]} />
            <Bar dataKey="totalSalesCount" name="Units Sold" fill="#818cf8" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
