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
  ExternalLink
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

  // Fetch bookings
  const fetchUserBookings = async () => {
    setLoadingBookings(true);
    try {
      const response = await api.get('/bookings');
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to load bookings', error);
      showLocalToast('Could not load bookings.');
    } finally {
      setLoadingBookings(false);
    }
  };

  // Fetch wishlist cars details
  const fetchUserWishlist = async () => {
    setLoadingWishlist(true);
    try {
      const response = await api.get('/wishlist');
      setWishlistCars(response.data);
    } catch (error) {
      console.error('Failed to load wishlist details', error);
      showLocalToast('Could not load wishlist.');
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
      await api.post(`/bookings/${bookingId}/cancel`);
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
    // Refresh local list
    setWishlistCars((prev) => prev.filter((car) => car.id !== carId));
  };

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col gap-8">
      {/* Header Panel */}
      <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Customer Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, <span className="text-foreground font-semibold">{user.name}</span> ({user.email})
          </p>
        </div>
        {user.role === 'ADMIN' && (
          <Link
            href="/admin"
            className="px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/25 text-primary text-xs font-bold hover:bg-primary/20 transition-all flex items-center gap-1.5"
          >
            Go to Admin Dashboard <ExternalLink className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-6 py-3.5 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'bookings'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShoppingBag className="w-4.5 h-4.5" />
          My Test Rides ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('wishlist')}
          className={`px-6 py-3.5 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'wishlist'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Heart className="w-4.5 h-4.5" />
          My Wishlist
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 flex flex-col">
        {activeTab === 'bookings' ? (
          loadingBookings ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2].map((n) => (
                <div key={n} className="h-40 rounded-2xl border border-border bg-card skeleton-shimmer" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-secondary/30 text-muted-foreground">
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-lg">No Test Rides Requested</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  You haven't requested any test rides yet. Explore our listings to request one.
                </p>
              </div>
              <Link
                href="/cars"
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/95 transition-all shadow-md shadow-primary/20"
              >
                Browse Inventory
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {bookings.map((booking) => {
                const car = booking.car;
                const statusStyles = {
                  PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
                  CONFIRMED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                  CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/20',
                };
                const payStyles = {
                  PENDING: 'bg-yellow-500/10 text-yellow-500',
                  PAID: 'bg-emerald-500/10 text-emerald-500',
                  FAILED: 'bg-red-500/10 text-red-500',
                  REFUNDED: 'bg-blue-500/10 text-blue-500',
                };

                return (
                  <div
                    key={booking.id}
                    className="p-5 rounded-2xl border border-border bg-card shadow-sm flex flex-col md:flex-row gap-5 items-stretch md:items-center justify-between"
                  >
                    {/* Car Thumbnail and Info */}
                    <div className="flex gap-4 items-center">
                      <div className="w-24 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0 border border-border">
                        <img src={car.thumbnail} alt={car.model} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <Link href={`/cars/${car.id}`} className="hover:underline">
                          <h3 className="font-bold text-base leading-tight hover:text-primary transition-colors">
                            {car.brand} {car.model}
                          </h3>
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">{car.variant} &bull; {car.year}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-[10px] px-2 py-0.5 rounded border font-bold">
                            {car.transmission}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded border font-bold">
                            {car.fuelType}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Booking Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs border-t md:border-t-0 pt-4 md:pt-0 border-border">
                      <div>
                        <span className="text-[10px] text-muted-foreground block font-medium uppercase tracking-wider">Requested on</span>
                        <span className="font-semibold mt-0.5 block">{new Date(booking.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block font-medium uppercase tracking-wider">Booking Amount</span>
                        <span className="font-bold text-foreground mt-0.5 block">₹{(booking.bookingAmount).toLocaleString()}</span>
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
                        <span className="text-[10px] text-muted-foreground block font-medium uppercase tracking-wider">Status</span>
                        <div className="flex gap-1.5 items-center flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusStyles[booking.bookingStatus as keyof typeof statusStyles]}`}>
                            {booking.bookingStatus}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${payStyles[booking.paymentStatus as keyof typeof payStyles]}`}>
                            {booking.paymentStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Panel */}
                    <div className="flex items-center justify-end border-t md:border-t-0 pt-4 md:pt-0 border-border">
                      {booking.bookingStatus === 'PENDING' ? (
                        <button
                          disabled={cancellingId === booking.id}
                          onClick={() => handleCancelBooking(booking.id)}
                          className="px-4 py-2 text-xs font-semibold text-red-500 border border-red-500/30 rounded-xl bg-red-500/5 hover:bg-red-500/10 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                        >
                          {cancellingId === booking.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Cancelling Request...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-3.5 h-3.5" />
                              Cancel Request
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium select-none">
                          {booking.bookingStatus === 'CONFIRMED' ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              Request Confirmed
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-red-500" />
                              Request Cancelled
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Wishlist Tab */
          loadingWishlist ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-90 rounded-2xl border border-border bg-card skeleton-shimmer" />
              ))}
            </div>
          ) : wishlistCars.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-secondary/30 text-muted-foreground">
                <Heart className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Your Wishlist is Empty</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  Browse cars and click the heart icon to save vehicles you love.
                </p>
              </div>
              <Link
                href="/cars"
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/95 transition-all shadow-md shadow-primary/20"
              >
                Explore Cars
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistCars.map((car) => {
                const isAvailable = car.status === 'AVAILABLE';
                return (
                  <Link
                    key={car.id}
                    href={`/cars/${car.id}`}
                    className={`group rounded-2xl border border-border bg-card overflow-hidden hover-card-trigger flex flex-col h-full relative ${
                      !isAvailable ? 'opacity-85' : ''
                    }`}
                  >
                    {/* Status Badge */}
                    {!isAvailable && (
                      <div className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-red-600 text-white shadow-md">
                        {car.status}
                      </div>
                    )}

                    {/* Photo Container */}
                    <div className="relative aspect-video w-full overflow-hidden bg-secondary">
                      <img
                        src={car.thumbnail}
                        alt={`${car.brand} ${car.model}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <button
                        onClick={(e) => handleRemoveWishlist(e, car.id)}
                        className="absolute top-3 right-3 p-2 rounded-full backdrop-blur-md shadow-md transition-all border z-10 bg-primary border-primary text-primary-foreground"
                      >
                        <Heart className="w-4 h-4" fill="currentColor" />
                      </button>
                      <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase backdrop-blur-md bg-black/55 text-white border border-white/10">
                        {car.year}
                      </div>
                    </div>

                    {/* Description Box */}
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div>
                          <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors">
                            {car.brand} {car.model}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{car.variant}</p>
                        </div>
                        <span className="flex-shrink-0 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase">
                          {car.transmission}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-border/80 my-3 text-xs text-muted-foreground">
                        <div>
                          <span className="block text-[9px] uppercase font-semibold text-muted-foreground/60">Driven</span>
                          <span className="font-semibold text-foreground">{(car.kmDriven).toLocaleString()} km</span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase font-semibold text-muted-foreground/60">Fuel</span>
                          <span className="font-semibold text-foreground">{car.fuelType}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase font-semibold text-muted-foreground/60">Owner</span>
                          <span className="font-semibold text-foreground">{car.ownership}</span>
                        </div>
                      </div>

                      {/* Price and Action */}
                      <div className="flex items-center justify-between mt-auto pt-2">
                        <div>
                          <span className="text-[10px] uppercase text-muted-foreground/60 block leading-none">Price</span>
                          <span className="text-lg font-extrabold text-foreground mt-1 block">
                            ₹{(car.price).toLocaleString()}
                          </span>
                        </div>
                        {isAvailable ? (
                          <div className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            Request Test Ride
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-red-500 uppercase">
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
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <CustomerDashboard />
    </Suspense>
  );
}
