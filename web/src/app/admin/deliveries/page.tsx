'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePermissions } from '../../../hooks/usePermissions';
import { RequireRole } from '../../../components/auth/RequireRole';
import { showLocalToast } from '../../../components/Toast';
import { TestDriveListComponent } from '../../../components/admin/operations/TestDriveListComponent';
import { LeadListComponent } from '../../../components/admin/operations/LeadListComponent';
import { DeliveryListComponent } from '../../../components/admin/operations/DeliveryListComponent';
import {
  ShoppingCart,
  CheckCircle,
  Sparkles,
  PackageCheck,
  CarFront,
  ClipboardList,
  CreditCard,
  FileCheck,
} from 'lucide-react';

function DeliveriesContent() {
  const searchParams = useSearchParams();
  const is5DeliveriesView = searchParams.get('view') === '5-deliveries-available';
  const paramBranch = searchParams.get('branch');
  const paramModel = searchParams.get('model');

  // Sidebar navigation tab state: 'deliveries' | 'test_drives' | 'leads' | 'payments'
  const [activeTab, setActiveTab] = useState<'deliveries' | 'test_drives' | 'leads' | 'payments'>('deliveries');
  
  // Shared deliveries state so converted items dynamically update the delivery list
  const [dynamicDeliveryList, setDynamicDeliveryList] = useState<any[]>([]);

  const handleMoveToDelivery = (item: any) => {
    const newDelId = 100 + dynamicDeliveryList.length + 1;
    const newObj = {
      delivery_id: newDelId,
      sale_id: 900 + newDelId,
      customer_name: item.customer_name || 'Customer',
      phone: item.phone || '9840112233',
      vehicle_name: item.vehicle_name || 'Vehicle Model',
      branch_name: item.branch_name || 'CarRevive Branch',
      delivery_date: new Date().toISOString().slice(0, 10),
      odometer_reading: 12500,
      customer_received: false,
      delivery_status: 'Scheduled (Not Completed)',
      loan_status: item.loan_status || 'No Loan (Direct Payment)',
    };

    setDynamicDeliveryList((prev) => [newObj, ...prev]);
    setActiveTab('deliveries');
    showLocalToast(`Moved ${newObj.vehicle_name} to Delivery Schedule.`);
  };

  return (
    <RequireRole allow={['SYSTEM_ADMIN', 'BRANCH_MANAGER', 'SALES_EXECUTIVE']}>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-bg-surface border border-border p-6 rounded-[8px]">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge-info">
                Operations Management Hub
              </span>
              {is5DeliveriesView && (
                <span className="badge-success flex items-center gap-1">
                  <Sparkles size={11} /> 5 Deliveries Available View
                </span>
              )}
            </div>
            <h1 className="text-[24px] font-bold text-text-primary flex items-center gap-2 mt-2">
              <ShoppingCart className="w-5 h-5 text-accent" /> Deliveries, Test Drives &amp; Lead Management
            </h1>
            <p className="text-[12px] text-text-secondary mt-1">
              Dedicated operational components listing all customer test drives, active leads, and completed vs pending vehicle deliveries
            </p>
          </div>
        </div>

        {/* 5 Deliveries Available Prominent Banner */}
        {is5DeliveriesView && (
          <div className="rounded-[8px] bg-bg-surface-alt border border-accent p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[8px] bg-accent/20 border border-accent flex items-center justify-center text-accent font-bold text-[18px]">
                  5
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-text-primary flex items-center gap-2">
                    <span>These 5 Deliveries are Available for Handover</span>
                    {paramBranch && (
                      <span className="text-[12px] text-text-secondary font-normal bg-bg-surface px-2.5 py-0.5 rounded-[999px] border border-border">
                        Target Branch: {paramBranch} {paramModel ? `(${paramModel})` : ''}
                      </span>
                    )}
                  </h2>
                  <p className="text-[12px] text-text-secondary mt-0.5">
                    Stock reallocated from partner branches to satisfy high pending customer test drives &amp; booking orders
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[12px] text-status-success font-bold bg-bg-surface px-3 py-1.5 rounded-[8px] border border-border">
                <CheckCircle size={15} />
                <span>5 Ready Units Verified</span>
              </div>
            </div>
          </div>
        )}

        {/* Operations Layout: Sidebar Navigation + Dedicated Component Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sub-Navigation Sidebar */}
          <div className="lg:col-span-1 space-y-3">
            <div className="bg-bg-surface border border-border rounded-[8px] p-4 space-y-2">
              <span className="text-[12px] font-bold uppercase tracking-wider text-text-secondary block px-2 mb-2">
                Operations Navigation
              </span>

              <button
                onClick={() => setActiveTab('deliveries')}
                className={`w-full text-left px-3.5 py-2.5 rounded-[8px] text-[12px] font-bold transition-all flex items-center justify-between border cursor-pointer ${
                  activeTab === 'deliveries'
                    ? 'bg-accent text-accent-text border-accent'
                    : 'bg-bg-surface-alt text-text-secondary border-border hover:text-text-primary'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <PackageCheck size={16} />
                  <span>Deliveries Component</span>
                </div>
                <span className="px-2 py-0.5 rounded-[999px] bg-bg-surface text-text-secondary text-[12px] border border-border">
                  All Handovers
                </span>
              </button>

              <button
                onClick={() => setActiveTab('test_drives')}
                className={`w-full text-left px-3.5 py-2.5 rounded-[8px] text-[12px] font-bold transition-all flex items-center justify-between border cursor-pointer ${
                  activeTab === 'test_drives'
                    ? 'bg-accent text-accent-text border-accent'
                    : 'bg-bg-surface-alt text-text-secondary border-border hover:text-text-primary'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CarFront size={16} />
                  <span>Test Drives Component</span>
                </div>
                <span className="px-2 py-0.5 rounded-[999px] bg-bg-surface text-text-secondary text-[12px] border border-border">
                  All Requests
                </span>
              </button>

              <button
                onClick={() => setActiveTab('leads')}
                className={`w-full text-left px-3.5 py-2.5 rounded-[8px] text-[12px] font-bold transition-all flex items-center justify-between border cursor-pointer ${
                  activeTab === 'leads'
                    ? 'bg-accent text-accent-text border-accent'
                    : 'bg-bg-surface-alt text-text-secondary border-border hover:text-text-primary'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ClipboardList size={16} />
                  <span>Leads Component</span>
                </div>
                <span className="px-2 py-0.5 rounded-[999px] bg-bg-surface text-text-secondary text-[12px] border border-border">
                  All Inquiries
                </span>
              </button>

              <button
                onClick={() => setActiveTab('payments')}
                className={`w-full text-left px-3.5 py-2.5 rounded-[8px] text-[12px] font-bold transition-all flex items-center justify-between border cursor-pointer ${
                  activeTab === 'payments'
                    ? 'bg-accent text-accent-text border-accent'
                    : 'bg-bg-surface-alt text-text-secondary border-border hover:text-text-primary'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard size={16} />
                  <span>Payment &amp; Loan Check</span>
                </div>
                <span className="px-2 py-0.5 rounded-[999px] bg-bg-surface text-text-secondary text-[12px] border border-border">
                  Verified
                </span>
              </button>
            </div>

            {/* Workflow Guidance Card */}
            <div className="bg-bg-surface border border-border rounded-[8px] p-4 text-[12px] space-y-2">
              <span className="font-bold text-text-primary flex items-center gap-1.5">
                <FileCheck size={14} className="text-accent" /> Modular Operations
              </span>
              <p className="text-[12px] text-text-secondary leading-relaxed">
                Click between tabs to load dedicated <strong>Test Drive</strong>, <strong>Lead</strong>, and <strong>Delivery (Completed &amp; Not Completed)</strong> components.
              </p>
            </div>
          </div>

          {/* Component View Panel */}
          <div className="lg:col-span-3">

            {/* SEPARATE COMPONENT 1: DELIVERIES (COMPLETED & NOT COMPLETED) */}
            {activeTab === 'deliveries' && (
              <DeliveryListComponent initialDeliveriesList={dynamicDeliveryList} />
            )}

            {/* SEPARATE COMPONENT 2: TEST DRIVES (ALL TEST DRIVES LIST) */}
            {activeTab === 'test_drives' && (
              <TestDriveListComponent onMoveToDelivery={handleMoveToDelivery} />
            )}

            {/* SEPARATE COMPONENT 3: LEADS (ALL LEADS LIST) */}
            {activeTab === 'leads' && (
              <LeadListComponent onMoveToDelivery={handleMoveToDelivery} />
            )}

            {/* SEPARATE COMPONENT 4: PAYMENT VERIFICATION */}
            {activeTab === 'payments' && (
              <div className="rounded-[8px] bg-bg-surface border border-border p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2 text-status-success font-bold text-[14px]">
                    <CreditCard size={18} />
                    <span>Payment Verification &amp; Bank Loan Clearance</span>
                  </div>
                  <span className="badge-success">
                    Live Payment Verification Engine
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12px]">
                  <div className="bg-bg-surface-alt p-3.5 rounded-[8px] border border-border space-y-1">
                    <span className="text-[12px] text-text-secondary block font-bold uppercase">Direct Cash / Bank Transfer</span>
                    <strong className="text-status-success font-bold text-[14px] block">100% Cleared Immediately</strong>
                    <p className="text-[12px] text-text-secondary">Zero loan pending. Instant conversion to delivery allowed.</p>
                  </div>

                  <div className="bg-bg-surface-alt p-3.5 rounded-[8px] border border-border space-y-1">
                    <span className="text-[12px] text-text-secondary block font-bold uppercase">Bank Loan Financing</span>
                    <strong className="text-status-warning font-bold text-[14px] block">Pending Bank NOC Sanction</strong>
                    <p className="text-[12px] text-text-secondary">Requires bank approval before moving sale to delivery.</p>
                  </div>

                  <div className="bg-bg-surface-alt p-3.5 rounded-[8px] border border-border space-y-1">
                    <span className="text-[12px] text-text-secondary block font-bold uppercase">Fast-Track Delivery Rule</span>
                    <strong className="text-accent font-bold text-[14px] block">Automated Delivery Schedule</strong>
                    <p className="text-[12px] text-text-secondary">Verified sales automatically move to the Delivery Handover list.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </RequireRole>
  );
}

export default function DeliveriesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading operational components...</div>}>
      <DeliveriesContent />
    </Suspense>
  );
}
