'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../store/useAuthStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { Heart, Bell, User as UserIcon, LogOut, ChevronDown, Check, Menu, X } from 'lucide-react';
import { Logo } from './Logo';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { wishlistIds, fetchWishlist, clearWishlist } = useWishlistStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
      fetchNotifications();
    }
  }, [isAuthenticated, fetchWishlist, fetchNotifications]);

  // Click outside handlers
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
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

  const activeLinkClass = (path: string) =>
    pathname === path
      ? 'text-primary font-bold border-b-2 border-primary pb-1'
      : 'text-muted-foreground hover:text-foreground transition-colors font-medium pb-1';

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border/80 glass-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Logo size={36} circular={true} className="transition-transform duration-300 group-hover:scale-105" />
              <div className="flex flex-col leading-none">
                <span className="font-display text-lg font-black tracking-tight text-foreground">
                  FF-CARS
                </span>
                <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">
                  Direct Buy & Sell
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/cars" className={activeLinkClass('/cars')}>
              Browse Cars
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/dashboard" className={activeLinkClass('/dashboard')}>
                  My Test Rides
                </Link>
                {user?.role === 'ADMIN' && (
                  <Link href="/admin" className={activeLinkClass('/admin')}>
                    Admin Panel
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right Action Icons */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {/* Wishlist Link */}
                <Link
                  href="/dashboard?tab=wishlist"
                  className="relative p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Heart className="w-5 h-5" />
                  {wishlistIds.length > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground transform translate-x-1/3 -translate-y-1/3">
                      {wishlistIds.length}
                    </span>
                  )}
                </Link>

                {/* Notifications Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => {
                      setIsNotifOpen(!isNotifOpen);
                      setIsProfileOpen(false);
                    }}
                    className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground transform translate-x-1/3 -translate-y-1/3">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {isNotifOpen && (
                    <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between p-2 border-b border-border">
                        <span className="font-semibold text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllAsRead()}
                            className="text-xs text-primary font-medium hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-60 overflow-y-auto mt-1 flex flex-col gap-1">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-muted-foreground">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              className={`p-2 rounded-lg text-xs transition-colors flex items-start gap-2 ${
                                notif.readStatus ? 'bg-transparent text-muted-foreground' : 'bg-secondary/50 font-medium'
                              }`}
                            >
                              <div className="flex-1">
                                <p>{notif.message}</p>
                                <span className="text-[10px] text-muted-foreground block mt-1">
                                  {new Date(notif.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              {!notif.readStatus && (
                                <button
                                  onClick={() => markAsRead(notif.id)}
                                  className="p-1 rounded hover:bg-secondary text-primary transition-colors flex-shrink-0"
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

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => {
                      setIsProfileOpen(!isProfileOpen);
                      setIsNotifOpen(false);
                    }}
                    className="flex items-center gap-1.5 p-1 rounded-full hover:bg-secondary transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-3 border-b border-border">
                        <p className="font-semibold text-sm leading-none">{user?.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{user?.email}</p>
                        <span className="inline-block mt-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/15 text-primary uppercase">
                          {user?.role}
                        </span>
                      </div>
                      <div className="mt-1">
                        <Link
                          href="/dashboard"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2 w-full p-2 text-sm text-left rounded-lg hover:bg-secondary text-foreground transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-muted-foreground" />
                          My Dashboard
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full p-2 text-sm text-left rounded-lg hover:bg-destructive/10 text-destructive transition-colors mt-1"
                        >
                          <LogOut className="w-4 h-4" />
                          Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden gap-3">
            {isAuthenticated && (
              <Link
                href="/dashboard?tab=wishlist"
                className="relative p-2 rounded-full text-muted-foreground"
              >
                <Heart className="w-5 h-5" />
                {wishlistIds.length > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground transform translate-x-1/3 -translate-y-1/3">
                    {wishlistIds.length}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card p-4 animate-in slide-in-from-top duration-300">
          <div className="flex flex-col gap-3">
            <Link
              href="/cars"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-medium p-2 rounded-lg hover:bg-secondary"
            >
              Browse Cars
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg font-medium p-2 rounded-lg hover:bg-secondary"
                >
                  My Test Rides
                </Link>
                {user?.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-lg font-medium p-2 rounded-lg hover:bg-secondary"
                  >
                    Admin Panel
                  </Link>
                )}
                <div className="border-t border-border my-2 pt-2">
                  <div className="px-2 pb-3">
                    <p className="font-semibold text-sm">{user?.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full p-2 rounded-lg text-destructive hover:bg-destructive/10 text-left text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-lg border border-border text-sm font-medium"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
