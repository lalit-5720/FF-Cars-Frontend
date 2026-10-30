'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { RequireRole } from '../../../components/auth/RequireRole';
import { LeadListComponent } from '../../../components/admin/operations/LeadListComponent';
import { usePermissions } from '../../../hooks/usePermissions';
import { Target } from 'lucide-react';

export default function AdminLeadsPage() {
  const router = useRouter();
  const permissions = usePermissions();

  const handleMoveToDelivery = (item: any) => {
    if (permissions.canAccessDeliveries) {
      router.push('/admin/deliveries');
    }
  };

  return (
    <RequireRole allow={['SYSTEM_ADMIN', 'BRANCH_MANAGER', 'SALES_EXECUTIVE']}>
      <div className="space-y-6 font-sans">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-bg-surface border border-border p-6 rounded-[8px]">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge-info">
                Customer Pipeline
              </span>
            </div>
            <h1 className="text-[24px] font-bold text-text-primary flex items-center gap-2 mt-2">
              <Target className="w-5 h-5 text-accent" /> Customer Lead Management
            </h1>
            <p className="text-[12px] text-text-secondary mt-1">
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
