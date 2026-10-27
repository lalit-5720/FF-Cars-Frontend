'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Building2,
  Wallet,
  Sparkles,
  Lock,
  ArrowRight,
  Loader2,
  CarFront,
  Percent,
  Check,
  AlertCircle,
  Receipt,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

interface VehicleReservationModalProps {
  car: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (sale: any) => void;
}

export function VehicleReservationModal({ car, isOpen, onClose, onSuccess }: VehicleReservationModalProps) {
  const router = useRouter();
  const { user } = useAuthStore();

  // Payment Type: 'PART_PAYMENT' (Bank Loan) vs 'FULL_PAYMENT' (Self-Financed)
  const [paymentMode, setPaymentMode] = useState<'PART_PAYMENT' | 'FULL_PAYMENT'>('PART_PAYMENT');
  
  // Down Payment percentage for Part Payment (Default 20%)
  const [downPaymentPct, setDownPaymentPct] = useState<number>(20);

  // Token Advance amount: default ₹50,000
  const [tokenAdvance, setTokenAdvance] = useState<number>(50000);

  // Selected Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'NET_BANKING' | 'CARD'>('UPI');
  const [upiId, setUpiId] = useState<string>('customer@okhdfcbank');
  
  // Loading & State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'CONFIGURE' | 'PROCESSING' | 'CONFIRMED'>('CONFIGURE');
  const [confirmedSale, setConfirmedSale] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !car) return null;

  const vehicleId = car.vehicle_id || car.id;
  const price = Number(car.price || 0);

  // Calculations
  const grossDownPayment = Math.round((price * downPaymentPct) / 100);
  const bankLoanAmount = Math.max(0, price - grossDownPayment);
  
  // Strict Dealership Requirement:
  // For Part Payment: Token advance is deducted from Down Payment amount only, loan untouched.
  const netDownPaymentDue = Math.max(0, grossDownPayment - tokenAdvance);

  // For Full Payment: Token advance is deducted from total selling price.
  const netFullPaymentDue = Math.max(0, price - tokenAdvance);

  const formatINR = (val: number) => `₹${Math.round(val || 0).toLocaleString('en-IN')}`;

  const handleProceedPayment = async () => {
    setErrorMessage(null);

    if (!user) {
      setErrorMessage('Please login to reserve this vehicle.');
      return;
    }

    if (tokenAdvance <= 0) {
      setErrorMessage('Please select a valid token advance amount.');
      return;
    }

    if (paymentMode === 'PART_PAYMENT' && tokenAdvance > grossDownPayment) {
      setErrorMessage('Token advance cannot exceed total down payment amount.');
      return;
    }

    setIsSubmitting(true);
    setStep('PROCESSING');

    try {
      // Simulate realistic payment processing latency
      await new Promise((resolve) => setTimeout(resolve, 1400));

      const isPart = paymentMode === 'PART_PAYMENT';
      const payload = {
        vehicle_id: vehicleId,
        branch_id: car.branch_id || car.branches?.branch_id || 1,
        selling_price: price,
        final_amount: price,
        deposit_amount: tokenAdvance,
        loan_amount: isPart ? bankLoanAmount : 0,
        payment_status: 'Partially Paid',
        payment_method: paymentMethod === 'UPI' ? `UPI (${upiId})` : paymentMethod === 'NET_BANKING' ? 'Net Banking' : 'Card Transfer',
        delivery_status: 'Pending',
        remarks: isPart
          ? `Part Payment: Token Advance ₹${tokenAdvance.toLocaleString('en-IN')} deducted from Down Payment of ₹${grossDownPayment.toLocaleString('en-IN')}. Net Down Payment Due: ₹${netDownPaymentDue.toLocaleString('en-IN')}. Bank Loan Principal: ₹${bankLoanAmount.toLocaleString('en-IN')}. [loan_status:Pending]`
          : `Full Payment: Token Advance ₹${tokenAdvance.toLocaleString('en-IN')} collected. Net Balance Remaining: ₹${netFullPaymentDue.toLocaleString('en-IN')}.`,
      };

      const res = await api.post('/sales', payload);
      const saleData = res.data;

      setConfirmedSale(saleData);
      setStep('CONFIRMED');

      if (onSuccess) {
        onSuccess(saleData);
      }
    } catch (err: any) {
      console.error('Reservation error:', err);
      setStep('CONFIGURE');
      setErrorMessage(err.response?.data?.message || 'Failed to complete reservation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-bg-surface border border-border rounded-lg shadow-xl overflow-hidden flex flex-col my-auto">
        
        {/* HEADER BAR */}
        <div className="p-4 sm:p-5 bg-bg-surface-alt border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-bg-surface border border-border flex items-center justify-center text-accent shrink-0">
              <CarFront className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-text-primary">
                  Reserve Vehicle (Token Advance)
                </h3>
                <span className="badge badge-info">
                  Instant Lock
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                {car.manufacture_year || car.year} {car.make} {car.model} &bull; <span className="text-accent font-bold">{formatINR(price)}</span>
              </p>
            </div>
          </div>

          {step !== 'PROCESSING' && (
            <button
              onClick={onClose}
              className="btn-neutral w-8 h-8 p-0 flex items-center justify-center rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* STEP 1: CONFIGURE PAYMENT BREAKDOWN */}
        {step === 'CONFIGURE' && (
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[75vh]">
            
            {/* PAYMENT MODE SELECTOR (Part Payment vs Full Payment) */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block mb-2">
                Select Your Payment Structure
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMode('PART_PAYMENT')}
                  className={`p-3 rounded-lg border text-left transition-colors cursor-pointer flex flex-col justify-between gap-1.5 ${
                    paymentMode === 'PART_PAYMENT'
                      ? 'bg-bg-surface-alt border-accent'
                      : 'bg-bg-surface border-border hover:bg-bg-surface-alt'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-accent" />
                      Part Payment (Financing)
                    </span>
                    {paymentMode === 'PART_PAYMENT' && <CheckCircle2 className="w-4 h-4 text-accent" />}
                  </div>
                  <span className="text-xs text-text-secondary">
                    Down Payment + Bank Loan (Token deducted from Down Payment)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('FULL_PAYMENT')}
                  className={`p-3 rounded-lg border text-left transition-colors cursor-pointer flex flex-col justify-between gap-1.5 ${
                    paymentMode === 'FULL_PAYMENT'
                      ? 'bg-bg-surface-alt border-accent'
                      : 'bg-bg-surface border-border hover:bg-bg-surface-alt'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-accent" />
                      Full Payment (Self-Financed)
                    </span>
                    {paymentMode === 'FULL_PAYMENT' && <CheckCircle2 className="w-4 h-4 text-accent" />}
                  </div>
                  <span className="text-xs text-text-secondary">
                    No Loan. Token deducted from vehicle selling price.
                  </span>
                </button>
              </div>
            </div>

            {/* PART PAYMENT OPTIONS (Down Payment Selector) */}
            {paymentMode === 'PART_PAYMENT' && (
              <div className="p-4 rounded-lg bg-bg-surface-alt border border-border space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-text-secondary">Choose Down Payment Percentage:</span>
                  <span className="text-accent font-bold text-sm">{downPaymentPct}% ({formatINR(grossDownPayment)})</span>
                </div>

                <div className="flex items-center gap-2">
                  {[15, 20, 25, 30, 40].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDownPaymentPct(pct)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        downPaymentPct === pct
                          ? 'btn-primary'
                          : 'btn-neutral'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TOKEN ADVANCE SELECTION */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block mb-2">
                Select Token Advance Amount (Deposit to Lock Vehicle)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[25000, 50000, 100000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTokenAdvance(amt)}
                    className={`p-3 rounded-lg border text-center transition-colors cursor-pointer ${
                      tokenAdvance === amt
                        ? 'bg-bg-surface-alt border-accent text-accent font-bold'
                        : 'bg-bg-surface border-border text-text-primary hover:bg-bg-surface-alt font-bold'
                    }`}
                  >
                    <div className="text-xs">{formatINR(amt)}</div>
                    <div className="text-xs text-text-secondary mt-0.5">
                      {amt === 50000 ? 'Recommended' : amt === 25000 ? 'Standard' : 'Priority Lock'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* STRICT FINANCIAL FORMULA BREAKDOWN */}
            <div className="p-4 rounded-lg bg-bg-surface-alt border border-border space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-accent" />
                  Transparent Financial Calculation
                </span>
                <span className="badge badge-success">
                  Verified Math
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-text-secondary">
                  <span>Vehicle Listing Price:</span>
                  <span className="font-bold text-text-primary">{formatINR(price)}</span>
                </div>

                {paymentMode === 'PART_PAYMENT' ? (
                  <>
                    <div className="flex justify-between text-text-secondary">
                      <span>Total Down Payment ({downPaymentPct}%):</span>
                      <span className="font-bold text-accent">{formatINR(grossDownPayment)}</span>
                    </div>

                    <div className="flex justify-between text-status-success font-bold bg-bg-surface p-2 rounded-lg border border-border">
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Token Advance Paid Now:
                      </span>
                      <span>-{formatINR(tokenAdvance)}</span>
                    </div>

                    <div className="flex justify-between text-text-primary font-bold pt-1">
                      <span>Net Remaining Down Payment (due at delivery):</span>
                      <span className="text-accent text-sm">{formatINR(netDownPaymentDue)}</span>
                    </div>

                    <div className="flex justify-between text-text-secondary font-bold pt-1 border-t border-border">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-accent" /> Bank Loan Principal (Untouched):
                      </span>
                      <span className="text-text-primary text-sm">{formatINR(bankLoanAmount)}</span>
                    </div>

                    {/* Explanatory callout for strict prompt requirement */}
                    <div className="p-3 rounded-lg bg-bg-surface border border-border text-xs text-text-secondary leading-normal flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <div>
                        <strong>Down Payment Deduction Applied:</strong> The token advance of {formatINR(tokenAdvance)} is directly subtracted from your Down Payment ({formatINR(grossDownPayment)} - {formatINR(tokenAdvance)} = {formatINR(netDownPaymentDue)}). Your bank loan principal of {formatINR(bankLoanAmount)} remains completely untouched.
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-status-success font-bold bg-bg-surface p-2 rounded-lg border border-border">
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Token Advance Paid Now:
                      </span>
                      <span>-{formatINR(tokenAdvance)}</span>
                    </div>

                    <div className="flex justify-between text-text-primary font-bold pt-1">
                      <span>Net Remaining Balance (due at vehicle delivery):</span>
                      <span className="text-accent text-sm">{formatINR(netFullPaymentDue)}</span>
                    </div>

                    <div className="p-3 rounded-lg bg-bg-surface border border-border text-xs text-text-secondary leading-normal flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <div>
                        <strong>Full Payment Reduction:</strong> The token advance of {formatINR(tokenAdvance)} is deducted directly from the vehicle price. The remaining balance of {formatINR(netFullPaymentDue)} is settled before delivery.
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* PAYMENT METHOD SELECTION */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block mb-2">
                Select Instant Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`py-2 px-3 rounded-lg border font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    paymentMethod === 'UPI'
                      ? 'btn-primary'
                      : 'btn-neutral'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> UPI Instant
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('NET_BANKING')}
                  className={`py-2 px-3 rounded-lg border font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    paymentMethod === 'NET_BANKING'
                      ? 'btn-primary'
                      : 'btn-neutral'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" /> NetBanking
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`py-2 px-3 rounded-lg border font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    paymentMethod === 'CARD'
                      ? 'btn-primary'
                      : 'btn-neutral'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" /> Credit/Debit
                </button>
              </div>

              {paymentMethod === 'UPI' && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="Enter UPI VPA (e.g. mobile@upi)"
                    className="input-base w-full text-xs h-9"
                  />
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-bg-surface-alt border border-status-danger text-status-danger text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-status-danger shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: PROCESSING SIMULATION */}
        {step === 'PROCESSING' && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-lg bg-bg-surface-alt border border-border flex items-center justify-center text-accent">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <h4 className="text-base font-bold text-text-primary">Processing Token Advance...</h4>
            <p className="text-xs text-text-secondary max-w-sm">
              Authorizing {formatINR(tokenAdvance)} deposit via {paymentMethod}. Locking {car.make} {car.model} into showroom reservation status.
            </p>
          </div>
        )}

        {/* STEP 3: CONFIRMED RESERVATION CERTIFICATE */}
        {step === 'CONFIRMED' && confirmedSale && (
          <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-lg bg-bg-surface-alt border border-border text-status-success flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <span className="badge badge-success">
                Vehicle Status: Reserved
              </span>
              <h3 className="text-lg font-bold text-text-primary mt-2">
                Token Advance Received &amp; Car Locked!
              </h3>
              <p className="text-xs text-text-secondary mt-1 max-w-md">
                Reservation #{confirmedSale.sale_id} confirmed. {car.make} {car.model} has been marked as <strong>Reserved</strong> across showroom systems.
              </p>
            </div>

            {/* Official Summary Pill */}
            <div className="w-full p-4 rounded-lg bg-bg-surface-alt border border-border text-left text-xs space-y-2">
              <div className="flex justify-between text-text-secondary">
                <span>Deposit Amount Paid:</span>
                <span className="font-bold text-status-success">{formatINR(confirmedSale.deposit_amount || tokenAdvance)}</span>
              </div>
              {confirmedSale.is_loan_deal ? (
                <>
                  <div className="flex justify-between text-text-secondary">
                    <span>Remaining Down Payment:</span>
                    <span className="font-bold text-accent">{formatINR(netDownPaymentDue)}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Bank Loan Principal:</span>
                    <span className="font-bold text-text-primary">{formatINR(bankLoanAmount)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-text-secondary">
                  <span>Balance Due at Delivery:</span>
                  <span className="font-bold text-status-success">{formatINR(netFullPaymentDue)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={onClose}
                className="btn-neutral flex-1 h-9 text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push('/dashboard?tab=purchases');
                }}
                className="btn-primary flex-1 h-9 text-xs flex items-center justify-center gap-1"
              >
                <span>View My Purchases &rarr;</span>
              </button>
            </div>
          </div>
        )}

        {/* FOOTER ACTION BAR (In Configure Step) */}
        {step === 'CONFIGURE' && (
          <div className="p-4 sm:p-5 bg-bg-surface-alt border-t border-border flex items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase font-bold text-text-secondary block">Token Advance Deposit</span>
              <span className="text-base font-bold text-accent">{formatINR(tokenAdvance)}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-neutral text-xs h-9 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedPayment}
                disabled={isSubmitting}
                className="btn-primary text-xs h-9 px-4 flex items-center gap-2 disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Pay Token &amp; Reserve Vehicle</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
