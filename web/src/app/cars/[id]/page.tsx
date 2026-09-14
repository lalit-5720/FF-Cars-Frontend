'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../store/useAuthStore';
import { useWishlistStore } from '../../../store/useWishlistStore';
import { showLocalToast } from '../../../components/Toast';
import { 
  Heart, 
  ShieldCheck, 
  Calendar, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Fuel, 
  Gauge, 
  Briefcase, 
  UserCheck, 
  Wrench,
  HelpCircle,
  TrendingUp,
  CircleDollarSign
} from 'lucide-react';

interface CarDetailProps {
  params: Promise<{ id: string }>;
}

export default function CarDetailPage({ params }: CarDetailProps) {
  const router = useRouter();
  
  // Unwrap params using React.use
  const { id: carId } = React.use(params);

  const [car, setCar] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isBooking, setIsBooking] = useState(false);

  // EMI Calculator States
  const [downPaymentPct, setDownPaymentPct] = useState(20); // 20% default
  const [tenureMonths, setTenureMonths] = useState(60);     // 5 years default
  const annualInterestRate = 8.5; // 8.5% fixed

  const { user, isAuthenticated } = useAuthStore();
  const { toggleWishlist, isWishlisted } = useWishlistStore();

  useEffect(() => {
    const fetchCarDetails = async () => {
      try {
        const response = await api.get(`/vehicles/${carId}`);
        setCar(response.data);
      } catch (error: any) {
        console.error('Failed to load car details', error);
        showLocalToast('Error: Car not found');
        router.push('/cars');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCarDetails();
  }, [carId, router]);

  // Real-time Availability Sync
  useEffect(() => {
    const handleAvailabilityChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { carId: updatedCarId, status } = customEvent.detail;
      if (updatedCarId === carId) {
        setCar((prevCar: any) => prevCar ? { ...prevCar, status } : null);
        if (status !== 'AVAILABLE') {
          showLocalToast('This car has just been booked or is no longer available.', 'error');
        }
      }
    };

    window.addEventListener('car_availability_changed', handleAvailabilityChange);
    return () => {
      window.removeEventListener('car_availability_changed', handleAvailabilityChange);
    };
  }, [carId]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="h-[400px] rounded-3xl border border-border bg-card skeleton-shimmer" />
          <div className="flex flex-col gap-6">
            <div className="h-8 w-1/3 rounded bg-secondary skeleton-shimmer" />
            <div className="h-12 w-2/3 rounded bg-secondary skeleton-shimmer" />
            <div className="h-32 rounded bg-secondary skeleton-shimmer" />
            <div className="h-16 rounded bg-secondary skeleton-shimmer mt-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!car) return null;

  const make = car.make || car.brand || 'Vehicle';
  const year = car.manufacture_year || car.year || 2022;
  const km = car.kilometers_driven || car.kmDriven || 0;
  const fuel = car.fuel_type || car.fuelType || 'Petrol';
  const owner = car.owner_type || car.ownership || '1st Owner';
  const price = car.price ? Number(car.price) : 0;

  // Process Images Json array
  let imagesList: string[] = [];
  try {
    if (typeof car.images === 'string') {
      imagesList = JSON.parse(car.images);
    } else if (Array.isArray(car.images)) {
      imagesList = car.images;
    }
  } catch (e) {
    imagesList = [];
  }

  // Include thumbnail/image_url as primary option if empty
  if (imagesList.length === 0) {
    imagesList = [car.image_url || car.thumbnail || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'];
  }

  const isAvailable = car.status === 'Available' || car.status === 'AVAILABLE';

  // EMI Calculator logic
  const downPayment = Math.round((price * downPaymentPct) / 100);
  const loanPrincipal = price - downPayment;
  const monthlyRate = annualInterestRate / 12 / 100;
  const emi = loanPrincipal > 0
    ? Math.round(
        (loanPrincipal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1)
      )
    : 0;

  const handleBooking = async () => {
    if (!isAuthenticated) {
      showLocalToast('Please login to request a test ride');
      router.push('/login?redirect=' + encodeURIComponent(`/cars/${carId}`));
      return;
    }

    setIsBooking(true);
    try {
      await api.post('/test-drives', {
        customer_id: user?.id ? Number(user.id) : undefined,
        vehicle_id: Number(carId),
      });
      showLocalToast('Test Ride Request submitted successfully!', 'success');
      router.push('/dashboard');
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to request test ride.';
      showLocalToast(errMsg, 'error');
    } finally {
      setIsBooking(false);
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      showLocalToast('Please log in to add to wishlist');
      router.push('/login');
      return;
    }
    const added = await toggleWishlist(String(car.vehicle_id || car.id), user?.email);
    showLocalToast(added ? 'Added to wishlist!' : 'Removed from wishlist.');
  };

  return (
    <div className="bg-background text-foreground min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col gap-8">
        
        {/* Back button and title info */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <button 
              onClick={() => router.push('/cars')}
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground mb-2 group transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to Inventory
            </button>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-3xl font-display font-extrabold tracking-tight text-foreground">
                {make} {car.model}
              </h1>
              <span className="text-muted-foreground text-sm font-semibold">{car.color || car.variant || 'Standard'}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-sans">
              Registration: {car.registration_number || 'TN Registration'} &bull; Fully Inspected &amp; Certified
            </p>
          </div>

          {/* Wishlist Button and Pricing */}
          <div className="flex items-center gap-6 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 pt-4 sm:pt-0 border-border">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Price (GST Incl.)</span>
              <div className="text-3xl font-black text-foreground font-mono mt-0.5">
                ₹{price.toLocaleString()}
              </div>
            </div>
            <button
              onClick={handleWishlist}
              className={`p-3 rounded-full border transition-all cursor-pointer ${
                isWishlisted(String(car.vehicle_id || car.id))
                  ? 'bg-rose-500 border-rose-500 text-foreground shadow-sm'
                  : 'border-border bg-card text-foreground hover:bg-secondary'
              }`}
            >
              <Heart className="w-5 h-5" fill={isWishlisted(String(car.vehicle_id || car.id)) ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

      {/* Main Grid: Images & Booking Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Images Slideshow & Specs (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Slideshow Display */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-border bg-background/40 group">
            <img
              src={imagesList[activeImageIndex]}
              alt={`${make} ${car.model} image`}
              className="w-full h-full object-cover select-none"
            />

            {/* Availability overlay */}
            {!isAvailable && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center backdrop-blur-xs select-none">
                <span className="px-6 py-3 border border-red-500 rounded-xl bg-red-950/70 text-red-400 font-display font-extrabold tracking-widest text-lg uppercase shadow-xl">
                  {car.status}
                </span>
              </div>
            )}

            {/* Left and Right navigation buttons */}
            {imagesList.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIndex((prev) => (prev === 0 ? imagesList.length - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full backdrop-blur-md bg-background/40 text-foreground hover:bg-background/60 border border-white/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveImageIndex((prev) => (prev === imagesList.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full backdrop-blur-md bg-background/40 text-foreground hover:bg-background/60 border border-white/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Position indicator */}
            <div className="absolute bottom-4 right-4 px-3 py-1 rounded bg-background/50 text-[10px] font-bold text-foreground border border-white/10 select-none">
              {activeImageIndex + 1} / {imagesList.length}
            </div>
          </div>

          {/* Miniature List */}
          {imagesList.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {imagesList.map((url, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImageIndex(index)}
                  className={`relative flex-shrink-0 w-24 aspect-video rounded-lg overflow-hidden border-2 transition-all bg-secondary ${
                    activeImageIndex === index ? 'border-primary' : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <img src={url} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Highlights & Features Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl border border-border/90 bg-card flex flex-col gap-1.5 shadow-sm">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                Year
              </span>
              <span className="font-extrabold text-foreground">{year}</span>
            </div>
            <div className="p-4 rounded-2xl border border-border/90 bg-card flex flex-col gap-1.5 shadow-sm">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-amber-600" />
                Driven
              </span>
              <span className="font-extrabold text-foreground">{km.toLocaleString()} km</span>
            </div>
            <div className="p-4 rounded-2xl border border-border/90 bg-card flex flex-col gap-1.5 shadow-sm">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Fuel className="w-3.5 h-3.5 text-amber-600" />
                Fuel Type
              </span>
              <span className="font-extrabold text-foreground">{fuel}</span>
            </div>
            <div className="p-4 rounded-2xl border border-border/90 bg-card flex flex-col gap-1.5 shadow-sm">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-amber-600" />
                Gearbox
              </span>
              <span className="font-extrabold text-foreground">{car.transmission || 'Manual'}</span>
            </div>
          </div>

          {/* Description Card */}
          <div className="p-6 rounded-2xl border border-border/90 bg-card shadow-sm flex flex-col gap-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 font-display">
              <Sparkles className="w-5 h-5 text-amber-600" />
              Dealer Description
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line font-sans">
              {car.description || "No description provided for this vehicle."}
            </p>
          </div>

          {/* Specs Details Sheet */}
          <div className="p-6 rounded-2xl border border-border/90 bg-card shadow-sm">
            <h2 className="text-base font-bold text-foreground mb-4 font-display">Complete Specifications Sheet</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-xs font-sans">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Make</span>
                <span className="font-bold text-foreground">{make}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Model</span>
                <span className="font-bold text-foreground">{car.model}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Color</span>
                <span className="font-bold text-foreground">{car.color || 'Standard'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Ownership History</span>
                <span className="font-bold text-foreground">{owner}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Transmission Type</span>
                <span className="font-bold text-foreground">{car.transmission || 'Manual'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Fuel Type</span>
                <span className="font-bold text-foreground">{fuel}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Manufacture Year</span>
                <span className="font-bold text-foreground">{year}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Odometer reading</span>
                <span className="font-bold text-foreground">{km.toLocaleString()} km</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Booking Panel & EMI Calculator (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24">
          
          {/* REFERENCE MATCH HERO BOOKING CARD (DARK OBSIDIAN) */}
          <div className="p-7 rounded-3xl bg-[#0F172A] text-foreground shadow-xl flex flex-col gap-4">
            <h2 className="text-lg font-extrabold font-display">Request a Test Ride</h2>
            <p className="text-xs text-muted-foreground leading-relaxed font-sans">
              Experience this luxury vehicle firsthand. Schedule your personalized test ride concierge appointment.
            </p>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/90 border border-border text-emerald-400">
              <ShieldCheck className="w-5 h-5 flex-shrink-0" />
              <div className="text-[11px] font-bold leading-normal font-sans">
                Inspected &bull; Doorstep Delivery &bull; Certified
              </div>
            </div>

            <button
              onClick={handleBooking}
              disabled={!isAvailable || isBooking}
              className={`w-full py-3.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isAvailable
                  ? 'bg-card text-foreground hover:bg-secondary shadow-md'
                  : 'bg-secondary text-muted-foreground cursor-not-allowed'
              }`}
            >
              {isBooking ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Submitting Request...
                </>
              ) : isAvailable ? (
                'Request Test Ride'
              ) : (
                'Currently Sold Out'
              )}
            </button>

            {isAvailable && (
              <span className="text-[10px] text-center text-emerald-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                &bull; Live availability verified
              </span>
            )}
          </div>

          {/* Live Finance EMI Estimator Card */}
          <div className="p-6 rounded-2xl border border-border/90 bg-card shadow-sm flex flex-col gap-5 text-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2 text-foreground font-display">
                <CircleDollarSign className="w-4.5 h-4.5 text-amber-600" />
                EMI Loan Estimator
              </h3>
              <span className="text-[10px] font-bold text-foreground bg-secondary border border-border px-2.5 py-0.5 rounded-full">
                8.5% fixed PA
              </span>
            </div>

            {/* Slider 1: Down Payment Percentage */}
            <div className="flex flex-col gap-2 font-sans">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Down Payment ({downPaymentPct}%)</span>
                <span className="text-foreground font-mono font-bold">₹{downPayment.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={downPaymentPct}
                onChange={(e) => setDownPaymentPct(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-slate-900 focus:outline-none"
              />
              <div className="flex justify-between text-[9px] text-muted-foreground font-medium">
                <span>10% (₹{(car.price * 0.1).toLocaleString()})</span>
                <span>90% (₹{(car.price * 0.9).toLocaleString()})</span>
              </div>
            </div>

            {/* Slider 2: Tenure Months */}
            <div className="flex flex-col gap-2 font-sans">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Loan Tenure</span>
                <span className="text-foreground font-bold">{tenureMonths} Months ({tenureMonths / 12} Yrs)</span>
              </div>
              <input
                type="range"
                min="12"
                max="84"
                step="12"
                value={tenureMonths}
                onChange={(e) => setTenureMonths(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-slate-900 focus:outline-none"
              />
              <div className="flex justify-between text-[9px] text-muted-foreground font-medium">
                <span>12 Months</span>
                <span>84 Months</span>
              </div>
            </div>

            {/* Calculation output */}
            <div className="p-4 rounded-xl bg-secondary border border-border flex flex-col items-center justify-center text-center gap-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Estimated Monthly Payment</span>
              <div className="text-2xl font-black text-foreground font-mono">
                ₹{emi.toLocaleString()} <span className="text-xs text-muted-foreground font-normal">/mo</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px] leading-tight">
                Calculated on loan principal of ₹{loanPrincipal.toLocaleString()} for {tenureMonths} months.
              </p>
            </div>
          </div>

        </div>

      </div>
      </div>
    </div>
  );
}
