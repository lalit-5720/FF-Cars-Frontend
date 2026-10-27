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
  ShoppingCart,
  Target,
  TrendingUp,
  Users,
  Award,
  ChevronDown,
  FileText,
  Calculator,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { usePermissions } from '../../hooks/usePermissions';
import { CarReviveIcon } from '../CarReviveIcon';

interface SidebarNavItem {
  label: string;
  icon: any;
  href: string;
  show?: boolean;
  badge?: string;
  stage?: string;
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const permissions = usePermissions();

  const isSalesExecutive = permissions.isSalesExecutive;

  const mainHub: SidebarNavItem[] = [
    { label: 'Showroom Overview', icon: LayoutDashboard, href: '/admin', show: permissions.canAccessOverview },
  ];

  const fourStageWorkflow = [
    { label: 'Stage 1: Leads & Assignments', icon: Target, href: '/admin/leads', show: permissions.canAccessLeads, stage: 'S1' },
    { label: 'Stage 2: Deals & Payments', icon: TrendingUp, href: '/admin/sales', show: permissions.canAccessSales, stage: 'S2' },
    { label: 'Stage 3: Deliveries & PDI', icon: ShoppingCart, href: '/admin/deliveries', show: permissions.canAccessDeliveries, stage: 'S3' },
    { label: 'Stage 4: BI & Analytics', icon: CircleDollarSign, href: '/admin/bi', show: permissions.canAccessOverview, stage: 'S4' },
  ];

  const showroomAssets = [
    { label: 'Vehicle Inventory', icon: CarFront, href: '/admin/inventory', show: permissions.canAccessInventory },
    { label: 'Customer Directory', icon: Users, href: '/admin/customers', show: permissions.canAccessLeads },
    { label: 'Valuation & Sell Enquiries', icon: Calculator, href: '/admin/quotations', show: true, badge: 'New' },
  ];

  const dealershipAdmin = [
    { label: 'Business Reports', icon: FileText, href: '/admin/reports', show: permissions.canAccessReports },
    { label: 'Branches', icon: Building2, href: '/admin/branches', show: permissions.isSystemAdmin },
    { label: 'Reviews Moderation', icon: Award, href: '/admin/reviews', show: permissions.canAccessReviews },
    { label: 'Settings', icon: Settings, href: '/admin/settings', show: permissions.canAccessSettings },
  ];

