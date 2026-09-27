'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../store/useAuthStore';
import { showLocalToast } from '../../Toast';
import { 
  ClipboardList, 
  User, 
  Building2, 
  Car, 
  CarFront,
  ArrowRight, 
  CheckCircle2, 
  RefreshCw, 
  DollarSign, 
  Target, 
  Award, 
  ShoppingBag, 
  TrendingUp, 
  UserCheck, 
  Phone,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface LeadListComponentProps {
  onMoveToDelivery?: (item: any) => void;
}

export function LeadListComponent({ onMoveToDelivery }: LeadListComponentProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [salesExecutives, setSalesExecutives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterInterest, setFilterInterest] = useState<string>('ALL');

  const isSalesExecutive = user?.role === 'SALES_EXECUTIVE';
  const isManagerOrAdmin = user?.role === 'BRANCH_MANAGER' || user?.role === 'SYSTEM_ADMIN';

  const fetchStats = async () => {
    try {
      const res = await api.get('/leads/my-stats');
      setStats(res.data);
    } catch (err) {
      console.warn('Failed to load lead stats', err);
    }
  };

  const fetchEmployees = async () => {
    if (!isManagerOrAdmin) return;
    try {
      const res = await api.get('/employees?role=SALES_EXECUTIVE');
      const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setSalesExecutives(list);
    } catch (err) {
      console.warn('Failed to load sales executives', err);
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leads');
      if (res.data && Array.isArray(res.data)) {
        setLeads(res.data);
      } else {
        setLeads([]);
      }
    } catch (err) {
      console.warn('Failed to load leads from API:', err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchStats();
    fetchEmployees();
  }, [user?.role, user?.id]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await api.patch(`/leads/${id}`, { status: newStatus });
      setLeads((prev) =>
        prev.map((ld) => (ld.lead_id === id ? { ...ld, status: newStatus } : ld))
      );
      showLocalToast(`Lead #${id} status updated to "${newStatus}"`);
      await fetchStats();
    } catch (err) {
      showLocalToast('Failed to update lead status');
    }
  };

  const handleAssignEmployee = async (leadId: number, employeeId: number) => {
    try {
      await api.patch(`/leads/${leadId}`, { employee_id: Number(employeeId) });
      const targetEmp = salesExecutives.find((e) => e.employee_id === Number(employeeId));
      setLeads((prev) =>
        prev.map((ld) =>
          ld.lead_id === leadId
            ? { ...ld, employee_id: Number(employeeId), employees: targetEmp || ld.employees }
            : ld
        )
      );
      showLocalToast(`Lead #${leadId} reassigned to ${targetEmp?.first_name || 'Executive'}`);
    } catch (err) {
      showLocalToast('Failed to reassign lead');
    }
  };

  const filteredLeads = leads.filter((ld) => {
    if (filterInterest === 'ALL') return true;
    const s = (ld.status || '').toUpperCase();
    if (filterInterest === 'CONVERTED') return s.includes('CONVERT') || s.includes('WON') || s.includes('BOOKED');
    if (filterInterest === 'TEST-DRIVE') return s.includes('TEST') || s.includes('DRIVE');
    if (filterInterest === 'HOT') return s.includes('HOT');
    if (filterInterest === 'NEW') return s.includes('NEW');
    if (filterInterest === 'CONTACTED') return s.includes('CONTACT');
    return s.includes(filterInterest.toUpperCase());
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. DEDICATED SALES EXECUTIVE / MANAGER KPI PERFORMANCE DASHBOARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Assigned Leads */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              {isSalesExecutive ? 'My Assigned Leads' : 'Total Pipeline Leads'}
            </span>
            <div className="text-2xl font-black text-foreground font-mono mt-1">
              {stats?.totalLeads ?? leads.length}
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              {stats?.activeLeads ?? 0} active in progress
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Converted Leads */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Converted Leads (Won)
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
              {stats?.convertedLeads ?? leads.filter(l => (l.status || '').toLowerCase().includes('convert') || (l.status || '').toLowerCase().includes('won')).length}
            </div>
            <span className="text-[11px] text-emerald-500 font-bold mt-0.5 block">
              Successfully qualified
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Successful Purchases (Sales Closed) */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Successful Purchases Closed
            </span>
            <div className="text-2xl font-black text-blue-400 font-mono mt-1">
              {stats?.successfulPurchases ?? 0}
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              Contracts executed
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Conversion Rate % */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Conversion Win Rate
            </span>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">
              {stats?.conversionRate ?? 0}%
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              Leads turned to purchases
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 2. LEADS TABLE CONTAINER */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-xl space-y-4 p-5">
        
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <ClipboardList size={18} className="text-purple-400" /> 
                {isSalesExecutive ? `My Assigned Customer Leads (${leads.length})` : `All Showroom Leads (${leads.length})`}
              </h2>
              {isSalesExecutive && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Assigned to You
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isSalesExecutive 
                ? 'Only displaying leads specifically assigned to you by your branch manager' 
                : 'Manage customer leads, reassign inquiries to sales representatives, and track sales conversions'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {['ALL', 'NEW', 'CONTACTED', 'HOT', 'TEST-DRIVE', 'CONVERTED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterInterest(st)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer border ${
                  filterInterest === st
                    ? 'bg-purple-600 text-white border-purple-400 shadow'
                    : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {st}
              </button>
            ))}
            <button
              onClick={() => {
                fetchLeads();
                fetchStats();
              }}
              className="p-1.5 rounded-xl bg-secondary text-muted-foreground hover:text-foreground border border-border cursor-pointer transition-colors"
              title="Refresh List"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Leads Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3 px-4">Lead ID</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Vehicle of Interest</th>
                <th className="py-3 px-4">Assigned Executive</th>
                <th className="py-3 px-4">Inquiry Date</th>
                <th className="py-3 px-4">Lead Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-foreground">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Loading your assigned leads...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="max-w-xs mx-auto space-y-1">
                      <p className="font-bold text-foreground">No leads found</p>
                      <p className="text-[11px]">
                        {isSalesExecutive 
                          ? 'You do not have any leads matching this filter assigned to you yet.' 
                          : 'No leads available in this filter bracket.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((ld) => {
                  const cName = ld.customers
                    ? `${ld.customers.first_name} ${ld.customers.last_name || ''}`.trim()
                    : ld.customer_name || 'Prospective Buyer';
                  const vName = ld.vehicles
                    ? `${ld.vehicles.make} ${ld.vehicles.model} (${ld.vehicles.manufacture_year || ''})`
                    : ld.vehicle_name || 'Vehicle Preferred';
                  const branch = ld.vehicles?.branches?.branch_name || ld.employees?.branches?.branch_name || ld.branch_name || 'Chennai Showroom';
                  const assignedRepName = ld.employees 
                    ? `${ld.employees.first_name} ${ld.employees.last_name || ''}`.trim()
                    : 'Unassigned';
                  const inqDate = ld.inquiry_date || ld.created_at ? new Date(ld.inquiry_date || ld.created_at).toLocaleDateString() : 'Recent';

                  return (
                    <tr key={ld.lead_id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-purple-400">
                        #LD-{ld.lead_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-foreground flex items-center gap-1.5">
                          <User size={13} className="text-muted-foreground" />
                          <span>{cName}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone size={10} /> {ld.customers?.phone || ld.phone || '9840112233'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground">{vName}</div>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Building2 size={10} /> {branch}
                        </span>
                      </td>
                      
                      {/* ASSIGNED SALES EXECUTIVE COLUMN */}
                      <td className="py-3.5 px-4">
                        {isManagerOrAdmin && salesExecutives.length > 0 ? (
                          <select
                            value={ld.employee_id || ''}
                            onChange={(e) => handleAssignEmployee(ld.lead_id, Number(e.target.value))}
                            className="bg-secondary border border-border text-foreground text-[11px] font-bold rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:border-purple-400"
                          >
                            <option value="" disabled>Select Executive</option>
                            {salesExecutives.map((emp) => (
                              <option key={emp.employee_id} value={emp.employee_id}>
                                {emp.first_name} {emp.last_name || ''}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                            <UserCheck size={13} className="text-emerald-400" />
                            <span>{assignedRepName}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">
                        {inqDate}
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={ld.status || 'Hot Lead'}
                          onChange={(e) => handleStatusChange(ld.lead_id, e.target.value)}
                          className="bg-secondary border border-border text-foreground text-[11px] font-bold rounded-lg px-2.5 py-1 cursor-pointer focus:outline-none focus:border-purple-400"
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Hot Lead">Hot Lead 🔥</option>
                          <option value="Qualified Inquiry">Qualified Inquiry</option>
                          <option value="Test-Drive Contact">Test-Drive Contact</option>
                          <option value="Converted & Booked">Converted &amp; Booked</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {(ld.status || '') === 'Test-Drive Contact' ? (
                          <button
                            onClick={() => router.push('/admin/test-drives')}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] transition-all shadow cursor-pointer inline-flex items-center gap-1.5"
                            title="Open Test Drive calendar to confirm and conduct drive"
                          >
                            <CarFront size={13} />
                            <span>Schedule Test-Drive</span>
                          </button>
                        ) : (ld.status || '').toLowerCase().includes('convert') ? (
                          <button
                            onClick={() => router.push('/admin/sales')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 font-extrabold text-[11px] hover:bg-emerald-600 hover:text-white transition-all shadow cursor-pointer inline-flex items-center gap-1.5"
                            title="Open Sales module to configure Cash vs Loan financing"
                          >
                            <CheckCircle2 size={13} />
                            <span>Proceed to Sale &amp; Financing</span>
                          </button>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleStatusChange(ld.lead_id, 'Test-Drive Contact')}
                              className="px-2 py-1 rounded-lg bg-secondary hover:bg-amber-500/20 text-amber-300 border border-border hover:border-amber-500/40 text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                              title="Customer confirmed interest in taking a test drive"
                            >
                              <CarFront size={11} />
                              <span>Test-Drive Contact</span>
                            </button>
                            <button
                              onClick={() => {
                                handleStatusChange(ld.lead_id, 'Converted & Booked');
                                router.push('/admin/sales');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] transition-all shadow cursor-pointer inline-flex items-center gap-1"
                              title="Convert lead to customer sale contract"
                            >
                              <span>Convert</span>
                              <ArrowRight size={11} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
