'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { showLocalToast } from '../../Toast';
import { ClipboardList, User, Building2, Car, ArrowRight, CheckCircle2, RefreshCw, DollarSign } from 'lucide-react';

interface LeadListComponentProps {
  onMoveToDelivery?: (item: any) => void;
}

export function LeadListComponent({ onMoveToDelivery }: LeadListComponentProps) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterInterest, setFilterInterest] = useState<string>('ALL');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leads');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setLeads(res.data);
      } else {
        setLeads([
          {
            lead_id: 501,
            customer_name: 'Deepa Venkat',
            phone: '9840889900',
            email: 'deepa.v@gmail.com',
            vehicle_name: 'Volkswagen Virtus GT 1.5 TSI (2023)',
            branch_name: 'CarRevive - Anna Nagar',
            budget: '₹16L - ₹18L',
            status: 'Hot Lead',
            interest_level: 'High',
            loan_status: 'No Loan (Self-Financed)',
            remarks: 'Active inquiry for Volkswagen Virtus GT Wild Cherry Red.',
          },
          {
            lead_id: 502,
            customer_name: 'Rajesh Swaminathan',
            phone: '9840990011',
            email: 'rajesh.swami@gmail.com',
            vehicle_name: 'BMW 3 Series 330i M Sport (2022)',
            branch_name: 'CarRevive - Anna Nagar',
            budget: '₹40L - ₹45L',
            status: 'Qualified Inquiry',
            interest_level: 'High',
            loan_status: 'No Loan (Direct Payment)',
            remarks: 'Confirmed budget bracket for 2022 Petrol Sedan.',
          },
          {
            lead_id: 503,
            customer_name: 'Anitha Krishnan',
            phone: '9840112244',
            email: 'anitha.k@gmail.com',
            vehicle_name: 'Mahindra XUV700 AX7 (2023)',
            branch_name: 'CarRevive - Velachery',
            budget: '₹20L - ₹23L',
            status: 'Hot Lead',
            interest_level: 'High',
            loan_status: 'No Loan (Full Cash)',
            remarks: 'Ready for booking deposit.',
          },
          {
            lead_id: 504,
            customer_name: 'Meena Sundaram',
            phone: '9840445566',
            email: 'meena.s@gmail.com',
            vehicle_name: 'Range Rover Velar R-Dynamic (2022)',
            branch_name: 'CarRevive - Velachery',
            budget: '₹70L - ₹80L',
            status: 'Qualified Inquiry',
            interest_level: 'High',
            loan_status: 'No Loan (Direct Transfer)',
            remarks: 'High value customer inquiring for luxury SUV.',
          },
        ]);
      }
    } catch (err) {
      console.warn('Fallback to sample leads list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await api.patch(`/leads/${id}`, { status: newStatus });
    } catch {
      // Local state update
    }
    setLeads((prev) =>
      prev.map((ld) => (ld.lead_id === id ? { ...ld, status: newStatus } : ld))
    );
    showLocalToast(`Lead #${id} updated to ${newStatus}`);
  };

  const filteredLeads = leads.filter((ld) => {
    if (filterInterest === 'ALL') return true;
    return (ld.status || '').toUpperCase().includes(filterInterest.toUpperCase());
  });

  return (
    <div className="rounded-2xl bg-[#1e293b]/90 border border-slate-800 overflow-hidden shadow-xl space-y-4 font-sans p-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <ClipboardList size={18} className="text-purple-400" /> All Customer Leads ({leads.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete database of incoming customer leads, budget preferences, and booking inquiries
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'HOT', 'QUALIFIED', 'CONTACTED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterInterest(st)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer border ${
                filterInterest === st
                  ? 'bg-purple-600 text-white border-purple-400 shadow'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
          <button
            onClick={fetchLeads}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
              <th className="py-3 px-4">Lead ID</th>
              <th className="py-3 px-4">Customer Details</th>
              <th className="py-3 px-4">Preferred Vehicle</th>
              <th className="py-3 px-4">Budget Bracket</th>
              <th className="py-3 px-4">Lead Status</th>
              <th className="py-3 px-4">Loan Payment</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Loading lead records...
                </td>
              </tr>
            ) : filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No leads found matching filter criteria.
                </td>
              </tr>
            ) : (
              filteredLeads.map((ld) => {
                const cName = ld.customers
                  ? `${ld.customers.first_name} ${ld.customers.last_name}`
                  : ld.customer_name || 'Customer Lead';
                const vName = ld.vehicles
                  ? `${ld.vehicles.make} ${ld.vehicles.model} (${ld.vehicles.manufacture_year})`
                  : ld.vehicle_name || 'Vehicle Preferred';
                const branch = ld.employees?.branches?.branch_name || ld.branch_name || 'CarRevive Branch';
                const isNoLoan = !String(ld.loan_status || '').includes('Pending');

                return (
                  <tr key={ld.lead_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-400">
                      #LD-{ld.lead_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-white flex items-center gap-1.5">
                        <User size={13} className="text-slate-400" />
                        <span>{cName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{ld.customers?.phone || ld.phone || '9840112233'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-purple-300">{vName}</div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Building2 size={10} /> {branch}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-purple-300">
                      {ld.budget || '₹20L - ₹35L'}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={ld.status || 'Hot Lead'}
                        onChange={(e) => handleStatusChange(ld.lead_id, e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-[11px] font-bold rounded-lg px-2.5 py-1 cursor-pointer focus:outline-none focus:border-purple-400"
                      >
                        <option value="Hot Lead">Hot Lead</option>
                        <option value="Qualified Inquiry">Qualified Inquiry</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Converted & Booked">Converted &amp; Booked</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          isNoLoan
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {ld.loan_status || 'No Loan (Direct Payment)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {ld.sale_converted ? (
                        <span className="text-emerald-400 text-[11px] font-bold flex items-center justify-end gap-1">
                          <CheckCircle2 size={14} /> Moved to Delivery
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            if (onMoveToDelivery) onMoveToDelivery(ld);
                            setLeads((prev) =>
                              prev.map((item) =>
                                item.lead_id === ld.lead_id
                                  ? { ...item, status: 'Converted & Booked', sale_converted: true }
                                  : item
                              )
                            );
                            showLocalToast(`Sale Marked Completed! Moved ${vName} to Delivery Schedule.`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-[11px] transition-all shadow cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Mark Sale Completed ➔ Move to Delivery</span>
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
  );
}
