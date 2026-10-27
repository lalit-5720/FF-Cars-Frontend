'use client';

import React, { useState, useEffect } from 'react';
import { RequireRole } from '../../../components/auth/RequireRole';
import { api } from '../../../services/api';
import { ShieldAlert, AlertTriangle, RefreshCw } from 'lucide-react';
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
    <RequireRole allow={['SYSTEM_ADMIN', 'BRANCH_MANAGER']}>
      <div className="space-y-6 text-text-primary pb-10">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-danger">
                Operational Engine
              </span>
              <span className="helper-text">System Alerts</span>
            </div>
            <h1 className="page-title flex items-center gap-2 text-text-primary">
              <ShieldAlert size={24} className="text-status-danger" />
              Alerts &amp; Operational Actions
            </h1>
            <p className="helper-text mt-0.5">
              Real-time warnings for high-demand cars, aging inventory, stock reallocation, and risk management.
            </p>
          </div>

          <button
            onClick={fetchAlerts}
            className="btn-neutral"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Alerts</span>
          </button>
        </div>

        {/* Operational Alerts List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-bg-surface border border-border animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {alertList.map((alert) => {
              const isHigh = alert.priority === 'HIGH';

              return (
                <div
                  key={alert.id}
                  className={`rounded-lg border p-4 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isHigh
                      ? 'bg-bg-surface-alt border-status-danger'
                      : 'bg-bg-surface border-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                        isHigh ? 'badge-danger' : 'badge-warning'
                      }`}
                    >
                      <AlertTriangle size={18} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`badge ${isHigh ? 'badge-danger' : 'badge-warning'} text-[10px]`}
                        >
                          {alert.priority} Priority
                        </span>
                        <span className="helper-text">{alert.time}</span>
                      </div>

                      <h3 className="section-heading text-sm text-text-primary">{alert.title}</h3>
                      <p className="body-text text-text-secondary text-xs">{alert.sub}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => showLocalToast(`Executing action: ${alert.action_label}`)}
                    className="btn-primary shrink-0"
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
