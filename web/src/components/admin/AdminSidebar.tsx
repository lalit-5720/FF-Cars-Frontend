'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  Building2,
  CarFront,
  CircleDollarSign,
  Gauge,
  LayoutDashboard,
  Settings,
  ShieldAlert,
  ShoppingCart,
  Target,
  TrendingUp,
  Users,
  ExternalLink,
  ChevronDown,
  Award,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { usePermissions } from '../../hooks/usePermissions';

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const permissions = usePermissions();

  const mainItems = [
    { label: 'Business Intelligence', icon: Activity, href: '/admin', show: permissions.canAccessOverview },
    { label: 'Sales Analytics', icon: TrendingUp, href: '/admin/sales', show: permissions.canAccessSales },
    { label: 'Inventory Intelligence', icon: CarFront, href: '/admin/inventory', show: permissions.canAccessInventory },
    { label: 'Test Drives', icon: Gauge, href: '/admin/test-drives', show: permissions.canAccessLeads },
    { label: 'Customer Leads', icon: Target, href: '/admin/leads', show: permissions.canAccessLeads },
    { label: 'Vehicle Deliveries', icon: ShoppingCart, href: '/admin/deliveries', show: permissions.canAccessSales },
    { label: 'Customer Analytics', icon: Users, href: '/admin/customers', show: permissions.canAccessLeads },
    { label: 'Vehicle Demand', icon: Gauge, href: '/admin/demand', show: permissions.canAccessInventory },
    { label: 'Branch Performance', icon: Building2, href: '/admin/branches', show: permissions.canAccessOverview },
    { label: 'Reports', icon: CircleDollarSign, href: '/admin/reports', show: permissions.canAccessReports },
    { label: 'Alerts & Actions', icon: ShieldAlert, href: '/admin/alerts', show: permissions.canAccessOverview },
    { label: 'Budget Simulator', icon: ShoppingCart, href: '/admin/budget-simulator', show: permissions.canAccessOverview },
    { label: 'Reviews & Ratings', icon: Award, href: '/admin/reviews', show: permissions.canAccessReviews },
    { label: 'Settings', icon: Settings, href: '/admin/settings', show: permissions.canAccessSettings },
  ];

  const visibleItems = mainItems.filter((i) => i.show);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-800/80 bg-[#0f172a] font-sans lg:flex flex-col text-slate-300">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6 text-lg font-extrabold tracking-tight text-white">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
          <CarFront size={18} />
        </div>
        <span>Car<span className="text-sky-400">Revive</span></span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto custom-scrollbar">
        {visibleItems.map(({ label, icon: Icon, href }) => {
          const active = pathname === href || (href === '/admin/overview' && pathname === '/admin/bi');
          return (
            <button
              key={label}
              onClick={() => router.push(href)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-semibold transition-all ${
                active
                  ? 'bg-[#1e293b] text-sky-400 border border-sky-500/20 shadow-sm font-extrabold'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <Icon size={16} className={active ? 'text-sky-400' : 'text-slate-400'} />
              {label}
            </button>
          );
        })}

        {/* Modules Section */}
        <div className="pt-4 pb-1 px-3">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-2">
            MODULES
          </span>
          <div className="space-y-1">
            <button
              onClick={() => router.push('/cars')}
              className="flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-left text-xs font-medium text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 transition-colors"
            >
              <span>Customer Portal</span>
              <ExternalLink size={13} />
            </button>
            <button
              onClick={() => router.push('/admin')}
              className="flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-left text-xs font-medium text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 transition-colors"
            >
              <span>Admin Portal</span>
              <ExternalLink size={13} />
            </button>
          </div>
        </div>
      </nav>

      {/* Footer Branch Box */}
      <div className="p-3 border-t border-slate-800">
        <div className="rounded-xl border border-slate-800 bg-[#1e293b]/60 p-3 text-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
            <span>Current Branch</span>
            <ChevronDown size={13} />
          </div>
          <strong className="mt-1 block font-extrabold text-slate-100">
            {user?.branch_id ? `Branch #${user.branch_id}` : 'CarRevive HQ'}
          </strong>
        </div>
      </div>
    </aside>
  );
}

export default AdminSidebar;


