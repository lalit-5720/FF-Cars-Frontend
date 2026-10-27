'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
  Wrench,
  Award,
  Edit,
  MessageSquare,
  X,
  CircleDollarSign,
  Building2,
  MapPin
} from 'lucide-react';
import { VehicleInspectionReportModal } from '../../../components/VehicleInspectionReportModal';

interface CarDetailProps {
  params: Promise<{ id: string }>;
}

export default function CarDetailPage({ params }: CarDetailProps) {
  const router = useRouter();
  
  const { id: carId } = React.use(params);

  const [car, setCar] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isBooking, setIsBooking] = useState(false);
  const [isInspectionOpen, setIsInspectionOpen] = useState(false);
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [enquiryRemarks, setEnquiryRemarks] = useState('');
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);

  // EMI Calculator States
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [tenureMonths, setTenureMonths] = useState(60);
  const annualInterestRate = 8.5;

  const { user, isAuthenticated } = useAuthStore();
  const { toggleWishlist, isWishlisted } = useWishlistStore();

  useEffect(() => {
    const fetchCarDetails = async () => {
      try {
        const response = await api.get(`/vehicles/${carId}`);
        setCar(response.data);

        api.post('/bi/activities', {
          event_type: 'VEHICLE_VIEW',
          vehicle_id: Number(carId),
          branch_id: response.data?.branch_id,
        }).catch(() => null);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 flex flex-col justify-center bg-bg-page text-text-primary">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-96 rounded-lg border border-border bg-bg-surface animate-pulse" />
          <div className="flex flex-col gap-4">
            <div className="h-8 w-1/3 rounded-lg bg-bg-surface-alt animate-pulse" />
            <div className="h-10 w-2/3 rounded-lg bg-bg-surface-alt animate-pulse" />
            <div className="h-32 rounded-lg bg-bg-surface-alt animate-pulse" />
            <div className="h-12 rounded-lg bg-bg-surface-alt animate-pulse mt-auto" />
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

  if (imagesList.length === 0) {
    imagesList = [car.image_url || car.thumbnail || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'];
  }

  const isAvailable = car.status === 'Available' || car.status === 'AVAILABLE';

  let cleanDescription = '';
  let embeddedInspection: any = null;

  if (car.description) {
    if (car.description.includes('<!--INSPECTION_REPORT-->')) {
      const parts = car.description.split('<!--INSPECTION_REPORT-->');
      cleanDescription = parts[0].trim();
      try {
        embeddedInspection = JSON.parse(parts[1].trim());
      } catch (e) {
        // ignore
      }
    } else {
      cleanDescription = car.description.trim();
    }
  }

  const inspectionReport = car.inspectionReport || embeddedInspection;

  const displayDescription = cleanDescription || 
    `This certified ${year} ${make} ${car.model} is presented in immaculate condition, finished in ${car.color || 'original factory finish'} with ${km.toLocaleString()} verified kilometers on the odometer. Powered by an efficient ${fuel} engine paired with a ${car.transmission || 'Manual'} transmission, this ${owner} vehicle delivers an exceptional driving experience. Thoroughly audited across 150 mechanical and electrical checkpoints for optimal performance and safety.`;

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

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showLocalToast('Please login to send an enquiry');
      router.push('/login?redirect=' + encodeURIComponent(`/cars/${carId}`));
      return;
    }
    setIsSubmittingEnquiry(true);
    try {
      await api.post('/leads', {
        vehicle_id: Number(carId),
        remarks: enquiryRemarks || 'Customer interested in this vehicle',
      });
      showLocalToast('Enquiry submitted successfully! A Sales Executive will contact you shortly.', 'success');
      setIsEnquiryModalOpen(false);
      setEnquiryRemarks('');
      router.push('/dashboard?tab=enquiries');
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to submit enquiry', 'error');
    } finally {
      setIsSubmittingEnquiry(false);
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
    <div className="bg-bg-page text-text-primary min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        
        {/* Back button and title bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
          <div>
            <button 
              onClick={() => router.push('/cars')}
              className="flex items-center gap-1.5 helper-text font-bold text-accent hover:underline mb-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Inventory
            </button>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="page-title text-text-primary">
                {make} {car.model}
              </h1>
              <span className="helper-text font-bold">{car.color || car.variant || 'Standard'}</span>
            </div>
            <p className="helper-text mt-0.5">
              Registration: {car.registration_number || 'TN Registration'} &bull; Fully Inspected &amp; Certified
            </p>
            {car.branches && (
              <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-2">
                <Building2 className="w-3.5 h-3.5 text-accent shrink-0" />
                <span className="font-bold text-text-primary">
                  {car.branches.branch_name}
                </span>
                <span className="helper-text">
                  &bull; {car.branches.address ? `${car.branches.address}, ${car.branches.city}` : car.branches.city}
                </span>
              </div>
            )}
            {(user?.role === 'SYSTEM_ADMIN' || user?.role === 'BRANCH_MANAGER') && (
              <div className="mt-2">
                <Link
                  href={`/admin/inventory?editVehicleId=${car.vehicle_id || car.id}`}
                  className="btn-neutral text-xs h-8 px-3"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit in Admin</span>
                </Link>
              </div>
            )}
          </div>

          {/* Pricing & Wishlist */}
          <div className="flex items-center gap-4">
            <div>
              <span className="helper-text uppercase font-bold block">Total Price (GST Incl.)</span>
              <div className="text-2xl font-bold text-text-primary">
                ₹{price.toLocaleString()}
              </div>
            </div>
            <button
              onClick={handleWishlist}
              className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                isWishlisted(String(car.vehicle_id || car.id))
                  ? 'bg-status-danger text-white border-status-danger'
                  : 'border-border bg-bg-surface text-text-secondary hover:text-text-primary'
              }`}
            >
              <Heart className="w-5 h-5" fill={isWishlisted(String(car.vehicle_id || car.id)) ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Main Grid: Images & Booking Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Side: Images & Specs (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Slideshow Display */}
            <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border bg-bg-surface">
              <img
                src={imagesList[activeImageIndex]}
                alt={`${make} ${car.model}`}
                className="w-full h-full object-cover"
              />

              {/* Availability overlay */}
              {!isAvailable && (
                <div className="absolute inset-0 bg-bg-page/70 flex items-center justify-center">
                  <span className="badge badge-danger text-sm px-4 py-1.5">
                    {car.status}
                  </span>
                </div>
              )}

              {/* Navigation buttons */}
              {imagesList.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev === 0 ? imagesList.length - 1 : prev - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-bg-surface border border-border text-text-primary"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev === imagesList.length - 1 ? 0 : prev + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-bg-surface border border-border text-text-primary"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Position indicator */}
              <div className="absolute bottom-3 right-3 badge badge-info">
                {activeImageIndex + 1} / {imagesList.length}
              </div>
            </div>

            {/* Miniature List */}
            {imagesList.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {imagesList.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative flex-shrink-0 w-20 aspect-video rounded-lg overflow-hidden border-2 cursor-pointer ${
                      activeImageIndex === index ? 'border-accent' : 'border-border'
                    }`}
                  >
                    <img src={url} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-lg border border-border bg-bg-surface flex flex-col gap-1">
                <span className="helper-text font-bold uppercase flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-accent" />
                  Year
                </span>
                <span className="body-text font-bold">{year}</span>
              </div>
              <div className="p-4 rounded-lg border border-border bg-bg-surface flex flex-col gap-1">
                <span className="helper-text font-bold uppercase flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-accent" />
                  Driven
                </span>
                <span className="body-text font-bold">{km.toLocaleString()} km</span>
              </div>
              <div className="p-4 rounded-lg border border-border bg-bg-surface flex flex-col gap-1">
                <span className="helper-text font-bold uppercase flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5 text-accent" />
                  Fuel Type
                </span>
                <span className="body-text font-bold">{fuel}</span>
              </div>
              <div className="p-4 rounded-lg border border-border bg-bg-surface flex flex-col gap-1">
                <span className="helper-text font-bold uppercase flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5 text-accent" />
                  Transmission
                </span>
                <span className="body-text font-bold">{car.transmission || 'Manual'}</span>
              </div>
            </div>

            {/* Description Card */}
            <div className="p-6 rounded-lg border border-border bg-bg-surface flex flex-col gap-2">
              <h2 className="section-heading flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                Vehicle Highlights &amp; Condition
              </h2>
              <p className="body-text leading-relaxed whitespace-pre-line text-text-secondary">
                {displayDescription}
              </p>
            </div>

            {/* Inspection Overview */}
            {inspectionReport && (
              <div className="p-6 rounded-lg border border-border bg-bg-surface flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-bg-surface-alt border border-border flex items-center justify-center text-accent shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="section-heading">
                          150-Point Certified Inspection
                        </h2>
                        <span className={`badge ${
                          inspectionReport.isGoodToUse !== false ? 'badge-success' : 'badge-warning'
                        }`}>
                          {inspectionReport.isGoodToUse !== false ? '✓ Good to Use' : 'Needs Review'}
                        </span>
                      </div>
                      <p className="helper-text mt-0.5">
                        Certificate #{inspectionReport.certificateId || 'CR-CERT-2026'} &bull; {inspectionReport.inspectorName || 'Certified Lead Inspector'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="helper-text uppercase block">Score</span>
                      <span className="body-text font-bold">
                        {inspectionReport.overallScore !== undefined ? `${inspectionReport.overallScore}/100` : 'Pending'}
                      </span>
                    </div>
                    <span className="badge badge-info">
                      {inspectionReport.certificationTier || 'Gold Certified'}
                    </span>
                  </div>
                </div>

                {inspectionReport.remarks && (
                  <div className="p-3 rounded-lg bg-bg-surface-alt border border-border helper-text text-text-primary flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      &ldquo;{inspectionReport.remarks}&rdquo;
                    </p>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setIsInspectionOpen(true)}
                    className="btn-secondary"
                  >
                    <Award className="w-4 h-4" />
                    <span>View Inspection Checklist</span>
                  </button>
                </div>
              </div>
            )}

            {/* Specifications Sheet */}
            <div className="p-6 rounded-lg border border-border bg-bg-surface">
              <h2 className="section-heading mb-4">Complete Specifications</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 text-xs">
                <div className="flex justify-between py-2.5 border-b border-border">
                  <span className="helper-text">Make</span>
                  <span className="body-text font-bold">{make}</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-border">
                  <span className="helper-text">Model</span>
                  <span className="body-text font-bold">{car.model}</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-border">
                  <span className="helper-text">Color</span>
                  <span className="body-text font-bold">{car.color || 'Standard'}</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-border">
                  <span className="helper-text">Ownership History</span>
                  <span className="body-text font-bold">{owner}</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-border">
                  <span className="helper-text">Transmission</span>
                  <span className="body-text font-bold">{car.transmission || 'Manual'}</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-border">
                  <span className="helper-text">Fuel Type</span>
                  <span className="body-text font-bold">{fuel}</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-border">
                  <span className="helper-text">Manufacture Year</span>
                  <span className="body-text font-bold">{year}</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-border">
                  <span className="helper-text">Odometer reading</span>
                  <span className="body-text font-bold">{km.toLocaleString()} km</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-border sm:col-span-2">
                  <span className="helper-text">Showroom Location</span>
                  <span className="body-text font-bold text-accent">
                    {car.branches ? `${car.branches.branch_name} (${car.branches.city})` : 'CarRevive Showroom'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Booking Panel & EMI Calculator (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-20">
            
            {/* Booking Card */}
            <div className="p-6 rounded-lg bg-bg-surface border border-border flex flex-col gap-4">
              <h2 className="section-heading">Request a Test Drive</h2>
              <p className="helper-text">
                Experience this vehicle in person. Schedule your showroom appointment with our dealership team.
              </p>

              {/* Inspection Quick Button */}
              <button
                onClick={() => setIsInspectionOpen(true)}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-bg-surface-alt hover:border-accent transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-accent shrink-0" />
                  <div>
                    <div className="body-text font-bold text-xs">150-Point Inspection Report</div>
                    <div className="helper-text">
                      {car.inspectionReport?.certificationTier || 'Certified Quality'} &bull; {car.inspectionReport?.overallScore || 92}/100
                    </div>
                  </div>
                </div>
                <span className="helper-text font-bold text-accent">&rarr;</span>
              </button>

              {/* Submit Enquiry */}
              {isAvailable && (
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      showLocalToast('Please login to send an enquiry');
                      router.push('/login?redirect=' + encodeURIComponent(`/cars/${carId}`));
                      return;
                    }
                    setIsEnquiryModalOpen(true);
                  }}
                  className="btn-neutral w-full"
                >
                  <MessageSquare className="w-4 h-4 text-accent" />
                  <span>Submit Vehicle Enquiry</span>
                </button>
              )}

              {/* Book Test Drive */}
              <button
                onClick={handleBooking}
                disabled={!isAvailable || isBooking}
                className="btn-primary w-full"
              >
                {isBooking ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : isAvailable ? (
                  'Request Test Drive'
                ) : car.status === 'Reserved' ? (
                  'Currently Reserved'
                ) : (
                  'Currently Sold Out'
                )}
              </button>

              {isAvailable && (
                <span className="helper-text text-status-success font-bold text-center block">
                  &bull; Live availability verified
                </span>
              )}
            </div>

            {/* EMI Estimator Card */}
            <div className="p-6 rounded-lg border border-border bg-bg-surface flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="section-heading text-sm flex items-center gap-1.5">
                  <CircleDollarSign className="w-4 h-4 text-accent" />
                  EMI Loan Estimator
                </h3>
                <span className="badge badge-info text-[10px]">
                  8.5% PA
                </span>
              </div>

              {/* Slider 1: Down Payment */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between helper-text">
                  <span>Down Payment ({downPaymentPct}%)</span>
                  <span className="body-text font-bold">₹{downPayment.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  step="5"
                  value={downPaymentPct}
                  onChange={(e) => setDownPaymentPct(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-bg-surface-alt rounded-lg cursor-pointer"
                />
                <div className="flex justify-between helper-text text-[10px]">
                  <span>10% (₹{(car.price * 0.1).toLocaleString()})</span>
                  <span>90% (₹{(car.price * 0.9).toLocaleString()})</span>
                </div>
              </div>

              {/* Slider 2: Tenure */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between helper-text">
                  <span>Loan Tenure</span>
                  <span className="body-text font-bold">{tenureMonths} Months ({tenureMonths / 12} Yrs)</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="84"
                  step="12"
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-bg-surface-alt rounded-lg cursor-pointer"
                />
                <div className="flex justify-between helper-text text-[10px]">
                  <span>12 Months</span>
                  <span>84 Months</span>
                </div>
              </div>

              {/* EMI Output */}
              <div className="p-4 rounded-lg bg-bg-surface-alt border border-border flex flex-col items-center justify-center text-center">
                <span className="helper-text uppercase font-bold">Estimated Monthly Payment</span>
                <div className="page-title text-text-primary mt-1">
                  ₹{emi.toLocaleString()} <span className="helper-text font-normal">/mo</span>
                </div>
                <p className="helper-text mt-1">
                  On loan principal of ₹{loanPrincipal.toLocaleString()} for {tenureMonths} months.
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* 150-Point Certified Inspection Certificate Modal */}
      <VehicleInspectionReportModal
        car={car}
        isOpen={isInspectionOpen}
        onClose={() => setIsInspectionOpen(false)}
        onUpdated={(updatedCar) => setCar(updatedCar)}
      />

      {/* Vehicle Enquiry Modal */}
      {isEnquiryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md rounded-lg bg-bg-surface border border-border p-6 shadow-sm text-text-primary">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="section-heading text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-accent" />
                <span>Enquire: {make} {car?.model}</span>
              </h3>
              <button
                onClick={() => setIsEnquiryModalOpen(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEnquirySubmit} className="flex flex-col gap-4 text-xs">
              <div>
                <p className="helper-text mb-2">
                  Have questions about pricing, vehicle condition, loan eligibility, or visiting <strong>{car?.branches?.branch_name || 'Showroom'}</strong>? Submit your enquiry below:
                </p>

                <textarea
                  rows={4}
                  required
                  value={enquiryRemarks}
                  onChange={(e) => setEnquiryRemarks(e.target.value)}
                  placeholder="e.g. I am interested in viewing this vehicle in person, negotiating terms, and exploring finance options..."
                  className="w-full p-3 rounded-lg bg-bg-surface border border-border text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEnquiryModalOpen(false)}
                  className="btn-neutral"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEnquiry}
                  className="btn-primary"
                >
                  {isSubmittingEnquiry ? 'Submitting...' : 'Submit Enquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
