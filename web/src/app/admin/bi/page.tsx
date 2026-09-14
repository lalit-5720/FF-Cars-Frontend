'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Bell, Building2, CalendarDays, CarFront, ChevronDown, CircleDollarSign, Clock3, Gauge, LayoutDashboard, Loader2, Menu, Search, Settings, ShieldAlert, ShoppingCart, SlidersHorizontal, Target, TrendingUp, Users, X } from 'lucide-react';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../store/useAuthStore';
import { WhatIfFinancialSimulator } from '../../../components/admin/bi/WhatIfFinancialSimulator';
import { CustomerDemandIntelligenceReport } from '../../../components/admin/bi/CustomerDemandIntelligenceReport';
import { ProcurementIntelligenceHub } from '../../../components/admin/bi/ProcurementIntelligenceHub';
import { VehicleValuationCalculator } from '../../../components/admin/bi/VehicleValuationCalculator';
import { InventoryRiskSummary } from '../../../components/admin/bi/InventoryRiskSummary';

const money = (value: number) => value >= 10000000 ? `₹${(value / 10000000).toFixed(2)} Cr` : value >= 100000 ? `₹${(value / 100000).toFixed(2)} L` : `₹${Math.round(value || 0).toLocaleString('en-IN')}`;
const navItems = [['Dashboard', LayoutDashboard, '/admin'], ['Executive Overview', Activity, '/admin/overview'], ['Sales Analytics', TrendingUp, '/admin/sales'], ['Inventory Intelligence', CarFront, '/admin/inventory'], ['Lead Management', Target, '/admin/leads'], ['Test Drive Requests', Target, '/admin/test-drives'], ['Customer Analytics', Users, '/admin/customers'], ['Vehicle Demand', Gauge, '/admin/demand'], ['Branch Performance', Building2, '/admin/branches'], ['Reports', CircleDollarSign, '/admin/reports'], ['Alerts & Actions', ShieldAlert, '/admin/alerts'], ['Budget Simulator', ShoppingCart, '/admin/budget-simulator'], ['Reviews & Ratings', Activity, '/admin/reviews'], ['Settings', Settings, '/admin/settings']] as const;

