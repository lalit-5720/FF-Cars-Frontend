'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { usePermissions } from '../../../hooks/usePermissions';
import { RequireRole } from '../../../components/auth/RequireRole';
import { showLocalToast } from '../../../components/Toast';
import { Users, Plus, ShieldCheck, Mail, Phone, Lock, Trash2, X, Loader2, Building2 } from 'lucide-react';

interface EmployeeItem {
  employee_id: number;
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  role: string;
  job_title?: string;
  salary?: number | string;
  status?: string;
  branch_id?: number;
  branches?: {
    branch_name: string;
  };
}

interface BranchItem {
  branch_id: number;
  branch_name: string;
}

interface RoleItem {
  id: string;
  name: string;
}

export default function EmployeesPage() {
  const permissions = usePermissions();
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [availableRoles, setAvailableRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'SALES_EXECUTIVE',
    job_title: 'Sales & Concierge Specialist',
    branch_id: 1,
    salary: 45000,
    password: 'password123',
    status: 'Active',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, branchRes, rolesRes] = await Promise.allSettled([
        api.get('/employees'),
        api.get('/branches'),
        api.get('/roles'),
      ]);

      if (empRes.status === 'fulfilled') {
        setEmployees(empRes.value.data);
      }
      if (branchRes.status === 'fulfilled') {
        setBranches(branchRes.value.data);
        if (branchRes.value.data.length > 0) {
          setNewEmployee((prev) => ({ ...prev, branch_id: branchRes.value.data[0].branch_id }));
        }
      }
      if (rolesRes.status === 'fulfilled') {
        setAvailableRoles(rolesRes.value.data);
      } else {
        // Fallback default roles
        setAvailableRoles([
          { id: 'SYSTEM_ADMIN', name: 'System Administrator' },
          { id: 'BRANCH_MANAGER', name: 'Branch Manager' },
          { id: 'SALES_EXECUTIVE', name: 'Sales Executive' },
          { id: 'FINANCE_EXECUTIVE', name: 'Finance Executive' },
          { id: 'INVENTORY_AUDITOR', name: 'Inventory Auditor' },
        ]);
      }
    } catch (err) {
      showLocalToast('Failed to load employee staff directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.first_name.trim() || !newEmployee.email.trim()) {
      showLocalToast('Please fill in required name and email fields.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/employees', {
        ...newEmployee,
        branch_id: Number(newEmployee.branch_id),
        salary: Number(newEmployee.salary),
      });

      showLocalToast(`Staff member ${newEmployee.first_name} ${newEmployee.last_name} created successfully!`);
      setShowAddModal(false);
      setNewEmployee({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: 'SALES_EXECUTIVE',
        job_title: 'Sales & Concierge Specialist',
        branch_id: branches[0]?.branch_id || 1,
        salary: 45000,
        password: 'password123',
        status: 'Active',
      });
      fetchData();
    } catch (err: any) {
      showLocalToast(err?.response?.data?.message || 'Failed to create employee record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (empId: number, empName: string) => {
    if (!confirm(`Are you sure you want to remove ${empName} from the staff directory?`)) return;
    try {
      await api.delete(`/employees/${empId}`);
      setEmployees((prev) => prev.filter((e) => e.employee_id !== empId));
      showLocalToast(`Employee #${empId} successfully removed.`);
    } catch (err: any) {
      showLocalToast(err?.response?.data?.message || 'Failed to remove employee.');
    }
  };

  return (
    <RequireRole allow={['SYSTEM_ADMIN', 'BRANCH_MANAGER']}>
      <div className="space-y-6 max-w-7xl mx-auto font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#1e293b]/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <Users className="w-5 h-5 text-sky-400" /> Dealership Staff & Personnel Directory
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {permissions.canManageEmployees
                ? 'Manage dealership workforce across multi-branch showrooms, assign dynamic roles, and set compensation'
                : 'View staff directory for your branch (read-only manager scope)'}
            </p>
          </div>

          {permissions.canManageEmployees && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add New Staff Member
            </button>
          )}
        </div>

        {/* Read-only notification for Branch Managers */}
        {!permissions.canManageEmployees && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold flex items-center gap-2">
            <Lock className="w-4 h-4 flex-shrink-0" />
            Branch Manager Scope: Staff addition, salary edits, and role promotions are reserved for System Admin (Founder).
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl bg-[#1e293b]/90 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-4">Staff ID</th>
                  <th className="py-3 px-4">Staff Name</th>
                  <th className="py-3 px-4">Role & Job Title</th>
                  <th className="py-3 px-4">Branch Showroom</th>
                  <th className="py-3 px-4">Direct Contact</th>
                  {permissions.canManageEmployees && <th className="py-3 px-4">Base Compensation</th>}
                  <th className="py-3 px-4">Status</th>
                  {permissions.canManageEmployees && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
                      Loading staff directory...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No employee records found.
                    </td>
                  </tr>
                ) : (
                  employees.map((e) => (
                    <tr key={e.employee_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-400">#EMP-{e.employee_id}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">
                          {e.first_name} {e.last_name || ''}
                        </div>
                        <div className="text-[11px] text-slate-400">{e.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-200 block">{e.role}</span>
                        <span className="text-[10px] text-slate-400 block">{e.job_title || 'Showroom Executive'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {e.branches?.branch_name || `Branch #${e.branch_id || '1'}`}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {e.phone || 'N/A'}
                      </td>
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
                      {permissions.canManageEmployees && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteEmployee(e.employee_id, `${e.first_name} ${e.last_name || ''}`)}
                            title="Remove staff member"
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Add New Staff Member */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1e293b] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-sky-400" /> Onboard New Staff Member
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateEmployee} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh"
                      value={newEmployee.first_name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, first_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-sky-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Last Name</label>
                    <input
                      type="text"
                      placeholder="e.g. V"
                      value={newEmployee.last_name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, last_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-sky-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Official Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="ramesh.v@carrevive.in"
                      value={newEmployee.email}
                      onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-sky-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 98401 23456"
                      value={newEmployee.phone}
                      onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-sky-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Assigned Role *</label>
                    <select
                      value={newEmployee.role}
                      onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-sky-400 cursor-pointer"
                    >
                      {availableRoles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Showroom Branch *</label>
                    <select
                      value={newEmployee.branch_id}
                      onChange={(e) => setNewEmployee({ ...newEmployee, branch_id: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-sky-400 cursor-pointer"
                    >
                      {branches.map((b) => (
                        <option key={b.branch_id} value={b.branch_id}>
                          {b.branch_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Job Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Customer Concierge"
                      value={newEmployee.job_title}
                      onChange={(e) => setNewEmployee({ ...newEmployee, job_title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-sky-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Monthly Salary (₹)</label>
                    <input
                      type="number"
                      placeholder="55000"
                      value={newEmployee.salary}
                      onChange={(e) => setNewEmployee({ ...newEmployee, salary: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-sky-400 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Initial Password</label>
                  <input
                    type="password"
                    placeholder="password123"
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-sky-400 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Staff will use this password to sign into the Operations Console.</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Complete Staff Onboarding
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RequireRole>
  );
}
