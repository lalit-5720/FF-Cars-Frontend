'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../services/api';
import { showLocalToast } from '../../Toast';
import { usePermissions } from '../../../hooks/usePermissions';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  Truck, 
  ShieldCheck, 
  AlertTriangle, 
  Percent, 
  Car, 
  User, 
  Ban,
  Calendar,
  Lock,
  IndianRupee,
  Receipt,
  FileCheck
} from 'lucide-react';

interface SaleLifecycleModalProps {
  sale: any;
  isOpen: boolean;
  onClose: () => void;
  onSaleUpdated: () => void;
  onOpenPaymentVerification?: (sale: any) => void;
}

export function SaleLifecycleModal({
  sale,
  isOpen,
  onClose,
  onSaleUpdated,
  onOpenPaymentVerification,
}: SaleLifecycleModalProps) {
  const router = useRouter();
  const permissions = usePermissions();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('Customer decided not to proceed');
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen || !sale) return null;

  const isLoanDeal = Number(sale.loan_amount || 0) > 0;
  const finalAmount = Number(sale.final_amount ?? sale.selling_price ?? 0);
  const tokenAdvance = Number(sale.token_advance ?? sale.token_advance_amount ?? sale.deposit_amount ?? 0);
  const loanAmount = Number(sale.loan_amount ?? 0);
  const bankCommission = sale.bank_commission_amount || (isLoanDeal ? Math.round(loanAmount * 0.02) : 0);

  const requiredDownPayment = isLoanDeal
    ? Number(sale.required_down_payment ?? Math.max(0, finalAmount - loanAmount))
    : 0;
  const downPaymentPaid = isLoanDeal
    ? Number(sale.down_payment_paid ?? tokenAdvance)
    : 0;
  const remainingDownPayment = isLoanDeal
    ? Number(sale.remaining_down_payment ?? Math.max(0, requiredDownPayment - downPaymentPaid))
    : 0;
  const totalAmountPaid = Number(sale.total_amount_paid ?? sale.total_paid ?? tokenAdvance);
  const outstandingBalance = Number(
    sale.outstanding_balance ?? Math.max(0, finalAmount - totalAmountPaid)
  );
  const remainingCashBalance = isLoanDeal ? 0 : outstandingBalance;
  const paymentsList = Array.isArray(sale.payments) ? sale.payments : [];

  const isLoanDisbursed = Boolean(sale.is_loan_disbursed);
  const isLoanApproved = sale.loan_status === 'Approved' || isLoanDisbursed;
  const isPaid = (sale.payment_status || '').toLowerCase() === 'paid';
  const isCancelled = (sale.payment_status || '').toLowerCase().includes('cancel');
  const isDelivered = (sale.delivery_status || '').toLowerCase().includes('deliver');
  const isScheduled = (sale.delivery_status || '').toLowerCase().includes('schedule');

  // Stage 2 completion: 100% financial clearance
  const isStage2Complete = isLoanDeal ? isPaid : (isPaid || outstandingBalance === 0);
  const isStage3Complete = isStage2Complete;
  const isStage4Unlocked = isStage2Complete && !isCancelled;

  const formatCurrency = (val: number) => `₹${Math.round(val || 0).toLocaleString('en-IN')}`;

  const handleApproveLoan = async () => {
    setLoadingAction('approve-loan');
    try {
      await api.post(`/sales/${sale.sale_id}/approve-loan`);
      showLocalToast('Bank Loan Disbursed! 2% Dealership Commission booked.', 'success');
      onSaleUpdated();
      onClose();
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to disburse loan', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCollectDownPayment = async () => {
    if (onOpenPaymentVerification) {
      onOpenPaymentVerification(sale);
      onClose();
      return;
    }
    setLoadingAction('collect-downpay');
    try {
      await api.post(`/sales/${sale.sale_id}/collect-advance`, {
        amount: remainingDownPayment,
        remarks: 'Remaining Down Payment Settled',
      });
      showLocalToast(`Down payment balance of ${formatCurrency(remainingDownPayment)} collected!`, 'success');
      onSaleUpdated();
      onClose();
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to record down payment', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleMarkFullPaid = async () => {
    if (onOpenPaymentVerification) {
      onOpenPaymentVerification(sale);
      onClose();
      return;
    }
    setLoadingAction('mark-paid');
    try {
      await api.post(`/sales/${sale.sale_id}/mark-paid`);
      showLocalToast('Remaining cash balance settled! Sale is fully paid.', 'success');
      onSaleUpdated();
      onClose();
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to settle full payment', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleMoveToDelivery = async () => {
    setLoadingAction('move-delivery');
    try {
      // Branch Manager sends no date; the Sales Executive schedules it in Deliveries.
      await api.post(
        `/sales/${sale.sale_id}/move-to-delivery`,
        permissions.canManageDeliveries ? { delivery_date: deliveryDate } : {},
      );
      showLocalToast(
        permissions.canManageDeliveries
          ? 'Delivery scheduled!'
          : 'Moved to Deliveries. The Sales Executive will schedule and complete the handover.',
        'success',
      );
      onSaleUpdated();
      onClose();
      if (permissions.canAccessDeliveries) {
        router.push('/admin/deliveries');
      }
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to schedule delivery', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCompleteDelivery = async () => {
    setLoadingAction('complete-delivery');
    try {
      await api.post(`/sales/${sale.sale_id}/complete-delivery`);
      showLocalToast('Delivery completed! Keys handed over. Vehicle marked Sold.', 'success');
      onSaleUpdated();
      onClose();
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to complete delivery', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCancelSale = async () => {
    setLoadingAction('cancel-sale');
    try {
      await api.post(`/sales/${sale.sale_id}/cancel`, { reason: cancelReason });
      showLocalToast('Purchase Cancelled! Vehicle released back to Available stock.', 'success');
      setShowCancelConfirm(false);
      onSaleUpdated();
      onClose();
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to cancel sale', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-card border border-border rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-foreground font-display">
                  {sale.vehicles?.make} {sale.vehicles?.model}
                </h2>
                <span className="text-xs font-mono font-bold text-sky-700 dark:text-sky-400">
                  #CR-{sale.sale_id}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <User size={13} className="text-emerald-700 dark:text-emerald-400" />
                <span>Buyer: <strong>{sale.customers?.first_name} {sale.customers?.last_name || ''}</strong></span>
                {sale.customers?.phone && <span>&bull; {sale.customers?.phone}</span>}
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

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">

          {/* CURRENT STATUS HIGHLIGHT BANNER */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
            isCancelled
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : isDelivered
              ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
              : isScheduled
              ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
              : isPaid
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            <div className="flex items-center gap-3">
              {isCancelled ? (
                <Ban className="w-6 h-6 text-rose-700 dark:text-rose-400 shrink-0" />
              ) : isDelivered ? (
                <Truck className="w-6 h-6 text-sky-700 dark:text-sky-400 shrink-0" />
              ) : isScheduled ? (
                <Calendar className="w-6 h-6 text-sky-700 dark:text-sky-400 shrink-0" />
              ) : isPaid ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-700 dark:text-emerald-400 shrink-0" />
              ) : (
                <Clock className="w-6 h-6 text-amber-800 dark:text-amber-400 shrink-0" />
              )}
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider opacity-80 block">
                  Current Deal Status &bull; {sale.payment_status || 'Pending'}
                </span>
                <span className="text-base font-extrabold block">
                  {isCancelled
                    ? 'Sale Cancelled & Car Released to Stock'
                    : isDelivered
                    ? 'Step 4: Vehicle Handed Over to Customer (Delivered & Sold)'
                    : isScheduled
                    ? 'Step 3: PDI Done & Delivery Scheduled • Ready for Handover'
                    : isLoanDeal
                    ? isPaid
                      ? 'Step 2: Bank Loan Disbursed & Down Payment Paid! Ready for Delivery'
                      : remainingDownPayment === 0
                      ? `Step 2: Down Payment Settled • Waiting for Bank Loan Disbursal (${formatCurrency(loanAmount)})`
                      : `Step 2: Token Advance Credited • Remaining Down Payment (${formatCurrency(remainingDownPayment)}) Due`
                    : isPaid || outstandingBalance === 0
                    ? 'Step 2: 100% Cash Paid & Verified • Ready for PDI & Delivery'
                    : `Step 2: Token Advance Received • Remaining Cash (${formatCurrency(remainingCashBalance)}) Due`}
                </span>
              </div>
            </div>
          </div>

          {/* MONEY BREAKDOWN CARD - STRICT SEPARATION OF ALL VALUES */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-foreground font-display uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400" />
                Segregated Financial Ledger (Zero Double-Counting)
              </h4>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                {isLoanDeal ? 'Loan Financing Deal' : 'Cash Purchase Deal'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-muted-foreground text-[11px] block">Final Contract Amount</span>
                <span className="text-foreground font-mono font-extrabold text-base block mt-0.5">
                  {formatCurrency(finalAmount)}
                </span>
                <span className="text-[9px] text-muted-foreground block font-medium">Selling Price - Disc + Tax</span>
              </div>

              <div>
                <span className="text-muted-foreground text-[11px] block">Token Advance Received</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-mono font-extrabold text-base block mt-0.5">
                  {formatCurrency(tokenAdvance)}
                </span>
                <span className="text-[9px] text-emerald-500/80 block font-medium">
                  {isLoanDeal ? 'Credited to Down Payment' : 'Initial Booking Deposit'}
                </span>
              </div>

              {isLoanDeal ? (
                <>
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Required Down Payment</span>
                    <span className="text-amber-800 dark:text-amber-400 font-mono font-extrabold text-base block mt-0.5">
                      {formatCurrency(requiredDownPayment)}
                    </span>
                    <span className="text-[9px] text-muted-foreground block font-medium">
                      Net Due: <strong className={remainingDownPayment > 0 ? 'text-amber-800 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}>{formatCurrency(remainingDownPayment)}</strong>
                    </span>
                  </div>

                  <div>
                    <span className="text-muted-foreground text-[11px] block">Bank Loan Principal</span>
                    <span className="text-sky-700 dark:text-sky-400 font-mono font-extrabold text-base block mt-0.5">
                      {formatCurrency(loanAmount)}
                    </span>
                    <span className="text-[9px] text-emerald-700 dark:text-emerald-400 block font-medium">
                      + {formatCurrency(bankCommission)} (2% Dealer Payout)
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Total Amount Paid</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-mono font-extrabold text-base block mt-0.5">
                      {formatCurrency(totalAmountPaid)}
                    </span>
                    <span className="text-[9px] text-muted-foreground block font-medium">Verified Receipts</span>
                  </div>

                  <div>
                    <span className="text-muted-foreground text-[11px] block">Remaining Cash Balance</span>
                    <span className={`font-mono font-extrabold text-base block mt-0.5 ${
                      outstandingBalance === 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {outstandingBalance === 0 ? '₹0 (Settled)' : formatCurrency(outstandingBalance)}
                    </span>
                    <span className="text-[9px] text-muted-foreground block font-medium">
                      {outstandingBalance === 0 ? 'Fully Paid' : 'Collect before release'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* LOAN SUMMARY STRIP */}
            {isLoanDeal && !isCancelled && (
              <div className="mt-3 pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-muted-foreground gap-2">
                <span className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-semibold">
                  <Percent size={13} />
                  Total Paid by Buyer: {formatCurrency(downPaymentPaid)} &bull; Outstanding Balance: {formatCurrency(outstandingBalance)}
                </span>
                <span className="font-bold text-sky-700 dark:text-sky-400">
                  Bank Disbursal Status: {isLoanDisbursed ? '✓ Verified Disbursed' : '⏳ Pending Bank Sanction'}
                </span>
              </div>
            )}
          </div>

          {/* STEP-BY-STEP CHECKLIST */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-3">
            <h4 className="font-extrabold text-foreground font-display uppercase tracking-wider text-[11px]">
              Stage Progression Checklist
            </h4>

            {/* Step 1: Token Advance */}
            <div className="p-3.5 rounded-xl bg-secondary/30 border border-emerald-500/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                  ✓
                </div>
                <div>
                  <strong className="text-foreground block text-xs">Step 1: Token Advance Collected &amp; Car Reserved</strong>
                  <span className="text-muted-foreground text-[11px]">
                    Customer paid {formatCurrency(tokenAdvance)} token advance. Vehicle status locked as Reserved.
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                Complete
              </span>
            </div>

            {/* Step 2: Financial Clearance */}
            {!isLoanDeal ? (
              // Step 2 for Cash Deals
              <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                isPaid || outstandingBalance === 0
                  ? 'bg-secondary/30 border-emerald-500/20'
                  : 'bg-amber-500/5 border-amber-500/30'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    isPaid || outstandingBalance === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400 animate-pulse'
                  }`}>
                    {isPaid || outstandingBalance === 0 ? '✓' : '2'}
                  </div>
                  <div>
                    <strong className="text-foreground block text-xs">
                      Step 2: Collect Remaining Cash Balance {outstandingBalance > 0 ? `(${formatCurrency(outstandingBalance)})` : ''}
                    </strong>
                    <span className="text-muted-foreground text-[11px]">
                      {isPaid || outstandingBalance === 0
                        ? 'Full cash payment received and verified. Outstanding balance: ₹0.'
                        : `Customer owes remaining balance of ${formatCurrency(outstandingBalance)}. Collect full payment before releasing vehicle.`}
                    </span>
                  </div>
                </div>

                {!isPaid && outstandingBalance > 0 && !isCancelled ? (
                  <button
                    onClick={handleMarkFullPaid}
                    disabled={loadingAction === 'mark-paid'}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-lg transition-colors cursor-pointer shadow flex items-center gap-1.5 shrink-0"
                    title="Record collection of remaining balance"
                  >
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span>Collect {formatCurrency(outstandingBalance)}</span>
                  </button>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    Settled
                  </span>
                )}
              </div>
            ) : (
              // Step 2 for Loan Deals
              <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                isPaid
                  ? 'bg-secondary/30 border-emerald-500/20'
                  : 'bg-amber-500/5 border-amber-500/30'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    isPaid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400 animate-pulse'
                  }`}>
                    {isPaid ? '✓' : '2'}
                  </div>
                  <div>
                    <strong className="text-foreground block text-xs">Step 2: Down Payment &amp; Bank Loan Disbursal</strong>
                    <span className="text-muted-foreground text-[11px] block">
                      {isPaid
                        ? `Loan disbursed (${formatCurrency(loanAmount)}) + Down payment settled (${formatCurrency(requiredDownPayment)}). 100% paid.`
                        : remainingDownPayment > 0
                        ? `Down payment pending: ${formatCurrency(remainingDownPayment)} due. Bank loan: ${formatCurrency(loanAmount)}.`
                        : `Down payment 100% settled! Awaiting bank loan disbursal of ${formatCurrency(loanAmount)}.`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {remainingDownPayment > 0 && !isCancelled && (permissions.isSystemAdmin || permissions.isBranchManager) && (
                    <button
                      onClick={handleCollectDownPayment}
                      disabled={loadingAction === 'collect-downpay'}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-lg transition-colors cursor-pointer shadow flex items-center gap-1 shrink-0"
                    >
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>Collect Down Payment ({formatCurrency(remainingDownPayment)})</span>
                    </button>
                  )}

                  {!isLoanDisbursed && !isCancelled && (
                    <button
                      onClick={handleApproveLoan}
                      disabled={loadingAction === 'approve-loan'}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-lg transition-colors cursor-pointer shadow flex items-center gap-1 shrink-0"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Disburse Loan ({formatCurrency(loanAmount)})</span>
                    </button>
                  )}

                  {isPaid && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                      Disbursed &amp; Settled
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: PDI & Gate-Pass */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
              isStage2Complete
                ? 'bg-secondary/30 border-emerald-500/20'
                : 'bg-secondary/20 border-border opacity-60'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  isStage2Complete ? 'bg-emerald-500/20 text-emerald-400' : 'bg-secondary text-muted-foreground'
                }`}>
                  {isStage2Complete ? '✓' : <Lock size={12} />}
                </div>
                <div>
                  <strong className="text-foreground block text-xs">Step 3: PDI &amp; Gate-Pass Clearance</strong>
                  <span className="text-muted-foreground text-[11px]">
                    {isStage2Complete
                      ? 'Pre-Delivery Inspection certified. Digital gate-pass generated for vehicle release.'
                      : `Locked — Complete 100% financial clearance (Step 2) before gate-pass generation.`}
                  </span>
                </div>
              </div>

              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                isStage2Complete ? 'bg-emerald-500/10 text-emerald-400' : 'bg-secondary text-muted-foreground'
              }`}>
                {isStage2Complete ? 'Verified & Ready' : 'Locked'}
              </span>
            </div>

            {/* Step 4: Vehicle Delivery Handover */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
              isDelivered
                ? 'bg-secondary/30 border-sky-500/20'
                : isStage4Unlocked
                ? 'bg-sky-500/5 border-sky-500/30'
                : 'bg-secondary/20 border-border opacity-60'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  isDelivered
                    ? 'bg-sky-500/20 text-sky-400'
                    : isStage4Unlocked
                    ? 'bg-sky-500/20 text-sky-400'
                    : 'bg-secondary text-muted-foreground'
                }`}>
                  {isDelivered ? '✓' : isStage4Unlocked ? '4' : <Lock size={12} />}
                </div>
                <div>
                  <strong className="text-foreground block text-xs">Step 4: Vehicle Delivery Handover &amp; Title Transfer</strong>
                  <span className="text-muted-foreground text-[11px]">
                    {isDelivered
                      ? 'Keys physically handed over to customer. Vehicle status permanently marked Sold.'
                      : isScheduled
                      ? `Delivery scheduled for ${new Date(sale.delivery_date || Date.now()).toLocaleDateString()}. Ready for bay handover.`
                      : isStage4Unlocked
                      ? 'All funds 100% verified! Ready to hand over keys and release vehicle.'
                      : '🔒 Locked — Vehicle keys cannot be released until full payment is settled (Step 2).'}
                  </span>
                </div>
              </div>

              {!isDelivered && isScheduled ? (
                <div className="flex items-center gap-2 shrink-0">
                  {permissions.canAccessDeliveries && (
                    <button
                      onClick={() => {
                        onClose();
                        router.push('/admin/deliveries');
                      }}
                      className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-lg transition-colors cursor-pointer shadow flex items-center gap-1.5 shrink-0"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Go to Deliveries &rarr;</span>
                    </button>
                  )}
                  {/* Handover is done from Deliveries, on the date confirmed with the customer */}
                  {!permissions.canAccessDeliveries && (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/30 flex items-center gap-1">
                      <Truck size={12} /> With Sales Exec for Handover
                    </span>
                  )}
                </div>
              ) : !isDelivered && !isScheduled && isStage4Unlocked && !showDeliveryForm ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => (permissions.canManageDeliveries ? setShowDeliveryForm(true) : handleMoveToDelivery())}
                    disabled={loadingAction === 'move-delivery'}
                    className="px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs rounded-lg transition-colors cursor-pointer border border-border flex items-center gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
                    <span>{permissions.canManageDeliveries ? 'Schedule Date' : 'Move to Delivery'}</span>
                  </button>
                </div>
              ) : isDelivered ? (
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Sale Completed (Sold)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-secondary text-muted-foreground">
                  Locked
                </span>
              )}
            </div>

            {/* Quick Delivery Date Form */}
            {showDeliveryForm && (
              <div className="p-3 rounded-xl bg-secondary/50 border border-sky-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                  <span className="text-xs font-bold text-foreground">Select Delivery Date:</span>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="px-2.5 py-1 bg-secondary border border-border rounded-lg text-foreground focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleMoveToDelivery}
                    disabled={loadingAction === 'move-delivery'}
                    className="px-3 py-1 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-500 cursor-pointer"
                  >
                    Confirm Delivery
                  </button>
                  <button
                    onClick={() => setShowDeliveryForm(false)}
                    className="px-2 py-1 bg-secondary text-muted-foreground rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* VERIFIED PAYMENTS & BANKING AUDIT LEDGER */}
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-foreground font-display uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                Verified Banking &amp; Payments Audit Ledger ({paymentsList.length})
              </h4>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                Total Verified: {formatCurrency(totalAmountPaid)}
              </span>
            </div>

            {paymentsList.length === 0 ? (
              <p className="text-muted-foreground text-xs italic">
                No payment instruments recorded yet.
              </p>
            ) : (
              <div className="space-y-2">
                {paymentsList.map((p: any, idx: number) => (
                  <div
                    key={p.payment_id || idx}
                    className="p-3 rounded-xl bg-background border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          {p.payment_method || 'Verified Payment'}
                        </span>
                        <span className="font-mono text-xs font-bold text-foreground">
                          {p.transaction_reference ? `Ref: ${p.transaction_reference}` : 'No Ref'}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {p.remarks || 'Standard verified settlement'}
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-xs">
                        +{formatCurrency(Number(p.amount_paid || 0))}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {p.payment_date ? new Date(p.payment_date).toLocaleDateString() : 'Recorded'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CANCELLATION BOX */}
          {!isCancelled ? (
            sale.can_cancel ? (
              <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Customer Changed Mind? (Cancellation Permitted)</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    You can cancel this sale before vehicle delivery. The vehicle will cleanly revert to Available status in the showroom.
                  </p>
                </div>

                {!showCancelConfirm ? (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl font-bold transition-colors cursor-pointer shrink-0"
                  >
                    Cancel Sale &amp; Return Car
                  </button>
                ) : (
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Why is it being cancelled?"
                      value={cancelReason} maxLength={500}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="px-3 py-1 bg-secondary border border-border rounded-lg text-foreground text-xs focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCancelSale}
                        disabled={loadingAction === 'cancel-sale'}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg cursor-pointer"
                      >
                        Confirm Return to Stock
                      </button>
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        className="px-2 py-1 bg-secondary text-muted-foreground rounded-lg cursor-pointer"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>Cancellation Locked:</strong> Vehicle is already handed over and delivered.
                </span>
              </div>
            )
          ) : (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
              <span>
                <strong>Sale Cancelled:</strong> This vehicle has been returned to Available inventory in the showroom.
              </span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-secondary/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
