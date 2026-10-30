'use client';

import React, { useState, useEffect } from 'react';
import {
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
  CarFront,
  Building2,
} from 'lucide-react';

interface OwnerHistoricalChartsProps {
  branchId?: string;
  startDate?: string;
  endDate?: string;
}

export function OwnerHistoricalCharts({ branchId, startDate, endDate }: OwnerHistoricalChartsProps) {
  const [demandData, setDemandData] = useState<any>(null);
  const [branchData, setBranchData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const params: any = {};
    if (branchId && branchId !== 'all') params.branchId = branchId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    Promise.allSettled([
      api.get('/bi/demand', { params }),
      api.get('/bi/branches', { params }),
    ]).then(([demandRes, branchRes]) => {
      if (!isMounted) return;
      if (demandRes.status === 'fulfilled' && demandRes.value.data) {
        setDemandData(demandRes.value.data);
      }
      if (branchRes.status === 'fulfilled' && Array.isArray(branchRes.value.data)) {
        setBranchData(branchRes.value.data);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [branchId, startDate, endDate]);

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
      {/* Chart 1: Demand vs Available Inventory by Model */}
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

      {/* Chart 2: Branch-wise Sales Performance */}
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
    </div>
  );
}
