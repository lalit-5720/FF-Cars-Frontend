'use client';

import React, { useState, useEffect } from 'react';
import { RequireRole } from '../../../components/auth/RequireRole';
import { api } from '../../../services/api';
import { usePermissions } from '../../../hooks/usePermissions';
import { showLocalToast } from '../../../components/Toast';
import { 
  Building2, 
  RefreshCw, 
  MapPin, 
  Plus, 
  Edit, 
  Power, 
  X
} from 'lucide-react';

interface BranchPerformanceItem {
  branch_id: number;
  branch_name: string;
  manager_name: string;
  phone?: string;
  email?: string;
  city: string;
  state?: string;
  status?: string;
  total_revenue: number;
  total_sales: number;
  active_inventory_count: number;
  total_inventory_value: number;
  avg_days_to_sell: number;
  lead_conversion_rate: number;
  top_selling_model: string;
  efficiency_rating: string;
}

export default function AdminBranchesPage() {
  const permissions = usePermissions();
  const [loading, setLoading] = useState(true);
  const [branchList, setBranchList] = useState<BranchPerformanceItem[]>([]);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    branch_name: '',
    manager_name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: '',
    status: 'Active',
  });

  const fetchBranchPerformance = async () => {
    setLoading(true);
    try {
      let res;
      try {
        res = await api.get('/analytics/branch-performance');
      } catch {
        res = await api.get('/bi/branch-performance');
      }
      if (res.data) setBranchList(res.data);
    } catch (err) {
      console.error('Failed to load branch performance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranchPerformance();
  }, []);

  const formatRupees = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakhs`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.branch_name || !formData.city) {
      showLocalToast('Branch name and City are required.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/branches', formData);
      showLocalToast(`Branch "${formData.branch_name}" created successfully!`, 'success');
      setIsCreateModalOpen(false);
      setFormData({
        branch_name: '',
        manager_name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: 'Tamil Nadu',
        pincode: '',
        status: 'Active',
      });
      await fetchBranchPerformance();
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to create branch', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;
    setSubmitting(true);
    try {
      await api.patch(`/branches/${editingBranch.branch_id}`, formData);
      showLocalToast(`Branch updated successfully!`, 'success');
      setEditingBranch(null);
      await fetchBranchPerformance();
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to update branch', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (branch: BranchPerformanceItem) => {
    const newStatus = branch.status === 'Inactive' ? 'Active' : 'Inactive';
    if (!confirm(`Are you sure you want to set branch "${branch.branch_name}" to ${newStatus}?`)) return;
    try {
      await api.patch(`/branches/${branch.branch_id}`, { status: newStatus });
      showLocalToast(`Branch status updated to ${newStatus}.`, 'success');
      await fetchBranchPerformance();
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to update branch status', 'error');
    }
  };

  const openEditModal = (b: BranchPerformanceItem) => {
    setEditingBranch(b);
    setFormData({
      branch_name: b.branch_name || '',
      manager_name: b.manager_name || '',
      phone: b.phone || '',
      email: b.email || '',
      address: '',
      city: b.city || '',
      state: b.state || 'Tamil Nadu',
      pincode: '',
      status: b.status || 'Active',
    });
  };

  return (
    <RequireRole allow={['SYSTEM_ADMIN', 'BRANCH_MANAGER']}>
      <div className="space-y-6 text-text-primary pb-10">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-info">
                Multi-Location Reporting
              </span>
              <span className="helper-text">Network Performance</span>
            </div>
            <h1 className="page-title flex items-center gap-2 text-text-primary">
              <Building2 size={24} className="text-accent" />
              Branch Operations &amp; Inventory Efficiency
            </h1>
            <p className="helper-text mt-0.5">
              Live branch sales revenue, inventory turnover, lead conversion rates, and branch controls.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {permissions.isSystemAdmin && (
              <button
                onClick={() => {
                  setFormData({
                    branch_name: '',
                    manager_name: '',
                    phone: '',
                    email: '',
                    address: '',
                    city: '',
                    state: 'Tamil Nadu',
                    pincode: '',
                    status: 'Active',
                  });
                  setIsCreateModalOpen(true);
                }}
                className="btn-primary"
              >
                <Plus size={15} />
                <span>Create New Branch</span>
              </button>
            )}

            <button
              onClick={fetchBranchPerformance}
              className="btn-neutral"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>

        {/* Branch Performance Cards Grid */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-48 bg-bg-surface border border-border rounded-lg animate-pulse" />
            <div className="h-48 bg-bg-surface border border-border rounded-lg animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {branchList.map((branch) => (
              <div
                key={branch.branch_id}
                className="rounded-lg bg-bg-surface border border-border p-6 space-y-4 flex flex-col justify-between"
              >
                <div>
                  {/* Branch Card Header */}
                  <div className="flex items-start justify-between border-b border-border pb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-bg-surface-alt border border-border flex items-center justify-center text-accent shrink-0">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="section-heading text-text-primary">{branch.branch_name}</h2>
                          <span className={`badge ${
                            branch.status === 'Inactive' ? 'badge-danger' : 'badge-success'
                          }`}>
                            {branch.status || 'Active'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 helper-text mt-0.5">
                          <span className="flex items-center gap-1"><MapPin size={12} /> {branch.city}</span>
                          <span>Manager: <strong className="text-text-primary">{branch.manager_name || 'Unassigned'}</strong></span>
                        </div>
                      </div>
                    </div>

                    <span className="badge badge-info">
                      {branch.efficiency_rating}
                    </span>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mt-4">
                    <div className="bg-bg-surface-alt p-3 rounded-lg border border-border">
                      <span className="helper-text uppercase block font-bold">TOTAL REVENUE</span>
                      <strong className="text-sm font-bold text-accent">{formatRupees(branch.total_revenue)}</strong>
                    </div>
                    <div className="bg-bg-surface-alt p-3 rounded-lg border border-border">
                      <span className="helper-text uppercase block font-bold">TOTAL SALES</span>
                      <strong className="text-sm font-bold text-status-success">{branch.total_sales} Cars</strong>
                    </div>
                    <div className="bg-bg-surface-alt p-3 rounded-lg border border-border">
                      <span className="helper-text uppercase block font-bold">ACTIVE INVENTORY</span>
                      <strong className="text-sm font-bold text-status-warning">{branch.active_inventory_count} Vehicles</strong>
                    </div>
                    <div className="bg-bg-surface-alt p-3 rounded-lg border border-border">
                      <span className="helper-text uppercase block font-bold">CONVERSION RATE</span>
                      <strong className="text-sm font-bold text-text-primary">{branch.lead_conversion_rate}%</strong>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="bg-bg-surface-alt p-3 rounded-lg border border-border flex items-center justify-between text-xs mt-3">
                    <div>
                      <span className="helper-text block">Top Performing Model:</span>
                      <strong className="block text-text-primary font-bold text-sm">{branch.top_selling_model}</strong>
                    </div>
                    <div className="text-right">
                      <span className="helper-text block">Avg Days on Lot:</span>
                      <strong className="block text-accent font-bold text-sm">{branch.avg_days_to_sell} Days</strong>
                    </div>
                  </div>
                </div>

                {/* Admin Management Actions */}
                {permissions.isSystemAdmin && (
                  <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(branch)}
                      className="btn-neutral text-xs h-8 px-3"
                    >
                      <Edit size={13} />
                      <span>Edit Details</span>
                    </button>
                    <button
                      onClick={() => handleToggleStatus(branch)}
                      className={`h-8 px-3 text-xs font-bold rounded-lg border cursor-pointer ${
                        branch.status === 'Inactive'
                          ? 'badge-success'
                          : 'badge-danger'
                      }`}
                    >
                      <Power size={13} />
                      <span>{branch.status === 'Inactive' ? 'Activate' : 'Deactivate'}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CREATE / EDIT BRANCH MODAL */}
        {(isCreateModalOpen || editingBranch) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <div className="w-full max-w-lg rounded-lg bg-bg-surface border border-border p-6 shadow-sm text-text-primary">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <h3 className="section-heading flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-accent" />
                  <span>{editingBranch ? `Edit Branch #${editingBranch.branch_id}` : 'Create New Showroom Branch'}</span>
                </h3>
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingBranch(null);
                  }}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={editingBranch ? handleUpdateBranch : handleCreateBranch} className="space-y-4 text-xs">
                <div>
                  <label className="block helper-text font-bold uppercase mb-1">Branch Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.branch_name}
                    onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                    placeholder="e.g. Madurai Ring Road Showroom"
                    className="w-full p-2.5 rounded-lg bg-bg-surface border border-border text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block helper-text font-bold uppercase mb-1">Manager Name</label>
                    <input
                      type="text"
                      value={formData.manager_name}
                      onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                      placeholder="e.g. Rajesh Kannan"
                      className="w-full p-2.5 rounded-lg bg-bg-surface border border-border text-text-primary focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block helper-text font-bold uppercase mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Madurai"
                      className="w-full p-2.5 rounded-lg bg-bg-surface border border-border text-text-primary focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block helper-text font-bold uppercase mb-1">Phone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full p-2.5 rounded-lg bg-bg-surface border border-border text-text-primary focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block helper-text font-bold uppercase mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="branch@carrevive.in"
                      className="w-full p-2.5 rounded-lg bg-bg-surface border border-border text-text-primary focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block helper-text font-bold uppercase mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Showroom street address"
                    className="w-full p-2.5 rounded-lg bg-bg-surface border border-border text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setEditingBranch(null);
                    }}
                    className="btn-neutral"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary"
                  >
                    {submitting ? 'Saving...' : editingBranch ? 'Save Changes' : 'Create Branch'}
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
