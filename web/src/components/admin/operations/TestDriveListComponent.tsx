'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../store/useAuthStore';
import { showLocalToast } from '../../Toast';
import { usePermissions } from '../../../hooks/usePermissions';
import { 
  CarFront, 
  Calendar, 
  Clock, 
  User, 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  Star, 
  RefreshCw, 
  Play, 
  PhoneCall, 
  DollarSign, 
  UserCheck, 
  Phone, 
  AlertCircle,
  X,
  MapPin,
  FileText,
} from 'lucide-react';

interface TestDriveListComponentProps {
  onMoveToDelivery?: (item: any) => void;
}

export function TestDriveListComponent({ onMoveToDelivery }: TestDriveListComponentProps) {
  const router = useRouter();
  const permissions = usePermissions();
  const { user } = useAuthStore();
  const [testDrives, setTestDrives] = useState<any[]>([]);
  const [salesExecutives, setSalesExecutives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Schedule / Reschedule appointment modal state (Sales Executive)
  const [schedulingDrive, setSchedulingDrive] = useState<any | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTimeSlot, setScheduleTimeSlot] = useState('11:00 AM - 12:00 PM');
  const [driveLocationType, setDriveLocationType] = useState('Showroom Dealership Hub');
  const [executiveNotes, setExecutiveNotes] = useState('');
  const [submittingSchedule, setSubmittingSchedule] = useState(false);

  // Deal Handover modal state (Sales Executive -> Branch Manager)
  const [tokenDrive, setTokenDrive] = useState<any | null>(null);
  const [advanceRemarks, setAdvanceRemarks] = useState<string>('');
  const [submittingAdvance, setSubmittingAdvance] = useState<boolean>(false);

  const isBranchManagerOrAdmin = user?.role === 'BRANCH_MANAGER' || user?.role === 'SYSTEM_ADMIN' || user?.role === 'ADMIN';
  const isSalesExecutive = user?.role === 'SALES_EXECUTIVE';

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees?role=SALES_EXECUTIVE');
      const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setSalesExecutives(list);
    } catch {
      // Ignore fallback
    }
  };

  const fetchTestDrives = async () => {
    setLoading(true);
    try {
      const res = await api.get('/test-drives');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setTestDrives(res.data);
      } else {
        setTestDrives([]);
      }
    } catch (err) {
      console.warn('Fallback to sample test drive list:', err);
      setTestDrives([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestDrives();
    if (isBranchManagerOrAdmin) {
      fetchEmployees();
    }
  }, [isBranchManagerOrAdmin]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await api.patch(`/test-drives/${id}`, { status: newStatus });
      setTestDrives((prev) =>
        prev.map((td) => (td.test_drive_id === id ? { ...td, status: newStatus } : td))
      );
      showLocalToast(`Test Drive #${id} updated to ${newStatus}`, 'success');
    } catch {
      showLocalToast('Failed to update status', 'error');
    }
  };

  // Step 2 & 3: Sales Executive contacts customer and opens interactive scheduling modal
  const openScheduleModal = (td: any) => {
    setSchedulingDrive(td);
    const existingDate = td.test_drive_date ? new Date(td.test_drive_date).toISOString().split('T')[0] : '';
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    setScheduleDate(existingDate || tomorrowStr);
    setScheduleTimeSlot('11:00 AM - 12:00 PM');
    setDriveLocationType('Showroom Dealership Hub');
    setExecutiveNotes(td.feedback || '');
  };

  const handleConfirmSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingDrive || !scheduleDate) {
      showLocalToast('Please select a valid appointment date', 'error');
      return;
    }
    setSubmittingSchedule(true);
    try {
      const formattedFeedback = `[${driveLocationType} | ${scheduleTimeSlot}] ${executiveNotes || 'Appointment confirmed after customer contact by Sales Executive.'}`.trim();
      await api.patch(`/test-drives/${schedulingDrive.test_drive_id}`, {
        status: 'Scheduled',
        test_drive_date: new Date(scheduleDate).toISOString(),
        feedback: formattedFeedback,
        employee_id: schedulingDrive.employee_id || user?.id,
      });

      setTestDrives((prev) =>
        prev.map((td) =>
          td.test_drive_id === schedulingDrive.test_drive_id
            ? {
                ...td,
                status: 'Scheduled',
                test_drive_date: scheduleDate,
                feedback: formattedFeedback,
              }
            : td
        )
      );

      showLocalToast(
        `Test Drive #${schedulingDrive.test_drive_id} confirmed for ${new Date(scheduleDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at ${scheduleTimeSlot}!`,
        'success'
      );
      setSchedulingDrive(null);
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to schedule test drive', 'error');
    } finally {
      setSubmittingSchedule(false);
    }
  };

  // Step 4: Sales Executive hands the deal over to the Branch Manager.
  // No money is recorded here - the Branch Manager collects the token advance in Deals & Payments.
  const openHandoverModal = (td: any) => {
    setTokenDrive(td);
    setAdvanceRemarks(`Customer completed Test Drive #${td.test_drive_id}. Ready for booking.`);
  };

  const handleHandoverDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenDrive) return;

    setSubmittingAdvance(true);
    try {
      const td = tokenDrive;
      const price = Number(td.vehicles?.price || 500000);
      const res = await api.post('/sales', {
        customer_id: td.customer_id,
        vehicle_id: td.vehicle_id,
        employee_id: td.employee_id || user?.id,
        branch_id: td.vehicles?.branch_id || td.employees?.branch_id || 1,
        final_amount: price,
        selling_price: price,
        token_advance: 0,
        payment_status: 'Pending',
        remarks: advanceRemarks || `Handed over from completed Test Drive #${td.test_drive_id}. Token advance pending.`,
      });

      const newSaleId = res.data?.sale_id;
      showLocalToast(`Deal #${newSaleId} handed over to Branch Manager for token advance & payment.`, 'success');
      setTokenDrive(null);
      await fetchTestDrives();
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to hand over deal', 'error');
    } finally {
      setSubmittingAdvance(false);
    }
  };

  // Filter test drives for current Sales Executive vs all
  const scopedTestDrives = testDrives.filter((td) => {
    if (isSalesExecutive) {
      // Show drives assigned to this executive or unassigned
      return td.employee_id === user?.id || !td.employee_id;
    }
    return true;
  });

  // Triage queue: uncontacted requests
  const uncontactedDrives = scopedTestDrives.filter((td) => {
    const st = String(td.status || '').toLowerCase();
    return st.includes('pending') || st.includes('request') || st === 'new';
  });

  // Active drives: contacted / scheduled
  const activeTestDrives = scopedTestDrives.filter((td) => {
    const st = String(td.status || '').toLowerCase();
    return !st.includes('pending') && !st.includes('request') && st !== 'new';
  });

  const filteredActiveDrives = activeTestDrives.filter((td) => {
    if (filterStatus === 'ALL') return true;
    return (td.status || '').toUpperCase() === filterStatus.toUpperCase();
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Role separation banner for Branch Manager / Admin */}
      {isBranchManagerOrAdmin && (
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 flex items-start sm:items-center gap-3">
          <AlertCircle size={18} className="text-blue-700 dark:text-blue-400 flex-shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <strong className="text-text-primary block sm:inline">Role Separation Notice: </strong>
            Test drives and road trials are handled directly by Sales Executives. As Branch Manager, you assign leads in <span className="text-blue-800 dark:text-blue-200 font-bold">Leads &amp; Follow-ups</span> and collect token advances and payments in <span className="text-blue-800 dark:text-blue-200 font-bold">Deals &amp; Payments</span>. Vehicle deliveries are handled by Sales Executives and Admin.
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: UNCONTACTED REQUESTS (STEP 3)
          Sales Executive makes the follow-up note & test drive contact
      ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 overflow-hidden shadow-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 flex items-center justify-center font-bold">
              <PhoneCall size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-text-primary">
                  Customer Test Drive Contacts &bull; Awaiting Executive Call ({uncontactedDrives.length})
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700 uppercase">
                  Step 3 Contact Queue
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Customer test drive inquiries assigned to you. Call customer to verify appointment, then move to active Test Drive schedule.
              </p>
            </div>
          </div>
        </div>

        {uncontactedDrives.length === 0 ? (
          <div className="py-6 px-4 text-center text-text-secondary text-xs bg-bg-surface-alt rounded-xl border border-border font-medium">
            ✓ Zero pending contacts. All customer test drive inquiries have been called and scheduled.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b-2 border-border bg-bg-surface-alt text-text-primary uppercase text-[11px] tracking-wider font-extrabold">
                  <th className="py-3 px-3 font-black">Inquiry ID</th>
                  <th className="py-3 px-3 font-black">Customer</th>
                  <th className="py-3 px-3 font-black">Vehicle</th>
                  <th className="py-3 px-3 font-black">Requested Date</th>
                  <th className="py-3 px-3 font-black">Assigned Sales Executive</th>
                  <th className="py-3 px-3 text-right font-black">Executive Action (Step 3)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-text-primary">
                {uncontactedDrives.map((td) => {
                  const cName = td.customers
                    ? `${td.customers.first_name} ${td.customers.last_name || ''}`.trim()
                    : td.customer_name || 'Customer';
                  const vName = td.vehicles
                    ? `${td.vehicles.make} ${td.vehicles.model} (${td.vehicles.manufacture_year || ''})`
                    : td.vehicle_name || 'Vehicle Model';
                  const assignedRepName = td.employees
                    ? `${td.employees.first_name} ${td.employees.last_name || ''}`.trim()
                    : 'Unassigned';

                  return (
                    <tr key={td.test_drive_id} className="hover:bg-bg-surface-alt/70 transition-colors border-b border-border/80">
                      <td className="py-3 px-3 font-mono font-black text-amber-800 dark:text-amber-300">
                        #INQ-{td.test_drive_id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-black text-text-primary flex items-center gap-1.5 text-xs">
                          <User size={13} className="text-text-secondary shrink-0" />
                          <span>{cName}</span>
                        </div>
                        <span className="text-[11px] text-text-secondary font-mono font-bold block mt-0.5">{td.customers?.phone || td.phone || '9840112233'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-black text-text-primary text-xs">{vName}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-text-primary text-xs">
                        {td.test_drive_date ? new Date(td.test_drive_date).toLocaleDateString() : 'Today'}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                          <UserCheck size={13} className={td.employee_id === user?.id ? 'text-status-success' : 'text-text-secondary'} />
                          <span>
                            {assignedRepName}
                            {td.employee_id === user?.id && (
                              <span className="ml-1 text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-400 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded font-black">
                                YOU
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => openScheduleModal(td)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow cursor-pointer inline-flex items-center gap-1.5"
                          title="Call customer, select appointment date & time slot, and confirm test drive"
                        >
                          <Calendar size={13} />
                          <span>Schedule Test Drive Date &bull; Call Customer</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: ACTIVE & SCHEDULED TEST DRIVES (STEP 3 & 4)
          Sales Executive executes drive & hands over deal to Branch Manager
      ───────────────────────────────────────────────────────────── */}
      <div className="rounded-lg bg-bg-surface border border-border overflow-hidden space-y-4 font-sans p-5">
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge-info text-xs">
                Step 3 &amp; 4 Execution
              </span>
              <span className="text-xs text-text-secondary font-bold">
                Customer Test Drive Trials
              </span>
            </div>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 mt-1">
              <CarFront size={18} className="text-accent" /> Active Customer Test Drives Schedule ({filteredActiveDrives.length})
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Contacted customer drives conducted by Sales Executives. On drive completion, move deal to Branch Manager for payment handling.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {['ALL', 'SCHEDULED', 'IN PROGRESS', 'COMPLETED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  filterStatus === st
                    ? 'btn-primary'
                    : 'btn-neutral'
                }`}
              >
                {st}
              </button>
            ))}
            <button
              onClick={fetchTestDrives}
              className="btn-neutral p-1.5 rounded-lg"
              title="Refresh List"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* Test Drives Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-bg-surface-alt text-text-secondary uppercase text-xs tracking-wider font-bold">
                <th className="py-3 px-4">Test Drive ID</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Vehicle &amp; Branch</th>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4">Drive Status</th>
                <th className="py-3 px-4">Assigned Sales Exec</th>
                <th className="py-3 px-4">Review &amp; Rating</th>
                <th className="py-3 px-4 text-right">Workflow Action (Step 4)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text-primary">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-text-secondary">
                    Loading active test drive records...
                  </td>
                </tr>
              ) : filteredActiveDrives.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-text-secondary">
                    No active test drives matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredActiveDrives.map((td) => {
                  const cName = td.customers
                    ? `${td.customers.first_name} ${td.customers.last_name || ''}`.trim()
                    : td.customer_name || 'Customer';
                  const vName = td.vehicles
                    ? `${td.vehicles.make} ${td.vehicles.model} (${td.vehicles.manufacture_year || ''})`
                    : td.vehicle_name || 'Vehicle Model';
                  const branch = td.employees?.branches?.branch_name || td.branch_name || 'CarRevive Hub';
                  const status = (td.status || 'Scheduled').toLowerCase();
                  const rating = td.rating;
                  const feedback = td.feedback;
                  const assignedRepName = td.employees
                    ? `${td.employees.first_name} ${td.employees.last_name || ''}`.trim()
                    : 'Unassigned';

                  return (
                    <tr key={td.test_drive_id} className="hover:bg-bg-surface-alt transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-text-primary">
                        #TD-{td.test_drive_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-text-primary flex items-center gap-1.5">
                          <User size={13} className="text-text-secondary" />
                          <span>{cName}</span>
                        </div>
                        <span className="text-xs text-text-secondary font-mono">{td.customers?.phone || td.phone || '9840112233'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-text-primary">{vName}</div>
                        <span className="text-xs text-text-secondary flex items-center gap-1">
                          <Building2 size={10} /> {branch}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-text-secondary">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-bold text-text-primary text-xs flex items-center gap-1">
                              <Calendar size={11} className="text-amber-800 dark:text-amber-400" />
                              <span>
                                {td.test_drive_date ? new Date(td.test_drive_date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'}
                              </span>
                            </div>
                            {td.feedback && td.feedback.includes('[') && (
                              <span className="text-[10px] text-amber-800 dark:text-amber-400 font-semibold block truncate max-w-[150px]" title={td.feedback}>
                                {td.feedback.split(']')[0].replace('[', '')}
                              </span>
                            )}
                          </div>
                          {status !== 'completed' && !td.sale_id && !td.is_purchased && (
                            <button
                              onClick={() => openScheduleModal(td)}
                              className="p-1 rounded bg-secondary hover:bg-amber-500/20 text-text-secondary hover:text-amber-900 dark:hover:text-amber-400 border border-border text-[10px] transition-colors cursor-pointer"
                              title="Reschedule appointment date or time slot"
                            >
                              <Calendar size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={td.status || 'Scheduled'}
                          onChange={(e) => handleStatusChange(td.test_drive_id, e.target.value)}
                          className="input-base text-xs py-1 px-2.5 cursor-pointer font-bold"
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                          <UserCheck size={13} className={td.employee_id === user?.id ? 'text-status-success' : 'text-text-secondary'} />
                          <span>
                            {assignedRepName}
                            {td.employee_id === user?.id && (
                              <span className="ml-1.5 text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-400 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded font-black">
                                YOU
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {rating ? (
                          <div className="space-y-0.5">
                            <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-black text-xs">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {rating}/5
                            </span>
                            {feedback && (
                              <p className="text-[11px] text-text-secondary max-w-xs truncate italic font-medium">
                                "{feedback}"
                              </p>
                            )}
                          </div>
                        ) : status === 'completed' ? (
                          <span className="text-[11px] text-text-secondary italic font-medium">
                            Review pending from customer
                          </span>
                        ) : (
                          <span className="text-[11px] text-text-secondary font-medium">
                            Available after drive
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {/* SALE / WORKFLOW ACTIONS */}
                        {td.sale_converted || td.is_purchased ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-400 dark:bg-emerald-950 dark:text-emerald-200 flex items-center gap-1">
                              <CheckCircle2 size={13} className="text-emerald-700 dark:text-emerald-400" /> Vehicle Delivered &amp; Handed Over
                            </span>
                          </div>
                        ) : td.is_scheduled || (td.delivery_status || '').toLowerCase().includes('schedule') ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-sky-100 text-sky-900 border border-sky-400 dark:bg-sky-950 dark:text-sky-200 flex items-center gap-1">
                              <CheckCircle2 size={13} className="text-sky-700 dark:text-sky-400" /> Moved to Delivery Schedule
                            </span>
                            {permissions.canAccessDeliveries && (
                              <button
                                onClick={() => router.push('/admin/deliveries')}
                                className="px-2.5 py-1 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                                title="Vehicle moved to delivery. Open deliveries hub"
                              >
                                <span>Go to Deliveries &rarr;</span>
                              </button>
                            )}
                          </div>
                        ) : td.is_reserved && Number(td.token_advance || 0) > 0 ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-400 dark:bg-amber-950 dark:text-amber-200 flex items-center gap-1">
                              <CheckCircle2 size={13} className="text-amber-700 dark:text-amber-400" />
                              Reserved (₹{Number(td.token_advance).toLocaleString('en-IN')} Token Advance Paid)
                            </span>
                            {td.sale_id && (
                              <button
                                onClick={() => router.push('/admin/sales')}
                                className="px-2.5 py-1 rounded-lg bg-bg-surface hover:bg-bg-surface-alt text-text-primary border border-border text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                                title="View sales contract"
                              >
                                <span>Contract #{td.sale_id}</span>
                                <ArrowRight size={11} />
                              </button>
                            )}
                          </div>
                        ) : td.sale_id ? (
                          /* Sale Initiated, Token Advance Pending -> User can enter token advance now */
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-400 dark:bg-blue-950 dark:text-blue-200 flex items-center gap-1">
                              <Clock size={13} className="text-blue-700 dark:text-blue-400" /> Handed Over &bull; Awaiting Branch Manager
                            </span>
                            <button
                              onClick={() => router.push('/admin/sales')}
                              className="px-2.5 py-1 rounded-lg bg-bg-surface hover:bg-bg-surface-alt text-text-primary border border-border text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                              title="View sales contract"
                            >
                              <span>Contract #{td.sale_id}</span>
                              <ArrowRight size={11} />
                            </button>
                          </div>
                        ) : status === 'scheduled' ? (
                          <button
                            onClick={() => handleStatusChange(td.test_drive_id, 'In Progress')}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] transition-all shadow cursor-pointer inline-flex items-center gap-1"
                            title="Start customer test drive"
                          >
                            <Play size={11} fill="currentColor" />
                            <span>Start Drive</span>
                          </button>
                        ) : status === 'in progress' ? (
                          <button
                            onClick={() => handleStatusChange(td.test_drive_id, 'Completed')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] transition-all shadow cursor-pointer inline-flex items-center gap-1"
                            title="Mark test drive completed"
                          >
                            <CheckCircle2 size={12} />
                            <span>Complete Drive</span>
                          </button>
                        ) : (
                          /* Status Completed: Sales Executive hands the deal over to Branch Manager (Deals & Payments) */
                          <button
                            onClick={() => openHandoverModal(td)}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-[11px] transition-all shadow cursor-pointer inline-flex items-center gap-1.5"
                            title="Drive completed! Hand over deal to Branch Manager for token advance & payment"
                          >
                            <span>Hand Over to Branch Manager</span>
                            <ArrowRight size={13} />
                          </button>
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
          SCHEDULE / RESCHEDULE TEST DRIVE APPOINTMENT MODAL (SALES EXECUTIVE)
      ───────────────────────────────────────────────────────────── */}
      {schedulingDrive && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/20">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-foreground font-display">
                    Schedule Test Drive &bull; Appointment #{schedulingDrive.test_drive_id}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Customer: {schedulingDrive.customers ? `${schedulingDrive.customers.first_name} ${schedulingDrive.customers.last_name || ''}`.trim() : 'Customer'} ({schedulingDrive.customers?.phone || 'Phone Pending'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSchedulingDrive(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Vehicle Summary Banner */}
            <div className="p-3 bg-secondary/40 border border-border rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CarFront size={16} className="text-amber-800 dark:text-amber-400" />
                <span className="text-xs font-bold text-foreground">
                  {schedulingDrive.vehicles?.make} {schedulingDrive.vehicles?.model} ({schedulingDrive.vehicles?.manufacture_year || ''})
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                Assigned Rep: {user?.name || 'Sales Exec'}
              </span>
            </div>

            <form onSubmit={handleConfirmSchedule} className="space-y-4">
              {/* Test Drive Date Picker */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Calendar size={13} className="text-amber-800 dark:text-amber-400" />
                  Select Test Drive Appointment Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="input-base w-full text-xs py-2 px-3 bg-background border border-border rounded-xl font-bold cursor-pointer"
                />
              </div>

              {/* Time Slot Selector */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Clock size={13} className="text-amber-800 dark:text-amber-400" />
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
                      onClick={() => setScheduleTimeSlot(slot)}
                      className={`px-2.5 py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                        scheduleTimeSlot === slot
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
                  <MapPin size={13} className="text-amber-800 dark:text-amber-400" />
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
                      onClick={() => setDriveLocationType(loc.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        driveLocationType === loc.id
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/50'
                          : 'bg-secondary/40 text-muted-foreground border-border hover:border-border/80'
                      }`}
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discussion & Call Notes */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Customer Discussion &amp; Appointment Notes
                </label>
                <textarea
                  value={executiveNotes}
                  onChange={(e) => setExecutiveNotes(e.target.value)}
                  placeholder="e.g. Customer agreed to appointment slot; requested automatic transmission demonstration."
                  className="input-base w-full h-20 text-xs py-2 px-3 resize-none bg-background border border-border rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSchedulingDrive(null)}
                  className="px-4 py-2 bg-secondary text-muted-foreground font-bold text-xs rounded-xl hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSchedule || !scheduleDate}
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

      {/* ─────────────────────────────────────────────────────────────
          DEAL HANDOVER MODAL (SALES EXECUTIVE)
          Sales Executive hands the deal to the Branch Manager.
          Token advance & payments are recorded by the Branch Manager in Deals & Payments.
      ───────────────────────────────────────────────────────────── */}
      {tokenDrive && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <ArrowRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-foreground font-display">
                    Hand Over Deal to Branch Manager
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Test Drive #{tokenDrive.test_drive_id} &bull; Moves to Deals &amp; Payments
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTokenDrive(null)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface-alt transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-bg-surface-alt border border-border grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[11px] text-text-secondary font-medium block">Customer</span>
                <span className="font-bold text-text-primary flex items-center gap-1 mt-0.5">
                  <User size={13} className="text-accent" />
                  {tokenDrive.customers
                    ? `${tokenDrive.customers.first_name} ${tokenDrive.customers.last_name || ''}`.trim()
                    : 'Customer'}
                </span>
                <span className="text-[10px] text-text-secondary font-mono">
                  {tokenDrive.customers?.phone || 'Phone Pending'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-text-secondary font-medium block">Vehicle of Interest</span>
                <span className="font-bold text-text-primary flex items-center gap-1 mt-0.5">
                  <CarFront size={13} className="text-accent" />
                  {tokenDrive.vehicles
                    ? `${tokenDrive.vehicles.make} ${tokenDrive.vehicles.model}`
                    : 'Vehicle'}
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Showroom Price: ₹{Number(tokenDrive.vehicles?.price || 500000).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-text-secondary flex items-start gap-2">
              <AlertCircle size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <span>
                The Branch Manager will collect and record the customer&apos;s token advance and payments in
                <strong className="text-text-primary"> Deals &amp; Payments</strong>.
              </span>
            </div>

            <form onSubmit={handleHandoverDeal} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary block">
                  Notes for Branch Manager
                </label>
                <textarea
                  rows={3}
                  value={advanceRemarks}
                  onChange={(e) => setAdvanceRemarks(e.target.value)}
                  placeholder="e.g. Customer liked the car, wants to book this week. Prefers UPI payment."
                  className="w-full p-2.5 rounded-xl bg-bg-surface border border-border text-text-primary text-xs font-medium focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setTokenDrive(null)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-bg-surface-alt transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdvance}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {submittingAdvance ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      <ArrowRight size={14} />
                      <span>Hand Over to Branch Manager</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
