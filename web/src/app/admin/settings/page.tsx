'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { usePermissions } from '../../../hooks/usePermissions';
import { RequireRole } from '../../../components/auth/RequireRole';
import { showLocalToast } from '../../../components/Toast';
import { Settings, Building2, Plus, Edit } from 'lucide-react';

export default function SettingsPage() {
  const permissions = usePermissions();
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/branches');
      setBranches(res.data);
    } catch (err) {
      showLocalToast('Failed to load branches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  return (
    <RequireRole allow={['SYSTEM_ADMIN']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border p-5 rounded-2xl">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-400" /> Branch Management & System Settings
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              System Admin console: Create multi-branch locations, update dealership parameters
            </p>
          </div>

          <button
            onClick={() => showLocalToast('Create New Branch modal opened')}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New Branch
          </button>
        </div>

        {/* Branches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 py-12 text-center text-muted-foreground">Loading branch locations...</div>
          ) : (
            branches.map((b) => (
              <div key={b.branch_id} className="p-5 rounded-2xl bg-card border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-foreground text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-sky-400" /> {b.branch_name}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {b.status || 'Active'}
                  </span>
                </div>
                <div className="text-xs text-slate-300 space-y-1 font-medium">
                  <div>Manager: <strong className="text-foreground">{b.manager_name || 'Unassigned'}</strong></div>
                  <div>Address: {b.address}, {b.city}, {b.state} - {b.pincode}</div>
                  <div>Contact: {b.phone || 'N/A'} · {b.email || 'N/A'}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </RequireRole>
  );
}
