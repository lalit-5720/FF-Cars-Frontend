'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { api } from '../../../services/api';

interface BranchSaleItem {
  branchName: string;
  salesCount: number;
  percentage?: number;
}

interface SalesByBranchDonutProps {
  data?: BranchSaleItem[];
  loading?: boolean;
}

export function SalesByBranchDonut({ data: propData, loading: propLoading }: SalesByBranchDonutProps) {
  const [branchesData, setBranchesData] = useState<BranchSaleItem[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);

  useEffect(() => {
    if (propData && propData.length > 0) {
      setBranchesData(propData);
      return;
    }

    let isMounted = true;
    setInternalLoading(true);

    api.get('/bi/branches')
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res.data) ? res.data : [];
        const mapped: BranchSaleItem[] = list.map((b: any) => ({
          branchName: b.branchName || b.branch_name || `Branch #${b.branchId}`,
          salesCount: Number(b.salesCount ?? b._count?.sales ?? 0),
        }));
        setBranchesData(mapped);
      })
      .catch((err) => {
        console.warn('Failed to load branch sales:', err);
      })
      .finally(() => {
        if (isMounted) setInternalLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [propData]);

  const loading = propLoading || internalLoading;

  if (loading) {
    return <div className="h-72 rounded-2xl bg-[#1e293b]/60 animate-pulse border border-slate-800" />;
  }

  const colors = ['#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
  const totalSales = branchesData.reduce((sum, item) => sum + item.salesCount, 0);

  const chartData = branchesData.map((item, idx) => ({
    ...item,
    color: colors[idx % colors.length],
    percentage: totalSales > 0 ? Number(((item.salesCount / totalSales) * 100).toFixed(1)) : 0,
  }));

  return (
    <div className="rounded-2xl bg-[#1e293b]/90 border border-slate-800/90 p-5 shadow-lg flex flex-col justify-between font-sans">
      <h3 className="text-sm font-extrabold text-white tracking-tight mb-2">
        Sales by Branch
      </h3>

      {branchesData.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          No branch sales recorded yet.
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-2">
          {/* Donut Chart with Center Text */}
          <div className="relative w-44 h-44 flex items-center justify-center flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                  formatter={(val: any) => [`${val} Sales`, 'Volume']}
                />
                <Pie
                  data={chartData}
                  dataKey="salesCount"
                  nameKey="branchName"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={72}
                  paddingAngle={3}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-2xl font-extrabold text-white font-mono leading-none">{totalSales}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Total Sales</span>
            </div>
          </div>

          {/* Legend List */}
          <div className="flex-1 space-y-2 text-xs">
            {chartData.map((item) => (
              <div key={item.branchName} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 font-semibold">{item.branchName}</span>
                </div>
                <span className="font-mono text-slate-400 font-bold">
                  {item.salesCount} <span className="text-[10px] text-slate-500">({item.percentage}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
