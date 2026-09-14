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
      <div className="space-y-6 font-sans">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 p-5 rounded-2xl shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-extrabold uppercase tracking-wider border border-purple-500/30">
                Operations Management Hub
              </span>
              {is5DeliveriesView && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles size={11} /> 5 Deliveries Available View
                </span>
              )}
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2 mt-1">
              <ShoppingCart className="w-5 h-5 text-purple-400" /> Deliveries, Test Drives &amp; Lead Management
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Dedicated operational components listing all customer test drives, active leads, and completed vs pending vehicle deliveries
            </p>
          </div>
        </div>

        {/* 5 Deliveries Available Prominent Banner */}
        {is5DeliveriesView && (
          <div className="rounded-2xl bg-gradient-to-r from-sky-950 via-slate-900 to-blue-950 border border-sky-500/40 p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 font-extrabold text-lg">
                  5
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                    <span>These 5 Deliveries are Available for Handover</span>
                    {paramBranch && (
                      <span className="text-xs text-sky-300 font-normal bg-sky-900/60 px-2.5 py-0.5 rounded-full border border-sky-700">
                        Target Branch: {paramBranch} {paramModel ? `(${paramModel})` : ''}
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-300">
                    Stock reallocated from partner branches to satisfy high pending customer test drives &amp; booking orders
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-400 font-extrabold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
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
            <div className="bg-[#1e293b]/90 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-xl">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-2 mb-2">
                Operations Navigation
              </span>

              <button
                onClick={() => setActiveTab('deliveries')}
                className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-between border cursor-pointer ${
                  activeTab === 'deliveries'
                    ? 'bg-sky-600 text-white border-sky-400 shadow-lg'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <PackageCheck size={16} />
                  <span>Deliveries Component</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-200 text-[10px]">
                  All Handovers
                </span>
              </button>

              <button
                onClick={() => setActiveTab('test_drives')}
                className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-between border cursor-pointer ${
                  activeTab === 'test_drives'
                    ? 'bg-amber-600 text-white border-amber-400 shadow-lg'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CarFront size={16} />
                  <span>Test Drives Component</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 text-[10px]">
                  All Requests
                </span>
              </button>

              <button
                onClick={() => setActiveTab('leads')}
                className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-between border cursor-pointer ${
                  activeTab === 'leads'
                    ? 'bg-purple-600 text-white border-purple-400 shadow-lg'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ClipboardList size={16} />
                  <span>Leads Component</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 text-[10px]">
                  All Inquiries
                </span>
              </button>

              <button
                onClick={() => setActiveTab('payments')}
                className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-between border cursor-pointer ${
                  activeTab === 'payments'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard size={16} />
                  <span>Payment &amp; Loan Check</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-[10px]">
                  Verified
                </span>
              </button>
            </div>

            {/* Workflow Guidance Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
              <span className="font-extrabold text-amber-400 flex items-center gap-1.5">
                <FileCheck size={14} /> Modular Operations
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
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
              <div className="rounded-2xl bg-[#1e293b]/90 border border-slate-800 p-5 shadow-xl space-y-4 font-sans">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
                    <CreditCard size={18} />
                    <span>Payment Verification &amp; Bank Loan Clearance</span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live Payment Verification Engine
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Direct Cash / Bank Transfer</span>
                    <strong className="text-emerald-400 font-extrabold text-sm block">100% Cleared Immediately</strong>
                    <p className="text-[10px] text-slate-400">Zero loan pending. Instant conversion to delivery allowed.</p>
                  </div>

                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Bank Loan Financing</span>
                    <strong className="text-amber-400 font-extrabold text-sm block">Pending Bank NOC Sanction</strong>
                    <p className="text-[10px] text-slate-400">Requires bank approval before moving sale to delivery.</p>
                  </div>

                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Fast-Track Delivery Rule</span>
                    <strong className="text-sky-400 font-extrabold text-sm block">Automated Delivery Schedule</strong>
                    <p className="text-[10px] text-slate-400">Verified sales automatically move to the Delivery Handover list.</p>
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
