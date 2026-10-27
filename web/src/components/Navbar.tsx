'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../store/useAuthStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useThemeStore } from '../store/useThemeStore';
import { Heart, Bell, User as UserIcon, LogOut, ChevronDown, Check, Menu, X, Crown, Sparkles, Sun, Moon } from 'lucide-react';
import { Logo } from './Logo';
import { useCompareStore } from '../store/useCompareStore';
import { AiCarMatchmakerModal } from './AiCarMatchmakerModal';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { wishlistIds, fetchWishlist, clearWishlist } = useWishlistStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const { compareList } = useCompareStore();
  const { theme, toggleTheme } = useThemeStore();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMatchmakerOpen, setIsMatchmakerOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated && user?.email) {
      fetchWishlist(user.email);
      fetchNotifications();
    } else {
      fetchWishlist();
    }
  }, [isAuthenticated, user?.email, fetchWishlist, fetchNotifications]);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setIsNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setIsProfileOpen(false);
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const handleLogout = () => {
    clearAuth();
    clearWishlist();
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    router.push('/');
  };

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0">
              <Logo size={36} circular={true} />
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-sm text-text-primary tracking-wide">
                  CarRevive
                </span>
                <span className="text-xs text-text-secondary">
                  Drive Better
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center justify-center gap-2 flex-1 max-w-lg mx-auto">
              {[
                { href: '/', label: 'Home' },
                { href: '/cars', label: 'Inventory' },
                { href: '/compare', label: 'Compare', badge: compareList.length > 0 ? compareList.length : null },
                ...(isAuthenticated ? [{ href: '/dashboard', label: 'Dashboard' }] : []),
                ...(isAuthenticated && (user?.role === 'ADMIN' || user?.role !== 'CUSTOMER' || user?.email?.toLowerCase().includes('admin')) ? [{ href: '/admin', label: 'Admin' }] : []),
              ].map(({ href, label, badge }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                      active
                        ? 'bg-accent text-accent-text'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-alt'
                    }`}
                  >
                    <span>{label}</span>
                    {badge !== null && badge !== undefined && (
                      <span className="badge badge-warning text-[10px] px-1.5 py-0">
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* AI Matchmaker trigger */}
              <button
                onClick={() => setIsMatchmakerOpen(true)}
                className="btn-secondary text-xs px-3 h-8"
                title="Find your car with AI"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Matchmaker</span>
              </button>
            </div>

            {/* Right Actions */}
            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="btn-icon"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-text-secondary" />
                ) : (
                  <Moon className="w-4 h-4 text-text-secondary" />
                )}
              </button>

              {isAuthenticated ? (
                <>
                  {/* Wishlist */}
                  <Link
                    href="/dashboard?tab=wishlist"
                    className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface-alt transition-colors"
                  >
                    <Heart className="w-4 h-4" />
                    {wishlistIds.length > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-accent text-accent-text text-[10px] font-bold">
                        {wishlistIds.length}
                      </span>
                    )}
                  </Link>

                  {/* Notifications */}
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
                      className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface-alt transition-colors"
                    >
                      <Bell className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-status-danger text-white text-[10px] font-bold">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {isNotifOpen && (
                      <div className="absolute right-0 mt-2 w-80 rounded-lg bg-bg-surface border border-border p-2 z-50">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                          <span className="section-heading text-sm font-bold text-text-primary">
                            Notifications
                          </span>
                          {unreadCount > 0 && (
                            <button
                              onClick={() => markAllAsRead()}
                              className="helper-text text-accent font-bold hover:underline"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                        <div className="max-h-60 overflow-y-auto mt-1 flex flex-col gap-1 p-1">
                          {notifications.length === 0 ? (
                            <div className="p-4 text-center helper-text">
                              No notifications yet
                            </div>
                          ) : (
                            notifications.map((notif) => (
                              <div
                                key={notif.id}
                                className={`p-2.5 rounded-lg text-xs flex items-start gap-2 border ${
                                  notif.readStatus
                                    ? 'bg-bg-surface border-border text-text-secondary'
                                    : 'bg-bg-surface-alt border-accent text-text-primary'
                                }`}
                              >
                                <div className="flex-1">
                                  <p className="body-text text-xs">{notif.message}</p>
                                  <span className="helper-text block mt-1">
                                    {new Date(notif.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                {!notif.readStatus && (
                                  <button
                                    onClick={() => markAsRead(notif.id)}
                                    className="p-1 rounded text-accent hover:bg-bg-surface"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Profile */}
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
                      className="btn-neutral h-9 px-3 gap-2"
                    >
                      <div className="w-5 h-5 rounded-full bg-accent text-accent-text flex items-center justify-center text-xs font-bold">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-text-primary truncate max-w-[120px]">
                        {user?.name}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />
                    </button>

                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-56 rounded-lg bg-bg-surface border border-border p-2 z-50">
                        <div className="p-3 border-b border-border">
                          <p className="font-bold text-sm text-text-primary truncate">{user?.name}</p>
                          <p className="helper-text truncate mt-0.5">{user?.email}</p>
                          <span className="badge badge-info mt-2">
                            {user?.role}
                          </span>
                        </div>
                        <div className="p-1 flex flex-col gap-1">
                          {(user?.role === 'ADMIN' || user?.role !== 'CUSTOMER' || user?.email?.toLowerCase().includes('admin')) && (
                            <Link
                              href="/admin"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-2 p-2 rounded-lg text-xs font-bold text-text-primary hover:bg-bg-surface-alt transition-colors"
                            >
                              <Crown className="w-4 h-4 text-accent" />
                              Admin Dashboard
                            </Link>
                          )}
                          <Link
                            href="/dashboard"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-2 p-2 rounded-lg text-xs font-bold text-text-primary hover:bg-bg-surface-alt transition-colors"
                          >
                            <UserIcon className="w-4 h-4 text-text-secondary" />
                            My Dashboard
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 p-2 rounded-lg text-xs font-bold text-status-danger hover:bg-bg-surface-alt transition-colors text-left"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="btn-neutral text-xs h-9 px-4"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="btn-primary text-xs h-9 px-4"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Actions (Theme Toggle & Menu Button) */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="btn-icon"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="btn-icon"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-bg-surface border-b border-border p-4 flex flex-col gap-2">
          <Link
            href="/cars"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-3 rounded-lg text-sm font-bold text-text-primary hover:bg-bg-surface-alt"
          >
            Inventory
          </Link>
          <Link
            href="/compare"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-3 rounded-lg text-sm font-bold text-text-primary hover:bg-bg-surface-alt"
          >
            Compare Cars
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3 rounded-lg text-sm font-bold text-text-primary hover:bg-bg-surface-alt"
              >
                My Dashboard
              </Link>
              {user?.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-3 rounded-lg text-sm font-bold text-text-primary hover:bg-bg-surface-alt"
                >
                  Admin Panel
                </Link>
              )}
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-text-primary">{user?.name}</p>
                  <p className="helper-text">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn-neutral text-status-danger"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-3 border-t border-border">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="btn-neutral text-center"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="btn-primary text-center"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Spacer for fixed nav */}
      <div className="h-16" />

      {/* AI Matchmaker Modal */}
      <AiCarMatchmakerModal
        isOpen={isMatchmakerOpen}
        onClose={() => setIsMatchmakerOpen(false)}
      />
    </>
  );
};

export default Navbar;
