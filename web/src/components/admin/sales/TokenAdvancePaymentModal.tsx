'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Building2,
  Wallet,
  Receipt,
  Check,
  CheckCircle2,
  AlertCircle,
  Car,
  User,
  Percent,
  IndianRupee,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { api } from '../../../services/api';
import { showLocalToast } from '../../Toast';

interface TokenAdvancePaymentModalProps {
  sale: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TokenAdvancePaymentModal({
  sale,
  isOpen,
  onClose,
  onSuccess,
}: TokenAdvancePaymentModalProps) {
  // Existing state from sale
  const existingIsLoan = sale ? Number(sale.loan_amount || 0) > 0 : false;
  const sellingPrice = sale ? Number(sale.final_amount || sale.selling_price || 0) : 0;

  // Form State
  const [paymentMode, setPaymentMode] = useState<'FULL_PAYMENT' | 'PART_PAYMENT'>('FULL_PAYMENT');
  const [downPaymentPct, setDownPaymentPct] = useState<number>(20);
  const [tokenAdvance, setTokenAdvance] = useState<number>(50000);
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Initialize form when sale opens
  useEffect(() => {
    if (sale) {
      const isLoan = Number(sale.loan_amount || 0) > 0;
      setPaymentMode(isLoan ? 'PART_PAYMENT' : 'FULL_PAYMENT');
      
      const existingToken = Number(sale.token_advance ?? sale.token_advance_amount ?? sale.deposit_amount ?? 0);
      setTokenAdvance(existingToken > 0 ? existingToken : 50000);

      if (isLoan && sellingPrice > 0) {
        const grossDown = Math.max(0, sellingPrice - Number(sale.loan_amount));
        const pct = Math.round((grossDown / sellingPrice) * 100);
        setDownPaymentPct(pct > 0 ? pct : 20);
      } else {
        setDownPaymentPct(20);
      }

      setReference(`CR${sale.sale_id}-ADV-${Date.now().toString().slice(-4)}`);
      setNotes('');
    }
  }, [sale, sellingPrice]);

  if (!isOpen || !sale) return null;

  // Financial Calculations
  const grossDownPayment = Math.round((sellingPrice * downPaymentPct) / 100);
  const bankLoanAmount = Math.max(0, sellingPrice - grossDownPayment);
  const netDownPaymentDue = Math.max(0, grossDownPayment - tokenAdvance);
  const netFullPaymentDue = Math.max(0, sellingPrice - tokenAdvance);
  const bankCommission = Math.round(bankLoanAmount * 0.02);

  const formatINR = (val: number) => `₹${Math.round(val || 0).toLocaleString('en-IN')}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenAdvance <= 0) {
      showLocalToast('Please enter a valid token advance amount.', 'error');
      return;
    }
    if (tokenAdvance > sellingPrice) {
      showLocalToast('Token advance cannot exceed the total vehicle price.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const isLoan = paymentMode === 'PART_PAYMENT';
      const payload = {
        amount: tokenAdvance,
        payment_mode: paymentMode,
        down_payment: isLoan ? grossDownPayment : 0,
        loan_amount: isLoan ? bankLoanAmount : 0,
        payment_method: paymentMethod,
        remarks: notes || (isLoan ? `Token advance for loan financing (${reference})` : `Token advance for full payment (${reference})`),
        is_token_advance: true,
      };

      await api.post(`/sales/${sale.sale_id}/collect-advance`, payload);
      showLocalToast(
        `Token advance of ${formatINR(tokenAdvance)} recorded & Deal #CR-${sale.sale_id} locked as Reserved!`,
        'success'
      );
      onSuccess();
    } catch (err: any) {
      showLocalToast(
        err.response?.data?.message || 'Failed to record token advance.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const customerName = sale.customers
    ? `${sale.customers.first_name} ${sale.customers.last_name || ''}`.trim()
    : `Customer #${sale.customer_id}`;
  const carTitle = sale.vehicles
    ? `${sale.vehicles.make} ${sale.vehicles.model} (${sale.vehicles.manufacture_year || ''})`
    : `Vehicle #${sale.vehicle_id}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto text-foreground">
        
        {/* HEADER BAR */}
        <div className="p-5 sm:p-6 bg-secondary/40 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
              <Lock className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-foreground font-display tracking-tight">
                  Token Advance Payment Screen
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Deal #CR-{sale.sale_id}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 font-bold text-foreground">
                  <Car className="w-3.5 h-3.5 text-blue-400" />
                  {carTitle}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  {customerName}
                </span>
                <span>&bull;</span>
                <span className="font-mono font-bold text-foreground">
                  {formatINR(sellingPrice)}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh] text-xs">
          
          {/* STEP 1: PAYMENT STRUCTURE SELECTOR */}
          <div>
            <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block mb-2">
              1. Select Customer Payment Structure
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Full Payment */}
              <button
                type="button"
                onClick={() => setPaymentMode('FULL_PAYMENT')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  paymentMode === 'FULL_PAYMENT'
                    ? 'bg-sky-500/10 border-sky-500/60 shadow-md ring-1 ring-sky-500/30'
                    : 'bg-secondary/40 border-border hover:border-slate-500 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-sky-400" />
                    Full Payment (Self-Financed / Cash)
                  </span>
                  {paymentMode === 'FULL_PAYMENT' && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  No bank loan. Token advance is stored separately and deducted directly from the vehicle price.
                </span>
              </button>

              {/* Option B: Bank Loan */}
              <button
                type="button"
                onClick={() => setPaymentMode('PART_PAYMENT')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  paymentMode === 'PART_PAYMENT'
                    ? 'bg-amber-500/10 border-amber-500/60 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-secondary/40 border-border hover:border-slate-500 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    Bank Loan (Financed / Part Payment)
                  </span>
                  {paymentMode === 'PART_PAYMENT' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Financed via Bank. Token advance is deducted from Down Payment. Bank loan is kept untouched &amp; reserved.
                </span>
              </button>
            </div>
          </div>

          {/* STEP 2: DOWN PAYMENT PERCENTAGE (If Bank Loan) */}
          {paymentMode === 'PART_PAYMENT' && (
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-foreground">Required Down Payment Percentage:</span>
                <span className="text-amber-400 font-mono text-sm font-extrabold">
                  {downPaymentPct}% ({formatINR(grossDownPayment)})
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {[15, 20, 25, 30, 40].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDownPaymentPct(pct)}
                    className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      downPaymentPct === pct
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                <span>Bank Loan Principal (Untouched &amp; Reserved):</span>
                <strong className="text-sky-400 font-mono font-bold">{formatINR(bankLoanAmount)}</strong>
              </div>
            </div>
          )}

          {/* STEP 3: TOKEN ADVANCE AMOUNT */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                2. Token Advance Amount to Collect &amp; Store
              </label>
              <span className="text-[10px] text-emerald-400 font-bold">
                Locks Vehicle as &quot;Reserved&quot;
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-2.5">
              {[25000, 50000, 100000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTokenAdvance(amt)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    tokenAdvance === amt
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-black shadow-sm'
                      : 'bg-secondary/40 border-border text-muted-foreground hover:text-foreground font-bold'
                  }`}
                >
                  <div className="font-mono text-xs">{formatINR(amt)}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">
                    {amt === 50000 ? '★ Standard' : amt === 25000 ? 'Minimum' : 'Priority'}
                  </div>
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono font-bold">
                ₹
              </span>
              <input
                type="number"
                min="1000"
                max={sellingPrice}
                step="1000"
                value={tokenAdvance}
                onChange={(e) => setTokenAdvance(Math.max(0, Number(e.target.value)))}
                placeholder="Custom token advance amount..."
                className="w-full pl-8 pr-3 py-2.5 bg-secondary/50 border border-border rounded-xl text-foreground font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* STEP 4: TRANSPARENT FINANCIAL RECONCILIATION */}
          <div className="p-4 sm:p-5 rounded-2xl bg-secondary/30 border border-border space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-400" />
                Financial Segregation Formula
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                100% Segregated Ledger
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Vehicle Contract Selling Price:</span>
                <span className="font-mono font-bold text-foreground">{formatINR(sellingPrice)}</span>
              </div>

              {paymentMode === 'PART_PAYMENT' ? (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Required Down Payment ({downPaymentPct}%):</span>
                    <span className="font-mono font-bold text-amber-300">{formatINR(grossDownPayment)}</span>
                  </div>

                  <div className="flex justify-between text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                    <span className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Token Advance Collected Now:
                    </span>
                    <span className="font-mono font-extrabold">-{formatINR(tokenAdvance)}</span>
                  </div>

                  <div className="flex justify-between text-foreground font-extrabold pt-1">
                    <span>Remaining Down Payment Due (at delivery):</span>
                    <span className="font-mono text-amber-400 text-sm">{formatINR(netDownPaymentDue)}</span>
                  </div>

                  <div className="flex justify-between text-sky-400 font-bold pt-1 border-t border-border">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" /> Bank Loan Principal (Untouched &amp; Reserved):
                    </span>
                    <span className="font-mono text-sm">{formatINR(bankLoanAmount)}</span>
                  </div>

                  <div className="flex justify-between text-emerald-400 font-bold pt-1">
                    <span className="flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5" /> Showroom 2% Bank Profit Bonus:
                    </span>
                    <span className="font-mono">+{formatINR(bankCommission)}</span>
                  </div>

                  {/* Explicit Explanation */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 leading-relaxed flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong>Bank Loan Formula Applied:</strong> The token advance of {formatINR(tokenAdvance)} is deducted strictly from the customer down payment ({formatINR(grossDownPayment)} - {formatINR(tokenAdvance)} = {formatINR(netDownPaymentDue)} due). The bank loan principal of {formatINR(bankLoanAmount)} is reserved separately and completely untouched.
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                    <span className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Token Advance Collected Now:
                    </span>
                    <span className="font-mono font-extrabold">-{formatINR(tokenAdvance)}</span>
                  </div>

                  <div className="flex justify-between text-foreground font-extrabold pt-1">
                    <span>Net Remaining Cash Balance (due at delivery):</span>
                    <span className="font-mono text-emerald-400 text-sm">{formatINR(netFullPaymentDue)}</span>
                  </div>

                  {/* Explicit Explanation */}
                  <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-[11px] text-sky-200 leading-relaxed flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <strong>Full Cash Formula Applied:</strong> The token advance of {formatINR(tokenAdvance)} is stored separately in the payments ledger to lock vehicle #{sale.vehicle_id} as <em>Reserved</em>. The remaining balance of {formatINR(netFullPaymentDue)} will be collected before vehicle handover.
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* STEP 5: PAYMENT METHOD & DETAILS */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block">
              3. Payment Channel &amp; Reference
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['UPI', 'Net Banking', 'Card', 'Cash'].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    paymentMethod === method
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-secondary/40 border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                  Transaction / UTR / Reference ID
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. UPI-99882211 or Cash Receipt #14"
                  className="w-full p-2.5 bg-secondary/50 border border-border rounded-xl text-foreground focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                  Internal Remarks / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Token received via GPay from customer"
                  className="w-full p-2.5 bg-secondary/50 border border-border rounded-xl text-foreground focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground font-bold cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
            >
              <ShieldCheck className="w-4 h-4 text-slate-950" />
              <span>
                {submitting ? 'Storing Advance...' : `Confirm & Store Token Advance (${formatINR(tokenAdvance)})`}
              </span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
