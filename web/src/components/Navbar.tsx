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
  const [scrolled, setScrolled] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
      fetchNotifications();
    }
  }, [isAuthenticated, fetchWishlist, fetchNotifications]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          backgroundColor: scrolled ? 'rgba(5, 6, 10, 0.95)' : 'rgba(5, 6, 10, 0.7)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: scrolled ? '1px solid rgba(26, 28, 38, 0.9)' : '1px solid rgba(26, 28, 38, 0.4)',
          boxShadow: scrolled ? '0 8px 40px rgba(0,0,0,0.4)' : 'none',
        }}
      >
        {/* Ultra-thin gold top line */}
        <div
          style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(201, 169, 110, 0.6) 30%, rgba(232, 201, 122, 0.8) 50%, rgba(201, 169, 110, 0.6) 70%, transparent 100%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[68px]">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
              <Logo size={38} circular={true} className="transition-transform duration-300 group-hover:scale-105" />
              <div className="flex flex-col leading-none">
                <span
                  className="font-black tracking-widest uppercase text-sm"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    color: 'var(--platinum)',
                    letterSpacing: '0.15em',
                  }}
                >
                  FF-CARS
                </span>
                <span
                  className="text-[8px] uppercase tracking-widest mt-0.5"
                  style={{ color: 'var(--gold)', letterSpacing: '0.2em', fontFamily: "'DM Sans', sans-serif" }}
                >
                  Automotive Concierge
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {[
                { href: '/cars', label: 'Inventory' },
                ...(isAuthenticated ? [{ href: '/dashboard', label: 'My Bookings' }] : []),
                ...(isAuthenticated && user?.role === 'ADMIN' ? [{ href: '/admin', label: 'Admin' }] : []),
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="relative text-sm font-medium transition-colors duration-200 group"
                  style={{
                    color: isActive(href) ? 'var(--gold)' : 'var(--silver)',
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: '0.02em',
                  }}
                >
                  {label}
                  {/* Gold underline */}
                  <span
                    className="absolute -bottom-1 left-0 h-px transition-all duration-300"
                    style={{
                      width: isActive(href) ? '100%' : '0%',
                      background: 'linear-gradient(90deg, var(--gold-dim), var(--gold-light))',
                    }}
                  />
                  <span
                    className="absolute -bottom-1 left-0 h-px transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:w-full"
                    style={{
                      width: '0%',
                      background: 'linear-gradient(90deg, var(--gold-dim), var(--gold-light))',
                    }}
                  />
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  {/* Wishlist */}
                  <Link
                    href="/dashboard?tab=wishlist"
                    className="relative p-2.5 rounded-full transition-all duration-200 group"
                    style={{ color: 'var(--silver)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--silver)')}
                  >
                    <Heart className="w-[18px] h-[18px]" />
                    {wishlistIds.length > 0 && (
                      <span
                        className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold"
                        style={{ background: 'var(--gold)', color: 'var(--midnight)' }}
                      >
                        {wishlistIds.length}
                      </span>
                    )}
                  </Link>

                  {/* Notifications */}
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
                      className="relative p-2.5 rounded-full transition-all duration-200"
                      style={{ color: 'var(--silver)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--silver)')}
                    >
                      <Bell className="w-[18px] h-[18px]" />
                      {unreadCount > 0 && (
                        <span
                          className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold"
                          style={{ background: 'var(--gold)', color: 'var(--midnight)' }}
                        >
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {isNotifOpen && (
                      <div
                        className="absolute right-0 mt-3 w-80 rounded-2xl p-1 shadow-2xl"
                        style={{
                          background: 'var(--obsidian)',
                          border: '1px solid var(--onyx-border)',
                          boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,169,110,0.08)',
                        }}
                      >
                        <div
                          className="flex items-center justify-between px-4 py-3"
                          style={{ borderBottom: '1px solid var(--onyx-border)' }}
                        >
                          <span className="text-sm font-semibold" style={{ color: 'var(--platinum)', fontFamily: "'DM Sans', sans-serif" }}>
                            Notifications
                          </span>
                          {unreadCount > 0 && (
                            <button
                              onClick={() => markAllAsRead()}
                              className="text-xs font-medium transition-colors"
                              style={{ color: 'var(--gold)' }}
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                        <div className="max-h-60 overflow-y-auto mt-1 flex flex-col gap-0.5 p-1">
                          {notifications.length === 0 ? (
                            <div className="p-4 text-center text-xs" style={{ color: 'var(--silver-dim)' }}>
                              No notifications yet
                            </div>
                          ) : (
                            notifications.map((notif) => (
                              <div
                                key={notif.id}
                                className="p-3 rounded-xl text-xs flex items-start gap-2 transition-colors"
                                style={{
                                  background: notif.readStatus ? 'transparent' : 'rgba(201,169,110,0.06)',
                                  color: notif.readStatus ? 'var(--silver)' : 'var(--platinum)',
                                }}
                              >
                                <div className="flex-1">
                                  <p>{notif.message}</p>
                                  <span className="text-[10px] mt-1 block" style={{ color: 'var(--silver-dim)' }}>
                                    {new Date(notif.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                {!notif.readStatus && (
                                  <button
                                    onClick={() => markAsRead(notif.id)}
                                    className="p-1 rounded-lg transition-colors"
                                    style={{ color: 'var(--gold)' }}
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
                      className="flex items-center gap-2 p-1.5 pl-2.5 pr-3 rounded-full transition-all duration-200"
                      style={{
                        border: '1px solid var(--onyx-border)',
                        background: isProfileOpen ? 'rgba(201,169,110,0.06)' : 'transparent',
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: 'var(--gold-muted)', color: 'var(--gold)' }}
                      >
                        {user?.name.charAt(0).toUpperCase()}
                      </div>
                      <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--silver)' }} />
                    </button>

                    {isProfileOpen && (
                      <div
                        className="absolute right-0 mt-3 w-56 rounded-2xl shadow-2xl overflow-hidden"
                        style={{
                          background: 'var(--obsidian)',
                          border: '1px solid var(--onyx-border)',
                          boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,169,110,0.08)',
                        }}
                      >
                        <div className="p-4" style={{ borderBottom: '1px solid var(--onyx-border)' }}>
                          <p className="font-semibold text-sm" style={{ color: 'var(--platinum)' }}>{user?.name}</p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--silver-dim)' }}>{user?.email}</p>
                          <span
                            className="inline-block mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                            style={{ background: 'rgba(201,169,110,0.12)', color: 'var(--gold)' }}
                          >
                            {user?.role}
                          </span>
                        </div>
                        <div className="p-2">
                          <Link
                            href="/dashboard"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-2.5 w-full p-2.5 text-sm rounded-xl transition-colors"
                            style={{ color: 'var(--silver)' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = 'var(--platinum)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--silver)'; }}
                          >
                            <UserIcon className="w-4 h-4" />
                            My Dashboard
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2.5 w-full p-2.5 text-sm rounded-xl transition-colors mt-0.5"
                            style={{ color: '#E87070' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(155,35,53,0.1)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
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
                <div className="flex items-center gap-3">
                  <Link
                    href="/login"
                    className="text-sm font-medium transition-colors duration-200 px-4 py-2"
                    style={{ color: 'var(--silver)', fontFamily: "'DM Sans', sans-serif" }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--platinum)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--silver)')}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="btn-gold text-xs"
                    style={{ padding: '0.6rem 1.25rem' }}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl transition-colors"
              style={{ color: 'var(--silver)', border: '1px solid var(--onyx-border)' }}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed top-[69px] left-0 right-0 z-40 p-4 flex flex-col gap-2"
          style={{
            background: 'rgba(5, 6, 10, 0.98)',
            backdropFilter: 'blur(24px)',
            borderBottom: '1px solid var(--onyx-border)',
          }}
        >
          <Link
            href="/cars"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-3 rounded-xl text-sm font-medium transition-colors"
            style={{ color: 'var(--silver)', fontFamily: "'DM Sans', sans-serif" }}
          >
            Inventory
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3 rounded-xl text-sm font-medium"
                style={{ color: 'var(--silver)' }}
              >
                My Bookings
              </Link>
              {user?.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-3 rounded-xl text-sm font-medium"
                  style={{ color: 'var(--silver)' }}
                >
                  Admin Panel
                </Link>
              )}
              <div className="pt-3 mt-1" style={{ borderTop: '1px solid var(--onyx-border)' }}>
                <div className="px-3 pb-3">
                  <p className="font-semibold text-sm" style={{ color: 'var(--platinum)' }}>{user?.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--silver-dim)' }}>{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full p-3 rounded-xl text-sm font-medium"
                  style={{ color: '#E87070' }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-3 mt-1" style={{ borderTop: '1px solid var(--onyx-border)' }}>
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-center py-3 rounded-xl text-sm font-medium"
                style={{ border: '1px solid var(--onyx-border)', color: 'var(--silver)' }}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="btn-gold text-center"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Spacer for fixed nav */}
      <div className="h-[69px]" />
    </>
  );
};
