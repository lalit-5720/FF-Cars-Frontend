'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Building2,
  Receipt,
  Check,
  CheckCircle2,
  AlertCircle,
  Car,
  User,
  IndianRupee,
  Calendar,
  CreditCard,
  QrCode,
  Landmark,
  Banknote,
  FileText,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { api } from '../../../services/api';
import { showLocalToast } from '../../Toast';
import { useAuthStore } from '../../../store/useAuthStore';

import { maxLen } from '../../../lib/validation';
interface PaymentVerificationModalProps {
  sale: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PAYMENT_METHODS = [
  {
    id: 'Bank Transfer (NEFT/RTGS)',
    label: 'Bank Transfer',
    sub: 'NEFT / RTGS / IMPS',
    icon: Landmark,
    refLabel: 'UTR Number (12-22 Digits)',
    placeholder: 'e.g. UTIB261019004812 / SBIN0001234',
    requiresBank: true,
    bankLabel: 'Bank Name (Sender / Beneficiary Bank)',
    bankPlaceholder: 'e.g. HDFC Bank, SBI, ICICI Bank',
  },
  {
    id: 'POS Card',
    label: 'Card (POS)',
    sub: 'Debit / Credit Terminal',
    icon: CreditCard,
    refLabel: 'Card Transaction ID / Auth Code',
    placeholder: 'e.g. TXN-849201 / AUTH-99231',
    requiresBank: false,
  },
  {
    id: 'UPI',
    label: 'UPI / QR Code',
    sub: 'GPay / PhonePe / Paytm',
    icon: QrCode,
    refLabel: 'UPI Transaction ID / Ref #',
    placeholder: 'e.g. 429188204910@okaxis',
    requiresBank: false,
  },
  {
    id: 'Cheque / DD',
    label: 'Cheque / DD',
    sub: 'Demand Draft / Clearing',
    icon: FileText,
    refLabel: 'Cheque / Instrument Number',
    placeholder: 'e.g. Cheque No. 004521',
    requiresBank: true,
    bankLabel: 'Issuing Bank (Drawn On)',
    bankPlaceholder: 'e.g. State Bank of India, HDFC Bank',
  },
  {
    id: 'Cash',
    label: 'Cash Payment',
    sub: 'Showroom Cash Desk',
    icon: Banknote,
    refLabel: 'Cash Voucher / Receipt #',
    placeholder: 'e.g. CASH-RCPT-2026-089',
    requiresBank: false,
  },
];

const POPULAR_BANKS = ['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Bank of Baroda', 'Punjab National Bank'];

export function PaymentVerificationModal({
  sale,
  isOpen,
  onClose,
  onSuccess,
}: PaymentVerificationModalProps) {
  const { user } = useAuthStore();

  const isLoanDeal = sale ? Number(sale.loan_amount || 0) > 0 : false;
  const finalPrice = sale ? Number(sale.final_amount || sale.selling_price || 0) : 0;
  const loanAmount = sale ? Number(sale.loan_amount || 0) : 0;
  const totalPaidSoFar = sale ? Number(sale.total_amount_paid ?? sale.total_paid ?? sale.deposit_amount ?? 0) : 0;
  
  const requiredDownPayment = isLoanDeal
    ? Number(sale.required_down_payment ?? Math.max(0, finalPrice - loanAmount))
    : 0;
  const remainingDownPayment = isLoanDeal
    ? Number(sale.remaining_down_payment ?? Math.max(0, requiredDownPayment - totalPaidSoFar))
    : 0;

  const balanceDue = typeof sale?.outstanding_balance === 'number'
    ? sale.outstanding_balance
    : Math.max(0, finalPrice - totalPaidSoFar);

  // On a loan deal the customer only owes the remaining down payment; the bank pays the loan part.
  const targetCollectionAmount = isLoanDeal ? remainingDownPayment : balanceDue;
  const outstandingCash = isLoanDeal ? 0 : Number(balanceDue || 0);
  const isLoanDisbursed = !!sale?.is_loan_disbursed;

  // Form State
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer (NEFT/RTGS)');
  const [amount, setAmount] = useState<number>(0);
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize values when sale changes
  useEffect(() => {
    if (sale) {
      setAmount(targetCollectionAmount > 0 ? targetCollectionAmount : (balanceDue > 0 ? balanceDue : finalPrice));
      setPaymentMethod('Bank Transfer (NEFT/RTGS)');
      setTransactionRef(`UTR-${sale.sale_id}-${Date.now().toString().slice(-6)}`);
      setBankName('HDFC Bank');
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setRemarks(
        isLoanDeal
          ? 'Down payment verified with accounts team. Funds cleared in showroom account.'
          : 'Payment verified with accounts team. Funds cleared in showroom account.'
      );
      setValidationError(null);
    }
  }, [sale, targetCollectionAmount, balanceDue, finalPrice, isLoanDeal]);

  if (!isOpen || !sale) return null;

  const currentMethodConfig = PAYMENT_METHODS.find((m) => m.id === paymentMethod) || PAYMENT_METHODS[0];

  const formatINR = (val: number) => `₹${Math.round(val || 0).toLocaleString('en-IN')}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setValidationError('Please enter a valid payment amount greater than ₹0.');
      return;
    }
    if (isLoanDeal && numericAmount > targetCollectionAmount) {
      setValidationError(`Customer only owes ${formatINR(targetCollectionAmount)} down payment. The loan amount is paid by the bank.`);
      return;
    }

    if (!isLoanDeal && outstandingCash > 0 && numericAmount > outstandingCash) {
      setValidationError(`The customer only owes ${formatINR(outstandingCash)}. The amount cannot exceed the outstanding balance.`);
      return;
    }
    if (transactionRef.trim().length > 100) {
      setValidationError('Reference must be at most 100 characters.');
      return;
    }

    if (!transactionRef.trim()) {
      setValidationError(`Please enter the ${currentMethodConfig.refLabel} for official verification.`);
      return;
    }

    if (currentMethodConfig.requiresBank && !bankName.trim()) {
      setValidationError(`Please enter or select the ${currentMethodConfig.bankLabel || 'Bank Name'} for verification.`);
      return;
    }

    const finalBankName = currentMethodConfig.requiresBank ? bankName.trim() : '';

    setSubmitting(true);
    try {
      await api.post(`/sales/${sale.sale_id}/mark-paid`, {
        amount: numericAmount,
        payment_method: paymentMethod,
        transaction_reference: transactionRef.trim(),
        bank_name: finalBankName,
        payment_date: paymentDate,
        remarks: remarks.trim(),
        verified_by: `${user?.name || 'Authorized Staff'} (${user?.role || 'Staff'})`,
      });

      showLocalToast(
        `✓ Payment of ${formatINR(numericAmount)} verified & recorded! Reference: ${transactionRef}`,
        'success'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Payment verification failed:', err);
      const msg = err.response?.data?.message || 'Failed to record payment verification. Please try again.';
      setValidationError(msg);
      showLocalToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-card border border-border rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-border bg-gradient-to-r from-emerald-950/30 via-secondary/40 to-card flex items-start justify-between relative">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                  Deal #CR-{sale.sale_id}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 text-[10px] font-bold">
                  {isLoanDeal ? 'Bank Loan Deal' : 'Full Cash Purchase'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight mt-1 flex items-center gap-2">
                Payment Verification &amp; Settlement
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Capture official banking clearance instrument, UTR reference &amp; verification notes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          
          {/* Summary Banner */}
          <div className="rounded-2xl border border-border bg-secondary/30 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Customer &amp; Vehicle
              </span>
              <strong className="text-xs text-foreground block font-bold mt-0.5 truncate">
                {sale.customers?.first_name} {sale.customers?.last_name || ''}
              </strong>
              <span className="text-[11px] text-muted-foreground block truncate">
                {sale.vehicles?.make} {sale.vehicles?.model} ({sale.vehicles?.manufacture_year || ''})
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Total Selling Price
              </span>
              <strong className="text-sm font-extrabold text-foreground font-mono mt-0.5 block">
                {formatINR(finalPrice)}
              </strong>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-medium">
                Paid so far: {formatINR(totalPaidSoFar)}
              </span>
            </div>

            <div className="sm:border-l sm:border-border sm:pl-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block">
                {isLoanDeal ? 'Remaining Down Payment Due' : 'Remaining Balance Due'}
              </span>
              <strong className="text-base font-black text-amber-800 dark:text-amber-400 font-mono mt-0.5 block">
                {formatINR(targetCollectionAmount)}
              </strong>
              <span className="text-[10px] text-muted-foreground block">
                {isLoanDeal ? `Bank Loan (${formatINR(loanAmount)}) ${isLoanDisbursed ? 'disbursed' : 'pending'}` : 'Target settlement amount'}
              </span>
            </div>
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-700 dark:text-rose-400" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Step 1: Select Payment Method */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Select Payment Verification Method</span>
              <span className="text-[10px] font-normal text-muted-foreground">Select instrument used</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(method.id);
                      setValidationError(null);
                      if (method.id === 'Cash') {
                        setTransactionRef(`CASH-RCPT-${sale.sale_id}-${Date.now().toString().slice(-4)}`);
                        setBankName('');
                        setRemarks('Cash payment verified & received at showroom cashier desk.');
                      } else if (method.id === 'POS Card') {
                        setTransactionRef(`TXN-${sale.sale_id}-${Date.now().toString().slice(-6)}`);
                        setBankName('');
                        setRemarks('Card POS transaction approved & verified. Auth reference logged.');
                      } else if (method.id === 'UPI') {
                        setTransactionRef(`UPI-${sale.sale_id}-${Date.now().toString().slice(-6)}`);
                        setBankName('');
                        setRemarks('UPI transaction verified. Funds received in showroom account.');
                      } else if (method.id === 'Cheque / DD') {
                        setTransactionRef(`CHQ-${sale.sale_id}-00`);
                        if (!bankName) setBankName('State Bank of India');
                        setRemarks('Cheque/Demand Draft received and submitted for banking clearance.');
                      } else {
                        // Bank Transfer (NEFT/RTGS)
                        setTransactionRef(`UTR-${sale.sale_id}-${Date.now().toString().slice(-6)}`);
                        if (!bankName) setBankName('HDFC Bank');
                        setRemarks('Bank transfer NEFT/RTGS verified. UTR matched with showroom statement.');
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-sm ring-1 ring-emerald-500/40'
                        : 'bg-secondary/40 border-border hover:bg-secondary/70 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />}
                    </div>
                    <div>
                      <strong className="text-xs font-bold block leading-tight text-foreground">
                        {method.label}
                      </strong>
                      <small className="text-[9px] block text-muted-foreground truncate">
                        {method.sub}
                      </small>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Amount & Transaction Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Amount Received (₹) *</span>
                {targetCollectionAmount > 0 && amount !== targetCollectionAmount && (
                  <button
                    type="button"
                    onClick={() => setAmount(targetCollectionAmount)}
                    className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    Set Full Balance ({formatINR(targetCollectionAmount)})
                  </button>
                )}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  max={isLoanDeal ? targetCollectionAmount : (outstandingCash > 0 ? outstandingCash : finalPrice)}
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  required
                  placeholder="e.g. 1450000"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm font-mono font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
              <span className="text-[10px] text-muted-foreground block">
                {amount >= targetCollectionAmount
                  ? (isLoanDeal ? '✓ This payment completes the customer down payment' : '✓ This payment will satisfy 100% of the remaining balance')
                  : `⚠️ Partial collection: Leaves ₹${Math.max(0, targetCollectionAmount - amount).toLocaleString('en-IN')} pending`}
              </span>
            </div>

            {/* Transaction / UTR Reference */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>{currentMethodConfig.refLabel} *</span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">Required</span>
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                required
                placeholder={currentMethodConfig.placeholder}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs font-mono font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              <span className="text-[10px] text-muted-foreground block truncate">
                Banking audit reference for ledger matching
              </span>
            </div>
          </div>

          {/* Step 3: Bank Name & Date (Bank strictly shown ONLY when payment method requires it) */}
          {currentMethodConfig.requiresBank ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Bank Name (Shown for Bank Transfer & Cheque) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>{currentMethodConfig.bankLabel || 'Bank Name'} *</span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">Required</span>
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  required
                  placeholder={currentMethodConfig.bankPlaceholder || 'e.g. HDFC Bank, SBI, ICICI'}
                  list="bank-list"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs font-medium focus:outline-none focus:border-emerald-500 transition-all"
                />
                <datalist id="bank-list">
                  {POPULAR_BANKS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
                <div className="flex flex-wrap gap-1 mt-1">
                  {POPULAR_BANKS.slice(0, 5).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBankName(b)}
                      className={`text-[9px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                        bankName === b
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold'
                          : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clearance Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Payment Settlement Date *</span>
                  <span className="text-[10px] text-muted-foreground">Date of credit</span>
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs font-medium focus:outline-none focus:border-emerald-500 transition-all"
                />
                <span className="text-[10px] text-muted-foreground block">
                  Recorded on showroom financial ledger for selected date
                </span>
              </div>
            </div>
          ) : (
            /* Bank NOT required (Cash, POS Card, UPI) */
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Payment Settlement Date *</span>
                <span className="text-[10px] text-muted-foreground">Date of transaction</span>
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs font-medium focus:outline-none focus:border-emerald-500 transition-all"
              />
              <span className="text-[10px] text-muted-foreground block">
                {paymentMethod === 'Cash'
                  ? '💵 Cash payment verified & deposited at showroom cashier desk. No bank required.'
                  : paymentMethod === 'POS Card'
                  ? '💳 Card payment charged via POS terminal. Verified by Transaction ID (no bank required).'
                  : '📱 UPI payment verified via UPI Transaction ID. No bank required.'}
              </span>
            </div>
          )}

          {/* Verification Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Verification Remarks &amp; Audit Notes</span>
              <span className="text-[10px] text-muted-foreground">Recorded into sale log</span>
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Payment verified with showroom accounts desk. Official UTR verified and matched."
              className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-emerald-500 transition-all resize-none"
            />
          </div>

          {/* Footer Sign-off */}
          <div className="p-3 rounded-xl bg-secondary/30 border border-border text-[11px] text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User size={14} className="text-emerald-700 dark:text-emerald-400" />
              <span>
                Verification Officer: <strong className="text-foreground">{user?.name || 'Showroom Manager'}</strong> ({user?.role || 'ADMIN'})
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
              Status: Verified Clearance
            </span>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-border bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recording Verification...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify &amp; Settle {formatINR(amount || balanceDue)}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
