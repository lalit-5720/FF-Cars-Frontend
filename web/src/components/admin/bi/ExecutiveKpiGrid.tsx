'use client';

import React from 'react';
import { DollarSign, ShoppingCart, FileText, Box, Clock, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface ExecutiveKpiGridProps {
  data: {
    totalRevenue?: number;
    totalSales?: number;
    grossProfit?: number;
    inventoryValue?: number;
    avgDaysToSell?: number;
    leadConversion?: number;
  } | null;
  loading?: boolean;
}

export function ExecutiveKpiGrid({ data, loading }: ExecutiveKpiGridProps) {
  const formatCurrency = (val?: number) => {
    if (!val) return '₹2,45,80,000';
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const spark1 = [{ v: 30 }, { v: 45 }, { v: 35 }, { v: 60 }, { v: 50 }, { v: 80 }];
  const spark2 = [{ v: 20 }, { v: 35 }, { v: 30 }, { v: 50 }, { v: 45 }, { v: 75 }];
  const spark3 = [{ v: 15 }, { v: 25 }, { v: 20 }, { v: 40 }, { v: 35 }, { v: 65 }];
  const spark4 = [{ v: 80 }, { v: 70 }, { v: 75 }, { v: 60 }, { v: 65 }, { v: 50 }];
  const spark5 = [{ v: 60 }, { v: 55 }, { v: 50 }, { v: 45 }, { v: 48 }, { v: 42 }];
  const spark6 = [{ v: 18 }, { v: 19 }, { v: 20 }, { v: 21 }, { v: 22 }, { v: 23.5 }];

  const cards = [
    {
      title: 'Total Revenue',
      value: data?.totalRevenue ? formatCurrency(data.totalRevenue) : '₹2,45,80,000',
      change: '18.6% vs Apr 2024',
      isUp: true,
      icon: DollarSign,
      iconBg: 'bg-emerald-500/20 text-emerald-400',
      sparkColor: '#10b981',
      sparkData: spark1,
    },
    {
      title: 'Total Sales',
      value: data?.totalSales ?? 48,
      change: '14.3% vs Apr 2024',
      isUp: true,
      icon: ShoppingCart,
      iconBg: 'bg-blue-500/20 text-blue-400',
      sparkColor: '#3b82f6',
      sparkData: spark2,
    },
    {
      title: 'Gross Profit',
      value: data?.grossProfit ? formatCurrency(data.grossProfit) : '₹38,75,000',
      change: '16.2% vs Apr 2024',
      isUp: true,
      icon: FileText,
      iconBg: 'bg-purple-500/20 text-purple-400',
      sparkColor: '#a855f7',
      sparkData: spark3,
    },
    {
      title: 'Inventory Value',
      value: data?.inventoryValue ? formatCurrency(data.inventoryValue) : '₹6,78,40,000',
      change: '4.8% vs Apr 2024',
      isUp: false,
      icon: Box,
      iconBg: 'bg-amber-500/20 text-amber-400',
      sparkColor: '#f59e0b',
      sparkData: spark4,
    },
    {
      title: 'Avg. Days to Sell',
      value: data?.avgDaysToSell ? `${data.avgDaysToSell} Days` : '42 Days',
      change: '8.7% vs Apr 2024',
      isUp: false,
      icon: Clock,
      iconBg: 'bg-cyan-500/20 text-cyan-400',
      sparkColor: '#06b6d4',
      sparkData: spark5,
    },
    {
      title: 'Lead Conversion',
      value: data?.leadConversion ? `${data.leadConversion}%` : '23.5%',
      change: '3.2% vs Apr 2024',
      isUp: true,
      icon: Target,
      iconBg: 'bg-emerald-500/20 text-emerald-400',
      sparkColor: '#10b981',
      sparkData: spark6,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-[#1e293b]/60 animate-pulse border border-slate-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6 font-sans">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="rounded-2xl bg-[#1e293b]/90 border border-slate-800/90 p-4 shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400">
                  {card.title}
                </span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${card.iconBg}`}>
                  <Icon size={16} />
                </div>
              </div>
              <strong className="text-xl font-extrabold text-white tracking-tight font-mono block">
                {card.value}
              </strong>
            </div>

            <div className="mt-3">
              <div className="flex items-center gap-1 text-[10px] font-bold mb-1">
                {card.isUp ? (
                  <span className="text-emerald-400 flex items-center gap-0.5">
                    <TrendingUp size={11} /> ↑ {card.change}
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-0.5">
                    <TrendingDown size={11} /> ↓ {card.change}
                  </span>
                )}
              </div>
              <div className="h-8 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={card.sparkData}>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke={card.sparkColor}
                      strokeWidth={2}
                      fill={card.sparkColor}
                      fillOpacity={0.15}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
