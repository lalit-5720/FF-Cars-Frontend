'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { showLocalToast } from '../../Toast';
import { useAuthStore } from '../../../store/useAuthStore';
import { formatKey, getHandoverState, stripDateMarker, todayKey } from './deliveryDate';
import { intRange } from '../../../lib/validation';
import { 
  PackageCheck, 
  CheckCircle2, 
  Clock, 
  User, 
  Building2, 
  Car, 
  RefreshCw, 
  FileText, 
  X, 
  Loader2, 
  Calendar,
  UserCheck,
  ShieldCheck,
  Key,
  FileCheck2,
  AlertCircle
} from 'lucide-react';

interface DeliveryListComponentProps {
  initialDeliveriesList?: any[];
}

export function DeliveryListComponent({ initialDeliveriesList }: DeliveryListComponentProps) {
  const { user } = useAuthStore();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [salesExecutives, setSalesExecutives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');

  // Handover action modal state (For Sales Executive)
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [odometerInput, setOdometerInput] = useState<number | string>('');
  const [notesInput, setNotesInput] = useState('');
  const [statusInput, setStatusInput] = useState('Delivered');
  const [customerReceivedInput, setCustomerReceivedInput] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Delivery date drafts (Sales Executive picks a date after calling the customer, then confirms)
  const [dateDrafts, setDateDrafts] = useState<Record<number, string>>({});
  const [confirmingDateId, setConfirmingDateId] = useState<number | null>(null);

  // PDI Checklist state in Handover Modal
  const [pdiChecked, setPdiChecked] = useState(true);
  const [keysChecked, setKeysChecked] = useState(true);
  const [docsChecked, setDocsChecked] = useState(true);
  const [kitChecked, setKitChecked] = useState(true);

  const isBranchManagerOrAdmin = user?.role === 'BRANCH_MANAGER' || user?.role === 'SYSTEM_ADMIN' || user?.role === 'ADMIN';
  const isSalesExecutive = user?.role === 'SALES_EXECUTIVE';

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees?role=SALES_EXECUTIVE');
      const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setSalesExecutives(list);
    } catch {
      // Fallback
    }
  };

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/deliveries');
      if (res.data && Array.isArray(res.data)) {
        setDeliveries(res.data);
      } else if (initialDeliveriesList && initialDeliveriesList.length > 0) {
        setDeliveries(initialDeliveriesList);
      } else {
        setDeliveries([]);
      }
    } catch (err) {
      console.warn('Failed to load deliveries from API:', err);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
    if (isBranchManagerOrAdmin) {
      fetchEmployees();
    }
  }, [isBranchManagerOrAdmin]);

  // Branch Manager Step 5: Assign Sales Executive to handle the physical delivery
  const handleAssignExecutive = async (deliveryId: number, employeeId: number) => {
    try {
      await api.patch(`/deliveries/${deliveryId}`, { delivered_by: Number(employeeId) });
      const emp = salesExecutives.find((e) => e.employee_id === Number(employeeId));
      setDeliveries((prev) =>
        prev.map((d) =>
          d.delivery_id === deliveryId
            ? { ...d, delivered_by: Number(employeeId), employees: emp || d.employees }
            : d
        )
      );
      showLocalToast(
        `Delivery #${deliveryId} assigned to ${emp?.first_name || 'Sales Executive'} for customer handover!`,
        'success'
      );
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to assign executive', 'error');
    }
  };

  // Sales Executive: confirm the delivery date after calling the customer
  const handleConfirmDeliveryDate = async (deliveryId: number, dateStr: string) => {
    if (!dateStr) {
      showLocalToast('Please pick a delivery date', 'error');
      return;
    }
    setConfirmingDateId(deliveryId);
    try {
      const res = await api.patch(`/deliveries/${deliveryId}`, { delivery_date: dateStr });
      setDeliveries((prev) =>
        prev.map((d) => (d.delivery_id === deliveryId ? { ...d, ...res.data } : d))
      );
      setDateDrafts((prev) => {
        const next = { ...prev };
        delete next[deliveryId];
        return next;
      });
      showLocalToast(
        `Delivery #${deliveryId} confirmed with customer for ${formatKey(dateStr)}. Handover opens on that date.`,
        'success'
      );
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to confirm delivery date', 'error');
    } finally {
      setConfirmingDateId(null);
    }
  };

  const openHandoverModal = (del: any) => {
    setSelectedDelivery(del);
    setOdometerInput(del.odometer_reading || del.sales?.vehicles?.kilometers_driven || 14000);
    setNotesInput(stripDateMarker(del.delivery_notes) || 'Vehicle inspected, documents verified, keys handed over.');
    setStatusInput('Delivered');
    setCustomerReceivedInput(true);
    setPdiChecked(true);
    setKeysChecked(true);
    setDocsChecked(true);
    setKitChecked(true);
  };

  const closeHandoverModal = () => {
    setSelectedDelivery(null);
  };

  // Sales Executive Step 5: Execute car delivery based on customer date
  const handleHandoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery) return;

    const odoErr = intRange(odometerInput, 'Odometer reading', 0, 2_000_000, true);
    if (odoErr) {
      showLocalToast(odoErr, 'error');
      return;
    }
    if (!pdiChecked || !keysChecked || !docsChecked || !kitChecked) {
      showLocalToast('Please verify all pre-delivery inspection & handover checklist items', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.patch(`/deliveries/${selectedDelivery.delivery_id}`, {
        delivery_status: statusInput,
        customer_received: customerReceivedInput,
        odometer_reading: Number(odometerInput),
        delivery_notes: notesInput,
      });

      setDeliveries((prev) =>
        prev.map((d) => (d.delivery_id === selectedDelivery.delivery_id ? res.data : d))
      );

      showLocalToast(
        `Vehicle handover complete! Delivery #${selectedDelivery.delivery_id} marked Delivered and vehicle marked as Sold.`,
        'success'
      );
      closeHandoverModal();
      fetchDeliveries();
    } catch (err: any) {
      console.error('Failed to submit delivery handover:', err);
      showLocalToast(err.response?.data?.message || 'Failed to update delivery', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter deliveries for Sales Executive vs Branch Manager
  const scopedDeliveries = deliveries.filter((d) => {
    if (isSalesExecutive) {
      // If user is sales executive, show deliveries assigned to them or their sale
      const isAssigned = d.delivered_by === user?.id || d.sales?.employee_id === user?.id;
      // Also show unassigned deliveries so they can be picked up if needed
      return isAssigned || !d.delivered_by;
    }
    return true;
  });

  const filteredDeliveries = scopedDeliveries.filter((d) => {
    const isCompleted = d.customer_received || (d.delivery_status || '').toLowerCase() === 'delivered';
    if (filterType === 'COMPLETED') return isCompleted;
    if (filterType === 'PENDING') return !isCompleted;
    return true;
  });

  const pendingCount = scopedDeliveries.filter(
    (d) => !d.customer_received && (d.delivery_status || '').toLowerCase() !== 'delivered'
  ).length;
  const completedCount = scopedDeliveries.filter(
    (d) => d.customer_received || (d.delivery_status || '').toLowerCase() === 'delivered'
  ).length;

  return (
    <div className="rounded-lg bg-bg-surface border border-border overflow-hidden space-y-4 font-sans p-5">
      {/* Header & Category Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-success text-xs">
              Stage 3 Handover
            </span>
            <span className="text-xs text-text-secondary font-bold">
              {isSalesExecutive ? 'Sales Executive Delivery Queue' : 'Admin & Fulfillment Delivery Dispatch'}
            </span>
          </div>
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 mt-1">
            <PackageCheck size={18} className="text-accent" />
            {isSalesExecutive ? 'My Assigned Vehicle Deliveries' : 'All Vehicle Deliveries & Handover Schedule'} ({scopedDeliveries.length})
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {isSalesExecutive
              ? 'Vehicles assigned to you for customer handover based on preferred delivery dates'
              : 'Admin assigns delivery entries to Sales Executives and oversees customer handover schedules'}
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              filterType === 'ALL'
                ? 'btn-primary'
                : 'btn-neutral'
            }`}
          >
            All Deliveries ({scopedDeliveries.length})
          </button>

          <button
            onClick={() => setFilterType('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
              filterType === 'PENDING'
                ? 'btn-primary'
                : 'btn-neutral'
            }`}
          >
            <Clock size={12} />
            <span>Pending Handover ({pendingCount})</span>
          </button>

          <button
            onClick={() => setFilterType('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
              filterType === 'COMPLETED'
                ? 'btn-primary'
                : 'btn-neutral'
            }`}
          >
            <CheckCircle2 size={12} />
            <span>Delivered &amp; Sold ({completedCount})</span>
          </button>

          <button
            onClick={fetchDeliveries}
            className="p-1.5 rounded-lg bg-bg-surface-alt hover:bg-bg-surface text-text-primary border border-border cursor-pointer transition-colors shadow-xs"
            title="Refresh List"
          >
            <RefreshCw size={14} className="text-text-secondary hover:text-text-primary" />
          </button>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-xs border-collapse bg-bg-surface">
          <thead>
            <tr className="border-b-2 border-border bg-bg-surface-alt text-text-primary uppercase text-[11px] tracking-wider font-extrabold">
              <th className="py-3.5 px-4 font-black">Delivery ID</th>
              <th className="py-3.5 px-4 font-black">Customer Details</th>
              <th className="py-3.5 px-4 font-black">Vehicle Model</th>
              <th className="py-3.5 px-4 font-black">Customer Delivery Date</th>
              <th className="py-3.5 px-4 font-black">Assigned Sales Exec (Step 5)</th>
              <th className="py-3.5 px-4 font-black">Handover Status</th>
              <th className="py-3.5 px-4 text-right font-black">Execution (Step 5)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-text-primary">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-text-secondary font-medium">
                  Loading delivery records...
                </td>
              </tr>
            ) : filteredDeliveries.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-text-secondary font-medium">
                  No delivery records found for this category filter.
                </td>
              </tr>
            ) : (
              filteredDeliveries.map((d, index) => {
                const isCompleted = d.customer_received || (d.delivery_status || '').toLowerCase() === 'delivered';
                const cName = d.sales?.customers
                  ? `${d.sales.customers.first_name} ${d.sales.customers.last_name || ''}`.trim()
                  : d.customer_name || `Customer #${index + 1}`;
                const phone = d.sales?.customers?.phone || d.phone || '9840112233';
                const vName = d.sales?.vehicles
                  ? `${d.sales.vehicles.make} ${d.sales.vehicles.model} (${d.sales.vehicles.manufacture_year})`
                  : d.vehicle_name || 'Vehicle Model';
                const branch = d.sales?.branches?.branch_name || d.branch_name || 'CarRevive Hub';
                const formattedDate = d.delivery_date
                  ? new Date(d.delivery_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                  : 'Pending Schedule';
                const rawDate = d.delivery_date
                  ? new Date(d.delivery_date).toISOString().split('T')[0]
                  : new Date().toISOString().split('T')[0];
                const handover = getHandoverState(d);
                const draftDate = dateDrafts[d.delivery_id];
                const dateValue = draftDate ?? (handover.kind === 'unconfirmed' ? '' : rawDate);
                const canEditDate = !isCompleted && (isSalesExecutive || isBranchManagerOrAdmin);
                const assignedRep = d.employees
                  ? `${d.employees.first_name} ${d.employees.last_name || ''}`.trim()
                  : 'Unassigned';

                return (
                  <tr key={d.delivery_id} className="hover:bg-bg-surface-alt/70 transition-colors border-b border-border/80">
                    {/* Delivery ID */}
                    <td className="py-3.5 px-4 font-mono font-black text-blue-700 dark:text-blue-400 text-xs">
                      #DEL-{d.delivery_id}
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-text-primary flex items-center gap-1.5 text-xs">
                        <User size={14} className="text-text-secondary shrink-0" />
                        <span className="font-black text-text-primary">{cName}</span>
                      </div>
                      <span className="text-[11px] text-text-secondary font-mono font-bold block mt-0.5">{phone}</span>
                    </td>

                    {/* Vehicle */}
                    <td className="py-3.5 px-4">
                      <div className="font-black text-text-primary flex items-center gap-1.5 text-xs">
                        <Car size={14} className="text-amber-600 shrink-0" />
                        <span className="font-black text-text-primary">{vName}</span>
                      </div>
                      <span className="text-[11px] text-text-secondary font-semibold flex items-center gap-1 mt-0.5">
                        <Building2 size={12} className="text-text-secondary shrink-0" /> {branch}
                      </span>
                    </td>

                    {/* Customer Delivery Date */}
                    <td className="py-3.5 px-4 font-mono font-bold text-text-primary text-xs">
                      {canEditDate ? (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="date"
                              min={todayKey()}
                              value={dateValue}
                              onChange={(e) => setDateDrafts((prev) => ({ ...prev, [d.delivery_id]: e.target.value }))}
                              className="bg-bg-surface border-2 border-border text-text-primary text-xs font-bold rounded-lg px-2.5 py-1 cursor-pointer focus:outline-none focus:border-accent"
                              title="Pick the delivery date agreed with the customer"
                            />
                            {(handover.kind === 'unconfirmed' || (draftDate && draftDate !== rawDate)) && (
                              <button
                                type="button"
                                onClick={() => handleConfirmDeliveryDate(d.delivery_id, dateValue)}
                                disabled={!dateValue || confirmingDateId === d.delivery_id}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[11px] font-black cursor-pointer whitespace-nowrap"
                                title="Confirm this date after speaking with the customer"
                              >
                                {confirmingDateId === d.delivery_id ? 'Saving...' : 'Confirm Date'}
                              </button>
                            )}
                          </div>
                          {handover.kind === 'unconfirmed' ? (
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                              <AlertCircle size={11} /> Call customer &amp; confirm date
                            </span>
                          ) : handover.kind === 'missed' ? (
                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              <AlertCircle size={11} /> Date passed &bull; reschedule with customer
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 size={11} /> Confirmed with customer
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                          <Calendar size={14} className="text-text-secondary shrink-0" />
                          <span className="font-mono font-bold text-text-primary">{formattedDate}</span>
                        </div>
                      )}
                    </td>

                    {/* Assigned Sales Executive */}
                    <td className="py-3.5 px-4">
                      {isBranchManagerOrAdmin && !isCompleted ? (
                        <select
                          value={d.delivered_by || ''}
                          onChange={(e) => handleAssignExecutive(d.delivery_id, Number(e.target.value))}
                          className="bg-bg-surface border-2 border-border text-text-primary text-xs font-bold rounded-lg px-2.5 py-1 cursor-pointer focus:outline-none focus:border-accent"
                        >
                          <option value="">-- Assign Sales Exec --</option>
                          {salesExecutives.map((emp) => (
                            <option key={emp.employee_id} value={emp.employee_id}>
                              {emp.first_name} {emp.last_name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                          <UserCheck size={14} className={d.delivered_by === user?.id ? 'text-status-success' : 'text-text-secondary'} />
                          <span className="font-bold text-text-primary">
                            {assignedRep}
                            {d.delivered_by === user?.id && (
                              <span className="ml-1.5 text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-400 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700 px-2 py-0.5 rounded font-black tracking-wide">
                                YOU
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {isCompleted ? (
                        <span className="text-emerald-900 dark:text-emerald-200 font-black text-xs flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-400 dark:border-emerald-700 w-max shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" /> Handover Completed
                        </span>
                      ) : (
                        <span className="text-amber-900 dark:text-amber-200 font-black text-xs flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950/60 px-3 py-1 rounded-full border border-amber-400 dark:border-amber-700 w-max shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" /> Pending Handover
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      {!isCompleted ? (
                        <div className="flex flex-col items-end gap-1">
                          <button
                            onClick={() => openHandoverModal(d)}
                            disabled={handover.kind !== 'today'}
                            className="btn-primary text-xs font-bold flex items-center gap-1.5 justify-end ml-auto shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title={
                              handover.kind === 'today'
                                ? 'Conduct physical car delivery, PDI check, odometer recording, and customer key handover'
                                : 'Handover is available only on the confirmed delivery date'
                            }
                          >
                            <FileText size={13} />
                            <span>Execute Handover</span>
                          </button>
                          {handover.kind !== 'today' && (
                            <span className="text-[10px] font-bold text-text-secondary">
                              {handover.kind === 'unconfirmed'
                                ? 'Confirm delivery date first'
                                : handover.kind === 'upcoming'
                                  ? `Available on ${formatKey(handover.date)}`
                                  : 'Reschedule to enable'}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-emerald-800 dark:text-emerald-300 text-xs font-black flex items-center gap-1.5 justify-end">
                          <CheckCircle2 size={15} className="text-emerald-600" /> Vehicle Sold
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Interactive Delivery Handover Modal (Step 5) */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-lg bg-bg-surface border border-border p-6 sm:p-8 shadow-lg space-y-4">
            <button
              type="button"
              onClick={closeHandoverModal}
              className="btn-neutral w-8 h-8 p-0 flex items-center justify-center rounded-lg absolute top-5 right-5"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="badge-success text-xs">
                  Step 5 Handover Execution
                </span>
                <span className="font-mono text-xs text-text-secondary font-bold">
                  DELIVERY #{selectedDelivery.delivery_id}
                </span>
              </div>
              <h2 className="text-lg font-bold text-text-primary mt-1">
                Vehicle Delivery &amp; Customer Handover
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Complete handover documentation for {selectedDelivery.sales?.customers?.first_name || selectedDelivery.customer_name} based on customer delivery date.
              </p>
            </div>

            <form onSubmit={handleHandoverSubmit} className="space-y-4">
              {/* Odometer */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                  Odometer Reading at Handover (km) *
                </label>
                <input
                  type="number"
                  required
                  value={odometerInput} min={0} max={2000000}
                  onChange={(e) => setOdometerInput(e.target.value)}
                  className="input-base text-xs font-mono font-bold"
                  placeholder="e.g. 14250"
                />
              </div>

              {/* PDI & Delivery Checklist */}
              <div className="p-3.5 rounded-lg bg-bg-surface-alt border border-border space-y-2">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-accent" /> Pre-Delivery Inspection (PDI) Checklist
                </span>
                
                <div className="space-y-1.5 text-xs text-text-secondary pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pdiChecked}
                      onChange={(e) => setPdiChecked(e.target.checked)}
                      className="rounded"
                    />
                    <span>150-Point Pre-Delivery Inspection (PDI) certified &amp; vehicle detailed</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={keysChecked}
                      onChange={(e) => setKeysChecked(e.target.checked)}
                      className="rounded"
                    />
                    <span>Primary and duplicate vehicle keys handed over to buyer</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docsChecked}
                      onChange={(e) => setDocsChecked(e.target.checked)}
                      className="rounded"
                    />
                    <span>Registration Certificate (RC), Insurance policy &amp; invoice verified</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kitChecked}
                      onChange={(e) => setKitChecked(e.target.checked)}
                      className="rounded"
                    />
                    <span>Spare tire, jack, tool kit, and warranty handbook confirmed</span>
                  </label>
                </div>
              </div>

              {/* Handover Remarks */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                  Executive Handover Remarks &amp; Feedback Notes
                </label>
                <textarea
                  rows={2}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full input-base text-xs"
                  placeholder="e.g. Customer happy with delivery experience, vehicle delivered in showroom bay."
                />
              </div>

              {/* Customer Sign-off Confirmation */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface-alt border border-border">
                <input
                  type="checkbox"
                  id="customerReceivedDelivery"
                  checked={customerReceivedInput}
                  onChange={(e) => setCustomerReceivedInput(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <label htmlFor="customerReceivedDelivery" className="text-xs text-text-primary font-bold cursor-pointer">
                  Customer has physically received vehicle and signed delivery handover acknowledgment
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={closeHandoverModal}
                  className="btn-neutral"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex items-center gap-2"
                >
                  {submitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  <span>Complete Handover &amp; Mark Sold</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
