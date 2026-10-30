'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../services/api';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  CalendarClock,
  CheckCircle2,
  Info,
  Landmark,
  Loader2,
  Phone,
  ReceiptText,
  Truck,
  UserRound,
} from 'lucide-react';

interface ShowroomStatusPanelProps {
  branchId?: string;
  initialStatus?: any;
  onOpenBiMatrix?: () => void;
}

const formatCurrency = (val?: number) => `₹${Math.round(val || 0).toLocaleString('en-IN')}`;

const LEVEL_STYLES = {
  critical: {
    banner: 'bg-gradient-to-r from-rose-50/90 via-rose-50/60 to-orange-50/40 border-b border-rose-200/80',
    title: 'text-slate-900',
    sub: 'text-slate-600',
    amountHighlight: 'text-rose-700',
    badge: 'bg-rose-100 text-rose-800 border-rose-200/80',
    iconBox: 'bg-rose-100 text-rose-600 border-rose-200/80',
    timeSub: 'text-slate-500',
    label: 'Needs immediate attention',
    Icon: AlertOctagon,
  },
  attention: {
    banner: 'bg-gradient-to-r from-amber-50/90 via-amber-50/60 to-orange-50/40 border-b border-amber-200/80',
    title: 'text-slate-900',
    sub: 'text-slate-600',
    amountHighlight: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-800 border-amber-200/80',
    iconBox: 'bg-amber-100 text-amber-700 border-amber-200/80',
    timeSub: 'text-slate-500',
    label: 'Attention needed',
    Icon: AlertTriangle,
  },
  healthy: {
    banner: 'bg-gradient-to-r from-emerald-50/90 via-emerald-50/60 to-teal-50/40 border-b border-emerald-200/80',
    title: 'text-slate-900',
    sub: 'text-slate-600',
    amountHighlight: 'text-emerald-800',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200/80',
    iconBox: 'bg-emerald-100 text-emerald-600 border-emerald-200/80',
    timeSub: 'text-slate-500',
    label: 'All on track',
    Icon: CheckCircle2,
  },
} as const;

const SEVERITY_STYLES = {
  critical: { row: 'border-rose-200 bg-rose-50/60', dot: 'bg-rose-500', tag: 'bg-rose-100 text-rose-800', label: 'URGENT', Icon: AlertOctagon, icon: 'text-rose-600' },
  warning: { row: 'border-amber-200 bg-amber-50/50', dot: 'bg-amber-500', tag: 'bg-amber-100 text-amber-800', label: 'FOLLOW UP', Icon: AlertTriangle, icon: 'text-amber-600' },
  info: { row: 'border-slate-200 bg-slate-50/60', dot: 'bg-blue-500', tag: 'bg-blue-50 text-blue-700', label: 'TODAY', Icon: Info, icon: 'text-blue-600' },
} as const;

