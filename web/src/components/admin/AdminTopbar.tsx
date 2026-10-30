'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { 
  Bell, 
  Search, 
  LogOut, 
  ChevronDown, 
  Calendar, 
  Building2, 
  Sun, 
  Moon, 
  X, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  CarFront, 
  Users, 
  Target, 
  TrendingUp, 
  Activity,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useThemeStore } from '../../store/useThemeStore';
import { showLocalToast } from '../Toast';
import { usePermissions } from '../../hooks/usePermissions';

interface AdminTopbarProps {
  onOpenDecisionScore?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

const BRANCHES = [
  { id: 'all', name: 'All Dealership Branches', desc: 'Consolidated network view' },
  { id: '1', name: 'Branch #1 · Chennai Central', desc: 'Flagship Showroom' },
  { id: '2', name: 'Branch #2 · Chennai OMR', desc: 'Luxury Tech Hub' },
  { id: '3', name: 'Branch #3 · Coimbatore Express', desc: 'Regional Sales Center' },
];

const QUICK_SEARCH_CHIPS = [
  'Skoda Kylaq',
  'Maruthi Suzuki Swift',
  'TN02BV0258',
  'TN97E1233',
  'Available',
  'Reserved',
];

export function AdminTopbar({ onOpenDecisionScore, searchQuery, onSearchChange }: AdminTopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  const { user, clearAuth } = useAuthStore();
  const permissions = usePermissions();
  const { notifications, unreadCount, markAllAsRead } = useNotificationStore();
  const { theme, toggleTheme } = useThemeStore();

  const [localSearch, setLocalSearch] = useState(searchQuery !== undefined ? searchQuery : urlSearch);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('All Dealership Branches');
  const [showHealthModal, setShowHealthModal] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const branchRef = useRef<HTMLDivElement>(null);

  // Sync state when props or URL parameters change
  useEffect(() => {
    if (searchQuery !== undefined) {
      setLocalSearch(searchQuery);
    } else if (urlSearch !== undefined) {
      setLocalSearch(urlSearch);
    }
  }, [searchQuery, urlSearch]);

  // Click outside listener for all dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setIsSearchFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setShowNotifMenu(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setShowProfileMenu(false);
      }
      if (branchRef.current && !branchRef.current.contains(target)) {
        setShowBranchMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const executeSearch = (queryToSearch: string, targetPath?: string) => {
    const trimmed = queryToSearch.trim();
    if (onSearchChange) {
      onSearchChange(trimmed);
    }

    const destination = targetPath || (
      pathname === '/admin/customers' ? '/admin/customers' :
      pathname === '/admin/leads' ? '/admin/leads' :
      pathname === '/admin/sales' ? '/admin/sales' :
      '/admin/inventory'
    );

    const queryString = trimmed ? `?search=${encodeURIComponent(trimmed)}` : '';
    router.push(`${destination}${queryString}`);
    setIsSearchFocused(false);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    executeSearch(localSearch);
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    executeSearch('');
  };

  const handleLogout = () => {
    clearAuth();
    showLocalToast('Successfully logged out.');
    router.push('/login');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'AK';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-border bg-bg-surface px-4 sm:px-6 sticky top-0 z-30">
        
        {/* Global Admin Search Bar with Integrated Search Button */}
        <div ref={searchContainerRef} className="relative w-full max-w-md">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-bg-surface-alt px-2.5 py-1 text-xs text-text-primary focus-within:border-accent transition-all"
          >
            <Search size={14} className="text-text-secondary shrink-0" />
            <input
              type="text"
              placeholder="Search VIN, stock #, customer..."
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                onSearchChange?.(e.target.value);
              }}
              onFocus={() => setIsSearchFocused(true)}
              className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-secondary focus:outline-none h-7"
            />

