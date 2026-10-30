'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import { showLocalToast } from '../../components/Toast';
import Link from 'next/link';
import { firstError, required, email as checkEmail, phone as checkPhone, pincode as checkPincode, maxLen } from '../../lib/validation';
import { 
  Heart, 
  Calendar, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ShoppingBag, 
  ShieldAlert,
  Loader2,
  ExternalLink,
  Star,
  MessageSquare,
  Sparkles,
  Send,
  UserCheck,
  Building2,
  Car,
  ChevronRight,
  ShieldCheck,
  Truck,
  Receipt,
  PhoneCall,
  Award,
  FileCheck,
  Check,
  X,
  Lock,
  CreditCard,
  CircleDollarSign,
  AlertCircle,
  Wallet,
  Copy,
  Landmark,
  IndianRupee
} from 'lucide-react';

type TabType = 'bookings' | 'purchases' | 'payments' | 'wishlist' | 'enquiries' | 'reviews' | 'profile';

function CustomerDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const authLoading = !mounted;
  const { fetchWishlist, toggleWishlist, isWishlisted } = useWishlistStore();

  const [activeTab, setActiveTab] = useState<TabType>('bookings');
  const [bookings, setBookings] = useState<any[]>([]);
  const [wishlistCars, setWishlistCars] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);
  const [loadingMyReviews, setLoadingMyReviews] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    address: '',
    pincode: '',
    occupation: '',
    preferred_contact: 'Phone',
  });

  const [copiedTxn, setCopiedTxn] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submittedReviews, setSubmittedReviews] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (tabParam === 'wishlist') {
      setActiveTab('wishlist');
    } else if (tabParam === 'bookings') {
      setActiveTab('bookings');
    } else if (tabParam === 'purchases') {
      setActiveTab('purchases');
    } else if (tabParam === 'payments' || tabParam === 'dues') {
      setActiveTab('payments');
    } else if (tabParam === 'enquiries') {
      setActiveTab('enquiries');
    } else if (tabParam === 'reviews') {
      setActiveTab('reviews');
    } else if (tabParam === 'profile') {
      setActiveTab('profile');
    }
  }, [tabParam]);

  // Authentication check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      showLocalToast('Please log in to view dashboard.');
      router.push('/login?redirect=/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch user test drives / bookings
  const fetchUserBookings = async () => {
    setLoadingBookings(true);
    try {
      const params = new URLSearchParams();
      if (user?.email && user?.role !== 'ADMIN') {
        params.append('email', user.email);
      }
      const response = await api.get(`/test-drives?${params.toString()}`);
      const list = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setBookings(list);
    } catch (error) {
      console.error('Failed to load test drives', error);
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Fetch customer purchases and deliveries
  const fetchUserPurchases = async () => {
    setLoadingPurchases(true);
    try {
      const response = await api.get('/sales/my-purchases').catch(() => api.get('/sales'));
      const list = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setPurchases(list);
    } catch (error) {
      console.error('Failed to load purchases', error);
      setPurchases([]);
    } finally {
      setLoadingPurchases(false);
    }
  };

  const fetchUserTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const response = await api.get('/payments/my-transactions').catch(() => api.get('/payments'));
      const list = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setUserTransactions(list);
    } catch (error) {
      console.error('Failed to load transactions', error);
      setUserTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Fetch wishlist cars details
  const fetchUserWishlist = async () => {
    setLoadingWishlist(true);
    try {
      const { fetchWishlist: loadWishlist } = useWishlistStore.getState();
      await loadWishlist(user?.email);
      const currentWishlistIds = useWishlistStore.getState().wishlistIds;

      if (!currentWishlistIds || currentWishlistIds.length === 0) {
        setWishlistCars([]);
        setLoadingWishlist(false);
        return;
      }

      const response = await api.get('/vehicles?limit=100');
      const list = Array.isArray(response.data) ? response.data : (response.data.data || []);
      const filtered = list.filter((car: any) =>
        currentWishlistIds.includes(String(car.id || car.vehicle_id))
      );
      setWishlistCars(filtered);
    } catch (error) {
      console.error('Failed to load wishlist details', error);
      setWishlistCars([]);
    } finally {
      setLoadingWishlist(false);
    }
  };

  const fetchUserEnquiries = async () => {
    setLoadingEnquiries(true);
    try {
      const res = await api.get('/leads');
      setEnquiries(res.data || []);
    } catch (err) {
      console.error('Failed to load enquiries', err);
    } finally {
      setLoadingEnquiries(false);
    }
  };

  const fetchUserReviews = async () => {
    setLoadingMyReviews(true);
    try {
      const res = await api.get('/reviews/my-reviews');
      setMyReviews(res.data || []);
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoadingMyReviews(false);
    }
  };

  const fetchCustomerProfile = async () => {
    setLoadingProfile(true);
    try {
      const res = await api.get('/customers/me');
      if (res.data) {
        setCustomerProfile(res.data);
        setProfileForm({
          first_name: res.data.first_name || '',
          last_name: res.data.last_name || '',
          phone: res.data.phone || '',
          email: res.data.email || '',
          city: res.data.city || '',
          state: res.data.state || '',
          address: res.data.address || '',
          pincode: res.data.pincode || '',
          occupation: res.data.occupation || '',
          preferred_contact: res.data.preferred_contact || 'Phone',
        });
      }
    } catch (err) {
      console.error('Failed to load customer profile', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const profErr = firstError(
      required(profileForm.first_name, 'First name'),
      maxLen(profileForm.first_name, 50, 'First name'),
      maxLen(profileForm.last_name, 50, 'Last name'),
      checkPhone(profileForm.phone),
      checkEmail(profileForm.email, 'Email'),
      checkPincode(profileForm.pincode),
      maxLen(profileForm.city, 50, 'City'),
      maxLen(profileForm.state, 50, 'State'),
      maxLen(profileForm.address, 500, 'Address'),
      maxLen(profileForm.occupation, 100, 'Occupation'),
    );
    if (profErr) {
      showLocalToast(profErr, 'error');
      return;
    }
    setSavingProfile(true);
    try {
      await api.patch('/customers/me', profileForm);
      showLocalToast('Profile updated successfully!', 'success');
      await fetchCustomerProfile();
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserBookings();
      fetchUserPurchases();
      fetchUserTransactions();
      fetchUserEnquiries();
      fetchUserReviews();
      fetchCustomerProfile();
    }
  }, [isAuthenticated, user?.email]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'wishlist') {
      fetchUserWishlist();
    }
    if (isAuthenticated && activeTab === 'purchases') {
      fetchUserPurchases();
    }
    if (isAuthenticated && activeTab === 'payments') {
      fetchUserPurchases();
      fetchUserTransactions();
    }
    if (isAuthenticated && activeTab === 'enquiries') {
      fetchUserEnquiries();
    }
    if (isAuthenticated && activeTab === 'reviews') {
      fetchUserReviews();
    }
    if (isAuthenticated && activeTab === 'profile') {
      fetchCustomerProfile();
    }
  }, [isAuthenticated, activeTab, user?.email]);

  // Active Dues and Financial Accounting Calculations
  const activeDues = purchases.filter((s: any) => {
    const pStatus = String(s.payment_status || '').toLowerCase();
    if (pStatus.includes('cancel')) return false;
    const finalAmt = Number(s.final_amount ?? s.selling_price ?? 0);
    const deposit = Number(s.deposit_amount ?? 0);
    const loanAmt = Number(s.loan_amount || 0);
    const isLoan = loanAmt > 0;
    const loanStatus = String(s.loan_status || 'Pending');
    const isDelivered =
      String(s.delivery_status || '').toLowerCase() === 'delivered' ||
      (s.deliveries || []).some(
        (d: any) => d.customer_received || (d.delivery_status || '').toLowerCase() === 'delivered'
      );
    const isPaid = pStatus === 'paid';

    // Once a vehicle is delivered or paid in full, handover is complete and all dues are cleared!
    if (isDelivered || isPaid) return false;

    if (isLoan) {
      const totalDown = Math.max(0, finalAmt - loanAmt);
      const netDownDue = Number(s.net_downpayment_due ?? Math.max(0, totalDown - deposit));
      // Loan deal has dues if downpayment is not fully paid or loan is not approved
      return netDownDue > 0 || loanStatus !== 'Approved';
    }

    const netFullDue = Number(s.net_full_payment_due ?? Math.max(0, finalAmt - deposit));
    // Cash deal has dues if remaining balance > 0
    return netFullDue > 0;
  });

  const deliveredPurchases = purchases.filter((s: any) => {
    const dStatus = String(s.delivery_status || '').toLowerCase();
    const hasDeliveredRecord = (s.deliveries || []).some(
      (d: any) => d.customer_received || (d.delivery_status || '').toLowerCase() === 'delivered'
    );
    return dStatus.includes('deliver') || dStatus.includes('complete') || hasDeliveredRecord;
  });

  const totalFullPaymentDue = activeDues.reduce((sum: number, s: any) => {
    const isLoan = Number(s.loan_amount || 0) > 0;
    if (isLoan) return sum;
    const finalAmt = Number(s.final_amount ?? s.selling_price ?? 0);
    const deposit = Number(s.deposit_amount ?? 0);
    const netFullDue = Number(s.net_full_payment_due ?? Math.max(0, finalAmt - deposit));
    return sum + netFullDue;
  }, 0);

  const totalDownPaymentDue = activeDues.reduce((sum: number, s: any) => {
    const isLoan = Number(s.loan_amount || 0) > 0;
    if (!isLoan) return sum;
    const finalAmt = Number(s.final_amount ?? s.selling_price ?? 0);
    const deposit = Number(s.deposit_amount ?? 0);
    const loanAmt = Number(s.loan_amount || 0);
    const totalDown = Math.max(0, finalAmt - loanAmt);
    const netDownDue = Number(s.net_downpayment_due ?? Math.max(0, totalDown - deposit));
    return sum + netDownDue;
  }, 0);

  const totalAmountDue = totalFullPaymentDue + totalDownPaymentDue;

  const totalAmountPaid = purchases.reduce((sum: number, s: any) => {
    const pStatus = String(s.payment_status || '').toLowerCase();
    if (pStatus.includes('cancel')) return sum;
    const isDelivered =
      String(s.delivery_status || '').toLowerCase() === 'delivered' ||
      (s.deliveries || []).some(
        (d: any) => d.customer_received || (d.delivery_status || '').toLowerCase() === 'delivered'
      );
    const finalAmt = Number(s.final_amount ?? s.selling_price ?? 0);
    const deposit = Number(s.deposit_amount ?? 0);
    if (isDelivered || pStatus === 'paid') {
      return sum + finalAmt;
    }
    return sum + deposit;
  }, 0);

  // Combine and sort all transactions performed by this customer
  const allCustomerTransactions = React.useMemo(() => {
    const map = new Map<string, any>();
    userTransactions.forEach((t: any) => {
      const key = String(t.payment_id || t.transaction_reference);
      map.set(key, t);
    });
    purchases.forEach((s: any) => {
      (s.payments || []).forEach((p: any) => {
        const key = String(p.payment_id || p.transaction_reference);
        if (!map.has(key)) {
          map.set(key, { ...p, sales: s });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => {
      const dateA = new Date(a.payment_date || a.created_at || 0).getTime();
      const dateB = new Date(b.payment_date || b.created_at || 0).getTime();
      return dateB - dateA;
    });
  }, [userTransactions, purchases]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this test drive request?')) return;
    setCancellingId(bookingId);
    try {
      await api.patch(`/test-drives/${bookingId}`, { status: 'Cancelled' }).catch(() => api.delete(`/test-drives/${bookingId}`));
      showLocalToast('Test drive request cancelled successfully.', 'success');
      await fetchUserBookings();
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to cancel test drive request.';
      showLocalToast(errMsg, 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const handleRemoveWishlist = async (e: React.MouseEvent, carId: string) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(carId, user?.email);
    showLocalToast('Removed from wishlist.');
    setWishlistCars((prev) => prev.filter((car) => String(car.id || car.vehicle_id) !== String(carId)));
  };

  // Open Write Review / Rating Modal
  const openWriteReviewModal = (bookingOrSale: any) => {
    setSelectedBookingForReview(bookingOrSale);
    setReviewRating(bookingOrSale.rating || 5);
    setReviewComment(bookingOrSale.feedback || '');
    setIsReviewModalOpen(true);
  };

  // Submit Review to Backend for Moderation & Dynamic Publishing
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      showLocalToast('Please write a short comment about your experience.', 'error');
      return;
    }
    if (reviewComment.length > 2000) {
      showLocalToast('Your review must be at most 2000 characters.', 'error');
      return;
    }

    setSubmittingReview(true);

    try {
      const car = selectedBookingForReview?.vehicles || selectedBookingForReview?.car || {};
      const carId = car.vehicle_id || car.id || selectedBookingForReview?.vehicle_id || 1;

      // Submit verified car purchase review to backend reviews table
      await api.post('/reviews', {
        customer_id: user?.id,
        vehicle_id: carId,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      const reviewKey = String(selectedBookingForReview?.sale_id || carId);
      setSubmittedReviews((prev) => ({ ...prev, [reviewKey]: true }));

      showLocalToast(`⭐ Thank you! Your ${reviewRating}-star vehicle purchase review has been submitted for moderation.`, 'success');
      setIsReviewModalOpen(false);
      setSelectedBookingForReview(null);
      fetchUserReviews();
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to submit review.', 'error');
      setIsReviewModalOpen(false);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 text-foreground animate-spin" />
      </div>
    );
  }

  const completedPurchasesCount = purchases.filter((s) => (s.delivery_status || '').toLowerCase() === 'delivered').length;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col pb-12">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col gap-6 w-full">
        
        {/* 1. REFERENCE MATCH HERO WELCOME BANNER */}
        <div className="p-6 sm:p-8 rounded-lg bg-bg-surface border border-border text-text-primary flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="flex flex-col items-start max-w-2xl">
            
            {/* Status Pill Badge */}
            <div className="badge-success inline-flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-success" />
              SYSTEM ONLINE
            </div>

            <h1 className="page-title">
              Welcome back, {user.name}
            </h1>

            <p className="text-sm text-text-secondary mt-2 leading-relaxed">
              Monitor test drive schedules, track vehicle delivery progress, and curate your personalized luxury automobile collection.
            </p>

            <div className="flex items-center gap-4 mt-7 flex-wrap">
              <Link
                href="/cars"
                className="px-6 py-3 rounded-xl bg-card text-foreground font-bold text-xs hover:bg-secondary transition-all shadow-md cursor-pointer"
              >
                Browse Inventory
              </Link>
              <button
                onClick={() => setActiveTab('wishlist')}
                className="px-6 py-3 rounded-xl bg-secondary/90 border border-border text-foreground font-bold text-xs hover:bg-secondary transition-all cursor-pointer"
              >
                View Wishlist
              </button>
            </div>
          </div>

          {user.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-foreground font-black text-xs transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Admin Dashboard <ExternalLink className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* 2. STAT SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-card border border-border/90 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">HEALTHY BOOKINGS</span>
              <span className="text-3xl font-black text-foreground mt-2 block font-display">{bookings.length}</span>
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground font-medium pt-3 border-t border-border">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[10px]">✓</span>
              Active test drives scheduled.
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border/90 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">SAVED VEHICLES</span>
              <span className="text-3xl font-black text-foreground mt-2 block font-display">{wishlistCars.length}</span>
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground font-medium pt-3 border-t border-border">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              Curated luxury garage items.
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border/90 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">VEHICLE CONTRACTS</span>
              <span className="text-3xl font-black text-foreground mt-2 block font-display">{purchases.length}</span>
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground font-medium pt-3 border-t border-border">
              <Truck className="w-3.5 h-3.5 text-amber-500" />
              Allocated showroom contracts.
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('payments')}
            className={`p-5 rounded-2xl bg-card border shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] ${
              activeDues.length > 0 ? 'border-amber-500/50 hover:border-amber-500' : 'border-border/90 hover:border-emerald-500/40'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">PAYMENT DUES</span>
                {activeDues.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500/20 text-amber-500 animate-pulse">
                    Action Needed
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600">
                    All Settled
                  </span>
                )}
              </div>
              <span className={`text-3xl font-black mt-2 block font-mono ${activeDues.length > 0 ? 'text-amber-500' : 'text-foreground'}`}>
                {activeDues.length > 0 ? `₹${totalAmountDue.toLocaleString('en-IN')}` : '₹0 Due'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs font-medium pt-3 border-t border-border">
              {activeDues.length > 0 ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="text-amber-600 dark:text-amber-400 font-semibold truncate">{activeDues.length} balance(s) awaiting release</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-muted-foreground truncate">All accounts cleared in full</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 3. NAVIGATION PILL TABS */}
        <div className="flex gap-2 border-b border-border pb-3 flex-wrap">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'bookings'
                ? 'bg-secondary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            My Test Rides ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'purchases'
                ? 'bg-secondary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <Truck className="w-4 h-4" />
            My Purchases &amp; Deliveries ({purchases.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'payments'
                ? 'bg-secondary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Payment Dues &amp; Transactions</span>
            {activeDues.length > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                {activeDues.length} Due (₹{totalAmountDue.toLocaleString('en-IN')})
              </span>
            ) : purchases.length > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                ✓ Settled
              </span>
            ) : null}
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'wishlist'
                ? 'bg-secondary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <Heart className="w-4 h-4" />
            My Wishlist ({wishlistCars.length})
          </button>
          <button
            onClick={() => setActiveTab('enquiries')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'enquiries'
                ? 'bg-secondary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            My Enquiries ({enquiries.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'reviews'
                ? 'bg-secondary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <Star className="w-4 h-4" />
            My Reviews ({myReviews.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-secondary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Profile &amp; Settings
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className="flex-1 flex flex-col">
          {activeTab === 'bookings' ? (
            loadingBookings ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2].map((n) => (
                  <div key={n} className="h-40 rounded-2xl border border-border bg-card skeleton-shimmer" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-16 border border-border rounded-2xl bg-card flex flex-col items-center gap-4 shadow-sm">
                <div className="p-4 rounded-2xl bg-secondary text-foreground">
                  <Clock className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground font-display">No Test Rides Scheduled</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    You haven't requested any luxury vehicle test drives yet. Explore our inventory catalog to book one.
                  </p>
                </div>
                <Link
                  href="/cars"
                  className="px-6 py-3 rounded-xl bg-secondary hover:bg-secondary text-primary-foreground font-bold text-xs transition-all shadow-sm"
                >
                  Browse Luxury Catalog
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {bookings.map((booking, idx) => {
                  const car = booking.vehicles || booking.car || {};
                  const thumbnail = car.image_url || car.thumbnail || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800';
                  const carId = car.vehicle_id || car.id || booking.vehicle_id || 1;
                  const brand = car.make || car.brand || 'Luxury';
                  const model = car.model || 'Vehicle';
                  const variant = car.color || car.variant || 'Standard Edition';
                  const year = car.manufacture_year || car.year || 2022;
                  const transmission = car.transmission || 'Automatic';
                  const fuelType = car.fuel_type || car.fuelType || 'Petrol';
                  const price = car.price ? Number(car.price) : 3950000;

                  const bookingKey = String(booking.test_drive_id || booking.id || idx);
                  const bookingDate = booking.test_drive_date || booking.scheduled_date || booking.createdAt || new Date();
                  const testDriveStatus = (booking.test_drive_status || booking.status || 'Scheduled').toUpperCase();
                  const isDelivered = (booking.delivery_status || '').toLowerCase() === 'delivered' || booking.sale_status === 'Completed (Delivered)';
                  const isReserved = Boolean(booking.sale_id || booking.is_reserved || booking.is_purchased);
                  const isReviewed = submittedReviews[bookingKey];
                  const isDriveCompleted = testDriveStatus === 'COMPLETED' || testDriveStatus === 'APPROVED';

                  return (
                    <div
                      key={bookingKey}
                      className="p-6 rounded-2xl border border-border/90 bg-card shadow-sm flex flex-col md:flex-row gap-6 items-stretch md:items-center justify-between hover:border-border transition-all"
                    >
                      {/* Car Thumbnail and Info */}
                      <div className="flex gap-5 items-center">
                        <div className="w-28 h-20 rounded-xl overflow-hidden bg-secondary flex-shrink-0 border border-border shadow-sm">
                          <img src={thumbnail} alt={model} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <Link href={`/cars/${carId}`} className="hover:underline">
                            <h3 className="font-extrabold text-base leading-tight text-foreground hover:text-foreground transition-colors font-display">
                              {brand} {model}
                            </h3>
                          </Link>
                          <p className="text-xs text-muted-foreground mt-1 font-medium">{variant} &bull; {year}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-secondary border border-border text-foreground font-bold">
                              {transmission}
                            </span>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-secondary border border-border text-foreground font-bold">
                              {fuelType}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Booking Details: Test Drive & Sale Status */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs border-t md:border-t-0 pt-4 md:pt-0 border-border">
                        <div>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Scheduled Date</span>
                          <span className="font-mono font-bold text-foreground mt-1 block">{new Date(bookingDate).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Vehicle Price</span>
                          <span className="font-extrabold text-foreground mt-1 block font-mono text-sm">₹{price.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Test Drive Status</span>
                          <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider inline-block w-fit ${
                            testDriveStatus === 'COMPLETED' || testDriveStatus === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : testDriveStatus === 'CANCELLED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {testDriveStatus}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Purchase Status</span>
                          <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider inline-block w-fit ${
                            isDelivered
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : booking.delivery_status === 'Scheduled' || booking.is_scheduled
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : isReserved
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-secondary text-muted-foreground border-border'
                          }`}>
                            {isDelivered 
                              ? 'Sale Completed (Delivered)' 
                              : booking.delivery_status === 'Scheduled' || booking.is_scheduled
                              ? 'Delivery Scheduled'
                              : isReserved 
                              ? 'Reserved (Token Paid)' 
                              : 'Not Purchased'}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons: Cancel Request, Write Review, Reserve Car */}
                      <div className="flex items-center gap-3 justify-end border-t md:border-t-0 pt-4 md:pt-0 border-border flex-wrap">
                        
                        {/* 1. TEST DRIVE ACTIONS: REVIEW (IF COMPLETED) OR CANCEL REQUEST (OTHERWISE) */}
                        {isDriveCompleted ? (
                          booking.rating || isReviewed ? (
                            <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500">
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3.5 h-3.5 ${
                                      star <= (booking.rating || reviewRating || 5)
                                        ? 'text-amber-500 fill-amber-500'
                                        : 'text-muted-foreground'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs font-extrabold font-mono">
                                {booking.rating || reviewRating || 5}/5
                              </span>
                              <button
                                onClick={() => openWriteReviewModal(booking)}
                                className="text-[10px] underline font-bold text-amber-600 hover:text-amber-500 cursor-pointer ml-1"
                              >
                                Edit Review
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => openWriteReviewModal(booking)}
                              className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95"
                            >
                              <Star className="w-4 h-4 fill-slate-950" />
                              Write Review
                            </button>
                          )
                        ) : testDriveStatus === 'CANCELLED' ? (
                          <span className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5" />
                            Cancelled
                          </span>
                        ) : (
                          /* OTHERWISE: CANCEL TEST DRIVE REQUEST BUTTON */
                          <button
                            disabled={cancellingId === bookingKey}
                            onClick={() => handleCancelBooking(bookingKey)}
                            className="px-4 py-2.5 text-xs font-bold text-rose-600 border border-rose-200 rounded-xl bg-rose-50 hover:bg-rose-100 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 active:scale-95"
                          >
                            {cancellingId === bookingKey ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            Cancel Test Drive
                          </button>
                        )}

                        {/* 2. VEHICLE RESERVATION & DELIVERY STATUS */}
                        {!isDelivered && (booking.delivery_status === 'Scheduled' || booking.is_scheduled) ? (
                          <button
                            onClick={() => setActiveTab('purchases')}
                            className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                            title="Vehicle is in delivery stage. View full handover tracking"
                          >
                            <Truck className="w-3.5 h-3.5 text-sky-400" />
                            <span>In Delivery &bull; Track Handover &rarr;</span>
                          </button>
                        ) : !isDelivered && (car.status === 'Reserved' || isReserved) ? (
                          <span className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Reserved (Token Recorded · Deal Active)
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : activeTab === 'purchases' ? (
            /* PURCHASES & DELIVERIES TAB */
            loadingPurchases ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2].map((n) => (
                  <div key={n} className="h-56 rounded-3xl border border-border bg-card skeleton-shimmer" />
                ))}
              </div>
            ) : purchases.length === 0 ? (
              <div className="text-center py-16 border border-border rounded-3xl bg-card flex flex-col items-center gap-4 shadow-sm">
                <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Truck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground font-display">No Purchases Recorded Yet</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Once you finalize a vehicle purchase or reserve a car through our showroom, your live 5-stage handover tracking and digital receipt will appear here.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/cars"
                    className="px-6 py-3 rounded-xl bg-secondary text-primary-foreground font-bold text-xs transition-all shadow-sm"
                  >
                    Browse Available Inventory
                  </Link>
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className="px-6 py-3 rounded-xl bg-card border border-border text-foreground font-bold text-xs transition-all cursor-pointer"
                  >
                    View Test Drives
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {purchases.map((sale) => {
                  const vehicle = sale.vehicles || {};
                  const make = vehicle.make || 'Luxury';
                  const model = vehicle.model || 'Automobile';
                  const year = vehicle.manufacture_year || 2023;
                  const reg = vehicle.registration_number || 'TN Registered';
                  const img = vehicle.image_url || 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=600';
                  const branchName = sale.branches?.branch_name || 'CarRevive Chennai Flagship';
                  const finalAmount = Number(sale.final_amount || sale.selling_price || 0);
                  const deliveryStatus = (sale.delivery_status || 'In Progress').toLowerCase();
                  
                  const isDelivered = deliveryStatus.includes('deliver') || deliveryStatus.includes('complete');
                  const currentStage = isDelivered ? 5 : 3;

                  const stages = [
                    { id: 1, name: 'Contract Executed', desc: 'Deposit & docs verified' },
                    { id: 2, name: '150-Pt Technical PDI', desc: 'Inspection passed' },
                    { id: 3, name: 'RTO Registration', desc: 'Transfer in progress' },
                    { id: 4, name: 'Ceramic Detailing', desc: 'Showroom staging' },
                    { id: 5, name: 'Key Handover', desc: 'Ready for release' },
                  ];

                  return (
                    <div
                      key={sale.sale_id}
                      className="p-6 rounded-3xl bg-card border border-border shadow-md flex flex-col gap-6"
                    >
                      {/* Top Bar: Vehicle Info + Payment Badge */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
                        <div className="flex items-center gap-4">
                          <div className="relative w-24 h-18 rounded-2xl overflow-hidden bg-secondary flex-shrink-0 border border-border">
                            <img src={img} alt={model} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-foreground text-lg font-display">
                                {year} {make} {model}
                              </h4>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                Contract #{sale.sale_id}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                              Reg: {reg} &bull; Hub: {branchName}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:items-end gap-1">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Final Agreed Amount</span>
                          <span className="text-2xl font-black text-foreground font-mono">
                            ₹{finalAmount.toLocaleString()}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            isDelivered
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          }`}>
                            {isDelivered ? '✓ Sale Completed (Delivered)' : '⏳ Reserved (Token Paid · Delivery Pending)'}
                          </span>
                        </div>
                      </div>

                      {/* Financial Ledger & Token Advance Accounting */}
                      {(() => {
                        const isDelivered =
                          String(sale.delivery_status || '').toLowerCase() === 'delivered' ||
                          (sale.deliveries || []).some(
                            (d: any) => d.customer_received || (d.delivery_status || '').toLowerCase() === 'delivered'
                          );
                        const isPaid = (sale.payment_status || '').toLowerCase() === 'paid' || isDelivered;
                        const depositAmt = Number(sale.token_advance_amount ?? sale.deposit_amount ?? sale.token_advance ?? 0);
                        const loanAmt = Number(sale.bank_redressal_amount ?? sale.loan_amount ?? 0);
                        const isLoan = loanAmt > 0;
                        const totalDown = isLoan ? Math.max(0, finalAmount - loanAmt) : finalAmount;
                        const netDownDue = isDelivered || isPaid ? 0 : (isLoan ? Math.max(0, totalDown - depositAmt) : 0);
                        const netFullDue = isDelivered || isPaid ? 0 : (!isLoan ? Math.max(0, finalAmount - depositAmt) : 0);

                        return (
                          <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-2 text-xs">
                            <div className="flex items-center justify-between pb-2 border-b border-border/70">
                              <span className="font-extrabold uppercase tracking-wider text-muted-foreground text-[10px] flex items-center gap-1.5">
                                <Receipt className="w-3.5 h-3.5 text-amber-500" />
                                Segregated Accounting: Token Advance, Down Payment &amp; Bank Redressal
                              </span>
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-secondary border border-border">
                                {isLoan ? 'Part Payment (Bank Redressal Loan)' : 'Full Cash Payment'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                              <div>
                                <span className="text-[10px] text-muted-foreground block">Vehicle Total Price</span>
                                <span className="font-mono font-bold text-foreground text-sm">₹{finalAmount.toLocaleString('en-IN')}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-muted-foreground block">Token Advance Amount</span>
                                <span className="font-mono font-extrabold text-emerald-500 text-sm">₹{depositAmt.toLocaleString('en-IN')}</span>
                                <span className="text-[9px] text-emerald-600/80 block font-medium">Upfront Reservation</span>
                              </div>
                              {isLoan ? (
                                <>
                                  <div>
                                    <span className="text-[10px] text-muted-foreground block">Down Payment Amount</span>
                                    <span className="font-mono font-extrabold text-blue-500 text-sm">₹{totalDown.toLocaleString('en-IN')}</span>
                                    <span className="text-[9px] text-muted-foreground block font-medium">
                                      Net Due: {isDelivered || isPaid ? (
                                        <strong className="text-emerald-500 font-extrabold">₹0 (Paid &amp; Handed Over)</strong>
                                      ) : (
                                        <strong className={netDownDue > 0 ? 'text-amber-500' : 'text-emerald-500'}>₹{netDownDue.toLocaleString('en-IN')}</strong>
                                      )}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-muted-foreground block">Bank Redressal Amount</span>
                                    <span className="font-mono font-bold text-sky-400 text-sm">₹{loanAmt.toLocaleString('en-IN')}</span>
                                    <span className="text-[9px] text-muted-foreground block font-medium">
                                      {isDelivered || isPaid ? 'Loan Disbursed & Settled' : 'Bank Loan Principal Disbursed'}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <div className="sm:col-span-2">
                                  <span className="text-[10px] text-muted-foreground block">Balance Due at Handover</span>
                                  {isDelivered || isPaid ? (
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="font-mono font-extrabold text-emerald-500 text-sm">₹0</span>
                                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                        ✓ Fully Paid &amp; Vehicle Handover Complete
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="font-mono font-extrabold text-emerald-500 text-sm">₹{netFullDue.toLocaleString('en-IN')}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* 5-Stage Delivery Timeline Stepper */}
                      <div className="p-5 rounded-2xl bg-secondary/50 border border-border flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-amber-600" />
                            <span className="text-xs font-bold text-foreground">Live Delivery Milestone Tracker</span>
                          </div>
                          <span className="text-[11px] font-bold text-amber-600 font-mono">
                            {isDelivered ? 'Milestone: 5 of 5 (Delivered)' : `Milestone: ${currentStage} of 5 (${stages[currentStage - 1].name})`}
                          </span>
                        </div>

                        {/* Stepper Line */}
                        <div className="grid grid-cols-5 gap-2 pt-2">
                          {stages.map((stage) => {
                            const isDone = stage.id <= currentStage;
                            const isCurrent = stage.id === currentStage && !isDelivered;

                            return (
                              <div key={stage.id} className="flex flex-col items-center text-center gap-1.5">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                  isDone
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-secondary text-muted-foreground border border-border'
                                } ${isCurrent ? 'ring-2 ring-amber-500 ring-offset-2' : ''}`}>
                                  {isDone ? '✓' : stage.id}
                                </div>
                                <span className={`text-[10px] font-bold leading-tight ${isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {stage.name}
                                </span>
                                <span className="text-[9px] text-muted-foreground hidden sm:block">
                                  {stage.desc}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Concierge Specialist Handler & Actions */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground font-bold text-xs">
                            {sale.employees?.first_name ? sale.employees.first_name[0] : 'S'}
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Allocated Delivery Concierge</span>
                            <span className="font-bold text-foreground text-xs block">
                              {sale.employees ? `${sale.employees.first_name} ${sale.employees.last_name || ''}` : 'Showroom Delivery Manager'}
                            </span>
                          </div>
                          {sale.employees?.phone && (
                            <a
                              href={`tel:${sale.employees.phone}`}
                              className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors border border-border"
                            >
                              <PhoneCall className="w-3 h-3 text-emerald-600" />
                              <span>{sale.employees.phone}</span>
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => setSelectedReceipt(sale)}
                            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-card border border-border hover:bg-secondary text-foreground text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            Digital Receipt
                          </button>
                          <button
                            onClick={() => openWriteReviewModal(sale)}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                              isDelivered
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-amber-500/20 ring-2 ring-amber-400/40'
                                : 'bg-secondary hover:bg-secondary/90 text-primary-foreground'
                            }`}
                            title={isDelivered ? 'Share your delivery handover experience and feedback for CarRevive concierge' : 'Review car'}
                          >
                            <Star className={`w-3.5 h-3.5 fill-current ${isDelivered ? 'text-slate-950' : 'text-amber-400'}`} />
                            Write Review
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )
          ) : activeTab === 'payments' ? (
            /* PAYMENT DUES & CUSTOMER TRANSACTIONS TAB */
            loadingPurchases || loadingTransactions ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-44 rounded-3xl border border-border bg-card skeleton-shimmer" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                
                {/* 1. FINANCIAL SUMMARY OVERVIEW STRIP: DUAL FULL PAYMENT & DOWN PAYMENT DUES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Full Payment Due (Cash Deals) */}
                  <div className="p-5 rounded-3xl bg-card border border-emerald-500/30 shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <CircleDollarSign className="w-4 h-4 text-emerald-400" />
                          Full Payment Due (Cash)
                        </span>
                      </div>
                      <div className="text-2xl font-black text-foreground mt-2 font-mono text-emerald-400">
                        ₹{totalFullPaymentDue.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border">
                      Remaining cash balance on direct buy contracts.
                    </p>
                  </div>

                  {/* Down Payment Due (Financed Deals) */}
                  <div className="p-5 rounded-3xl bg-card border border-sky-500/30 shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-xl pointer-events-none" />
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Receipt className="w-4 h-4 text-sky-400" />
                          Down Payment Due (Loan)
                        </span>
                      </div>
                      <div className="text-2xl font-black text-foreground mt-2 font-mono text-sky-400">
                        ₹{totalDownPaymentDue.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border">
                      Required net down payment on bank financed cars.
                    </p>
                  </div>

                  {/* Total Paid to Date */}
                  <div className="p-5 rounded-3xl bg-card border border-amber-500/30 shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-amber-500" />
                        Total Advance Paid
                      </span>
                      <div className="text-2xl font-black text-foreground mt-2 font-mono text-amber-500">
                        ₹{totalAmountPaid.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border">
                      Credited via token advance deposits.
                    </p>
                  </div>

                  {/* Total Outstanding Balance */}
                  <div className="p-5 rounded-3xl bg-card border-2 border-amber-500/50 shadow-md relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/15 rounded-full blur-xl pointer-events-none" />
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          Total Settlement Due
                        </span>
                        {activeDues.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            {activeDues.length} Pending
                          </span>
                        )}
                      </div>
                      <div className="text-2xl font-black text-foreground mt-2 font-mono">
                        ₹{totalAmountDue.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border">
                      {activeDues.length > 0
                        ? 'Payable prior to final showroom delivery release.'
                        : '✓ All vehicle balances cleared and settled.'}
                    </p>
                  </div>
                </div>

                {/* 2. SECTION: OUTSTANDING PAYMENT DUES (LISTED PER VEHICLE) */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                      <h3 className="font-extrabold text-base text-foreground font-display">
                        Active Payment Dues &amp; Settlement Balances
                      </h3>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {activeDues.length} Pending Deal{activeDues.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {activeDues.length === 0 ? (
                    <div className="p-8 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col items-center text-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-foreground text-sm">No Outstanding Dues Pending</h4>
                        <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                          All payments for your contracted vehicles are 100% settled. Your vehicle is cleared for showroom dispatch and delivery handover.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-5">
                      {activeDues.map((sale) => {
                        const vehicle = sale.vehicles || {};
                        const make = vehicle.make || 'Luxury';
                        const model = vehicle.model || 'Automobile';
                        const year = vehicle.manufacture_year || 2023;
                        const reg = vehicle.registration_number || 'TN Registered';
                        const img = vehicle.image_url || 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=600';
                        const branchName = sale.branches?.branch_name || 'CarRevive Hub';
                        const finalAmount = Number(sale.final_amount || sale.selling_price || 0);
                        const deposit = Number(sale.deposit_amount || sale.token_advance || 0);
                        const loanAmt = Number(sale.loan_amount || 0);
                        const isLoan = loanAmt > 0;
                        const totalDown = isLoan ? Math.max(0, finalAmount - loanAmt) : finalAmount;
                        const netDue = isLoan
                          ? Number(sale.net_downpayment_due ?? Math.max(0, totalDown - deposit))
                          : Number(sale.net_full_payment_due ?? Math.max(0, finalAmount - deposit));
                        const percentPaid = finalAmount > 0 ? Math.min(100, Math.round((deposit / finalAmount) * 100)) : 0;
                        const percentDue = 100 - percentPaid;

                        return (
                          <div
                            key={`due-${sale.sale_id}`}
                            className="p-6 rounded-3xl bg-card border-2 border-amber-500/30 hover:border-amber-500/50 transition-all shadow-md flex flex-col gap-5"
                          >
                            {/* Header: Vehicle + Due Amount Highlight */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
                              <div className="flex items-center gap-4">
                                <div className="w-24 h-18 rounded-2xl overflow-hidden bg-secondary flex-shrink-0 border border-border">
                                  <img src={img} alt={model} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-extrabold text-foreground text-lg font-display">
                                      {year} {make} {model}
                                    </h4>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                                      Contract #{sale.sale_id}
                                    </span>
                                    {isLoan ? (
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                                        🏦 Bank Financed Plan
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                        💵 Full Cash Plan
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                                    Reg: {reg} &bull; Hub: {branchName}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-col sm:items-end gap-0.5">
                                <span className="text-[10px] uppercase font-extrabold text-amber-500 tracking-wider">
                                  {isLoan ? 'DOWN PAYMENT DUE' : 'FULL PAYMENT DUE'}
                                </span>
                                <span className="text-3xl font-black text-amber-500 font-mono">
                                  ₹{netDue.toLocaleString('en-IN')}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-semibold">
                                  {isLoan ? `Total Down Required: ₹${totalDown.toLocaleString('en-IN')}` : `Agreed Price: ₹${finalAmount.toLocaleString('en-IN')}`}
                                </span>
                              </div>
                            </div>

                            {/* Informative Progress Bar (Paid vs Due) */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-xs font-bold font-mono">
                                <span className="text-emerald-500 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Token Advance Paid: ₹{deposit.toLocaleString('en-IN')} ({percentPaid}%)
                                </span>
                                <span className="text-amber-500">
                                  {isLoan ? 'Down Payment Due' : 'Balance Due'}: ₹{netDue.toLocaleString('en-IN')} ({percentDue}%)
                                </span>
                              </div>
                              <div className="h-3 w-full bg-secondary rounded-full overflow-hidden flex border border-border">
                                <div
                                  className="h-full bg-emerald-500 transition-all duration-500"
                                  style={{ width: `${percentPaid}%` }}
                                />
                                <div
                                  className="h-full bg-amber-500/80 transition-all duration-500"
                                  style={{ width: `${percentDue}%` }}
                                />
                              </div>
                            </div>

                            {/* Detailed Line Item Accounting Breakdown */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-secondary/40 border border-border text-xs">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground block">On-Road Agreed Price</span>
                                <span className="font-mono font-bold text-foreground text-sm">₹{finalAmount.toLocaleString('en-IN')}</span>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Token Advance Credited</span>
                                <span className="font-mono font-extrabold text-emerald-500 text-sm">₹{deposit.toLocaleString('en-IN')}</span>
                                <span className="text-[9px] text-muted-foreground block">Verified Showroom Receipt</span>
                              </div>
                              {isLoan ? (
                                <>
                                  <div>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Bank Loan Financed</span>
                                    <span className="font-mono font-bold text-sky-400 text-sm">₹{loanAmt.toLocaleString('en-IN')}</span>
                                    <span className="text-[9px] text-muted-foreground block">Status: {sale.loan_status || 'Pending'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Net Down Payment Due</span>
                                    <span className="font-mono font-extrabold text-amber-500 text-sm">₹{netDue.toLocaleString('en-IN')}</span>
                                    <span className="text-[9px] text-muted-foreground block">Down: ₹{totalDown.toLocaleString('en-IN')} - Token</span>
                                  </div>
                                </>
                              ) : (
                                <div className="sm:col-span-2">
                                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Remaining Cash Balance</span>
                                  <span className="font-mono font-extrabold text-amber-500 text-sm">₹{netDue.toLocaleString('en-IN')}</span>
                                  <span className="text-[9px] text-muted-foreground block">To be settled before key handover</span>
                                </div>
                              )}
                            </div>

                            {/* Delivery Gating Notice & Cashier Instructions */}
                            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
                                <Lock className="w-4 h-4 shrink-0" />
                                <div>
                                  <strong className="block font-bold">Delivery Release Protocol</strong>
                                  <span className="text-[11px] text-muted-foreground block">
                                    Showroom vehicle keys and 150-Pt Technical Certificate are released once this balance is recorded by the Branch Manager.
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => setSelectedReceipt(sale)}
                                  className="px-3.5 py-2 rounded-xl bg-card border border-border hover:bg-secondary text-foreground text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                                >
                                  <Receipt className="w-3.5 h-3.5 text-amber-500" />
                                  <span>View Advance Receipt</span>
                                </button>
                                {sale.branches?.phone && (
                                  <a
                                    href={`tel:${sale.branches.phone}`}
                                    className="px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold flex items-center gap-1.5 transition-colors border border-border"
                                  >
                                    <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Call Cashier Desk</span>
                                  </a>
                                )}
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2B. SECTION: DELIVERED & COMPLETED PURCHASES (HANDOVER COMPLETE & DUES CLEARED) */}
                {deliveredPurchases.length > 0 && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <h3 className="font-extrabold text-base text-foreground font-display">
                          Delivered &amp; Handed-Over Vehicles ({deliveredPurchases.length})
                        </h3>
                      </div>
                      <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        100% Cleared &amp; Handed Over
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                      {deliveredPurchases.map((sale) => {
                        const vehicle = sale.vehicles || {};
                        const make = vehicle.make || 'Luxury';
                        const model = vehicle.model || 'Automobile';
                        const year = vehicle.manufacture_year || 2023;
                        const reg = vehicle.registration_number || 'TN Registered';
                        const img = vehicle.image_url || 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=600';
                        const branchName = sale.branches?.branch_name || 'CarRevive Hub';
                        const finalAmount = Number(sale.final_amount || sale.selling_price || 0);
                        const deposit = Number(sale.deposit_amount || sale.token_advance || 0);
                        const loanAmt = Number(sale.loan_amount || 0);
                        const isLoan = loanAmt > 0;
                        const totalDown = isLoan ? Math.max(0, finalAmount - loanAmt) : finalAmount;

                        return (
                          <div
                            key={`delivered-${sale.sale_id}`}
                            className="p-6 rounded-3xl bg-card border-2 border-emerald-500/30 hover:border-emerald-500/50 transition-all shadow-md flex flex-col gap-5"
                          >
                            {/* Header: Vehicle + Delivered Status */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
                              <div className="flex items-center gap-4">
                                <div className="w-24 h-18 rounded-2xl overflow-hidden bg-secondary flex-shrink-0 border border-border">
                                  <img src={img} alt={model} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-extrabold text-foreground text-lg font-display">
                                      {year} {make} {model}
                                    </h4>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-secondary border border-border text-muted-foreground">
                                      Contract #{sale.sale_id}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Sale Completed (Delivered)
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                                    Reg: {reg} &bull; Hub: {branchName}
                                  </p>
                                </div>
                              </div>

                              <div className="text-left sm:text-right">
                                <span className="text-[10px] uppercase font-extrabold text-emerald-400 tracking-wider block">
                                  Final Agreed Value
                                </span>
                                <span className="text-3xl font-black text-foreground font-mono">
                                  ₹{finalAmount.toLocaleString('en-IN')}
                                </span>
                                <span className="text-[10px] text-emerald-500 font-bold block mt-0.5">
                                  ✓ All Payments 100% Settled
                                </span>
                              </div>
                            </div>

                            {/* Line Item Accounting Breakdown */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-secondary/40 border border-border text-xs">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Agreed Contract Price</span>
                                <span className="font-mono font-bold text-foreground text-sm">₹{finalAmount.toLocaleString('en-IN')}</span>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Token Advance Credited</span>
                                <span className="font-mono font-extrabold text-emerald-400 text-sm">₹{Number(sale.token_advance_amount || 50000).toLocaleString('en-IN')}</span>
                                <span className="text-[9px] text-emerald-500/80 block font-medium">Showroom Verified</span>
                              </div>
                              {isLoan ? (
                                <>
                                  <div>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Bank Loan Financed</span>
                                    <span className="font-mono font-bold text-sky-400 text-sm">₹{loanAmt.toLocaleString('en-IN')}</span>
                                    <span className="text-[9px] text-sky-400/80 block font-medium">Status: Sanctioned &amp; Disbursed</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Down Payment Settled</span>
                                    <span className="font-mono font-extrabold text-emerald-400 text-sm">₹{totalDown.toLocaleString('en-IN')}</span>
                                    <span className="text-[9px] text-emerald-500/80 block font-medium">100% Cleared</span>
                                  </div>
                                </>
                              ) : (
                                <div className="sm:col-span-2">
                                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Payment Settlement</span>
                                  <span className="font-mono font-extrabold text-emerald-400 text-sm">₹{finalAmount.toLocaleString('en-IN')}</span>
                                  <span className="text-[9px] text-emerald-500/80 block font-medium">100% Full Cash Settled</span>
                                </div>
                              )}
                            </div>

                            {/* Handover Completed Notice & Actions */}
                            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2.5 text-emerald-400">
                                <ShieldCheck className="w-4 h-4 shrink-0" />
                                <div>
                                  <strong className="block font-bold">Vehicle Delivery Handover Completed</strong>
                                  <span className="text-[11px] text-muted-foreground block">
                                    Showroom vehicle keys, 150-Point Technical PDI Certificate and RTO registration clearance have been handed over to customer.
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => setSelectedReceipt(sale)}
                                  className="px-3.5 py-2 rounded-xl bg-card border border-border hover:bg-secondary text-foreground text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                                >
                                  <Receipt className="w-3.5 h-3.5 text-indigo-400" />
                                  <span>Digital Receipt</span>
                                </button>
                                <button
                                  onClick={() => openWriteReviewModal(sale)}
                                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer shadow-amber-500/20"
                                >
                                  <Star className="w-3.5 h-3.5 fill-slate-950" />
                                  <span>⭐ Review Delivery Experience</span>
                                </button>
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. SECTION: CUSTOMER TRANSACTION REGISTRY (EVERY TRANSACTION DONE LISTED) */}
                <div className="flex flex-col gap-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-indigo-500" />
                      <h3 className="font-extrabold text-base text-foreground font-display">
                        Customer Transactions Registry ({allCustomerTransactions.length})
                      </h3>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Audited by Showroom Branch Manager
                    </span>
                  </div>

                  {allCustomerTransactions.length === 0 ? (
                    <div className="p-8 rounded-3xl bg-card border border-border text-center text-muted-foreground text-xs">
                      No payment transactions recorded for your account yet.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {allCustomerTransactions.map((tx, idx) => {
                        const txRef = tx.transaction_reference || `TXN-REF-${tx.payment_id || idx}`;
                        const amount = Number(tx.amount_paid || tx.deposit_amount || 0);
                        const method = tx.payment_method || 'Bank Transfer';
                        const date = tx.payment_date || tx.created_at || new Date();
                        const car = tx.sales?.vehicles || tx.vehicles || {};
                        const carName = car.make ? `${car.manufacture_year || ''} ${car.make} ${car.model || ''}`.trim() : 'Contracted Vehicle';
                        const reg = car.registration_number || 'Showroom Allotment';
                        const branchName = tx.sales?.branches?.branch_name || 'CarRevive Flagship Hub';
                        const remarks = tx.remarks || (amount >= 500000 ? 'Full Settlement Payment' : 'Token Advance Deposit');
                        const isCopied = copiedTxn === txRef;

                        return (
                          <div
                            key={tx.payment_id || txRef || idx}
                            className="p-5 rounded-2xl bg-card border border-border hover:border-indigo-500/40 transition-all shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                          >
                            {/* Left: Transaction ID, Vehicle, Timestamp */}
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                <CreditCard className="w-5 h-5" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs font-bold text-foreground bg-secondary px-2 py-0.5 rounded-md border border-border">
                                    {txRef}
                                  </span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard?.writeText(txRef);
                                      setCopiedTxn(txRef);
                                      showLocalToast('Transaction reference copied to clipboard!');
                                      setTimeout(() => setCopiedTxn(null), 2000);
                                    }}
                                    className="text-muted-foreground hover:text-foreground text-[10px] p-1 cursor-pointer"
                                    title="Copy reference ID"
                                  >
                                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                  {(() => {
                                    const methodStr = String(method || '').toLowerCase();
                                    const refStr = String(txRef || '').toLowerCase();
                                    const remarksStr = String(remarks || '').toLowerCase();
                                    const isDelivered = String(tx.sales?.delivery_status || '').toLowerCase() === 'delivered';

                                    // 1. Bank Loan Disbursal (Partner Bank Loan Redressal)
                                    if (methodStr.includes('disbursal') || methodStr.includes('bank') || refStr.startsWith('loan')) {
                                      return (
                                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center gap-1">
                                          <Landmark className="w-2.5 h-2.5" />
                                          ✓ Bank Loan Disbursed
                                        </span>
                                      );
                                    }

                                    // 2. Down Payment Settlement or Full Cash Settlement
                                    if (
                                      refStr.startsWith('downpay-settle') || 
                                      refStr.startsWith('cash-settle') || 
                                      methodStr.includes('settlement') || 
                                      remarksStr.includes('settled') || 
                                      remarksStr.includes('remaining') ||
                                      amount >= 200000
                                    ) {
                                      return (
                                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                          <CheckCircle2 className="w-2.5 h-2.5" />
                                          ✓ Balance Settled &amp; Paid
                                        </span>
                                      );
                                    }

                                    // 3. Token Advance / Upfront Deposit
                                    if (isDelivered) {
                                      return (
                                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                          <CheckCircle2 className="w-2.5 h-2.5" />
                                          ✓ Token Advance Credited &bull; Delivered
                                        </span>
                                      );
                                    }

                                    return (
                                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5" />
                                        ✓ Token Advance Credited &bull; Dues Pending
                                      </span>
                                    );
                                  })()}
                                </div>
                                <div className="text-xs font-bold text-foreground">
                                  {carName} &bull; <span className="font-mono text-muted-foreground text-[11px]">{reg}</span>
                                </div>
                                <div className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
                                  <span>{new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                  <span>&bull;</span>
                                  <span>{branchName}</span>
                                  <span>&bull;</span>
                                  <span className="italic">{remarks}</span>
                                </div>
                              </div>
                            </div>

                            {/* Right: Amount Paid + Mode + Receipt Button */}
                            <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-border">
                              <div className="text-left md:text-right">
                                <div className="text-xl font-black text-emerald-500 font-mono">
                                  +₹{amount.toLocaleString('en-IN')}
                                </div>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                                  via {method}
                                </span>
                              </div>

                              <button
                                onClick={() => setSelectedReceipt(tx.sales || tx)}
                                className="px-4 py-2 rounded-xl bg-card border border-border hover:bg-secondary text-foreground text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                              >
                                <Receipt className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Receipt</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )
          ) : activeTab === 'wishlist' ? (
            /* WISHLIST TAB */
            loadingWishlist ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-90 rounded-2xl border border-border bg-card skeleton-shimmer" />
                ))}
              </div>
            ) : wishlistCars.length === 0 ? (
              <div className="text-center py-16 border border-border rounded-2xl bg-card flex flex-col items-center gap-4 shadow-sm">
                <div className="p-4 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
                  <Heart className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground font-display">Your Wishlist is Empty</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    Browse luxury vehicles and click the heart icon to save your favorite cars.
                  </p>
                </div>
                <Link
                  href="/cars"
                  className="px-6 py-3 rounded-xl bg-secondary hover:bg-secondary text-primary-foreground font-bold text-xs transition-all shadow-sm"
                >
                  Explore Inventory
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistCars.map((car, idx) => {
                  const carId = String(car.id || car.vehicle_id || idx);
                  const thumbnail = car.thumbnail || car.image_url || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800';
                  const brand = car.brand || car.make || 'Luxury';
                  const model = car.model || 'Vehicle';
                  const variant = car.variant || car.color || 'Standard';
                  const year = car.year || car.manufacture_year || 2022;
                  const kmDriven = car.kmDriven || car.kilometers_driven || 0;
                  const fuelType = car.fuelType || car.fuel_type || 'Petrol';
                  const ownership = car.ownership || car.owner_type || '1st Owner';
                  const price = car.price ? Number(car.price) : 3950000;
                  const status = car.status || 'Available';
                  const isAvailable = status === 'Available' || status === 'AVAILABLE';

                  return (
                    <Link
                      key={carId}
                      href={`/cars/${carId}`}
                      className={`group rounded-2xl border border-border/90 bg-card overflow-hidden hover:border-border transition-all flex flex-col h-full relative shadow-sm ${
                        !isAvailable ? 'opacity-85' : ''
                      }`}
                    >
                      {/* Status Badge */}
                      {!isAvailable && (
                        <div className="absolute top-3 left-3 z-10 px-3 py-0.5 rounded-full text-[9px] font-bold uppercase bg-rose-600 text-primary-foreground shadow-md">
                          {status}
                        </div>
                      )}

                      {/* Photo Container */}
                      <div className="relative aspect-video w-full overflow-hidden bg-secondary">
                        <img
                          src={thumbnail}
                          alt={`${brand} ${model}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <button
                          onClick={(e) => handleRemoveWishlist(e, carId)}
                          className="absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md shadow-sm transition-all border z-10 bg-card/90 border-border text-rose-500 hover:scale-110"
                        >
                          <Heart className="w-4 h-4" fill="currentColor" />
                        </button>
                        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase backdrop-blur-md bg-secondary/90 text-primary-foreground">
                          {year}
                        </div>
                      </div>

                      {/* Description Box */}
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div>
                            <h3 className="font-extrabold text-base leading-tight text-foreground group-hover:text-foreground transition-colors font-display">
                              {brand} {model}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{variant}</p>
                          </div>
                          <span className="flex-shrink-0 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-foreground border border-border uppercase">
                            {car.transmission || 'Automatic'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 py-3 border-y border-border my-3 text-xs text-muted-foreground">
                          <div>
                            <span className="block text-[9px] uppercase font-bold text-muted-foreground">Driven</span>
                            <span className="font-bold text-foreground font-mono">{kmDriven.toLocaleString()} km</span>
                          </div>
                          <div>
                            <span className="block text-[9px] uppercase font-bold text-muted-foreground">Fuel</span>
                            <span className="font-bold text-foreground">{fuelType}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] uppercase font-bold text-muted-foreground">Owner</span>
                            <span className="font-bold text-foreground">{ownership}</span>
                          </div>
                        </div>

                        <div className="mt-auto flex justify-between items-center pt-2">
                          <span className="text-lg font-black text-foreground font-mono">
                            ₹{price.toLocaleString()}
                          </span>
                          <span className="text-xs font-bold text-foreground hover:text-foreground flex items-center gap-1">
                            View Details &rarr;
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )
          ) : activeTab === 'enquiries' ? (
            /* ENQUIRIES TAB */
            loadingEnquiries ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-32 rounded-2xl border border-border bg-card skeleton-shimmer" />
                ))}
              </div>
            ) : enquiries.length === 0 ? (
              <div className="text-center py-16 border border-border rounded-2xl bg-card flex flex-col items-center gap-4 shadow-sm">
                <div className="p-4 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground font-display">No Vehicle Enquiries Yet</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    Found a car you like? Click &ldquo;Submit Vehicle Enquiry&rdquo; on any car details page to get pricing, finance, and inspection details.
                  </p>
                </div>
                <Link
                  href="/cars"
                  className="px-6 py-3 rounded-xl bg-secondary hover:bg-secondary text-primary-foreground font-bold text-xs transition-all shadow-sm"
                >
                  Browse Available Cars
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {enquiries.map((enq) => {
                  const car = enq.vehicles;
                  const employee = enq.employees;
                  return (
                    <div
                      key={enq.lead_id}
                      className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:border-border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        {car?.image_url ? (
                          <img
                            src={car.image_url}
                            alt={car.make}
                            className="w-20 h-16 object-cover rounded-xl border border-border shrink-0"
                          />
                        ) : (
                          <div className="w-20 h-16 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0 text-muted-foreground">
                            <Car className="w-6 h-6" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-foreground">
                              {car ? `${car.make} ${car.model}` : `Enquiry #${enq.lead_id}`}
                            </h4>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                              enq.status === 'Converted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              enq.status === 'Test Drive Scheduled' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                              enq.status === 'Contacted' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                              enq.status === 'Lost' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                              'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {enq.status || 'New'}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                            <p>Showroom: <strong className="text-foreground">{car?.branches?.branch_name || 'Main Branch'}</strong></p>
                            {employee && (
                              <p>Assigned Advisor: <strong className="text-foreground">{employee.first_name} {employee.last_name || ''}</strong></p>
                            )}
                            <p className="text-[11px] italic text-muted-foreground mt-1">&ldquo;{enq.remarks || 'General enquiry'}&rdquo;</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between sm:justify-center w-full sm:w-auto gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {enq.inquiry_date ? new Date(enq.inquiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                        </span>
                        {car && (
                          <Link
                            href={`/cars/${car.vehicle_id || car.id}`}
                            className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition-all"
                          >
                            View Car →
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : activeTab === 'reviews' ? (
            /* REVIEWS TAB */
            loadingMyReviews ? (
              <div className="space-y-4">
                {[1, 2].map((n) => (
                  <div key={n} className="h-28 rounded-2xl border border-border bg-card skeleton-shimmer" />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Review eligible purchases quick action */}
                {purchases.filter((p: any) => !submittedReviews[String(p.vehicle_id)]).length > 0 && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-500" />
                        <span>Have you purchased a vehicle from CarRevive?</span>
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Share your authentic car purchase ownership review and dealership buying experience.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const firstEligible = purchases[0];
                        if (firstEligible) {
                          setSelectedBookingForReview({
                            vehicles: firstEligible.vehicles,
                            vehicle_id: firstEligible.vehicle_id,
                            branches: firstEligible.branches,
                            sale_id: firstEligible.sale_id,
                          });
                          setIsReviewModalOpen(true);
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm"
                    >
                      Write Purchase Review
                    </button>
                  </div>
                )}

                {myReviews.length === 0 ? (
                  <div className="text-center py-16 border border-border rounded-2xl bg-card flex flex-col items-center gap-4 shadow-sm">
                    <div className="p-4 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                      <Star className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground font-display">No Purchase Reviews Submitted Yet</h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                        Once you purchase a vehicle, you can submit verified ratings and written ownership reviews.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myReviews.map((rev) => (
                      <div
                        key={rev.review_id}
                        className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-sm text-foreground">
                              {rev.vehicles ? `${rev.vehicles.make} ${rev.vehicles.model}` : `Review #${rev.review_id}`}
                            </h4>
                            <div className="flex items-center gap-1 mt-1 text-amber-400">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={14}
                                  className={star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}
                                />
                              ))}
                              <span className="text-xs font-mono font-bold text-foreground ml-1.5">{rev.rating}/5</span>
                            </div>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            rev.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            rev.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {rev.status || 'Pending Moderation'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed italic bg-secondary/30 p-3 rounded-xl border border-border">
                          &ldquo;{rev.comment}&rdquo;
                        </p>
                        <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-1">
                          <span>Verified Customer Review</span>
                          <span>{rev.created_at ? new Date(rev.created_at).toLocaleDateString('en-IN') : 'Recent'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          ) : (
            /* PROFILE TAB */
            loadingProfile ? (
              <div className="p-8 rounded-2xl border border-border bg-card skeleton-shimmer h-80" />
            ) : (
              <div className="max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
                <div className="border-b border-border pb-4">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-sky-400" />
                    <span>Customer Profile &amp; Contact Preferences</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Maintain your registered contact information for test-drive reminders and ownership documents.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-muted-foreground font-bold mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        value={profileForm.first_name} maxLength={50}
                        onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground font-bold mb-1">Last Name</label>
                      <input
                        type="text"
                        value={profileForm.last_name} maxLength={50}
                        onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-muted-foreground font-bold mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={profileForm.phone} maxLength={15} inputMode="tel"
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground font-bold mb-1">Email Address</label>
                      <input
                        type="email"
                        disabled
                        value={profileForm.email || user?.email || ''}
                        className="w-full p-2.5 rounded-xl bg-secondary/50 border border-border text-muted-foreground cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-muted-foreground font-bold mb-1">City</label>
                      <input
                        type="text"
                        value={profileForm.city} maxLength={50}
                        onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                        placeholder="Chennai"
                        className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground font-bold mb-1">State</label>
                      <input
                        type="text"
                        value={profileForm.state} maxLength={50}
                        onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                        placeholder="Tamil Nadu"
                        className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground font-bold mb-1">Pincode</label>
                      <input
                        type="text"
                        value={profileForm.pincode} maxLength={10}
                        onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                        placeholder="600040"
                        className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-muted-foreground font-bold mb-1">Address</label>
                    <input
                      type="text"
                      value={profileForm.address} maxLength={500}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      placeholder="Door no, Street name, Area"
                      className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-muted-foreground font-bold mb-1">Occupation</label>
                      <input
                        type="text"
                        value={profileForm.occupation} maxLength={100}
                        onChange={(e) => setProfileForm({ ...profileForm, occupation: e.target.value })}
                        placeholder="e.g. Software Engineer / Business"
                        className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground font-bold mb-1">Preferred Contact Method</label>
                      <select
                        value={profileForm.preferred_contact}
                        onChange={(e) => setProfileForm({ ...profileForm, preferred_contact: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:border-sky-500"
                      >
                        <option value="Phone">Phone Call</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Email">Email</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex justify-end">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )
          )}
        </div>
      </div>

      {/* INTERACTIVE WRITE CUSTOMER REVIEW MODAL */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-secondary/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-card border border-border rounded-3xl w-full max-w-lg shadow-2xl flex flex-col">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="text-lg font-bold text-foreground font-display">
                  Vehicle Purchase &amp; Ownership Review
                </h3>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-6 flex flex-col gap-5 text-xs">
              <div className="p-4 rounded-xl bg-secondary border border-border">
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Reviewing Purchased Vehicle</div>
                <div className="font-extrabold text-foreground text-sm mt-0.5 font-display">
                  {selectedBookingForReview?.vehicles?.make || selectedBookingForReview?.car?.make || 'Luxury'} {selectedBookingForReview?.vehicles?.model || selectedBookingForReview?.car?.model || 'Vehicle'}
                </div>
              </div>

              {/* STAR RATING SELECTOR */}
              <div className="flex flex-col gap-2 items-center text-center">
                <label className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                  Tap Stars to Select Your Rating
                </label>
                <div className="flex gap-2.5 my-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setReviewRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          (hoverRating || reviewRating) >= star
                            ? 'text-amber-500 fill-amber-500 drop-shadow-sm'
                            : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-amber-600">
                  {reviewRating === 5 ? '5 Stars - Outstanding Vehicle! ⭐⭐⭐⭐⭐' : `${reviewRating} Stars Rating`}
                </span>
              </div>

              {/* REVIEW COMMENT */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                  Your Vehicle Purchase &amp; Ownership Feedback
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewComment} maxLength={2000}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your authentic driving feedback, vehicle performance, condition, and dealership buying satisfaction..."
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground border border-border rounded-xl hover:bg-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-6 py-2.5 text-xs font-bold bg-secondary text-primary-foreground rounded-xl hover:bg-secondary transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish Review ⭐'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIGITAL RECEIPT & CONTRACT MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
          <div className="bg-bg-surface border border-border rounded-lg w-full max-w-xl shadow-lg overflow-hidden print:border-none print:shadow-none print:w-full print:max-w-none print:text-black">
            
            {/* Header */}
            <div className="p-6 bg-bg-surface-alt border-b border-border flex justify-between items-center print:bg-white print:border-b-2 print:border-black">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-bg-surface border border-border flex items-center justify-center text-text-primary print:text-black print:bg-gray-100">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary print:text-black">
                    Sales Agreement &amp; Official Receipt
                  </h3>
                  <p className="text-xs text-text-secondary print:text-gray-600 font-mono">
                    CR-RCPT-2026-{String(selectedReceipt.sale_id).padStart(4, '0')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-neutral text-xs"
                >
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="btn-neutral w-8 h-8 p-0 flex items-center justify-center rounded-lg"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Receipt Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Showroom & Client Info */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border print:border-gray-300">
                <div>
                  <span className="text-xs uppercase font-bold text-text-secondary print:text-gray-600 block">Dealership Showroom</span>
                  <span className="font-bold text-text-primary print:text-black mt-0.5 block">{selectedReceipt.branches?.branch_name || 'CarRevive Chennai'}</span>
                  <span className="text-text-secondary print:text-gray-600 text-xs block">{selectedReceipt.branches?.address || 'Chennai, Tamil Nadu'}</span>
                </div>
                <div>
                  <span className="text-xs uppercase font-bold text-text-secondary print:text-gray-600 block">Purchased By</span>
                  <span className="font-bold text-text-primary print:text-black mt-0.5 block">{user.name}</span>
                  <span className="text-text-secondary print:text-gray-600 text-xs block">{user.email}</span>
                </div>
              </div>

              {/* Vehicle Particulars */}
              <div className="p-4 rounded-lg bg-bg-surface-alt border border-border print:bg-gray-50 print:border-gray-200">
                <span className="text-xs uppercase font-bold text-accent print:text-black block mb-2">Automobile Details</span>
                <div className="flex justify-between items-center font-bold text-text-primary print:text-black text-sm">
                  <span>{selectedReceipt.vehicles?.manufacture_year || 2023} {selectedReceipt.vehicles?.make} {selectedReceipt.vehicles?.model}</span>
                  <span className="font-mono text-text-primary print:text-black font-bold">{selectedReceipt.vehicles?.registration_number || 'TN Registration'}</span>
                </div>
                <div className="text-xs text-text-secondary print:text-gray-600 mt-1">
                  Color: {selectedReceipt.vehicles?.color || 'Standard'} &bull; Fuel: {selectedReceipt.vehicles?.fuel_type || 'Petrol'} &bull; Gearbox: {selectedReceipt.vehicles?.transmission || 'Automatic'}
                </div>
              </div>

              {/* Financial Calculation Sheet */}
              <div className="space-y-2 pt-2 border-t border-border print:border-gray-300">
                <div className="flex justify-between text-text-secondary print:text-black">
                  <span>Showroom Selling Price</span>
                  <span className="font-mono font-bold text-text-primary">₹{Number(selectedReceipt.selling_price || 0).toLocaleString()}</span>
                </div>
                {Number(selectedReceipt.discount || 0) > 0 && (
                  <div className="flex justify-between text-success font-bold">
                    <span>Promotional Dealership Discount</span>
                    <span className="font-mono">-₹{Number(selectedReceipt.discount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-text-secondary print:text-gray-600">
                  <span>GST &amp; RTO Registration Duties</span>
                  <span className="font-mono">Included in Total</span>
                </div>
                <div className="flex justify-between text-text-primary print:text-black text-base font-bold pt-3 border-t border-border print:border-black">
                  <span>Final Net Amount</span>
                  <span className="font-mono text-accent print:text-black font-bold">
                    ₹{Number(selectedReceipt.final_amount || selectedReceipt.selling_price || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Transaction Reference (if opened from transaction) */}
              {selectedReceipt.transaction_reference && (
                <div className="p-3.5 rounded-lg bg-bg-surface-alt border border-border text-xs flex justify-between items-center">
                  <div>
                    <span className="text-xs uppercase font-bold text-text-secondary block">Transaction Reference</span>
                    <span className="font-mono font-bold text-text-primary text-xs">{selectedReceipt.transaction_reference}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs uppercase font-bold text-text-secondary block">Payment Mode</span>
                    <span className="font-bold text-text-primary text-xs">{selectedReceipt.payment_method || 'Bank Transfer'}</span>
                  </div>
                </div>
              )}

              {/* Payments Status */}
              <div className="p-3.5 rounded-lg bg-bg-surface-alt border border-border print:bg-white print:border-gray-300 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-bold text-text-secondary print:text-gray-600 block">Payment Settlement</span>
                  <span className="badge-success text-xs mt-1 inline-block">
                    {selectedReceipt.payment_status || 'Paid in Full'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase font-bold text-text-secondary print:text-gray-600 block">
                    {selectedReceipt.payment_date ? 'Payment Date' : 'Date of Sale'}
                  </span>
                  <span className="font-mono text-xs text-text-primary print:text-black font-bold">
                    {selectedReceipt.payment_date 
                      ? new Date(selectedReceipt.payment_date).toLocaleDateString() 
                      : selectedReceipt.sale_date 
                      ? new Date(selectedReceipt.sale_date).toLocaleDateString() 
                      : 'October 2026'}
                  </span>
                </div>
              </div>

              {/* Dealership Stamp */}
              <div className="text-center pt-2 text-xs text-text-secondary print:text-gray-700 font-mono">
                OFFICIALLY CERTIFIED BY CARREVIVE DEALERSHIP MANAGEMENT &bull; ISO 9001:2015 AUDITED
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-bg-surface-alt border-t border-border flex justify-end print:hidden">
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="btn-primary"
              >
                Close Receipt
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    }>
      <CustomerDashboard />
    </Suspense>
  );
}
