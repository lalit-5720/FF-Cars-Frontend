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
    currentInventory?: number;
    totalVehicles?: number;
    leadsCount?: number;
  } | null;
  trendData?: Array<{ revenue?: number; sales?: number; period?: string; [key: string]: any }> | null;
  loading?: boolean;
}

export function ExecutiveKpiGrid({ data, trendData, loading }: ExecutiveKpiGridProps) {
  const formatCurrency = (val?: number) => {
    if (!val && val !== 0) return '₹0';
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  const last6 = (trendData || []).slice(-6);
  const revenueSpark = last6.length > 0 ? last6.map((d) => ({ v: Number(d.revenue ?? 0) })) : null;
  const salesSpark = last6.length > 0 ? last6.map((d) => ({ v: Number(d.sales ?? 0) })) : null;

  // Dynamic period-over-period change calculation from real trend data
  let revenueChange: { text: string; isUp: boolean } | null = null;
  if (last6.length >= 2) {
    const prev = Number(last6[last6.length - 2].revenue ?? 0);
    const curr = Number(last6[last6.length - 1].revenue ?? 0);
    if (prev > 0) {
      const diff = ((curr - prev) / prev) * 100;
      revenueChange = {
        text: `${Math.abs(diff).toFixed(1)}% vs ${last6[last6.length - 2].period ?? 'prior month'}`,
        isUp: diff >= 0,
      };
    } else if (curr > 0) {
      revenueChange = { text: `+100% vs ${last6[last6.length - 2].period ?? 'prior month'}`, isUp: true };
    }
  }

  let salesChange: { text: string; isUp: boolean } | null = null;
  if (last6.length >= 2) {
    const prev = Number(last6[last6.length - 2].sales ?? 0);
    const curr = Number(last6[last6.length - 1].sales ?? 0);
    if (prev > 0) {
      const diff = ((curr - prev) / prev) * 100;
      salesChange = {
        text: `${Math.abs(diff).toFixed(1)}% vs ${last6[last6.length - 2].period ?? 'prior month'}`,
        isUp: diff >= 0,
      };
    } else if (curr > 0) {
      salesChange = { text: `+100% vs ${last6[last6.length - 2].period ?? 'prior month'}`, isUp: true };
    }
  }

  const cards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(data?.totalRevenue),
      change: revenueChange?.text,
      isUp: revenueChange?.isUp ?? true,
      icon: DollarSign,
      iconBg: 'bg-emerald-500/20 text-emerald-400',
      sparkColor: '#10b981',
      sparkData: revenueSpark,
    },
    {
      title: 'Total Sales',
      value: (data?.totalSales ?? 0).toLocaleString('en-IN'),
      change: salesChange?.text,
      isUp: salesChange?.isUp ?? true,
      icon: ShoppingCart,
      iconBg: 'bg-blue-500/20 text-blue-400',
      sparkColor: '#3b82f6',
      sparkData: salesSpark,
    },
    {
      title: 'Gross Profit',
      value: data?.grossProfit != null ? formatCurrency(data.grossProfit) : 'N/A',
      change: null,
      subtitle: data?.totalRevenue && data?.grossProfit ? `${((data.grossProfit / data.totalRevenue) * 100).toFixed(1)}% margin` : 'Net sales margin',
      isUp: true,
      icon: FileText,
      iconBg: 'bg-purple-500/20 text-purple-400',
      sparkColor: '#a855f7',
      sparkData: null,
    },
    {
      title: 'Inventory Value',
      value: formatCurrency(data?.inventoryValue),
      change: null,
      subtitle: data?.currentInventory != null ? `${data.currentInventory} unsold cars on lot` : 'Active lot stock',
      isUp: false,
      icon: Box,
      iconBg: 'bg-amber-500/20 text-amber-400',
      sparkColor: '#f59e0b',
      sparkData: null,
    },
    {
      title: 'Avg. Days to Sell',
      value: data?.avgDaysToSell != null ? `${data.avgDaysToSell} Days` : 'N/A',
      change: null,
      subtitle: 'Acquisition to sale',
      isUp: false,
      icon: Clock,
      iconBg: 'bg-cyan-500/20 text-cyan-400',
      sparkColor: '#06b6d4',
      sparkData: null,
    },
    {
      title: 'Lead Conversion',
      value: data?.leadConversion != null ? `${Number(data.leadConversion).toFixed(1)}%` : '0.0%',
      change: null,
      subtitle: data?.leadsCount != null ? `From ${data.leadsCount} branch leads` : 'Pipeline conversion',
      isUp: true,
      icon: Target,
      iconBg: 'bg-emerald-500/20 text-emerald-400',
      sparkColor: '#10b981',
      sparkData: null,
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
              {card.change ? (
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
              ) : (
                <div className="text-[10px] text-slate-400 font-medium mb-1 truncate">{card.subtitle || 'Current period'}</div>
              )}
              {card.sparkData && card.sparkData.length > 0 ? (
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
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
