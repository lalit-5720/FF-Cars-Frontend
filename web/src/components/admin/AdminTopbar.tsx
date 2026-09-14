'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, LogOut, ChevronDown, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { showLocalToast } from '../Toast';

interface AdminTopbarProps {
  onOpenDecisionScore?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export function AdminTopbar({ onOpenDecisionScore, searchQuery, onSearchChange }: AdminTopbarProps) {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    clearAuth();
    showLocalToast('Successfully logged out.');
    router.push('/login');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'AU';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border/80 bg-[#0f172a] px-4 font-sans sm:px-7 sticky top-0 z-30 shadow-sm">
      {/* Search Input */}
      <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-slate-800 bg-[#1e293b]/70 px-3.5 py-2 text-xs text-slate-300 focus-within:border-sky-500 transition-colors">
        <Search size={15} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search anything (vehicles, leads, sales)..."
          value={searchQuery || ''}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="w-full bg-transparent text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      {/* Right Controls */}
      <div className="ml-4 flex items-center gap-4 text-slate-300">
        {/* Decision Intelligence Trigger Button */}
        {onOpenDecisionScore && (
          <button
            onClick={onOpenDecisionScore}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500/20 to-indigo-500/20 hover:from-sky-500/30 hover:to-indigo-500/30 text-sky-400 text-xs font-bold border border-sky-500/30 transition-all shadow-sm"
          >
            <Sparkles size={14} className="animate-pulse" />
            Decision Score: <span className="font-mono font-extrabold text-foreground">80/100</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-extrabold border border-emerald-500/30">
              HEALTHY
            </span>
          </button>
        )}

        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-slate-800 text-slate-300 transition-colors" aria-label="Notifications">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 text-[9px] font-bold text-white px-1">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Profile Dropdown */}
        <div className="relative border-l border-slate-800 pl-4">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-800/80 transition-colors text-left"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-xs font-extrabold text-amber-100 shadow-inner border border-amber-500/40">
              {getInitials(user?.name)}
            </span>
            <div className="hidden sm:block text-xs">
              <strong className="block text-slate-100 font-bold leading-tight">{user?.name || 'Admin User'}</strong>
              <small className="text-slate-400 font-semibold">{user?.role || 'Super Admin'}</small>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {/* Profile Menu Popup */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-800 bg-[#1e293b] p-2 shadow-2xl z-50 text-xs font-sans">
              <div className="p-3 border-b border-slate-800 mb-1">
                <span className="font-bold text-slate-200 block truncate">{user?.name || 'Admin User'}</span>
                <span className="text-[11px] text-slate-400 block truncate">{user?.email || 'admin@carrevive.in'}</span>
                <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {user?.role || 'Super Admin'}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 font-bold transition-colors text-xs cursor-pointer"
              >
                <LogOut size={15} /> Log Out Account
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AdminTopbar;

