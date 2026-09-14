'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';
import { RequireRole } from '../../components/auth/RequireRole';
import { ExecutiveKpiGrid } from '../../components/admin/bi/ExecutiveKpiGrid';
import { RevenueTrendChart } from '../../components/admin/bi/RevenueTrendChart';
import { SalesByBranchDonut } from '../../components/admin/bi/SalesByBranchDonut';
import { InventoryAgingDonut } from '../../components/admin/bi/InventoryAgingDonut';
import { InventoryRiskSummary } from '../../components/admin/bi/InventoryRiskSummary';
import { VisualSalesFunnel } from '../../components/admin/bi/VisualSalesFunnel';
import { TopVehiclesTable } from '../../components/admin/bi/TopVehiclesTable';
import { AlertsAndActionsCard } from '../../components/admin/bi/AlertsAndActionsCard';
import { DecisionScoreModal } from '../../components/admin/bi/DecisionScoreModal';
import { ProcurementIntelligenceHub } from '../../components/admin/bi/ProcurementIntelligenceHub';
import { useSocket } from '../../hooks/useSocket';
import { Calendar, Building2, SlidersHorizontal, RefreshCw, Sparkles, Activity } from 'lucide-react';

export default function BusinessIntelligencePage() {
  const permissions = usePermissions();
  useSocket(); // Hook up real-time WebSockets

  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [branches, setBranches] = useState<Array<{ branch_id: number; branch_name: string }>>([]);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);

  const [kpiData, setKpiData] = useState<any>(null);
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [procurementData, setProcurementData] = useState<any>(null);
  const [decisionScoreData, setDecisionScoreData] = useState<any>(null);

  const fetchBiData = async () => {
    setLoading(true);
    try {
      const branchParam = selectedBranch !== 'all' ? `?branchId=${selectedBranch}` : '';
      const [ovRes, trRes, procRes, scoreRes] = await Promise.allSettled([
        api.get(`/analytics/overview${branchParam}`),
        api.get(`/analytics/revenue-trend${branchParam}`),
        api.get(`/analytics/procurement-intelligence${branchParam}`),
        api.get(`/analytics/decision-score${branchParam}`),
      ]);

      if (ovRes.status === 'fulfilled') setKpiData(ovRes.value.data);
      if (trRes.status === 'fulfilled') setRevenueTrend(trRes.value.data);
      if (procRes.status === 'fulfilled') setProcurementData(procRes.value.data);
      if (scoreRes.status === 'fulfilled') setDecisionScoreData(scoreRes.value.data);
    } catch (err) {
      console.error('Failed to load Business Intelligence data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBiData();
  }, [selectedBranch]);

  useEffect(() => {
    if (permissions.isSystemAdmin) {
      api.get('/branches').then((res) => setBranches(res.data)).catch(() => {});
    }
  }, [permissions.isSystemAdmin]);

  const decisionScore = decisionScoreData?.score ?? 84;
  const decisionStatus = decisionScoreData?.status ?? 'Strong Operations';

  return (
    <RequireRole allow={['SYSTEM_ADMIN', 'BRANCH_MANAGER', 'SALES_EXECUTIVE']}>
      <div className="space-y-6 text-slate-100 font-sans pb-8">
        
        {/* Page Header Bar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-extrabold uppercase tracking-wider border border-sky-500/30">
                Business Intelligence Engine
              </span>
              <span className="text-xs text-slate-400 font-medium">Real-time Operational Analytics</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white mt-1">
              Business Intelligence & Car Procurement Hub
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Analyze customer buying preferences by manufacture year & budget, track revenue trends, and review dynamic decision alerts
            </p>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Dynamic Decision Score Button */}
            <button
              onClick={() => setIsDecisionModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3.5 py-2 text-xs font-extrabold transition-all shadow-md cursor-pointer border border-blue-400/30"
            >
              <Activity size={14} className="text-sky-300" />
              <span>Decision Score: {decisionScore} / 100</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/20 uppercase font-black">
                {decisionStatus}
              </span>
            </button>

            {/* Date Range Badge */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#1e293b]/90 px-3.5 py-2 text-xs font-semibold text-slate-200 shadow">
              <Calendar size={14} className="text-slate-400" />
              <span>Historical to Date (Sep 2026)</span>
            </div>

            {/* Branch Selector */}
            {permissions.canSelectBranch && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#1e293b]/90 px-3.5 py-2 text-xs font-semibold text-slate-200 shadow">
                <Building2 size={14} className="text-slate-400" />
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="bg-transparent text-slate-100 font-bold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="all" className="bg-[#1e293b]">All Dealership Branches</option>
                  {branches.map((b) => (
                    <option key={b.branch_id} value={b.branch_id} className="bg-[#1e293b]">
                      {b.branch_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Refresh Button */}
            <button
              onClick={fetchBiData}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-slate-700"
              title="Refresh Analytics"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* 6 KPI Cards Grid */}
        <ExecutiveKpiGrid data={kpiData} loading={loading} />

        {/* CORE SECTION 1: Car Procurement & Customer Preference Intelligence */}
        <ProcurementIntelligenceHub data={procurementData} loading={loading} onRefresh={fetchBiData} />

        {/* CORE SECTION 2: Revenue Trend & Sales Breakdown Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <RevenueTrendChart data={revenueTrend} loading={loading} />
          <SalesByBranchDonut loading={loading} />
          <InventoryAgingDonut loading={loading} />
        </div>

        {/* CORE SECTION 3: Risk Summary, Funnel, Top Vehicles & Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <InventoryRiskSummary />
          <VisualSalesFunnel />
          <TopVehiclesTable />
          <AlertsAndActionsCard />
        </div>

        {/* Decision Score Intelligence Modal */}
        <DecisionScoreModal
          isOpen={isDecisionModalOpen}
          onClose={() => setIsDecisionModalOpen(false)}
        />
      </div>
    </RequireRole>
  );
}
