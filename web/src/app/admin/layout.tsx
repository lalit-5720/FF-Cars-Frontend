'use client';

import React from 'react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminTopbar } from '../../components/admin/AdminTopbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-page text-text-primary flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <AdminTopbar />
        <main className="flex-1 p-4 sm:p-6 sm:px-8 overflow-y-auto bg-bg-page">
          {children}
        </main>
      </div>
    </div>
  );
}
