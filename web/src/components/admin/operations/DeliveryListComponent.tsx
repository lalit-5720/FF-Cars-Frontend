'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { showLocalToast } from '../../Toast';
import { useAuthStore } from '../../../store/useAuthStore';
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

  // Branch Manager Step 5: Update customer preferred delivery date
  const handleUpdateDeliveryDate = async (deliveryId: number, dateStr: string) => {
    try {
      await api.patch(`/deliveries/${deliveryId}`, { delivery_date: dateStr });
      setDeliveries((prev) =>
        prev.map((d) => (d.delivery_id === deliveryId ? { ...d, delivery_date: dateStr } : d))
      );
      showLocalToast(
        `Delivery #${deliveryId} scheduled date set to ${new Date(dateStr).toLocaleDateString()}`,
        'success'
      );
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to update delivery date', 'error');
    }
  };

  const openHandoverModal = (del: any) => {
    setSelectedDelivery(del);
    setOdometerInput(del.odometer_reading || del.sales?.vehicles?.kilometers_driven || 14000);
    setNotesInput(del.delivery_notes || 'Vehicle inspected, documents verified, keys handed over.');
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
              {isSalesExecutive ? 'Sales Executive Delivery Queue' : 'Branch Manager Delivery Dispatch'}
            </span>
          </div>
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 mt-1">
            <PackageCheck size={18} className="text-accent" />
            {isSalesExecutive ? 'My Assigned Vehicle Deliveries' : 'All Vehicle Deliveries & Handover Schedule'} ({scopedDeliveries.length})
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {isSalesExecutive
              ? 'Vehicles assigned to you for customer handover based on preferred delivery dates'
              : 'Branch Manager assigns delivery entries to Sales Executives and sets customer preferred delivery dates'}
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
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
              <th className="py-3 px-4">Delivery ID</th>
              <th className="py-3 px-4">Customer Details</th>
              <th className="py-3 px-4">Vehicle Model</th>
              <th className="py-3 px-4">Customer Delivery Date</th>
              <th className="py-3 px-4">Assigned Sales Exec (Step 5)</th>
              <th className="py-3 px-4">Handover Status</th>
              <th className="py-3 px-4 text-right">Execution (Step 5)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Loading delivery records...
                </td>
              </tr>
            ) : filteredDeliveries.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
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
                  ? new Date(d.delivery_date).toLocaleDateString()
                  : 'Pending Schedule';
                const rawDate = d.delivery_date
                  ? new Date(d.delivery_date).toISOString().split('T')[0]
                  : new Date().toISOString().split('T')[0];
                const assignedRep = d.employees
                  ? `${d.employees.first_name} ${d.employees.last_name || ''}`.trim()
                  : 'Unassigned';

                return (
                  <tr key={d.delivery_id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Delivery ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                      #DEL-{d.delivery_id}
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-white flex items-center gap-1.5">
                        <User size={13} className="text-slate-400" />
                        <span>{cName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{phone}</span>
                    </td>

                    {/* Vehicle */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100 flex items-center gap-1.5">
                        <Car size={13} className="text-amber-400" /> {vName}
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Building2 size={10} className="text-sky-400" /> {branch}
                      </span>
                    </td>

                    {/* Customer Delivery Date */}
                    <td className="py-3.5 px-4 font-mono text-slate-200">
                      {isBranchManagerOrAdmin && !isCompleted ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="date"
                            defaultValue={rawDate}
                            onChange={(e) => handleUpdateDeliveryDate(d.delivery_id, e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-slate-200 text-[11px] font-bold rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:border-sky-400"
                            title="Branch Manager: Set or update customer preferred delivery date"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-300">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{formattedDate}</span>
                        </div>
                      )}
                    </td>

                    {/* Assigned Sales Executive */}
                    <td className="py-3.5 px-4">
                      {isBranchManagerOrAdmin && !isCompleted ? (
                        <select
                          value={d.delivered_by || ''}
                          onChange={(e) => handleAssignExecutive(d.delivery_id, Number(e.target.value))}
                          className="bg-slate-900 border border-slate-700 text-slate-200 text-[11px] font-bold rounded-lg px-2.5 py-1 cursor-pointer focus:outline-none focus:border-sky-400"
                        >
                          <option value="">-- Assign Sales Exec --</option>
                          {salesExecutives.map((emp) => (
                            <option key={emp.employee_id} value={emp.employee_id}>
                              {emp.first_name} {emp.last_name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                          <UserCheck size={13} className={d.delivered_by === user?.id ? 'text-emerald-400' : 'text-slate-400'} />
                          <span>
                            {assignedRep}
                            {d.delivered_by === user?.id && (
                              <span className="ml-1 text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black">
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
                        <span className="text-emerald-400 font-extrabold text-[11px] flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 w-max">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Handover Completed
                        </span>
                      ) : (
                        <span className="text-amber-300 font-extrabold text-[11px] flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 w-max">
                          <Clock className="w-3.5 h-3.5" /> Pending Handover
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      {!isCompleted ? (
                        <button
                          onClick={() => openHandoverModal(d)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] transition-all shadow cursor-pointer flex items-center gap-1.5 justify-end ml-auto"
                          title="Sales Executive conducts physical car delivery, PDI check, odometer recording, and customer key handover"
                        >
                          <FileText size={12} />
                          <span>Execute Handover</span>
                        </button>
                      ) : (
                        <span className="text-emerald-500/90 text-[11px] font-bold flex items-center gap-1 justify-end">
                          <CheckCircle2 size={13} /> Vehicle Sold
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
                  value={odometerInput}
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
