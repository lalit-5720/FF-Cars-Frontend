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
  ShieldCheck
} from 'lucide-react';

type TabType = 'bookings' | 'wishlist';

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
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
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
    }
  }, [isAuthenticated, user?.email]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'wishlist') {
      fetchUserWishlist();
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
        <div className="flex gap-2 border-b border-border pb-3">
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
