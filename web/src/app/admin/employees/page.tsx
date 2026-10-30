'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { usePermissions } from '../../../hooks/usePermissions';
import { RequireRole } from '../../../components/auth/RequireRole';
import { showLocalToast } from '../../../components/Toast';
import { Users, Plus, ShieldCheck, Mail, Phone, Lock, Trash2, X, Loader2, Building2 } from 'lucide-react';

import { firstError, email as checkEmail, phone as checkPhone, password as checkPassword, money, maxLen } from '../../../lib/validation';
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
    password: '',
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
    const empErr = firstError(
      maxLen(newEmployee.first_name.trim(), 50, 'First name'),
      maxLen(newEmployee.last_name, 50, 'Last name'),
      checkEmail(newEmployee.email, 'Email', true),
      checkPhone(newEmployee.phone),
      money(newEmployee.salary, 'Salary', { max: 10_000_000 }),
      checkPassword(newEmployee.password, 'Login password'),
    );
    if (empErr) {
      showLocalToast(empErr);
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
        password: '',
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
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-bg-surface border border-border p-6 rounded-[8px]">
          <div>
            <h1 className="text-[24px] font-bold text-text-primary flex items-center gap-2.5">
              <Users className="w-5 h-5 text-accent" /> Dealership Staff & Personnel Directory
            </h1>
            <p className="text-[12px] text-text-secondary mt-1">
              {permissions.canManageEmployees
                ? 'Manage dealership workforce across multi-branch showrooms, assign dynamic roles, and set compensation'
                : 'View staff directory for your branch (read-only manager scope)'}
            </p>
          </div>

          {permissions.canManageEmployees && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add New Staff Member
            </button>
          )}
        </div>

        {/* Read-only notification for Branch Managers */}
        {!permissions.canManageEmployees && (
          <div className="p-3.5 rounded-[8px] bg-bg-surface-alt border border-border text-status-warning text-[12px] font-bold flex items-center gap-2">
            <Lock className="w-4 h-4 flex-shrink-0" />
            Branch Manager Scope: Staff addition, salary edits, and role promotions are reserved for System Admin (Founder).
          </div>
        )}

        {/* Table */}
        <div className="rounded-[8px] bg-bg-surface border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr className="border-b border-border bg-bg-surface-alt text-text-secondary uppercase text-[12px] font-bold">
                  <th className="py-4 px-4">Staff ID</th>
                  <th className="py-4 px-4">Staff Name</th>
                  <th className="py-4 px-4">Role & Job Title</th>
                  <th className="py-4 px-4">Branch Showroom</th>
                  <th className="py-4 px-4">Direct Contact</th>
                  {permissions.canManageEmployees && <th className="py-4 px-4">Base Compensation</th>}
                  <th className="py-4 px-4">Status</th>
                  {permissions.canManageEmployees && <th className="py-4 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-text-secondary text-[12px]">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-accent" />
                      Loading staff directory...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-text-secondary text-[14px]">
                      No employee records found.
                    </td>
                  </tr>
                ) : (
                  employees.map((e) => (
                    <tr key={e.employee_id} className="hover:bg-bg-surface-alt transition-colors">
                      <td className="py-4 px-4 font-bold text-accent text-[12px]">#EMP-{e.employee_id}</td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-text-primary">
                          {e.first_name} {e.last_name || ''}
                        </div>
                        <div className="text-[12px] text-text-secondary">{e.email}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-text-primary block">{e.role}</span>
                        <span className="text-[12px] text-text-secondary block">{e.job_title || 'Showroom Executive'}</span>
                      </td>
                      <td className="py-4 px-4 text-text-secondary text-[14px]">
                        {e.branches?.branch_name || `Branch #${e.branch_id || '1'}`}
                      </td>
                      <td className="py-4 px-4 text-text-secondary text-[12px]">
                        {e.phone || '—'}
                      </td>
                      {permissions.canManageEmployees && (
                        <td className="py-4 px-4 font-bold text-text-primary">
                          {e.salary ? `₹${Number(e.salary).toLocaleString()}` : 'Confidential'}
                        </td>
                      )}
                      <td className="py-4 px-4">
                        <span className="badge-success">
                          {e.status || 'Active'}
                        </span>
                      </td>
                      {permissions.canManageEmployees && (
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => handleDeleteEmployee(e.employee_id, `${e.first_name} ${e.last_name || ''}`)}
                            title="Remove staff member"
                            className="p-1.5 rounded-[8px] text-status-danger hover:bg-bg-surface-alt transition-colors cursor-pointer"
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
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-bg-surface border border-border rounded-[8px] max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-[18px] font-bold text-text-primary flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent" /> Onboard New Staff Member
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-text-secondary hover:text-text-primary p-1 rounded-[8px]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateEmployee} className="space-y-3 text-[14px]">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-text-secondary font-bold mb-1 text-[12px]">First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh"
                      value={newEmployee.first_name} maxLength={50}
                      onChange={(e) => setNewEmployee({ ...newEmployee, first_name: e.target.value })}
                      className="input-base w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary font-bold mb-1 text-[12px]">Last Name</label>
                    <input
                      type="text"
                      placeholder="e.g. V"
                      value={newEmployee.last_name} maxLength={50}
                      onChange={(e) => setNewEmployee({ ...newEmployee, last_name: e.target.value })}
                      className="input-base w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-text-secondary font-bold mb-1 text-[12px]">Official Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="ramesh.v@carrevive.in"
                      value={newEmployee.email} maxLength={100}
                      onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                      className="input-base w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary font-bold mb-1 text-[12px]">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 98401 23456"
                      value={newEmployee.phone} maxLength={15} inputMode="tel"
                      onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                      className="input-base w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-text-secondary font-bold mb-1 text-[12px]">Assigned Role *</label>
                    <select
                      value={newEmployee.role}
                      onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                      className="input-base w-full cursor-pointer"
                    >
                      {availableRoles.filter((r) => ['SYSTEM_ADMIN', 'BRANCH_MANAGER', 'SALES_EXECUTIVE'].includes(r.id)).map((r) => (
                        <option key={r.id} value={r.id} className="bg-bg-surface text-text-primary">
                          {r.name} ({r.id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-text-secondary font-bold mb-1 text-[12px]">Showroom Branch *</label>
                    <select
                      value={newEmployee.branch_id}
                      onChange={(e) => setNewEmployee({ ...newEmployee, branch_id: Number(e.target.value) })}
                      className="input-base w-full cursor-pointer"
                    >
                      {branches.map((b) => (
                        <option key={b.branch_id} value={b.branch_id} className="bg-bg-surface text-text-primary">
                          {b.branch_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-text-secondary font-bold mb-1 text-[12px]">Job Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Customer Concierge"
                      value={newEmployee.job_title} maxLength={50}
                      onChange={(e) => setNewEmployee({ ...newEmployee, job_title: e.target.value })}
                      className="input-base w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary font-bold mb-1 text-[12px]">Monthly Salary (₹)</label>
                    <input
                      type="number"
                      placeholder="55000"
                      value={newEmployee.salary} min={0} max={10000000}
                      onChange={(e) => setNewEmployee({ ...newEmployee, salary: Number(e.target.value) })}
                      className="input-base w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-text-secondary font-bold mb-1 text-[12px]">Initial Password</label>
                  <input
                    type="password"
                    placeholder="Minimum 6 characters" minLength={6} maxLength={100} required
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                    className="input-base w-full"
                  />
                  <p className="text-[12px] text-text-secondary mt-1">Staff will use this password to sign into the Operations Console.</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-neutral"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary flex items-center gap-1.5"
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
