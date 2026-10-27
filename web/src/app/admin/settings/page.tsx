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
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-bg-surface border border-border p-6 rounded-[8px]">
          <div>
            <h1 className="text-[24px] font-bold text-text-primary flex items-center gap-2">
              <Settings className="w-5 h-5 text-accent" /> Dealership Architecture & Role Governance
            </h1>
            <p className="text-[12px] text-text-secondary mt-1">
              System Admin Console: Manage multi-branch locations and configure custom roles with dynamic functionality
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'branches' ? (
              <button
                onClick={() => setShowBranchModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add New Branch
              </button>
            ) : (
              <button
                onClick={() => setShowRoleModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create Custom Role
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <button
            onClick={() => setActiveTab('branches')}
            className={`px-4 py-2 rounded-[8px] text-[12px] font-bold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'branches'
                ? 'bg-accent text-accent-text'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Building2 className="w-4 h-4" /> Showroom Branches ({branches.length})
          </button>

          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 rounded-[8px] text-[12px] font-bold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'roles'
                ? 'bg-accent text-accent-text'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Role & Permission Matrix ({roles.length})
          </button>
        </div>

        {/* Tab 1: Showroom Branches */}
        {activeTab === 'branches' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingBranches ? (
              <div className="col-span-full py-16 text-center text-text-secondary text-[12px]">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-accent" />
                Loading showroom branch networks...
              </div>
            ) : (
              branches.map((b) => (
                <div
                  key={b.branch_id}
                  className="p-4 rounded-[8px] bg-bg-surface border border-border space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text-primary text-[14px] flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-accent" /> {b.branch_name}
                    </span>
                    <span className="badge-success">
                      {b.status || 'Active'}
                    </span>
                  </div>

                  <div className="text-[12px] text-text-secondary space-y-1.5 border-t border-border pt-3">
                    <div>
                      <span>Branch Manager:</span>{' '}
                      <strong className="text-text-primary">{b.manager_name || 'Unassigned'}</strong>
                    </div>
                    <div>
                      <span>Location:</span> {b.address || 'Chennai Showroom'}, {b.city} - {b.pincode}
                    </div>
                    <div>
                      <span>Direct Desk:</span> {b.phone || '—'} · {b.email || '—'}
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
            <div className="p-4 rounded-[8px] bg-bg-surface-alt border border-border text-text-primary text-[12px] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-accent flex-shrink-0" />
                <span>
                  <strong>Dynamic RBAC Architecture:</strong> Custom roles are not hardcoded. When you create a role and tick its visible modules, members assigned this role dynamically access only those authorized sections.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loadingRoles ? (
                <div className="col-span-full py-16 text-center text-text-secondary text-[12px]">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-accent" />
                  Loading role matrix...
                </div>
              ) : (
                roles.map((r) => {
                  const permEntries = Object.entries(r.permissions || {}).filter(([_, val]) => Boolean(val));

                  return (
                    <div
                      key={r.id}
                      className="p-4 rounded-[8px] bg-bg-surface border border-border space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-text-primary text-[14px]">{r.name}</h3>
                            <span className="text-[12px] px-2 py-0.5 rounded-[999px] bg-bg-surface-alt text-text-secondary border border-border">
                              {r.id}
                            </span>
                          </div>
                          <p className="text-[12px] text-text-secondary mt-1">{r.description}</p>
                        </div>

                        {!r.isSystemDefault && (
                          <button
                            onClick={() => handleDeleteRole(r.id, r.name)}
                            title="Delete custom role"
                            className="p-1.5 rounded-[8px] text-status-danger hover:bg-bg-surface-alt transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Visible Functionality Badges */}
                      <div className="space-y-1.5">
                        <span className="text-[12px] font-bold uppercase tracking-wider text-text-secondary block">
                          Granted Visible Modules ({permEntries.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {permEntries.length === 0 ? (
                            <span className="text-[12px] text-text-secondary italic">No modules granted</span>
                          ) : (
                            permEntries.map(([k]) => {
                              const match = PERMISSION_CONFIG.find((p) => p.key === k);
                              return (
                                <span
                                  key={k}
                                  className="px-2.5 py-1 rounded-[8px] text-[12px] font-bold bg-bg-surface-alt text-text-primary border border-border flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
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
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-bg-surface border border-border rounded-[8px] max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-[18px] font-bold text-text-primary flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-accent" /> Add New Showroom Branch
                </h3>
                <button
                  onClick={() => setShowBranchModal(false)}
                  className="text-text-secondary hover:text-text-primary p-1 rounded-[8px]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateBranch} className="space-y-3 text-[14px]">
                <div>
                  <label className="block text-text-secondary font-bold mb-1 text-[12px]">Branch Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OMR Sholinganallur Showroom"
                    value={newBranch.branch_name}
                    onChange={(e) => setNewBranch({ ...newBranch, branch_name: e.target.value })}
                    className="input-base w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-text-secondary font-bold mb-1 text-[12px]">Branch Manager</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh V"
                      value={newBranch.manager_name}
                      onChange={(e) => setNewBranch({ ...newBranch, manager_name: e.target.value })}
                      className="input-base w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary font-bold mb-1 text-[12px]">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="+91 98401 23456"
                      value={newBranch.phone}
                      onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                      className="input-base w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-text-secondary font-bold mb-1 text-[12px]">Email Address</label>
                    <input
                      type="email"
                      placeholder="omr@carrevive.in"
                      value={newBranch.email}
                      onChange={(e) => setNewBranch({ ...newBranch, email: e.target.value })}
                      className="input-base w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary font-bold mb-1 text-[12px]">Pincode</label>
                    <input
                      type="text"
                      placeholder="600119"
                      value={newBranch.pincode}
                      onChange={(e) => setNewBranch({ ...newBranch, pincode: e.target.value })}
                      className="input-base w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-text-secondary font-bold mb-1 text-[12px]">Street Address</label>
                  <input
                    type="text"
                    placeholder="Plot 14, Rajiv Gandhi Salai, OMR"
                    value={newBranch.address}
                    onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                    className="input-base w-full"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowBranchModal(false)}
                    className="btn-neutral"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBranch}
                    className="btn-primary flex items-center gap-1.5"
                  >
                    {submittingBranch && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Branch Location
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Create Custom Role */}
        {showRoleModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-bg-surface border border-border rounded-[8px] max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-[18px] font-bold text-text-primary flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-accent" /> Create Custom Role & Permissions
                </h3>
                <button onClick={() => setShowRoleModal(false)} className="text-text-secondary hover:text-text-primary p-1 rounded-[8px]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateRole} className="space-y-4 text-[14px]">
                <div>
                  <label className="block text-text-secondary font-bold mb-1 text-[12px]">Role Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Quality Assurance & PDI Inspector"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    className="input-base w-full"
                  />
                </div>

                <div>
                  <label className="block text-text-secondary font-bold mb-1 text-[12px]">Role Scope / Description</label>
                  <textarea
                    rows={2}
                    placeholder="Briefly describe what this staff member is responsible for..."
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    className="input-base w-full resize-none"
                  />
                </div>

                {/* Visible Functionality / Modules */}
                <div>
                  <label className="block text-text-primary font-bold mb-1 text-[12px]">
                    Visible Functionality & Action Permissions:
                  </label>
                  <p className="text-[12px] text-text-secondary mb-3">
                    Check the modules and operational actions visible to staff members assigned this role:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 bg-bg-surface-alt rounded-[8px] border border-border">
                    {PERMISSION_CONFIG.map((p) => {
                      const isChecked = Boolean(newRole.permissions[p.key]);
                      return (
                        <div
                          key={p.key}
                          onClick={() => togglePermission(p.key)}
                          className={`p-2.5 rounded-[8px] border text-left cursor-pointer transition-colors flex items-start gap-2.5 ${
                            isChecked
                              ? 'bg-bg-surface border-accent text-text-primary'
                              : 'bg-bg-surface border-border text-text-secondary hover:border-accent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by parent onClick
                            className="mt-0.5 rounded-[4px] border-border text-accent focus:ring-0 cursor-pointer"
                          />
                          <div>
                            <div className="font-bold text-[12px] leading-tight text-text-primary">{p.label}</div>
                            <div className="text-[12px] text-text-secondary mt-0.5 line-clamp-1">{p.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowRoleModal(false)}
                    className="btn-neutral"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRole}
                    className="btn-primary flex items-center gap-1.5"
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
