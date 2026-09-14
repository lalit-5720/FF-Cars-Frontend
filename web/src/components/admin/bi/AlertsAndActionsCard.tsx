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

export function AlertsAndActionsCard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const fetchDynamicAlerts = async () => {
    setLoading(true);
    try {
      let res;
      try {
        res = await api.get('/analytics/dynamic-alerts');
      } catch {
        res = await api.get('/bi/dynamic-alerts');
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
  }, []);

  return (
    <div className="space-y-4 font-sans">
      {/* Card 1: Recent Alerts */}
      <div className="rounded-2xl bg-[#1e293b]/90 border border-slate-800/90 p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert size={16} className="text-sky-400" />
            <span>Recent Alerts</span>
          </h3>
          <button
            onClick={() => router.push('/admin/alerts')}
            className="text-[11px] font-bold text-sky-400 hover:underline"
          >
            View All Alerts
          </button>
        </div>

        {loading ? (
          <div className="space-y-2 py-2">
            <div className="h-10 bg-slate-800/50 rounded-xl animate-pulse" />
            <div className="h-10 bg-slate-800/50 rounded-xl animate-pulse" />
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-3 text-xs border-b border-slate-800/60 pb-2.5 last:border-b-0 last:pb-0">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle size={16} className={`mt-0.5 flex-shrink-0 ${a.color}`} />
                  <div>
                    <strong className="block text-slate-100 font-bold leading-snug">{a.title}</strong>
                    <small className="text-slate-400 block text-[10px]">{a.sub}</small>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card 2: Quick Actions Grid */}
      <div className="rounded-2xl bg-[#1e293b]/90 border border-slate-800/90 p-5 shadow-lg space-y-3">
        <h3 className="text-sm font-extrabold text-white tracking-tight">Quick Actions</h3>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => router.push('/admin/inventory')}
            className="p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow cursor-pointer"
          >
            <Plus size={14} /> Add Vehicle
          </button>

          <button
            onClick={() => router.push('/admin/leads-customers')}
            className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow cursor-pointer"
          >
            <Plus size={14} /> Add Lead
          </button>

          <button
            onClick={() => router.push('/admin/reports')}
            className="p-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow cursor-pointer"
          >
            <FileSpreadsheet size={14} /> View Reports
          </button>

          <button
            onClick={() => router.push('/admin/budget-simulator')}
            className="p-3 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow cursor-pointer"
          >
            <ShoppingCart size={14} /> Budget Simulator
          </button>
        </div>
      </div>
    </div>
  );
}
