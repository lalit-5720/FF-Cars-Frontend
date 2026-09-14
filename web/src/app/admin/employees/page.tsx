'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { usePermissions } from '../../../hooks/usePermissions';
import { RequireRole } from '../../../components/auth/RequireRole';
import { showLocalToast } from '../../../components/Toast';
import { Users, Plus, ShieldCheck, Mail, Phone, Lock } from 'lucide-react';

export default function EmployeesPage() {
  const permissions = usePermissions();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employees');
      setEmployees(res.data);
    } catch (err) {
      showLocalToast('Failed to load employee staff directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <RequireRole allow={['SYSTEM_ADMIN', 'BRANCH_MANAGER']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border p-5 rounded-2xl">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-400" /> Employee Staff Directory
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {permissions.canManageEmployees
                ? 'Manage dealership workforce, assign branch roles, and set compensation'
                : 'View staff directory for your branch (read-only manager scope)'}
            </p>
          </div>

          {permissions.canManageEmployees && (
            <button
              onClick={() => showLocalToast('Add Employee modal opened')}
              className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add New Staff Member
            </button>
          )}
        </div>

        {/* Read-only notification for Branch Managers */}
        {!permissions.canManageEmployees && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Branch Manager Scope: Staff addition, salary edits, and role promotions are reserved for System Admin (Founder).
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Staff Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Contact</th>
                  {permissions.canManageEmployees && <th className="py-3 px-4">Salary</th>}
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      Loading staff directory...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No employee records found.
                    </td>
                  </tr>
                ) : (
                  employees.map((e) => (
                    <tr key={e.employee_id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-400">#EMP-{e.employee_id}</td>
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {e.first_name} {e.last_name || ''}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-semibold">{e.role}</td>
                      <td className="py-3.5 px-4 text-slate-300">{e.branches?.branch_name || `Branch #${e.branch_id}`}</td>
                      <td className="py-3.5 px-4 text-muted-foreground">{e.email || e.phone || 'N/A'}</td>
                      {permissions.canManageEmployees && (
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                          {e.salary ? `₹${Number(e.salary).toLocaleString()}` : 'Confidential'}
                        </td>
                      )}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          {e.status || 'Active'}
                        </span>
                      </td>
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
