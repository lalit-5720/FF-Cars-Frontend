'use client';

import React from 'react';
import { Award, UserCheck, TrendingUp } from 'lucide-react';

interface EmployeeLeaderboardProps {
  data: Array<{
    employeeId: number;
    name: string;
    role: string;
    branchName: string;
    salesCount: number;
    totalRevenue: number;
    conversionRate: number;
  }>;
  loading?: boolean;
}

export function EmployeeLeaderboard({ data, loading }: EmployeeLeaderboardProps) {
  if (loading) {
    return <div className="h-72 rounded-2xl bg-secondary/50 animate-pulse border border-border" />;
  }

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString()}`;
  };

  const employees = data && data.length > 0 ? data : [
    { employeeId: 1, name: 'Rajkumar Swaminathan', role: 'Branch Manager', branchName: 'Anna Nagar', salesCount: 4, totalRevenue: 15400000, conversionRate: 40.0 },
    { employeeId: 2, name: 'Ganesh Chettiar', role: 'Sales Executive', branchName: 'Anna Nagar', salesCount: 3, totalRevenue: 11340000, conversionRate: 33.3 },
  ];

  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" /> Employee Performance Leaderboard
          </h3>
          <p className="text-xs text-muted-foreground">Top sales reps by total revenue & deal conversion rate</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-sans">
          <thead>
            <tr className="border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
              <th className="py-2.5 px-3">Sales Rep</th>
              <th className="py-2.5 px-3">Branch</th>
              <th className="py-2.5 px-3">Deals Closed</th>
              <th className="py-2.5 px-3">Total Revenue</th>
              <th className="py-2.5 px-3 text-right">Conversion Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {employees.map((emp, idx) => (
              <tr key={emp.employeeId} className="hover:bg-secondary/40 transition-colors">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      idx === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      idx === 1 ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30' :
                      'bg-slate-700/30 text-slate-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <strong className="block text-foreground text-xs font-bold">{emp.name}</strong>
                      <small className="text-muted-foreground text-[10px]">{emp.role}</small>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-slate-300 font-medium">{emp.branchName}</td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-sky-400">
                    <UserCheck className="w-3 h-3" /> {emp.salesCount}
                  </span>
                </td>
                <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                  {formatCurrency(emp.totalRevenue)}
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-purple-400">
                    <TrendingUp className="w-3 h-3" /> {emp.conversionRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
