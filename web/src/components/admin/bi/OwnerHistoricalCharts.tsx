'use client';

import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { api } from '../../../services/api';
import {
  TrendingUp,
  BarChart3,
  CarFront,
  Users,
  Building2,
  Clock,
  CircleDollarSign,
  Loader2,
} from 'lucide-react';

interface OwnerHistoricalChartsProps {
  branchId?: string;
  startDate?: string;
  endDate?: string;
}

export function OwnerHistoricalCharts({ branchId, startDate, endDate }: OwnerHistoricalChartsProps) {
  const [trendData, setTrendData] = useState<any[]>([]);
  const [demandData, setDemandData] = useState<any>(null);
  const [branchData, setBranchData] = useState<any[]>([]);
  const [inventoryAging, setInventoryAging] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const params: any = {};
    if (branchId && branchId !== 'all') params.branchId = branchId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    Promise.allSettled([
      api.get('/bi/revenue-trend', { params: { ...params, granularity: 'monthly' } }),
      api.get('/bi/demand', { params }),
      api.get('/bi/branches', { params }),
      api.get('/bi/inventory-aging', { params }),
    ]).then(([trendRes, demandRes, branchRes, agingRes]) => {
      if (!isMounted) return;
      if (trendRes.status === 'fulfilled' && Array.isArray(trendRes.value.data)) {
        setTrendData(trendRes.value.data);
      }
      if (demandRes.status === 'fulfilled' && demandRes.value.data) {
        setDemandData(demandRes.value.data);
      }
      if (branchRes.status === 'fulfilled' && Array.isArray(branchRes.value.data)) {
        setBranchData(branchRes.value.data);
      }
      if (agingRes.status === 'fulfilled' && agingRes.value.data) {
        setInventoryAging(agingRes.value.data);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [branchId, startDate, endDate]);

  const formatLakhs = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${value.toLocaleString('en-IN')}`;
  };

  // Demand vs Available Stock chart data (Top 6 models)
  const demandVsStock = (demandData?.rankedModels || []).slice(0, 6).map((m: any) => ({
    name: m.model,
    Demand: m.enquiries + m.testDrives,
    Available: m.availableStock,
  }));

  // Branch Performance chart data
  const branchSalesChart = branchData.map((b: any) => ({
    name: b.branchName.replace('CarRevive - ', ''),
    Sales: b.confirmedSalesCount || 0,
    RevenueLakhs: Number((b.totalRevenue / 100000).toFixed(1)),
  }));

  // Inventory Aging chart data
  const agingBrackets = inventoryAging?.ageing || {};
  const agingChartData = [
    { bracket: '0-30 Days', count: Number(agingBrackets['0-30'] ?? 0) },
    { bracket: '31-60 Days', count: Number(agingBrackets['31-60'] ?? 0) },
    { bracket: '61-90 Days', count: Number(agingBrackets['61-90'] ?? 0) },
    { bracket: '91-120 Days', count: Number(agingBrackets['91-120'] ?? 0) },
    { bracket: '120+ Days', count: Number(agingBrackets['120+'] ?? 0) },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 py-4">
        <div className="h-64 rounded-lg bg-bg-surface-alt animate-pulse border border-border" />
        <div className="h-64 rounded-lg bg-bg-surface-alt animate-pulse border border-border" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-sans text-text-primary">
      {/* Chart 1: Customer Interest & Revenue Trajectory */}
      <div className="p-5 rounded-lg bg-bg-surface border border-border space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
              <TrendingUp size={15} className="text-accent" />
              <span>Customer Interest &amp; Revenue Trends</span>
            </h3>
            <p className="text-xs text-text-secondary">Historical monthly collections &amp; inquiries</p>
          </div>
        </div>

        {trendData.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-xs text-text-secondary">
            No historical trend records found for this period.
          </div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="histRevGradLight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="period" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={10} tickFormatter={formatLakhs} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-primary)' }}
                  formatter={(value: any) => [formatLakhs(Number(value)), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#histRevGradLight)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Chart 2: Demand vs Available Inventory by Model */}
      <div className="p-5 rounded-lg bg-bg-surface border border-border space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
              <CarFront size={15} className="text-accent" />
              <span>Customer Demand vs Available Inventory</span>
            </h3>
            <p className="text-xs text-text-secondary">Active inquiries &amp; test drives vs stock in lot</p>
          </div>
        </div>

        {demandVsStock.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-xs text-text-secondary">
            No model demand records available.
          </div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demandVsStock} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-primary)' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '5px', color: 'var(--text-secondary)' }} />
                <Bar dataKey="Demand" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Available" fill="var(--success)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Chart 3: Branch-wise Sales Performance */}
      <div className="p-5 rounded-lg bg-bg-surface border border-border space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
              <Building2 size={15} className="text-accent" />
              <span>Branch Sales &amp; Revenue Volume</span>
            </h3>
            <p className="text-xs text-text-secondary">Closed sales volume per showroom</p>
          </div>
        </div>

        {branchSalesChart.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-xs text-text-secondary">
            No branch comparison records available.
          </div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchSalesChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-primary)' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '5px', color: 'var(--text-secondary)' }} />
                <Bar dataKey="Sales" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="RevenueLakhs" name="Revenue (₹ Lakhs)" fill="var(--warning)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Chart 4: Slow-Moving Inventory Aging */}
      <div className="p-5 rounded-lg bg-bg-surface border border-border space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
              <Clock size={15} className="text-accent" />
              <span>Inventory Aging &amp; Holding Risk</span>
            </h3>
            <p className="text-xs text-text-secondary">Showroom vehicles distributed by days on lot</p>
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={agingChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="bracket" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
              <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-primary)' }} />
              <Bar
                dataKey="count"
                name="Vehicles"
                fill="var(--danger)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
