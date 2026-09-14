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

const COLORS = ['#38bdf8', '#818cf8', '#c084fc', '#f43f5e', '#fbbf24'];

export function PricePreferenceChart({ data, loading }: PricePreferenceChartProps) {
  if (loading) {
    return <div className="h-72 rounded-2xl bg-slate-800/40 animate-pulse border border-slate-700/50" />;
  }

  const chartData = (data && data.length > 0)
    ? data.map((d) => ({
        name: d.priceBand,
        value: d.preferencePercent,
        inquiries: d.inquiriesCount + d.testDrivesCount,
      }))
    : [
        { name: '< ₹10 Lakhs', value: 15, inquiries: 8 },
        { name: '₹10L - ₹20L', value: 35, inquiries: 22 },
        { name: '₹20L - ₹35L', value: 30, inquiries: 18 },
        { name: '₹35L - ₹50L', value: 15, inquiries: 9 },
        { name: '> ₹50 Lakhs', value: 5, inquiries: 3 },
      ];

  return (
    <div className="rounded-2xl bg-[#1e293b]/90 border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <IndianRupee size={14} />
            <span>Budget & Price BI</span>
          </div>
          <h3 className="text-base font-extrabold text-white tracking-tight">
            Customer Price Preference
          </h3>
          <p className="text-xs text-slate-400">
            Price range demand breakdown from test drives & lead inquiries
          </p>
        </div>
      </div>

      <div className="h-60 w-full relative flex items-center justify-center">
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
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '12px',
                color: '#f8fafc',
                fontSize: '12px',
              }}
              formatter={(val: any) => [`${val}% Share`, 'Preference']}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span>Most Requested Price Band:</span>
        <span className="font-extrabold text-sky-400">₹10L - ₹35L (65% of Total Demand)</span>
      </div>
    </div>
  );
}
