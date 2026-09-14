'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { RequireRole } from '../../../components/auth/RequireRole';
import { LeadListComponent } from '../../../components/admin/operations/LeadListComponent';
import { Target } from 'lucide-react';

export default function AdminLeadsPage() {
  const router = useRouter();

  const handleMoveToDelivery = (item: any) => {
    router.push('/admin/deliveries');
  };

  return (
    <RequireRole allow={['SYSTEM_ADMIN', 'BRANCH_MANAGER', 'SALES_EXECUTIVE']}>
      <div className="space-y-6 font-sans">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 p-5 rounded-2xl shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-extrabold uppercase tracking-wider border border-purple-500/30">
                Customer Pipeline
              </span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2 mt-1">
              <Target className="w-5 h-5 text-purple-400" /> Customer Lead Management
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Dedicated leads module listing all customer inquiries, budget brackets, and booking conversions
            </p>
          </div>
        </div>

        {/* Dedicated Separate Lead Component */}
        <LeadListComponent onMoveToDelivery={handleMoveToDelivery} />
      </div>
    </RequireRole>
  );
}
