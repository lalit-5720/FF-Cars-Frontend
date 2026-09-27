'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { usePermissions } from '../../../hooks/usePermissions';
import { RequireRole } from '../../../components/auth/RequireRole';
import { showLocalToast } from '../../../components/Toast';
import {
  Settings,
  Building2,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  X,
  Loader2,
  Layers,
  Lock,
  Unlock,
} from 'lucide-react';

interface BranchItem {
  branch_id: number;
  branch_name: string;
  manager_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  status?: string;
}

interface RoleItem {
  id: string;
  name: string;
  description: string;
  isSystemDefault: boolean;
  permissions: Record<string, boolean>;
}

const PERMISSION_CONFIG: { key: string; label: string; description: string }[] = [
  { key: 'canAccessOverview', label: 'Executive Overview', description: 'Access KPI metrics, showroom charts, and overview console' },
  { key: 'canAccessInventory', label: 'Vehicle Inventory', description: 'View vehicle stockyard catalog and technical specifications' },
  { key: 'canManageInventory', label: 'Manage Inventory', description: 'Add new cars, update valuations, and reallocate stock' },
  { key: 'canAccessSales', label: 'Sales Deals', description: 'View vehicle sales transactions and financing status' },
  { key: 'canManageSales', label: 'Manage Sales & Loans', description: 'Formulate contracts and trigger bank loan approvals' },
  { key: 'canAccessDeliveries', label: 'Gate-Pass Deliveries', description: 'Access vehicle handover queues and odometer logs' },
  { key: 'canManageDeliveries', label: 'Execute Handover', description: 'Release digital gate passes and complete handovers' },
  { key: 'canAccessLeads', label: 'Leads & CRM', description: 'View incoming website inquiries and customer prospects' },
  { key: 'canManageLeads', label: 'Qualify & Reassign Leads', description: 'Update pipeline stages and reassign sales executives' },
  { key: 'canAccessTestDrives', label: 'Test-Drive Logs', description: 'View customer trial bookings and showroom schedule' },
  { key: 'canManageTestDrives', label: 'Conduct Test Drives', description: 'Lock appointment slots and record star ratings' },
  { key: 'canAccessReviews', label: 'Review Moderation', description: 'Publish and moderate experiential customer ratings' },
  { key: 'canAccessReports', label: 'Financial & CSV Reports', description: 'Export transaction ledgers and inventory audit files' },
  { key: 'canAccessEmployees', label: 'Staff Directory', description: 'View dealership personnel roster' },
  { key: 'canManageEmployees', label: 'Manage Compensation', description: 'Add new staff members, set salary, and alter roles' },
  { key: 'canAccessSettings', label: 'System Settings', description: 'Configure multi-branch locations and governance' },
];

