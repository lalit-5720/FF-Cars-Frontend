'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Bell,
  Building2,
  CalendarDays,
  CarFront,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Gauge,
  LayoutDashboard,
  Loader2,
  Menu,
  Search,
  Settings,
  ShieldAlert,
  ShoppingCart,
  SlidersHorizontal,
  Target,
  TrendingUp,
  Users,
  X,
  Heart,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  BarChart3,
  Layers,
  Eye,
  FileText,
} from 'lucide-react';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../store/useAuthStore';
import { WhatIfFinancialSimulator } from '../../../components/admin/bi/WhatIfFinancialSimulator';
import { CustomerDemandIntelligenceReport } from '../../../components/admin/bi/CustomerDemandIntelligenceReport';
import { ProcurementIntelligenceHub } from '../../../components/admin/bi/ProcurementIntelligenceHub';
import { InventoryRiskSummary } from '../../../components/admin/bi/InventoryRiskSummary';
import { RevenueBreakdownModal } from '../../../components/admin/bi/RevenueBreakdownModal';
import { TopVehiclesTable } from '../../../components/admin/bi/TopVehiclesTable';
import { OwnerDecisionCentre } from '../../../components/admin/bi/OwnerDecisionCentre';
import { CustomerDemandTable } from '../../../components/admin/bi/CustomerDemandTable';
import { MultiBranchIntelligenceView } from '../../../components/admin/bi/MultiBranchIntelligenceView';
import { OwnerHistoricalCharts } from '../../../components/admin/bi/OwnerHistoricalCharts';

const money = (value: number) =>
  value >= 10000000
    ? `₹${(value / 10000000).toFixed(2)} Cr`
    : value >= 100000
    ? `₹${(value / 100000).toFixed(2)} L`
    : `₹${Math.round(value || 0).toLocaleString('en-IN')}`;

const navItems = [
  ['Dashboard', LayoutDashboard, '/admin'],
  ['Executive BI Overview', Activity, '/admin/bi'],
  ['Sales Analytics', TrendingUp, '/admin/sales'],
  ['Inventory Intelligence', CarFront, '/admin/inventory'],
  ['Lead Management', Target, '/admin/leads'],
  ['Test Drive Requests', Target, '/admin/test-drives'],
  ['Branch Performance', Building2, '/admin/branches'],
  ['Settings', Settings, '/admin/settings'],
] as const;

