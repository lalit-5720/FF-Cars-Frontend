'use client';

import React from 'react';

interface PaymentHealthChartProps {
  data?: {
    totalContractValue?: number;
    totalCollected?: number;
    totalOutstanding?: number;
    collectionPercentage?: number;
  } | null;
  loading?: boolean;
}

export function PaymentHealthChart({ data, loading }: PaymentHealthChartProps) {
  if (loading) {
    return <div className="h-72 rounded-2xl bg-secondary/50 animate-pulse border border-border" />;
  }

  const formatCurrency = (val?: number) => {
    if (!val) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString()}`;
  };

  const collected = data?.totalCollected ?? 24500000;
  const outstanding = data?.totalOutstanding ?? 2240000;
  const total = data?.totalContractValue ?? (collected + outstanding);
  const percentage = data?.collectionPercentage ?? (total > 0 ? Math.round((collected / total) * 100) : 0);

  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-extrabold text-foreground tracking-tight">Payments Health & Receivables</h3>
        <p className="text-xs text-muted-foreground">Collected revenue vs pending outstanding balances</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
        <div className="relative w-36 h-36 flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-secondary"
              strokeWidth="4"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-emerald-500 transition-all duration-700"
              strokeDasharray={`${percentage}, 100`}
              strokeWidth="4"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-extrabold text-foreground font-mono">{percentage}%</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Collected</span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block">Total Collected</span>
              <strong className="text-lg font-mono font-extrabold text-foreground">{formatCurrency(collected)}</strong>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
              Paid
            </span>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold block">Outstanding Balance</span>
              <strong className="text-lg font-mono font-extrabold text-foreground">{formatCurrency(outstanding)}</strong>
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
              Receivable
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
