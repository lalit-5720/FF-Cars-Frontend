'use client';

import React from 'react';

interface SalesFunnelChartProps {
  data?: {
    stages?: Array<{ label: string; count: number }>;
  } | null;
  loading?: boolean;
}

export function SalesFunnelChart({ data, loading }: SalesFunnelChartProps) {
  if (loading) {
    return <div className="h-72 rounded-2xl bg-secondary/50 animate-pulse border border-border" />;
  }

  const defaultStages = [
    { label: 'Total Inquiries / Leads', count: 42, color: 'bg-sky-500', width: 'w-full' },
    { label: 'Test Drives Scheduled', count: 28, color: 'bg-indigo-500', width: 'w-4/5' },
    { label: 'Sales Negotiated', count: 18, color: 'bg-purple-500', width: 'w-3/5' },
    { label: 'Vehicles Delivered', count: 12, color: 'bg-emerald-500', width: 'w-2/5' },
  ];

  const stages = data?.stages?.map((stage, index) => {
    const colors = ['bg-sky-500', 'bg-indigo-500', 'bg-purple-500', 'bg-emerald-500'];
    const widths = ['w-full', 'w-4/5', 'w-3/5', 'w-2/5'];
    return {
      label: stage.label,
      count: stage.count,
      color: colors[index % colors.length],
      width: widths[index % widths.length],
    };
  }) || defaultStages;

  const topCount = stages[0]?.count || 1;

  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-extrabold text-foreground tracking-tight">Dealership Conversion Funnel</h3>
        <p className="text-xs text-muted-foreground">Prospect lifecycle progression & drop-off rates</p>
      </div>

      <div className="space-y-4 py-2">
        {stages.map((stage, idx) => {
          const dropOff = idx > 0 ? Math.round(((stages[idx - 1].count - stage.count) / (stages[idx - 1].count || 1)) * 100) : 0;
          const conversionPercent = Math.round((stage.count / topCount) * 100);

          return (
            <div key={stage.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">{stage.label}</span>
                <span className="font-mono text-muted-foreground">
                  <strong className="text-foreground">{stage.count}</strong> ({conversionPercent}%)
                </span>
              </div>
              <div className="h-4 w-full bg-secondary rounded-full overflow-hidden flex">
                <div className={`h-full ${stage.color} ${stage.width} rounded-full transition-all duration-500`} />
              </div>
              {idx > 0 && dropOff > 0 && (
                <div className="text-[10px] text-rose-400/80 font-medium pl-1">
                  ↓ {dropOff}% drop-off from previous step
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