export function ShowroomStatusPanel({ branchId, initialStatus, onOpenBiMatrix }: ShowroomStatusPanelProps) {
  const router = useRouter();
  const [status, setStatus] = useState<any>(initialStatus || null);
  const [loading, setLoading] = useState(!initialStatus);

  useEffect(() => {
    if (initialStatus) {
      setStatus(initialStatus);
      setLoading(false);
    }
  }, [initialStatus]);

  useEffect(() => {
    let isMounted = true;
    if (!initialStatus) setLoading(true);
    const params = branchId && branchId !== 'all' ? { branchId } : {};
    api.get('/bi/showroom-status', { params })
      .then((res) => {
        if (isMounted) setStatus(res.data);
      })
      .catch((err) => console.warn('Failed to load showroom status:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [branchId]);

  if (loading && !status) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-2xs flex items-center justify-center gap-2 text-xs text-text-secondary font-medium">
        <Loader2 size={18} className="animate-spin text-blue-600" />
        Checking collections, deliveries and today's follow-ups...
      </div>
    );
  }

  if (!status) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 shadow-2xs flex items-center gap-2 text-xs text-rose-800 font-semibold">
        <AlertTriangle size={16} className="text-rose-600 shrink-0" />
        Couldn't load pending payments and today's follow-ups. Check that the backend server is running the latest version, then refresh.
      </div>
    );
  }

  const level = LEVEL_STYLES[status.level as keyof typeof LEVEL_STYLES] ?? LEVEL_STYLES.attention;
  const c = status.collections;
  const alerts: any[] = status.alerts || [];

  const tiles = [
    {
      label: 'To collect from customers',
      value: formatCurrency(c.customerDue),
      note: c.overdueCustomerCount > 0
        ? `${c.customerDueCount} booking(s) • ${c.overdueCustomerCount} overdue`
        : `${c.customerDueCount} booking(s)`,
      Icon: Banknote,
      accent: c.overdueCustomerCount > 0 ? 'text-rose-700' : 'text-slate-900',
      link: '/admin/sales',
    },
    {
      label: 'Awaiting bank loan',
      value: formatCurrency(c.bankDue),
      note: `${c.bankDueCount} loan deal(s)`,
      Icon: Landmark,
      accent: 'text-slate-900',
      link: '/admin/sales',
    },
    {
      label: 'Payments to verify',
      value: `${c.paymentsToVerifyCount}`,
      note: c.paymentsToVerifyCount > 0 ? formatCurrency(c.paymentsToVerifyAmount) : 'Nothing waiting',
      Icon: ReceiptText,
      accent: c.paymentsToVerifyCount > 0 ? 'text-amber-700' : 'text-slate-900',
      link: '/admin/sales',
    },
    {
      label: 'Deliveries',
      value: `${status.deliveries.readyForHandover} ready`,
      note: `${status.deliveries.scheduledToday} today${status.deliveries.overdue > 0 ? ` • ${status.deliveries.overdue} overdue` : ''}`,
      Icon: Truck,
      accent: status.deliveries.overdue > 0 ? 'text-rose-700' : 'text-slate-900',
      link: '/admin/deliveries',
    },
  ];

  return (
    <div id="showroom-status" className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden scroll-mt-6">
      {/* Status headline */}
      <div className={`${level.banner} p-5 sm:p-6`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs ${level.iconBox}`}>
              <level.Icon size={24} />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${level.badge}`}>
                  Showroom status • {level.label}
                </span>
                <span className={`text-[11px] font-medium ${level.timeSub}`}>
                  As of {new Date(status.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {c.totalToCollect > 0 ? (
                <>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-mono">
                    {formatCurrency(c.totalToCollect)}{' '}
                    <span className={`font-sans text-lg sm:text-xl font-bold ${level.amountHighlight}`}>
                      payment pending
                    </span>
                  </h2>
                  <p className={`text-xs font-semibold ${level.sub}`}>
                    {c.customerDueCount > 0 && `${formatCurrency(c.customerDue)} from customers`}
                    {c.customerDueCount > 0 && c.bankDueCount > 0 && ' • '}
                    {c.bankDueCount > 0 && `${formatCurrency(c.bankDue)} from bank loans`}
                    {c.overdueCustomerCount > 0 && ` • ${formatCurrency(c.overdueCustomerDue)} overdue`}
                  </p>
                </>
              ) : (
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">All payments collected</h2>
              )}
            </div>
          </div>

          {onOpenBiMatrix && (
            <button
              onClick={onOpenBiMatrix}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition-all shadow-xs flex items-center gap-2 shrink-0 self-start lg:self-auto cursor-pointer"
            >
              <span>View Full BI Matrix</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Money & delivery tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {tiles.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => router.push(t.link)}
              className="text-left p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                <span>{t.label}</span>
                <t.Icon size={14} className="text-text-secondary group-hover:text-blue-600" />
              </div>
              <strong className={`block text-xl font-black font-mono mt-1.5 ${t.accent}`}>{t.value}</strong>
              <span className="block text-[11px] text-text-secondary font-medium mt-0.5">{t.note}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Pending payments: who owes what, and which sales executive owns the deal */}
          <div className="lg:col-span-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <Banknote size={15} className="text-rose-600" />
              <h3 className="text-sm font-black text-slate-900">Pending payments</h3>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                {c.pendingDealsCount ?? c.topPending.length} deal{(c.pendingDealsCount ?? c.topPending.length) === 1 ? '' : 's'}
              </span>
            </div>

            {c.topPending.length === 0 ? (
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <BadgeCheck size={16} />
                All active bookings are fully paid. Nothing to collect.
              </div>
            ) : (
              <div className="space-y-2.5">
                {c.topPending.map((p: any) => {
                  const overdue = p.customerDue > 0 && p.daysOpen > 7;
                  return (
                    <div
                      key={p.saleId}
                      className={`p-3.5 rounded-xl border ${overdue ? 'border-rose-200 bg-rose-50/50' : 'border-amber-200 bg-amber-50/40'} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                          <strong className="text-slate-900 font-extrabold">{p.customerName}</strong>
                          <span className="text-text-secondary truncate">{p.vehicle} • Sale #{p.saleId}</span>
                        </div>

                        {p.customerDue > 0 && (
                          <p className="text-sm font-black text-slate-900">
                            <span className={`font-mono ${overdue ? 'text-rose-700' : 'text-amber-700'}`}>{formatCurrency(p.customerDue)}</span>{' '}
                            pending — to be collected from the customer
                            {overdue && (
                              <span className="ml-2 px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[9px] font-black tracking-wider align-middle">
                                OVERDUE
                              </span>
                            )}
                          </p>
                        )}
                        {p.bankDue > 0 && (
                          <p className={p.customerDue > 0 ? 'text-[11px] font-bold text-blue-700' : 'text-sm font-black text-slate-900'}>
                            <span className="font-mono text-blue-700">{formatCurrency(p.bankDue)}</span> pending — awaiting bank loan disbursal
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <UserRound size={12} className="text-text-secondary" />
                            Sales Executive: <strong className="text-slate-900">{p.salesExecutive || 'Not assigned'}</strong>
                          </span>
                          <span className="text-text-secondary">
                            • {p.daysOpen} day{p.daysOpen === 1 ? '' : 's'} since booking • Paid {formatCurrency(p.paidAmount)} of {formatCurrency(p.contractAmount)}
                          </span>
                        </div>
                      </div>

                      {p.phone && (
                        <a
                          href={`tel:${p.phone}`}
                          className="shrink-0 self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition"
                        >
                          <Phone size={12} />
                          Call customer
                        </a>
                      )}
                    </div>
                  );
                })}
                {(c.pendingDealsCount ?? 0) > c.topPending.length && (
                  <button
                    type="button"
                    onClick={() => router.push('/admin/sales')}
                    className="text-xs font-extrabold text-blue-600 hover:underline cursor-pointer"
                  >
                    + {c.pendingDealsCount - c.topPending.length} more pending deal(s) in Sales →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action list */}
          <div className="lg:col-span-2 space-y-2.5">
            <div className="flex items-center gap-2">
              <CalendarClock size={15} className="text-blue-600" />
              <h3 className="text-sm font-black text-slate-900">What to do today</h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                {alerts.length} item{alerts.length === 1 ? '' : 's'}
              </span>
            </div>

            {alerts.length === 0 ? (
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <BadgeCheck size={16} />
                No pending collections, verifications or overdue work. Nothing needs your attention right now.
              </div>
            ) : (
              alerts.map((a) => {
                const s = SEVERITY_STYLES[a.severity as keyof typeof SEVERITY_STYLES] ?? SEVERITY_STYLES.info;
                return (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => router.push(a.link)}
                    className={`w-full text-left p-3 rounded-xl border ${s.row} hover:shadow-sm transition-all cursor-pointer flex items-start gap-3 group`}
                  >
                    <s.Icon size={16} className={`${s.icon} mt-0.5 shrink-0`} />
                    <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2" title={a.detail}>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider ${s.tag}`}>{s.label}</span>
                      <strong className="text-xs font-extrabold text-slate-900">{a.title}</strong>
                    </div>
                    <ArrowRight size={14} className="text-text-secondary group-hover:translate-x-1 transition-transform mt-0.5 shrink-0" />
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