export default function SettingsPage() {
  const permissions = usePermissions();
  const [activeTab, setActiveTab] = useState<'branches' | 'roles'>('branches');

  // Branch state
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [submittingBranch, setSubmittingBranch] = useState(false);
  const [newBranch, setNewBranch] = useState({
    branch_name: '',
    manager_name: '',
    phone: '',
    email: '',
    address: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '',
    status: 'Active',
  });

  // Roles state
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [submittingRole, setSubmittingRole] = useState(false);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: {
      canAccessOverview: true,
      canAccessInventory: true,
      canManageInventory: false,
      canAccessSales: false,
      canManageSales: false,
      canAccessDeliveries: true,
      canManageDeliveries: false,
      canAccessLeads: true,
      canManageLeads: false,
      canAccessTestDrives: true,
      canManageTestDrives: false,
      canAccessReviews: false,
      canAccessReports: false,
      canAccessEmployees: false,
      canManageEmployees: false,
      canAccessSettings: false,
    } as Record<string, boolean>,
  });

  const fetchBranches = async () => {
    setLoadingBranches(true);
    try {
      const res = await api.get('/branches');
      setBranches(res.data);
    } catch (err) {
      showLocalToast('Failed to load branches.');
    } finally {
      setLoadingBranches(false);
    }
  };

  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const res = await api.get('/roles');
      setRoles(res.data);
      localStorage.setItem('carrevive_custom_roles', JSON.stringify(res.data));
    } catch (err) {
      // Fallback from localStorage if server is unreachable
      try {
        const stored = localStorage.getItem('carrevive_custom_roles');
        if (stored) setRoles(JSON.parse(stored));
      } catch {
        // ignore
      }
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchRoles();
  }, []);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.branch_name.trim()) {
      showLocalToast('Please enter a branch name.');
      return;
    }

    setSubmittingBranch(true);
    try {
      await api.post('/branches', newBranch);
      showLocalToast(`Showroom branch "${newBranch.branch_name}" added successfully!`);
      setShowBranchModal(false);
      setNewBranch({
        branch_name: '',
        manager_name: '',
        phone: '',
        email: '',
        address: '',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '',
        status: 'Active',
      });
      fetchBranches();
    } catch (err: any) {
      showLocalToast(err?.response?.data?.message || 'Failed to create branch.');
    } finally {
      setSubmittingBranch(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.name.trim()) {
      showLocalToast('Please enter a role title.');
      return;
    }

    setSubmittingRole(true);
    try {
      const res = await api.post('/roles', {
        name: newRole.name,
        description: newRole.description,
        permissions: newRole.permissions,
      });

      const updatedList = [...roles, res.data];
      setRoles(updatedList);
      localStorage.setItem('carrevive_custom_roles', JSON.stringify(updatedList));

      showLocalToast(`Role "${res.data.name}" created with custom visible functionality!`);
      setShowRoleModal(false);
      setNewRole({
        name: '',
        description: '',
        permissions: {
          canAccessOverview: true,
          canAccessInventory: true,
          canManageInventory: false,
          canAccessSales: false,
          canManageSales: false,
          canAccessDeliveries: true,
          canManageDeliveries: false,
          canAccessLeads: true,
          canManageLeads: false,
          canAccessTestDrives: true,
          canManageTestDrives: false,
          canAccessReviews: false,
          canAccessReports: false,
          canAccessEmployees: false,
          canManageEmployees: false,
          canAccessSettings: false,
        },
      });
    } catch (err: any) {
      showLocalToast(err?.response?.data?.message || 'Failed to create custom role.');
    } finally {
      setSubmittingRole(false);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the role "${roleName}"?`)) return;
    try {
      await api.delete(`/roles/${roleId}`);
      const filtered = roles.filter((r) => r.id !== roleId);
      setRoles(filtered);
      localStorage.setItem('carrevive_custom_roles', JSON.stringify(filtered));
      showLocalToast(`Role "${roleName}" has been removed.`);
    } catch (err: any) {
      showLocalToast(err?.response?.data?.message || 'Failed to delete role.');
    }
  };

  const togglePermission = (key: string) => {
    setNewRole((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key],
      },
    }));
  };

  return (
    <RequireRole allow={['SYSTEM_ADMIN']}>
      <div className="space-y-6 max-w-7xl mx-auto font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#1e293b]/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <Settings className="w-5 h-5 text-amber-400" /> Dealership Architecture & Role Governance
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              System Admin Console: Manage multi-branch locations and configure custom roles with dynamic functionality
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'branches' ? (
              <button
                onClick={() => setShowBranchModal(true)}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add New Branch
              </button>
            ) : (
              <button
                onClick={() => setShowRoleModal(true)}
                className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create Custom Role
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('branches')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'branches'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" /> Showroom Branches ({branches.length})
          </button>

          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'roles'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Role & Permission Matrix ({roles.length})
          </button>
        </div>

        {/* Tab 1: Showroom Branches */}
        {activeTab === 'branches' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingBranches ? (
              <div className="col-span-full py-16 text-center text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                Loading showroom branch networks...
              </div>
            ) : (
              branches.map((b) => (
                <div
                  key={b.branch_id}
                  className="p-5 rounded-2xl bg-[#1e293b]/80 border border-slate-800 space-y-3.5 hover:border-slate-700 transition-colors shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white text-sm flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-sky-400" /> {b.branch_name}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {b.status || 'Active'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1.5 font-medium border-t border-slate-800/80 pt-3">
                    <div>
                      <span className="text-slate-400">Branch Manager:</span>{' '}
                      <strong className="text-slate-100">{b.manager_name || 'Unassigned'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Location:</span> {b.address || 'Chennai Showroom'}, {b.city} - {b.pincode}
                    </div>
                    <div>
                      <span className="text-slate-400">Direct Desk:</span> {b.phone || 'N/A'} · {b.email || 'N/A'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Role & Permission Matrix */}
        {activeTab === 'roles' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-sky-400 flex-shrink-0" />
                <span>
                  <strong>Dynamic RBAC Architecture:</strong> Custom roles are not hardcoded. When you create a role and tick its visible modules, members assigned this role dynamically access only those authorized sections.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loadingRoles ? (
                <div className="col-span-full py-16 text-center text-slate-400 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
                  Loading role matrix...
                </div>
              ) : (
                roles.map((r) => {
                  const permEntries = Object.entries(r.permissions || {}).filter(([_, val]) => Boolean(val));

                  return (
                    <div
                      key={r.id}
                      className="p-5 rounded-2xl bg-[#1e293b]/90 border border-slate-800 space-y-4 shadow-lg hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-white text-sm">{r.name}</h3>
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              {r.id}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{r.description}</p>
                        </div>

                        {!r.isSystemDefault && (
                          <button
                            onClick={() => handleDeleteRole(r.id, r.name)}
                            title="Delete custom role"
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Visible Functionality Badges */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Granted Visible Modules ({permEntries.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {permEntries.length === 0 ? (
                            <span className="text-[11px] text-slate-500 italic">No modules granted</span>
                          ) : (
                            permEntries.map(([k]) => {
                              const match = PERMISSION_CONFIG.find((p) => p.key === k);
                              return (
                                <span
                                  key={k}
                                  className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-800/90 text-sky-300 border border-slate-700 flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  {match ? match.label : k}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Modal 1: Add New Branch */}
        {showBranchModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1e293b] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-400" /> Add New Showroom Branch
                </h3>
                <button
                  onClick={() => setShowBranchModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateBranch} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Branch Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OMR Sholinganallur Showroom"
                    value={newBranch.branch_name}
                    onChange={(e) => setNewBranch({ ...newBranch, branch_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Branch Manager</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh V"
                      value={newBranch.manager_name}
                      onChange={(e) => setNewBranch({ ...newBranch, manager_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="+91 98401 23456"
                      value={newBranch.phone}
                      onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="omr@carrevive.in"
                      value={newBranch.email}
                      onChange={(e) => setNewBranch({ ...newBranch, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Pincode</label>
                    <input
                      type="text"
                      placeholder="600119"
                      value={newBranch.pincode}
                      onChange={(e) => setNewBranch({ ...newBranch, pincode: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Street Address</label>
                  <input
                    type="text"
                    placeholder="Plot 14, Rajiv Gandhi Salai, OMR"
                    value={newBranch.address}
                    onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowBranchModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBranch}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold flex items-center gap-1.5"
                  >
                    {submittingBranch && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Branch Location
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Create Custom Role (Addressing Prompt.md Requirement) */}
        {showRoleModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1e293b] border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-sky-400" /> Create Custom Role & Permissions
                </h3>
                <button onClick={() => setShowRoleModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Role Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Quality Assurance & PDI Inspector"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Role Scope / Description</label>
                  <textarea
                    rows={2}
                    placeholder="Briefly describe what this staff member is responsible for..."
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-sky-400 resize-none"
                  />
                </div>

                {/* Visible Functionality / Modules */}
                <div>
                  <label className="block text-slate-200 font-bold mb-2">
                    Visible Functionality & Action Permissions:
                  </label>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Check the modules and operational actions visible to staff members assigned this role:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1 bg-slate-900/60 rounded-xl border border-slate-800/80">
                    {PERMISSION_CONFIG.map((p) => {
                      const isChecked = Boolean(newRole.permissions[p.key]);
                      return (
                        <div
                          key={p.key}
                          onClick={() => togglePermission(p.key)}
                          className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors flex items-start gap-2.5 ${
                            isChecked
                              ? 'bg-sky-500/10 border-sky-500/30 text-white'
                              : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by parent onClick
                            className="mt-0.5 rounded border-slate-700 text-sky-500 focus:ring-0 cursor-pointer"
                          />
                          <div>
                            <div className="font-bold text-[11px] leading-tight">{p.label}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{p.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowRoleModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRole}
                    className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl font-bold flex items-center gap-1.5"
                  >
                    {submittingRole && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create Custom Role
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
