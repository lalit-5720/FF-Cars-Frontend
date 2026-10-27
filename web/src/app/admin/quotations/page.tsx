'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../store/useAuthStore';
import { usePermissions } from '../../../hooks/usePermissions';
import { RequireRole } from '../../../components/auth/RequireRole';
import { showLocalToast } from '../../../components/Toast';
import {
  CarFront,
  Search,
  Filter,
  UserCheck,
  Building2,
  Clock,
  CheckCircle2,
  Phone,
  Mail,
  Calendar,
  Gauge,
  Tag,
  ArrowRight,
  ShieldCheck,
  Award,
  X,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Edit,
  Plus
} from 'lucide-react';

interface VehicleQuotation {
  quotation_id: number;
  registration_number: string;
  customer_name: string;
  phone: string;
  email?: string;
  make?: string;
  model?: string;
  manufacture_year?: number;
  kilometers_driven?: number;
  fuel_type?: string;
  transmission?: string;
  expected_price?: number;
  estimated_valuation?: number;
  condition?: string;
  branch_id?: number;
  assigned_to?: number;
  status: string;
  notes?: string;
  created_at: string;
  branches?: any;
  assigned_employee?: any;
  customers?: any;
}

export default function QuotationsManagementPage() {
  const { user } = useAuthStore();
  const permissions = usePermissions();

  const [quotations, setQuotations] = useState<VehicleQuotation[]>([]);
  const [salesExecutives, setSalesExecutives] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');

  // Modals
  const [selectedQuotationForAssign, setSelectedQuotationForAssign] = useState<VehicleQuotation | null>(null);
  const [selectedExecutiveId, setSelectedExecutiveId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const [selectedQuotationForStatus, setSelectedQuotationForStatus] = useState<VehicleQuotation | null>(null);
  const [newStatus, setNewStatus] = useState('CONTACTED');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [copiedPhoneId, setCopiedPhoneId] = useState<number | null>(null);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (branchFilter !== 'ALL') params.branchId = branchFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await api.get('/quotations', { params });
      setQuotations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load quotations', err);
      showLocalToast('Failed to load vehicle valuation enquiries.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [empRes, branchRes] = await Promise.all([
        api.get('/employees?role=SALES_EXECUTIVE').catch(() => ({ data: [] })),
        api.get('/branches').catch(() => ({ data: [] })),
      ]);
      setSalesExecutives(Array.isArray(empRes.data) ? empRes.data : []);
      setBranches(Array.isArray(branchRes.data) ? branchRes.data : []);
    } catch (err) {
      console.error('Failed to load employees or branches', err);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchQuotations();
  }, [statusFilter, branchFilter, searchTerm]);

  // Handle Assign Sales Executive
  const handleConfirmAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuotationForAssign) return;
    if (!selectedExecutiveId) {
      showLocalToast('Please select a Sales Executive to assign this enquiry.', 'error');
      return;
    }

    setIsAssigning(true);
    try {
      await api.patch(`/quotations/${selectedQuotationForAssign.quotation_id}/assign`, {
        employeeId: parseInt(selectedExecutiveId, 10),
        notes: assignNotes.trim() || undefined,
      });

      showLocalToast('Enquiry assigned to Sales Executive successfully!', 'success');
      setSelectedQuotationForAssign(null);
      setSelectedExecutiveId('');
      setAssignNotes('');
      fetchQuotations();
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to assign enquiry.', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle Status Update
  const handleConfirmStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuotationForStatus) return;

    setIsUpdatingStatus(true);
    try {
      await api.patch(`/quotations/${selectedQuotationForStatus.quotation_id}/status`, {
        status: newStatus,
        notes: statusNotes.trim() || undefined,
      });

      showLocalToast(`Enquiry status updated to ${newStatus}`, 'success');
      setSelectedQuotationForStatus(null);
      setStatusNotes('');
      fetchQuotations();
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to update enquiry status.', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle Delete
  const handleDeleteQuotation = async (id: number) => {
    if (!confirm(`Are you sure you want to delete quotation enquiry #QUOT-${id}?`)) return;
    try {
      await api.delete(`/quotations/${id}`);
      showLocalToast('Quotation enquiry removed.', 'success');
      fetchQuotations();
    } catch (err) {
      showLocalToast('Failed to delete quotation enquiry.', 'error');
    }
  };

  // Metrics
  const totalCount = quotations.length;
  const pendingCount = quotations.filter((q) => q.status === 'PENDING').length;
  const assignedCount = quotations.filter((q) => q.status === 'ASSIGNED').length;
  const closedCount = quotations.filter((q) => q.status === 'PURCHASED' || q.status === 'INSPECTED').length;

  return (
    <RequireRole allow={['SYSTEM_ADMIN', 'BRANCH_MANAGER', 'SALES_EXECUTIVE']}>
      <div className="space-y-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-lg border border-border bg-bg-surface">
          <div>
            <div className="flex items-center gap-2">
              <CarFront className="w-5 h-5 text-accent" />
              <h1 className="page-title text-text-primary">
                Vehicle Valuation &amp; Sell Enquiries
              </h1>
            </div>
            <p className="helper-text mt-1">
              Separate pipeline for customer car sale quotations. Branch Managers can review customer details, phone numbers, and assign enquiries to Sales Executives.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchQuotations}
            className="btn-neutral text-xs h-9 px-3 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh List</span>
          </button>
        </div>

        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border border-border bg-bg-surface">
            <span className="helper-text font-bold uppercase block text-[11px]">Total Enquiries</span>
            <span className="text-2xl font-bold text-text-primary block mt-1">{totalCount}</span>
            <span className="helper-text text-[11px] block mt-0.5">All customer valuation requests</span>
          </div>

          <div className="p-4 rounded-lg border border-status-warning bg-bg-surface">
            <span className="helper-text font-bold uppercase block text-[11px] text-status-warning">
              Pending Assignment
            </span>
            <span className="text-2xl font-bold text-status-warning block mt-1">{pendingCount}</span>
            <span className="helper-text text-[11px] block mt-0.5">Requires Branch Manager action</span>
          </div>

          <div className="p-4 rounded-lg border border-accent bg-bg-surface">
            <span className="helper-text font-bold uppercase block text-[11px] text-accent">
              Assigned to Executives
            </span>
            <span className="text-2xl font-bold text-accent block mt-1">{assignedCount}</span>
            <span className="helper-text text-[11px] block mt-0.5">Active follow-ups in progress</span>
          </div>

          <div className="p-4 rounded-lg border border-status-success bg-bg-surface">
            <span className="helper-text font-bold uppercase block text-[11px] text-status-success">
              Inspected / Purchased
            </span>
            <span className="text-2xl font-bold text-status-success block mt-1">{closedCount}</span>
            <span className="helper-text text-[11px] block mt-0.5">Doorstep inspection completed</span>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 rounded-lg border border-border bg-bg-surface flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Reg #, Customer, Phone, or Car Model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 h-9 text-xs rounded-lg border border-border bg-bg-surface text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-xs font-bold rounded-lg border border-border bg-bg-surface text-text-primary focus:border-accent focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Assignment</option>
              <option value="ASSIGNED">Assigned to Sales Exec</option>
              <option value="CONTACTED">Customer Contacted</option>
              <option value="INSPECTED">Inspected at Doorstep</option>
              <option value="PURCHASED">Purchased &bull; Closed</option>
              <option value="REJECTED">Declined / Dropped</option>
            </select>

            {/* Branch Filter (if System Admin) */}
            {permissions.isSystemAdmin && (
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="h-9 px-3 text-xs font-bold rounded-lg border border-border bg-bg-surface text-text-primary focus:border-accent focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Showroom Branches</option>
                {branches.map((b) => (
                  <option key={b.branch_id || b.id} value={b.branch_id || b.id}>
                    {b.branch_name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Quotations Table */}
        <div className="rounded-lg border border-border bg-bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-border bg-bg-surface-alt helper-text uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Ref &bull; Date</th>
                  <th className="py-3 px-4">Vehicle Details</th>
                  <th className="py-3 px-4">Customer Contact (Lead)</th>
                  <th className="py-3 px-4">Showroom Branch</th>
                  <th className="py-3 px-4">Valuation (Est / Exp)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Sales Exec</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center helper-text">
                      Loading quotation enquiries...
                    </td>
                  </tr>
                ) : quotations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <CarFront className="w-8 h-8 text-text-secondary mx-auto mb-2 opacity-50" />
                      <p className="body-text font-bold text-text-primary">No valuation enquiries found</p>
                      <p className="helper-text mt-0.5">Enquiries submitted via the website Sell Car quotation banner will appear here.</p>
                    </td>
                  </tr>
                ) : (
                  quotations.map((q) => {
                    const estVal = Number(q.estimated_valuation || 0);
                    const expVal = Number(q.expected_price || 0);
                    const isPending = q.status === 'PENDING';
                    const isAssigned = Boolean(q.assigned_to && q.assigned_employee);

                    return (
                      <tr key={q.quotation_id} className="hover:bg-bg-surface-alt transition-colors">
                        
                        {/* ID & Date */}
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-accent block">
                            #QUOT-{q.quotation_id}
                          </span>
                          <span className="helper-text text-[11px] block mt-0.5">
                            {new Date(q.created_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </td>

                        {/* Vehicle Information */}
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-text-primary text-xs uppercase">
                            {q.registration_number}
                          </div>
                          <div className="helper-text mt-0.5 font-bold">
                            {q.make || 'Certified'} {q.model || 'Automobile'}
                          </div>
                          <div className="helper-text text-[11px] text-text-secondary">
                            {q.manufacture_year ? `${q.manufacture_year} • ` : ''}
                            {q.kilometers_driven ? `${Number(q.kilometers_driven).toLocaleString('en-IN')} km • ` : ''}
                            {q.fuel_type || 'Petrol'}
                          </div>
                        </td>

                        {/* Customer Contact Information */}
                        <td className="py-3 px-4">
                          <div className="body-text font-bold text-xs text-text-primary">
                            {q.customer_name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <a
                              href={`tel:${q.phone}`}
                              className="text-accent font-bold hover:underline flex items-center gap-1 text-xs"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{q.phone}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(q.phone);
                                setCopiedPhoneId(q.quotation_id);
                                showLocalToast('Phone number copied to clipboard');
                                setTimeout(() => setCopiedPhoneId(null), 2000);
                              }}
                              className="text-text-secondary hover:text-text-primary p-0.5"
                              title="Copy Phone"
                            >
                              {copiedPhoneId === q.quotation_id ? (
                                <Check className="w-3 h-3 text-status-success" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          {q.email && (
                            <span className="helper-text text-[11px] text-text-secondary block truncate max-w-[140px]">
                              {q.email}
                            </span>
                          )}
                        </td>

                        {/* Dealership Showroom Branch */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 font-bold text-text-primary text-xs">
                            <Building2 className="w-3.5 h-3.5 text-accent shrink-0" />
                            <span className="truncate max-w-[140px]">
                              {q.branches?.branch_name || 'Showroom Branch'}
                            </span>
                          </div>
                          {q.branches?.city && (
                            <span className="helper-text text-[11px] block mt-0.5">
                              {q.branches.city}
                            </span>
                          )}
                        </td>

                        {/* Valuation: Estimate vs Expected */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-accent text-xs">
                            Est: ₹{estVal.toLocaleString('en-IN')}
                          </div>
                          {expVal > 0 && (
                            <span className="helper-text text-[11px] block text-text-secondary">
                              Exp: ₹{expVal.toLocaleString('en-IN')}
                            </span>
                          )}
                          <span className="badge badge-neutral text-[10px] mt-1 inline-block">
                            {q.condition || 'Good Condition'}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-4">
                          <span
                            className={`badge ${
                              q.status === 'PENDING'
                                ? 'badge-warning'
                                : q.status === 'ASSIGNED'
                                ? 'badge-info'
                                : q.status === 'CONTACTED'
                                ? 'badge-neutral'
                                : q.status === 'PURCHASED'
                                ? 'badge-success'
                                : 'badge-danger'
                            }`}
                          >
                            {q.status}
                          </span>
                        </td>

                        {/* Assigned Sales Executive */}
                        <td className="py-3 px-4">
                          {isAssigned ? (
                            <div>
                              <div className="flex items-center gap-1 font-bold text-text-primary text-xs">
                                <UserCheck className="w-3.5 h-3.5 text-status-success shrink-0" />
                                <span>
                                  {q.assigned_employee.first_name} {q.assigned_employee.last_name || ''}
                                </span>
                              </div>
                              <span className="helper-text text-[11px] text-text-secondary block">
                                {q.assigned_employee.phone || 'Sales Executive'}
                              </span>
                              {(permissions.isBranchManager || permissions.isSystemAdmin) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedQuotationForAssign(q);
                                    setSelectedExecutiveId(String(q.assigned_to || ''));
                                    setAssignNotes(q.notes || '');
                                  }}
                                  className="helper-text text-accent hover:underline font-bold text-[10px] block mt-0.5"
                                >
                                  Re-assign
                                </button>
                              )}
                            </div>
                          ) : (
                            <div>
                              <span className="badge badge-warning text-[10px] mb-1.5 inline-block">
                                Unassigned
                              </span>
                              {(permissions.isBranchManager || permissions.isSystemAdmin) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedQuotationForAssign(q);
                                    setSelectedExecutiveId('');
                                    setAssignNotes(q.notes || '');
                                  }}
                                  className="btn-primary text-[11px] h-7 px-2.5 flex items-center gap-1"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  <span>Assign Exec</span>
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* If Purchased, provide 1-click shortcut to manually include in inventory */}
                            {q.status === 'PURCHASED' && (
                              <Link
                                href={`/admin/inventory?action=add&addReg=${encodeURIComponent(q.registration_number)}&addMake=${encodeURIComponent(q.make || '')}&addModel=${encodeURIComponent(q.model || '')}&addYear=${q.manufacture_year || ''}&addKm=${q.kilometers_driven || ''}&addFuel=${encodeURIComponent(q.fuel_type || '')}&addTrans=${encodeURIComponent(q.transmission || '')}&addBranch=${q.branch_id || ''}&addPrice=${q.estimated_valuation || q.expected_price || ''}`}
                                className="btn-primary text-xs h-7 px-2.5 flex items-center gap-1 bg-status-success hover:bg-status-success/90 text-white font-bold"
                                title="Manually Add Purchased Car to Inventory"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add to Inventory</span>
                              </Link>
                            )}

                            {/* Update Status Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedQuotationForStatus(q);
                                setNewStatus(q.status);
                                setStatusNotes(q.notes || '');
                              }}
                              className="btn-neutral text-xs h-7 px-2"
                              title="Update Status & Notes"
                            >
                              <Edit className="w-3 h-3" />
                              <span className="hidden sm:inline">Status</span>
                            </button>

                            {/* Delete (Manager/Admin only) */}
                            {(permissions.isBranchManager || permissions.isSystemAdmin) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteQuotation(q.quotation_id)}
                                className="p-1.5 rounded text-text-secondary hover:text-status-danger hover:bg-bg-surface-alt transition-colors"
                                title="Delete Enquiry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL 1: ASSIGN TO SALES EXECUTIVE (BRANCH MANAGER ACTION) */}
        {selectedQuotationForAssign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-lg bg-bg-surface border border-border p-6 shadow-lg text-text-primary">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-accent" />
                  <h3 className="section-heading text-sm font-bold text-text-primary">
                    Assign to Sales Executive
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedQuotationForAssign(null)}
                  className="p-1 rounded text-text-secondary hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmAssign} className="space-y-4 text-xs">
                <div className="p-3 rounded-lg bg-bg-surface-alt border border-border space-y-1">
                  <div className="flex justify-between">
                    <span className="helper-text">Quotation Ref:</span>
                    <span className="font-bold font-mono">#QUOT-{selectedQuotationForAssign.quotation_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="helper-text">Customer:</span>
                    <span className="font-bold">{selectedQuotationForAssign.customer_name} ({selectedQuotationForAssign.phone})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="helper-text">Vehicle:</span>
                    <span className="font-bold">{selectedQuotationForAssign.registration_number} &bull; {selectedQuotationForAssign.make || ''} {selectedQuotationForAssign.model || ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="helper-text">Showroom:</span>
                    <span className="font-bold text-accent">{selectedQuotationForAssign.branches?.branch_name || 'Branch'}</span>
                  </div>
                </div>

                <div>
                  <label className="helper-text font-bold block mb-1">
                    Select Sales Executive *
                  </label>
                  <select
                    required
                    value={selectedExecutiveId}
                    onChange={(e) => setSelectedExecutiveId(e.target.value)}
                    className="w-full px-3 h-9 rounded-lg border border-border bg-bg-surface text-text-primary focus:border-accent focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Choose Sales Executive --</option>
                    {salesExecutives.map((emp) => (
                      <option key={emp.employee_id} value={emp.employee_id}>
                        {emp.first_name} {emp.last_name || ''} ({emp.email} &bull; {emp.job_title || 'Sales Exec'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="helper-text block mb-1">
                    Manager Instructions / Notes for Executive
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Please call the customer immediately to inspect the car at Kilpauk residence and verify RC documentation..."
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-border bg-bg-surface text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setSelectedQuotationForAssign(null)}
                    className="btn-neutral h-8 px-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAssigning}
                    className="btn-primary h-8 px-4"
                  >
                    {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: UPDATE STATUS AND INSPECTION NOTES */}
        {selectedQuotationForStatus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-lg bg-bg-surface border border-border p-6 shadow-lg text-text-primary">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-accent" />
                  <h3 className="section-heading text-sm font-bold text-text-primary">
                    Update Enquiry Status
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedQuotationForStatus(null)}
                  className="p-1 rounded text-text-secondary hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmStatusUpdate} className="space-y-4 text-xs">
                <div>
                  <label className="helper-text font-bold block mb-1">
                    Enquiry Status *
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 h-9 rounded-lg border border-border bg-bg-surface text-text-primary focus:border-accent focus:outline-none cursor-pointer"
                  >
                    <option value="PENDING">PENDING - Unassigned</option>
                    <option value="ASSIGNED">ASSIGNED - Assigned to Executive</option>
                    <option value="CONTACTED">CONTACTED - Customer Spoken With</option>
                    <option value="INSPECTED">INSPECTED - Doorstep PDI Completed</option>
                    <option value="PURCHASED">PURCHASED - Deal Finalized &amp; Paid</option>
                    <option value="REJECTED">REJECTED - Customer Declined</option>
                  </select>
                </div>

                {newStatus === 'PURCHASED' && (
                  <div className="p-2.5 rounded-lg bg-bg-surface-alt border border-status-success/30 text-text-secondary text-[11px] flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
                    <span>
                      <strong>Manual Inventory Intake:</strong> Marking as PURCHASED closes the seller inquiry. To make this car available for buyers in showroom inventory, use the green <strong>"Add to Inventory"</strong> button to review specifications and set the retail price.
                    </span>
                  </div>
                )}

                <div>
                  <label className="helper-text block mb-1">
                    Progress Notes &amp; Valuation Remarks
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Enter latest remarks from customer call or physical car inspection..."
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-border bg-bg-surface text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setSelectedQuotationForStatus(null)}
                    className="btn-neutral h-8 px-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingStatus}
                    className="btn-primary h-8 px-4"
                  >
                    {isUpdatingStatus ? 'Saving...' : 'Update Status'}
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
