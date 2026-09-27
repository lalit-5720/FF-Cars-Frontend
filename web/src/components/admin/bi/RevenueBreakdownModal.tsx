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
  const downPaymentTotal = data?.loanPayment?.totalDownPayment || 0;
  const loanFinancedTotal = data?.loanPayment?.totalLoanAmount || 0;
  const totalCollected = data?.totalCollectedRevenue || 0;
  const totalContract = data?.totalContractValue || 1;

  const collectedPct = Math.min(100, Math.round((totalCollected / totalContract) * 100));
  const loanPct = Math.max(0, 100 - collectedPct);

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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-card border border-border rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-foreground font-display">
                  Revenue & Payment Segregation Analysis
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Audited Cash vs Loan
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Exact distinction between liquid cash received upfront vs bank-financed loan balances
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
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
                  <div key={i} className="h-32 rounded-2xl bg-secondary/40 animate-pulse border border-border" />
                ))}
              </div>
              <div className="h-48 rounded-2xl bg-secondary/40 animate-pulse border border-border" />
            </div>
          ) : (
            <>
              {/* TOP 4 SEGREGATED REVENUE CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Card 1: Full Payment */}
                <div className="p-5 rounded-2xl bg-card border border-emerald-500/30 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-1">
                      <span className="uppercase tracking-wider">Full Payments</span>
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                      {formatCurrency(fullPaymentTotal)}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {data?.fullPayment?.count || 0} vehicle{(data?.fullPayment?.count || 0) === 1 ? '' : 's'} 100% upfront
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px]">
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> 100% In Hand
                    </span>
                    <span className="text-muted-foreground">Settled</span>
                  </div>
                </div>

                {/* Card 2: Down Payment */}
                <div className="p-5 rounded-2xl bg-card border border-blue-500/30 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-1">
                      <span className="uppercase tracking-wider">Down Payments</span>
                      <DollarSign className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-2xl font-black text-blue-400 font-mono">
                      {formatCurrency(downPaymentTotal)}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Collected on {data?.loanPayment?.count || 0} financed deal{(data?.loanPayment?.count || 0) === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px]">
                    <span className="text-blue-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Upfront Deposit
                    </span>
                    <span className="text-muted-foreground">Received</span>
                  </div>
                </div>

                {/* Card 3: Loan Payment Financed */}
                <div className="p-5 rounded-2xl bg-card border border-amber-500/30 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-1">
                      <span className="uppercase tracking-wider">Bank Disbursals</span>
                      <Landmark className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-2xl font-black text-amber-400 font-mono">
                      {formatCurrency(loanFinancedTotal)}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Financed across {data?.loanPayment?.count || 0} loan agreement{(data?.loanPayment?.count || 0) === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px]">
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Bank Disbursal
                    </span>
                    <span className="text-muted-foreground">Pending / EMI</span>
                  </div>
                </div>

                {/* Card 4: 2% Bank Excess Commission */}
                <div className="p-5 rounded-2xl bg-card border border-indigo-500/30 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-1">
                      <span className="uppercase tracking-wider">2% Bank Payout</span>
                      <Percent className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="text-2xl font-black text-indigo-400 font-mono">
                      {formatCurrency(data?.totalBankCommission)}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Dealer excess on {data?.loanPayment?.count || 0} financed deal{(data?.loanPayment?.count || 0) === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px]">
                    <span className="text-indigo-400 font-bold flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Extra Revenue
                    </span>
                    <span className="text-muted-foreground">Dealer Profit</span>
                  </div>
                </div>

              </div>

              {/* CASH FLOW PROGRESS RATIO BAR */}
              <div className="p-5 rounded-2xl bg-secondary/40 border border-border flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-extrabold text-foreground uppercase tracking-wider block">
                      Total Liquid Cash Collected vs Financed Balance
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Gross Contract Value: <strong className="text-foreground font-mono">{formatCurrency(totalContract)}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span>Liquid Cash: {formatCurrency(totalCollected)} ({collectedPct}%)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span>Financed Loan: {formatCurrency(loanFinancedTotal)} ({loanPct}%)</span>
                    </div>
                  </div>
                </div>

                {/* Split Bar */}
                <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden flex border border-border">
                  <div 
                    style={{ width: `${collectedPct}%` }} 
                    className="bg-emerald-500 h-full transition-all duration-500 rounded-l-full" 
                    title={`Liquid Cash: ${formatCurrency(totalCollected)}`}
                  />
                  <div 
                    style={{ width: `${loanPct}%` }} 
                    className="bg-amber-500 h-full transition-all duration-500 rounded-r-full" 
                    title={`Financed Loan: ${formatCurrency(loanFinancedTotal)}`}
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
                          ? 'bg-secondary text-foreground border border-border shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      All Deals ({data?.deals?.length || 0})
                    </button>
                    <button
                      onClick={() => setFilterType('FULL_PAYMENT')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        filterType === 'FULL_PAYMENT'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Full Payments ({data?.fullPayment?.count || 0})
                    </button>
                    <button
                      onClick={() => setFilterType('LOAN_FINANCED')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        filterType === 'LOAN_FINANCED'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Loan Deals ({data?.loanPayment?.count || 0})
                    </button>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search customer, car..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-secondary/40 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-card border border-border overflow-hidden">
                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-left text-xs font-sans">
                      <thead className="sticky top-0 bg-secondary border-b border-border z-10 text-[10px] uppercase font-bold text-muted-foreground">
                        <tr>
                          <th className="py-2.5 px-3.5">Contract</th>
                          <th className="py-2.5 px-3.5">Customer & Vehicle</th>
                          <th className="py-2.5 px-3.5">Payment Type</th>
                          <th className="py-2.5 px-3.5">Down Payment (Received)</th>
                          <th className="py-2.5 px-3.5">Loan Financed</th>
                          <th className="py-2.5 px-3.5">2% Bank Payout</th>
                          <th className="py-2.5 px-3.5">Final Total</th>
                          <th className="py-2.5 px-3.5">Settlement Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {filteredDeals.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-muted-foreground">
                              No contracts matching this filter.
                            </td>
                          </tr>
                        ) : (
                          filteredDeals.map((deal: any) => {
                            const isLoan = deal.type === 'LOAN_FINANCED';

                            return (
                              <tr key={deal.sale_id} className="hover:bg-secondary/40 transition-colors">
                                <td className="py-3 px-3.5 font-mono font-bold text-sky-400">
                                  #CR-{deal.sale_id}
                                </td>
                                <td className="py-3 px-3.5">
                                  <div className="font-bold text-foreground">{deal.customer_name}</div>
                                  <div className="text-[11px] text-muted-foreground">{deal.vehicle_name}</div>
                                </td>
                                <td className="py-3 px-3.5">
                                  {isLoan ? (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                      Loan Deal
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      Full Upfront
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3.5 font-mono font-bold text-emerald-400">
                                  {isLoan ? formatCurrency(deal.deposit_amount) : formatCurrency(deal.final_amount)}
                                </td>
                                <td className="py-3 px-3.5 font-mono font-bold text-amber-400">
                                  {isLoan ? formatCurrency(deal.loan_amount) : '₹0 (None)'}
                                </td>
                                <td className="py-3 px-3.5 font-mono font-bold text-indigo-400">
                                  {isLoan ? (
                                    <div className="flex flex-col">
                                      <span>{formatCurrency(deal.bank_commission_amount)}</span>
                                      <span className="text-[9px] text-muted-foreground font-sans font-normal">2% Dealer Payout</span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground/50 font-normal">—</span>
                                  )}
                                </td>
                                <td className="py-3 px-3.5 font-mono font-bold text-foreground">
                                  {formatCurrency(deal.final_amount)}
                                </td>
                                <td className="py-3 px-3.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    (deal.payment_status || '').toLowerCase().includes('paid')
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
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
        <div className="p-4 border-t border-border bg-secondary/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs transition-colors cursor-pointer"
          >
            Close Breakdown
          </button>
        </div>

      </div>
    </div>
  );
}