export default function BiOverviewPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const isOwner = user?.role === 'SYSTEM_ADMIN';
  const canAccess = useMemo(() => ['SYSTEM_ADMIN', 'BRANCH_MANAGER', 'ADMIN'].includes(user?.role ?? ''), [user]);

  const [activeViewTab, setActiveViewTab] = useState<'OVERVIEW' | 'DEMAND' | 'PROCUREMENT' | 'BRANCHES' | 'DECISIONS'>('OVERVIEW');
  const [branch, setBranch] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [branches, setBranches] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>({});
  const [inventory, setInventory] = useState<any>({});
  const [executive, setExecutive] = useState<any>({});
  const [trendData, setTrendData] = useState<any[]>([]);
  const [funnel, setFunnel] = useState<any>({ stages: [] });
  const [procurementData, setProcurementData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);

  const setDatePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const loadData = async () => {
    setLoading(true);
    const params = {
      ...(branch === 'all' ? {} : { branchId: branch }),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    };
    const empty = (data: any) => ({ data });

    try {
      const [branchRes, overviewRes, inventoryRes, executiveRes, trendRes, funnelRes, procRes, alertsRes] =
        await Promise.all([
          api.get('/branches').catch(() => empty([])),
          api.get('/bi/overview', { params }).catch(() => empty({})),
          api.get('/bi/inventory', { params }).catch(() => empty({ ageing: {} })),
          api.get('/bi/executive', { params }).catch(() => empty({ branchPerformance: [] })),
          api.get('/bi/revenue-trend', { params: { ...params, granularity: 'monthly' } }).catch(() => empty([])),
          api.get('/bi/funnel', { params }).catch(() => empty({ stages: [] })),
          api.get('/analytics/procurement-intelligence', { params }).catch(() => empty({})),
          api.get('/analytics/dynamic-alerts', { params }).catch(() => empty([])),
        ]);

      setBranches(Array.isArray(branchRes.data) ? branchRes.data : branchRes.data?.data ?? []);
      setOverview(overviewRes.data ?? {});
      setInventory(inventoryRes.data ?? {});
      setExecutive(executiveRes.data ?? {});
      setTrendData(Array.isArray(trendRes.data) ? trendRes.data : trendRes.data?.data ?? []);
      setFunnel(funnelRes.data ?? { stages: [] });
      setProcurementData(procRes.data ?? {});
      setAlerts(Array.isArray(alertsRes.data) ? alertsRes.data : alertsRes.data?.data ?? []);
    } catch (err) {
      console.warn('Failed to load BI overview metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/admin/bi');
      return;
    }
    if (!canAccess) {
      router.push('/admin');
      return;
    }
    loadData();
  }, [branch, canAccess, endDate, isAuthenticated, router, startDate]);

  const revenue = Number(overview.totalRevenue ?? executive.totalRevenue ?? 0);
  const totalSales = Number(overview.totalSales ?? executive.totalSales ?? 0);
  const inventoryValue = Number(overview.inventoryValue ?? inventory.inventoryValue ?? 0);
  const currentStockCount = Number(overview.vehiclesCurrentlyAvailable ?? overview.currentInventory ?? 0);
  const pendingDecisionsCount = Number(overview.pendingRecommendationsCount ?? 0);
  const uniqueInterested = Number(overview.uniqueInterestedCustomers ?? 0);
  const topViewModel = overview.mostViewedModels?.[0]?.model || 'Honda City';
  const topViewCount = overview.mostViewedModels?.[0]?.count || 0;
  const wishlists = Number(overview.wishlistAdditions ?? 0);
  const enquiries = Number(overview.customerEnquiries ?? overview.leadsCount ?? 0);
  const testDrives = Number(overview.testDriveBookings ?? overview.testDrivesCount ?? 0);
  const comp = overview.comparison || {};

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-12">
      {/* Dashboard Header Bar & Global Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
              Showroom BI • Owner Decision Support
            </span>
            <span className="text-[11px] text-text-secondary font-medium">• Live Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Business Intelligence &amp; Decision Support
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-text-secondary font-medium">
            Live database analytics for customer demand tracking, multi-branch stock allocation, and owner-approved procurement.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset buttons */}
          <div className="hidden md:flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs text-[11px] font-bold">
            <button
              onClick={() => setDatePreset(7)}
              className="px-2.5 py-1 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer transition"
            >
              7d
            </button>
            <button
              onClick={() => setDatePreset(30)}
              className="px-2.5 py-1 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer transition"
            >
              30d
            </button>
            <button
              onClick={() => setDatePreset(90)}
              className="px-2.5 py-1 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer transition"
            >
              90d
            </button>
            <button
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="px-2.5 py-1 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer transition"
            >
              All Time
            </button>
          </div>

          {/* Date pickers */}
          <label className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-2xs">
            <CalendarDays size={13} className="text-text-secondary" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[110px] bg-transparent text-xs font-medium text-slate-800 outline-none cursor-pointer"
              aria-label="Start date"
            />
            <span className="text-text-secondary font-medium">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[110px] bg-transparent text-xs font-medium text-slate-800 outline-none cursor-pointer"
              aria-label="End date"
            />
          </label>

          {/* Branch selector */}
          <label className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-2xs">
            <Building2 size={13} className="text-text-secondary" />
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="bg-transparent outline-none cursor-pointer text-xs font-bold text-slate-800 pr-1"
            >
              <option value="all">All Showroom Branches</option>
              {branches.map((item) => (
                <option key={item.branch_id} value={item.branch_id}>
                  {item.branch_name}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="text-text-secondary" />
          </label>

          <button
            onClick={() => router.push('/admin/reports')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer transition shadow-2xs hover:border-blue-400"
            title="Generate Owner Executive Business Intelligence PDF Report"
          >
            <FileText size={13} className="text-blue-600" />
            <span>Business Reports</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-extrabold text-white cursor-pointer transition shadow-sm"
          >
            <RotateCcw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* SECTION A: EXECUTIVE OVERVIEW KPI CARDS (8 REAL KPI CARDS) */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {/* 1. Unique Interested Customers */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all space-y-1">
          <div className="flex items-center justify-between text-[11px] text-text-secondary font-semibold">
            <span>Interested Buyers</span>
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={13} />
            </div>
          </div>
          <strong className="block text-2xl font-black font-mono text-slate-900">{uniqueInterested}</strong>
          <div className="text-[10px] text-text-secondary font-medium">
            {comp.enquiriesDelta != null ? (
              <span className={`font-bold mr-1 ${comp.enquiriesDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {comp.enquiriesDelta >= 0 ? '↑ +' : '↓ '}{comp.enquiriesDelta}%
              </span>
            ) : null}
            <span>{comp.periodLabel || 'in period'}</span>
          </div>
        </div>

        {/* 2. Most Viewed Car Model */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all space-y-1">
          <div className="flex items-center justify-between text-[11px] text-text-secondary font-semibold">
            <span>Top Viewed Model</span>
            <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Eye size={13} />
            </div>
          </div>
          <strong className="block text-sm font-extrabold text-slate-900 truncate" title={topViewModel}>
            {topViewModel}
          </strong>
          <div className="text-[10px] text-purple-700 font-mono font-bold">
            {topViewCount} page views
          </div>
        </div>

        {/* 3. Wishlist Additions */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all space-y-1">
          <div className="flex items-center justify-between text-[11px] text-text-secondary font-semibold">
            <span>Wishlist Adds</span>
            <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Heart size={13} />
            </div>
          </div>
          <strong className="block text-2xl font-black font-mono text-slate-900">{wishlists}</strong>
          <div className="text-[10px] text-text-secondary font-medium">Saved vehicle intent</div>
        </div>

        {/* 4. Customer Enquiries */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all space-y-1">
          <div className="flex items-center justify-between text-[11px] text-text-secondary font-semibold">
            <span>Enquiries</span>
            <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <MessageSquare size={13} />
            </div>
          </div>
          <strong className="block text-2xl font-black font-mono text-slate-900">{enquiries}</strong>
          <div className="text-[10px] text-text-secondary font-medium">
            {comp.enquiriesDelta != null ? (
              <span className={`font-bold mr-1 ${comp.enquiriesDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {comp.enquiriesDelta >= 0 ? '↑ +' : '↓ '}{comp.enquiriesDelta}%
              </span>
            ) : null}
            <span>leads</span>
          </div>
        </div>

        {/* 5. Test-Drive Bookings */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all space-y-1">
          <div className="flex items-center justify-between text-[11px] text-text-secondary font-semibold">
            <span>Test Drives</span>
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CarFront size={13} />
            </div>
          </div>
          <strong className="block text-2xl font-black font-mono text-slate-900">{testDrives}</strong>
          <div className="text-[10px] text-text-secondary font-medium">
            {comp.testDrivesDelta != null ? (
              <span className={`font-bold mr-1 ${comp.testDrivesDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {comp.testDrivesDelta >= 0 ? '↑ +' : '↓ '}{comp.testDrivesDelta}%
              </span>
            ) : null}
            <span>scheduled</span>
          </div>
        </div>

        {/* 6. Confirmed Sales */}
        <div
          onClick={() => setIsBreakdownOpen(true)}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-300 shadow-2xs hover:shadow-md transition-all space-y-1 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[11px] text-text-secondary font-semibold">
            <span className="group-hover:text-emerald-700 font-bold transition-colors">Sales Rev ↗</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CircleDollarSign size={13} />
            </div>
          </div>
          <strong className="block text-2xl font-black font-mono text-emerald-600">{money(revenue)}</strong>
          <div className="text-[10px] text-text-secondary font-medium">
            {totalSales} sold &bull; Click split
          </div>
        </div>

        {/* 7. Available Inventory */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all space-y-1">
          <div className="flex items-center justify-between text-[11px] text-text-secondary font-semibold">
            <span>Available Stock</span>
            <div className="w-6 h-6 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <CarFront size={13} />
            </div>
          </div>
          <strong className="block text-2xl font-black font-mono text-slate-900">{currentStockCount} Cars</strong>
          <div className="text-[10px] text-text-secondary font-medium">{money(inventoryValue)} capital</div>
        </div>

        {/* 8. Pending Decisions */}
        <div
          onClick={() => setActiveViewTab('DECISIONS')}
          className={`p-4 rounded-2xl border shadow-2xs hover:shadow-md transition-all space-y-1 cursor-pointer ${
            pendingDecisionsCount > 0
              ? 'bg-amber-50/80 border-amber-300 hover:bg-amber-100/60'
              : 'bg-white border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-amber-800 font-bold">
            <span>Pending Action</span>
            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <ShieldCheck size={13} />
            </div>
          </div>
          <strong className="block text-2xl font-black font-mono text-amber-800">
            {pendingDecisionsCount} Items
          </strong>
          <div className="text-[10px] text-amber-700 font-semibold">Click for Decisions</div>
        </div>
      </div>

      <RevenueBreakdownModal isOpen={isBreakdownOpen} onClose={() => setIsBreakdownOpen(false)} />

      {/* NAVIGATION SUB-TABS ACROSS SECTIONS B, C, D, E, F */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2 text-xs">
        <button
          onClick={() => setActiveViewTab('OVERVIEW')}
          className={`px-4 py-2.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeViewTab === 'OVERVIEW'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs'
          }`}
        >
          <BarChart3 size={14} />
          <span>Executive Overview &amp; Trends</span>
        </button>

        <button
          onClick={() => setActiveViewTab('DEMAND')}
          className={`px-4 py-2.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeViewTab === 'DEMAND'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs'
          }`}
        >
          <Users size={14} />
          <span>Customer Demand Intelligence</span>
        </button>

        <button
          onClick={() => setActiveViewTab('PROCUREMENT')}
          className={`px-4 py-2.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeViewTab === 'PROCUREMENT'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs'
          }`}
        >
          <ShoppingCart size={14} />
          <span>Inventory Purchase Advisor</span>
        </button>

        <button
          onClick={() => setActiveViewTab('BRANCHES')}
          className={`px-4 py-2.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeViewTab === 'BRANCHES'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs'
          }`}
        >
          <Building2 size={14} />
          <span>Multi-Branch Intelligence</span>
        </button>

        <button
          onClick={() => setActiveViewTab('DECISIONS')}
          className={`px-4 py-2.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeViewTab === 'DECISIONS'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-amber-700 hover:text-amber-900 border border-amber-300 shadow-2xs'
          }`}
        >
          <ShieldCheck size={14} />
          <span>Owner Decision Centre ({pendingDecisionsCount})</span>
        </button>
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW & HISTORICAL CHARTS */}
      {activeViewTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Historical Recharts Grid */}
          <OwnerHistoricalCharts branchId={branch} startDate={startDate} endDate={endDate} />

          {/* Conversion Funnel & Top Vehicles Table */}
          <div className="grid gap-4 xl:grid-cols-3">
            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-md transition-all space-y-3 text-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Target size={14} className="text-purple-600" />
                  <span>Dealership Conversion Funnel</span>
                </h2>
                <span className="text-[10px] font-mono text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {overview.leadConversion ?? 0}% Win Rate
                </span>
              </div>
              <div className="space-y-2 pt-1 text-[10px]">
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                  <span className="font-semibold text-blue-950">Total Customer Leads</span>
                  <strong className="font-mono text-blue-950 text-xs font-bold">{enquiries}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between">
                  <span className="font-semibold text-purple-950">Test Drives Scheduled</span>
                  <strong className="font-mono text-purple-950 text-xs font-bold">{testDrives}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                  <span className="font-semibold text-amber-950">Test Drives Completed</span>
                  <strong className="font-mono text-amber-950 text-xs font-bold">{overview.completedTestDrivesCount ?? 0}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <span className="font-semibold text-emerald-950">Final Handover Sales</span>
                  <strong className="font-mono text-emerald-700 text-xs font-bold">{totalSales}</strong>
                </div>
              </div>
            </section>

            <div className="xl:col-span-2">
              <TopVehiclesTable branchId={branch} />
            </div>
          </div>

          {/* Interactive Repricing Simulator */}
          <WhatIfFinancialSimulator
            agingCount60Plus={Number(inventory?.ageing?.['61-90'] ?? 0) + Number(inventory?.ageing?.['120+'] ?? 0)}
            totalAgingCapital={inventoryValue ? inventoryValue * 0.35 : 0}
          />
        </div>
      )}

      {/* TAB 2: CUSTOMER DEMAND INTELLIGENCE (SECTION B) */}
      {activeViewTab === 'DEMAND' && (
        <div className="space-y-6">
          <CustomerDemandTable branchId={branch} startDate={startDate} endDate={endDate} />
          <CustomerDemandIntelligenceReport />
        </div>
      )}

      {/* TAB 3: INVENTORY PURCHASE ADVISOR (SECTION C) */}
      {activeViewTab === 'PROCUREMENT' && (
        <div className="space-y-6">
          <ProcurementIntelligenceHub data={procurementData} loading={loading} onRefresh={loadData} />
          <InventoryRiskSummary />
        </div>
      )}

      {/* TAB 4: MULTI-BRANCH INTELLIGENCE (SECTION D) */}
      {activeViewTab === 'BRANCHES' && (
        <div className="space-y-6">
          <MultiBranchIntelligenceView onSelectBranch={(bId) => setBranch(bId)} />
        </div>
      )}

      {/* TAB 5: OWNER DECISION CENTRE (SECTION E) */}
      {activeViewTab === 'DECISIONS' && (
        <div className="space-y-6">
          <OwnerDecisionCentre branchId={branch} onDecisionMade={loadData} />
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 pt-4 text-[11px] text-text-secondary mt-8 flex flex-col sm:flex-row items-center justify-between gap-2 font-medium">
        <span>&copy; {new Date().getFullYear()} CARREVIVE Automotive Dealership ERP &bull; Owner Decision Support</span>
        <span className="font-mono text-[10px]">Secure Owner Module v2.0</span>
      </footer>
    </div>
  );
}
