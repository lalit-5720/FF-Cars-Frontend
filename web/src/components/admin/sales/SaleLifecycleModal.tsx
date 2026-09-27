'use client';

import React, { useState } from 'react';
import { api } from '../../../services/api';
import { showLocalToast } from '../../Toast';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  Landmark, 
  Truck, 
  ShieldCheck, 
  AlertTriangle, 
  Percent, 
  Car, 
  User, 
  Ban,
  Calendar
} from 'lucide-react';

interface SaleLifecycleModalProps {
  sale: any;
  isOpen: boolean;
  onClose: () => void;
  onSaleUpdated: () => void;
}

export function SaleLifecycleModal({ sale, isOpen, onClose, onSaleUpdated }: SaleLifecycleModalProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('Customer decided not to proceed');
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen || !sale) return null;

  const isLoanDeal = Number(sale.loan_amount || 0) > 0;
  const isPaid = (sale.payment_status || '').toLowerCase() === 'paid';
  const isCancelled = (sale.payment_status || '').toLowerCase().includes('cancel');
  const isLoanApproved = sale.loan_status === 'Approved' || (isLoanDeal && isPaid);
  const isDelivered = (sale.delivery_status || '').toLowerCase().includes('deliver');
  const isScheduled = (sale.delivery_status || '').toLowerCase().includes('schedule');

  const finalAmount = Number(sale.final_amount ?? sale.selling_price ?? 0);
  const depositAmount = Number(sale.deposit_amount ?? 0);
  const loanAmount = Number(sale.loan_amount ?? 0);
  const bankCommission = sale.bank_commission_amount || Math.round(loanAmount * 0.02);

  // Stages Active (1 to 4)
  let currentStep = 1;
  if (isCancelled) {
    currentStep = 0; // Cancelled
  } else if (isLoanDeal) {
    if (isDelivered) currentStep = 4;
    else if (isScheduled) currentStep = 4;
    else if (isLoanApproved) currentStep = 3;
    else currentStep = 2;
  } else {
    currentStep = isDelivered ? 4 : isPaid ? 3 : 1;
  }

  const formatCurrency = (val: number) => `₹${Math.round(val || 0).toLocaleString('en-IN')}`;

  const handleApproveLoan = async () => {
    setLoadingAction('approve-loan');
    try {
      await api.post(`/sales/${sale.sale_id}/approve-loan`);
      showLocalToast('Bank Loan Approved! 2% extra profit added.', 'success');
      onSaleUpdated();
      onClose();
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to approve loan', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleMarkFullPaid = async () => {
    setLoadingAction('mark-paid');
    try {
      await api.post(`/sales/${sale.sale_id}/mark-paid`);
      showLocalToast('Sale marked fully paid!', 'success');
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
      await api.post(`/sales/${sale.sale_id}/move-to-delivery`, { delivery_date: deliveryDate });
      showLocalToast('Delivery scheduled! Vehicle marked Sold.', 'success');
      onSaleUpdated();
      onClose();
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to schedule delivery', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCancelSale = async () => {
    setLoadingAction('cancel-sale');
    try {
      await api.post(`/sales/${sale.sale_id}/cancel`, { reason: cancelReason });
      showLocalToast('Purchase Cancelled! Vehicle released back to showroom inventory.', 'success');
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
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-foreground font-display">
                  {sale.vehicles?.make} {sale.vehicles?.model}
                </h2>
                <span className="text-xs font-mono font-bold text-sky-400">
                  #CR-{sale.sale_id}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <User size={13} className="text-emerald-400" />
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
              : isLoanApproved
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            <div className="flex items-center gap-3">
              {isCancelled ? (
                <Ban className="w-6 h-6 text-rose-400 shrink-0" />
              ) : isDelivered ? (
                <Truck className="w-6 h-6 text-sky-400 shrink-0" />
              ) : isLoanApproved ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : (
                <Clock className="w-6 h-6 text-amber-400 shrink-0" />
              )}
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider opacity-80 block">
                  Current Status
                </span>
                <span className="text-base font-extrabold block">
                  {isCancelled
                    ? 'Sale Cancelled & Car Returned to Showroom'
                    : isDelivered
                    ? 'Step 4: Car Handed Over to Customer (Sold)'
                    : isLoanApproved
                    ? 'Step 3: Bank Approved! Ready for Delivery'
                    : isLoanDeal
                    ? 'Step 2: Customer Paid Down Payment &bull; Waiting for Bank'
                    : '100% Cash Paid Upfront'}
                </span>
              </div>
            </div>
          </div>

          {/* MONEY BREAKDOWN CARD */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border">
            <h4 className="font-extrabold text-foreground mb-3 font-display uppercase tracking-wider text-[11px]">
              Payment Breakdown (Simple &amp; Clear)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-muted-foreground text-[11px] block">Car Total Price</span>
                <span className="text-foreground font-mono font-extrabold text-base block mt-0.5">
                  {formatCurrency(finalAmount)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground text-[11px] block">Customer Paid (Deposit)</span>
                <span className="text-emerald-400 font-mono font-extrabold text-base block mt-0.5">
                  {formatCurrency(depositAmount)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground text-[11px] block">Bank Loan Amount</span>
                <span className="text-amber-400 font-mono font-extrabold text-base block mt-0.5">
                  {isLoanDeal ? formatCurrency(loanAmount) : '₹0 (Full Cash)'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground text-[11px] block">Showroom 2% Bonus</span>
                <span className="text-amber-400 font-mono font-extrabold text-base block mt-0.5">
                  {isLoanDeal && !isCancelled ? `+${formatCurrency(bankCommission)}` : '—'}
                </span>
              </div>
            </div>

            {isLoanDeal && !isCancelled && (
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                  <Percent size={13} /> 2% of ₹{loanAmount.toLocaleString('en-IN')} is paid directly by the bank as dealer revenue.
                </span>
                <span className="font-bold text-emerald-400">Extra Dealer Profit</span>
              </div>
            )}
          </div>

          {/* STEP-BY-STEP CHECKLIST */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-3">
            <h4 className="font-extrabold text-foreground font-display uppercase tracking-wider text-[11px]">
              Simple 4-Step Checklist
            </h4>

            {/* Step 1 */}
            <div className="p-3.5 rounded-xl bg-secondary/30 border border-emerald-500/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                  ✓
                </div>
                <div>
                  <strong className="text-foreground block text-xs">Step 1: Down Payment Collected</strong>
                  <span className="text-muted-foreground text-[11px]">
                    Customer paid {formatCurrency(depositAmount)}. Vehicle was reserved.
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                Complete
              </span>
            </div>

            {/* Step 2 (Loan Review) */}
            {isLoanDeal && (
              <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                isLoanApproved
                  ? 'bg-secondary/30 border-emerald-500/20'
                  : 'bg-amber-500/5 border-amber-500/30'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    isLoanApproved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {isLoanApproved ? '✓' : '2'}
                  </div>
                  <div>
                    <strong className="text-foreground block text-xs">Step 2: Bank Loan Review</strong>
                    <span className="text-muted-foreground text-[11px]">
                      {isLoanApproved
                        ? `Bank reviewed and approved loan of ${formatCurrency(loanAmount)}.`
                        : `Bank partner is currently reviewing customer loan papers.`}
                    </span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  isLoanApproved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {isLoanApproved ? 'Verified' : 'Waiting for Bank'}
                </span>
              </div>
            )}

            {/* Step 3 (Loan Approval) */}
            {isLoanDeal && (
              <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                isLoanApproved
                  ? 'bg-secondary/30 border-emerald-500/20'
                  : 'bg-secondary/20 border-border'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    isLoanApproved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {isLoanApproved ? '✓' : '3'}
                  </div>
                  <div>
                    <strong className="text-foreground block text-xs">Step 3: Bank Sanction &amp; Approval</strong>
                    <span className="text-muted-foreground text-[11px]">
                      {isLoanApproved
                        ? 'Funds disbursed by bank. Deal is 100% paid and locked.'
                        : 'Confirm approval once the bank issues sanction letter.'}
                    </span>
                  </div>
                </div>

                {!isLoanApproved && !isCancelled ? (
                  <button
                    onClick={handleApproveLoan}
                    disabled={loadingAction === 'approve-loan'}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-lg transition-colors cursor-pointer shadow flex items-center gap-1 shrink-0"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Approve Loan Now</span>
                  </button>
                ) : isLoanApproved ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                    Sanctioned
                  </span>
                ) : null}
              </div>
            )}

            {/* Step 4 (Delivery) */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
              isDelivered
                ? 'bg-secondary/30 border-sky-500/20'
                : isLoanApproved
                ? 'bg-sky-500/5 border-sky-500/30'
                : 'bg-secondary/20 border-border opacity-70'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  isDelivered ? 'bg-sky-500/20 text-sky-400' : 'bg-secondary text-muted-foreground'
                }`}>
                  {isDelivered ? '✓' : '4'}
                </div>
                <div>
                  <strong className="text-foreground block text-xs">Step 4: Vehicle Delivery Handover</strong>
                  <span className="text-muted-foreground text-[11px]">
                    {isDelivered
                      ? 'Car keys handed over to customer. Marked as Sold.'
                      : isScheduled
                      ? `Delivery scheduled for ${new Date(sale.delivery_date || Date.now()).toLocaleDateString()}.`
                      : 'Schedule handover once car is ready.'}
                  </span>
                </div>
              </div>

              {!isDelivered && !isScheduled && isLoanApproved && !isCancelled && !showDeliveryForm ? (
                <button
                  onClick={() => setShowDeliveryForm(true)}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-lg transition-colors cursor-pointer shadow flex items-center gap-1 shrink-0"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Deliver Car</span>
                </button>
              ) : isDelivered ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/10 text-sky-400">
                  Delivered
                </span>
              ) : null}
            </div>

            {/* Quick Delivery Date Form */}
            {showDeliveryForm && (
              <div className="p-3 rounded-xl bg-secondary/50 border border-sky-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-400" />
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

          {/* CANCELLATION BOX (PLAIN ENGLISH) */}
          {!isCancelled ? (
            sale.can_cancel ? (
              <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Customer Changed Mind? (Cancellation Permitted)</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    You can cancel this sale before bank approval. The car will automatically be released back to the showroom.
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
                      value={cancelReason}
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
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Cancellation Locked:</strong> Bank loan is approved and agreement is executed. This car cannot be cancelled.
                </span>
              </div>
            )
          ) : (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-400 shrink-0" />
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
