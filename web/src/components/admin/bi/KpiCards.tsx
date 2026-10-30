'use client';

import React, { useState } from 'react';
import { DollarSign, ShoppingBag, Target, TrendingUp, Award } from 'lucide-react';
import { RevenueBreakdownModal } from './RevenueBreakdownModal';

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
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);

  const formatCurrency = (val?: number) => {
    if (!val) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const cards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(data?.totalRevenue),
      change: '+14.2%',
      isPositive: true,
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Units Sold',
      value: data?.totalSales ?? 0,
      change: '+8.5%',
      isPositive: true,
      icon: ShoppingBag,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      title: 'Avg Deal Size',
      value: formatCurrency(data?.averageSellingPrice),
      change: '+3.1%',
      isPositive: true,
      icon: Award,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
    {
      title: 'Lead Conversion',
      value: `${data?.leadConversion ?? 0}%`,
      change: '+2.4%',
      isPositive: true,
      icon: Target,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 font-sans">
        {cards.map((card) => {
          const Icon = card.icon;
          const isRevenue = card.title === 'Total Revenue';

          return (
            <div
              key={card.title}
              onClick={() => {
                if (isRevenue) setIsBreakdownOpen(true);
              }}
              className={`rounded-2xl bg-white border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition-all ${
                isRevenue
                  ? 'cursor-pointer hover:border-emerald-300 group'
                  : 'hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  {card.title}
                  {isRevenue && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-200">
                      Breakdown ↗
                    </span>
                  )}
                </span>
                <div className={`p-2 rounded-xl border ${card.color}`}>
                  <Icon size={16} />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black tracking-tight text-slate-900 font-mono">
                  {card.value}
                </span>
                <span
                  className={`text-xs font-bold flex items-center gap-0.5 ${
                    card.isPositive ? 'text-emerald-700' : 'text-rose-600'
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

      <RevenueBreakdownModal 
        isOpen={isBreakdownOpen} 
        onClose={() => setIsBreakdownOpen(false)} 
      />
    </>
  );
}
