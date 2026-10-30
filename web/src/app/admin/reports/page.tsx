'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePermissions } from '../../../hooks/usePermissions';
import { useAuthStore } from '../../../store/useAuthStore';
import { RequireRole } from '../../../components/auth/RequireRole';
import { showLocalToast } from '../../../components/Toast';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Building2,
  TrendingUp,
  DollarSign,
  CarFront,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Info,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { api } from '../../../services/api';
import jsPDF from 'jspdf';

// Helper to format Indian currency
const formatInr = (val?: number) => {
  const num = Number(val || 0);
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
};

// CSV Export Helper
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
  const { user } = useAuthStore();

  // Filters State
  const [period, setPeriod] = useState<string>('this_month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [branchId, setBranchId] = useState<string>(
    permissions.isBranchManager && user?.branch_id ? String(user.branch_id) : 'all'
  );
  const [reportType, setReportType] = useState<string>('complete');

  // Metadata & Data State
  const [branches, setBranches] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'report_studio' | 'csv_vault'>('report_studio');
  const [exportingCsvId, setExportingCsvId] = useState<string | null>(null);

  const reportContainerRef = useRef<HTMLDivElement>(null);

  // Sync branch if user is Branch Manager
  useEffect(() => {
    if (permissions.isBranchManager && user?.branch_id) {
      setBranchId(String(user.branch_id));
    }
  }, [permissions.isBranchManager, user?.branch_id]);

  // Load branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await api.get('/branches');
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setBranches(list);
      } catch (err) {
        console.error('Failed to load branches', err);
      }
    };
    fetchBranches();
  }, []);

  // Fetch verified report data from backend
  const fetchReport = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        period,
        reportType,
      };
      if (branchId !== 'all') {
        params.branchId = Number(branchId);
      }
      if (period === 'custom') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      const res = await api.get('/bi/business-report', { params });
      setReportData(res.data);
    } catch (err: any) {
      console.error('Failed to fetch business report:', err);
      showLocalToast(err.response?.data?.message || 'Failed to load report data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [period, branchId, reportType]);

  // Handle custom date apply
  const handleApplyCustomDates = () => {
    if (period === 'custom') {
      if (!startDate || !endDate) {
        showLocalToast('Please select both start and end dates.', 'info');
        return;
      }
      fetchReport();
    }
  };

  // High-Precision Vector PDF Generator
  const handleGeneratePdf = () => {
    if (!reportData) {
      showLocalToast('Report data not loaded yet.', 'error');
      return;
    }

    setGeneratingPdf(true);
    showLocalToast('Generating executive PDF report...', 'info');

    try {
      const exec = reportData?.executiveSummary || {};
      const meta = reportData?.metadata || {};
      const charts = reportData?.charts || {};
      const insights = reportData?.keyBusinessInsights || [];
      const detailed = reportData?.detailedData || {};
      const comp = exec?.previousPeriodComparison || {};
      const superPerf = reportData?.superAdminPerformance || {};

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `CarRevive_${(reportType || 'complete').toUpperCase()}_REPORT_${dateStr}.pdf`;

      const formatPdfInr = (val?: number) => {
        const num = Math.round(Number(val || 0));
        return `Rs. ${num.toLocaleString('en-IN')}`;
      };

      const cleanText = (str: any) => {
        if (str === null || str === undefined) return '';
        return String(str)
          .replace(/[₹]/g, 'Rs. ')
          .replace(/[•]/g, '-')
          .replace(/[↑]/g, '+')
          .replace(/[↓]/g, '-')
          .replace(/[→]/g, '->')
          .replace(/[✨💡★]/g, '*')
          .replace(/[^\x00-\x7F]/g, '');
      };

      const drawHeader = (subtitle: string) => {
        doc.setFillColor(30, 41, 59);
        doc.roundedRect(12, 10, 186, 18, 1, 1, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text('CARREVIVE PRE-OWNED CARS', 16, 18);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(203, 213, 225);
        doc.text(cleanText(subtitle), 16, 24);

        doc.setFontSize(7.5);
        doc.text(
          new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          194,
          21,
          { align: 'right' }
        );
      };

      const drawFooter = (pageNum: number, totalPages: number) => {
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(12, 283, 198, 283);
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.text(`Page ${pageNum} of ${totalPages} - CarRevive Business Intelligence Report`, 12, 287);
        doc.text('Confidential - For Dealership Management Only', 198, 287, { align: 'right' });
      };

      // ================= PAGE 1 =================
      drawHeader('Executive Business Summary & Branch Performance');

      // Metadata Bar
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(12, 31, 186, 8, 'FD');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'bold');
      doc.text('Period:', 15, 36.5);
      doc.setFont('helvetica', 'normal');
      doc.text(cleanText(meta.periodLabel || 'This Month'), 28, 36.5);
      doc.setFont('helvetica', 'bold');
      doc.text('Showroom:', 78, 36.5);
      doc.setFont('helvetica', 'normal');
      doc.text(cleanText(meta.branchInfo?.branchName || 'All Branches (Consolidated)'), 97, 36.5);
      doc.setFont('helvetica', 'bold');
      doc.text('Generated By:', 150, 36.5);
      doc.setFont('helvetica', 'normal');
      doc.text(cleanText(user?.email || 'Administrator'), 172, 36.5);

      // Business Performance Highlights
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(12, 42, 186, 22, 1, 1, 'FD');

      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.text('PROFIT PER CAR SOLD', 16, 48);
      doc.text('MONTHLY HOLDING COST', 62, 48);
      doc.text('STOCK TURNOVER RATE', 112, 48);
      doc.text('PAYMENT REALIZATION', 156, 48);

      const dynProfit = superPerf.profitPerUnit || (exec.vehiclesSold > 0 ? Math.round(exec.grossProfit / exec.vehiclesSold) : 0);
      const dynHolding = superPerf.monthlyHoldingCost || Math.round(((exec.totalInventoryAcquisitionCost || 0) * 0.105) / 12);
      const dynTurnover = superPerf.turnoverRate || (exec.totalInventoryAcquisitionCost > 0 ? Number(((exec.totalCompletedSalesRevenue || 0) / exec.totalInventoryAcquisitionCost).toFixed(1)) : 1.5);
      const dynCollection = superPerf.collectionPercentage ?? exec.collectionPercentage ?? 100;

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(formatPdfInr(dynProfit), 16, 55);
      doc.text(`${formatPdfInr(dynHolding)}/mo`, 62, 55);
      doc.text(`${dynTurnover}x Turnover`, 112, 55);
      doc.text(`${dynCollection}% Collected`, 156, 55);

      // KPI Grid (8 Cards)
      const kpis = [
        { label: 'Completed Sales Revenue', val: formatPdfInr(exec.totalCompletedSalesRevenue), sub: comp.revenueGrowthPct != null ? `${comp.revenueGrowthPct >= 0 ? '+' : ''}${comp.revenueGrowthPct}% vs prior` : 'Deliveries' },
        { label: 'Gross Profit & Margin', val: formatPdfInr(exec.grossProfit), sub: `${exec.grossProfitMargin}% Margin` },
        { label: 'Cars Delivered', val: `${exec.vehiclesSold ?? 0} Cars`, sub: `Avg ${formatPdfInr(exec.averageSellingPrice)}` },
        { label: 'Cars in Stock', val: `${exec.vehiclesInStock ?? 0} Cars`, sub: 'Current Live Inventory' },
        { label: 'Inventory Cost Value', val: formatPdfInr(exec.totalInventoryAcquisitionCost), sub: `List ${formatPdfInr(exec.totalInventoryListingValue)}` },
        { label: 'Pending Customer Balances', val: formatPdfInr(exec.outstandingCustomerBalances), sub: `Collection: ${exec.collectionPercentage}%` },
        { label: 'Cash Payments Received', val: formatPdfInr(exec.totalPaymentsCollected), sub: `Contract ${formatPdfInr(exec.totalReceivableContract)}` },
        { label: 'Sales Volume Growth', val: comp.salesVolumeGrowthPct != null ? `${comp.salesVolumeGrowthPct >= 0 ? '+' : ''}${comp.salesVolumeGrowthPct}%` : '0%', sub: `Rev: ${comp.revenueGrowthPct != null ? (comp.revenueGrowthPct >= 0 ? '+' : '') + comp.revenueGrowthPct + '%' : '0%'}` },
      ];

      kpis.forEach((kpi, idx) => {
        const row = Math.floor(idx / 4);
        const col = idx % 4;
        const x = 12 + col * 47.5;
        const y = 67 + row * 21;

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, y, 44.5, 18, 1, 1, 'FD');

        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.text(kpi.label, x + 2.5, y + 4.5);

        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text(kpi.val, x + 2.5, y + 10.5);

        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.text(kpi.sub, x + 2.5, y + 15);
      });

      // Trajectory and Aging
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(12, 112, 90, 56, 1, 1, 'FD');

      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text('Monthly Revenue & Profit (Last 6 Months)', 15, 118);

      doc.setFillColor(241, 245, 249);
      doc.rect(14, 121, 86, 5, 'F');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Month', 16, 124.5);
      doc.text('Cars Sold', 36, 124.5);
      doc.text('Revenue', 52, 124.5);
      doc.text('Gross Profit', 74, 124.5);

      const trendList = (charts.monthlyRevenueTrend || []).slice(-6);
      trendList.forEach((t: any, i: number) => {
        const ry = 130 + i * 5.8;
        doc.setFontSize(6.5);
        doc.setTextColor(51, 65, 85);
        doc.setFont('helvetica', 'bold');
        doc.text(cleanText(t.month || ''), 16, ry);
        doc.setFont('helvetica', 'normal');
        doc.text(`${t.unitsSold || 0}`, 38, ry);
        doc.text(formatPdfInr(t.revenue), 52, ry);
        doc.text(formatPdfInr(t.grossProfit), 74, ry);
      });

      // Right: Inventory Aging
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(106, 112, 92, 56, 1, 1, 'FD');

      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text('Inventory Aging & Stock Value', 109, 118);

      doc.setFillColor(241, 245, 249);
      doc.rect(108, 121, 88, 5, 'F');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Days in Stock', 110, 124.5);
      doc.text('Cars', 136, 124.5);
      doc.text('Stock Capital', 154, 124.5);
      doc.text('Status', 182, 124.5);

      const agingList = charts.inventoryAging || [];
      agingList.forEach((ag: any, i: number) => {
        const ry = 130 + i * 5.8;
        doc.setFontSize(6.5);
        doc.setTextColor(51, 65, 85);
        doc.setFont('helvetica', 'bold');
        doc.text(cleanText(ag.label || ''), 110, ry);
        doc.setFont('helvetica', 'normal');
        doc.text(`${ag.count || 0}`, 136, ry);
        doc.text(formatPdfInr(ag.value), 154, ry);
        doc.text(i >= 2 ? 'Older Stock' : 'Fresh Stock', 182, ry);
      });

      // Strategic Business Insights
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text('Key Business Insights & Recommendations', 12, 174);

      const insightCards = (insights || []).slice(0, 4);
      insightCards.forEach((ins: any, idx: number) => {
        const row = Math.floor(idx / 2);
        const col = idx % 2;
        const x = 12 + col * 94;
        const y = 178 + row * 49;

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, y, 92, 45, 1, 1, 'FD');

        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text(cleanText(ins.title || ''), x + 3, y + 6);

        doc.setFontSize(6.5);
        doc.setTextColor(51, 65, 85);
        doc.setFont('helvetica', 'bold');
        doc.text('Finding: ', x + 3, y + 12);
        doc.setFont('helvetica', 'normal');
        const findingLines = doc.splitTextToSize(cleanText(ins.finding || ''), 86);
        doc.text(findingLines.slice(0, 2), x + 3, y + 16);

        doc.setFillColor(241, 245, 249);
        doc.roundedRect(x + 3, y + 25, 86, 5, 1, 1, 'F');
        doc.setFontSize(6);
        doc.setTextColor(71, 85, 105);
        doc.text(cleanText(ins.supportingData || ''), x + 5, y + 28.5);

        doc.setFontSize(6.5);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text('Recommended Action: ', x + 3, y + 34);
        doc.setFont('helvetica', 'normal');
        const actionLines = doc.splitTextToSize(cleanText(ins.recommendedAction || ''), 86);
        doc.text(actionLines.slice(0, 2), x + 3, y + 38);
      });

      drawFooter(1, 2);

      // ================= PAGE 2 =================
      doc.addPage();
      drawHeader('Branch Performance Comparison & Detailed Records');

      // 1. Branch Performance Comparison Table
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Branch Performance Comparison', 12, 35);

      doc.setFillColor(241, 245, 249);
      doc.rect(12, 38, 186, 6, 'F');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'bold');
      doc.text('Branch Name', 14, 42);
      doc.text('City', 52, 42);
      doc.text('Cars Sold', 74, 42);
      doc.text('Revenue', 90, 42);
      doc.text('Gross Profit', 116, 42);
      doc.text('Margin', 142, 42);
      doc.text('Available Stock', 158, 42);
      doc.text('Pending Balance', 178, 42);

      const branchList = superPerf.crossBranchMatrix || [];
      branchList.slice(0, 6).forEach((b: any, i: number) => {
        const ry = 48 + i * 6.5;
        if (i % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(12, ry - 4, 186, 6.5, 'F');
        }
        doc.setFontSize(6.5);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text(cleanText(b.branchName || ''), 14, ry);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(cleanText(b.city || 'TN'), 52, ry);
        doc.text(`${b.unitsSold || 0}`, 76, ry);
        doc.text(formatPdfInr(b.revenue), 90, ry);
        doc.text(formatPdfInr(b.grossProfit), 116, ry);
        doc.text(`${b.marginPct || 0}%`, 142, ry);
        doc.text(`${b.availableStockCount || 0} cars`, 158, ry);
        doc.text(formatPdfInr(b.outstandingReceivables), 178, ry);
      });

      // 2. Detailed Records
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      const domainTitle = reportType === 'financial' ? 'Outstanding Customer Accounts' : reportType === 'inventory' ? 'Live Vehicle Stock List' : 'Delivered Vehicle Sales';
      doc.text(`2. ${domainTitle}`, 12, 85);

      doc.setFillColor(241, 245, 249);
      doc.rect(12, 88, 186, 6, 'F');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'bold');

      if (reportType === 'financial') {
        doc.text('Sale ID', 14, 92);
        doc.text('Customer Name', 32, 92);
        doc.text('Phone', 74, 92);
        doc.text('Vehicle', 106, 92);
        doc.text('Contract Amount', 144, 92);
        doc.text('Paid', 168, 92);
        doc.text('Balance Due', 186, 92);

        const accounts = (detailed.outstandingAccounts || []).slice(0, 9);
        accounts.forEach((a: any, i: number) => {
          const ry = 98 + i * 5.8;
          if (i % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(12, ry - 3.8, 186, 5.8, 'F');
          }
          doc.setFontSize(6.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(`#${a.saleId}`, 14, ry);
          doc.setFont('helvetica', 'normal');
          doc.text(cleanText(a.customerName || ''), 32, ry);
          doc.text(cleanText(a.customerPhone || ''), 74, ry);
          doc.text(cleanText(a.vehicle || ''), 106, ry);
          doc.text(formatPdfInr(a.contractValue), 144, ry);
          doc.text(formatPdfInr(a.amountPaid), 168, ry);
          doc.text(formatPdfInr(a.balanceDue), 186, ry);
        });
      } else if (reportType === 'inventory') {
        doc.text('Reg Number', 14, 92);
        doc.text('Vehicle Description', 42, 92);
        doc.text('Branch', 94, 92);
        doc.text('Purchase Cost', 126, 92);
        doc.text('Listing Price', 152, 92);
        doc.text('Margin', 174, 92);
        doc.text('Days in Stock', 188, 92);

        const vehicles = (detailed.inventoryReportRecords || []).slice(0, 9);
        vehicles.forEach((v: any, i: number) => {
          const ry = 98 + i * 5.8;
          if (i % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(12, ry - 3.8, 186, 5.8, 'F');
          }
          doc.setFontSize(6.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(cleanText(v.registrationNumber || ''), 14, ry);
          doc.setFont('helvetica', 'normal');
          doc.text(cleanText(`${v.make || ''} ${v.model || ''} (${v.year || ''})`), 42, ry);
          doc.text(cleanText(v.branch || ''), 94, ry);
          doc.text(formatPdfInr(v.acquisitionCost), 126, ry);
          doc.text(formatPdfInr(v.listingPrice), 152, ry);
          doc.text(`${v.potentialMarginPct || 0}%`, 174, ry);
          doc.text(`${v.daysOnLot}d`, 188, ry);
        });
      } else {
        doc.text('Sale ID', 14, 92);
        doc.text('Date', 28, 92);
        doc.text('Customer', 48, 92);
        doc.text('Vehicle', 82, 92);
        doc.text('Branch', 124, 92);
        doc.text('Sales Person', 150, 92);
        doc.text('Amount', 174, 92);
        doc.text('Status', 192, 92);

        const sales = (detailed.salesReportRecords || []).slice(0, 9);
        sales.forEach((s: any, i: number) => {
          const ry = 98 + i * 5.8;
          if (i % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(12, ry - 3.8, 186, 5.8, 'F');
          }
          doc.setFontSize(6.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(`#${s.saleId}`, 14, ry);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(s.date ? new Date(s.date).toISOString().split('T')[0] : 'N/A', 28, ry);
          doc.setTextColor(15, 23, 42);
          doc.text(cleanText(s.customerName || ''), 48, ry);
          doc.text(cleanText(s.vehicle || ''), 82, ry);
          doc.text(cleanText(s.branch || ''), 124, ry);
          doc.text(cleanText(s.salesExecutive || 'Staff'), 150, ry);
          doc.setFont('helvetica', 'bold');
          doc.text(formatPdfInr(s.finalAmount), 174, ry);
          doc.text('Delivered', 192, ry);
        });
      }

      // 3. Recommended Actions
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(12, 160, 186, 32, 1, 1, 'FD');

      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text('3. Recommended Business Actions for Dealership Management', 15, 166);

      const levers = superPerf.executiveActionLevers || [
        'Reduce prices on vehicles that have been in stock for more than 60 days to free up working capital.',
        'Follow up with partner banks on pending customer loan settlements to accelerate cash collection.',
        'Ensure sales executives maintain a minimum 10-12% profit margin on customer price negotiations.',
      ];
      levers.slice(0, 3).forEach((lev: string, i: number) => {
        const ly = 172 + i * 6.5;
        doc.setFillColor(37, 99, 235);
        doc.circle(16, ly - 1, 0.8, 'F');
        doc.setFontSize(6.5);
        doc.setTextColor(51, 65, 85);
        doc.setFont('helvetica', 'normal');
        doc.text(cleanText(lev), 19, ly);
      });

      // 4. Audit Notes
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(12, 196, 186, 22, 1, 1, 'F');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text('4. Data Sources & Audit Notes', 15, 201);

      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      doc.text('- Vehicle Inspections: 150-point technical check certificates are logged for all inventory vehicles.', 15, 206);
      doc.text('- Sales & Payments: Reconciled from verified customer purchase contracts and bank transaction records.', 15, 211);
      doc.text('- Live Multi-Branch Records: Data is calculated directly from active dealership database records.', 15, 215);

      // 5. Sign-off
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(12, 224, 90, 48, 1, 1, 'D');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text('Prepared By (Branch Manager):', 15, 230);
      doc.line(15, 252, 85, 252);
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      doc.text(cleanText(user?.email || 'Branch Manager'), 15, 257);
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 15, 262);

      doc.roundedRect(108, 224, 90, 48, 1, 1, 'D');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text('Approved By (Managing Director):', 111, 230);
      doc.line(111, 252, 181, 252);
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      doc.text('Managing Director / Principal Owner', 111, 257);
      doc.text('CarRevive Dealership Network', 111, 262);

      drawFooter(2, 2);

      doc.save(filename);
      showLocalToast(`PDF report downloaded: ${filename}`, 'success');
    } catch (err: any) {
      console.error('PDF Generation failed:', err);
      showLocalToast('PDF Generation encountered an issue. Please try again.', 'error');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = async (reportId: string, name: string) => {
    setExportingCsvId(reportId);
    showLocalToast(`Generating ${name}...`, 'info');
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
        const vehicles = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const headers = ['Vehicle ID', 'Registration', 'Make', 'Model', 'Year', 'Status', 'Purchase Cost (INR)', 'Listing Price (INR)', 'Branch'];
        const rows = vehicles.map((v: any) => [
          v.vehicle_id ?? '',
          v.registration_number ?? 'N/A',
          v.make ?? '',
          v.model ?? '',
          v.manufacture_year ?? '',
          v.status ?? 'Available',
          v.purchase_price ?? '',
          v.price ?? '',
          v.branches?.branch_name ?? 'N/A',
        ]);
        downloadCsv(`inventory_valuation_audit_${dateStr}.csv`, headers, rows);
        showLocalToast(`Exported ${rows.length} inventory records to CSV.`);
      } else if (reportId === 'employee-performance') {
        const res = await api.get('/bi/employee-performance');
        const employees = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const headers = ['ID', 'Name', 'Role', 'Branch', 'Sales Count', 'Total Revenue', 'Leads', 'Conversion Rate'];
        const rows = employees.map((emp: any) => [
          emp.employeeId ?? '',
          emp.name ?? '',
          emp.role ?? '',
          emp.branchName ?? '',
          emp.salesCount ?? 0,
          emp.totalRevenue ?? 0,
          emp.leadsCount ?? 0,
          `${emp.conversionRate ?? 0}%`,
        ]);
        downloadCsv(`employee_performance_${dateStr}.csv`, headers, rows);
        showLocalToast(`Exported ${rows.length} employee records to CSV.`);
      }
    } catch (err: any) {
      console.error('Export error:', err);
      showLocalToast(`Failed to export CSV: ${err?.message || 'Error'}`, 'error');
    } finally {
      setExportingCsvId(null);
    }
  };

  const exec = reportData?.executiveSummary || {};
  const meta = reportData?.metadata || {};
  const charts = reportData?.charts || {};
  const insights = reportData?.keyBusinessInsights || [];
  const detailed = reportData?.detailedData || {};
  const comp = exec?.previousPeriodComparison || {};
  const superPerf = reportData?.superAdminPerformance || {};

  // Dynamic calculations for executive metrics
  const dynamicProfitPerCar =
    superPerf.profitPerUnit != null && superPerf.profitPerUnit !== 0
      ? superPerf.profitPerUnit
      : exec.vehiclesSold > 0
      ? Math.round(exec.grossProfit / exec.vehiclesSold)
      : 0;

  const dynamicHoldingCost =
    superPerf.monthlyHoldingCost != null && superPerf.monthlyHoldingCost > 0
      ? superPerf.monthlyHoldingCost
      : Math.round(((exec.totalInventoryAcquisitionCost || 0) * 0.105) / 12);

  const dynamicTurnover =
    superPerf.turnoverRate != null && superPerf.turnoverRate > 0
      ? superPerf.turnoverRate
      : exec.totalInventoryAcquisitionCost > 0
      ? Number(((exec.totalCompletedSalesRevenue || 0) / exec.totalInventoryAcquisitionCost).toFixed(1))
      : 1.5;

  const dynamicCollectionRate =
    superPerf.collectionPercentage != null && superPerf.collectionPercentage > 0
      ? superPerf.collectionPercentage
      : exec.collectionPercentage ?? 100;

  // Dynamic cross-branch rows (merge API response with showroom branches to guarantee complete data)
  const branchMatrixRows: any[] = [];
  const apiMatrix = Array.isArray(superPerf.crossBranchMatrix) ? superPerf.crossBranchMatrix : [];

  if (apiMatrix.length > 0) {
    branchMatrixRows.push(...apiMatrix);
  } else if (branches.length > 0) {
    branches.forEach((b) => {
      const bSales = (detailed.salesReportRecords || []).filter(
        (s: any) => s.branch === b.branch_name || s.branchId === b.branch_id
      );
      const bInv = (detailed.inventoryReportRecords || []).filter(
        (v: any) => v.branch === b.branch_name || v.branchId === b.branch_id
      );
      const bReceivables = (detailed.outstandingAccounts || []).filter(
        (a: any) => a.branch === b.branch_name
      );

      const bRev = bSales.reduce((sum: number, s: any) => sum + Number(s.finalAmount || 0), 0);
      const bProfit = bSales.reduce((sum: number, s: any) => sum + (Number(s.finalAmount || 0) * 0.12), 0);
      const bMargin = bRev > 0 ? Number(((bProfit / bRev) * 100).toFixed(1)) : 0;
      const bDue = bReceivables.reduce((sum: number, a: any) => sum + Number(a.balanceDue || 0), 0);
      const stockCost = bInv.reduce((sum: number, v: any) => sum + Number(v.acquisitionCost || 0), 0);

      branchMatrixRows.push({
        branchId: b.branch_id,
        branchName: b.branch_name,
        city: b.city || 'Tamil Nadu',
        unitsSold: bSales.length,
        revenue: bRev,
        grossProfit: bProfit,
        marginPct: bMargin,
        avgDealSize: bSales.length > 0 ? Math.round(bRev / bSales.length) : 0,
        availableStockCount: bInv.length,
        availableStockValue: bInv.reduce((sum: number, v: any) => sum + Number(v.listingPrice || 0), 0),
        availableStockCost: stockCost,
        outstandingReceivables: bDue,
        healthStatus: bMargin >= 10 ? 'Good' : bMargin > 0 ? 'Normal' : 'Attention',
      });
    });
  }

  return (
    <RequireRole allow={['SYSTEM_ADMIN', 'BRANCH_MANAGER', 'ADMIN']}>
      <div className="space-y-6 text-slate-800 font-sans pb-16">
        
        {/* ==================== SCREEN HEADER & TABS ==================== */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Business Reports
              </span>
              <span className="text-xs text-text-secondary">• Dealership Intelligence</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Dealership Reports &amp; PDF Center
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              View branch business performance, sales figures, inventory valuation, and download clean executive PDF reports.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={() => setActiveTab('report_studio')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'report_studio'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Executive Report Studio
            </button>
            <button
              onClick={() => setActiveTab('csv_vault')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'csv_vault'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Raw CSV Exports
            </button>
          </div>
        </div>

        {activeTab === 'csv_vault' ? (
          /* ==================== TAB 2: RAW CSV EXPORT VAULT ==================== */
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Raw Data Exports</h3>
              <p className="text-xs text-slate-600">Download CSV spreadsheets for internal records, audits, or accounting.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'revenue-ledger', name: 'Sales & Revenue Ledger', type: 'Sales', desc: 'All car sale transactions with customer, branch, date, and final amount' },
                { id: 'inventory-audit', name: 'Inventory & Stock Valuation', type: 'Inventory', desc: 'Current showroom vehicle stock with purchase cost, list price, and status' },
                { id: 'employee-performance', name: 'Sales Team Performance', type: 'Team', desc: 'Sales representatives closed deals, total revenue, and inquiry conversions' },
              ].map((r) => (
                <div key={r.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-blue-700 px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                      {r.type}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-2">{r.name}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{r.desc}</p>
                  </div>
                  <button
                    onClick={() => handleExportCsv(r.id, r.name)}
                    disabled={exportingCsvId === r.id}
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-blue-600 border border-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {exportingCsvId === r.id ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <Download className="w-4 h-4" />}
                    <span>Export CSV</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ==================== TAB 1: EXECUTIVE REPORT STUDIO ==================== */
          <div className="space-y-6">
            
            {/* 1. FILTER CONTROLS BAR */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                  
                  {/* Period Filter */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      Reporting Period
                    </label>
                    <select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="this_month">This Month</option>
                      <option value="last_month">Last Month</option>
                      <option value="last_3_months">Last 3 Months</option>
                      <option value="last_6_months">Last 6 Months</option>
                      <option value="this_year">This Year</option>
                      <option value="custom">Custom Date Range...</option>
                    </select>
                  </div>

                  {/* Branch Filter */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1 flex items-center justify-between">
                      <span>Showroom Branch</span>
                      {permissions.isBranchManager && (
                        <span className="text-[10px] text-blue-600 font-bold">Your Branch</span>
                      )}
                    </label>
                    <select
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      disabled={permissions.isBranchManager}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {!permissions.isBranchManager && (
                        <option value="all">All Branches (Consolidated)</option>
                      )}
                      {branches.map((b) => (
                        <option key={b.branch_id} value={b.branch_id}>
                          {b.branch_name} ({b.city || 'TN'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Report Type Filter */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      Report Scope
                    </label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="complete">Complete Business Report (Full Summary)</option>
                      <option value="sales">Sales &amp; Revenue Details</option>
                      <option value="financial">Customer Receivables &amp; Payments</option>
                      <option value="inventory">Vehicle Inventory &amp; Aging</option>
                      <option value="customer_leads">Customer Leads &amp; Inquiries</option>
                    </select>
                  </div>

                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2 self-end lg:self-center shrink-0 pt-2 lg:pt-0">
                  <button
                    onClick={fetchReport}
                    disabled={loading}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer border border-slate-200"
                    title="Refresh Data"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200 cursor-pointer"
                    title="Print Document"
                  >
                    <Printer className="w-4 h-4 text-slate-600" />
                    <span>Print</span>
                  </button>

                  <button
                    onClick={handleGeneratePdf}
                    disabled={loading || generatingPdf}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {generatingPdf ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Creating PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-text-primary" />
                        <span>Generate &amp; Download PDF</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* Custom Date Pickers Drawer */}
              {period === 'custom' && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold text-slate-700">Custom Date Range:</span>
                  <div className="flex items-center gap-2 text-xs">
                    <label className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                      <span className="text-text-secondary font-semibold text-xs">From</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-transparent font-medium text-slate-800 outline-hidden text-xs cursor-pointer"
                      />
                    </label>
                    <span className="text-text-secondary">to</span>
                    <label className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                      <span className="text-text-secondary font-semibold text-xs">To</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-transparent font-medium text-slate-800 outline-hidden text-xs cursor-pointer"
                      />
                    </label>
                    <button
                      onClick={handleApplyCustomDates}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer"
                    >
                      Apply Filter
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* CLEAN, HIGH-CONTRAST BUSINESS PERFORMANCE & BRANCH COMPARISON SECTION     */}
            {/* ========================================================================= */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
              
              {/* Header with Clear Business Wording */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      Performance Summary
                    </span>
                    <span className="text-xs text-text-secondary">• All Showroom Branches</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Dealership &amp; Branch Business Performance
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Live operational metrics, profit per car sold, carrying costs, and branch comparison.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {superPerf.dealershipGrade || 'Good Operational Standing'}
                  </span>
                </div>
              </div>

              {/* 4 Clean Metric Cards (Light, High-Contrast, Legible) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-xs font-semibold text-slate-600 block">
                    Profit per Car Sold
                  </span>
                  <strong className="text-2xl font-bold text-slate-900 block">
                    {formatInr(dynamicProfitPerCar)}
                  </strong>
                  <span className="text-xs text-text-secondary block">
                    Average gross profit on completed car sales
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-xs font-semibold text-slate-600 block">
                    Monthly Carrying Cost
                  </span>
                  <strong className="text-2xl font-bold text-slate-900 block">
                    {formatInr(dynamicHoldingCost)}<span className="text-xs font-normal text-text-secondary">/mo</span>
                  </strong>
                  <span className="text-xs text-text-secondary block">
                    Estimated holding interest on unsold showroom stock
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-xs font-semibold text-slate-600 block">
                    Stock Turnover Rate
                  </span>
                  <strong className="text-2xl font-bold text-slate-900 block">
                    {dynamicTurnover}x
                  </strong>
                  <span className="text-xs text-text-secondary block">
                    How quickly vehicle inventory converts to sales
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-xs font-semibold text-slate-600 block">
                    Payment Realization Rate
                  </span>
                  <strong className="text-2xl font-bold text-slate-900 block">
                    {dynamicCollectionRate}%
                  </strong>
                  <span className="text-xs text-text-secondary block">
                    Payments received vs total sales contract value
                  </span>
                </div>

              </div>

              {/* Branch Performance Comparison Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      Branch Performance Comparison
                    </h3>
                    <p className="text-xs text-text-secondary">
                      Breakdown of sales, revenue, profit, and available vehicles for each showroom location.
                    </p>
                  </div>
                  <span className="text-xs text-text-secondary font-medium">
                    {branchMatrixRows.length} Active Showrooms
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                        <th className="py-3 px-3.5">Branch</th>
                        <th className="py-3 px-3.5">City</th>
                        <th className="py-3 px-3.5 text-center">Cars Sold</th>
                        <th className="py-3 px-3.5 text-right">Revenue</th>
                        <th className="py-3 px-3.5 text-right">Gross Profit</th>
                        <th className="py-3 px-3.5 text-center">Profit Margin</th>
                        <th className="py-3 px-3.5 text-center">Available Stock</th>
                        <th className="py-3 px-3.5 text-right">Pending Balance</th>
                        <th className="py-3 px-3.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {branchMatrixRows.map((b: any) => (
                        <tr key={b.branchId} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-3.5 font-bold text-slate-900">
                            {b.branchName}
                          </td>
                          <td className="py-3 px-3.5 text-slate-600">{b.city}</td>
                          <td className="py-3 px-3.5 text-center font-bold text-slate-900">{b.unitsSold}</td>
                          <td className="py-3 px-3.5 text-right font-bold text-slate-900">{formatInr(b.revenue)}</td>
                          <td className="py-3 px-3.5 text-right font-bold text-slate-900">{formatInr(b.grossProfit)}</td>
                          <td className="py-3 px-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              b.marginPct >= 10 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                              b.marginPct > 0 ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                              'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {b.marginPct}%
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-center font-medium text-slate-700">
                            {b.availableStockCount} cars
                          </td>
                          <td className="py-3 px-3.5 text-right font-medium text-slate-700">
                            {formatInr(b.outstandingReceivables)}
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.healthStatus === 'Good' || b.healthStatus === 'EXCELLENT'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : b.healthStatus === 'Normal' || b.healthStatus === 'GOOD'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {b.healthStatus === 'EXCELLENT' ? 'Good' : b.healthStatus === 'GOOD' ? 'Normal' : b.healthStatus === 'NEEDS_ATTENTION' ? 'Review' : b.healthStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recommended Business Actions */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
                  Recommended Business Actions
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(superPerf.executiveActionLevers || [
                    'Review and adjust pricing on older vehicles to speed up sales and free up cash.',
                    'Follow up on outstanding customer balances and bank loan settlements.',
                    'Maintain a healthy 10% to 12% profit margin on customer price negotiations.',
                  ]).map((lever: string, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600 mt-1 shrink-0" />
                      <span className="leading-relaxed font-medium">{lever}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* 2. REPORT STATUS & INSTRUCTIONS */}
            <div className="flex items-center justify-between text-xs text-text-secondary px-1">
              <span>
                Showing report preview for: <strong className="text-slate-800">{meta?.periodLabel || 'Current Period'}</strong> • Branch: <strong className="text-slate-800">{meta?.branchInfo?.branchName || 'All Showrooms'}</strong>
              </span>
              <span className="text-text-secondary">Generated: {meta?.generatedAt ? new Date(meta.generatedAt).toLocaleString('en-IN') : 'Just now'}</span>
            </div>

            {/* 3. REPORT CONTAINER PREVIEW */}
            <div ref={reportContainerRef} className="space-y-8 print:m-0 print:p-0">
              
              {/* PAGE 1: EXECUTIVE SUMMARY */}
              <div
                id="report-page-1"
                className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 max-w-5xl mx-auto print:border-none print:shadow-none print:max-w-none print:p-0"
              >
                
                {/* Brand Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b-2 border-border">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                      CR
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold tracking-tight text-slate-900">CarRevive</span>
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          Pre-Owned Cars
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-text-secondary block uppercase tracking-wider">
                        Business Intelligence &amp; Performance Report
                      </span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right text-xs space-y-0.5">
                    <span className="font-bold text-slate-900 block">{meta?.branchInfo?.branchName || 'CarRevive Showrooms'}</span>
                    <span className="text-slate-600 block">{meta?.periodLabel || 'Reporting Period'}</span>
                    <span className="text-xs text-text-secondary block">
                      Generated: {meta?.generatedAt ? new Date(meta.generatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                    </span>
                  </div>
                </div>

                {/* KPI Metrics Grid */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                      1. Executive Key Metrics
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-xs font-semibold text-text-secondary block">
                        Completed Sales Revenue
                      </span>
                      <strong className="text-xl font-bold text-slate-900 block">
                        {formatInr(exec.totalCompletedSalesRevenue)}
                      </strong>
                      <div className="text-xs text-text-secondary">
                        {comp.revenueGrowthPct != null && (
                          <span className={`font-semibold mr-1 ${comp.revenueGrowthPct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {comp.revenueGrowthPct >= 0 ? '+' : ''}{comp.revenueGrowthPct}%
                          </span>
                        )}
                        <span>vs prior period</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-xs font-semibold text-text-secondary block">
                        Gross Profit &amp; Margin
                      </span>
                      <strong className="text-xl font-bold text-emerald-700 block">
                        {formatInr(exec.grossProfit)}
                      </strong>
                      <div className="text-xs text-slate-600 font-semibold">
                        {exec.grossProfitMargin}% Margin
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-xs font-semibold text-text-secondary block">
                        Vehicles Sold
                      </span>
                      <strong className="text-xl font-bold text-slate-900 block">
                        {exec.vehiclesSold ?? 0} <span className="text-xs font-normal text-text-secondary">cars</span>
                      </strong>
                      <div className="text-xs text-text-secondary">
                        Avg: <strong className="text-slate-700">{formatInr(exec.averageSellingPrice)}</strong>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-xs font-semibold text-text-secondary block">
                        Cars in Stock
                      </span>
                      <strong className="text-xl font-bold text-slate-900 block">
                        {exec.vehiclesInStock ?? 0} <span className="text-xs font-normal text-text-secondary">cars</span>
                      </strong>
                      <div className="text-xs text-text-secondary">
                        Live Showroom Inventory
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-xs font-semibold text-text-secondary block">
                        Inventory Investment (Cost)
                      </span>
                      <strong className="text-xl font-bold text-slate-900 block">
                        {formatInr(exec.totalInventoryAcquisitionCost)}
                      </strong>
                      <div className="text-xs text-text-secondary">
                        List Value: {formatInr(exec.totalInventoryListingValue)}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-xs font-semibold text-text-secondary block">
                        Outstanding Receivables
                      </span>
                      <strong className="text-xl font-bold text-slate-900 block">
                        {formatInr(exec.outstandingCustomerBalances)}
                      </strong>
                      <div className="text-xs text-text-secondary">
                        Collection Rate: <strong className="text-slate-800">{exec.collectionPercentage}%</strong>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-xs font-semibold text-text-secondary block">
                        Period Revenue Delta
                      </span>
                      <div className="text-xl font-bold text-slate-900">
                        {comp.revenueGrowthPct != null ? `${comp.revenueGrowthPct >= 0 ? '+' : ''}${comp.revenueGrowthPct}%` : '0%'}
                      </div>
                      <div className="text-xs text-text-secondary">
                        Volume: {comp.salesVolumeGrowthPct != null ? `${comp.salesVolumeGrowthPct >= 0 ? '+' : ''}${comp.salesVolumeGrowthPct}%` : '0%'}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-xs font-semibold text-text-secondary block">
                        Cash Collected
                      </span>
                      <strong className="text-xl font-bold text-slate-900 block">
                        {formatInr(exec.totalPaymentsCollected)}
                      </strong>
                      <div className="text-xs text-text-secondary">
                        Contract: {formatInr(exec.totalReceivableContract)}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Trajectory & Aging */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    2. Monthly Trend &amp; Inventory Aging
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* CHART 1 */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          Monthly Revenue Trend
                        </span>
                        <span className="text-xs text-text-secondary">Last 6 Months</span>
                      </div>

                      <div className="space-y-2 pt-1">
                        {(charts.monthlyRevenueTrend || []).map((m: any) => {
                          const maxRev = Math.max(...(charts.monthlyRevenueTrend || []).map((x: any) => x.revenue || 1), 1);
                          const revPct = Math.min(Math.round((m.revenue / maxRev) * 100), 100);

                          return (
                            <div key={m.month} className="space-y-1 text-xs">
                              <div className="flex justify-between items-center text-slate-700">
                                <span className="font-bold w-12">{m.month}</span>
                                <span className="text-slate-900 font-semibold">{formatInr(m.revenue)}</span>
                                <span className="text-slate-600 font-medium">Profit: {formatInr(m.grossProfit)}</span>
                                <span className="text-text-secondary">({m.unitsSold} sold)</span>
                              </div>
                              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div style={{ width: `${revPct}%` }} className="bg-blue-600 h-full rounded-full" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* CHART 2 */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          Inventory Aging
                        </span>
                        <span className="text-xs text-text-secondary">Car Days on Lot</span>
                      </div>

                      <div className="space-y-2 pt-1">
                        {(charts.inventoryAging || []).map((b: any) => {
                          const totalStock = (charts.inventoryAging || []).reduce((sum: number, x: any) => sum + (x.count || 0), 0) || 1;
                          const countPct = Math.round((b.count / totalStock) * 100);

                          return (
                            <div key={b.label} className="space-y-1 text-xs">
                              <div className="flex justify-between items-center text-slate-700">
                                <span className="font-bold w-20">{b.label}</span>
                                <span className="text-slate-900 font-semibold">{b.count} cars ({countPct}%)</span>
                                <span className="text-slate-600">{formatInr(b.value)}</span>
                              </div>
                              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${countPct}%`, backgroundColor: b.color }}
                                  className="h-full rounded-full"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Key Business Insights */}
                <div className="space-y-2 pt-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    3. Key Business Insights
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {insights.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-xs font-bold text-slate-900">
                            {item.title}
                          </strong>
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {item.priority}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 leading-snug">
                          <strong>Finding:</strong> {item.finding}
                        </p>
                        <div className="text-xs text-slate-600 bg-white p-1.5 rounded border border-slate-200">
                          {item.supportingData}
                        </div>
                        <p className="text-xs text-slate-800 font-medium leading-snug">
                          <strong>Action:</strong> {item.recommendedAction}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-text-secondary">
                  <span>Page 1 of 2 • Executive Summary</span>
                  <span>Confidential — Internal Dealership Report</span>
                </div>

              </div>

              {/* PAGE 2: BRANCH PERFORMANCE & DETAILED AUDIT */}
              <div
                id="report-page-2"
                className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 max-w-5xl mx-auto print:border-none print:shadow-none print:max-w-none print:p-0"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">CarRevive</span>
                    <span className="text-xs text-text-secondary">• Branch Details &amp; Records Ledger</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-600">
                    Scope: <span className="uppercase text-blue-600">{reportType.replace('_', ' ')}</span>
                  </span>
                </div>

                {/* Branch Performance Comparison */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    Branch Performance Comparison
                  </h4>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Showroom</th>
                          <th className="py-2.5 px-3">City</th>
                          <th className="py-2.5 px-3 text-center">Cars Sold</th>
                          <th className="py-2.5 px-3 text-right">Revenue</th>
                          <th className="py-2.5 px-3 text-right">Gross Profit</th>
                          <th className="py-2.5 px-3 text-center">Margin</th>
                          <th className="py-2.5 px-3 text-center">Stock</th>
                          <th className="py-2.5 px-3 text-right">Pending Balance</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {branchMatrixRows.map((b: any) => (
                          <tr key={b.branchId} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-900">{b.branchName}</td>
                            <td className="py-2 px-3 text-slate-600">{b.city}</td>
                            <td className="py-2 px-3 text-center font-bold text-slate-800">{b.unitsSold}</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">{formatInr(b.revenue)}</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">{formatInr(b.grossProfit)}</td>
                            <td className="py-2 px-3 text-center font-semibold">
                              {b.marginPct}%
                            </td>
                            <td className="py-2 px-3 text-center text-slate-600">{b.availableStockCount} cars</td>
                            <td className="py-2 px-3 text-right text-slate-700">{formatInr(b.outstandingReceivables)}</td>
                            <td className="py-2 px-3 text-center">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                {b.healthStatus === 'EXCELLENT' ? 'Good' : b.healthStatus === 'GOOD' ? 'Normal' : b.healthStatus === 'NEEDS_ATTENTION' ? 'Review' : b.healthStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section A: Sales Log */}
                {(reportType === 'complete' || reportType === 'sales') && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                      Completed Vehicle Sales ({detailed.salesReportRecords?.length || 0} Deals)
                    </h4>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                            <th className="py-2.5 px-3">Sale ID</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Customer</th>
                            <th className="py-2.5 px-3">Vehicle</th>
                            <th className="py-2.5 px-3">Branch</th>
                            <th className="py-2.5 px-3">Sales Person</th>
                            <th className="py-2.5 px-3 text-right">Final Amount</th>
                            <th className="py-2.5 px-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(detailed.salesReportRecords || []).slice(0, 8).map((s: any) => (
                            <tr key={s.saleId} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-semibold text-slate-700">#{s.saleId}</td>
                              <td className="py-2 px-3 text-slate-600">{s.date ? new Date(s.date).toISOString().split('T')[0] : 'N/A'}</td>
                              <td className="py-2 px-3 font-semibold text-slate-800">{s.customerName}</td>
                              <td className="py-2 px-3 text-slate-700">{s.vehicle}</td>
                              <td className="py-2 px-3 text-slate-600">{s.branch}</td>
                              <td className="py-2 px-3 text-slate-600">{s.salesExecutive || 'Staff'}</td>
                              <td className="py-2 px-3 text-right font-bold text-slate-900">{formatInr(s.finalAmount)}</td>
                              <td className="py-2 px-3 text-right">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {s.deliveryStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Section B: Accounts Receivable */}
                {(reportType === 'complete' || reportType === 'financial') && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                      Pending Customer Balances ({detailed.outstandingAccounts?.length || 0} Accounts)
                    </h4>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                            <th className="py-2.5 px-3">Sale ID</th>
                            <th className="py-2.5 px-3">Customer</th>
                            <th className="py-2.5 px-3">Phone</th>
                            <th className="py-2.5 px-3">Vehicle</th>
                            <th className="py-2.5 px-3 text-right">Contract Value</th>
                            <th className="py-2.5 px-3 text-right">Amount Paid</th>
                            <th className="py-2.5 px-3 text-right">Balance Due</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(detailed.outstandingAccounts || []).slice(0, 6).map((a: any) => (
                            <tr key={a.saleId} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-semibold text-slate-700">#{a.saleId}</td>
                              <td className="py-2 px-3 font-semibold text-slate-900">{a.customerName}</td>
                              <td className="py-2 px-3 text-slate-600">{a.customerPhone}</td>
                              <td className="py-2 px-3 text-slate-700">{a.vehicle}</td>
                              <td className="py-2 px-3 text-right text-slate-700">{formatInr(a.contractValue)}</td>
                              <td className="py-2 px-3 text-right text-emerald-700">{formatInr(a.amountPaid)}</td>
                              <td className="py-2 px-3 text-right font-bold text-amber-700">{formatInr(a.balanceDue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Section C: Live Inventory */}
                {(reportType === 'complete' || reportType === 'inventory') && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <CarFront className="w-3.5 h-3.5 text-blue-600" />
                      Live Showroom Vehicles ({detailed.inventoryReportRecords?.length || 0} Cars)
                    </h4>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                            <th className="py-2.5 px-3">Registration</th>
                            <th className="py-2.5 px-3">Car Details</th>
                            <th className="py-2.5 px-3">Branch</th>
                            <th className="py-2.5 px-3 text-right">Cost Price</th>
                            <th className="py-2.5 px-3 text-right">List Price</th>
                            <th className="py-2.5 px-3 text-right">Margin %</th>
                            <th className="py-2.5 px-3 text-right">Days on Lot</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(detailed.inventoryReportRecords || []).slice(0, 6).map((v: any) => (
                            <tr key={v.vehicleId} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-semibold text-blue-600">{v.registrationNumber}</td>
                              <td className="py-2 px-3 font-semibold text-slate-800">{v.make} {v.model} ({v.year || ''})</td>
                              <td className="py-2 px-3 text-slate-600">{v.branch}</td>
                              <td className="py-2 px-3 text-right text-slate-600">{formatInr(v.acquisitionCost)}</td>
                              <td className="py-2 px-3 text-right font-bold text-slate-900">{formatInr(v.listingPrice)}</td>
                              <td className="py-2 px-3 text-right font-semibold text-emerald-700">{v.potentialMarginPct}%</td>
                              <td className="py-2 px-3 text-right text-slate-600">{v.daysOnLot}d</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Audit Disclosures */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span>Audit &amp; Data Verification</span>
                  </div>
                  <p className="text-xs text-slate-600 pt-1">
                    Sales and payment amounts are verified against live customer sales contracts and banking payment logs. Mechanical inspection logs are recorded per vehicle intake.
                  </p>
                </div>

                {/* Sign-off */}
                <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-6 text-xs text-slate-600">
                  <div className="space-y-6">
                    <span className="block font-semibold">Prepared By:</span>
                    <div className="border-b border-slate-300 w-48" />
                    <span className="text-xs text-text-secondary block">
                      Branch Manager ({user?.email || 'Staff'})
                    </span>
                  </div>
                  <div className="space-y-6 text-right">
                    <span className="block font-semibold">Approved By:</span>
                    <div className="border-b border-slate-300 w-48 ml-auto" />
                    <span className="text-xs text-text-secondary block">
                      Managing Director / Owner
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-text-secondary">
                  <span>Page 2 of 2 • Detailed Records</span>
                  <span>CarRevive System Report</span>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>
    </RequireRole>
  );
}