export default function BiOverviewPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [branch, setBranch] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [branches, setBranches] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>({});
  const [inventory, setInventory] = useState<any>({});
  const [executive, setExecutive] = useState<any>({});
  const [trendData, setTrendData] = useState<any[]>([]);
  const [topVehicles, setTopVehicles] = useState<any[]>([]);
  const [funnel, setFunnel] = useState<any>({ stages: [] });
  const [procurementData, setProcurementData] = useState<any>(null);
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);
  const canAccess = useMemo(() => ['SYSTEM_ADMIN', 'BRANCH_MANAGER', 'ADMIN', 'SALES_EXECUTIVE'].includes(user?.role ?? ''), [user]);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login?redirect=/admin/overview'); return; }
    if (!canAccess) { router.push('/dashboard'); return; }
    const load = async () => {
      setLoading(true);
      const params = { ...(branch === 'all' ? {} : { branchId: branch }), ...(startDate ? { startDate } : {}), ...(endDate ? { endDate } : {}) };
      const empty = (data: any) => ({ data });
      const [branchRes, overviewRes, inventoryRes, executiveRes, trendRes, topVehiclesRes, funnelRes, procRes] = await Promise.all([
        api.get('/branches').catch(() => empty([])), api.get('/bi/overview', { params }).catch(() => empty({})), api.get('/bi/inventory', { params }).catch(() => empty({ ageing: {} })), api.get('/bi/executive', { params }).catch(() => empty({ branchPerformance: [] })), api.get('/bi/revenue-trend', { params: { ...params, granularity } }).catch(() => empty([])), api.get('/bi/top-vehicles', { params: { ...params, limit: 5 } }).catch(() => empty([])), api.get('/bi/funnel', { params }).catch(() => empty({ stages: [] })),
        api.get('/analytics/procurement-intelligence', { params }).catch(() => empty({}))
      ]);
      setBranches(Array.isArray(branchRes.data) ? branchRes.data : branchRes.data?.data ?? []); setOverview(overviewRes.data ?? {}); setInventory(inventoryRes.data ?? {}); setExecutive(executiveRes.data ?? {}); setTrendData(Array.isArray(trendRes.data) ? trendRes.data : trendRes.data?.data ?? []); setTopVehicles(Array.isArray(topVehiclesRes.data) ? topVehiclesRes.data : topVehiclesRes.data?.data ?? []); setFunnel(funnelRes.data ?? { stages: [] }); setProcurementData(procRes.data ?? {}); setLoading(false);
    };
    load();
  }, [branch, canAccess, endDate, granularity, isAuthenticated, router, startDate]);

  const revenue = Number(overview.totalRevenue ?? executive.totalRevenue ?? 0);
  const totalSales = Number(overview.totalSales ?? executive.totalSales ?? 0);
  const inventoryValue = Number(inventory.inventoryValue ?? executive.inventoryValue ?? 0);
  const leadConversion = Number(executive.leadConversion ?? 0);
  const performance = executive.branchPerformance ?? [];
  const ageing = inventory.ageing ?? {};
  const ageItems = [['0-30 Days', ageing['0-30'] ?? 0, '#527fe9'], ['31-60 Days', ageing['31-60'] ?? 0, '#6bae72'], ['61-90 Days', ageing['61-90'] ?? 0, '#d99b3f'], ['91-120 Days', ageing['91-120'] ?? 0, '#db5b4e'], ['120+ Days', ageing['120+'] ?? 0, '#a34945']] as const;
  const ageTotal = Math.max(ageItems.reduce((sum, item) => sum + Number(item[1]), 0), 1);
  const donut = ageItems.map((item) => `${item[2]} ${(Number(item[1]) / ageTotal) * 100}%`).join(', ');
  const branchTotal = Math.max(performance.reduce((sum: number, item: any) => sum + Number(item.salesCount ?? 0), 0), 1);
  const branchDonut = performance.map((item: any, index: number, list: any[]) => {
    const start = list.slice(0, index).reduce((sum: number, previous: any) => sum + (Number(previous.salesCount ?? 0) / branchTotal) * 100, 0);
    const end = start + (Number(item.salesCount ?? 0) / branchTotal) * 100;
    return `${['#527fe9', '#6bae72', '#d99b3f', '#7b4fc0', '#a65e4a'][index % 5]} ${start}% ${end}%`;
  }).join(', ');
  const trend = trendData.map((item) => ({ label: item.period ?? 'Unknown', revenue: Number(item.revenue ?? 0) }));
  const trendMax = Math.max(...trend.map((item) => item.revenue), 1);
  const cards = [['Total Revenue', money(revenue), CircleDollarSign, '#4fce81'], ['Total Sales', totalSales.toLocaleString('en-IN'), ShoppingCart, '#5169f4'], ['Gross Profit', executive.grossProfit == null ? 'N/A' : money(Number(executive.grossProfit)), CircleDollarSign, '#9d62d5'], ['Inventory Value', money(inventoryValue), CarFront, '#c5762d'], ['Avg. Days to Sell', 'N/A', Clock3, '#4d9ab7'], ['Lead Conversion', `${leadConversion.toFixed(1)}%`, Target, '#55a863']] as const;

  return <div className="min-h-screen bg-[#111827] text-[#e7edf8] selection:bg-blue-500/30">
    <aside className={`fixed inset-y-0 left-0 z-40 w-[236px] border-r border-border/[0.07] bg-[#101827] transition-transform lg:translate-x-0 ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-[58px] items-center gap-3 border-b border-border/[0.07] px-7"><div className="relative h-8 w-12"><span className="absolute left-0 top-2 h-3 w-12 rounded-[50%] border-t-2 border-blue-400 rotate-[-9deg]" /><span className="absolute left-2 top-5 h-1 w-9 rounded-full bg-blue-300/80" /></div><span className="text-[18px] font-semibold tracking-[-0.04em]">Car<span className="font-normal text-[#dae2ef]">Revive</span></span><button className="ml-auto lg:hidden" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={17} /></button></div>
      <nav className="space-y-1 px-2 py-4">{navItems.map(([label, Icon, href], index) => <button key={label} onClick={() => router.push(href)} className={`flex w-full items-center gap-3 rounded-md px-3 py-[8px] text-left text-[11px] font-medium transition ${index === 1 ? 'bg-[#293c91] text-foreground shadow-[inset_3px_0_0_#6e99ff]' : 'text-[#8c98ad] hover:bg-secondary/[0.05] hover:text-foreground'}`}><Icon size={14} strokeWidth={1.8} />{label}</button>)}</nav>
      <div className="absolute bottom-3 left-2 right-2 rounded-md border border-border/[0.12] bg-secondary/[0.025] p-3 text-[10px] text-[#aeb8c9]"><div className="mb-2 flex items-center justify-between"><span>Current Branch</span><ChevronDown size={12} /></div><strong className="font-medium text-foreground">{branches[0]?.branch_name ?? 'No branch selected'}</strong></div>
    </aside>
    <main className="min-h-screen lg:pl-[236px]">
      <header className="flex h-[58px] items-center justify-between border-b border-border/[0.07] bg-[#141c2b] px-4 sm:px-7"><div className="flex items-center gap-4"><button className="text-[#aab5c7] lg:hidden" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={18} /></button><div className="hidden items-center gap-2 rounded-md border border-border/[0.12] bg-secondary/[0.02] px-3 py-1.5 text-[11px] text-[#7d899e] sm:flex"><Search size={13} />Search anything...</div></div><div className="flex items-center gap-4 text-[#b3bdd0]"><Bell size={17} /><div className="hidden items-center gap-2 border-l border-border/[0.1] pl-4 sm:flex"><div className="grid h-7 w-7 place-items-center rounded-full bg-[#bf9d80] text-[10px] font-bold text-[#251e1b]">AU</div><div className="text-[10px] leading-tight"><strong className="block text-foreground">Admin User</strong><span>Super Admin</span></div><ChevronDown size={12} /></div></div></header>
      <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-7"><div className="mb-4 flex flex-col justify-between gap-4 xl:flex-row xl:items-center"><div><h1 className="text-[20px] font-semibold tracking-[-0.03em] text-foreground">Executive Overview</h1><p className="mt-1 text-[10px] text-[#8995a9]">Real-time overview of your dealership performance</p></div><div className="flex flex-wrap gap-2"><label className="flex items-center gap-2 rounded-md border border-border/[0.18] bg-[#1b2434] px-3 py-2 text-[10px] text-[#d5dbea]"><CalendarDays size={13} /><input aria-label="Start date" type="date" value={startDate} max={endDate || undefined} onChange={(e) => setStartDate(e.target.value)} className="w-[108px] bg-transparent text-[10px] outline-none" /><span className="text-[#68758b]">to</span><input aria-label="End date" type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} className="w-[108px] bg-transparent text-[10px] outline-none" /></label><label className="flex items-center gap-2 rounded-md border border-border/[0.18] bg-[#1b2434] px-3 py-2 text-[10px] text-[#d5dbea]"><Building2 size={13} /><select value={branch} onChange={(e) => setBranch(e.target.value)} className="bg-transparent outline-none"><option value="all">All Branches</option>{branches.map((item) => <option key={item.branch_id} value={item.branch_id}>{item.branch_name}</option>)}</select><ChevronDown size={12} /></label><button className="flex items-center gap-2 rounded-md bg-[#314ed0] px-3 py-2 text-[10px] font-semibold text-foreground"><SlidersHorizontal size={13} />Filters</button></div></div>
        {loading ? <div className="grid min-h-[500px] place-items-center"><Loader2 className="animate-spin text-blue-400" /></div> : <><div className="mb-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">{cards.map(([label, value, Icon, color]) => <div key={label} className="relative overflow-hidden rounded-md border border-border/[0.08] bg-[#202a39] px-3 py-3 shadow-xl shadow-black/10"><div className="mb-2 flex items-center justify-between text-[10px] text-[#a6b0c0]"><span>{label}</span><span className="grid h-7 w-7 place-items-center rounded-full" style={{ backgroundColor: `${color}38`, color }}><Icon size={14} /></span></div><strong className="block text-[16px] font-semibold text-[#f6f8fc]">{value}</strong><span className="text-[9px] text-[#7b879a]">Live metric</span></div>)}</div>
          <div className="grid gap-3 xl:grid-cols-[1.1fr_.9fr_1fr]"><section className="rounded-md border border-border/[0.08] bg-[#202a39] p-3"><div className="mb-2 flex items-center justify-between"><h2 className="text-[12px] font-semibold text-foreground">Revenue Trend</h2><div className="flex overflow-hidden rounded border border-border/[0.12] text-[9px]"><button className="px-2 py-1 text-[#aab4c6]">Daily</button><button className="px-2 py-1 text-[#aab4c6]">Weekly</button><button className="bg-[#3e5edc] px-2 py-1 text-foreground">Monthly</button></div></div><div className="relative h-[155px] rounded bg-[#1b2534] p-3"><div className="absolute inset-3 flex flex-col justify-between opacity-20">{[1, 2, 3, 4].map((item) => <div key={item} className="border-t border-dashed border-[#8290a6]" />)}</div><svg viewBox="0 0 600 170" preserveAspectRatio="none" className="relative h-full w-full"><polyline fill="rgba(75,123,239,.12)" stroke="#5790f7" strokeWidth="3" points={trend.map((value: any, index: number) => `${index * 100},${160 - (Number(value) / (trendMax || 1)) * 135}`).join(' ') + ' 600,170 0,170'} /><polyline fill="none" stroke="#5790f7" strokeWidth="3" points={trend.map((value: any, index: number) => `${index * 100},${160 - (Number(value) / (trendMax || 1)) * 135}`).join(' ')} />{trend.map((value: any, index: number) => <circle key={index} cx={index * 100} cy={160 - (Number(value) / (trendMax || 1)) * 135} r="4" fill="#5790f7" />)}</svg><div className="absolute bottom-1 left-3 right-3 flex justify-between text-[8px] text-[#8490a5]"><span>Dec 2023</span><span>Jan 2024</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span></div></div></section><section className="rounded-md border border-border/[0.08] bg-[#202a39] p-3"><h2 className="mb-2 text-[12px] font-semibold text-foreground">Sales Breakdown</h2><div className="flex min-h-[155px] items-center justify-center gap-4"><div className="relative grid h-[128px] w-[128px] place-items-center rounded-full" style={{ background: branchDonut ? `conic-gradient(${branchDonut})` : '#2d374a' }}><div className="grid h-[74px] w-[74px] place-items-center rounded-full bg-[#202a39] text-center"><strong className="block text-[18px] text-foreground">{totalSales}</strong><span className="text-[8px] text-[#9ca8ba]">Total Sales</span></div></div><div className="space-y-2 text-[9px] text-[#b7c0cf]">{(performance.length ? performance.slice(0, 5) : [{ branchName: 'CarRevive HQ', salesCount: totalSales }]).map((item: any, index: number) => <div key={item.branchName} className="flex items-center gap-2"><i className="h-2 w-2 rounded-sm" style={{ backgroundColor: ['#527fe9', '#6bae72', '#d99b3f', '#7b4fc0', '#a65e4a'][index] }} />{item.branchName}<span className="ml-auto text-[#a5b0c2]">{item.salesCount ?? 0}</span></div>)}</div></div></section><section className="rounded-md border border-border/[0.08] bg-[#202a39] p-3"><h2 className="mb-2 text-[12px] font-semibold text-foreground">Inventory Aging <span className="font-normal text-[#8995a9]">(By Vehicles)</span></h2><div className="flex min-h-[155px] items-center justify-center gap-4"><div className="relative grid h-[128px] w-[128px] place-items-center rounded-full" style={{ background: `conic-gradient(${donut})` }}><div className="grid h-[74px] w-[74px] place-items-center rounded-full bg-[#202a39] text-center"><strong className="block text-[15px] text-foreground">{money(inventoryValue)}</strong><span className="text-[8px] text-[#9ca8ba]">Total</span></div></div><div className="space-y-2 text-[9px] text-[#b7c0cf]">{ageItems.map((item) => <div key={item[0]} className="flex items-center gap-2"><i className="h-2 w-2 rounded-sm" style={{ backgroundColor: item[2] }} />{item[0]}<span className="ml-auto text-[#a5b0c2]">{item[1]}</span></div>)}</div></div></section></div>

          {/* Car Buying Intelligence Hub */}
          <div className="my-6">
            <ProcurementIntelligenceHub data={procurementData} loading={loading} />
          </div>

          {/* Executive Customer Preference & Demand Intelligence Report */}
          <div className="my-4">
            <CustomerDemandIntelligenceReport />
          </div>

          {/* AI Vehicle Price Valuation & Condition Estimator */}
          <div className="my-4">
            <VehicleValuationCalculator />
          </div>

          {/* Interactive What-If Repricing Simulator */}
          <div className="my-4">
            <WhatIfFinancialSimulator
              agingCount60Plus={Number(ageing['61-90'] ?? 0) + Number(ageing['91-120'] ?? 0) + Number(ageing['120+'] ?? 0) || 14}
              totalAgingCapital={inventoryValue ? inventoryValue * 0.35 : 18500000}
            />
          </div>

          <div className="mt-3 grid gap-3 xl:grid-cols-[1.2fr_1fr_1.08fr_.95fr]">
            <InventoryRiskSummary />
            <section className="rounded-md border border-border/[0.08] bg-[#202a39] p-3"><h2 className="mb-2 text-[12px] font-semibold text-foreground">Lead to Sale Funnel</h2><div className="flex flex-col items-center gap-1 pt-1 text-center text-[9px]"><div className="w-[86%] bg-[#527fe9] py-2 text-foreground">Leads <strong className="block text-[12px]">{funnel.stages?.[0]?.count ?? 0}</strong></div><div className="w-[70%] bg-[#64a76d] py-2 text-foreground">Test Drives <strong className="block text-[12px]">{funnel.stages?.[1]?.count ?? 0}</strong></div><div className="w-[56%] bg-[#d59a3c] py-2 text-foreground">Qualified <strong className="block text-[12px]">{totalSales}</strong></div><div className="w-[42%] bg-[#bb515a] py-2 text-foreground">Sales <strong className="block text-[12px]">{funnel.stages?.[2]?.count ?? 0}</strong></div></div><div className="mt-3 rounded border border-border/[0.1] py-2 text-center text-[9px] text-[#aeb9c9]">Conversion Rate: <strong className="text-foreground">{leadConversion.toFixed(1)}%</strong> <span className="ml-2 text-green-400">↑ 3.2%</span></div></section>
            <section className="rounded-md border border-border/[0.08] bg-[#202a39] p-3"><h2 className="mb-2 text-[12px] font-semibold text-foreground">Top Performing Vehicles</h2><div className="divide-y divide-white/[0.08] text-[9px] text-[#bac3d1]"><div className="grid grid-cols-[1fr_42px_65px] bg-secondary/[0.04] px-2 py-2 text-[#8d99ac]"><span>Vehicle</span><span>Sales</span><span>Revenue</span></div>{topVehicles.length ? topVehicles.map((item: any) => <div key={item.vehicle} className="grid grid-cols-[1fr_42px_65px] items-center px-2 py-2"><span className="flex items-center gap-2"><span className="grid h-5 w-7 place-items-center rounded bg-[#354153]"><CarFront size={13} /></span>{item.vehicle}</span><span>{item.sales}</span><span>{money(Number(item.revenue ?? 0))}</span></div>) : <div className="p-4 text-muted-foreground">No vehicle sales data available.</div>}</div><button onClick={() => router.push('/admin/inventory')} className="mt-3 w-full rounded border border-border/[0.12] py-2 text-[9px] text-[#8faef8]">View All Vehicles</button></section>
            <section className="space-y-3"><div className="rounded-md border border-border/[0.08] bg-[#202a39] p-3"><h2 className="mb-3 text-[12px] font-semibold text-foreground">Recent Alerts</h2>{[['High risk inventory', 'More than 120 days in stock', ShieldAlert, '#e25c50'], ['Capital locked in aging inventory', '61+ days in stock', ShieldAlert, '#db983b'], ['Creta demand is high in City Center', 'Low stock for high demand', Activity, '#6287e6']].map(([title, sub, Icon, color]: any[]) => <div key={String(title)} className="mb-3 flex gap-2 text-[9px]"><span style={{ color: String(color) }}><Icon size={15} /></span><span><strong className="block font-medium text-[#e5eaf2]">{title}</strong><small className="text-[#8692a6]">{sub}</small></span></div>)}<button onClick={() => router.push('/admin/alerts')} className="w-full text-center text-[9px] text-[#8faef8]">View All Alerts</button></div><div className="rounded-md border border-border/[0.08] bg-[#202a39] p-3"><h2 className="mb-2 text-[12px] font-semibold text-foreground">Quick Actions</h2><div className="grid grid-cols-2 gap-1"><button onClick={() => router.push('/admin/inventory')} className="rounded bg-[#3855d2] p-2 text-[9px] text-foreground">Add Vehicle</button><button onClick={() => router.push('/admin/leads')} className="rounded bg-[#39764c] p-2 text-[9px] text-foreground">Add Lead</button><button onClick={() => router.push('/admin/reports')} className="rounded bg-[#6241a2] p-2 text-[9px] text-foreground">View Reports</button><button onClick={() => router.push('/admin/budget-simulator')} className="rounded bg-[#a85d20] p-2 text-[9px] text-foreground">Budget Simulator</button></div></div></section>
          </div></>}
      </div><footer className="border-t border-border/[0.07] px-7 py-4 text-[9px] text-[#748095]"><span>© 2024 CarRevive. All rights reserved.</span><span className="float-right">Version 1.0.0</span></footer>
    </main>
  </div>;
}
