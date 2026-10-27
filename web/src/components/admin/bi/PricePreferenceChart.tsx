'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { IndianRupee } from 'lucide-react';

interface PricePreferenceChartProps {
  data: Array<{
    priceBand: string;
    inquiriesCount: number;
    testDrivesCount: number;
    salesCount: number;
    availableStock: number;
    preferencePercent: number;
    recommendation: string;
  }>;
  loading?: boolean;
}

const COLORS = ['var(--accent)', 'var(--success)', 'var(--warning)', 'var(--danger)', 'var(--text-secondary)'];

export function PricePreferenceChart({ data, loading }: PricePreferenceChartProps) {
  if (loading) {
    return <div className="h-72 rounded-lg bg-bg-surface-alt animate-pulse border border-border" />;
  }

  const chartData = (data && data.length > 0)
    ? data.map((d) => ({
        name: d.priceBand,
        value: d.preferencePercent,
        inquiries: d.inquiriesCount + d.testDrivesCount,
      }))
    : [];

  const topBand = (data && data.length > 0)
    ? [...data].sort((a, b) => b.preferencePercent - a.preferencePercent)[0]
    : null;

  return (
    <div className="rounded-lg bg-bg-surface border border-border p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-wider mb-1">
            <IndianRupee size={14} />
            <span>Budget &amp; Price BI</span>
          </div>
          <h3 className="text-base font-bold text-text-primary tracking-tight">
            Customer Price Preference
          </h3>
          <p className="text-xs text-text-secondary">
            Price range demand breakdown from test drives &amp; lead inquiries
          </p>
        </div>
      </div>

      <div className="h-60 w-full relative flex items-center justify-center">
        {chartData.length === 0 ? (
          <div className="text-xs text-text-secondary text-center">No price preference data available.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [`${val}% Share`, 'Preference']}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: 'var(--text-secondary)' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-text-secondary font-bold">
        <span>Most Requested Price Band:</span>
        {topBand ? (
          <span className="font-bold text-accent">
            {topBand.priceBand} ({topBand.preferencePercent}% of Total Demand)
          </span>
        ) : (
          <span className="text-text-secondary">Optimal balance across all price bands</span>
        )}
      </div>
    </div>
  );
}
