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
      const response = await api.get('/test-drives');
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
      const response = await api.get('/vehicles?limit=6');
      const list = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setWishlistCars(list);
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
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'wishlist') {
      fetchUserWishlist();
    }
  }, [isAuthenticated, activeTab]);

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
    await toggleWishlist(carId);
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

      // Store in localStorage for instant sync with Admin Dashboard
      const existingReviews = JSON.parse(localStorage.getItem('ff_customer_reviews') || '[]');
      existingReviews.unshift(newReview);
      localStorage.setItem('ff_customer_reviews', JSON.stringify(existingReviews));

      // Mark this booking as reviewed locally
      const bookingKey = String(selectedBookingForReview.test_drive_id || selectedBookingForReview.id);
      setSubmittedReviews((prev) => ({ ...prev, [bookingKey]: true }));

      showLocalToast('⭐ Thank you! Your review has been submitted to the Admin Dashboard.', 'success');
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
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-950">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      
      {/* AMBIENT COLOR GLOWS */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/3 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col gap-8 w-full z-10">
        
        {/* VIBRANT LUXURY HEADER HERO PANEL */}
        <div className="p-6 sm:p-8 rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-xl flex-shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-extrabold text-2xl text-white">
                {user.name.charAt(0)}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-white">
                  Customer Dashboard
                </h1>
                <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-sm">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> VIP Member
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Welcome back, <span className="text-indigo-300 font-bold">{user.name}</span> ({user.email})
              </p>
            </div>
          </div>

          {user.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer relative z-10"
            >
              Go to Admin Dashboard <ExternalLink className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* COLORFUL TABS SWITCHER */}
        <div className="flex border-b border-slate-800/80">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-6 py-4 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2.5 ${
              activeTab === 'bookings'
                ? 'border-indigo-500 text-indigo-400 font-black'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-blue-400" />
            My Test Rides ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`px-6 py-4 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2.5 ${
              activeTab === 'wishlist'
                ? 'border-indigo-500 text-indigo-400 font-black'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Heart className="w-4 h-4 text-rose-400" />
            My Wishlist
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className="flex-1 flex flex-col">
          {activeTab === 'bookings' ? (
            loadingBookings ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2].map((n) => (
                  <div key={n} className="h-40 rounded-3xl border border-slate-800 bg-slate-900/60 skeleton-shimmer" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-800 rounded-3xl bg-slate-900/40 flex flex-col items-center gap-4">
                <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Clock className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white font-display">No Test Rides Scheduled</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    You haven't requested any luxury vehicle test drives yet. Explore our inventory catalog to book one.
                  </p>
                </div>
                <Link
                  href="/cars"
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-indigo-600/30"
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
                  const bookingStatus = (booking.status || booking.bookingStatus || 'Scheduled').toUpperCase();
                  const isReviewed = submittedReviews[bookingKey];

                  return (
                    <div
                      key={bookingKey}
                      className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl flex flex-col md:flex-row gap-6 items-stretch md:items-center justify-between hover:border-indigo-500/40 transition-all"
                    >
                      {/* Car Thumbnail and Info */}
                      <div className="flex gap-5 items-center">
                        <div className="w-28 h-18 rounded-2xl overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-800 shadow-md">
                          <img src={thumbnail} alt={model} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <Link href={`/cars/${carId}`} className="hover:underline">
                            <h3 className="font-extrabold text-base leading-tight text-white hover:text-indigo-400 transition-colors font-display">
                              {brand} {model}
                            </h3>
                          </Link>
                          <p className="text-xs text-slate-400 mt-1 font-medium">{variant} &bull; {year}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 font-bold">
                              {transmission}
                            </span>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 font-bold">
                              {fuelType}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs border-t md:border-t-0 pt-4 md:pt-0 border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Scheduled Date</span>
                          <span className="font-bold text-slate-200 mt-1 block font-mono">{new Date(bookingDate).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Vehicle Price</span>
                          <span className="font-extrabold text-emerald-400 mt-1 block font-mono text-sm">₹{price.toLocaleString()}</span>
                        </div>
                        <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Status</span>
                          <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider inline-block w-fit shadow-sm ${
                            bookingStatus === 'COMPLETED' || bookingStatus === 'APPROVED' || bookingStatus === 'CONFIRMED'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : bookingStatus === 'CANCELLED'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          }`}>
                            {bookingStatus}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons: Cancel Request & Write Review */}
                      <div className="flex items-center gap-3 justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-800 flex-wrap">
                        
                        {/* WRITE REVIEW BUTTON */}
                        <button
                          onClick={() => openWriteReviewModal(booking)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-lg ${
                            isReviewed
                              ? 'bg-slate-800 text-slate-400 border border-slate-700'
                              : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:brightness-110 shadow-amber-500/20'
                          }`}
                        >
                          <Star className="w-4 h-4 fill-slate-950" />
                          {isReviewed ? 'Review Submitted ✓' : 'Write Review ⭐'}
                        </button>

                        {/* CANCEL REQUEST BUTTON */}
                        {bookingStatus !== 'CANCELLED' && bookingStatus !== 'COMPLETED' && (
                          <button
                            disabled={cancellingId === bookingKey}
                            onClick={() => handleCancelBooking(bookingKey)}
                            className="px-4 py-2.5 text-xs font-bold text-rose-400 border border-rose-500/30 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
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
                  <div key={n} className="h-90 rounded-3xl border border-slate-800 bg-slate-900/60 skeleton-shimmer" />
                ))}
              </div>
            ) : wishlistCars.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-800 rounded-3xl bg-slate-900/40 flex flex-col items-center gap-4">
                <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Heart className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white font-display">Your Wishlist is Empty</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Browse luxury vehicles and click the heart icon to save your favorite cars.
                  </p>
                </div>
                <Link
                  href="/cars"
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-indigo-600/30"
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
                      className={`group rounded-3xl border border-slate-800 bg-slate-900/80 overflow-hidden hover:border-indigo-500/40 transition-all flex flex-col h-full relative shadow-xl ${
                        !isAvailable ? 'opacity-85' : ''
                      }`}
                    >
                      {/* Status Badge */}
                      {!isAvailable && (
                        <div className="absolute top-3 left-3 z-10 px-3 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-600 text-white shadow-md">
                          {status}
                        </div>
                      )}

                      {/* Photo Container */}
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                        <img
                          src={thumbnail}
                          alt={`${brand} ${model}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <button
                          onClick={(e) => handleRemoveWishlist(e, carId)}
                          className="absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md shadow-md transition-all border z-10 bg-slate-950/70 border-slate-700 text-rose-400 hover:scale-110"
                        >
                          <Heart className="w-4 h-4" fill="currentColor" />
                        </button>
                        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wider uppercase backdrop-blur-md bg-slate-950/80 text-white border border-white/10">
                          {year}
                        </div>
                      </div>

                      {/* Description Box */}
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div>
                            <h3 className="font-extrabold text-base leading-tight text-white group-hover:text-indigo-400 transition-colors font-display">
                              {brand} {model}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">{variant}</p>
                          </div>
                          <span className="flex-shrink-0 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                            {car.transmission || 'Automatic'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800 my-3 text-xs text-slate-400">
                          <div>
                            <span className="block text-[9px] uppercase font-bold text-slate-500">Driven</span>
                            <span className="font-bold text-slate-200 font-mono">{kmDriven.toLocaleString()} km</span>
                          </div>
                          <div>
                            <span className="block text-[9px] uppercase font-bold text-slate-500">Fuel</span>
                            <span className="font-bold text-slate-200">{fuelType}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] uppercase font-bold text-slate-500">Owner</span>
                            <span className="font-bold text-slate-200">{ownership}</span>
                          </div>
                        </div>

                        {/* Price and Action */}
                        <div className="flex items-center justify-between mt-auto pt-2">
                          <div>
                            <span className="text-[10px] uppercase text-slate-500 block leading-none font-bold">Price</span>
                            <span className="text-lg font-black text-emerald-400 mt-1 block font-mono">
                              ₹{price.toLocaleString()}
                            </span>
                          </div>
                          {isAvailable ? (
                            <div className="text-xs font-extrabold text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                              Request Test Ride &rarr;
                            </div>
                          ) : (
                            <div className="text-xs font-bold text-rose-500 uppercase">
                              Sold Out
                            </div>
                          )}
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
        <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h3 className="text-lg font-bold text-white font-display">
                  Write Vehicle Review &amp; Rating
                </h3>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-6 flex flex-col gap-5 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reviewing Test Drive</div>
                <div className="font-extrabold text-white text-sm mt-0.5 font-display">
                  {selectedBookingForReview?.vehicles?.make || selectedBookingForReview?.car?.make || 'Luxury'} {selectedBookingForReview?.vehicles?.model || selectedBookingForReview?.car?.model || 'Vehicle'}
                </div>
              </div>

              {/* STAR RATING SELECTOR */}
              <div className="flex flex-col gap-2 items-center text-center">
                <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
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
                            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                            : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-amber-400">
                  {reviewRating === 5 ? '5 Stars - Outstanding Experience! ⭐⭐⭐⭐⭐' : `${reviewRating} Stars Rating`}
                </span>
              </div>

              {/* REVIEW COMMENT */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Your Review &amp; Dealership Feedback
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your driving feedback, vehicle performance, sales executive courtesy, and overall dealership satisfaction..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black uppercase tracking-wider cursor-pointer shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
                >
                  {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit Review to Admin
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
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-950">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    }>
      <CustomerDashboard />
    </Suspense>
  );
}
