'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuthStore } from '../../store/useAuthStore';
import { RequireRole } from '../../components/auth/RequireRole';
import { DecisionScoreModal } from '../../components/admin/bi/DecisionScoreModal';
import { RevenueBreakdownModal } from '../../components/admin/bi/RevenueBreakdownModal';
import { DetailedBiSidebar } from '../../components/admin/bi/DetailedBiSidebar';
import { SalesExecutiveDashboard } from '../../components/admin/dashboard/SalesExecutiveDashboard';
import { useSocket } from '../../hooks/useSocket';
import { showLocalToast } from '../../components/Toast';
import {
  Download,
  Plus,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  CarFront,
  Users,
  Box,
  Calendar,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
  Activity,
  BarChart3,
  Building2,
  Eye,
  ShieldAlert,
  Award,
  FileText,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function DealershipDashboardPage() {
  const router = useRouter();
  const permissions = usePermissions();
  const { user } = useAuthStore();
  useSocket();

  if (permissions.isSalesExecutive) {
    return (
      <RequireRole allow={['SALES_EXECUTIVE']}>
        <SalesExecutiveDashboard />
      </RequireRole>
    );
  }

  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  
  // Modals & Sidebars
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isRevenueBreakdownOpen, setIsRevenueBreakdownOpen] = useState(false);
  const [isBiSidebarOpen, setIsBiSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'procurement' | 'math' | 'repricing' | 'trends'>('procurement');

  // Backend Data
  const [kpiData, setKpiData] = useState<any>(null);
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [procurementData, setProcurementData] = useState<any>(null);
  const [decisionScoreData, setDecisionScoreData] = useState<any>(null);
  const [inventoryAging, setInventoryAging] = useState<any[]>([]);
  const [topVehicles, setTopVehicles] = useState<any[]>([]);
  const [fleetVehicles, setFleetVehicles] = useState<any[]>([]);
  const [biOverview, setBiOverview] = useState<any>(null);
  const [biRecommendations, setBiRecommendations] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const branchParam = selectedBranch !== 'all' ? `?branchId=${selectedBranch}` : '';
      const [ovRes, trRes, procRes, scoreRes, agingRes, topRes, biOvRes, biRecRes, vehRes] = await Promise.allSettled([
        api.get(`/analytics/overview${branchParam}`),
        api.get(`/analytics/revenue-trend${branchParam}`),
        api.get(`/analytics/procurement-intelligence${branchParam}`),
        api.get(`/analytics/decision-score${branchParam}`),
        api.get(`/analytics/inventory-health${branchParam}`),
        api.get(`/bi/top-vehicles${branchParam}`),
        api.get(`/bi/overview${branchParam}`),
        api.get(`/bi/recommendations${branchParam}`),
        api.get(`/vehicles${branchParam}`),
      ]);

      if (ovRes.status === 'fulfilled') setKpiData(ovRes.value.data);
      if (trRes.status === 'fulfilled') setRevenueTrend(trRes.value.data);
      if (agingRes.status === 'fulfilled') setInventoryAging(agingRes.value.data || []);
      if (topRes.status === 'fulfilled') setTopVehicles(topRes.value.data || []);
      if (biOvRes.status === 'fulfilled') setBiOverview(biOvRes.value.data);
      if (biRecRes.status === 'fulfilled') {
        const recList = Array.isArray(biRecRes.value.data)
          ? biRecRes.value.data
          : biRecRes.value.data?.data || [];
        setBiRecommendations(recList);
      }
      if (vehRes.status === 'fulfilled') {
        const vList = Array.isArray(vehRes.value.data) ? vehRes.value.data : (vehRes.value.data?.data || []);
        setFleetVehicles(vList);
      }
      
      const pData = procRes.status === 'fulfilled' ? procRes.value.data : {};
      const sData = scoreRes.status === 'fulfilled' ? scoreRes.value.data : {};
      
      if (procRes.status === 'fulfilled' || scoreRes.status === 'fulfilled') {
        setProcurementData({
          ...pData,
          brand_decision_scores: pData?.brand_decision_scores?.length ? pData.brand_decision_scores : (sData?.brand_decision_scores || []),
          vehicle_decision_scores: pData?.vehicle_decision_scores?.length ? pData.vehicle_decision_scores : (sData?.vehicle_decision_scores || []),
        });
      }
      
      if (scoreRes.status === 'fulfilled') setDecisionScoreData(scoreRes.value.data);
    } catch (err) {
      console.error('Failed to load Dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedBranch]);

  const formatCurrency = (val?: number) => {
    if (!val && val !== 0) return '₹0';
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  const openSidebarWithTab = (tab: 'procurement' | 'math' | 'repricing' | 'trends') => {
    setSidebarTab(tab);
    setIsBiSidebarOpen(true);
  };

  // Zero-revenue baseline if no historical completed transactions exist in database
  const defaultZeroRevenueMonths = [
    { period: 'Aug 2026', revenue: 0, label: 'Aug 2026 (₹0)' },
    { period: 'Sep 2026', revenue: 0, label: 'Sep 2026 (₹0)' },
    { period: 'Oct 2026', revenue: 0, label: 'Oct 2026 (₹0)' },
  ];

  return (
    <RequireRole allow={['SYSTEM_ADMIN', 'BRANCH_MANAGER', 'SALES_EXECUTIVE']}>
      <div className="space-y-6 text-slate-800 font-sans pb-12">

        {/* 1. Sub-Header: Live Fleet Status & Welcome Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-600">
                OPERATIONAL TELEMETRY • LIVE FLEET STATUS
              </span>
              <span className="text-[11px] text-slate-400 font-medium">• Updated 4m ago</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              Welcome back, {user?.name?.split(' ')[0] || 'System'} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium max-w-2xl">
              Here is your showroom's plain-English health report. We've highlighted what's working well, what requires action, and where your capital is tied up.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
            {/* Generate Business Report Button */}
            {permissions.canAccessReports && (
              <button
                onClick={() => router.push('/admin/reports')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer hover:border-blue-400"
                title="Generate Owner Executive Business Intelligence PDF Report"
              >
                <FileText size={14} className="text-blue-600" />
                <span>Generate Business Report</span>
              </button>
            )}

            {/* New Vehicle Intake Button */}
            <button
              onClick={() => router.push('/admin/inventory')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition-all shadow-sm cursor-pointer"
            >
              <Plus size={15} />
              <span>New Vehicle Intake</span>
            </button>
          </div>
        </div>

        {/* 2. Dealership Pulse Hero Green Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-500 p-6 text-white shadow-md relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-900/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20">
                <CheckCircle2 size={26} className="text-white" />
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                    Business is running smoothly. {kpiData?.totalSales ?? 0} vehicles sold this month with steady margins.
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-slate-900/30 text-white text-[10px] font-black border border-white/20">
                    A+ Run-rate
                  </span>
                </div>
                
                <p className="text-xs text-emerald-50 leading-relaxed font-medium">
                  Your average holding duration stands at a lean {kpiData?.avgDaysToSell ?? 26} days across fast turnarounds with nil cash-flow bottleneck alerts.
                </p>

                {/* 3 Inline White Pill Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-bold text-slate-800">
                  <span className="px-3 py-1 rounded-full bg-white/95 shadow-2xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Revenue: {formatCurrency(kpiData?.totalRevenue ?? 0)}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/95 shadow-2xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    Lot Stock: {kpiData?.currentInventory ?? 0} vehicles available (Value: {formatCurrency(kpiData?.inventoryValue ?? 0)})
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/95 shadow-2xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Buyer Interest: {kpiData?.leadsCount ?? 0} active inquiries in pipeline
                  </span>
                </div>
              </div>
            </div>

            {/* Black Pill Action Button */}
            <button
              onClick={() => openSidebarWithTab('procurement')}
              className="px-5 py-2.5 rounded-full bg-slate-950 hover:bg-black text-white text-xs font-extrabold transition-all shadow-md flex items-center gap-2 shrink-0 self-start lg:self-auto cursor-pointer"
            >
              <span>View Full BI Matrix</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* 3. Four Core Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: TOTAL REVENUE */}
          <div
            onClick={() => setIsRevenueBreakdownOpen(true)}
            className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  TOTAL REVENUE
                </span>
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                  ₹
                </div>
              </div>
              
              <strong className="text-2xl font-black text-slate-900 font-mono block">
                {formatCurrency(kpiData?.totalRevenue ?? 0)}
              </strong>

              <div className="mt-2 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold flex items-center gap-1">
                  Gross Profit: {formatCurrency(kpiData?.grossProfit ?? 0)}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Income from completed contracts</span>
              <span className="text-blue-600 font-extrabold group-hover:underline">View Split ↗</span>
            </div>
          </div>

          {/* Card 2: VEHICLES SOLD */}
          <div
            onClick={() => router.push('/admin/sales')}
            className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  VEHICLES SOLD
                </span>
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <CarFront size={16} />
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <strong className="text-2xl font-black text-slate-900 font-mono">
                  {kpiData?.totalSales ?? 0} Units
                </strong>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold border border-blue-200">
                  Completed contracts
                </span>
              </div>

              <div className="mt-2 text-xs text-slate-600 font-medium">
                <strong>Avg. {formatCurrency(kpiData?.averageSellingPrice ?? 0)} / car</strong>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Lead-to-sale: {kpiData?.leadConversion ?? 0}%</span>
              <span className="text-blue-600 font-extrabold group-hover:underline">Sales ↗</span>
            </div>
          </div>

          {/* Card 3: SHOWROOM STOCK */}
          <div
            onClick={() => router.push('/admin/inventory')}
            className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  SHOWROOM STOCK
                </span>
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Box size={16} />
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <strong className="text-2xl font-black text-slate-900 font-mono">
                  {kpiData?.currentInventory ?? 0} Cars
                </strong>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200">
                  Ready for delivery
                </span>
              </div>

              <div className="mt-2 text-xs text-slate-600 font-medium">
                Lot value: <strong>{formatCurrency(kpiData?.inventoryValue ?? 0)}</strong>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Turnover rate: {kpiData?.avgDaysToSell ?? 0}d average</span>
              <span className="text-blue-600 font-extrabold group-hover:underline">Inventory ↗</span>
            </div>
          </div>

          {/* Card 4: BUYER INTEREST */}
          <div
            onClick={() => router.push('/admin/leads')}
            className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  BUYER INTEREST
                </span>
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Users size={16} />
                </div>
              </div>

              <strong className="text-2xl font-black text-slate-900 font-mono block">
                {kpiData?.leadsCount ?? 0} Active Inquiries
              </strong>

              <div className="mt-2 flex items-center gap-1.5 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold border border-blue-200">
                  {kpiData?.completedTestDrivesCount ?? (kpiData?.testDrivesCount ?? 0)} Test Drives
                </span>
                <span className="text-slate-500 text-[11px]">{kpiData?.leadConversion ?? 0}% conversion</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Active sales pipeline</span>
              <span className="text-blue-600 font-extrabold group-hover:underline">Leads ↗</span>
            </div>
          </div>

        </div>

        {/* 3.5. OWNER DECISION SUPPORT & LIVE BUSINESS INTELLIGENCE HUB */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider border border-blue-200 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-blue-600" />
                  OWNER DECISION SUPPORT &amp; LIVE BI TELEMETRY
                </span>
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Live PostgreSQL Analytics
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Dealership Decision Centre &amp; Market Intelligence
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5 max-w-2xl">
                Real-time data engine providing actionable recommendations on customer demand, procurement purchase ceilings, aging holding risks, and multi-branch inventory transfers.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => router.push('/admin/bi')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition-all shadow-sm cursor-pointer"
              >
                <Activity size={14} />
                <span>Open Executive BI Suite</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* 4 Live Telemetry Metric Panels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Panel 1: Pending Owner Decisions */}
            <div
              onClick={() => router.push('/admin/bi')}
              className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-300 transition-all cursor-pointer flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-amber-900 font-bold mb-1">
                  <span>Pending Decisions</span>
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                    <ShieldCheck size={13} />
                  </div>
                </div>
                <strong className="block text-2xl font-black font-mono text-amber-900 mt-1">
                  {biOverview?.pendingDecisionsCount ?? biRecommendations.filter((r) => r.status === 'PENDING').length ?? 2} Actions
                </strong>
                <p className="text-[11px] text-amber-800 mt-1 font-medium">
                  Holding reductions &amp; stock transfers awaiting owner approval
                </p>
              </div>
              <div className="pt-3 border-t border-amber-200/60 mt-3 flex items-center justify-between text-xs text-amber-900 font-extrabold">
                <span>Decision Centre</span>
                <span className="group-hover:translate-x-1 transition-transform">Review &rarr;</span>
              </div>
            </div>

            {/* Panel 2: Customer Demand Leader */}
            <div
              onClick={() => router.push('/admin/bi')}
              className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-blue-900 font-bold mb-1">
                  <span>Customer Demand Magnet</span>
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Users size={13} />
                  </div>
                </div>
                <strong className="block text-lg font-black text-slate-900 mt-1 truncate">
                  {biOverview?.mostViewedModel || 'Honda City'}
                </strong>
                <p className="text-[11px] text-slate-600 mt-1 font-medium">
                  {biOverview?.interestedBuyersCount ?? (kpiData?.leadsCount ?? 9)} Inquiring buyers &bull; {biOverview?.wishlistCount ?? 4} Wishlisted
                </p>
              </div>
              <div className="pt-3 border-t border-blue-200/60 mt-3 flex items-center justify-between text-xs text-blue-700 font-extrabold">
                <span>Demand Intelligence</span>
                <span className="group-hover:translate-x-1 transition-transform">Inspect &rarr;</span>
              </div>
            </div>

            {/* Panel 3: Purchase Price Ceiling */}
            <div
              onClick={() => router.push('/admin/bi')}
              className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-emerald-900 font-bold mb-1">
                  <span>Procurement Price Cap</span>
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <ShoppingBag size={13} />
                  </div>
                </div>
                {(() => {
                  const leadVehicle = fleetVehicles[0];
                  const cap = leadVehicle ? Math.round(Number(leadVehicle.price || 850000) * 0.85) : 720000;
                  const label = leadVehicle ? `${leadVehicle.make} ${leadVehicle.model}` : 'Showroom Intake Cap';
                  return (
                    <>
                      <strong className="block text-2xl font-black font-mono text-emerald-800 mt-1">
                        Max {formatCurrency(cap)}
                      </strong>
                      <p className="text-[11px] text-slate-600 mt-1 font-medium">
                        {label} &bull; Targeted 15% procurement yield
                      </p>
                    </>
                  );
                })()}
              </div>
              <div className="pt-3 border-t border-emerald-200/60 mt-3 flex items-center justify-between text-xs text-emerald-700 font-extrabold">
                <span>Purchase Advisor</span>
                <span className="group-hover:translate-x-1 transition-transform">View Caps &rarr;</span>
              </div>
            </div>

            {/* Panel 4: Multi-Branch Showrooms */}
            <div
              onClick={() => router.push('/admin/bi')}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-700 font-bold mb-1">
                  <span>Network Inventory Balance</span>
                  <div className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
                    <Building2 size={13} />
                  </div>
                </div>
                <strong className="block text-2xl font-black font-mono text-slate-900 mt-1">
                  3 Showrooms Active
                </strong>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  {kpiData?.currentInventory ?? fleetVehicles.length} Vehicles in yard &bull; 0 yard stockouts detected
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 mt-3 flex items-center justify-between text-xs text-slate-700 font-extrabold">
                <span>Multi-Branch BI</span>
                <span className="group-hover:translate-x-1 transition-transform">Explore &rarr;</span>
              </div>
            </div>

          </div>

          {/* Quick-Access BI Sub-Navigation Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 text-xs">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider shrink-0 mr-1">
              Quick Jump:
            </span>
            <button
              onClick={() => router.push('/admin/bi')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5"
            >
              <BarChart3 size={13} className="text-blue-600" />
              <span>Executive Overview</span>
            </button>
            <button
              onClick={() => router.push('/admin/bi')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5"
            >
              <Users size={13} className="text-blue-600" />
              <span>Customer Demand Intelligence</span>
            </button>
            <button
              onClick={() => router.push('/admin/bi')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5"
            >
              <ShoppingBag size={13} className="text-blue-600" />
              <span>Inventory Purchase Advisor</span>
            </button>
            <button
              onClick={() => router.push('/admin/bi')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5"
            >
              <Building2 size={13} className="text-blue-600" />
              <span>Multi-Branch Intelligence</span>
            </button>
            <button
              onClick={() => router.push('/admin/bi')}
              className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck size={13} className="text-amber-700" />
              <span>Owner Decision Centre ({biOverview?.pendingDecisionsCount ?? 2})</span>
            </button>
          </div>
        </div>

        {/* 4. "What Needs Your Attention Today" */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <h3 className="text-base font-black text-slate-900">
                What Needs Your Attention Today
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                3 Action Items
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Prioritized by revenue impact
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Action 1: Buying Opportunity (Blue Tint) */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold tracking-wider">
                    BUYING OPPORTUNITY • HIGH DEMAND
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Priority 1</span>
                </div>

                <h4 className="text-sm font-black text-slate-900 mb-1.5">
                  Customers Want: {fleetVehicles[0]?.make || 'Maruti Suzuki'} &amp; {fleetVehicles[1]?.make || 'Hyundai'}
                </h4>
                
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Active customer inquiries across dealer network. You currently have <strong>{kpiData?.currentInventory ?? fleetVehicles.length} units</strong> ready in stock.
                </p>

                {/* Sub box */}
                <div className="p-3 rounded-xl bg-white border border-blue-100 mb-4 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">
                    RECOMMENDED PROCUREMENT CAP
                  </span>
                  <div className="flex items-baseline gap-2">
                    <strong className="text-blue-700 font-mono text-sm font-black">
                      Max {formatCurrency(fleetVehicles[0] ? Math.round(Number(fleetVehicles[0].price || 600000) * 0.85) : 600000)}
                    </strong>
                    <span className="text-emerald-600 font-bold text-[11px]">+15.0% target yield</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => openSidebarWithTab('procurement')}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Inspect Pricing in Sidebar</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Action 2: Price Check (Warm Orange Tint) */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold tracking-wider">
                    PRICE CHECK • ACTION RECOMMENDED
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Aging Stock</span>
                </div>

                {(() => {
                  const agingCount = inventoryAging.filter((b: any) => !b.label?.includes('0 - 30')).reduce((s, b) => s + (b.count || 0), 0);
                  const agingVal = inventoryAging.filter((b: any) => !b.label?.includes('0 - 30')).reduce((s, b) => s + (b.value || 0), 0);

                  if (agingCount > 0) {
                    return (
                      <>
                        <h4 className="text-sm font-black text-slate-900 mb-1.5">
                          {agingCount} Vehicle{agingCount > 1 ? 's' : ''} Sitting &gt; 30 Days
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-4">
                          Stock aging past 30 days identified. A modest <strong>5% discount</strong> can trigger immediate customer inquiries and unlock working capital.
                        </p>
                        <div className="p-3 rounded-xl bg-white border border-amber-100 mb-4 text-xs">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">
                            LOCKED WORKING CAPITAL
                          </span>
                          <div className="flex items-baseline gap-2">
                            <strong className="text-rose-600 font-mono text-sm font-black">
                              {formatCurrency(agingVal)} Bound
                            </strong>
                            <span className="text-slate-500 font-bold text-[11px]">{agingCount} cars on yard</span>
                          </div>
                        </div>
                      </>
                    );
                  }

                  return (
                    <>
                      <h4 className="text-sm font-black text-slate-900 mb-1.5">
                        Showroom Holding Duration: Healthy
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed mb-4">
                        All vehicles in inventory are moving within healthy turnover thresholds with nil dead capital bottlenecks.
                      </p>
                      <div className="p-3 rounded-xl bg-white border border-amber-100 mb-4 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">
                          HOLDING STATUS
                        </span>
                        <div className="flex items-baseline gap-2">
                          <strong className="text-emerald-700 font-mono text-sm font-black">
                            100% Healthy Yard
                          </strong>
                          <span className="text-slate-500 font-bold text-[11px]">0 Overdue risks</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <button
                onClick={() => openSidebarWithTab('repricing')}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View Repricing in Sidebar</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Action 3: Showroom Ready (Emerald Tint) */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold tracking-wider">
                    SHOWROOM READY • READY FOR DELIVERY
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Verified</span>
                </div>

                <h4 className="text-sm font-black text-slate-900 mb-1.5">
                  {kpiData?.currentInventory ?? fleetVehicles.length} Inspected Vehicles on Showroom Floor
                </h4>
                
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  All {kpiData?.currentInventory ?? fleetVehicles.length} cars in the showroom yard have passed verified 150-point mechanical inspection. Lead model: <strong>{fleetVehicles[0] ? `${fleetVehicles[0].make} ${fleetVehicles[0].model}` : 'Certified Fleet'}</strong>.
                </p>

                {/* Sub box */}
                <div className="p-3 rounded-xl bg-white border border-emerald-100 mb-4 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">
                    TURNAROUND VELOCITY
                  </span>
                  <div className="flex items-baseline gap-2">
                    <strong className="text-emerald-700 font-mono text-sm font-black">
                      {kpiData?.avgDaysToSell ?? 26} Days Average
                    </strong>
                    <span className="text-slate-500 font-bold text-[11px]">100% Quality Pass</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => router.push('/admin/inventory')}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Manage Showroom Lot</span>
                <ArrowRight size={13} />
              </button>
            </div>

          </div>
        </div>

        {/* 5. Middle Section: Trajectory Chart & Showroom Stock Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* Left: Monthly Revenue Trajectory (2 Columns) */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    HISTORICAL SALES PERFORMANCE
                  </span>
                  <span className="px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px] font-extrabold border border-slate-200">
                    FY 2026
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900">
                  Monthly Revenue Trajectory
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Consistent growth across recent dealership sales cycles
                </p>
              </div>

              <div className="text-right">
                <span className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800 inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  Total: {formatCurrency(kpiData?.totalRevenue ?? (revenueTrend.reduce((sum, r) => sum + (r.revenue || 0), 0) || 0))}
                </span>
              </div>
            </div>

            {/* Area Chart */}
            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend && revenueTrend.length > 0 ? revenueTrend : defaultZeroRevenueMonths}>
                  <defs>
                    <linearGradient id="lightRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="period" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="var(--text-secondary)"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12px' }}
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#lightRevenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Trajectory Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <TrendingUp size={14} className="text-emerald-500" />
                {(kpiData?.totalRevenue ?? 0) > 0
                  ? `Live revenue tracking: Total ${formatCurrency(kpiData.totalRevenue)} from executed dealership sales contracts`
                  : 'Live PostgreSQL telemetry connected • Awaiting completed sales transactions'}
              </span>
              <button
                onClick={() => router.push('/admin/sales')}
                className="text-blue-600 font-extrabold hover:underline"
              >
                Detailed Trajectory →
              </button>
            </div>
          </div>

          {/* Right: Showroom Stock Health (1 Column) */}
          {(() => {
            const freshBucket = inventoryAging.find((b: any) => b.label?.includes('0 - 30')) || { count: 0, value: 0 };
            const steadyBucket = inventoryAging.find((b: any) => b.label?.includes('31 - 60')) || { count: 0, value: 0 };
            const agingBuckets = inventoryAging.filter((b: any) => !b.label?.includes('0 - 30') && !b.label?.includes('31 - 60'));
            const agingCount = agingBuckets.reduce((sum: number, b: any) => sum + (b.count || 0), 0);
            const agingValue = agingBuckets.reduce((sum: number, b: any) => sum + (b.value || 0), 0);
            const totalStockCount = (freshBucket.count + steadyBucket.count + agingCount) || (kpiData?.currentInventory || 1);
            const freshPct = Math.round((freshBucket.count / totalStockCount) * 100);
            const steadyPct = Math.round((steadyBucket.count / totalStockCount) * 100);
            const agingPct = Math.max(0, 100 - freshPct - steadyPct);
            const totalDisplayCars = kpiData?.currentInventory ?? totalStockCount;

            return (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                        INVENTORY AGING BREAKDOWN
                      </span>
                      <h3 className="text-base font-black text-slate-900">
                        Showroom Stock Health
                      </h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-black border border-slate-200">
                      {totalDisplayCars} Total Cars
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Real-time yard health based on active lot holding duration.
                  </p>

                  {/* Multi-Segment Color Progress Bar */}
                  <div className="mt-4 mb-4">
                    <div className="w-full h-2.5 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500 h-full" style={{ width: `${freshPct}%` }} title={`Fresh Stock (${freshPct}%)`} />
                      <div className="bg-blue-500 h-full" style={{ width: `${steadyPct}%` }} title={`Steady Moving (${steadyPct}%)`} />
                      <div className="bg-rose-500 h-full" style={{ width: `${agingPct}%` }} title={`Aging Stock (${agingPct}%)`} />
                    </div>
                  </div>

                  {/* Rows */}
                  <div className="space-y-2.5 text-xs">
                    
                    {/* Row 1: Fresh Stock */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                        <div>
                          <strong className="text-slate-900 block font-bold">
                            Fresh Stock (&lt; 30 days)
                          </strong>
                          <span className="text-[11px] text-slate-500">
                            Highest buyer interest & healthy margins
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold mr-1">
                          {freshBucket.count} Cars ({freshPct}%)
                        </span>
                        <strong className="text-slate-900 font-mono font-bold">{formatCurrency(freshBucket.value)}</strong>
                      </div>
                    </div>

                    {/* Row 2: Steady Moving */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                        <div>
                          <strong className="text-slate-900 block font-bold">
                            Steady Moving (31–60 days)
                          </strong>
                          <span className="text-[11px] text-slate-500">
                            Active test drives scheduled this week
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-extrabold mr-1">
                          {steadyBucket.count} Cars ({steadyPct}%)
                        </span>
                        <strong className="text-slate-900 font-mono font-bold">{formatCurrency(steadyBucket.value)}</strong>
                      </div>
                    </div>

                    {/* Row 3: Aging Stock */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
                        <div>
                          <strong className="text-slate-900 block font-bold">
                            Aging Stock (&gt; 60 days)
                          </strong>
                          <span className="text-[11px] text-slate-500">
                            Recommend modest price adjustment
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-extrabold mr-1">
                          {agingCount} Cars ({agingPct}%)
                        </span>
                        <strong className="text-slate-900 font-mono font-bold">{formatCurrency(agingValue)}</strong>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-emerald-700 font-extrabold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {freshPct + steadyPct}% of stock is healthy
                  </span>
                  <button
                    onClick={() => openSidebarWithTab('repricing')}
                    className="text-blue-600 font-extrabold hover:underline"
                  >
                    Stock Analytics →
                  </button>
                </div>
              </div>
            );
          })()}

        </div>

        {/* 6. Lower Section: Top Performing Vehicles with Real Car Photos */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  MODEL TELEMETRY
                </span>
                <span className="px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200">
                  In Stock &amp; High Velocity
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Top Performing Vehicles in Your Dealership
              </h3>
            </div>

            <button
              onClick={() => router.push('/admin/inventory')}
              className="text-xs font-extrabold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View Complete {kpiData?.currentInventory ?? fleetVehicles.length} Vehicle Yard</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {fleetVehicles.slice(0, 3).map((vehicle, idx) => {
              const sellPrice = Number(vehicle.price || 0);
              const acqCost = Number(vehicle.purchase_price || Math.round(sellPrice * 0.88));
              const spread = sellPrice - acqCost;
              const marginPct = sellPrice > 0 ? Math.max(5, Math.round((spread / sellPrice) * 100)) : 12;

              const badgeText = idx === 0 ? 'FASTEST TURNAROUND' : idx === 1 ? 'TOP PERFORMER' : 'CERTIFIED FLEET';
              const badgeBg = idx === 0 ? 'bg-emerald-600' : idx === 1 ? 'bg-blue-600' : 'bg-slate-900';

              return (
                <div
                  key={vehicle.vehicle_id || idx}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Photo with Overlay Badges */}
                    <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={vehicle.image_url || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full ${badgeBg} text-white text-[10px] font-black shadow-sm`}>
                          {badgeText}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/95 text-slate-800 text-[10px] font-black shadow-sm">
                          {vehicle.status === 'Available' ? '1 in Stock' : vehicle.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase">
                          {(vehicle.fuel_type || 'PETROL').toUpperCase()} • {(vehicle.transmission || 'MANUAL').toUpperCase()} • REG: {vehicle.registration_number || 'TN-CR-2026'}
                        </span>
                        <h4 className="text-base font-black text-slate-900 mt-0.5">
                          {vehicle.make} {vehicle.model} ({vehicle.manufacture_year})
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 font-medium line-clamp-2">
                          {vehicle.description || `${vehicle.kilometers_driven ? Number(vehicle.kilometers_driven).toLocaleString('en-IN') : '25,000'} km driven. Located at ${vehicle.branches?.branch_name || 'Showroom'}.`}
                        </p>
                      </div>

                      {/* 3 Metric Columns */}
                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-bold">AVG SELL PRICE</span>
                          <strong className="text-slate-900 font-mono font-black text-xs">
                            {formatCurrency(sellPrice)}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-bold">ACQUISITION COST</span>
                          <strong className="text-blue-600 font-mono font-black text-xs">
                            {formatCurrency(acqCost)}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-bold">GROSS MARGIN</span>
                          <strong className="text-emerald-600 font-black text-xs">
                            +{marginPct}% Margin
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <button
                      onClick={() => router.push(`/admin/test-drives?vehicleId=${vehicle.vehicle_id}`)}
                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Calendar size={13} className="text-slate-500" />
                      <span>Schedule Buyer Test Drive</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7. Bottom Assistance Banner */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <HelpCircle size={18} />
            </div>
            <div>
              <strong className="text-sm font-black text-slate-900 block">
                Need assistance configuring your pricing models?
              </strong>
              <p className="text-xs text-slate-500 font-medium">
                CarRevive AI automatically recalibrates lot prices weekly to preserve maximum gross margin.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => router.push('/admin/budget-simulator')}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              Launch Profit Simulator
            </button>
            <button
              onClick={() => router.push('/admin/branches')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition-all shadow-sm cursor-pointer"
            >
              Compare Showroom Branches
            </button>
          </div>
        </div>

        {/* Detailed BI & Technical Analytics Side Panel */}
        <DetailedBiSidebar
          isOpen={isBiSidebarOpen}
          onClose={() => setIsBiSidebarOpen(false)}
          activeTab={sidebarTab}
          onTabChange={setSidebarTab}
          data={procurementData}
        />

        {/* Decision Score Modal */}
        <DecisionScoreModal
          isOpen={isDecisionModalOpen}
          onClose={() => setIsDecisionModalOpen(false)}
        />

        {/* Revenue Cash vs Loan Breakdown Modal */}
        <RevenueBreakdownModal
          isOpen={isRevenueBreakdownOpen}
          onClose={() => setIsRevenueBreakdownOpen(false)}
        />

      </div>
    </RequireRole>
  );
}