  const executiveItems: SidebarNavItem[] = [
    { label: 'Showroom Overview', icon: LayoutDashboard, href: '/admin', show: true },
    { label: 'Stage 1: Leads & Follow-ups', icon: Target, href: '/admin/leads', show: true },
    { label: 'Stage 1: Test Drives', icon: Gauge, href: '/admin/test-drives', show: true },
    { label: 'Valuation & Sell Enquiries', icon: Calculator, href: '/admin/quotations', show: true },
    { label: 'Stage 3: Vehicle Deliveries', icon: ShoppingCart, href: '/admin/deliveries', show: true },
    { label: 'Vehicle Inventory', icon: CarFront, href: '/admin/inventory', show: true },
    { label: 'Customers', icon: Users, href: '/admin/customers', show: true },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-bg-surface lg:flex flex-col text-text-secondary">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <CarReviveIcon size={34} variant="shield" className="shrink-0" />
        <div>
          <span className="text-base font-bold text-text-primary block leading-tight">
            CarRevive
          </span>
          <span className="text-[10px] font-bold tracking-wider text-text-secondary uppercase block">
            Command Center
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-4">
        {isSalesExecutive ? (
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary block px-3 mb-1">
              My Workspace
            </span>
            {executiveItems.map(({ label, icon: Icon, href, badge }) => {
              const active = pathname === href;
              return (
                <button
                  key={label}
                  onClick={() => router.push(href)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-bold transition-colors cursor-pointer ${
                    active
                      ? 'bg-accent text-accent-text'
                      : 'text-text-secondary hover:bg-bg-surface-alt hover:text-text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} className={active ? 'text-accent-text' : 'text-text-secondary'} />
                    <span>{label}</span>
                  </div>
                  {badge && (
                    <span className="badge badge-info text-[10px] px-1.5 py-0">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <>
            {/* 1. MAIN / DASHBOARD */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary block px-3 mb-1">
                Showroom Core
              </span>
              <div className="space-y-1">
                {mainHub.filter(i => i.show).map(({ label, icon: Icon, href, badge }) => {
                  const active = pathname === href;
                  return (
                    <button
                      key={label}
                      onClick={() => router.push(href)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-bold transition-colors cursor-pointer ${
                        active
                          ? 'bg-accent text-accent-text'
                          : 'text-text-secondary hover:bg-bg-surface-alt hover:text-text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} className={active ? 'text-accent-text' : 'text-text-secondary'} />
                        <span>{label}</span>
                      </div>
                      {badge && (
                        <span className="badge badge-success text-[10px] px-1.5 py-0">
                          {badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. 4-STAGE OPERATIONAL PIPELINE */}
            <div>
              <div className="flex items-center justify-between px-3 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  4-Stage Pipeline
                </span>
                <span className="badge badge-info text-[10px] px-1.5 py-0">
                  Core
                </span>
              </div>
              <div className="space-y-1">
                {fourStageWorkflow.filter(i => i.show).map(({ label, icon: Icon, href, stage }) => {
                  const active = pathname === href;
                  return (
                    <button
                      key={label}
                      onClick={() => router.push(href)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-bold transition-colors cursor-pointer ${
                        active
                          ? 'bg-accent text-accent-text'
                          : 'text-text-secondary hover:bg-bg-surface-alt hover:text-text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={15} className={active ? 'text-accent-text' : 'text-text-secondary'} />
                        <span>{label}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        active ? 'bg-accent-text text-accent' : 'bg-bg-surface-alt text-text-secondary border border-border'
                      }`}>
                        {stage}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. SHOWROOM ASSETS */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary block px-3 mb-1">
                Showroom Assets
              </span>
              <div className="space-y-1">
                {showroomAssets.filter(i => i.show).map(({ label, icon: Icon, href }) => {
                  const active = pathname === href;
                  return (
                    <button
                      key={label}
                      onClick={() => router.push(href)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-bold transition-colors cursor-pointer ${
                        active
                          ? 'bg-accent text-accent-text'
                          : 'text-text-secondary hover:bg-bg-surface-alt hover:text-text-primary'
                      }`}
                    >
                      <Icon size={16} className={active ? 'text-accent-text' : 'text-text-secondary'} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. DEALERSHIP ADMIN */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary block px-3 mb-1">
                Administration
              </span>
              <div className="space-y-1">
                {dealershipAdmin.filter(i => i.show).map(({ label, icon: Icon, href }) => {
                  const active = pathname === href;
                  return (
                    <button
                      key={label}
                      onClick={() => router.push(href)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-bold transition-colors cursor-pointer ${
                        active
                          ? 'bg-accent text-accent-text'
                          : 'text-text-secondary hover:bg-bg-surface-alt hover:text-text-primary'
                      }`}
                    >
                      <Icon size={15} className={active ? 'text-accent-text' : 'text-text-secondary'} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Footer Branch Box */}
      <div className="p-3 border-t border-border">
        <div className="rounded-lg border border-border bg-bg-surface-alt p-3 text-xs">
          <div className="flex items-center justify-between text-xs text-text-secondary font-bold">
            <span>{isSalesExecutive ? 'Assigned Branch' : 'Current Branch'}</span>
            <ChevronDown size={13} />
          </div>
          <strong className="mt-1 block font-bold text-text-primary">
            {user?.branch_id ? `Branch #${user.branch_id}` : 'CarRevive HQ'}
          </strong>
        </div>
      </div>
    </aside>
  );
}

export default AdminSidebar;
