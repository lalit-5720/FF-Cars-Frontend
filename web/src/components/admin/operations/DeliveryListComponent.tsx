'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { showLocalToast } from '../../Toast';
import { useAuthStore } from '../../../store/useAuthStore';
import { PackageCheck, CheckCircle2, Clock, User, Building2, Car, RefreshCw, FileText, X, Loader2, Phone } from 'lucide-react';

interface DeliveryListComponentProps {
  initialDeliveriesList?: any[];
}

export function DeliveryListComponent({ initialDeliveriesList }: DeliveryListComponentProps) {
  const { user } = useAuthStore();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');

  // Handover action modal state
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [odometerInput, setOdometerInput] = useState<number | string>('');
  const [notesInput, setNotesInput] = useState('');
  const [statusInput, setStatusInput] = useState('Delivered');
  const [customerReceivedInput, setCustomerReceivedInput] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isSalesExecutive = user?.role === 'SALES_EXECUTIVE';

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
  }, []);

  const openHandoverModal = (del: any) => {
    setSelectedDelivery(del);
    setOdometerInput(del.odometer_reading || 14000);
    setNotesInput(del.delivery_notes || 'Vehicle inspected, documents verified, keys handed over.');
    setStatusInput('Delivered');
    setCustomerReceivedInput(true);
  };

  const closeHandoverModal = () => {
    setSelectedDelivery(null);
  };

  const handleHandoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery) return;

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

      showLocalToast(`Delivery #${selectedDelivery.delivery_id} successfully updated!`);
      closeHandoverModal();
    } catch (err: any) {
      console.error('Failed to submit delivery handover:', err);
      showLocalToast(err.response?.data?.message || 'Failed to update delivery');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter deliveries by Completed vs Not Completed
  const filteredDeliveries = deliveries.filter((d) => {
    const isCompleted = d.customer_received || (d.delivery_status || '').toLowerCase() === 'delivered';
    if (filterType === 'COMPLETED') return isCompleted;
    if (filterType === 'PENDING') return !isCompleted;
    return true;
  });

  const pendingCount = deliveries.filter(
    (d) => !d.customer_received && (d.delivery_status || '').toLowerCase() !== 'delivered'
  ).length;
  const completedCount = deliveries.filter(
    (d) => d.customer_received || (d.delivery_status || '').toLowerCase() === 'delivered'
  ).length;

  return (
    <div className="rounded-2xl bg-[#1e293b]/90 border border-slate-800 overflow-hidden shadow-xl space-y-4 font-sans p-5">
      {/* Header & Category Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <PackageCheck size={18} className="text-sky-400" />
            {isSalesExecutive ? 'My Assigned Vehicle Deliveries' : 'All Vehicle Deliveries'} ({deliveries.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isSalesExecutive
              ? 'Strictly filtered to vehicles assigned to you for customer handover and action'
              : 'Complete categorization of completed handovers vs pending/scheduled deliveries'}
          </p>
        </div>

        {/* Tab Filters for Completed vs Not Completed */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer border ${
              filterType === 'ALL'
                ? 'bg-sky-600 text-white border-sky-400 shadow'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            All Deliveries ({deliveries.length})
          </button>

          <button
            onClick={() => setFilterType('PENDING')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer border flex items-center gap-1.5 ${
              filterType === 'PENDING'
                ? 'bg-amber-600 text-white border-amber-400 shadow'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Clock size={12} />
            <span>Not Completed / Pending ({pendingCount})</span>
          </button>

          <button
            onClick={() => setFilterType('COMPLETED')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer border flex items-center gap-1.5 ${
              filterType === 'COMPLETED'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <CheckCircle2 size={12} />
            <span>Completed Handovers ({completedCount})</span>
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
              <th className="py-3 px-4">Target Branch</th>
              <th className="py-3 px-4">Odometer</th>
              <th className="py-3 px-4">Delivery Categorization</th>
              <th className="py-3 px-4 text-right">Action</th>
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
                const isCompleted = d.customer_received;
                const cName = d.sales?.customers
                  ? `${d.sales.customers.first_name} ${d.sales.customers.last_name}`
                  : d.customer_name || `Customer #${index + 1}`;
                const phone = d.sales?.customers?.phone || d.phone || '9840112233';
                const vName = d.sales?.vehicles
                  ? `${d.sales.vehicles.make} ${d.sales.vehicles.model} (${d.sales.vehicles.manufacture_year})`
                  : d.vehicle_name || 'Vehicle Model';
                const branch = d.sales?.branches?.branch_name || d.branch_name || 'CarRevive Branch';

                return (
                  <tr key={d.delivery_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                      #DEL-{d.delivery_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-white flex items-center gap-1.5">
                        <User size={13} className="text-slate-400" />
                        <span>{cName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{phone}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100 flex items-center gap-1.5">
                        <Car size={13} className="text-amber-400" /> {vName}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1 text-slate-300 font-medium">
                        <Building2 size={11} className="text-sky-400" /> {branch}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-purple-300 font-semibold">
                      {d.odometer_reading ? `${d.odometer_reading} km` : '12,500 km'}
                    </td>
                    <td className="py-3.5 px-4">
                      {isCompleted ? (
                        <span className="text-emerald-400 font-extrabold text-[11px] flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 w-max">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed Delivery
                        </span>
                      ) : (
                        <span className="text-amber-300 font-extrabold text-[11px] flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 w-max">
                          <Clock className="w-3.5 h-3.5" /> Not Completed (Pending)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {!isCompleted ? (
                        <button
                          onClick={() => openHandoverModal(d)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] transition-all shadow cursor-pointer flex items-center gap-1 justify-end ml-auto"
                        >
                          <FileText size={12} />
                          <span>Execute Handover</span>
                        </button>
                      ) : (
                        <span className="text-emerald-500/80 text-[11px] font-bold flex items-center gap-1 justify-end">
                          <CheckCircle2 size={12} /> Handover Completed
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

      {/* Interactive Delivery Handover Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#1e293b] border border-slate-700 p-6 sm:p-8 shadow-2xl space-y-6">
            <button
              onClick={closeHandoverModal}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-500/30">
                  Execution Action
                </span>
                <span className="font-mono text-xs text-sky-400 font-bold">
                  DELIVERY #{selectedDelivery.delivery_id}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white mt-1">
                Vehicle Delivery &amp; Customer Handover
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete handover documentation for {selectedDelivery.sales?.customers?.first_name || selectedDelivery.customer_name}
              </p>
            </div>

            <form onSubmit={handleHandoverSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Odometer Reading at Handover (km)
                </label>
                <input
                  type="number"
                  required
                  value={odometerInput}
                  onChange={(e) => setOdometerInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-sky-500 transition-colors"
                  placeholder="e.g. 14250"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Delivery Handover Status
                </label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-sky-500 transition-colors"
                >
                  <option value="Delivered">Delivered (Handover Completed)</option>
                  <option value="Ready for Handover">Ready for Handover</option>
                  <option value="In Progress">In Progress (PDI Pending)</option>
                  <option value="Pending">Scheduled / Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Executive Handover Remarks &amp; Checklist Notes
                </label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs font-medium text-white focus:outline-none focus:border-sky-500 transition-colors"
                  placeholder="e.g. Verified customer ID, keys handed over, full warranty kit provided."
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <input
                  type="checkbox"
                  id="customerReceivedDelivery"
                  checked={customerReceivedInput}
                  onChange={(e) => setCustomerReceivedInput(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-800 border-slate-700 cursor-pointer"
                />
                <label htmlFor="customerReceivedDelivery" className="text-xs text-slate-200 font-semibold cursor-pointer">
                  Customer has received vehicle and signed delivery handover receipt
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeHandoverModal}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer transition-all shadow flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  <span>Save &amp; Complete Handover</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
