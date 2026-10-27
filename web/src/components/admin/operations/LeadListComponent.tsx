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
  AlertCircle,
  FileText,
  X,
  MessageSquare,
  Clock,
  MapPin
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

  // Follow-up notes state (Sales Executive & Branch Manager)
  const [selectedLeadForNote, setSelectedLeadForNote] = useState<any | null>(null);
  const [followupNote, setFollowupNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Test Drive Scheduling Modal state (Sales Executive)
  const [selectedLeadForSchedule, setSelectedLeadForSchedule] = useState<any | null>(null);
  const [scheduleDriveDate, setScheduleDriveDate] = useState('');
  const [scheduleDriveSlot, setScheduleDriveSlot] = useState('11:00 AM - 12:00 PM');
  const [scheduleDriveLocation, setScheduleDriveLocation] = useState('Showroom Dealership Hub');
  const [scheduleDriveNotes, setScheduleDriveNotes] = useState('');
  const [submittingSchedule, setSubmittingSchedule] = useState(false);

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

  // Step 2: Branch Manager assigns lead to Sales Executive
  const handleAssignEmployee = async (leadId: number, employeeId: number) => {
    try {
      await api.patch(`/leads/${leadId}`, { employee_id: Number(employeeId), status: 'Assigned' });
      const targetLead = leads.find((l) => l.lead_id === leadId);
      if (targetLead?.customer_id && targetLead?.vehicle_id) {
        try {
          const tdRes = await api.get(`/test-drives?customerId=${targetLead.customer_id}&vehicleId=${targetLead.vehicle_id}`);
          const drives = Array.isArray(tdRes.data) ? tdRes.data : [];
          if (drives.length > 0) {
            await api.patch(`/test-drives/${drives[0].test_drive_id}`, { employee_id: Number(employeeId) });
          }
        } catch { }
      }
      const targetEmp = salesExecutives.find((e) => e.employee_id === Number(employeeId));
      setLeads((prev) =>
        prev.map((ld) =>
          ld.lead_id === leadId
            ? { ...ld, employee_id: Number(employeeId), status: 'Assigned', employees: targetEmp || ld.employees }
            : ld
        )
      );
      showLocalToast(`Lead #${leadId} assigned to ${targetEmp?.first_name || 'Executive'}! Status: Assigned`, 'success');
    } catch (err) {
      showLocalToast('Failed to assign lead', 'error');
    }
  };

  // Step 3A: Sales Executive saves follow-up note
  const handleSaveFollowupNote = async () => {
    if (!selectedLeadForNote || !followupNote.trim()) return;
    setSubmittingNote(true);
    try {
      const timestamp = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const repName = user?.name || 'Sales Exec';
      const newEntry = `[${timestamp} - ${repName}]: ${followupNote.trim()}`;
      const existingRemarks = selectedLeadForNote.remarks || '';
      const updatedRemarks = existingRemarks ? `${existingRemarks}\n${newEntry}` : newEntry;
      const nextStatus = selectedLeadForNote.status === 'New' || selectedLeadForNote.status === 'Assigned' ? 'Contacted' : selectedLeadForNote.status;

      await api.patch(`/leads/${selectedLeadForNote.lead_id}`, {
        remarks: updatedRemarks,
        status: nextStatus,
      });

      setLeads((prev) =>
        prev.map((ld) =>
          ld.lead_id === selectedLeadForNote.lead_id
            ? { ...ld, remarks: updatedRemarks, status: nextStatus }
            : ld
        )
      );
      showLocalToast('Follow-up note recorded successfully!', 'success');
      setSelectedLeadForNote(null);
      setFollowupNote('');
    } catch (err: any) {
      showLocalToast('Failed to save follow-up note', 'error');
    } finally {
      setSubmittingNote(false);
    }
  };

  // Step 3B: Sales Executive contacts customer and opens interactive test drive scheduling modal
  const openScheduleTestDriveModal = (ld: any) => {
    setSelectedLeadForSchedule(ld);
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    setScheduleDriveDate(tomorrowStr);
    setScheduleDriveSlot('11:00 AM - 12:00 PM');
    setScheduleDriveLocation('Showroom Dealership Hub');
    setScheduleDriveNotes('');
  };

  const handleConfirmLeadTestDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForSchedule || !scheduleDriveDate) {
      showLocalToast('Please select a valid appointment date', 'error');
      return;
    }
    setSubmittingSchedule(true);
    const ld = selectedLeadForSchedule;
    try {
      const formattedFeedback = `[${scheduleDriveLocation} | ${scheduleDriveSlot}] ${scheduleDriveNotes || 'Customer appointment confirmed following phone discussion.'}`.trim();

      await api.patch(`/leads/${ld.lead_id}`, {
        status: 'Test-Drive Contact',
        remarks: `${ld.remarks || ''}\n[${new Date().toLocaleDateString('en-IN')}] Test Drive confirmed for ${scheduleDriveDate} (${scheduleDriveSlot}) at ${scheduleDriveLocation}`.trim(),
      });

      if (ld.customer_id && ld.vehicle_id) {
        try {
          const tdRes = await api.get(`/test-drives?customerId=${ld.customer_id}&vehicleId=${ld.vehicle_id}`);
          const drives = Array.isArray(tdRes.data) ? tdRes.data : [];
          if (drives.length > 0) {
            await api.patch(`/test-drives/${drives[0].test_drive_id}`, {
              status: 'Scheduled',
              test_drive_date: new Date(scheduleDriveDate).toISOString(),
              employee_id: ld.employee_id || user?.id,
              feedback: formattedFeedback,
            });
          } else {
            await api.post('/test-drives', {
              customer_id: ld.customer_id,
              vehicle_id: ld.vehicle_id,
              employee_id: ld.employee_id || user?.id,
              test_drive_date: new Date(scheduleDriveDate).toISOString(),
              status: 'Scheduled',
              feedback: formattedFeedback,
            });
          }
        } catch (e) {
          console.warn('Test drive schedule sync warning', e);
        }
      }

      setLeads((prev) =>
        prev.map((item) =>
          item.lead_id === ld.lead_id ? { ...item, status: 'Test-Drive Contact' } : item
        )
      );

      showLocalToast(
        `Test Drive scheduled for ${new Date(scheduleDriveDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at ${scheduleDriveSlot}!`,
        'success'
      );
      setSelectedLeadForSchedule(null);
      router.push('/admin/test-drives');
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to schedule test drive', 'error');
    } finally {
      setSubmittingSchedule(false);
    }
  };

  const filteredLeads = leads.filter((ld) => {
    if (filterInterest === 'ALL') return true;
    const s = (ld.status || '').toUpperCase();
    if (filterInterest === 'CONVERTED') return s.includes('CONVERT') || s.includes('WON') || s.includes('BOOKED') || ld.is_sold || ld.is_delivered;
    if (filterInterest === 'TEST-DRIVE') return s.includes('TEST') || s.includes('DRIVE');
    if (filterInterest === 'HOT') return s.includes('HOT');
    if (filterInterest === 'NEW') return (s.includes('NEW') || s.includes('ASSIGN')) && !ld.is_sold && !ld.is_delivered;
    if (filterInterest === 'CONTACTED') return s.includes('CONTACT');
    return s.includes(filterInterest.toUpperCase());
  });

  const fallbackConverted = leads.filter(
    (l) =>
      l.is_sold ||
      l.is_delivered ||
      ['convert', 'won', 'booked', 'deliver', 'closed'].some((term) =>
        (l.status || '').toLowerCase().includes(term)
      )
  ).length;
  const fallbackTotal = leads.length;
  const fallbackActive = Math.max(0, fallbackTotal - fallbackConverted);
  const fallbackWinRate =
    fallbackTotal > 0 ? Number(((fallbackConverted / fallbackTotal) * 100).toFixed(1)) : 0;

  const displayTotalLeads = stats && stats.totalLeads > 0 ? stats.totalLeads : fallbackTotal;
  const displayConvertedLeads = stats && stats.convertedLeads > 0 ? stats.convertedLeads : fallbackConverted;
  const displayActiveLeads = stats ? stats.activeLeads : fallbackActive;
  const displayPurchases = stats && stats.successfulPurchases > 0 ? stats.successfulPurchases : fallbackConverted;
  const displayWinRate = stats && stats.totalLeads > 0 ? stats.conversionRate : fallbackWinRate;

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
              {displayTotalLeads}
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              {displayActiveLeads} active in progress
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
              {displayConvertedLeads}
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
              {displayPurchases}
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              {stats?.pipelineSales > 0
                ? `${stats.pipelineSales} pending payment`
                : 'Verified paid & delivered'}
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
              {displayWinRate}%
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
                className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer border ${filterInterest === st
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
                <th className="py-3 px-4">Follow-up Notes</th>
                <th className="py-3 px-4">Inquiry Date</th>
                <th className="py-3 px-4">Lead Status</th>
                <th className="py-3 px-4 text-right">What To Do Next</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-foreground">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    Loading your assigned leads...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
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
                  const isNewUnassigned = ld.status === 'New' && !ld.employee_id;

                  return (
                    <tr key={ld.lead_id} className={`hover:bg-secondary/40 transition-colors ${isNewUnassigned ? 'bg-amber-500/5' : ''}`}>
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
                        {isManagerOrAdmin ? (
                          <div className="space-y-1">
                            {(!ld.employee_id || ld.status === 'New') && (
                              <span className="text-[9px] text-amber-500 font-extrabold uppercase tracking-wider block">
                                ⚠️ Needs Assignment
                              </span>
                            )}
                            <select
                              value={ld.employees?.role === 'SALES_EXECUTIVE' ? ld.employee_id : (ld.employee_id || '')}
                              onChange={(e) => handleAssignEmployee(ld.lead_id, Number(e.target.value))}
                              className="bg-secondary border border-border text-foreground text-[11px] font-bold rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:border-purple-400"
                            >
                              <option value="">-- Assign Sales Executive --</option>
                              {salesExecutives.map((emp) => (
                                <option key={emp.employee_id} value={emp.employee_id}>
                                  {emp.first_name} {emp.last_name || ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                            <UserCheck size={13} className="text-emerald-400" />
                            <span>{assignedRepName}</span>
                          </div>
                        )}
                      </td>

                      {/* FOLLOW-UP NOTES COLUMN */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLeadForNote(ld);
                              setFollowupNote('');
                            }}
                            className="px-2 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border text-[10px] font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                            title="Click to view history or add follow-up note"
                          >
                            <FileText size={11} className="text-purple-400" />
                            <span>Notes</span>
                          </button>
                          <span className="text-[10px] text-muted-foreground truncate" title={ld.remarks || 'No notes recorded'}>
                            {ld.remarks ? ld.remarks.split('\n').pop() : 'No notes'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">
                        {inqDate}
                      </td>

                      <td className="py-3.5 px-4">
                        {ld.is_sold || (ld.status || '').toLowerCase().includes('convert') ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 w-fit">
                            <CheckCircle2 size={12} />
                            {ld.is_delivered ? 'Delivered & Completed' : 'Converted & Booked'}
                          </span>
                        ) : isManagerOrAdmin ? (
                          <select
                            value={ld.status || 'New'}
                            onChange={(e) => handleStatusChange(ld.lead_id, e.target.value)}
                            className="bg-secondary border border-border text-foreground text-[11px] font-bold rounded-lg px-2.5 py-1 cursor-pointer focus:outline-none focus:border-purple-400"
                          >
                            <option value="New">New</option>
                            <option value="Assigned">Assigned</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Hot Lead">Hot Lead 🔥</option>
                            <option value="Qualified Inquiry">Qualified Inquiry</option>
                            <option value="Test-Drive Contact">Test-Drive Contact</option>
                            <option value="Converted & Booked">Converted &amp; Booked</option>
                            <option value="Lost">Lost</option>
                          </select>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                            ld.status === 'New' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            ld.status === 'Assigned' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            ld.status === 'Contacted' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                            ld.status === 'Test-Drive Contact' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                            'bg-secondary text-foreground border-border'
                          }`}>
                            {ld.status || 'New'}
                          </span>
                        )}
                      </td>

                      {/* ACTION COLUMN */}
                      <td className="py-3.5 px-4 text-right">
                        {ld.is_sold || (ld.status || '').toLowerCase().includes('convert') ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] flex items-center gap-1">
                              <CheckCircle2 size={12} />
                              {ld.is_delivered ? 'Delivered' : 'Sale Converted'}
                            </span>
                            {isManagerOrAdmin && (
                              <button
                                onClick={() => router.push('/admin/sales')}
                                className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                                title="View finalized sales contract in Sales Operations"
                              >
                                <span>Contract #{ld.sale_id || ''}</span>
                                <ArrowRight size={11} />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* SALES EXECUTIVE ACTION: Contact & Schedule Test Drive */}
                            <button
                              type="button"
                              onClick={() => openScheduleTestDriveModal(ld)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] transition-all shadow cursor-pointer inline-flex items-center gap-1"
                              title="Contact customer, choose appointment date & time slot, and schedule test drive"
                            >
                              <Calendar size={12} />
                              <span>Schedule Test-Drive</span>
                            </button>

                            {/* SALES EXECUTIVE ACTION: Add Note */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLeadForNote(ld);
                                setFollowupNote('');
                              }}
                              className="px-2 py-1.5 rounded-lg bg-secondary hover:bg-purple-500/20 text-purple-300 border border-border hover:border-purple-500/40 text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                              title="Add customer follow-up notes"
                            >
                              <FileText size={12} />
                              <span>+ Note</span>
                            </button>

                            {/* MANAGER CONVERT ACTION */}
                            {isManagerOrAdmin && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleStatusChange(ld.lead_id, 'Converted & Booked');
                                  router.push('/admin/sales');
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] transition-all shadow cursor-pointer inline-flex items-center gap-1"
                                title="Convert lead directly to showroom sales contract"
                              >
                                <span>Convert</span>
                                <ArrowRight size={11} />
                              </button>
                            )}
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

      {/* ─────────────────────────────────────────────────────────────
          FOLLOW-UP NOTES MODAL (SALES EXECUTIVE & MANAGER)
      ───────────────────────────────────────────────────────────── */}
      {selectedLeadForNote && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-foreground font-display">
                    Follow-Up Notes &bull; Lead #LD-{selectedLeadForNote.lead_id}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Customer: {selectedLeadForNote.customers?.first_name} {selectedLeadForNote.customers?.last_name || ''} ({selectedLeadForNote.customers?.phone || 'Walk-in'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLeadForNote(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Note History */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Previous Follow-up History</label>
              <div className="p-3 bg-secondary/50 border border-border rounded-xl text-xs max-h-48 overflow-y-auto space-y-1 font-mono whitespace-pre-wrap text-foreground">
                {selectedLeadForNote.remarks || 'No previous follow-up notes recorded.'}
              </div>
            </div>

            {/* New Note Input */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Add New Follow-Up Note *</label>
              <textarea
                rows={3}
                value={followupNote}
                onChange={(e) => setFollowupNote(e.target.value)}
                placeholder="e.g. Spoke to customer, verified budget ₹9L, scheduled Sunday 3 PM test drive..."
                className="w-full p-2.5 bg-secondary border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setSelectedLeadForNote(null)}
                className="px-4 py-2 bg-secondary text-muted-foreground font-bold text-xs rounded-xl hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingNote || !followupNote.trim()}
                onClick={handleSaveFollowupNote}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {submittingNote ? 'Saving...' : 'Save Follow-Up Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SCHEDULE TEST DRIVE MODAL (SALES EXECUTIVE)
          Explicitly choose appointment date, slot & customer preferences
      ───────────────────────────────────────────────────────────── */}
      {selectedLeadForSchedule && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-foreground font-display">
                    Schedule Test Drive &bull; Lead #LD-{selectedLeadForSchedule.lead_id}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Customer: {selectedLeadForSchedule.customers?.first_name} {selectedLeadForSchedule.customers?.last_name || ''} ({selectedLeadForSchedule.customers?.phone || 'Walk-in'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLeadForSchedule(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Vehicle Summary Banner */}
            <div className="p-3 bg-secondary/40 border border-border rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CarFront size={16} className="text-amber-400" />
                <span className="text-xs font-bold text-foreground">
                  {selectedLeadForSchedule.vehicles?.make} {selectedLeadForSchedule.vehicles?.model} ({selectedLeadForSchedule.vehicles?.manufacture_year || ''})
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                Assigned Rep: {user?.name || 'Sales Exec'}
              </span>
            </div>

            <form onSubmit={handleConfirmLeadTestDrive} className="space-y-4">
              {/* Test Drive Date Picker */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Calendar size={13} className="text-amber-400" />
                  Select Test Drive Appointment Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={scheduleDriveDate}
                  onChange={(e) => setScheduleDriveDate(e.target.value)}
                  className="input-base w-full text-xs py-2 px-3 bg-background border border-border rounded-xl font-bold cursor-pointer"
                />
              </div>

              {/* Time Slot Selector */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Clock size={13} className="text-amber-400" />
                  Select Preferred Time Slot <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    '10:00 AM - 11:00 AM',
                    '11:30 AM - 12:30 PM',
                    '02:00 PM - 03:00 PM',
                    '03:30 PM - 04:30 PM',
                    '05:00 PM - 06:00 PM',
                    '06:30 PM - 07:30 PM',
                  ].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setScheduleDriveSlot(slot)}
                      className={`px-2.5 py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                        scheduleDriveSlot === slot
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm font-black'
                          : 'bg-secondary/40 text-muted-foreground border-border hover:border-amber-500/40 hover:text-foreground'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Type */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <MapPin size={13} className="text-amber-400" />
                  Drive Location
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Showroom Dealership Hub', label: 'Showroom Dealership Hub' },
                    { id: 'Customer Doorstep Test Drive', label: 'Customer Doorstep Trial' },
                  ].map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => setScheduleDriveLocation(loc.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        scheduleDriveLocation === loc.id
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/50'
                          : 'bg-secondary/40 text-muted-foreground border-border hover:border-border/80'
                      }`}
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Discussion & Call Notes */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Customer Call Notes / Discussion Points
                </label>
                <textarea
                  value={scheduleDriveNotes}
                  onChange={(e) => setScheduleDriveNotes(e.target.value)}
                  placeholder="e.g. Customer confirmed Saturday visit. Interested in city traffic handling and highway ride quality."
                  className="input-base w-full h-20 text-xs py-2 px-3 resize-none bg-background border border-border rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSelectedLeadForSchedule(null)}
                  className="px-4 py-2 bg-secondary text-muted-foreground font-bold text-xs rounded-xl hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSchedule || !scheduleDriveDate}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Calendar size={13} />
                  <span>{submittingSchedule ? 'Scheduling...' : 'Confirm & Schedule Appointment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
