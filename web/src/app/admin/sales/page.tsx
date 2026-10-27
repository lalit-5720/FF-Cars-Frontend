'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../services/api';
import { usePermissions } from '../../../hooks/usePermissions';
import { RequireRole } from '../../../components/auth/RequireRole';
import { showLocalToast } from '../../../components/Toast';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  PieChart, 
  Landmark, 
  Percent, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  Clock, 
  CheckCircle2, 
  Ban, 
  Car, 
  User, 
  AlertTriangle, 
  HelpCircle,
  ChevronDown,
  ChevronUp,
  X,
  DollarSign,
  IndianRupee,
  Lock,
} from 'lucide-react';
import { RevenueBreakdownModal } from '../../../components/admin/bi/RevenueBreakdownModal';
import { SaleLifecycleModal } from '../../../components/admin/sales/SaleLifecycleModal';
import { TokenAdvancePaymentModal } from '../../../components/admin/sales/TokenAdvancePaymentModal';
import { PaymentVerificationModal } from '../../../components/admin/sales/PaymentVerificationModal';

export default function SalesPage() {
  const router = useRouter();
  const permissions = usePermissions();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<'ALL' | 'WAITING_BANK' | 'PENDING_BALANCE' | 'READY_DELIVERY' | 'DELIVERED' | 'CANCELLED'>('ALL');
  const [showHowItWorks, setShowHowItWorks] = useState(true);

  // Modals state
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [selectedSaleForLifecycle, setSelectedSaleForLifecycle] = useState<any | null>(null);
  const [saleForTokenAdvance, setSaleForTokenAdvance] = useState<any | null>(null);
  const [saleForPaymentVerification, setSaleForPaymentVerification] = useState<any | null>(null);

  // Open Payment Verification Screen (Store official UTR & instrument details)
  const handleDirectCollectBalance = (s: any) => {
    setSaleForPaymentVerification(s);
  };

  // Quick Action Dialogs state
  const [saleToApprove, setSaleToApprove] = useState<any | null>(null);
  const [saleToCancel, setSaleToCancel] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('Customer decided not to proceed');
  const [saleToDeliver, setSaleToDeliver] = useState<any | null>(null);
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [actionLoading, setActionLoading] = useState(false);

  // Create Sale Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [availableCars, setAvailableCars] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [creatingSale, setCreatingSale] = useState(false);
  const [createForm, setCreateForm] = useState({
    customerId: '',
    vehicleId: '',
    sellingPrice: 0,
    paymentType: 'LOAN' as 'FULL' | 'LOAN',
    tokenAdvance: 50000,
    requiredDownPayment: 0,
    loanAmount: 0,
    fullUpfront: false, // For cash purchases: true if paying 100% upfront, false if paying token advance
  });

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales');
      setSales(res.data);
    } catch (err) {
      showLocalToast('Failed to load sales records.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCreateDependencies = async () => {
    try {
      const [carsRes, custRes] = await Promise.all([
        api.get('/vehicles?status=Available'),
        api.get('/customers').catch(() => ({ data: [] })),
      ]);
      const carList = Array.isArray(carsRes.data) ? carsRes.data : (carsRes.data?.data || []);
      const custList = Array.isArray(custRes.data) ? custRes.data : (custRes.data?.data || []);
      setAvailableCars(carList);
      setCustomers(custList);
    } catch (err) {
      console.warn('Failed to load dependencies for sale creation', err);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const openCreateModal = async () => {
    await fetchCreateDependencies();
    setIsCreateModalOpen(true);
  };

  const handleSelectCar = (carId: string) => {
    const selected = availableCars.find(c => String(c.vehicle_id || c.id) === carId);
    const price = selected ? Number(selected.price || 0) : 0;
    const defaultToken = Math.min(50000, price);
    const defaultDown = Math.round(price * 0.2); // Default 20% down payment
    setCreateForm(prev => ({
      ...prev,
      vehicleId: carId,
      sellingPrice: price,
      tokenAdvance: defaultToken,
      requiredDownPayment: defaultDown,
      loanAmount: Math.max(0, price - defaultDown),
    }));
  };

  const handleCreateSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.vehicleId) {
      showLocalToast('Please select an available vehicle');
      return;
    }

    setCreatingSale(true);
    try {
      const isLoan = createForm.paymentType === 'LOAN';
      const price = Number(createForm.sellingPrice);
      const isFullCash = !isLoan && createForm.fullUpfront;
      const token = isFullCash ? price : Number(createForm.tokenAdvance);
      const downPayment = isLoan ? Number(createForm.requiredDownPayment) : 0;
      const loanAmt = isLoan ? Math.max(0, price - downPayment) : 0;

      const payload = {
        customer_id: createForm.customerId ? Number(createForm.customerId) : 1,
        vehicle_id: Number(createForm.vehicleId),
        selling_price: price,
        final_amount: price,
        token_advance: token,
        deposit_amount: token,
        down_payment: downPayment,
        loan_amount: loanAmt,
        payment_status: isFullCash ? 'Paid' : 'Token Received',
        delivery_status: 'Pending',
        remarks: isLoan
          ? `Loan Deal: Token Advance ₹${token.toLocaleString('en-IN')} credited toward Down Payment of ₹${downPayment.toLocaleString('en-IN')}. [loan_status:Pending]`
          : isFullCash
            ? 'Full Cash Upfront Sale'
            : `Cash Deal: Token Advance ₹${token.toLocaleString('en-IN')} received. Remaining balance ₹${(price - token).toLocaleString('en-IN')} pending.`,
      };

      await api.post('/sales', payload);
      showLocalToast('Car sale contract created & vehicle reserved!', 'success');
      setIsCreateModalOpen(false);
      await fetchSales();
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to create sale contract', 'error');
    } finally {
      setCreatingSale(false);
    }
  };

  // --- QUICK ACTION: APPROVE BANK LOAN ---
  const confirmApproveLoan = async () => {
    if (!saleToApprove) return;
    setActionLoading(true);
    try {
      await api.post(`/sales/${saleToApprove.sale_id}/approve-loan`);
      showLocalToast(`Bank Loan Approved for ${saleToApprove.vehicles?.make || 'Vehicle'}! 2% bonus recorded.`, 'success');
      setSaleToApprove(null);
      await fetchSales();
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to approve loan', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // --- QUICK ACTION: CANCEL DEAL & RELEASE VEHICLE ---
  const confirmCancelDeal = async () => {
    if (!saleToCancel) return;
    setActionLoading(true);
    try {
      await api.post(`/sales/${saleToCancel.sale_id}/cancel`, { reason: cancelReason });
      showLocalToast(`Sale Cancelled. Car is now Available in showroom!`, 'success');
      setSaleToCancel(null);
      await fetchSales();
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to cancel deal', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // --- QUICK ACTION: MOVE TO DELIVERY ---
  const confirmMoveToDelivery = async () => {
    if (!saleToDeliver) return;
    setActionLoading(true);
    try {
      await api.post(`/sales/${saleToDeliver.sale_id}/move-to-delivery`, { delivery_date: deliveryDate });
      showLocalToast(`Delivery scheduled! Navigating to Deliveries handover hub...`, 'success');
      setSaleToDeliver(null);
      await fetchSales();
      router.push('/admin/deliveries');
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to schedule delivery', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Format INR Currency
  const formatCurrency = (val?: number) => `₹${Math.round(val || 0).toLocaleString('en-IN')}`;

  // Segregated calculations for counts and badges
  const totalBankCommission = sales
    .filter(s => !(s.payment_status || '').toLowerCase().includes('cancel'))
    .reduce((sum, s) => sum + (s.bank_commission_amount || (Number(s.loan_amount || 0) > 0 ? Math.round(Number(s.loan_amount) * 0.02) : 0)), 0);

  const waitingBankSales = sales.filter(s => {
    const isLoan = Number(s.loan_amount || 0) > 0;
    const isCancelled = (s.payment_status || '').toLowerCase().includes('cancel');
    const isDisbursed = s.is_loan_disbursed || (s.loan_status === 'Approved' && (s.payment_status || '').toLowerCase() === 'paid');
    return isLoan && !isCancelled && !isDisbursed;
  });

  const pendingBalanceSales = sales.filter(s => {
    const isLoan = Number(s.loan_amount || 0) > 0;
    const isCancelled = (s.payment_status || '').toLowerCase().includes('cancel');
    const isPaid = (s.payment_status || '').toLowerCase() === 'paid';
    const finalAmt = Number(s.final_amount || s.selling_price || 0);
    const totalPaid = Number(s.total_amount_paid ?? s.total_paid ?? s.deposit_amount ?? 0);
    const bal = typeof s.outstanding_balance === 'number' ? s.outstanding_balance : (finalAmt - totalPaid);
    return !isLoan && !isCancelled && !isPaid && bal > 0;
  });

  const readyDeliverySales = sales.filter(s => {
    const isLoan = Number(s.loan_amount || 0) > 0;
    const isCancelled = (s.payment_status || '').toLowerCase().includes('cancel');
    const isDelivered = (s.delivery_status || '').toLowerCase().includes('deliver') || (s.delivery_status || '').toLowerCase().includes('schedule');
    const isPaid = (s.payment_status || '').toLowerCase() === 'paid';
    const finalAmt = Number(s.final_amount || s.selling_price || 0);
    const totalPaid = Number(s.total_amount_paid ?? s.total_paid ?? s.deposit_amount ?? 0);
    const isLoanCleared = s.is_loan_disbursed || (s.loan_status === 'Approved' && isPaid);
    const isCashCleared = isPaid || totalPaid >= finalAmt;
    const isFinanciallyCleared = isLoan ? isLoanCleared : isCashCleared;
    return !isCancelled && isFinanciallyCleared && !isDelivered;
  });

  const deliveredSales = sales.filter(s => {
    const isCancelled = (s.payment_status || '').toLowerCase().includes('cancel');
    const isDelivered = (s.delivery_status || '').toLowerCase().includes('deliver') || (s.delivery_status || '').toLowerCase().includes('schedule');
    return !isCancelled && isDelivered;
  });

  const cancelledSales = sales.filter(s => (s.payment_status || '').toLowerCase().includes('cancel'));

  // Filtered sales
  const filteredSales = sales.filter(s => {
    const isLoan = Number(s.loan_amount || 0) > 0;
    const finalAmt = Number(s.final_amount || s.selling_price || 0);
    const totalPaid = Number(s.total_amount_paid ?? s.total_paid ?? s.deposit_amount ?? 0);
    const isCancelled = (s.payment_status || '').toLowerCase().includes('cancel');
    const isPaid = (s.payment_status || '').toLowerCase() === 'paid' || (!isLoan && totalPaid >= finalAmt);
    const isLoanCleared = s.is_loan_disbursed || (s.loan_status === 'Approved' && isPaid);
    const isDelivered = (s.delivery_status || '').toLowerCase().includes('deliver') || (s.delivery_status || '').toLowerCase().includes('schedule');
    const isFinanciallyCleared = isLoan ? isLoanCleared : isPaid;

    if (stageFilter === 'WAITING_BANK' && (!isLoan || isCancelled || isLoanCleared)) return false;
    if (stageFilter === 'PENDING_BALANCE' && (isLoan || isCancelled || isPaid || totalPaid >= finalAmt)) return false;
    if (stageFilter === 'READY_DELIVERY' && (isCancelled || !isFinanciallyCleared || isDelivered)) return false;
    if (stageFilter === 'DELIVERED' && (isCancelled || !isDelivered)) return false;
    if (stageFilter === 'CANCELLED' && !isCancelled) return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.customers?.first_name?.toLowerCase().includes(term) ||
      s.customers?.last_name?.toLowerCase().includes(term) ||
      s.vehicles?.make?.toLowerCase().includes(term) ||
      s.vehicles?.model?.toLowerCase().includes(term) ||
      String(s.sale_id).includes(term)
    );
  });

  return (
    <RequireRole allow={['SYSTEM_ADMIN', 'BRANCH_MANAGER']}>
      <div className="space-y-5 font-sans pb-12">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border p-5 rounded-2xl shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-500/20">
                Simple Deal Tracker
              </span>
              <span className="text-xs text-muted-foreground font-semibold">
                {sales.length} Total Showroom Contracts
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2 mt-1 font-display">
              <TrendingUp className="w-6 h-6 text-emerald-400" /> Car Sales &amp; Easy 4-Step Loan Manager
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Easily track any car purchase step-by-step: Down Payment &rarr; Bank Check &rarr; Loan Approval &rarr; Hand Over Car
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsBreakdownOpen(true)}
              className="px-3.5 py-2 bg-secondary hover:bg-secondary/80 text-foreground border border-border font-bold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <PieChart className="w-4 h-4 text-emerald-400" /> Revenue Split (Cash vs Loan)
            </button>

            {permissions.canManageSales && (
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md hover:scale-105"
              >
                <Plus className="w-4 h-4" /> New Sale Contract
              </button>
            )}
          </div>
        </div>

        {/* HOW IT WORKS IN 4 SIMPLE STEPS - COLLAPSIBLE BANNER */}
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm overflow-hidden shadow-sm">
          <div 
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="p-4 bg-secondary/30 flex items-center justify-between cursor-pointer select-none hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <span className="font-extrabold text-xs text-foreground uppercase tracking-wider font-display">
                How Car Sales Work (Simple 4-Step Guide)
              </span>
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                &bull; Click to {showHowItWorks ? 'hide' : 'show'} explanation
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              {showHowItWorks ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>

          {showHowItWorks && (
            <div className="p-4 sm:p-5 border-t border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Step 1 */}
              <div className="p-3.5 rounded-xl bg-secondary/40 border border-emerald-500/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-1">
                    <span>Step 1: Down Payment</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-foreground font-semibold">Customer pays token deposit</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    The car is marked <strong>Reserved</strong> so no other customer can book it.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mt-3">
                  ✓ Token in Hand
                </span>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-xl bg-secondary/40 border border-amber-500/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-1">
                    <span>Step 2: Bank Check</span>
                    <Clock className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-foreground font-semibold">Bank reviews loan papers</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Buyer can still cancel if needed. If cancelled, the car goes right back to the showroom.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mt-3">
                  ⏳ Underwriting Review
                </span>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 rounded-xl bg-secondary/40 border border-blue-500/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-blue-400 mb-1">
                    <span>Step 3: Bank Approved!</span>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-foreground font-semibold">Bank sends money to showroom</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Deal is 100% paid. <strong>Cancellation is locked</strong> to protect bank agreement.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mt-3">
                  🔒 Locked &amp; Settled
                </span>
              </div>

              {/* Step 4 */}
              <div className="p-3.5 rounded-xl bg-secondary/40 border border-sky-500/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-sky-400 mb-1">
                    <span>Step 4: Car Handover</span>
                    <Truck className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-foreground font-semibold">Customer gets keys &amp; drives away</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Vehicle status is updated to <strong>Sold</strong>. The deal is complete!
                  </p>
                </div>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mt-3">
                  🏁 Delivery Done
                </span>
              </div>

              {/* 2% Bonus & Cancellation Tip strip */}
              <div className="col-span-1 sm:col-span-2 lg:col-span-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <Percent className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Showroom 2% Bank Bonus: For every loan deal, your showroom receives 2% of the loan directly from the bank as extra profit!
                  </span>
                </div>
                <span className="text-[11px] font-mono font-extrabold text-amber-400 shrink-0">
                  Total Earned: {formatCurrency(totalBankCommission)}
                </span>
              </div>

            </div>
          )}
        </div>

        {/* INTERACTIVE STAGE FILTER BUTTONS (ACTION-ORIENTED) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setStageFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                stageFilter === 'ALL'
                  ? 'bg-secondary text-foreground border border-border shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Deals ({sales.length})
            </button>

            <button
              onClick={() => setStageFilter('WAITING_BANK')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                stageFilter === 'WAITING_BANK'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                  : 'text-muted-foreground hover:text-amber-400'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Step 2: Waiting for Bank ({waitingBankSales.length})</span>
              {waitingBankSales.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setStageFilter('PENDING_BALANCE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                stageFilter === 'PENDING_BALANCE'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                  : 'text-muted-foreground hover:text-amber-400'
              }`}
            >
              <IndianRupee className="w-3.5 h-3.5" />
              <span>Step 2: Pending Balance ({pendingBalanceSales.length})</span>
              {pendingBalanceSales.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setStageFilter('READY_DELIVERY')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                stageFilter === 'READY_DELIVERY'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-muted-foreground hover:text-emerald-400'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Step 3: Ready to Deliver ({readyDeliverySales.length})</span>
            </button>

            <button
              onClick={() => setStageFilter('DELIVERED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                stageFilter === 'DELIVERED'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Delivered ({deliveredSales.length})
            </button>

            <button
              onClick={() => setStageFilter('CANCELLED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                stageFilter === 'CANCELLED'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Cancelled ({cancelledSales.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search car, customer, deal #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-secondary/40 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/50"
            />
          </div>

        </div>

        {/* DEALS LIST / TABLE */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 border-b border-border text-[10px] uppercase font-bold text-muted-foreground">
                <tr>
                  <th className="py-3 px-4">Deal ID</th>
                  <th className="py-3 px-4">Car Details</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Car Price &amp; Payment</th>
                  <th className="py-3 px-4">Showroom 2% Bonus</th>
                  <th className="py-3 px-4">Current Step</th>
                  <th className="py-3 px-4 text-right">What To Do Next (Action)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      Loading car deals...
                    </td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No car sales found for this filter.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((s) => {
                    const isLoan = Number(s.loan_amount || 0) > 0;
                    const finalAmt = Number(s.final_amount || s.selling_price || 0);
                    const tokenAmt = Number(s.token_advance ?? s.token_advance_amount ?? s.deposit_amount ?? 0);
                    const totalPaid = Number(s.total_amount_paid ?? s.total_paid ?? tokenAmt);
                    const loanAmt = Number(s.loan_amount || 0);
                    const reqDown = Number(s.required_down_payment ?? (isLoan ? Math.max(0, finalAmt - loanAmt) : 0));
                    const remDown = Number(s.remaining_down_payment ?? Math.max(0, reqDown - tokenAmt));
                    const balanceDue = typeof s.outstanding_balance === 'number'
                      ? s.outstanding_balance
                      : Math.max(0, finalAmt - totalPaid);
                    const commission = s.bank_commission_amount || (isLoan ? Math.round(loanAmt * 0.02) : 0);
                    const isCancelled = (s.payment_status || '').toLowerCase().includes('cancel');
                    const isPaid = (s.payment_status || '').toLowerCase() === 'paid' || (!isLoan && balanceDue === 0 && totalPaid >= finalAmt);
                    const isLoanApproved = s.loan_status === 'Approved';
                    const isLoanDisbursed = s.is_loan_disbursed || (isLoanApproved && isPaid);
                    const isDelivered = (s.delivery_status || '').toLowerCase().includes('deliver');
                    const isScheduled = (s.delivery_status || '').toLowerCase().includes('schedule');
                    const isStage2Complete = isLoan ? isLoanDisbursed : (isPaid || balanceDue === 0);
                    const canCancel = s.can_cancel && !isCancelled && !isStage2Complete;

                    return (
                      <tr key={s.sale_id} className="hover:bg-secondary/30 transition-colors">
                        
                        {/* Deal ID */}
                        <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                          #CR-{s.sale_id}
                        </td>

                        {/* Car Details */}
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-foreground flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span>{s.vehicles ? `${s.vehicles.make} ${s.vehicles.model}` : `Vehicle #${s.vehicle_id}`}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground ml-5">
                            {s.vehicles?.fuel_type || 'Petrol'} &bull; {s.branches?.branch_name || 'Showroom'}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-foreground flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{s.customers ? `${s.customers.first_name} ${s.customers.last_name || ''}` : `Customer #${s.customer_id}`}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground ml-5">
                            {s.customers?.phone || 'Walk-in'}
                          </div>
                        </td>

                        {/* Price & Payment */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-extrabold text-foreground text-sm">
                            {formatCurrency(finalAmt)}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {isLoan ? (
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">Token:</span>
                                  <strong className="text-emerald-400 font-mono">{formatCurrency(tokenAmt)}</strong>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">Down Req:</span>
                                  <span className="font-mono font-bold text-foreground">{formatCurrency(reqDown)}</span>
                                  {remDown > 0 ? (
                                    <span className="text-amber-400 font-mono text-[9px] font-bold">
                                      (Due: {formatCurrency(remDown)})
                                    </span>
                                  ) : (
                                    <span className="text-emerald-400 text-[9px] font-bold">✓ Met</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">Loan:</span>
                                  <strong className="text-sky-400 font-mono">{formatCurrency(loanAmt)}</strong>
                                  {isLoanDisbursed && <span className="text-emerald-400 text-[9px] font-bold">✓ Disbursed</span>}
                                </div>
                                <div className="text-[9px] text-slate-400 border-t border-border/50 pt-0.5 mt-0.5">
                                  Total Paid: <strong className="text-emerald-400 font-mono">{formatCurrency(totalPaid)}</strong>
                                  {balanceDue > 0 && <span className="text-rose-400 font-mono ml-1 font-bold">Due: {formatCurrency(balanceDue)}</span>}
                                </div>
                              </div>
                            ) : isPaid || balanceDue === 0 ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 size={11} /> 100% Cash Paid ({formatCurrency(totalPaid)})
                                </span>
                                <span className="text-[9px] text-muted-foreground">
                                  Token: {formatCurrency(tokenAmt)} &bull; Balance: {formatCurrency(Math.max(0, finalAmt - tokenAmt))}
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-emerald-400 font-bold">
                                  Token Advance: {formatCurrency(tokenAmt)}
                                </span>
                                <span className="text-rose-400 font-mono font-bold">
                                  Remaining Balance: {formatCurrency(balanceDue)}
                                </span>
                                <span className="text-[9px] text-muted-foreground">
                                  Total Paid: {formatCurrency(totalPaid)}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Showroom 2% Bonus */}
                        <td className="py-3.5 px-4">
                          {isLoan && !isCancelled ? (
                            <div className="flex flex-col">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono w-fit">
                                +{formatCurrency(commission)}
                              </span>
                              <span className="text-[9px] text-muted-foreground mt-0.5">2% from Bank</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </td>

                        {/* Current Step */}
                        <td className="py-3.5 px-4">
                          {isCancelled ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold border bg-rose-500/10 text-rose-400 border-rose-500/20 flex items-center gap-1 w-fit">
                              <Ban size={11} /> Cancelled &bull; Car in Stock
                            </span>
                          ) : isDelivered ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold border bg-sky-500/10 text-sky-400 border-sky-500/20 flex items-center gap-1 w-fit">
                              <Truck size={11} /> Step 4: Delivered (Sold)
                            </span>
                          ) : isScheduled ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold border bg-sky-500/10 text-sky-400 border-sky-500/20 flex items-center gap-1 w-fit">
                              <Truck size={11} /> Step 4: Delivery Scheduled
                            </span>
                          ) : isLoan ? (
                            isLoanDisbursed ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1 w-fit">
                                <CheckCircle2 size={11} /> Step 3: Loan Disbursed (Paid)
                              </span>
                            ) : isLoanApproved ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold border bg-amber-500/10 text-amber-400 border-amber-500/20 flex items-center gap-1 w-fit">
                                <Clock size={11} /> Step 2: Approved (Disbursal Pending)
                              </span>
                            ) : tokenAmt === 0 && totalPaid === 0 ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold border bg-amber-500/10 text-amber-400 border-amber-500/20 flex items-center gap-1 w-fit animate-pulse">
                                <Clock size={11} /> Step 1: Collect Token Advance
                              </span>
                            ) : remDown > 0 ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold border bg-amber-500/10 text-amber-400 border-amber-500/20 flex items-center gap-1 w-fit animate-pulse">
                                <Clock size={11} /> Step 2: Down Payment Pending
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold border bg-amber-500/10 text-amber-400 border-amber-500/20 flex items-center gap-1 w-fit animate-pulse">
                                <Clock size={11} /> Step 2: Waiting for Bank
                              </span>
                            )
                          ) : (
                            // Cash Deal
                            isPaid || balanceDue === 0 ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1 w-fit">
                                <CheckCircle2 size={11} /> Step 3: 100% Paid (Ready)
                              </span>
                            ) : tokenAmt === 0 && totalPaid === 0 ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold border bg-amber-500/10 text-amber-400 border-amber-500/20 flex items-center gap-1 w-fit animate-pulse">
                                <Clock size={11} /> Step 1: Collect Token Advance
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold border bg-amber-500/10 text-amber-400 border-amber-500/20 flex items-center gap-1 w-fit animate-pulse">
                                <Clock size={11} /> Step 2: Collect Balance
                              </span>
                            )
                          )}
                        </td>

                        {/* DIRECT NEXT ACTION BUTTONS */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            
                            {/* ACTION 0: COLLECT TOKEN ADVANCE (When advance is 0) */}
                            {(permissions.isSystemAdmin || permissions.isBranchManager || permissions.isSalesExecutive) && !isCancelled && !isPaid && tokenAmt === 0 && totalPaid === 0 && (
                              <button
                                onClick={() => setSaleForTokenAdvance(s)}
                                className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-[11px] rounded-lg transition-all shadow flex items-center gap-1 cursor-pointer animate-pulse"
                                title="Open Token Advance Payment Screen to reserve vehicle"
                              >
                                <Lock className="w-3.5 h-3.5 text-slate-950" />
                                <span>Collect Token Advance</span>
                              </button>
                            )}

                            {/* ACTION 1A: APPROVE BANK LOAN (Admin & Branch Manager Only) */}
                            {(permissions.isSystemAdmin || permissions.isBranchManager) && isLoan && !isCancelled && !isLoanApproved && tokenAmt > 0 && (
                              <button
                                onClick={() => setSaleToApprove(s)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-lg transition-colors cursor-pointer shadow flex items-center gap-1"
                                title="Click to approve bank loan"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Approve Bank Loan</span>
                              </button>
                            )}

                            {/* ACTION 1B: COLLECT REMAINING CASH BALANCE (Admin & Branch Manager Only) */}
                            {(permissions.isSystemAdmin || permissions.isBranchManager) && !isLoan && !isCancelled && !isPaid && balanceDue > 0 && (
                              <button
                                onClick={() => handleDirectCollectBalance(s)}
                                className={`px-2.5 py-1.5 font-extrabold text-[11px] rounded-lg transition-colors cursor-pointer shadow flex items-center gap-1 ${
                                  tokenAmt === 0
                                    ? 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                                }`}
                                title={`Collect remaining balance of ${formatCurrency(balanceDue)}`}
                              >
                                <IndianRupee className="w-3.5 h-3.5" />
                                <span>{tokenAmt === 0 ? `Full Settlement (${formatCurrency(balanceDue)})` : `Collect ${formatCurrency(balanceDue)}`}</span>
                              </button>
                            )}

                            {/* QUICK ADVANCE SCREEN (For any active unfinalized deal) */}
                            {(permissions.isSystemAdmin || permissions.isBranchManager || permissions.isSalesExecutive) && !isCancelled && !isPaid && tokenAmt > 0 && (
                              <button
                                onClick={() => setSaleForTokenAdvance(s)}
                                className="px-2 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                title="Manage or adjust token advance breakdown"
                              >
                                <Lock className="w-3 h-3" />
                                <span>Advance</span>
                              </button>
                            )}

                            {/* ACTION 2: SCHEDULE DELIVERY (Strictly unlocked after Stage 2 completion) */}
                            {!isCancelled && !isDelivered && isStage2Complete && (
                              isScheduled ? (
                                <button
                                  onClick={() => router.push('/admin/deliveries')}
                                  className="px-2.5 py-1.5 bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                                  title="Delivery already scheduled. Click to open Deliveries & Handover hub"
                                >
                                  <Truck className="w-3.5 h-3.5 text-sky-400" />
                                  <span>Go to Delivery &rarr;</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setSaleToDeliver(s)}
                                  className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-[11px] rounded-lg transition-colors cursor-pointer shadow flex items-center gap-1"
                                  title="Click to schedule vehicle delivery"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  <span>Move to Delivery</span>
                                </button>
                              )
                            )}

                            {/* ACTION 3: CANCEL PURCHASE */}
                            {canCancel && (
                              <button
                                onClick={() => {
                                  setCancelReason('Customer changed mind prior to financial settlement');
                                  setSaleToCancel(s);
                                }}
                                className="px-2 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                                title="Cancel sale & return vehicle to showroom stock"
                              >
                                <span>Cancel Deal</span>
                              </button>
                            )}

                            {/* DETAILS BUTTON */}
                            <button
                              onClick={() => setSelectedSaleForLifecycle(s)}
                              className="px-2 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground border border-border text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                              title="View full step-by-step history"
                            >
                              <span>View Story</span>
                            </button>

                          </div>
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

      {/* ---------------------------------------------------- */}
      {/* 1-CLICK MODAL: APPROVE BANK LOAN                     */}
      {/* ---------------------------------------------------- */}
      {saleToApprove && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-foreground font-display">
                  Confirm Bank Loan Approval
                </h3>
                <p className="text-xs text-muted-foreground">
                  Step 3 of the car purchase flow
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-secondary/40 border border-border text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vehicle:</span>
                <strong className="text-foreground">{saleToApprove.vehicles?.make} {saleToApprove.vehicles?.model}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <strong className="text-foreground">{saleToApprove.customers?.first_name} {saleToApprove.customers?.last_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank Loan Amount:</span>
                <strong className="text-amber-400 font-mono">{formatCurrency(saleToApprove.loan_amount)}</strong>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-emerald-400 font-bold">Your 2% Extra Bank Bonus:</span>
                <strong className="text-emerald-400 font-mono">
                  +{formatCurrency(saleToApprove.bank_commission_amount || Math.round(Number(saleToApprove.loan_amount || 0) * 0.02))}
                </strong>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
              ⚠️ <strong>Note:</strong> Once approved, the deal is 100% paid and cancellation is locked.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSaleToApprove(null)}
                className="px-4 py-2 bg-secondary text-muted-foreground font-bold text-xs rounded-xl hover:text-foreground cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={confirmApproveLoan}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer"
              >
                {actionLoading ? 'Approving...' : 'Yes, Approve Bank Loan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 1-CLICK MODAL: CANCEL PURCHASE & RELEASE VEHICLE     */}
      {/* ---------------------------------------------------- */}
      {saleToCancel && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-rose-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-foreground font-display">
                  Cancel Purchase &amp; Return Car to Stock?
                </h3>
                <p className="text-xs text-muted-foreground">
                  The car will be released back to the showroom
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Cancelling will immediately return <strong>{saleToCancel.vehicles?.make} {saleToCancel.vehicles?.model}</strong> back to <em>Available</em> status so other customers can buy it.
            </p>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Cancellation Reason</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Customer changed mind, loan denied, etc."
                className="w-full p-2 bg-secondary border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSaleToCancel(null)}
                className="px-4 py-2 bg-secondary text-muted-foreground font-bold text-xs rounded-xl hover:text-foreground cursor-pointer"
              >
                Keep Deal
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={confirmCancelDeal}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer"
              >
                {actionLoading ? 'Cancelling...' : 'Yes, Cancel & Return Car'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 1-CLICK MODAL: MOVE TO DELIVERY                      */}
      {/* ---------------------------------------------------- */}
      {saleToDeliver && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-foreground font-display">
                  Schedule Car Handover (Delivery)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Step 4 of the car purchase flow
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-secondary/40 border border-border text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Car:</span>
                <strong className="text-foreground">{saleToDeliver.vehicles?.make} {saleToDeliver.vehicles?.model}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Buyer:</span>
                <strong className="text-foreground">{saleToDeliver.customers?.first_name} {saleToDeliver.customers?.last_name}</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Handover Delivery Date</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full p-2 bg-secondary border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSaleToDeliver(null)}
                className="px-4 py-2 bg-secondary text-muted-foreground font-bold text-xs rounded-xl hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={confirmMoveToDelivery}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer"
              >
                {actionLoading ? 'Scheduling...' : 'Confirm & Move to Delivery (Sales Exec)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SIMPLE 3-STEP NEW SALE CONTRACT MODAL                */}
      {/* ---------------------------------------------------- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            
            <div className="p-5 border-b border-border flex items-center justify-between bg-secondary/30">
              <div className="flex items-center gap-2.5">
                <Plus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-base text-foreground font-display">
                  Create New Car Sale (Easy 3 Steps)
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSaleSubmit} className="p-6 space-y-4 text-xs">
              
              {/* Step 1: Pick Car */}
              <div>
                <label className="block font-extrabold text-foreground mb-1">
                  1. Which Car is being purchased? *
                </label>
                <select
                  required
                  value={createForm.vehicleId}
                  onChange={(e) => handleSelectCar(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="">Select available car from showroom...</option>
                  {availableCars.map((c) => (
                    <option key={c.vehicle_id} value={c.vehicle_id}>
                      {c.make} {c.model} ({c.manufacture_year}) - ₹{Number(c.price).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Pick Customer */}
              <div>
                <label className="block font-extrabold text-foreground mb-1">
                  2. Who is the buyer?
                </label>
                <select
                  value={createForm.customerId}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, customerId: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="">Select registered customer (or walk-in default)...</option>
                  {customers.map((cust) => (
                    <option key={cust.customer_id} value={cust.customer_id}>
                      {cust.first_name} {cust.last_name || ''} ({cust.phone || cust.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Payment Type */}
              <div>
                <label className="block font-extrabold text-foreground mb-1.5">
                  3. How is the customer paying?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateForm(prev => ({ ...prev, paymentType: 'FULL' }))}
                    className={`p-3 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                      createForm.paymentType === 'FULL'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow'
                        : 'bg-secondary text-muted-foreground border-border'
                    }`}
                  >
                    💵 100% Full Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateForm(prev => ({ ...prev, paymentType: 'LOAN' }))}
                    className={`p-3 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                      createForm.paymentType === 'LOAN'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500 shadow'
                        : 'bg-secondary text-muted-foreground border-border'
                    }`}
                  >
                    🏦 Bank Loan
                  </button>
                </div>
              </div>

              {/* Segregated Financial Breakdown */}
              {createForm.paymentType === 'LOAN' ? (
                <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Vehicle Final Contract Price:</span>
                    <strong className="text-foreground font-mono font-bold text-sm">
                      {formatCurrency(createForm.sellingPrice)}
                    </strong>
                  </div>

                  {/* Required Down Payment */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-foreground">
                        Required Down Payment (Total upfront required)
                      </label>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ~{createForm.sellingPrice > 0 ? Math.round((createForm.requiredDownPayment / createForm.sellingPrice) * 100) : 0}% of price
                      </span>
                    </div>
                    <input
                      type="number"
                      value={createForm.requiredDownPayment}
                      onChange={(e) => {
                        const down = Math.max(0, Number(e.target.value));
                        setCreateForm(prev => ({
                          ...prev,
                          requiredDownPayment: down,
                          loanAmount: Math.max(0, prev.sellingPrice - down),
                        }));
                      }}
                      className="w-full p-2.5 bg-secondary border border-border rounded-xl text-foreground font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Token Advance */}
                  <div>
                    <label className="block font-bold text-emerald-400 mb-1">
                      Token Advance Received (Credited toward Down Payment)
                    </label>
                    <input
                      type="number"
                      value={createForm.tokenAdvance}
                      onChange={(e) => {
                        const token = Math.max(0, Number(e.target.value));
                        setCreateForm(prev => ({
                          ...prev,
                          tokenAdvance: token,
                        }));
                      }}
                      className="w-full p-2.5 bg-secondary border border-border rounded-xl text-foreground font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Remaining Down Payment calculation */}
                  <div className="p-2.5 rounded-xl bg-secondary/80 border border-border space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Remaining Down Payment Due:</span>
                      <strong className={`font-mono font-bold ${createForm.tokenAdvance > createForm.requiredDownPayment ? 'text-blue-400' : 'text-amber-400'}`}>
                        {formatCurrency(Math.max(0, createForm.requiredDownPayment - createForm.tokenAdvance))}
                      </strong>
                    </div>

                    {createForm.tokenAdvance > createForm.requiredDownPayment && (
                      <div className="text-[11px] text-blue-300 bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                        ℹ️ Token advance exceeds required down payment by <strong>{formatCurrency(createForm.tokenAdvance - createForm.requiredDownPayment)}</strong>. Excess will be credited to outstanding vehicle balance or refunded.
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-1 border-t border-border/50">
                      <span className="text-muted-foreground">Bank Loan Principal:</span>
                      <strong className="text-sky-400 font-mono font-bold">
                        {formatCurrency(createForm.loanAmount)}
                      </strong>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Percent size={13} /> Your Showroom 2% Bank Profit:
                    </span>
                    <strong className="text-emerald-400 font-mono font-black">
                      +{formatCurrency(Math.round(createForm.loanAmount * 0.02))}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Vehicle Final Contract Price:</span>
                    <strong className="text-foreground font-mono font-bold text-sm">
                      {formatCurrency(createForm.sellingPrice)}
                    </strong>
                  </div>

                  <div className="flex items-center gap-3 py-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="cashOption"
                        checked={!createForm.fullUpfront}
                        onChange={() => setCreateForm(prev => ({ ...prev, fullUpfront: false }))}
                        className="accent-emerald-500"
                      />
                      <span className="font-semibold text-foreground">Token Advance Booking</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="cashOption"
                        checked={createForm.fullUpfront}
                        onChange={() => setCreateForm(prev => ({ ...prev, fullUpfront: true }))}
                        className="accent-emerald-500"
                      />
                      <span className="font-semibold text-foreground">100% Paid Upfront</span>
                    </label>
                  </div>

                  {!createForm.fullUpfront ? (
                    <div className="space-y-2">
                      <div>
                        <label className="block font-bold text-emerald-400 mb-1">
                          Token Advance Amount Received
                        </label>
                        <input
                          type="number"
                          value={createForm.tokenAdvance}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value));
                            setCreateForm(prev => ({ ...prev, tokenAdvance: val }));
                          }}
                          className="w-full p-2.5 bg-secondary border border-border rounded-xl text-foreground font-mono font-bold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                        <span>Remaining Cash Balance Due:</span>
                        <strong className="font-mono text-sm font-bold">
                          {formatCurrency(Math.max(0, createForm.sellingPrice - createForm.tokenAdvance))}
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-bold flex items-center justify-between">
                      <span>Full contract settled upfront:</span>
                      <span className="font-mono text-sm">{formatCurrency(createForm.sellingPrice)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-secondary text-muted-foreground font-bold hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingSale || !createForm.vehicleId}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow cursor-pointer disabled:opacity-50"
                >
                  {creatingSale ? 'Creating Deal...' : 'Create Deal & Reserve Car'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* REVENUE BREAKDOWN MODAL */}
      <RevenueBreakdownModal 
        isOpen={isBreakdownOpen} 
        onClose={() => setIsBreakdownOpen(false)} 
      />

      {/* 5-STAGE SALE LIFECYCLE STORY MODAL */}
      <SaleLifecycleModal
        sale={selectedSaleForLifecycle}
        isOpen={!!selectedSaleForLifecycle}
        onClose={() => setSelectedSaleForLifecycle(null)}
        onSaleUpdated={fetchSales}
        onOpenPaymentVerification={(s) => {
          setSelectedSaleForLifecycle(null);
          setSaleForPaymentVerification(s);
        }}
      />

      {/* TOKEN ADVANCE PAYMENT SCREEN MODAL */}
      <TokenAdvancePaymentModal
        sale={saleForTokenAdvance}
        isOpen={!!saleForTokenAdvance}
        onClose={() => setSaleForTokenAdvance(null)}
        onSuccess={() => {
          setSaleForTokenAdvance(null);
          fetchSales();
        }}
      />

      {/* PAYMENT VERIFICATION & SETTLEMENT MODAL */}
      <PaymentVerificationModal
        sale={saleForPaymentVerification}
        isOpen={!!saleForPaymentVerification}
        onClose={() => setSaleForPaymentVerification(null)}
        onSuccess={() => {
          setSaleForPaymentVerification(null);
          fetchSales();
        }}
      />

    </RequireRole>
  );
}
