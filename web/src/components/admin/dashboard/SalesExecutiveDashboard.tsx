'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../store/useAuthStore';
import { showLocalToast } from '../../Toast';
import {
  TrendingUp,
  Target,
  ShoppingCart,
  Users,
  CheckCircle2,
  Clock,
  Car,
  Phone,
  RefreshCw,
  Building2,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText,
  DollarSign,
  Gauge,
  X,
  Loader2,
  ChevronRight,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export function SalesExecutiveDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Delivery Handover Modal state
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [odometerInput, setOdometerInput] = useState<number | string>('');
  const [notesInput, setNotesInput] = useState('');
  const [statusInput, setStatusInput] = useState('Delivered');
  const [customerReceivedInput, setCustomerReceivedInput] = useState(true);
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/analytics/sales-executive/overview');
      setData(res.data);
    } catch (err: any) {
      console.error('Failed to load Sales Executive Dashboard:', err);
      showLocalToast('Failed to load real-time executive analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const openHandoverModal = (delivery: any) => {
    setSelectedDelivery(delivery);
    setOdometerInput(delivery.odometer_reading || 14500);
    setNotesInput(delivery.delivery_notes || 'Vehicle inspected, all documents & keys handed over.');
    setStatusInput('Delivered');
    setCustomerReceivedInput(true);
  };

  const closeHandoverModal = () => {
    setSelectedDelivery(null);
  };

  const submitDeliveryHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery) return;

    setSubmittingAction(true);
    try {
      await api.patch(`/deliveries/${selectedDelivery.delivery_id}`, {
        delivery_status: statusInput,
        customer_received: customerReceivedInput,
        odometer_reading: Number(odometerInput),
        delivery_notes: notesInput,
      });

      showLocalToast(`Delivery #${selectedDelivery.delivery_id} successfully marked as ${statusInput}!`);
      closeHandoverModal();
      await fetchDashboardData();
    } catch (err: any) {
      console.error('Handover update failed:', err);
      showLocalToast(err.response?.data?.message || 'Failed to update delivery handover');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleLeadStatusAdvance = async (leadId: number, nextStatus: string) => {
    try {
      await api.patch(`/leads/${leadId}`, { status: nextStatus });
      showLocalToast(`Lead #${leadId} updated to ${nextStatus}`);
      await fetchDashboardData();
    } catch (err: any) {
      showLocalToast('Failed to update lead status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 font-sans">
        <Loader2 className="w-10 h-10 animate-spin text-sky-400" />
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
          Compiling your executive analytics &amp; delivery pipeline...
        </p>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const executive = data?.executive || {};
  const pipelineFunnel = data?.pipelineFunnel || [];
  const leadSources = data?.leadSources || [];
  const monthlyTrend = data?.monthlyTrend || [];
  const actionableDeliveries = data?.actionableDeliveries || [];
  const priorityLeads = data?.priorityLeads || [];

  return (
    <div className="space-y-6 font-sans text-text-primary pb-10">
      {/* Executive Welcome Hero Header */}
      <div className="relative overflow-hidden rounded-lg bg-bg-surface border border-border p-6 sm:p-8">

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-[11px] font-extrabold uppercase tracking-wider border border-sky-500/30 flex items-center gap-1.5">
                <Sparkles size={12} className="text-sky-400" />
                Sales Executive Portal
              </span>
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-extrabold border border-indigo-500/30 flex items-center gap-1.5">
                <Building2 size={12} />
                {executive.branch_name || 'CarRevive Branch'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/20">
                Staff ID #{executive.employee_id}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {executive.name || user?.name || 'Sales Executive'}
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl font-medium">
              Real-time operational business analytics for your assigned customer leads and vehicle handovers. All metrics reflect live database records.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={fetchDashboardData}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin text-sky-400' : 'text-slate-400'} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Analytics'}</span>
            </button>
            <button
              onClick={() => router.push('/admin/deliveries')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-extrabold transition-all shadow-lg cursor-pointer flex items-center gap-2"
            >
              <ShoppingCart size={14} />
              <span>Deliveries ({kpis.pendingDeliveries || 0} Pending)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Core Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Assigned Leads & Pipeline */}
        <div className="rounded-lg bg-bg-surface border border-border p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Total Leads Assigned</span>
            <div className="w-9 h-9 rounded-lg bg-bg-surface-alt border border-border text-text-primary flex items-center justify-center">
              <Target size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-text-primary">{kpis.totalLeads ?? 0}</span>
            <span className="text-xs text-text-secondary font-bold">inquiries</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-text-secondary border-t border-border pt-2.5">
            <span className="text-success font-bold">{kpis.activeLeads ?? 0} Active Inquiries</span>
            <span>{kpis.lostLeads ?? 0} Dropped</span>
          </div>
        </div>

        {/* KPI 2: Conversion Rate */}
        <div className="rounded-lg bg-bg-surface border border-border p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Lead Conversion Rate</span>
            <div className="w-9 h-9 rounded-lg bg-bg-surface-alt border border-border text-text-primary flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-success">{kpis.conversionRate ?? 0}%</span>
            <span className="text-xs text-text-secondary font-bold">Won vs Total</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-text-secondary border-t border-border pt-2.5">
            <span className="text-success font-bold">{kpis.convertedLeads ?? 0} Deals Won</span>
            <span>Target: 30%+</span>
          </div>
        </div>

        {/* KPI 3: Closed Revenue */}
        <div className="rounded-lg bg-bg-surface border border-border p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Closed Sales Revenue</span>
            <div className="w-9 h-9 rounded-lg bg-bg-surface-alt border border-border text-text-primary flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-text-primary">
              ₹{(kpis.totalClosedRevenue || 0).toLocaleString('en-IN')}
            </span>
            <span className="badge-success text-xs">
              Paid &amp; Delivered
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-text-secondary border-t border-border pt-2.5">
            <span className="text-accent font-bold">{kpis.totalClosedDeals ?? 0} Closed Deals</span>
            {kpis.pipelineDealsCount > 0 ? (
              <span className="text-warning font-bold">
                Pipeline: ₹{((kpis.pipelineRevenue || 0) / 100000).toFixed(1)}L ({kpis.pipelineDealsCount} pending)
              </span>
            ) : (
              <span>Avg ₹{((kpis.averageDealValue || 0) / 100000).toFixed(1)}L / car</span>
            )}
          </div>
        </div>

        {/* KPI 4: Pending Delivery Handover Actions */}
        <div className="rounded-lg bg-bg-surface border border-border p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Vehicle Handover Actions</span>
            <div className="w-9 h-9 rounded-lg bg-bg-surface-alt border border-border text-text-primary flex items-center justify-center">
              <ShoppingCart size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-warning">{kpis.pendingDeliveries ?? 0}</span>
            <span className="text-xs text-text-secondary font-bold">Actions Pending</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-text-secondary border-t border-border pt-2.5">
            <span className="text-success font-bold">{kpis.completedDeliveries ?? 0} Completed</span>
            <span>{kpis.deliveryFulfillmentRate ?? 100}% Fulfillment</span>
          </div>
        </div>
      </div>

      {/* Actionable Deliveries Hub (High Priority Delivery Handover Actions) */}
      <div className="rounded-lg bg-bg-surface border border-border p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider border border-amber-500/30">
                Action Required
              </span>
              <span className="text-xs text-slate-400 font-medium">Pending Delivery Execution</span>
            </div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2 mt-1">
              <ShoppingCart size={18} className="text-amber-400" />
              My Assigned Vehicle Deliveries ({actionableDeliveries.length})
            </h2>
            <p className="text-xs text-slate-400">
              Vehicles assigned to you ready for customer handover, odometer record, and receipt verification
            </p>
          </div>

          <button
            onClick={() => router.push('/admin/deliveries')}
            className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>View All Deliveries</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {actionableDeliveries.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-200">All Delivery Actions Completed</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No pending deliveries assigned to your queue at this moment. New closed vehicle sales will automatically appear here for handover.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {actionableDeliveries.map((del: any) => (
              <div
                key={del.delivery_id}
                className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 p-5 space-y-4 transition-all shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="font-mono text-[11px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      DELIVERY #{del.delivery_id}
                    </span>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5 mt-1">
                      <Car size={15} className="text-amber-400" />
                      {del.vehicle_name || 'Vehicle'}
                    </h3>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Clock size={11} />
                    {del.delivery_status || 'Pending'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Customer</span>
                    <strong className="text-slate-200 block truncate">{del.customer_name}</strong>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone size={10} /> {del.customer_phone}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Delivery Date</span>
                    <strong className="text-slate-200 block">
                      {del.delivery_date ? new Date(del.delivery_date).toLocaleDateString('en-IN') : 'Scheduled'}
                    </strong>
                    <span className="text-[11px] text-purple-300 font-mono mt-0.5 block">
                      Odo: {del.odometer_reading ? `${del.odometer_reading} km` : 'Pending entry'}
                    </span>
                  </div>
                </div>

                {del.delivery_notes && (
                  <p className="text-[11px] text-slate-400 italic bg-slate-800/30 px-3 py-1.5 rounded-lg border border-slate-800/50">
                    &ldquo;{del.delivery_notes}&rdquo;
                  </p>
                )}

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                  <span className="text-[11px] text-slate-400 font-semibold">
                    Amount: ₹{(del.final_amount || 0).toLocaleString('en-IN')}
                  </span>
                  <button
                    onClick={() => openHandoverModal(del)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all shadow cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} />
                    <span>Execute Handover</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual Sales Funnel & Monthly Trend Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Funnel Breakdown */}
        <div className="lg:col-span-2 rounded-lg bg-bg-surface border border-border p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Target size={18} className="text-purple-400" />
                Personal Lead Conversion Funnel
              </h2>
              <p className="text-xs text-slate-400">
                Conversion progress across your assigned leads from initial contact to delivery
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
              {kpis.totalLeads || 0} Total Leads
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {pipelineFunnel.map((item: any) => {
              const count = item.count || 0;
              const pct = item.percentage || 0;
              let barColor = 'bg-sky-500';
              if (item.stage.includes('Won')) barColor = 'bg-emerald-500';
              if (item.stage.includes('Lost')) barColor = 'bg-rose-500';
              if (item.stage.includes('Negotiat')) barColor = 'bg-amber-500';
              if (item.stage.includes('Qualif')) barColor = 'bg-indigo-500';

              return (
                <div key={item.stage} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{item.stage}</span>
                    <span className="font-mono font-extrabold text-slate-300">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full ${barColor} transition-all duration-500`}
                      style={{ width: `${Math.max(pct, count > 0 ? 5 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Sources Distribution */}
        <div className="rounded-lg bg-bg-surface border border-border p-6 space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Users size={18} className="text-sky-400" />
              Lead Acquisition Channels
            </h2>
            <p className="text-xs text-slate-400">
              Origin breakdown of inquiries assigned to you
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {leadSources.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No lead sources recorded yet.</p>
            ) : (
              leadSources.map((src: any) => (
                <div
                  key={src.source}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs"
                >
                  <span className="font-bold text-slate-200">{src.source}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-sky-400">{src.count}</span>
                    <span className="text-[10px] text-slate-400">({src.percentage}%)</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Monthly Performance Chart (if data exists) */}
      {monthlyTrend.length > 0 && (
        <div className="rounded-lg bg-bg-surface border border-border p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <TrendingUp size={18} className="text-accent" />
                Monthly Revenue &amp; Deal Closures
              </h2>
              <p className="text-xs text-text-secondary">
                Closed automotive sales revenue trajectory for your executive performance
              </p>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={11} />
                <YAxis
                  stroke="var(--text-secondary)"
                  fontSize={11}
                  tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12px' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue Closed']}
                />
                <Bar dataKey="revenue" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Priority Leads Queue */}
      <div className="rounded-lg bg-bg-surface border border-border p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Target size={18} className="text-purple-400" />
              High Priority Customer Leads
            </h2>
            <p className="text-xs text-slate-400">
              Active inquiries requiring immediate customer outreach &amp; booking follow-up
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/leads')}
            className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>View All My Leads</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                <th className="py-2.5 px-3">Lead</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Vehicle Interested</th>
                <th className="py-2.5 px-3">Interest Level</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Quick Transition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {priorityLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No active priority leads in your queue.
                  </td>
                </tr>
              ) : (
                priorityLeads.map((ld: any) => (
                  <tr key={ld.lead_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-sky-400">
                      #{ld.lead_id}
                    </td>
                    <td className="py-3 px-3">
                      <strong className="block text-white font-extrabold">{ld.customer_name}</strong>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Phone size={10} /> {ld.customer_phone}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-300">
                      {ld.vehicle_name}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          ld.interest_level === 'High'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {ld.interest_level}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {ld.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {ld.status !== 'Qualified' && (
                          <button
                            onClick={() => handleLeadStatusAdvance(ld.lead_id, 'Qualified')}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 text-white text-[10px] font-bold cursor-pointer transition-all"
                          >
                            Qualify
                          </button>
                        )}
                        {ld.status !== 'Negotiation' && (
                          <button
                            onClick={() => handleLeadStatusAdvance(ld.lead_id, 'Negotiation')}
                            className="px-2.5 py-1 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white text-[10px] font-bold cursor-pointer transition-all"
                          >
                            Negotiate
                          </button>
                        )}
                        {ld.status !== 'Won' && (
                          <button
                            onClick={() => handleLeadStatusAdvance(ld.lead_id, 'Won')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer transition-all"
                          >
                            Mark Won
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Delivery Handover Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-lg bg-bg-surface border border-border p-6 sm:p-8 shadow-lg space-y-4">
            <button
              type="button"
              onClick={closeHandoverModal}
              className="btn-neutral w-8 h-8 p-0 flex items-center justify-center rounded-lg absolute top-5 right-5"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-500/30">
                  Execution Action
                </span>
                <span className="font-mono text-xs text-sky-400 font-bold">
                  DELIVERY #{selectedDelivery.delivery_id}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white mt-1">
                Vehicle Delivery &amp; Customer Handover
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete handover documentation for {selectedDelivery.customer_name} ({selectedDelivery.vehicle_name})
              </p>
            </div>

            <form onSubmit={submitDeliveryHandover} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Odometer Reading at Handover (km)
                </label>
                <input
                  type="number"
                  required
                  value={odometerInput}
                  onChange={(e) => setOdometerInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-sky-500 transition-colors"
                  placeholder="e.g. 14250"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Delivery Handover Status
                </label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-sky-500 transition-colors"
                >
                  <option value="Delivered">Delivered (Handover Completed)</option>
                  <option value="Ready for Handover">Ready for Handover</option>
                  <option value="In Progress">In Progress (PDI Pending)</option>
                  <option value="Pending">Scheduled / Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Executive Handover Remarks &amp; Checklist Notes
                </label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs font-medium text-white focus:outline-none focus:border-sky-500 transition-colors"
                  placeholder="e.g. Verified customer ID, keys handed over, full warranty kit provided."
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <input
                  type="checkbox"
                  id="customerReceived"
                  checked={customerReceivedInput}
                  onChange={(e) => setCustomerReceivedInput(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-800 border-slate-700 cursor-pointer"
                />
                <label htmlFor="customerReceived" className="text-xs text-slate-200 font-semibold cursor-pointer">
                  Customer has received vehicle and signed delivery handover receipt
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeHandoverModal}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer transition-all shadow flex items-center gap-2 disabled:opacity-50"
                >
                  {submittingAction ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  <span>Save &amp; Complete Handover</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
