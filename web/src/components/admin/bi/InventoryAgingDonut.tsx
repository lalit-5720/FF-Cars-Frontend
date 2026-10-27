'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { api } from '../../../services/api';

interface AgingItem {
  label: string;
  count: number;
  value: number;
  valNum?: number;
  valueFormatted?: string;
  percentage?: number;
  color?: string;
}

interface InventoryAgingDonutProps {
  data?: AgingItem[];
  loading?: boolean;
}

export function InventoryAgingDonut({ data: propData, loading: propLoading }: InventoryAgingDonutProps) {
  const [agingData, setAgingData] = useState<AgingItem[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);

  const colors = ['var(--accent)', 'var(--success)', 'var(--warning)', 'var(--danger)', 'var(--text-secondary)'];

  const formatRupees = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${Math.round(val || 0).toLocaleString('en-IN')}`;
  };

  useEffect(() => {
    if (propData && propData.length > 0) {
      setAgingData(propData);
      return;
    }

    let isMounted = true;
    setInternalLoading(true);

    api.get('/bi/inventory-aging')
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setAgingData(list);
      })
      .catch((err) => {
        console.warn('Failed to load inventory aging:', err);
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
    return <div className="h-72 rounded-lg bg-bg-surface-alt animate-pulse border border-border" />;
  }

  const totalValue = agingData.reduce((sum, item) => sum + Number(item.value || 0), 0);

  const chartData = agingData.map((item, idx) => {
    const v = Number(item.value || 0);
    return {
      ...item,
      valNum: v,
      valueFormatted: formatRupees(v),
      percentage: totalValue > 0 ? Number(((v / totalValue) * 100).toFixed(1)) : 0,
      color: item.color || colors[idx % colors.length],
    };
  });

  return (
    <div className="rounded-lg bg-bg-surface border border-border p-5 flex flex-col justify-between font-sans">
      <h3 className="text-sm font-bold text-text-primary tracking-tight mb-2">
        Inventory Aging (By Value)
      </h3>

      {totalValue === 0 ? (
        <div className="py-12 text-center text-xs text-text-secondary">
          No active inventory aging data available.
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-2">
          {/* Donut Chart */}
          <div className="relative w-44 h-44 flex items-center justify-center flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12px' }}
                  formatter={(val: any, name: any, item: any) => [item.payload.valueFormatted, item.payload.label]}
                />
                <Pie
                  data={chartData}
                  dataKey="valNum"
                  nameKey="label"
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
              <span className="text-lg font-bold text-text-primary font-mono leading-none">
                {formatRupees(totalValue)}
              </span>
              <span className="text-xs font-bold text-text-secondary uppercase mt-1">Total Value</span>
            </div>
          </div>

          {/* Legend List */}
          <div className="flex-1 space-y-2 text-xs">
            {chartData.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-text-primary font-bold">{item.label}</span>
                </div>
                <span className="font-mono text-text-secondary font-bold">
                  {item.valueFormatted} <span className="text-xs text-text-secondary">({item.percentage}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
