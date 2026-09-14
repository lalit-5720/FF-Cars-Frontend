'use client';

import React from 'react';
import { useAuthStore, UserRole } from '@/store/useAuthStore';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface RequireRoleProps {
  allow: UserRole[];
  children: React.ReactNode;
}

export function RequireRole({ allow, children }: RequireRoleProps) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 border border-amber-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Authentication Required</h2>
        <p className="text-slate-400 max-w-md mb-6">
          Please log in to your staff account to access the CarRevive Operations Console.
        </p>
        <Link
          href="/login"
          className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-xl transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Go to Login
        </Link>
      </div>
    );
  }

  const roleMatched = allow.includes(user.role);

  if (!roleMatched) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4 border border-rose-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Access Restricted</h2>
        <p className="text-slate-400 max-w-md mb-6">
          Your role (<span className="text-sky-400 font-semibold">{user.role}</span>) does not have permission to view or manage this module.
        </p>
        <Link
          href="/admin"
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl transition-colors inline-flex items-center gap-2 border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
