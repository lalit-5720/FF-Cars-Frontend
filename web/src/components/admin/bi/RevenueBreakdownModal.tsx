'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { 
  X, 
  DollarSign, 
  CreditCard, 
  Landmark, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  FileSpreadsheet,
  Search,
  Filter,
  ArrowRight,
  Percent
} from 'lucide-react';

interface RevenueBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RevenueBreakdownModal({ isOpen, onClose }: RevenueBreakdownModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'FULL_PAYMENT' | 'LOAN_FINANCED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const fetchBreakdown = async () => {
      setLoading(true);
      try {
        const res = await api.get('/sales/revenue-breakdown');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load revenue breakdown', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBreakdown();
  }, [isOpen]);

  if (!isOpen) return null;

  const formatCurrency = (val?: number) => {
    const num = Number(val || 0);
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const fullPaymentTotal = data?.fullPayment?.totalAmount || 0;
  const totalTokenAdvance = data?.totalTokenAdvanceAmount || 0;
  const downPaymentTotal = data?.loanPayment?.totalDownPayment || 0;
  const loanFinancedTotal = data?.loanPayment?.totalLoanAmount || 0;
  const activeDeals = (data?.deals || []).filter(
    (d: any) => !['cancelled', 'refunded'].includes(String(d.payment_status || '').toLowerCase()),
  );
  const totalContract = activeDeals.reduce((sum: number, d: any) => sum + Number(d.final_amount || 0), 0);
  const totalCollected = activeDeals.reduce((sum: number, d: any) => sum + Number(d.total_amount_paid || 0), 0);
  const totalPending = activeDeals.reduce((sum: number, d: any) => sum + Number(d.outstanding_balance || 0), 0);
  const pendingDealsCount = activeDeals.filter((d: any) => Number(d.outstanding_balance || 0) > 0).length;

  // Cash actually received on direct cash purchases beyond the token advance (unpaid balances are not counted)
  const fullPaymentBalanceTotal = activeDeals
    .filter((d: any) => d.type === 'FULL_PAYMENT')
    .reduce((sum: number, d: any) => {
      const adv = Number(d.token_advance_amount ?? d.deposit_amount ?? 0);
      return sum + Math.max(0, Number(d.total_amount_paid || 0) - adv);
    }, 0);
  const fullyPaidCashCount = activeDeals.filter(
    (d: any) => d.type === 'FULL_PAYMENT' && Number(d.outstanding_balance || 0) === 0,
  ).length;

  const collectedPct = totalContract > 0 ? Math.min(100, Math.round((totalCollected / totalContract) * 100)) : 0;
  const pendingPct = Math.max(0, 100 - collectedPct);

  const filteredDeals = (data?.deals || []).filter((deal: any) => {
    if (filterType !== 'ALL' && deal.type !== filterType) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      deal.customer_name?.toLowerCase().includes(term) ||
      deal.vehicle_name?.toLowerCase().includes(term) ||
      deal.branch_name?.toLowerCase().includes(term) ||
      String(deal.sale_id).includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-800">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900">
                  Revenue &amp; Payment Segregation Analysis
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Audited Cash vs Loan
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5 font-medium">
                Exact distinction between liquid cash received upfront vs bank-financed loan balances
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-secondary hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="space-y-4 py-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
                ))}
              </div>
              <div className="h-48 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
            </div>
          ) : (
            <>
              {/* TOP 5 SEGREGATED REVENUE CARDS: TOKEN, FULL CASH, DOWN PAYMENT, LOAN & COMMISSION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">

                {/* Card 0: Total Payment Pending */}
                <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 shadow-2xs relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-text-secondary mb-1">
                      <span className="uppercase tracking-wider text-[10px]">Payment Pending</span>
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    </div>
                    <div className="text-xl font-black text-rose-700 font-mono">
                      {formatCurrency(totalPending)}
                    </div>
                    <p className="text-[10px] text-text-secondary mt-1 font-medium leading-tight">
                      Still to be collected on {pendingDealsCount} deal{pendingDealsCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-rose-200/60 flex items-center justify-between text-[10px]">
                    <span className="text-rose-700 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> To Collect
                    </span>
                    <span className="text-text-secondary font-medium">Outstanding</span>
                  </div>
                </div>

                {/* Card 1: Token Advance Amount */}
                <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200 shadow-2xs relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-text-secondary mb-1">
                      <span className="uppercase tracking-wider text-[10px]">Token Advance</span>
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-xl font-black text-emerald-700 font-mono">
                      {formatCurrency(totalTokenAdvance)}
                    </div>
                    <p className="text-[10px] text-text-secondary mt-1 font-medium leading-tight">
                      Upfront reservation deposits across active bookings
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-emerald-200/60 flex items-center justify-between text-[10px]">
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Upfront Deposit
                    </span>
                    <span className="text-text-secondary font-medium">Received</span>
                  </div>
                </div>

                {/* Card 2: Full Cash Settlement Balance */}
                <div className="p-4 rounded-2xl bg-teal-50/40 border border-teal-200 shadow-2xs relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-text-secondary mb-1">
                      <span className="uppercase tracking-wider text-[10px]">Full Cash Settled</span>
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="text-xl font-black text-teal-700 font-mono">
                      {formatCurrency(fullPaymentBalanceTotal)}
                    </div>
                    <p className="text-[10px] text-text-secondary mt-1 font-medium leading-tight">
                      Balance received after token • {fullyPaidCashCount} of {data?.fullPayment?.count || 0} cash deal(s) fully paid
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-teal-200/60 flex items-center justify-between text-[10px]">
                    <span className="text-teal-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> 100% Cash Settled
                    </span>
                    <span className="text-text-secondary font-medium">Cleared</span>
                  </div>
                </div>

                {/* Card 3: Down Payment Amount */}
                <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-200 shadow-2xs relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-text-secondary mb-1">
                      <span className="uppercase tracking-wider text-[10px]">Down Payment</span>
                      <CreditCard className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-xl font-black text-blue-700 font-mono">
                      {formatCurrency(downPaymentTotal)}
                    </div>
                    <p className="text-[10px] text-text-secondary mt-1 font-medium leading-tight">
                      Customer equity across {data?.loanPayment?.count || 0} financed deal{(data?.loanPayment?.count || 0) === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-blue-200/60 flex items-center justify-between text-[10px]">
                    <span className="text-blue-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Buyer Equity
                    </span>
                    <span className="text-text-secondary font-medium">Financed</span>
                  </div>
                </div>

                {/* Card 4: Bank Financed Amount */}
                <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200 shadow-2xs relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-text-secondary mb-1">
                      <span className="uppercase tracking-wider text-[10px]">Bank Financed</span>
                      <Landmark className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="text-xl font-black text-amber-700 font-mono">
                      {formatCurrency(loanFinancedTotal)}
                    </div>
                    <p className="text-[10px] text-text-secondary mt-1 font-medium leading-tight">
                      Sanctioned loan principal from partner banks
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center justify-between text-[10px]">
                    <span className="text-amber-700 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Bank Disbursal
                    </span>
                    <span className="text-text-secondary font-medium">Credit</span>
                  </div>
                </div>

                {/* Card 5: 2% Bank Excess Commission */}
                <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-200 shadow-2xs relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-text-secondary mb-1">
                      <span className="uppercase tracking-wider text-[10px]">Bank 2% Commission</span>
                      <Percent className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-xl font-black text-purple-700 font-mono">
                      {formatCurrency(data?.totalBankCommission)}
                    </div>
                    <p className="text-[10px] text-text-secondary mt-1 font-medium leading-tight">
                      Dealer redressal bonus on partner loan disbursals
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-purple-200/60 flex items-center justify-between text-[10px]">
                    <span className="text-purple-700 font-bold flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Redressal Bonus
                    </span>
                    <span className="text-text-secondary font-medium">Dealer Profit</span>
                  </div>
                </div>

              </div>

              {/* CASH FLOW PROGRESS RATIO BAR */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                      Collected vs Pending
                    </span>
                    <span className="text-[11px] text-text-secondary font-medium">
                      Total contract value (active deals): <strong className="text-slate-900 font-mono">{formatCurrency(totalContract)}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold">
                    <div className="flex items-center gap-1.5 text-emerald-700">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Collected: {formatCurrency(totalCollected)} ({collectedPct}%)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-rose-700">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span>Pending: {formatCurrency(totalPending)} ({pendingPct}%)</span>
                    </div>
                  </div>
                </div>

                {/* Split Bar */}
                <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden flex border border-slate-300">
                  <div
                    style={{ width: `${collectedPct}%` }}
                    className="bg-emerald-500 h-full transition-all duration-500"
                    title={`Collected: ${formatCurrency(totalCollected)}`}
                  />
                  <div
                    style={{ width: `${pendingPct}%` }}
                    className="bg-rose-500 h-full transition-all duration-500"
                    title={`Pending: ${formatCurrency(totalPending)}`}
                  />
                </div>
              </div>

              {/* SEARCH & CONTRACTS BREAKDOWN TABLE */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFilterType('ALL')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        filterType === 'ALL'
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All Deals ({data?.deals?.length || 0})
                    </button>
                    <button
                      onClick={() => setFilterType('FULL_PAYMENT')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        filterType === 'FULL_PAYMENT'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      Full Payments ({data?.fullPayment?.count || 0})
                    </button>
                    <button
                      onClick={() => setFilterType('LOAN_FINANCED')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        filterType === 'LOAN_FINANCED'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      Loan Deals ({data?.loanPayment?.count || 0})
                    </button>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                      type="text"
                      placeholder="Search customer, car..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-left text-xs font-sans">
                      <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 text-[10px] uppercase font-bold text-text-secondary">
                        <tr>
                          <th className="py-2.5 px-3.5">Contract</th>
                          <th className="py-2.5 px-3.5">Customer &amp; Vehicle</th>
                          <th className="py-2.5 px-3.5">Delivery Status</th>
                          <th className="py-2.5 px-3.5">Payment Type</th>
                          <th className="py-2.5 px-3.5">Token Advance</th>
                          <th className="py-2.5 px-3.5">Full Balance / Down Payment</th>
                          <th className="py-2.5 px-3.5">Bank Financed</th>
                          <th className="py-2.5 px-3.5">Final Total</th>
                          <th className="py-2.5 px-3.5">Settlement Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredDeals.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-8 text-center text-text-secondary font-medium">
                              No contracts matching this filter.
                            </td>
                          </tr>
                        ) : (
                          filteredDeals.map((deal: any) => {
                            const isLoan = deal.type === 'LOAN_FINANCED';
                            const isDelivered = deal.is_delivered || (deal.delivery_status || '').toLowerCase() === 'delivered';
                            const tokenAdvance = Number(deal.token_advance_amount ?? deal.deposit_amount ?? 0);
                            const finalAmt = Number(deal.final_amount ?? deal.selling_price ?? 0);
                            const balancePaid = isLoan
                              ? Number(deal.down_payment_paid || deal.down_payment_amount || Math.max(0, finalAmt - deal.loan_amount - tokenAdvance))
                              : Math.max(0, finalAmt - tokenAdvance);
                            const bankRedressal = Number(deal.bank_redressal_amount ?? deal.loan_amount ?? 0);

                            return (
                              <tr key={deal.sale_id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-3.5 font-mono font-bold text-blue-600">
                                  #CR-{deal.sale_id}
                                </td>
                                <td className="py-3 px-3.5">
                                  <div className="font-bold text-slate-900">{deal.customer_name}</div>
                                  <div className="text-[11px] text-text-secondary">{deal.vehicle_name}</div>
                                </td>
                                <td className="py-3 px-3.5">
                                  {isDelivered ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                                      ✓ Sale Completed (Delivered)
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                                      ⏳ Reserved (Token Paid)
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3.5">
                                  {isLoan ? (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                      Loan Deal
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Full Upfront
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3.5 font-mono font-bold text-emerald-700">
                                  {formatCurrency(tokenAdvance)}
                                </td>
                                <td className="py-3 px-3.5 font-mono font-bold">
                                  {isLoan ? (
                                    <div>
                                      <span className="text-blue-700">{formatCurrency(balancePaid)}</span>
                                      <span className="text-[9px] text-blue-600 block font-sans font-medium">Down Payment Equity</span>
                                    </div>
                                  ) : (
                                    <div>
                                      <span className="text-teal-700">{formatCurrency(balancePaid)}</span>
                                      <span className="text-[9px] text-teal-600 block font-sans font-medium">Cash Balance Paid</span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-3.5 font-mono">
                                  {isLoan ? (
                                    <div>
                                      <span className="font-bold text-amber-700">{formatCurrency(bankRedressal)}</span>
                                      <span className="text-[9px] text-amber-600 block font-sans font-medium">Bank Financed</span>
                                    </div>
                                  ) : (
                                    <span className="text-text-secondary font-medium">₹0 (None)</span>
                                  )}
                                </td>
                                <td className="py-3 px-3.5 font-mono font-black text-slate-900">
                                  {formatCurrency(finalAmt)}
                                </td>
                                <td className="py-3 px-3.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    (deal.payment_status || '').toLowerCase().includes('paid')
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}>
                                    {deal.payment_status || 'Pending'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-bg-surface-alt hover:bg-black text-text-primary font-bold text-xs transition-colors cursor-pointer"
          >
            Close Breakdown
          </button>
        </div>

      </div>
    </div>
  );
}