            {/* Clear Button */}
            {localSearch.length > 0 && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="p-1 rounded hover:bg-bg-surface text-text-secondary hover:text-text-primary cursor-pointer shrink-0"
                title="Clear search"
                aria-label="Clear search input"
              >
                <X size={13} />
              </button>
            )}

            {/* Dedicated Search Action Button */}
            <button
              type="submit"
              className="btn-primary text-xs h-7 px-3 flex items-center gap-1.5 shrink-0 rounded-md font-bold cursor-pointer transition-opacity"
              title="Execute search"
              aria-label="Execute Search"
            >
              <Search size={12} className="shrink-0" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </form>

          {/* Search Dropdown: Suggestions & Deep Jump Shortcuts */}
          {isSearchFocused && (
            <div className="absolute left-0 top-full mt-1.5 w-full rounded-lg border border-border bg-bg-surface p-3 shadow-lg z-50 text-xs">
              {/* Category Search Jumps */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block px-1 mb-1">
                  Search In Scope
                </span>
                <button
                  type="button"
                  onClick={() => executeSearch(localSearch, '/admin/inventory')}
                  className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-md hover:bg-bg-surface-alt text-left text-text-primary transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <CarFront size={14} className="text-accent shrink-0" />
                    <span>Search <strong>{localSearch ? `"${localSearch}"` : 'all'}</strong> in Vehicle Inventory</span>
                  </div>
                  <ArrowRight size={12} className="text-text-secondary" />
                </button>
                <button
                  type="button"
                  onClick={() => executeSearch(localSearch, '/admin/customers')}
                  className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-md hover:bg-bg-surface-alt text-left text-text-primary transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-status-info shrink-0" />
                    <span>Search <strong>{localSearch ? `"${localSearch}"` : 'all'}</strong> in Customer Directory</span>
                  </div>
                  <ArrowRight size={12} className="text-text-secondary" />
                </button>
                <button
                  type="button"
                  onClick={() => executeSearch(localSearch, '/admin/leads')}
                  className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-md hover:bg-bg-surface-alt text-left text-text-primary transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Target size={14} className="text-status-warning shrink-0" />
                    <span>Search in Stage 1: Leads & Follow-ups</span>
                  </div>
                  <ArrowRight size={12} className="text-text-secondary" />
                </button>
                <button
                  type="button"
                  onClick={() => executeSearch(localSearch, '/admin/sales')}
                  className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-md hover:bg-bg-surface-alt text-left text-text-primary transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-status-success shrink-0" />
                    <span>Search in Stage 2: Deals & Payments</span>
                  </div>
                  <ArrowRight size={12} className="text-text-secondary" />
                </button>
              </div>

              {/* Quick Filter Chips */}
              <div className="mt-3 pt-2.5 border-t border-border">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block px-1 mb-1.5">
                  Popular Queries & Filters
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_SEARCH_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setLocalSearch(chip);
                        executeSearch(chip);
                      }}
                      className="px-2 py-1 rounded-md bg-bg-surface-alt hover:bg-border text-text-primary text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="ml-4 flex items-center gap-2 text-text-secondary shrink-0">
          
          {/* Active Period / Date Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-bg-surface-alt text-xs font-bold text-text-primary select-none">
            <Calendar size={13} className="text-text-secondary" />
            <span>{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
          </div>

          {/* Interactive Branch Selector Pill & Dropdown */}
          <div ref={branchRef} className="relative hidden lg:block">
            <button
              type="button"
              onClick={() => setShowBranchMenu(!showBranchMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-bg-surface-alt text-xs font-bold text-text-primary hover:border-accent transition-colors cursor-pointer"
              title="Switch Active Showroom Branch"
            >
              <Building2 size={13} className="text-text-secondary shrink-0" />
              <span className="truncate max-w-[170px]">{selectedBranch}</span>
              <ChevronDown size={12} className={`text-text-secondary transition-transform ${showBranchMenu ? 'rotate-180' : ''}`} />
            </button>

            {showBranchMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-lg border border-border bg-bg-surface p-1.5 shadow-lg z-50 text-xs">
                <div className="px-2.5 py-1.5 border-b border-border text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                  Dealership Showrooms
                </div>
                {BRANCHES.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setSelectedBranch(b.name);
                      setShowBranchMenu(false);
                      showLocalToast(`Switched showroom to: ${b.name}`);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-md hover:bg-bg-surface-alt transition-colors flex items-center justify-between ${
                      selectedBranch === b.name ? 'font-bold text-accent bg-bg-surface-alt' : 'text-text-primary'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{b.name}</div>
                      <div className="text-[11px] text-text-secondary">{b.desc}</div>
                    </div>
                    {selectedBranch === b.name && <Check size={14} className="text-accent shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Operational Health Score Badge */}
          <button
            onClick={() => {
              if (onOpenDecisionScore) {
                onOpenDecisionScore();
              } else {
                setShowHealthModal(true);
              }
            }}
            className="badge badge-success cursor-pointer h-8 px-3 shrink-0 flex items-center gap-1.5"
            title="Click to view Operational Health & AI Decision Score"
          >
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            <span className="hidden sm:inline">Health Score: 84/100 Healthy</span>
            <span className="sm:hidden">84/100</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="btn-icon"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun size={16} />
            ) : (
              <Moon size={16} />
            )}
          </button>

          {/* Notifications Dropdown */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="btn-icon relative"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-status-danger text-[8px] font-bold text-text-primary px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-bg-surface p-2 shadow-lg z-50 text-xs">
                <div className="flex items-center justify-between p-2 border-b border-border mb-1">
                  <span className="font-bold text-text-primary">Operational Alerts</span>
                  <button
                    type="button"
                    onClick={() => {
                      markAllAsRead?.();
                      showLocalToast('All notifications marked as read.');
                    }}
                    className="text-[11px] font-bold text-accent hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-border">
                  <div 
                    className="p-2.5 hover:bg-bg-surface-alt rounded-lg transition-colors cursor-pointer"
                    onClick={() => {
                      setShowNotifMenu(false);
                      if (permissions.canAccessDeliveries) {
                        router.push('/admin/deliveries');
                      } else {
                        router.push('/admin/inventory');
                      }
                    }}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-text-primary">
                      <CheckCircle2 size={13} className="text-status-success shrink-0" />
                      <span>Inspection Roadworthiness Passed</span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      Skoda Kylaq certified with score 95/100.
                    </p>
                    <span className="text-[10px] text-text-secondary mt-1 block">12 mins ago</span>
                  </div>

                  <div 
                    className="p-2.5 hover:bg-bg-surface-alt rounded-lg transition-colors cursor-pointer"
                    onClick={() => {
                      setShowNotifMenu(false);
                      router.push('/admin/sales');
                    }}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-text-primary">
                      <AlertCircle size={13} className="text-status-warning shrink-0" />
                      <span>Payment Verification Pending</span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      ₹2,50,000 token receipt uploaded for TN02BV0258.
                    </p>
                    <span className="text-[10px] text-text-secondary mt-1 block">35 mins ago</span>
                  </div>

                  <div 
                    className="p-2.5 hover:bg-bg-surface-alt rounded-lg transition-colors cursor-pointer"
                    onClick={() => {
                      setShowNotifMenu(false);
                      router.push('/admin/inventory');
                    }}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-text-primary">
                      <CarFront size={13} className="text-status-info shrink-0" />
                      <span>New Stock Ingestion</span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      Volkswagen Virtus registered at Chennai OMR showroom.
                    </p>
                    <span className="text-[10px] text-text-secondary mt-1 block">1 hour ago</span>
                  </div>
                </div>

                <div className="p-2 border-t border-border mt-1 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifMenu(false);
                      router.push('/admin/alerts');
                    }}
                    className="w-full text-center text-xs font-bold text-accent hover:underline cursor-pointer"
                  >
                    View All Operational Alerts →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div ref={profileRef} className="relative border-l border-border pl-2">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-bg-surface-alt transition-colors text-left cursor-pointer"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-xs font-bold text-accent-text">
                {getInitials(user?.name)}
              </span>
              <div className="hidden xl:block text-xs">
                <strong className="block text-text-primary font-bold leading-tight">
                  {user?.name || 'Arun Kumar'}
                </strong>
                <small className="helper-text block">
                  {user?.role ? user.role.replace('_', ' ') : 'BRANCH MANAGER'}
                </small>
              </div>
              <ChevronDown size={13} className="text-text-secondary hidden sm:block" />
            </button>

            {/* Profile Menu Popup */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-bg-surface p-2 shadow-sm z-50 text-xs">
                <div className="p-2 border-b border-border mb-1">
                  <span className="font-bold text-text-primary block truncate">{user?.name || 'Arun Kumar'}</span>
                  <span className="helper-text block truncate mt-0.5">{user?.email || 'manager@carrevive.in'}</span>
                  <span className="badge badge-info mt-2">
                    {user?.role || 'BRANCH_MANAGER'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-status-danger hover:bg-bg-surface-alt rounded-lg font-bold text-xs cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Operational Health & Decision Score Modal */}
      {showHealthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-xl border border-border bg-bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-status-success-bg text-status-success flex items-center justify-center font-bold">
                  <Activity size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">Dealership Operational Health</h3>
                  <p className="text-xs text-text-secondary">AI Decision Core · Real-time network telemetry</p>
                </div>
              </div>
              <button
                onClick={() => setShowHealthModal(false)}
                className="p-1.5 rounded-lg hover:bg-bg-surface-alt text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-border bg-bg-surface-alt">
                <span className="helper-text block">Composite Health</span>
                <span className="text-2xl font-bold text-status-success">84 / 100</span>
                <span className="text-[11px] text-status-success font-bold block mt-0.5">● Healthy Performance</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-bg-surface-alt">
                <span className="helper-text block">Inspection Audit Compliance</span>
                <span className="text-2xl font-bold text-text-primary">94%</span>
                <span className="text-[11px] text-text-secondary block mt-0.5">150-point verified vehicles</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-bg-surface-alt">
                <span className="helper-text block">Lead Response SLA</span>
                <span className="text-2xl font-bold text-text-primary">82%</span>
                <span className="text-[11px] text-text-secondary block mt-0.5">&lt; 30 min customer outreach</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-bg-surface-alt">
                <span className="helper-text block">Payment Reconciliation</span>
                <span className="text-2xl font-bold text-status-success">91%</span>
                <span className="text-[11px] text-text-secondary block mt-0.5">Zero unverified receipts</span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-status-info bg-status-info-bg text-text-primary text-xs flex items-start gap-2.5">
              <ShieldAlert size={16} className="text-status-info shrink-0 mt-0.5" />
              <div>
                <strong>Recommendation:</strong> 2 vehicles at Chennai OMR showroom are awaiting final roadworthiness audit sign-off before listing live.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setShowHealthModal(false);
                  router.push('/admin/inventory');
                }}
                className="btn-neutral text-xs h-8 px-3"
              >
                View Showroom Inventory
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowHealthModal(false);
                  router.push('/admin/bi');
                }}
                className="btn-primary text-xs h-8 px-3"
              >
                View BI Analytics & Reports
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminTopbar;
