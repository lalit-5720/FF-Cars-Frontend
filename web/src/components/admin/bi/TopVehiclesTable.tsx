'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CarFront, ExternalLink } from 'lucide-react';
import { api } from '../../../services/api';

interface TopVehicle {
  vehicle_id?: number;
  vehicle: string;
  make?: string;
  model?: string;
  sales: number;
  revenue: number;
  image_url?: string;
  registration_number?: string;
}

interface TopVehiclesTableProps {
  branchId?: string | number;
}

export function TopVehiclesTable({ branchId }: TopVehiclesTableProps = {}) {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<TopVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const branchQuery = branchId && branchId !== 'all' ? `&branchId=${branchId}` : '';
    api.get(`/bi/top-vehicles?limit=5${branchQuery}`)
      .then((res) => {
        if (isMounted) {
          const list = Array.isArray(res.data) ? res.data : [];
          setVehicles(list);
        }
      })
      .catch((err) => {
        console.warn('Failed to load top vehicles:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [branchId]);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${Math.round(val || 0).toLocaleString('en-IN')}`;
  };

  return (
    <div className="rounded-2xl bg-[#1e293b]/90 border border-slate-800/90 p-5 shadow-lg flex flex-col justify-between font-sans">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
            <CarFront className="w-4 h-4 text-sky-400" />
            <span>Top Performing Vehicles</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-bold">
            Live Sales
          </span>
        </div>

        {loading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 rounded-lg bg-slate-800/60 animate-pulse" />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No completed vehicle sales recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-2 pb-3">Vehicle</th>
                  <th className="py-2 pb-3">Sales</th>
                  <th className="py-2 pb-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {vehicles.map((v, idx) => (
                  <tr key={v.vehicle || idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5">
                      <div className="flex items-center gap-3">
                        {v.image_url ? (
                          <img
                            src={v.image_url}
                            alt={v.vehicle}
                            className="w-10 h-7 object-cover rounded-md border border-slate-700 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-7 bg-slate-800 rounded-md border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                            <CarFront size={14} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-bold text-slate-100 block truncate">
                            {v.vehicle}
                          </span>
                          {v.registration_number && (
                            <span className="text-[9px] text-sky-400 font-mono">
                              {v.registration_number}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 font-mono font-bold text-slate-300">
                      {v.sales}
                    </td>
                    <td className="py-2.5 font-mono font-bold text-emerald-400 text-right">
                      {formatCurrency(v.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <button
        onClick={() => router.push('/admin/inventory')}
        className="mt-4 w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-sky-400 font-bold text-xs border border-slate-700/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <span>View All Vehicles</span>
        <ExternalLink size={12} />
      </button>
    </div>
  );
}
