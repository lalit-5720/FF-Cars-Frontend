'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Calendar, ShoppingBag } from 'lucide-react';

interface ManufactureYearDemandProps {
  data: Array<{
    yearRange: string;
    leadsCount: number;
    testDrivesCount: number;
    salesCount: number;
    availableStock: number;
    demandScore: number;
    recommendation: string;
    recommendationMessage: string;
  }>;
  loading?: boolean;
}

export function ManufactureYearDemandChart({ data, loading }: ManufactureYearDemandProps) {
  if (loading) {
    return <div className="h-72 rounded-lg bg-bg-surface-alt animate-pulse border border-border" />;
  }

  const chartData = (data && data.length > 0)
    ? data.map((d) => ({
        year: d.yearRange,
        CustomerDemand: d.leadsCount + d.testDrivesCount * 2,
        SalesCount: d.salesCount,
        ActiveStock: d.availableStock,
      }))
    : [];

  return (
    <div className="rounded-lg bg-bg-surface border border-border p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-wider mb-1">
            <Calendar size={14} />
            <span>Manufacture Year Analytics</span>
          </div>
          <h3 className="text-base font-bold text-text-primary tracking-tight">
            Customer Demand vs Active Stock
          </h3>
          <p className="text-xs text-text-secondary">
            Compare customer inquiry &amp; test drive signals against current inventory by year
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 badge-info text-xs">
          <ShoppingBag size={13} />
          <span>Procurement Signals</span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis dataKey="year" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
            <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', color: 'var(--text-secondary)' }} />
            <Bar dataKey="CustomerDemand" name="Customer Interest (Leads + Test Drives)" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="SalesCount" name="Completed Sales" fill="var(--success)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ActiveStock" name="Available Stock" fill="var(--warning)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-3 border-t border-border text-xs text-text-secondary flex items-center justify-between font-bold">
        <span>💡 High gap between Demand and Stock indicates prime cars to procure.</span>
      </div>
    </div>
  );
}
