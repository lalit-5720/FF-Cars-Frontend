'use client';

import React, { useState, useEffect } from 'react';
import { RequireRole } from '../../../components/auth/RequireRole';
import { api } from '../../../services/api';
import { ShieldAlert, AlertTriangle, RefreshCw, ShoppingBag, Tag, ArrowRightLeft, CheckCircle2 } from 'lucide-react';
import { showLocalToast } from '../../../components/Toast';

interface OperationalAlert {
  id: string;
  title: string;
  sub: string;
  time: string;
  type: 'HIGH_DEMAND' | 'SLOW_MOVING' | 'REALLOCATE' | 'RISK';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  color: string;
  action_label: string;
}

export default function AdminAlertsPage() {
  const [loading, setLoading] = useState(true);
  const [alertList, setAlertList] = useState<OperationalAlert[]>([]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      let res;
      try {
        res = await api.get('/analytics/dynamic-alerts');
      } catch {
        res = await api.get('/bi/dynamic-alerts');
      }
      if (res.data) setAlertList(res.data);
    } catch (err) {
      console.error('Failed to load operational alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return (
    <RequireRole allow={['SYSTEM_ADMIN', 'BRANCH_MANAGER', 'SALES_EXECUTIVE']}>
      <div className="space-y-6 text-slate-100 font-sans pb-10">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-extrabold uppercase tracking-wider border border-rose-500/30">
                Rule-Based Operational Engine
              </span>
              <span className="text-xs text-slate-400 font-medium">Live PostgreSQL System Alerts</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white mt-1 flex items-center gap-2.5">
              <ShieldAlert size={24} className="text-rose-400" />
              Alerts & Operational Actions Center
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Real-time warnings for high-demand cars, slow-moving inventory (&gt;45 days), inter-branch stock reallocation, and risk management
            </p>
          </div>

          <button
            onClick={fetchAlerts}
            className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 text-xs font-bold transition-all border border-slate-700 cursor-pointer shadow"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh System Alerts</span>
          </button>
        </div>

        {/* Operational Alerts List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-800/40 animate-pulse border border-slate-700/50" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {alertList.map((alert) => {
              const isHigh = alert.priority === 'HIGH';

              return (
                <div
                  key={alert.id}
                  className={`rounded-2xl border p-5 shadow-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isHigh
                      ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-400'
                      : 'bg-[#1e293b]/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold shrink-0 ${
                        isHigh ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      <AlertTriangle size={20} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                            isHigh
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {alert.priority} PRIORITY
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{alert.time}</span>
                      </div>

                      <h3 className="text-sm font-extrabold text-white">{alert.title}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">{alert.sub}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => showLocalToast(`Executing action: ${alert.action_label}`)}
                    className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer shrink-0"
                  >
                    <span>{alert.action_label}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RequireRole>
  );
}
