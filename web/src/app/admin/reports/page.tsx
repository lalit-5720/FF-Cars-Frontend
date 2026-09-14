'use client';

import React from 'react';
import { usePermissions } from '../../../hooks/usePermissions';
import { RequireRole } from '../../../components/auth/RequireRole';
import { showLocalToast } from '../../../components/Toast';
import { CircleDollarSign, FileSpreadsheet, Download, Printer } from 'lucide-react';

export default function ReportsPage() {
  const permissions = usePermissions();

  const reportsList = [
    { name: 'Monthly Revenue & Profitability Ledger', type: 'Financial', fmt: 'CSV / PDF' },
    { name: 'Branch Inventory Turnover & Valuation Audit', type: 'Operations', fmt: 'Excel' },
    { name: 'Sales Rep Commission & Deal Performance Summary', type: 'HR & Sales', fmt: 'CSV' },
    { name: 'Customer Test Drive Conversion Audit Log', type: 'Pipeline', fmt: 'PDF' },
  ];

  return (
    <RequireRole allow={['SYSTEM_ADMIN', 'BRANCH_MANAGER']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border p-5 rounded-2xl">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <CircleDollarSign className="w-5 h-5 text-emerald-400" /> Executive Audit Reports
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Export comprehensive financial statements, stock valuation, and operational audits
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportsList.map((r) => (
            <div key={r.name} className="p-5 rounded-2xl bg-card border border-border flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                  {r.type}
                </span>
                <h3 className="text-sm font-bold text-foreground mt-1">{r.name}</h3>
                <small className="text-muted-foreground block text-[11px]">Format: {r.fmt}</small>
              </div>
              <button
                onClick={() => showLocalToast(`Generating ${r.name}...`)}
                className="p-2.5 rounded-xl bg-secondary hover:bg-slate-700 text-sky-400 border border-border transition-colors flex items-center gap-1 text-xs font-bold"
              >
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          ))}
        </div>
      </div>
    </RequireRole>
  );
}
