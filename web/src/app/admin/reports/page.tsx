'use client';

import React, { useState } from 'react';
import { usePermissions } from '../../../hooks/usePermissions';
import { RequireRole } from '../../../components/auth/RequireRole';
import { showLocalToast } from '../../../components/Toast';
import { CircleDollarSign, Download, Loader2 } from 'lucide-react';
import { api } from '../../../services/api';

function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const permissions = usePermissions();
  const [exportingId, setExportingId] = useState<string | null>(null);

  const reportsList = [
    {
      id: 'revenue-ledger',
      name: 'Monthly Revenue & Profitability Ledger',
      type: 'Financial',
      fmt: 'CSV',
      description: 'Transaction-level ledger with vehicle, branch, date, and final revenue',
    },
    {
      id: 'inventory-audit',
      name: 'Branch Inventory Turnover & Valuation Audit',
      type: 'Operations',
      fmt: 'CSV',
      description: 'Full vehicle stock list with purchase price, listing valuation, and status',
    },
    {
      id: 'employee-performance',
      name: 'Sales Rep Commission & Deal Performance Summary',
      type: 'HR & Sales',
      fmt: 'CSV',
      description: 'Staff closed sales, revenue, conversion rates, and pipeline volume',
    },
  ];

  const handleExport = async (reportId: string, name: string) => {
    setExportingId(reportId);
    showLocalToast(`Generating ${name}...`);

    try {
      const dateStr = new Date().toISOString().split('T')[0];

      if (reportId === 'revenue-ledger') {
        const res = await api.get('/bi/sales');
        const records = res.data?.records || [];
        const headers = ['Sale ID', 'Date', 'Vehicle', 'Branch', 'Revenue (INR)'];
        const rows = records.map((r: any) => [
          r.saleId ?? '',
          r.date ? new Date(r.date).toISOString().split('T')[0] : '',
          r.vehicle ?? '',
          r.branch ?? '',
          r.revenue ?? 0,
        ]);
        downloadCsv(`revenue_ledger_${dateStr}.csv`, headers, rows);
        showLocalToast(`Exported ${rows.length} sales records to CSV.`);
      } else if (reportId === 'inventory-audit') {
        const res = await api.get('/vehicles');
        const vehicles = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const headers = [
          'Vehicle ID',
          'Registration Number',
          'Make',
          'Model',
          'Year',
          'Fuel Type',
          'Transmission',
          'Status',
          'Purchase Price (INR)',
          'Listing Price (INR)',
          'Branch',
        ];
        const rows = vehicles.map((v: any) => [
          v.vehicle_id ?? '',
          v.registration_number ?? 'N/A',
          v.make ?? '',
          v.model ?? '',
          v.manufacture_year ?? '',
          v.fuel_type ?? '',
          v.transmission ?? '',
          v.status ?? 'Available',
          v.purchase_price ?? '',
          v.price ?? '',
          v.branches?.branch_name ?? 'N/A',
        ]);
        downloadCsv(`inventory_valuation_audit_${dateStr}.csv`, headers, rows);
        showLocalToast(`Exported ${rows.length} vehicle inventory records to CSV.`);
      } else if (reportId === 'employee-performance') {
        const res = await api.get('/bi/employee-performance');
        const employees = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const headers = [
          'Employee ID',
          'Employee Name',
          'Role',
          'Branch',
          'Sales Count',
          'Total Revenue (INR)',
          'Leads Count',
          'Converted Leads',
          'Test Drives Count',
          'Conversion Rate (%)',
        ];
        const rows = employees.map((emp: any) => [
          emp.employeeId ?? '',
          emp.name ?? '',
          emp.role ?? '',
          emp.branchName ?? '',
          emp.salesCount ?? 0,
          emp.totalRevenue ?? 0,
          emp.leadsCount ?? 0,
          emp.convertedLeads ?? 0,
          emp.testDrivesCount ?? 0,
          `${emp.conversionRate ?? 0}%`,
        ]);
        downloadCsv(`employee_deal_performance_${dateStr}.csv`, headers, rows);
        showLocalToast(`Exported ${rows.length} employee performance records to CSV.`);
      }
    } catch (err: any) {
      console.error('Export error:', err);
      showLocalToast(`Failed to export ${name}: ${err?.message || 'Network error'}`);
    } finally {
      setExportingId(null);
    }
  };

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportsList.map((r) => {
            const isExporting = exportingId === r.id;
            return (
              <div key={r.name} className="p-5 rounded-2xl bg-card border border-border flex flex-col justify-between shadow-sm gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                      {r.type}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800">
                      {r.fmt}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground mt-2">{r.name}</h3>
                  <p className="text-muted-foreground text-[11px] leading-relaxed pt-1">
                    {r.description}
                  </p>
                </div>
                <button
                  onClick={() => handleExport(r.id, r.name)}
                  disabled={isExporting}
                  className="w-full py-2.5 px-3 rounded-xl bg-secondary hover:bg-slate-700 text-sky-400 border border-border transition-colors flex items-center justify-center gap-1.5 text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                      <span>Generating CSV...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Export CSV</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </RequireRole>
  );
}
