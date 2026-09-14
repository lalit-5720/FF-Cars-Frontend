'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { usePermissions } from '../../../hooks/usePermissions';
import { RequireRole } from '../../../components/auth/RequireRole';
import { showLocalToast } from '../../../components/Toast';
import { TrendingUp, Plus, Search, DollarSign } from 'lucide-react';

export default function SalesPage() {
  const permissions = usePermissions();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales');
      setSales(res.data);
    } catch (err) {
      showLocalToast('Failed to load sales records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  return (
    <RequireRole allow={['SYSTEM_ADMIN', 'BRANCH_MANAGER', 'SALES_EXECUTIVE']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border p-5 rounded-2xl">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" /> Sales & Revenue Contracts
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Record sales contracts, track payment deposits, and monitor branch revenue
            </p>
          </div>

          {permissions.canManageSales && (
            <button
              onClick={() => showLocalToast('Create Sale Contract modal opened')}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Sale Contract
            </button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-4">Sale ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Sales Rep</th>
                  <th className="py-3 px-4">Selling Price</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4">Delivery Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      Loading sales contracts...
                    </td>
                  </tr>
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No sales records found.
                    </td>
                  </tr>
                ) : (
                  sales.map((s) => (
                    <tr key={s.sale_id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-400">#SALE-{s.sale_id}</td>
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {s.customers ? `${s.customers.first_name} ${s.customers.last_name || ''}` : `Customer #${s.customer_id}`}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {s.vehicles ? `${s.vehicles.make} ${s.vehicles.model}` : `Vehicle #${s.vehicle_id}`}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {s.employees ? `${s.employees.first_name} ${s.employees.last_name || ''}` : `Rep #${s.employee_id}`}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        ₹{Number(s.final_amount || s.selling_price || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          s.payment_status === 'Completed' || s.payment_status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {s.payment_status || 'Pending'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-sky-500/10 text-sky-400 border-sky-500/20">
                          {s.delivery_status || 'Scheduled'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
