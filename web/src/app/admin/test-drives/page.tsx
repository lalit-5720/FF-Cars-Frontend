'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { RequireRole } from '../../../components/auth/RequireRole';
import { TestDriveListComponent } from '../../../components/admin/operations/TestDriveListComponent';
import { CarFront } from 'lucide-react';

export default function TestDrivesPage() {
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
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider border border-amber-500/30">
                Operations Management
              </span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2 mt-1">
              <CarFront className="w-5 h-5 text-amber-400" /> Customer Test Drive Management
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Dedicated test drive module listing all customer appointments, feedback ratings, and sale status updates
            </p>
          </div>
        </div>

        {/* Dedicated Separate Test Drive Component */}
        <TestDriveListComponent onMoveToDelivery={handleMoveToDelivery} />
      </div>
    </RequireRole>
  );
}