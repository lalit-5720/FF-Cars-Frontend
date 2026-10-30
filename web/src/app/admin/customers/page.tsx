'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { usePermissions } from '../../../hooks/usePermissions';
import { RequireRole } from '../../../components/auth/RequireRole';
import { showLocalToast } from '../../../components/Toast';
import { firstError, required, email as checkEmail, phone as checkPhone, maxLen } from '../../../lib/validation';
import {
  Users,
  Search,
  Filter,
  Plus,
  TrendingUp,
  UserCheck,
  Award,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CarFront,
  CircleDollarSign,
  Star,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  X,
  FileText,
  Building2,
  CreditCard,
  AlertCircle,
  Copy,
  Check,
  Wallet,
  Receipt,
  Loader2,
  ShieldCheck,
  Lock,
  PhoneCall
} from 'lucide-react';

interface CustomerRecord {
  id?: number;
  customer_id?: number;
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  city?: string;
  budget_preference?: string;
  preferred_fuel?: string;
  status?: string;
  total_test_drives?: number;
  created_at?: string;
  total_spent?: number;
  total_dues?: number;
  payments_count?: number;
  sales?: any[];
  test_drives?: any[];
  leads?: any[];
  _count?: { leads?: number; test_drives?: number; sales?: number };
}

export default function AdminCustomersPage() {
  const permissions = usePermissions();
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DUES' | 'SETTLED' | 'PROSPECTS'>('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [selectedCustomerPayments, setSelectedCustomerPayments] = useState<any[]>([]);
  const [loadingCustomerPayments, setLoadingCustomerPayments] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'DUES' | 'TRANSACTIONS' | 'PROFILE'>('DUES');
  const [settlingSaleId, setSettlingSaleId] = useState<number | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [copiedTxn, setCopiedTxn] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Customer Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    city: 'Chennai',
    budget_preference: 'Under ₹10 Lakhs',
    preferred_fuel: 'Petrol'
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers');
      const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setCustomers(list);
    } catch (err) {
      console.warn('Fallback to sample customer records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // When a customer is selected, fetch their full customer record and transactions
  const openCustomerDetails = async (cust: CustomerRecord) => {
    setSelectedCustomer(cust);
    setActiveModalTab('DUES');
    setLoadingCustomerPayments(true);
    const customerId = cust.customer_id || cust.id;

    try {
      const [custRes, payRes] = await Promise.all([
        api.get(`/customers/${customerId}`).catch(() => ({ data: cust })),
        api.get(`/payments?customerId=${customerId}`).catch(() => ({ data: [] })),
      ]);

      if (custRes.data) {
        setSelectedCustomer((prev) => ({ ...prev, ...custRes.data }));
      }

      const paymentsList = Array.isArray(payRes.data) ? payRes.data : (payRes.data?.data || []);
      setSelectedCustomerPayments(paymentsList);
    } catch (err) {
      console.error('Failed to load customer transactions', err);
      setSelectedCustomerPayments([]);
    } finally {
      setLoadingCustomerPayments(false);
    }
  };

  // Branch Manager action to collect and settle remaining balance
  const handleCollectBalance = async (saleId: number) => {
    if (!confirm('Confirm and record receipt of full remaining balance for this deal?')) return;
    setSettlingSaleId(saleId);

    try {
      await api.post(`/sales/${saleId}/collect-balance`);
      showLocalToast('Full balance collected and verified successfully!', 'success');
      await fetchCustomers();
      if (selectedCustomer) {
        const customerId = selectedCustomer.customer_id || selectedCustomer.id;
        const [updatedCust, updatedPays] = await Promise.all([
          api.get(`/customers/${customerId}`).catch(() => ({ data: null })),
          api.get(`/payments?customerId=${customerId}`).catch(() => ({ data: [] })),
        ]);
        if (updatedCust.data) setSelectedCustomer((prev) => ({ ...prev, ...updatedCust.data }));
        setSelectedCustomerPayments(Array.isArray(updatedPays.data) ? updatedPays.data : []);
      }
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to settle balance', 'error');
    } finally {
      setSettlingSaleId(null);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name.trim() || !formData.email) {
      showLocalToast('Please enter first name and email.', 'error');
      return;
    }
    const custErr = firstError(
      maxLen(formData.first_name.trim(), 50, 'First name'),
      maxLen(formData.last_name, 50, 'Last name'),
      checkEmail(formData.email, 'Email', true),
      checkPhone(formData.phone),
    );
    if (custErr) {
      showLocalToast(custErr, 'error');
      return;
    }

    try {
      const res = await api.post('/customers', formData);
      showLocalToast(`Customer ${formData.first_name} registered successfully!`);
      await fetchCustomers();
      setIsAddModalOpen(false);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        city: 'Chennai',
        budget_preference: 'Under ₹10 Lakhs',
        preferred_fuel: 'Petrol'
      });
    } catch (err: any) {
      console.error('Failed to create customer:', err);
      showLocalToast(err.response?.data?.message || 'Failed to create customer profile', 'error');
    }
  };

  // Calculations for executive summary cards
  const totalOutstandingDues = customers.reduce((sum, c) => sum + Number(c.total_dues || 0), 0);
  const totalPaymentsCollected = customers.reduce((sum, c) => sum + Number(c.total_spent || 0), 0);
  const customersWithDuesCount = customers.filter((c) => Number(c.total_dues || 0) > 0).length;
  const settledCustomersCount = customers.filter((c) => Number(c.total_dues || 0) === 0 && Number(c.total_spent || 0) > 0).length;
  const totalTransactionsCount = customers.reduce((sum, c) => sum + Number(c.payments_count || 0), 0);

  // Filtered customer list
  const filteredCustomers = customers.filter((c) => {
    const fullName = `${c.first_name} ${c.last_name || ''}`.toLowerCase();
    const matchesSearch =
      fullName.includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || '').includes(search);
    const matchesCity = cityFilter === 'ALL' || c.city === cityFilter;

    let matchesStatus = true;
    if (statusFilter === 'DUES') {
      matchesStatus = Number(c.total_dues || 0) > 0;
    } else if (statusFilter === 'SETTLED') {
      matchesStatus = Number(c.total_dues || 0) === 0 && Number(c.total_spent || 0) > 0;
    } else if (statusFilter === 'PROSPECTS') {
      matchesStatus = Number(c.total_spent || 0) === 0 && Number(c.total_dues || 0) === 0;
    }

    return matchesSearch && matchesCity && matchesStatus;
  });

  return (
    <RequireRole allow={['SYSTEM_ADMIN', 'BRANCH_MANAGER']}>
      <div className="space-y-6 pb-12">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-surface border border-border p-6 rounded-[8px]">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge-info">
                Customer Intelligence &amp; Accounts
              </span>
              <span className="text-[12px] text-text-secondary">
                {customers.length} Registered Accounts
              </span>
            </div>
            <h1 className="text-[24px] font-bold text-text-primary mt-2">
              Customer Accounts &amp; Financial Ledger
            </h1>
            <p className="text-[12px] text-text-secondary mt-1 max-w-2xl">
              Monitor customer buying pipelines, track outstanding payment dues prior to key handover, and review complete per-customer transaction registries.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Register New Customer
            </button>
          </div>
        </div>

        {/* 4 Executive KPI Cards (Financial & Operational Insight) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Customer Roster */}
          <div className="p-4 rounded-[8px] bg-bg-surface border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between text-text-secondary text-[12px] font-bold mb-2">
              <span>Total Customer Roster</span>
              <Users className="w-4 h-4 text-accent" />
            </div>
            <div className="text-[24px] font-bold text-text-primary">{customers.length}</div>
            <span className="text-[12px] text-text-secondary mt-2">Active showroom buyer profiles</span>
          </div>

          {/* Card 2: Total Outstanding Dues */}
          <div className="p-4 rounded-[8px] bg-bg-surface border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between text-text-secondary text-[12px] font-bold mb-2">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-status-warning" />
                Outstanding Payment Dues
              </span>
              {customersWithDuesCount > 0 && (
                <span className="badge-warning">
                  {customersWithDuesCount} Accounts
                </span>
              )}
            </div>
            <div className="text-[24px] font-bold text-status-warning">
              ₹{totalOutstandingDues.toLocaleString('en-IN')}
            </div>
            <span className="text-[12px] text-status-warning mt-2">
              Awaiting balance clearance before handover
            </span>
          </div>

          {/* Card 3: Total Collections */}
          <div className="p-4 rounded-[8px] bg-bg-surface border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between text-text-secondary text-[12px] font-bold mb-2">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-status-success" />
                Payments Settled
              </span>
              <span className="text-[12px] text-status-success font-bold">
                {totalTransactionsCount} Txns
              </span>
            </div>
            <div className="text-[24px] font-bold text-status-success">
              ₹{totalPaymentsCollected.toLocaleString('en-IN')}
            </div>
            <span className="text-[12px] text-text-secondary mt-2">
              Credited token advances &amp; full settlements
            </span>
          </div>

          {/* Card 4: Settled Customers */}
          <div className="p-4 rounded-[8px] bg-bg-surface border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between text-text-secondary text-[12px] font-bold mb-2">
              <span>Fully Cleared Accounts</span>
              <CheckCircle2 className="w-4 h-4 text-status-success" />
            </div>
            <div className="text-[24px] font-bold text-text-primary">{settledCustomersCount}</div>
            <span className="text-[12px] text-status-success font-bold mt-2">
              Cleared for release &amp; RTO dispatch
            </span>
          </div>
        </div>

        {/* Customer Search & Multi-Criteria Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-bg-surface p-4 rounded-[8px] border border-border">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
            <input
              type="text"
              placeholder="Search by customer name, email, phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base w-full pl-10"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-2 rounded-[8px] text-[12px] font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-accent text-accent-text'
                  : 'btn-neutral'
              }`}
            >
              All ({customers.length})
            </button>
            <button
              onClick={() => setStatusFilter('DUES')}
              className={`px-3 py-2 rounded-[8px] text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'DUES'
                  ? 'bg-accent text-accent-text'
                  : 'btn-neutral'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>With Dues ({customersWithDuesCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('SETTLED')}
              className={`px-3 py-2 rounded-[8px] text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'SETTLED'
                  ? 'bg-accent text-accent-text'
                  : 'btn-neutral'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Settled ({settledCustomersCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('PROSPECTS')}
              className={`px-3 py-2 rounded-[8px] text-[12px] font-bold transition-all cursor-pointer ${
                statusFilter === 'PROSPECTS'
                  ? 'bg-accent text-accent-text'
                  : 'btn-neutral'
              }`}
            >
              Prospects
            </button>
          </div>

          {/* City Filter */}
          <div className="flex items-center gap-2 bg-bg-surface-alt border border-border rounded-[8px] px-3 py-2 text-[12px] shrink-0">
            <Filter className="w-4 h-4 text-text-secondary" />
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-transparent text-text-primary font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-bg-surface text-text-primary">All Cities</option>
              <option value="Chennai" className="bg-bg-surface text-text-primary">Chennai</option>
              <option value="Coimbatore" className="bg-bg-surface text-text-primary">Coimbatore</option>
            </select>
          </div>
        </div>

        {/* Customer Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-[8px] bg-bg-surface animate-pulse border border-border" />
            ))
          ) : filteredCustomers.length === 0 ? (
            <div className="col-span-full p-16 text-center text-text-secondary bg-bg-surface rounded-[8px] border border-border">
              No customer records match your filter criteria.
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const customerId = cust.customer_id || cust.id;
              const hasDues = Number(cust.total_dues || 0) > 0;
              const isSettled = !hasDues && Number(cust.total_spent || 0) > 0;
              const salesCount = cust.sales?.length ?? cust._count?.sales ?? 0;
              const paymentsCount = cust.payments_count ?? 0;

              return (
                <div
                  key={customerId}
                  className="p-4 rounded-[8px] bg-bg-surface border border-border flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Header: Customer Name + Dues Badge */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[8px] bg-accent text-accent-text font-bold text-[14px] flex items-center justify-center">
                          {cust.first_name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-text-primary text-[14px]">
                            {cust.first_name} {cust.last_name || ''}
                          </h4>
                          <span className="text-[12px] text-text-secondary flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-text-secondary" /> {cust.city || 'Chennai'}
                          </span>
                        </div>
                      </div>

                      {hasDues ? (
                        <span className="badge-warning shrink-0">
                          ₹{Number(cust.total_dues).toLocaleString('en-IN')} Due
                        </span>
                      ) : isSettled ? (
                        <span className="badge-success shrink-0">
                          ✓ Settled
                        </span>
                      ) : (
                        <span className="badge-info shrink-0">
                          Prospect
                        </span>
                      )}
                    </div>

                    {/* Financial Accounting Snapshot (Data Informative) */}
                    <div className="p-3 rounded-[8px] bg-bg-surface-alt border border-border grid grid-cols-2 gap-3 text-[12px] mb-4">
                      <div>
                        <span className="text-[12px] uppercase font-bold text-text-secondary block">Total Paid to Date</span>
                        <span className="font-bold text-status-success text-[14px] mt-0.5 block">
                          ₹{Number(cust.total_spent || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[12px] uppercase font-bold text-text-secondary block">Outstanding Due</span>
                        <span className={`font-bold text-[14px] mt-0.5 block ${hasDues ? 'text-status-warning' : 'text-text-secondary'}`}>
                          ₹{Number(cust.total_dues || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-border">
                        <span className="text-[12px] text-text-secondary block">Allocated Deals</span>
                        <strong className="text-text-primary text-[12px]">{salesCount} Contract{salesCount === 1 ? '' : 's'}</strong>
                      </div>
                      <div className="pt-2 border-t border-border">
                        <span className="text-[12px] text-text-secondary block">Transactions</span>
                        <strong className="text-accent text-[12px]">{paymentsCount} Done</strong>
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-1.5 text-[12px] text-text-secondary">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                        <span className="truncate">{cust.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                        <span>{cust.phone || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Link to Customer 360 View */}
                  <div className="pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-[12px] text-text-secondary">
                      Test Drives: <strong className="text-text-primary">{cust.total_test_drives || 1}</strong>
                    </span>
                    <button
                      onClick={() => openCustomerDetails(cust)}
                      className="btn-neutral flex items-center gap-1.5"
                    >
                      <span>View Dues &amp; Ledger</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* CUSTOMER 360 INFORMATIVE PROFILE & TRANSACTION MODAL */}
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
            <div className="relative w-full max-w-3xl bg-bg-surface border border-border rounded-[8px] p-6 text-text-primary flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
              
              {/* Modal Top Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[8px] bg-accent text-accent-text font-bold text-[14px] flex items-center justify-center">
                    {selectedCustomer.first_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-[18px] font-bold text-text-primary">
                      {selectedCustomer.first_name} {selectedCustomer.last_name || ''}
                    </h3>
                    <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                      <span>{selectedCustomer.city || 'Chennai'} Customer</span>
                      <span>&bull;</span>
                      <span>{selectedCustomer.email}</span>
                      <span>&bull;</span>
                      <span>{selectedCustomer.phone || '—'}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1 rounded-[8px] text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Financial Summary KPI Strip for this Customer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-[8px] bg-bg-surface-alt border border-border">
                  <span className="text-[12px] uppercase font-bold text-text-secondary block">Outstanding Payment Due</span>
                  <span className="text-[24px] font-bold text-status-warning block mt-1">
                    ₹{Number(selectedCustomer.total_dues || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[12px] text-status-warning font-bold">Pending showroom balance</span>
                </div>

                <div className="p-4 rounded-[8px] bg-bg-surface-alt border border-border">
                  <span className="text-[12px] uppercase font-bold text-text-secondary block">Total Payments Settled</span>
                  <span className="text-[24px] font-bold text-status-success block mt-1">
                    ₹{Number(selectedCustomer.total_spent || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[12px] text-text-secondary">Deposits &amp; full payments</span>
                </div>

                <div className="p-4 rounded-[8px] bg-bg-surface-alt border border-border">
                  <span className="text-[12px] uppercase font-bold text-text-secondary block">Transactions Count</span>
                  <span className="text-[24px] font-bold text-accent block mt-1">
                    {selectedCustomerPayments.length || selectedCustomer.payments_count || 0}
                  </span>
                  <span className="text-[12px] text-text-secondary">Official digital receipts</span>
                </div>
              </div>

              {/* Modal Tabs */}
              <div className="flex gap-2 border-b border-border pb-2">
                <button
                  onClick={() => setActiveModalTab('DUES')}
                  className={`px-4 py-2 rounded-[8px] text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeModalTab === 'DUES'
                      ? 'bg-accent text-accent-text'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Payment Dues &amp; Deals ({(selectedCustomer.sales || []).length})</span>
                </button>
                <button
                  onClick={() => setActiveModalTab('TRANSACTIONS')}
                  className={`px-4 py-2 rounded-[8px] text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeModalTab === 'TRANSACTIONS'
                      ? 'bg-accent text-accent-text'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Customer Transactions Done ({selectedCustomerPayments.length})</span>
                </button>
                <button
                  onClick={() => setActiveModalTab('PROFILE')}
                  className={`px-4 py-2 rounded-[8px] text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeModalTab === 'PROFILE'
                      ? 'bg-accent text-accent-text'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Profile &amp; Preferences</span>
                </button>
              </div>

              {/* MODAL TAB CONTENTS */}
              <div className="space-y-4">
                {activeModalTab === 'DUES' ? (
                  /* TAB 1: PAYMENT DUES & DEALS */
                  (selectedCustomer.sales || []).length === 0 ? (
                    <div className="p-8 text-center text-text-secondary bg-bg-surface-alt rounded-[8px] border border-border text-[12px]">
                      No contracted vehicle sales found for this customer.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(selectedCustomer.sales || []).map((sale: any) => {
                        const finalAmount = Number(sale.final_amount ?? sale.selling_price ?? 0);
                        const deposit = Number(sale.deposit_amount ?? 0);
                        const pStatus = String(sale.payment_status || '').toLowerCase();
                        const isCancelled = pStatus.includes('cancel');

                        // Accurately compute payments credited
                        const paymentsList = Array.isArray(sale.payments) ? sale.payments : [];
                        const completedPaid = paymentsList
                          .filter((p: any) => (p.payment_status || '').toLowerCase() === 'completed')
                          .reduce((sum: number, p: any) => sum + Number(p.amount_paid || 0), 0);
                        const effectivePaid = Math.max(completedPaid, deposit);
                        const isPaid = pStatus === 'paid' || (finalAmount > 0 && effectivePaid >= finalAmount);
                        const dueAmount = isCancelled || isPaid ? 0 : Math.max(0, finalAmount - effectivePaid);

                        const car = sale.vehicles || {};
                        const carName = car.make ? `${car.manufacture_year || ''} ${car.make} ${car.model || ''}`.trim() : 'Contracted Vehicle';
                        const reg = car.registration_number || 'Showroom Vehicle';

                        return (
                          <div
                            key={sale.sale_id}
                            className={`p-4 rounded-[8px] bg-bg-surface-alt border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                              dueAmount > 0 ? 'border-status-warning' : 'border-border'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-text-primary text-[14px]">
                                  {carName}
                                </h4>
                                <span className="px-2 py-0.5 rounded-[999px] text-[12px] font-bold bg-bg-surface text-text-secondary border border-border">
                                  Reg: {reg}
                                </span>
                                <span className="badge-info">
                                  Contract #{sale.sale_id}
                                </span>
                              </div>

                              <div className="text-[12px] text-text-secondary flex items-center gap-3 pt-1">
                                <span>Agreed Price: <strong className="text-text-primary font-bold">₹{finalAmount.toLocaleString('en-IN')}</strong></span>
                                <span>&bull;</span>
                                <span>Total Paid: <strong className="text-status-success font-bold">₹{effectivePaid.toLocaleString('en-IN')}</strong></span>
                              </div>
                            </div>

                            {/* Dues & Paid Status (Automatic Update, No Collect Balance button) */}
                            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-border">
                              <div className="text-left md:text-right">
                                <span className="text-[12px] uppercase font-bold text-text-secondary block">Remaining Due</span>
                                <span className={`text-[18px] font-bold ${dueAmount > 0 ? 'text-status-warning' : 'text-status-success'}`}>
                                  {dueAmount > 0 ? `₹${dueAmount.toLocaleString('en-IN')}` : '✓ Fully Settled'}
                                </span>
                              </div>
                              <span className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold border ${
                                dueAmount === 0 || isPaid
                                  ? 'bg-status-success/10 text-status-success border-status-success/30'
                                  : 'bg-status-warning/10 text-status-warning border-status-warning/30'
                              }`}>
                                {dueAmount === 0 || isPaid ? 'Paid in Full' : 'Pending in Deals'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : activeModalTab === 'TRANSACTIONS' ? (
                  /* TAB 2: CUSTOMER TRANSACTIONS DONE */
                  loadingCustomerPayments ? (
                    <div className="p-8 text-center text-text-secondary flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-accent" />
                      <span>Loading customer transaction registry...</span>
                    </div>
                  ) : selectedCustomerPayments.length === 0 ? (
                    <div className="p-8 text-center text-text-secondary bg-bg-surface-alt rounded-[8px] border border-border text-[12px]">
                      No payment transactions recorded for this customer yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedCustomerPayments.map((p: any, idx: number) => {
                        const txRef = p.transaction_reference || `DEP-TXN-${p.payment_id || idx}`;
                        const amount = Number(p.amount_paid || 0);
                        const method = p.payment_method || 'Bank Transfer';
                        const date = p.payment_date || p.created_at || new Date();
                        const car = p.sales?.vehicles || {};
                        const carName = car.make ? `${car.manufacture_year || ''} ${car.make} ${car.model || ''}`.trim() : 'Contracted Vehicle';
                        const isCopied = copiedTxn === txRef;

                        return (
                          <div
                            key={p.payment_id || txRef || idx}
                            className="p-4 rounded-[8px] bg-bg-surface-alt border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-[8px] bg-bg-surface text-accent flex items-center justify-center shrink-0 mt-0.5 border border-border">
                                <CreditCard className="w-4 h-4" />
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[12px] font-bold text-text-primary bg-bg-surface px-2 py-0.5 rounded-[8px] border border-border">
                                    {txRef}
                                  </span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard?.writeText(txRef);
                                      setCopiedTxn(txRef);
                                      showLocalToast('Transaction reference copied!');
                                      setTimeout(() => setCopiedTxn(null), 2000);
                                    }}
                                    className="text-text-secondary hover:text-text-primary text-[12px]"
                                    title="Copy reference"
                                  >
                                    {isCopied ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                  <span className="badge-success">
                                    Verified
                                  </span>
                                </div>
                                <div className="text-[14px] font-bold text-text-primary pt-1">
                                  {carName} &bull; <span className="text-text-secondary text-[12px]">{car.registration_number || 'TN Registration'}</span>
                                </div>
                                <div className="text-[12px] text-text-secondary flex items-center gap-2">
                                  <span>{new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                  <span>&bull;</span>
                                  <span>{p.remarks || 'Deposit / Payment'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-border">
                              <div className="text-left md:text-right">
                                <span className="text-[18px] font-bold text-status-success block">
                                  +₹{amount.toLocaleString('en-IN')}
                                </span>
                                <span className="text-[12px] text-text-secondary block">
                                  via {method}
                                </span>
                              </div>

                              <button
                                onClick={() => setSelectedReceipt(p.sales || p)}
                                className="btn-neutral flex items-center gap-1.5"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>Receipt</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  /* TAB 3: PROFILE & PREFERENCES */
                  <div className="space-y-3 text-[12px]">
                    <div className="p-4 rounded-[8px] bg-bg-surface-alt border border-border space-y-2">
                      <div className="text-[12px] uppercase font-bold text-accent">Buying Intent &amp; Specifications</div>
                      <div className="grid grid-cols-2 gap-3 text-text-secondary">
                        <div>
                          <span className="text-text-secondary block text-[12px]">Target Budget:</span>
                          <strong className="text-status-success font-bold text-[14px]">{selectedCustomer.budget_preference || 'Under ₹10 Lakhs'}</strong>
                        </div>
                        <div>
                          <span className="text-text-secondary block text-[12px]">Fuel Preference:</span>
                          <strong className="text-text-primary font-bold text-[14px]">{selectedCustomer.preferred_fuel || 'Petrol'}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-[8px] bg-bg-surface-alt border border-border space-y-2">
                      <div className="text-[12px] uppercase font-bold text-text-secondary">Contact Details</div>
                      <div className="space-y-1.5">
                        <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-accent" /> {selectedCustomer.email}</p>
                        <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-status-success" /> {selectedCustomer.phone || '—'}</p>
                        <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-text-secondary" /> {selectedCustomer.city || 'Chennai, Tamil Nadu'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end pt-4 border-t border-border">
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="btn-neutral"
                >
                  Close Profile
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Digital Receipt Modal */}
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-bg-surface border border-border rounded-[8px] w-full max-w-lg p-6 text-[14px] text-text-primary space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-accent" />
                  <h4 className="text-[18px] font-bold text-text-primary">Digital Transaction Receipt</h4>
                </div>
                <button onClick={() => setSelectedReceipt(null)} className="text-text-secondary hover:text-text-primary p-1 rounded-[8px]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-[8px] bg-bg-surface-alt border border-border space-y-2">
                <div className="flex justify-between text-text-secondary text-[12px]">
                  <span>Contract Number:</span>
                  <strong className="text-text-primary font-bold">#{selectedReceipt.sale_id || 10}</strong>
                </div>
                <div className="flex justify-between text-text-secondary text-[12px]">
                  <span>Vehicle:</span>
                  <strong className="text-text-primary font-bold">
                    {selectedReceipt.vehicles?.make} {selectedReceipt.vehicles?.model}
                  </strong>
                </div>
                <div className="flex justify-between text-text-secondary text-[12px]">
                  <span>Registration:</span>
                  <strong className="text-text-primary font-bold">
                    {selectedReceipt.vehicles?.registration_number || 'TN Registration'}
                  </strong>
                </div>
              </div>

              <div className="p-4 rounded-[8px] bg-bg-surface-alt border border-border flex justify-between items-center">
                <div>
                  <span className="text-[12px] uppercase font-bold text-status-success block">Amount Settled</span>
                  <span className="text-[24px] font-bold text-status-success">
                    ₹{Number(selectedReceipt.amount_paid || selectedReceipt.deposit_amount || selectedReceipt.final_amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="badge-success">
                  Verified
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="btn-neutral"
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Customer Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-bg-surface border border-border rounded-[8px] p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-[18px] font-bold text-text-primary flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-accent" /> Register New Customer Profile
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-text-secondary hover:text-text-primary p-1 rounded-[8px]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomer} className="space-y-3 text-[14px]">
                <div>
                  <label className="text-text-secondary font-bold block mb-1 text-[12px]">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name} maxLength={50}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="input-base w-full"
                    placeholder="e.g. Ramesh"
                  />
                </div>

                <div>
                  <label className="text-text-secondary font-bold block mb-1 text-[12px]">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name} maxLength={50}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="input-base w-full"
                    placeholder="e.g. Krishnan"
                  />
                </div>

                <div>
                  <label className="text-text-secondary font-bold block mb-1 text-[12px]">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email} maxLength={100}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-base w-full"
                    placeholder="e.g. ramesh@gmail.com"
                  />
                </div>

                <div>
                  <label className="text-text-secondary font-bold block mb-1 text-[12px]">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone} maxLength={15} inputMode="tel"
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-base w-full"
                    placeholder="e.g. 9840123456"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-text-secondary font-bold block mb-1 text-[12px]">Budget Preference</label>
                    <select
                      value={formData.budget_preference}
                      onChange={(e) => setFormData({ ...formData, budget_preference: e.target.value })}
                      className="input-base w-full"
                    >
                      <option value="Under ₹10 Lakhs">Under ₹10 Lakhs</option>
                      <option value="₹10L – ₹20L">₹10L – ₹20L</option>
                      <option value="Above ₹20L">Above ₹20L</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-text-secondary font-bold block mb-1 text-[12px]">Preferred Fuel</label>
                    <select
                      value={formData.preferred_fuel}
                      onChange={(e) => setFormData({ ...formData, preferred_fuel: e.target.value })}
                      className="input-base w-full"
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Electric">Electric</option>
                      <option value="Diesel">Diesel</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="btn-neutral"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Save Customer Profile
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </RequireRole>
  );
}
