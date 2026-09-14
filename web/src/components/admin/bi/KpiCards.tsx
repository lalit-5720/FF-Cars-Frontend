'use client';

import React from 'react';
import { DollarSign, ShoppingBag, Target, TrendingUp, Award } from 'lucide-react';

interface KpiCardsProps {
  data: {
    totalRevenue?: number;
    totalSales?: number;
    totalLeads?: number;
    leadConversion?: number;
    averageSellingPrice?: number;
  } | null;
  loading?: boolean;
}

export function KpiCards({ data, loading }: KpiCardsProps) {
  const formatCurrency = (val?: number) => {
    if (!val) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString()}`;
  };

  const cards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(data?.totalRevenue),
      change: '+14.2%',
      isPositive: true,
      icon: DollarSign,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Units Sold',
      value: data?.totalSales ?? 0,
      change: '+8.5%',
      isPositive: true,
      icon: ShoppingBag,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    },
    {
      title: 'Avg Deal Size',
      value: formatCurrency(data?.averageSellingPrice),
      change: '+3.1%',
      isPositive: true,
      icon: Award,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      title: 'Lead Conversion',
      value: `${data?.leadConversion ?? 0}%`,
      change: '+2.4%',
      isPositive: true,
      icon: Target,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-secondary/50 animate-pulse border border-border" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="rounded-2xl bg-card border border-border p-5 shadow-sm hover:border-slate-700 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl border ${card.color}`}>
                <Icon size={18} />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold tracking-tight text-foreground font-mono">
                {card.value}
              </span>
              <span
                className={`text-xs font-bold flex items-center gap-0.5 ${
                  card.isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                <TrendingUp size={12} />
                {card.change}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
