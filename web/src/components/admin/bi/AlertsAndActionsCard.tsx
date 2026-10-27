'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Info, Plus, FileSpreadsheet, ShoppingCart, ShieldAlert, ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '../../../services/api';
import { showLocalToast } from '../../Toast';

interface AlertItem {
  id: string;
  title: string;
  sub: string;
  time: string;
  type: string;
  priority: string;
  color: string;
  action_label: string;
}

interface AlertsAndActionsCardProps {
  branchId?: string | number;
}

export function AlertsAndActionsCard({ branchId }: AlertsAndActionsCardProps = {}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const fetchDynamicAlerts = async () => {
    setLoading(true);
    try {
      const branchQuery = branchId && branchId !== 'all' ? `?branchId=${branchId}` : '';
      let res;
      try {
        res = await api.get(`/analytics/dynamic-alerts${branchQuery}`);
      } catch {
        res = await api.get(`/bi/dynamic-alerts${branchQuery}`);
      }
      if (res.data) {
        setAlerts(res.data);
      }
    } catch (err) {
      console.warn('Fallback alerts fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDynamicAlerts();
  }, [branchId]);

  return (
    <div className="space-y-4 font-sans">
      {/* Card 1: Recent Alerts */}
      <div className="rounded-lg bg-bg-surface border border-border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-primary tracking-tight flex items-center gap-2">
            <ShieldAlert size={16} className="text-accent" />
            <span>Recent Alerts</span>
          </h3>
          <button
            onClick={() => router.push('/admin/alerts')}
            className="text-xs font-bold text-accent hover:underline"
          >
            View All Alerts
          </button>
        </div>

        {loading ? (
          <div className="space-y-2 py-2">
            <div className="h-10 bg-bg-surface-alt rounded-lg animate-pulse" />
            <div className="h-10 bg-bg-surface-alt rounded-lg animate-pulse" />
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-3 text-xs border-b border-border pb-2.5 last:border-b-0 last:pb-0">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle size={16} className={`mt-0.5 flex-shrink-0 ${a.color}`} />
                  <div>
                    <strong className="block text-text-primary font-bold leading-snug">{a.title}</strong>
                    <small className="text-text-secondary block text-xs">{a.sub}</small>
                  </div>
                </div>
                <span className="text-xs text-text-secondary font-mono flex-shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card 2: Quick Actions Grid */}
      <div className="rounded-lg bg-bg-surface border border-border p-5 space-y-3">
        <h3 className="text-sm font-bold text-text-primary tracking-tight">Quick Actions</h3>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => router.push('/admin/inventory')}
            className="btn-primary flex items-center justify-center gap-1.5"
          >
            <Plus size={14} /> Add Vehicle
          </button>

          <button
            onClick={() => router.push('/admin/leads-customers')}
            className="btn-secondary flex items-center justify-center gap-1.5"
          >
            <Plus size={14} /> Add Lead
          </button>

          <button
            onClick={() => router.push('/admin/reports')}
            className="btn-neutral flex items-center justify-center gap-1.5"
          >
            <FileSpreadsheet size={14} /> View Reports
          </button>

          <button
            onClick={() => router.push('/admin/budget-simulator')}
            className="btn-neutral flex items-center justify-center gap-1.5"
          >
            <ShoppingCart size={14} /> Budget Simulator
          </button>
        </div>
      </div>
    </div>
  );
}
