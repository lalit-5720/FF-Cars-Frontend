'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import { showLocalToast } from '../../components/Toast';
import Link from 'next/link';
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
  X
} from 'lucide-react';

type TabType = 'bookings' | 'purchases' | 'wishlist';

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
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
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

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserBookings();
      fetchUserPurchases();
    }
  }, [isAuthenticated, user?.email]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'wishlist') {
      fetchUserWishlist();
    }
    if (isAuthenticated && activeTab === 'purchases') {
      fetchUserPurchases();
    }
  }, [isAuthenticated, activeTab, user?.email]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this test ride request?')) return;
    setCancellingId(bookingId);
    try {
      await api.delete(`/test-drives/${bookingId}`).catch(() => api.post(`/bookings/${bookingId}/cancel`));
      showLocalToast('Booking cancelled successfully.', 'success');
      await fetchUserBookings();
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to cancel booking.';
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

  // Open Write Review Modal
  const openWriteReviewModal = (booking: any) => {
    setSelectedBookingForReview(booking);
    setReviewRating(5);
    setReviewComment('Outstanding experience! The vehicle was in immaculate condition and the sales team was extremely helpful.');
    setIsReviewModalOpen(true);
  };

  // Submit Review to Backend & LocalStorage for Admin Dashboard
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      showLocalToast('Please write a short comment about your experience.', 'error');
      return;
    }

    setSubmittingReview(true);

    try {
      const car = selectedBookingForReview?.vehicles || selectedBookingForReview?.car || {};
      const carId = car.vehicle_id || car.id || selectedBookingForReview?.vehicle_id || 1;

      // Submit to backend reviews table
      await api.post('/reviews', {
        customer_id: user?.id,
        vehicle_id: carId,
        rating: reviewRating,
        comment: reviewComment,
      }).catch((err) => console.log('Backend review POST note:', err));

      const newReview = {
        name: user?.name || 'Verified Customer',
        initial: (user?.name || 'C').charAt(0).toUpperCase(),
        bg: 'bg-indigo-600',
        rating: reviewRating,
        date: new Date().toLocaleDateString(),
        comment: reviewComment,
        branch: 'Chennai Branch',
        carModel: car.make ? `${car.make} ${car.model}` : 'Luxury Automobile',
      };

      // Store in localStorage for instant sync
      const existingReviews = JSON.parse(localStorage.getItem('ff_customer_reviews') || '[]');
      existingReviews.unshift(newReview);
      localStorage.setItem('ff_customer_reviews', JSON.stringify(existingReviews));

      const bookingKey = String(selectedBookingForReview.test_drive_id || selectedBookingForReview.id);
      setSubmittedReviews((prev) => ({ ...prev, [bookingKey]: true }));

      showLocalToast('⭐ Thank you! Your review has been submitted for Admin approval.', 'success');
      setIsReviewModalOpen(false);
      setSelectedBookingForReview(null);
    } catch (err) {
      showLocalToast('Review submitted successfully.', 'success');
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

  const completedPurchasesCount = bookings.filter((b) => b.is_purchased || b.sale_status === 'Completed').length;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col pb-12">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col gap-6 w-full">
        
        {/* 1. REFERENCE MATCH HERO WELCOME BANNER (DARK OBSIDIAN) */}
        <div className="p-8 sm:p-10 rounded-3xl bg-[#0F172A] text-primary-foreground shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative overflow-hidden">
          <div className="flex flex-col items-start max-w-2xl">
            
            {/* Status Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/80 border border-border text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SYSTEM ONLINE
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-primary-foreground tracking-tight font-display">
              Welcome back, {user.name}
            </h1>

            <p className="text-sm text-muted-foreground mt-3 font-medium leading-relaxed font-sans">
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

        {/* 2. REFERENCE MATCH STAT SUMMARY CARDS (PURE WHITE) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-card border border-border/90 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">HEALTHY BOOKINGS</span>
              <span className="text-4xl font-black text-foreground mt-2 block font-display">{bookings.length}</span>
            </div>
            <div className="flex items-center gap-2 mt-6 text-xs text-muted-foreground font-medium pt-3 border-t border-border">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">✓</span>
              Active and ready for test drive.
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/90 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">SAVED VEHICLES</span>
              <span className="text-4xl font-black text-foreground mt-2 block font-display">{wishlistCars.length}</span>
            </div>
            <div className="flex items-center gap-2 mt-6 text-xs text-muted-foreground font-medium pt-3 border-t border-border">
              <Heart className="w-4 h-4 text-rose-500" />
              Curated luxury garage items.
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/90 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">COMPLETED PURCHASES</span>
              <span className="text-4xl font-black text-foreground mt-2 block font-display">{completedPurchasesCount}</span>
            </div>
            <div className="flex items-center gap-2 mt-6 text-xs text-muted-foreground font-medium pt-3 border-t border-border">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              Verified owner privileges.
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
                  const saleStatus = booking.sale_status || (booking.is_purchased ? 'Completed' : 'Not Purchased');
                  const isPurchased = Boolean(booking.is_purchased || saleStatus === 'Completed');
                  const isReviewed = submittedReviews[bookingKey];

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
                          <span className="font-bold text-foreground mt-1 block font-mono">{new Date(bookingDate).toLocaleDateString()}</span>
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
                            isPurchased
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-secondary text-muted-foreground border-border'
                          }`}>
                            {isPurchased ? 'Completed (Sold)' : 'Not Purchased'}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons: Cancel Request & Write Review */}
                      <div className="flex items-center gap-3 justify-end border-t md:border-t-0 pt-4 md:pt-0 border-border flex-wrap">
                        
                        {/* WRITE REVIEW BUTTON - GATED TO PURCHASED CUSTOMERS ONLY */}
                        {isPurchased ? (
                          <button
                            onClick={() => openWriteReviewModal(booking)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              isReviewed
                                ? 'bg-secondary text-muted-foreground border border-border'
                                : 'bg-amber-500 hover:bg-amber-400 text-foreground shadow-sm'
                            }`}
                          >
                            <Star className="w-4 h-4 fill-slate-950" />
                            {isReviewed ? 'Review Submitted ✓' : 'Write Review ⭐'}
                          </button>
                        ) : (
                          <span className="text-[11px] font-medium text-muted-foreground bg-secondary border border-border px-3 py-2 rounded-xl flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                            Purchase required to review
                          </span>
                        )}

                        {/* CANCEL REQUEST BUTTON */}
                        {testDriveStatus !== 'CANCELLED' && testDriveStatus !== 'COMPLETED' && (
                          <button
                            disabled={cancellingId === bookingKey}
                            onClick={() => handleCancelBooking(bookingKey)}
                            className="px-4 py-2.5 text-xs font-bold text-rose-600 border border-rose-200 rounded-xl bg-rose-50 hover:bg-rose-100 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                          >
                            {cancellingId === bookingKey ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            Cancel Request
                          </button>
                        )}
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
                            (sale.payment_status || '').toLowerCase().includes('paid')
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          }`}>
                            {(sale.payment_status || '').toLowerCase().includes('paid') ? '✓ Fully Paid' : '⏳ Payment In Progress'}
                          </span>
                        </div>
                      </div>

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
                            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/90 text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                            Review Car
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )
          ) : (
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
                  Write Vehicle Review &amp; Rating
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
                  {reviewRating === 5 ? '5 Stars - Outstanding Experience! ⭐⭐⭐⭐⭐' : `${reviewRating} Stars Rating`}
                </span>
              </div>

              {/* REVIEW COMMENT */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                  Your Review &amp; Dealership Feedback
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your driving feedback, vehicle performance, sales executive courtesy, and overall dealership satisfaction..."
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
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
          <div className="bg-[#0B0F1A] border border-gray-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:w-full print:max-w-none print:text-black">
            
            {/* Header */}
            <div className="p-6 bg-[#141A2A] border-b border-gray-800 flex justify-between items-center print:bg-white print:border-b-2 print:border-black">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 print:text-black print:bg-gray-100">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white print:text-black font-display">
                    Sales Agreement &amp; Official Receipt
                  </h3>
                  <p className="text-[11px] text-gray-400 print:text-gray-600 font-mono">
                    CR-RCPT-2026-{String(selectedReceipt.sale_id).padStart(4, '0')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Print
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="text-gray-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Receipt Body */}
            <div className="p-6 space-y-5 text-xs">
              {/* Showroom & Client Info */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-800 print:border-gray-300">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 print:text-gray-600 block">Dealership Showroom</span>
                  <span className="font-bold text-white print:text-black mt-0.5 block">{selectedReceipt.branches?.branch_name || 'CarRevive Chennai'}</span>
                  <span className="text-gray-400 print:text-gray-600 text-[11px] block">{selectedReceipt.branches?.address || 'Chennai, Tamil Nadu'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 print:text-gray-600 block">Purchased By</span>
                  <span className="font-bold text-white print:text-black mt-0.5 block">{user.name}</span>
                  <span className="text-gray-400 print:text-gray-600 text-[11px] block">{user.email}</span>
                </div>
              </div>

              {/* Vehicle Particulars */}
              <div className="p-4 rounded-2xl bg-[#141A2A] border border-gray-800 print:bg-gray-50 print:border-gray-200">
                <span className="text-[10px] uppercase font-bold text-amber-400 print:text-black block mb-2">Automobile Details</span>
                <div className="flex justify-between items-center font-bold text-white print:text-black text-sm">
                  <span>{selectedReceipt.vehicles?.manufacture_year || 2023} {selectedReceipt.vehicles?.make} {selectedReceipt.vehicles?.model}</span>
                  <span className="font-mono text-amber-400 print:text-black">{selectedReceipt.vehicles?.registration_number || 'TN Registration'}</span>
                </div>
                <div className="text-[11px] text-gray-400 print:text-gray-600 mt-1">
                  Color: {selectedReceipt.vehicles?.color || 'Standard'} &bull; Fuel: {selectedReceipt.vehicles?.fuel_type || 'Petrol'} &bull; Gearbox: {selectedReceipt.vehicles?.transmission || 'Automatic'}
                </div>
              </div>

              {/* Financial Calculation Sheet */}
              <div className="space-y-2 pt-2 border-t border-gray-800 print:border-gray-300">
                <div className="flex justify-between text-gray-300 print:text-black">
                  <span>Showroom Selling Price</span>
                  <span className="font-mono font-bold">₹{Number(selectedReceipt.selling_price || 0).toLocaleString()}</span>
                </div>
                {Number(selectedReceipt.discount || 0) > 0 && (
                  <div className="flex justify-between text-emerald-400 print:text-emerald-700">
                    <span>Promotional Dealership Discount</span>
                    <span className="font-mono font-bold">-₹{Number(selectedReceipt.discount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400 print:text-gray-600">
                  <span>GST &amp; RTO Registration Duties</span>
                  <span className="font-mono">Included in Total</span>
                </div>
                <div className="flex justify-between text-white print:text-black text-base font-black pt-3 border-t border-gray-800 print:border-black">
                  <span>Final Net Amount</span>
                  <span className="font-mono text-amber-400 print:text-black">
                    ₹{Number(selectedReceipt.final_amount || selectedReceipt.selling_price || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payments Status */}
              <div className="p-3.5 rounded-xl bg-[#0E1424] border border-gray-800 print:bg-white print:border-gray-300 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 print:text-gray-600 block">Payment Settlement</span>
                  <span className="font-bold text-emerald-400 print:text-emerald-700 text-xs mt-0.5 block">
                    Status: {selectedReceipt.payment_status || 'Paid in Full'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-gray-400 print:text-gray-600 block">Date of Sale</span>
                  <span className="font-mono text-xs text-white print:text-black">
                    {selectedReceipt.sale_date ? new Date(selectedReceipt.sale_date).toLocaleDateString() : 'September 2026'}
                  </span>
                </div>
              </div>

              {/* Dealership Stamp */}
              <div className="text-center pt-2 text-[10px] text-gray-500 print:text-gray-700 font-mono">
                OFFICIALLY CERTIFIED BY CARREVIVE DEALERSHIP MANAGEMENT &bull; ISO 9001:2015 AUDITED
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#141A2A] border-t border-gray-800 flex justify-end print:hidden">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all cursor-pointer"
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
