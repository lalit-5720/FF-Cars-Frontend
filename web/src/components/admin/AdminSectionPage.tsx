'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

type SectionKey = 'sales' | 'inventory' | 'leads' | 'customers';

const config: Record<SectionKey, { title: string; description: string; endpoint: string; columns: string[]; fields: (row: any) => string[] }> = {
  sales: { title: 'Sales Analytics', description: 'Live sales records and revenue from the dealership database.', endpoint: '/sales', columns: ['Sale', 'Vehicle', 'Amount'], fields: (row) => [`#${row.sale_id ?? row.id ?? '-'}`, row.vehicles ? `${row.vehicles.make} ${row.vehicles.model}` : `Vehicle #${row.vehicle_id ?? '-'}`, `₹${Number(row.final_amount ?? row.selling_price ?? 0).toLocaleString('en-IN')}`] },
  inventory: { title: 'Inventory Intelligence', description: 'Current vehicle inventory and availability from the vehicles table.', endpoint: '/vehicles', columns: ['Vehicle', 'Status', 'Price'], fields: (row) => [`${row.make ?? ''} ${row.model ?? ''}`.trim() || `Vehicle #${row.vehicle_id ?? '-'}`, String(row.status ?? 'Unknown'), `₹${Number(row.price ?? 0).toLocaleString('en-IN')}`] },
  leads: { title: 'Lead & Test Drive', description: 'Live leads and test-drive requests from the operational database.', endpoint: '/test-drives', columns: ['Request', 'Customer', 'Status'], fields: (row) => [`#${row.test_drive_id ?? row.id ?? '-'}`, row.customers ? `${row.customers.first_name ?? ''} ${row.customers.last_name ?? ''}`.trim() : `Customer #${row.customer_id ?? '-'}`, String(row.status ?? 'Unknown')] },
  customers: { title: 'Customer Analytics', description: 'Customer records loaded from the dealership database.', endpoint: '/customers', columns: ['Customer', 'Email', 'Phone'], fields: (row) => [`${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() || `Customer #${row.customer_id ?? '-'}`, String(row.email ?? 'N/A'), String(row.phone ?? 'N/A')] },
};

export default function AdminSectionPage({ section }: { section: SectionKey }) {
  const router = useRouter();
  const sectionConfig = config[section];
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(sectionConfig.endpoint).then((response) => {
      const data = response.data;
      setRows(Array.isArray(data) ? data : data?.data ?? []);
    }).catch(() => setRows([])).finally(() => setLoading(false));
  }, [sectionConfig.endpoint]);

  return <div className="min-h-[calc(100vh-4rem)] bg-background p-5 text-foreground sm:p-8">
    <div className="mx-auto max-w-6xl">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">CarRevive Admin</p>
      <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-bold">{sectionConfig.title}</h1><p className="mt-2 text-sm text-muted-foreground">{sectionConfig.description}</p></div><button onClick={() => router.push('/admin')} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">Dashboard <ArrowRight size={14} /></button></div>
      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? <div className="grid min-h-56 place-items-center"><Loader2 className="animate-spin text-primary" /></div> : rows.length ? <><div className="grid grid-cols-3 border-b border-border bg-secondary px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{sectionConfig.columns.map((column) => <span key={column}>{column}</span>)}</div>{rows.slice(0, 50).map((row, index) => <div key={row.sale_id ?? row.vehicle_id ?? row.test_drive_id ?? row.customer_id ?? index} className="grid grid-cols-3 border-b border-border px-5 py-4 text-sm last:border-0">{sectionConfig.fields(row).map((field, fieldIndex) => <span key={fieldIndex} className={fieldIndex === 0 ? 'font-semibold' : 'text-muted-foreground'}>{field}</span>)}</div>)}</> : <div className="p-10 text-center text-sm text-muted-foreground">No records are available for this workspace yet.</div>}
      </div>
    </div>
  </div>;
}
