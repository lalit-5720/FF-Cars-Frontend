'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CarFront } from 'lucide-react';

export function TopVehiclesTable() {
  const router = useRouter();

  const vehicles = [
    {
      name: 'Hyundai Creta',
      sales: 8,
      revenue: '₹1.36 Cr',
      img: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=200',
    },
    {
      name: 'Maruti Brezza',
      sales: 6,
      revenue: '₹78.50 L',
      img: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=200',
    },
    {
      name: 'Tata Nexon',
      sales: 5,
      revenue: '₹64.25 L',
      img: 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&q=80&w=200',
    },
    {
      name: 'Hyundai Venue',
      sales: 4,
      revenue: '₹52.10 L',
      img: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=200',
    },
    {
      name: 'Maruti Fronx',
      sales: 3,
      revenue: '₹38.70 L',
      img: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=200',
    },
  ];

  return (
    <div className="rounded-2xl bg-[#1e293b]/90 border border-slate-800/90 p-5 shadow-lg flex flex-col justify-between font-sans">
      <div>
        <h3 className="text-sm font-extrabold text-white tracking-tight mb-4">
          Top Performing Vehicles
        </h3>

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
              {vehicles.map((v) => (
                <tr key={v.name} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5">
                    <div className="flex items-center gap-3">
                      <img src={v.img} alt={v.name} className="w-10 h-7 object-cover rounded-md border border-slate-700" />
                      <span className="font-bold text-slate-100">{v.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 font-mono font-bold text-slate-300">{v.sales}</td>
                  <td className="py-2.5 font-mono font-bold text-emerald-400 text-right">{v.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button
        onClick={() => router.push('/admin/inventory')}
        className="mt-4 w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-sky-400 font-bold text-xs border border-slate-700/60 transition-colors"
      >
        View All Vehicles
      </button>
    </div>
  );
}
