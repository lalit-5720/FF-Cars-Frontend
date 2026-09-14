'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { usePermissions } from '../../../hooks/usePermissions';
import { RequireRole } from '../../../components/auth/RequireRole';
import { showLocalToast } from '../../../components/Toast';
import { Target, Users, Plus, Phone, Mail } from 'lucide-react';

export default function LeadsCustomersPage() {
  const permissions = usePermissions();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      try {
        const res = await api.get('/leads');
        setLeads(res.data);
      } catch (err) {
        showLocalToast('Failed to load leads.');
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  return (
    <RequireRole allow={['SYSTEM_ADMIN', 'BRANCH_MANAGER', 'SALES_EXECUTIVE']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border p-5 rounded-2xl">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-sky-400" /> Leads & Customer Pipeline
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track customer inquiries, lead sources, and sales rep assignments
            </p>
          </div>

          {permissions.canManageLeads && (
            <button
              onClick={() => showLocalToast('Add Lead modal opened')}
              className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Log New Lead
            </button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-4">Lead ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Interested Vehicle</th>
                  <th className="py-3 px-4">Assigned Rep</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Interest Level</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      Loading lead pipeline...
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No active leads logged.
                    </td>
                  </tr>
                ) : (
                  leads.map((l) => (
                    <tr key={l.lead_id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-400">#LEAD-{l.lead_id}</td>
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {l.customers ? `${l.customers.first_name} ${l.customers.last_name || ''}` : `Customer #${l.customer_id}`}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {l.vehicles ? `${l.vehicles.make} ${l.vehicles.model}` : `Vehicle #${l.vehicle_id}`}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {l.employees ? `${l.employees.first_name} ${l.employees.last_name || ''}` : `Rep #${l.employee_id}`}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-300">{l.source || 'Website'}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          l.interest_level === 'High' || l.interest_level === 'Hot' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          l.interest_level === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                          {l.interest_level || 'Medium'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground">{l.status || 'New'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
