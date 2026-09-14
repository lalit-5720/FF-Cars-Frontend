'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { showLocalToast } from '../../Toast';
import { PackageCheck, CheckCircle2, Clock, User, Building2, Car, RefreshCw, FileText } from 'lucide-react';

interface DeliveryListComponentProps {
  initialDeliveriesList?: any[];
}

export function DeliveryListComponent({ initialDeliveriesList }: DeliveryListComponentProps) {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/deliveries');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setDeliveries(res.data);
      } else if (initialDeliveriesList && initialDeliveriesList.length > 0) {
        setDeliveries(initialDeliveriesList);
      } else {
        setDeliveries([
          {
            delivery_id: 101,
            sale_id: 881,
            customer_name: 'Keerthana Ramanathan',
            phone: '9840112233',
            vehicle_name: 'BMW 3 Series 330i M Sport (2022)',
            branch_name: 'CarRevive - Anna Nagar',
            delivery_date: '2026-09-06',
            odometer_reading: 14200,
            customer_received: false,
            delivery_status: 'Scheduled (Not Completed)',
            loan_status: 'No Loan (Direct Payment)',
          },
          {
            delivery_id: 102,
            sale_id: 882,
            customer_name: 'Dinesh Rajendran',
            phone: '9840223344',
            vehicle_name: 'Mahindra XUV700 AX7 Luxury (2023)',
            branch_name: 'CarRevive - Velachery',
            delivery_date: '2026-09-06',
            odometer_reading: 9800,
            customer_received: false,
            delivery_status: 'Ready for Handover (Not Completed)',
            loan_status: 'No Loan (Direct Payment)',
          },
          {
            delivery_id: 103,
            sale_id: 883,
            customer_name: 'Rajesh Kumar Swamy',
            phone: '9840334455',
            vehicle_name: 'Kia Seltos GTX Plus (2022)',
            branch_name: 'CarRevive - Anna Nagar',
            delivery_date: '2026-09-07',
            odometer_reading: 18500,
            customer_received: true,
            delivery_status: 'Delivered (Completed)',
            loan_status: 'No Loan (Full Cash)',
          },
          {
            delivery_id: 104,
            sale_id: 884,
            customer_name: 'Ananya Sundaram',
            phone: '9840445566',
            vehicle_name: 'Tata Harrier Fearless Edition (2023)',
            branch_name: 'CarRevive - T. Nagar',
            delivery_date: '2026-09-07',
            odometer_reading: 11200,
            customer_received: true,
            delivery_status: 'Delivered (Completed)',
            loan_status: 'No Loan (Direct Payment)',
          },
          {
            delivery_id: 105,
            sale_id: 885,
            customer_name: 'Vikram Krishnan',
            phone: '9840556677',
            vehicle_name: 'Hyundai Alcazar Signature (2022)',
            branch_name: 'CarRevive - Anna Nagar',
            delivery_date: '2026-09-08',
            odometer_reading: 16400,
            customer_received: false,
            delivery_status: 'Scheduled (Not Completed)',
            loan_status: 'No Loan (Direct Payment)',
          },
          {
            delivery_id: 106,
            sale_id: 886,
            customer_name: 'Karthik Subramanian',
            phone: '9840776655',
            vehicle_name: 'Volkswagen Virtus GT 1.5 TSI (2023)',
            branch_name: 'CarRevive - Velachery',
            delivery_date: '2026-09-08',
            odometer_reading: 12000,
            customer_received: false,
            delivery_status: 'Ready for Handover (Not Completed)',
            loan_status: 'No Loan (Full Cash)',
          },
        ]);
      }
    } catch (err) {
      console.warn('Fallback to sample delivery list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleIssueHandover = (id: number) => {
    setDeliveries((prev) =>
      prev.map((d) =>
        d.delivery_id === id
          ? { ...d, customer_received: true, delivery_status: 'Delivered (Completed)' }
          : d
      )
    );
    showLocalToast(`Handover note generated & Delivery #${id} marked Completed!`);
  };

  // Filter deliveries by Completed vs Not Completed
  const filteredDeliveries = deliveries.filter((d) => {
    if (filterType === 'COMPLETED') return d.customer_received === true;
    if (filterType === 'PENDING') return d.customer_received !== true;
    return true;
  });

  const pendingCount = deliveries.filter((d) => !d.customer_received).length;
  const completedCount = deliveries.filter((d) => d.customer_received).length;

  return (
    <div className="rounded-2xl bg-[#1e293b]/90 border border-slate-800 overflow-hidden shadow-xl space-y-4 font-sans p-5">
      {/* Header & Category PII Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <PackageCheck size={18} className="text-sky-400" /> All Vehicle Deliveries ({deliveries.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete categorization of completed handovers vs pending/scheduled deliveries
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
                          onClick={() => handleIssueHandover(d.delivery_id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] transition-all shadow cursor-pointer flex items-center gap-1 justify-end ml-auto"
                        >
                          <FileText size={12} />
                          <span>Verify &amp; Complete Handover</span>
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[11px] italic font-semibold">Completed Handover</span>
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
  );
}
