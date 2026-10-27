'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../services/api';
import { 
  ShieldCheck, 
  Calendar, 
  Zap, 
  ArrowRight, 
  Heart, 
  Star, 
  MapPin, 
  Scale, 
  Sparkles, 
  CarFront, 
  CheckCircle2, 
  Calculator, 
  ChevronDown, 
  ChevronUp, 
  Phone, 
  Clock, 
  Award, 
  Search, 
  FileText, 
  RefreshCw,
  Building2,
  Check
} from 'lucide-react';
import { useWishlistStore } from '../store/useWishlistStore';
import { useAuthStore } from '../store/useAuthStore';
import { useCompareStore } from '../store/useCompareStore';
import { CarComparisonDrawer } from '../components/CarComparisonDrawer';
import { showLocalToast } from '../components/Toast';
import { AiCarMatchmakerModal } from '../components/AiCarMatchmakerModal';
import { CarReviveIcon } from '../components/CarReviveIcon';
import { SellCarValuationModal } from '../components/SellCarValuationModal';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=1200';

const FAQS = [
  {
    q: 'How comprehensive is the CarRevive 150-Point Roadworthiness Inspection?',
    a: 'Every vehicle undergoes a standardized 150-point audit conducted by certified master technicians. It covers mechanical components (engine compression, transmission, clutch), electrical systems (ECU diagnostics, battery health), structural integrity (zero-flood, zero-chassis damage), and comprehensive cosmetic detailing. You receive a digital copy of the roadworthiness certificate before booking.',
  },
  {
    q: 'What is included in the 1-Year Pan-India Warranty?',
    a: 'Our complimentary 1-year warranty covers major engine parts, transmission and gearbox, drive axles, electrical systems, and air conditioning. It is backed by 24/7 roadside assistance (towing, battery jumpstart, flat-tire assistance) valid across India.',
  },
  {
    q: 'How does the 7-Day / 500 km Money-Back Guarantee work?',
    a: 'If you are not completely satisfied with your certified pre-owned car within 7 days or 500 km of delivery (whichever comes first), simply bring it back to any of our showrooms for a 100% refund of the vehicle purchase price with no questions asked.',
  },
  {
    q: 'Can I get doorstep delivery and test drives in Chennai or Coimbatore?',
    a: 'Yes. You can schedule a complimentary doorstep test drive at your home or office. Upon purchase, we offer sanitized white-glove doorstep delivery along with complete on-spot documentation.',
  },
  {
    q: 'Do you facilitate RC ownership transfer and financing?',
    a: 'We manage 100% of the RTO ownership transfer and RC documentation directly with zero hassle for you. We also partner with leading banks (HDFC, ICICI, SBI, Axis) to offer up to 100% on-road financing with competitive interest rates starting from 8.5%.',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [publishedReviews, setPublishedReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [featuredTab, setFeaturedTab] = useState<'all' | 'under7' | 'suv' | 'automatic'>('all');
  const [heroShowcaseIndex, setHeroShowcaseIndex] = useState(0);

  // Quick Hero Search State
  const [searchMake, setSearchMake] = useState('ALL');
  const [searchBudget, setSearchBudget] = useState('ALL');
  const [searchFuel, setSearchFuel] = useState('ALL');

  // Interactive EMI Calculator State
  const [emiPrice, setEmiPrice] = useState(1000000);
  const [emiDownPayment, setEmiDownPayment] = useState(200000);
  const [emiTenureMonths, setEmiTenureMonths] = useState(48);
  const [emiInterestRate, setEmiInterestRate] = useState(9.5);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Valuation Input State
  const [valuationReg, setValuationReg] = useState('');
  const [isValuationModalOpen, setIsValuationModalOpen] = useState(false);

  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const { addToCompare, removeFromCompare, isInCompare } = useCompareStore();
  const { user, isAuthenticated } = useAuthStore();

  // 1. Fetch Dynamic Inventory from Database
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await api.get('/vehicles');
        const list = Array.isArray(response.data) ? response.data : (response.data.data || []);
        setAllVehicles(list);
        if (list.length > 0) {
          const medianIndex = Math.floor(list.length / 2);
          const medianCar = list[medianIndex];
          if (medianCar && medianCar.price) {
            const p = Number(medianCar.price);
            setEmiPrice(p);
            setEmiDownPayment(Math.round(p * 0.2));
          }
        }
      } catch (error) {
        console.error('Failed to fetch vehicles', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  // 2. Fetch Dynamic Showroom Branches from Database
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await api.get('/branches');
        const list = Array.isArray(response.data) ? response.data : (response.data.data || []);
        setBranches(list);
      } catch (error) {
        console.error('Failed to fetch branches', error);
      }
    };
    fetchBranches();
  }, []);

  // 3. Fetch Dynamic Published Reviews from Database
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await api.get('/reviews/published');
        const list = Array.isArray(response.data) ? response.data : (response.data.data || []);
        setPublishedReviews(list);
      } catch (error) {
        console.error('Failed to fetch published reviews', error);
        setPublishedReviews([]);
      }
    };
    fetchReviews();
  }, []);

  // Top Showcase Cars for the Hero Section (Derived dynamically from database vehicles)
  const showcaseCars = useMemo(() => {
    if (allVehicles.length === 0) return [];
    return [...allVehicles].sort((a, b) => Number(b.price || 0) - Number(a.price || 0)).slice(0, 3);
  }, [allVehicles]);

  const activeShowcaseCar = showcaseCars[heroShowcaseIndex] || allVehicles[0] || null;

  // Dynamically compute body categories and lowest live price from current vehicle fleet
  const dynamicBodyCategories = useMemo(() => {
    const suvs = allVehicles.filter(v => {
      const m = `${v.make} ${v.model}`.toLowerCase();
      return m.includes('innova') || m.includes('creta') || m.includes('nexon') || m.includes('xuv') || m.includes('seltos') || m.includes('ecosport');
    });
    const sedans = allVehicles.filter(v => {
      const m = `${v.make} ${v.model}`.toLowerCase();
      return m.includes('city') || m.includes('virtus') || m.includes('sedan') || m.includes('verna') || m.includes('ciaz');
    });
    const hatchbacks = allVehicles.filter(v => {
      const m = `${v.make} ${v.model}`.toLowerCase();
      return m.includes('swift') || m.includes('i20') || m.includes('baleno') || m.includes('polo') || m.includes('kwid');
    });
    const automatics = allVehicles.filter(v => (v.transmission || '').toLowerCase().includes('auto'));

    const getMinPriceStr = (list: any[]) => {
      if (list.length === 0) return '₹0';
      const min = Math.min(...list.map(v => Number(v.price || 0)));
      return `₹${min.toLocaleString('en-IN')}`;
    };

    return [
      {
        title: 'SUVs & Crossovers',
        type: 'SUV',
        count: `${suvs.length} Available`,
        starting: getMinPriceStr(suvs),
        icon: '🚙',
        desc: 'Commanding stance, spacious 5-7 seaters'
      },
      {
        title: 'Executive Sedans',
        type: 'Sedan',
        count: `${sedans.length} Available`,
        starting: getMinPriceStr(sedans),
        icon: '🚗',
        desc: 'Plush cabin, highway cruising efficiency'
      },
      {
        title: 'City Hatchbacks',
        type: 'Hatchback',
        count: `${hatchbacks.length} Available`,
        starting: getMinPriceStr(hatchbacks),
        icon: '🚘',
        desc: 'Agile city commuters, top fuel mileage'
      },
      {
        title: 'Automatic Fleet',
        type: 'Automatic',
        count: `${automatics.length} Available`,
        starting: getMinPriceStr(automatics),
        icon: '⚡',
        desc: 'Clutch-free effortless urban mobility'
      },
    ];
  }, [allVehicles]);

  // Filtered Inventory based on active tab
  const filteredInventory = useMemo(() => {
    if (allVehicles.length === 0) return [];
    if (featuredTab === 'under7') {
      return allVehicles.filter(v => Number(v.price || 0) <= 700000);
    }
    if (featuredTab === 'suv') {
      return allVehicles.filter(v => {
        const m = `${v.make} ${v.model}`.toLowerCase();
        return m.includes('innova') || m.includes('creta') || m.includes('nexon') || m.includes('xuv') || m.includes('seltos') || m.includes('ecosport');
      });
    }
    if (featuredTab === 'automatic') {
      return allVehicles.filter(v => (v.transmission || '').toLowerCase().includes('auto'));
    }
    return allVehicles.slice(0, 6);
  }, [allVehicles, featuredTab]);

  // Unique Makes for Hero search selector derived dynamically from vehicles
  const availableMakes = useMemo(() => {
    const set = new Set<string>();
    allVehicles.forEach(v => {
      if (v.make) set.add(v.make);
    });
    return Array.from(set).sort();
  }, [allVehicles]);

  // Handle Hero Search Trigger
  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchMake !== 'ALL') params.set('make', searchMake);
    if (searchBudget === 'UNDER_6L') params.set('maxPrice', '600000');
    if (searchBudget === '6L_TO_10L') {
      params.set('minPrice', '600000');
      params.set('maxPrice', '1000000');
    }
    if (searchBudget === 'ABOVE_10L') params.set('minPrice', '1000000');
    if (searchFuel !== 'ALL') params.set('fuelType', searchFuel);
    router.push(`/cars?${params.toString()}`);
  };

  // EMI Calculation
  const { emiMonthly, loanPrincipal, totalInterest, totalRepayment } = useMemo(() => {
    const principal = Math.max(0, emiPrice - emiDownPayment);
    const monthlyRate = emiInterestRate / (12 * 100);
    const emi = principal > 0 && emiTenureMonths > 0
      ? Math.round((principal * monthlyRate * Math.pow(1 + monthlyRate, emiTenureMonths)) / (Math.pow(1 + monthlyRate, emiTenureMonths) - 1))
      : 0;
    const repayment = emi * emiTenureMonths;
    const interest = Math.max(0, repayment - principal);
    return {
      emiMonthly: emi,
      loanPrincipal: principal,
      totalInterest: interest,
      totalRepayment: repayment,
    };
  }, [emiPrice, emiDownPayment, emiTenureMonths, emiInterestRate]);

  const handleWishlistToggle = async (e: React.MouseEvent, carId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      showLocalToast('Please log in to save vehicles to your wishlist.');
      router.push('/login');
      return;
    }
    const added = await toggleWishlist(carId, user?.email);
    showLocalToast(added ? 'Saved to your wishlist' : 'Removed from wishlist');
  };

  const handleValuationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsValuationModalOpen(true);
  };

  return (
    <div className="flex flex-col flex-1 bg-bg-page text-text-primary">

      {/* ── 1. HERO SECTION ── */}
      <section className="relative border-b border-border bg-bg-surface py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

          {/* Left Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-status-info bg-status-info-bg text-text-primary text-xs font-bold self-start">
              <CarReviveIcon size={16} variant="flat" />
              <span>Certified Pre-Owned Automotive Dealership</span>
            </div>

            {/* Main Headline */}
            <div>
              <h1 className="page-title text-2xl sm:text-3xl font-bold text-text-primary leading-tight">
                Quality Certified Pre-Owned Vehicles You Can Trust
              </h1>
              <div className="mt-2.5 h-1 w-20 bg-accent rounded-full" />
            </div>

            {/* Subtitle with dynamic counts */}
            <p className="body-text text-text-secondary leading-relaxed">
              Explore {allVehicles.length} hand-picked, certified pre-owned vehicles across our {branches.length} showrooms 
              with transparent fixed pricing, 150-point inspection certificates, 1-year comprehensive warranty, and a 7-day money-back guarantee.
            </p>

            {/* Showroom Location Badges (Fetched Dynamically from Database) */}
            <div className="flex flex-wrap gap-2 pt-1">
              {branches.map((b) => (
                <div
                  key={b.branch_id || b.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-bg-surface-alt text-xs font-bold text-text-primary"
                  title={b.address ? `${b.address}, ${b.city}` : b.city}
                >
                  <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>{b.branch_name}</span>
                </div>
              ))}
            </div>

            {/* Interactive Hero Quick Car Search Box */}
            <div className="rounded-xl border border-border bg-bg-surface-alt p-4 mt-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-accent" />
                  Find Your Certified Vehicle
                </span>
                <span className="helper-text font-bold text-accent">
                  {allVehicles.length} Vehicles In Showrooms
                </span>
              </div>

              <form onSubmit={handleHeroSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="helper-text block mb-1">Make / Brand</label>
                  <select
                    value={searchMake}
                    onChange={(e) => setSearchMake(e.target.value)}
                    className="w-full text-xs font-bold rounded-lg border border-border bg-bg-surface p-2 text-text-primary focus:border-accent"
                  >
                    <option value="ALL">All Brands ({availableMakes.length})</option>
                    {availableMakes.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="helper-text block mb-1">Budget Range</label>
                  <select
                    value={searchBudget}
                    onChange={(e) => setSearchBudget(e.target.value)}
                    className="w-full text-xs font-bold rounded-lg border border-border bg-bg-surface p-2 text-text-primary focus:border-accent"
                  >
                    <option value="ALL">All Budgets</option>
                    <option value="UNDER_6L">Under ₹6 Lakhs</option>
                    <option value="6L_TO_10L">₹6L - ₹10 Lakhs</option>
                    <option value="ABOVE_10L">₹10 Lakhs & Above</option>
                  </select>
                </div>

                <div>
                  <label className="helper-text block mb-1">Fuel Type</label>
                  <select
                    value={searchFuel}
                    onChange={(e) => setSearchFuel(e.target.value)}
                    className="w-full text-xs font-bold rounded-lg border border-border bg-bg-surface p-2 text-text-primary focus:border-accent"
                  >
                    <option value="ALL">All Fuel Types</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="btn-primary w-full text-xs font-bold h-9 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5 shrink-0" />
                    <span>Search Fleet</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Quick Actions Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/cars" className="btn-primary">
                <span>Browse All Inventory</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => setIsQuizOpen(true)}
                className="btn-secondary"
              >
                <Sparkles className="w-4 h-4 text-accent" />
                <span>AI Car Matchmaker</span>
              </button>
              <Link href="/register" className="btn-neutral">
                <span>Register Account</span>
              </Link>
            </div>

            {/* Certified Stats Counters (Dynamic from Database) */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
              <div>
                <span className="block text-2xl font-bold text-text-primary">{allVehicles.length}</span>
                <span className="helper-text block mt-0.5">Available In Stock</span>
              </div>
              <div>
                <span className="block text-2xl font-bold text-text-primary">{branches.length}</span>
                <span className="helper-text block mt-0.5">Showroom Branches</span>
              </div>
              <div>
                <span className="block text-2xl font-bold text-status-success">{allVehicles.length > 0 ? '100%' : '0%'}</span>
                <span className="helper-text block mt-0.5">150-Pt Inspected</span>
              </div>
            </div>

          </div>

          {/* Right Column (5 cols): Dynamic Showcase Switcher */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-md rounded-xl border border-border bg-bg-surface p-5 shadow-sm">
              
              {/* Showcase Tabs */}
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <span className="badge badge-warning">
                  Showroom Highlight
                </span>
                <div className="flex gap-1.5">
                  {showcaseCars.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setHeroShowcaseIndex(idx)}
                      className={`h-7 px-2.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                        heroShowcaseIndex === idx
                          ? 'bg-accent text-accent-text'
                          : 'bg-bg-surface-alt text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Vehicle 0{idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {activeShowcaseCar ? (
                <>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="section-heading text-text-primary font-bold">
                        {activeShowcaseCar.make} {activeShowcaseCar.model}
                      </h3>
                      <p className="helper-text mt-0.5">
                        {activeShowcaseCar.color ? `${activeShowcaseCar.color} • ` : ''}{activeShowcaseCar.transmission || 'Certified Transmission'}
                      </p>
                    </div>
                    {activeShowcaseCar.manufacture_year && (
                      <span className="badge badge-info">
                        {activeShowcaseCar.manufacture_year}
                      </span>
                    )}
                  </div>

                  {/* Showcase Image with Fallback */}
                  <div className="relative w-full rounded-lg overflow-hidden aspect-video bg-bg-surface-alt border border-border mb-3.5">
                    <img
                      src={activeShowcaseCar.image_url || FALLBACK_IMG}
                      alt={`${activeShowcaseCar.make} ${activeShowcaseCar.model}`}
                      onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5 badge badge-success flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>150-Point Certified</span>
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 badge badge-info">
                      Available Now
                    </div>
                  </div>

                  {/* Specs Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center mb-3.5">
                    <div className="p-2 rounded-lg bg-bg-surface-alt border border-border">
                      <span className="helper-text uppercase block">Driven</span>
                      <span className="body-text font-bold text-xs block truncate mt-0.5">
                        {activeShowcaseCar.kilometers_driven != null
                          ? `${Number(activeShowcaseCar.kilometers_driven).toLocaleString('en-IN')} km`
                          : 'Certified'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-bg-surface-alt border border-border">
                      <span className="helper-text uppercase block">Fuel</span>
                      <span className="body-text font-bold text-xs block truncate mt-0.5">
                        {activeShowcaseCar.fuel_type || 'Verified'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-bg-surface-alt border border-border">
                      <span className="helper-text uppercase block">Owner</span>
                      <span className="body-text font-bold text-xs block truncate mt-0.5">
                        {activeShowcaseCar.owner_type || 'Verified'}
                      </span>
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div>
                      <span className="helper-text block">Listing Price</span>
                      <span className="text-xl font-bold text-text-primary block">
                        ₹{Number(activeShowcaseCar.price || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <Link
                      href={`/cars/${activeShowcaseCar.vehicle_id || activeShowcaseCar.id}`}
                      className="btn-primary"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center helper-text">Loading showcase vehicles...</div>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* ── 2. TRUST ASSURANCE TICKER STRIP ── */}
      <section className="border-b border-border bg-bg-surface-alt py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-text-primary">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
              <span>150-Point Roadworthiness Audit</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
              <span>1-Year Comprehensive Warranty</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-status-info shrink-0" />
              <span>7-Day / 500 km Return Guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-status-warning shrink-0" />
              <span>Free Paperless RC Ownership Transfer</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. EXPLORE BY VEHICLE CATEGORY (DYNAMICALLY COMPUTED COUNTS & PRICES) ── */}
      <section className="py-14 border-b border-border bg-bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-8">
            <div>
              <span className="badge badge-info mb-1.5">Curated Categories</span>
              <h2 className="section-heading text-xl font-bold text-text-primary">
                Browse Certified Vehicles By Body Style
              </h2>
              <p className="helper-text mt-1">
                Choose the silhouette that suits your lifestyle, family needs, and daily commute.
              </p>
            </div>
            <Link href="/cars" className="btn-secondary text-xs h-8">
              <span>View All Body Types</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dynamicBodyCategories.map((cat) => (
              <div
                key={cat.title}
                onClick={() => router.push(`/cars?type=${encodeURIComponent(cat.type)}`)}
                className="p-5 rounded-xl border border-border bg-bg-surface-alt hover:border-accent transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="text-3xl mb-3">{cat.icon}</div>
                  <h3 className="section-heading text-base font-bold text-text-primary mb-1">
                    {cat.title}
                  </h3>
                  <p className="helper-text mb-3">{cat.desc}</p>
                </div>
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <span className="badge badge-info text-[11px]">{cat.count}</span>
                  <span className="text-xs font-bold text-accent">From {cat.starting}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── 4. FEATURED SHOWROOM INVENTORY (WITH TABBED FILTERS) ── */}
      <section className="py-16 bg-bg-page border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <span className="badge badge-success mb-1">Live Showroom Inventory</span>
              <h2 className="section-heading text-xl font-bold text-text-primary">
                Hand-Picked Certified Fleet
              </h2>
              <p className="helper-text mt-0.5">
                Every vehicle has completed 150-point inspection and is ready for immediate delivery.
              </p>
            </div>

            <Link href="/cars" className="btn-secondary">
              <span>View All {allVehicles.length} Vehicles</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {[
              { id: 'all', label: `All Certified (${allVehicles.length})` },
              { id: 'under7', label: 'Budget Friendly (< ₹7 Lakhs)' },
              { id: 'suv', label: 'SUVs & Crossovers' },
              { id: 'automatic', label: 'Automatic Transmission' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFeaturedTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                  featuredTab === tab.id
                    ? 'bg-accent text-accent-text border-accent'
                    : 'bg-bg-surface text-text-secondary border-border hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Vehicle Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="rounded-xl h-96 bg-bg-surface border border-border animate-pulse" />
              ))}
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-border bg-bg-surface">
              <p className="body-text text-text-secondary">
                No vehicles matching this filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredInventory.map((car) => {
                const id = car.vehicle_id || car.id;
                const make = car.make || car.brand;
                const image = car.image_url || FALLBACK_IMG;
                const year = car.manufacture_year;
                const km = car.kilometers_driven != null ? `${Number(car.kilometers_driven).toLocaleString('en-IN')} km` : 'Certified KM';
                const fuel = car.fuel_type || 'Verified';
                const owner = car.owner_type || 'Verified';
                const price = Number(car.price || 0);

                // Branch Lookup dynamically from branches state
                const matchedBranch = branches.find(b => (b.branch_id || b.id) === car.branch_id);

                return (
                  <div
                    key={id}
                    className="flex flex-col h-full rounded-xl border border-border bg-bg-surface overflow-hidden shadow-xs hover:border-accent transition-all"
                  >
                    {/* Image Area */}
                    <div className="relative aspect-video w-full bg-bg-surface-alt border-b border-border">
                      <img
                        src={image}
                        alt={`${make} ${car.model}`}
                        onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                        className="w-full h-full object-cover"
                      />

                      {/* Wishlist & Compare Buttons */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (isInCompare(String(id))) {
                              removeFromCompare(String(id));
                              showLocalToast('Removed from comparison');
                            } else {
                              addToCompare({ id: String(id), ...car });
                              showLocalToast('Added to comparison');
                            }
                          }}
                          className={`btn-icon w-8 h-8 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                            isInCompare(String(id))
                              ? 'bg-accent text-accent-text border-accent'
                              : 'bg-bg-surface border-border text-text-secondary hover:text-text-primary'
                          }`}
                          title={isInCompare(String(id)) ? 'Remove from Compare' : 'Add to Compare'}
                        >
                          <Scale className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleWishlistToggle(e, String(id))}
                          className={`btn-icon w-8 h-8 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                            isWishlisted(String(id))
                              ? 'bg-status-danger text-white border-status-danger'
                              : 'bg-bg-surface border-border text-text-secondary hover:text-text-primary'
                          }`}
                          title="Save to Wishlist"
                        >
                          <Heart
                            className="w-3.5 h-3.5"
                            fill={isWishlisted(String(id)) ? 'currentColor' : 'none'}
                          />
                        </button>
                      </div>

                      {/* Badges on image */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                        <span className="badge badge-info">{year}</span>
                        <span className="badge badge-success">Available</span>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2.5">
                          <div>
                            <h3 className="section-heading text-base font-bold text-text-primary">
                              {make} {car.model}
                            </h3>
                            <p className="helper-text mt-0.5">
                              {car.color ? `${car.color} • ` : ''}{car.transmission || 'Certified Transmission'}
                            </p>
                          </div>
                          {car.transmission && (
                            <span className="badge badge-info text-[11px]">
                              {car.transmission}
                            </span>
                          )}
                        </div>

                        {/* Specs Row */}
                        <div className="grid grid-cols-3 gap-2 py-2.5 my-2 border-y border-border text-xs">
                          <div>
                            <span className="helper-text uppercase block text-[10px]">Driven</span>
                            <span className="body-text font-bold text-xs block truncate mt-0.5">
                              {km}
                            </span>
                          </div>
                          <div>
                            <span className="helper-text uppercase block text-[10px]">Fuel</span>
                            <span className="body-text font-bold text-xs block truncate mt-0.5">
                              {fuel}
                            </span>
                          </div>
                          <div>
                            <span className="helper-text uppercase block text-[10px]">Owner</span>
                            <span className="body-text font-bold text-xs block truncate mt-0.5">
                              {owner}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-text-secondary mt-2">
                          <Building2 className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span className="truncate">
                            {matchedBranch ? matchedBranch.branch_name : 'CarRevive Showroom'}
                          </span>
                        </div>
                      </div>

                      {/* Price & Action */}
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-border">
                        <div>
                          <span className="helper-text block text-[10px]">Fixed Price</span>
                          <span className="text-lg font-bold text-text-primary block">
                            ₹{price.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <Link
                          href={`/cars/${id}`}
                          className="btn-primary text-xs h-8 px-3.5"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </section>

      {/* ── 5. INTERACTIVE CAR LOAN & EMI CALCULATOR ── */}
      <section className="py-16 bg-bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-10">
            <span className="badge badge-info mb-1.5">Financial Transparency</span>
            <h2 className="section-heading text-xl font-bold text-text-primary">
              Interactive Car Loan & Monthly EMI Calculator
            </h2>
            <p className="helper-text mt-1 max-w-xl mx-auto">
              Plan your budget with precision. Adjust vehicle price, down payment, loan tenure, and interest rate.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-2xl border border-border bg-bg-surface-alt p-6 sm:p-8">
            
            {/* Left Controls (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Vehicle Price Slider */}
              <div>
                <div className="flex justify-between items-center mb-1.5 text-xs">
                  <span className="font-bold text-text-primary">Vehicle Price</span>
                  <span className="font-bold text-accent text-sm">₹{emiPrice.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min={400000}
                  max={2500000}
                  step={25000}
                  value={emiPrice}
                  onChange={(e) => {
                    const newPrice = Number(e.target.value);
                    setEmiPrice(newPrice);
                    if (emiDownPayment >= newPrice) setEmiDownPayment(Math.round(newPrice * 0.2));
                  }}
                  className="w-full accent-accent cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-text-secondary mt-1">
                  <span>₹4,00,000</span>
                  <span>₹25,00,000</span>
                </div>
              </div>

              {/* Down Payment Slider */}
              <div>
                <div className="flex justify-between items-center mb-1.5 text-xs">
                  <span className="font-bold text-text-primary">Down Payment ({Math.round((emiDownPayment / emiPrice) * 100)}%)</span>
                  <span className="font-bold text-accent text-sm">₹{emiDownPayment.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min={50000}
                  max={Math.round(emiPrice * 0.7)}
                  step={10000}
                  value={emiDownPayment}
                  onChange={(e) => setEmiDownPayment(Number(e.target.value))}
                  className="w-full accent-accent cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-text-secondary mt-1">
                  <span>Min ₹50,000</span>
                  <span>Max 70%</span>
                </div>
              </div>

              {/* Tenure and Interest Rate Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5 text-xs">
                    <span className="font-bold text-text-primary">Loan Tenure</span>
                    <span className="font-bold text-accent text-sm">{emiTenureMonths} Months ({Math.round(emiTenureMonths / 12)} Yrs)</span>
                  </div>
                  <input
                    type="range"
                    min={12}
                    max={84}
                    step={6}
                    value={emiTenureMonths}
                    onChange={(e) => setEmiTenureMonths(Number(e.target.value))}
                    className="w-full accent-accent cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-text-secondary mt-1">
                    <span>12 Mos</span>
                    <span>84 Mos</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5 text-xs">
                    <span className="font-bold text-text-primary">Interest Rate (p.a.)</span>
                    <span className="font-bold text-accent text-sm">{emiInterestRate}%</span>
                  </div>
                  <input
                    type="range"
                    min={8.0}
                    max={14.0}
                    step={0.25}
                    value={emiInterestRate}
                    onChange={(e) => setEmiInterestRate(Number(e.target.value))}
                    className="w-full accent-accent cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-text-secondary mt-1">
                    <span>8.0%</span>
                    <span>14.0%</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Result Card (5 cols) */}
            <div className="lg:col-span-5 rounded-xl border border-border bg-bg-surface p-6 flex flex-col justify-between">
              
              <div>
                <span className="helper-text uppercase tracking-wider block text-[11px] mb-1">
                  Estimated Monthly Installment
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-accent">₹{emiMonthly.toLocaleString('en-IN')}</span>
                  <span className="helper-text font-bold">/ month</span>
                </div>
                <div className="mt-4 pt-4 border-t border-border space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Principal Loan Amount</span>
                    <span className="font-bold text-text-primary">₹{loanPrincipal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Total Interest Payable</span>
                    <span className="font-bold text-text-primary">₹{totalInterest.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 font-bold">
                    <span className="text-text-primary">Total Amount Payable</span>
                    <span className="text-text-primary">₹{totalRepayment.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => router.push('/cars')}
                  className="btn-primary w-full text-xs font-bold h-10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Apply For Pre-Approval On Available Fleet</span>
                </button>
                <p className="helper-text text-center text-[11px] mt-2 text-text-secondary">
                  *Indicative EMI. Actual terms subject to bank credit approval.
                </p>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ── 6. CARREVIVE 4-PILLAR ASSURANCE GUARANTEE ── */}
      <section className="py-16 bg-bg-page border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <span className="badge badge-info mb-1.5">The Dealership Standard</span>
            <h2 className="section-heading text-xl font-bold text-text-primary">
              Why Motorists Choose CarRevive
            </h2>
            <p className="helper-text mt-1 max-w-xl mx-auto">
              We eliminate all uncertainties of buying pre-owned vehicles through technical rigor and consumer-first warranties.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: ShieldCheck,
                title: '150-Point Audit',
                desc: 'Comprehensive roadworthiness testing across engine compression, OBD-II diagnostics, suspension, and brakes.',
                badge: 'Pillar 01',
              },
              {
                icon: Calendar,
                title: '7-Day Full Return',
                desc: 'Drive with total peace of mind. Return the car within 7 days or 500 km for a 100% full refund if unsatisfied.',
                badge: 'Pillar 02',
              },
              {
                icon: Award,
                title: 'Non-Accidental Shield',
                desc: 'Guaranteed non-flood damaged, zero chassis structural welding, and tamper-free verified odometer readings.',
                badge: 'Pillar 03',
              },
              {
                icon: Zap,
                title: '1-Year Warranty',
                desc: 'Pan-India coverage for engine, transmission, gearbox, and electricals with complimentary 24/7 roadside assistance.',
                badge: 'Pillar 04',
              },
            ].map(({ icon: Icon, title, desc, badge }) => (
              <div
                key={title}
                className="p-6 rounded-xl border border-border bg-bg-surface flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-accent text-accent-text flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="section-heading text-base font-bold text-text-primary mb-2">
                    {title}
                  </h3>
                  <p className="body-text text-text-secondary text-xs leading-relaxed">
                    {desc}
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-border helper-text font-bold text-accent">
                  {badge}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── 7. HOW IT WORKS: 4-STEP BUYING PROCESS ── */}
      <section className="py-16 bg-bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <span className="badge badge-info mb-1.5">Effortless Ownership</span>
            <h2 className="section-heading text-xl font-bold text-text-primary">
              How CarRevive Makes Buying Simple
            </h2>
            <p className="helper-text mt-1 max-w-lg mx-auto">
              From discovering your vehicle to home delivery in 4 streamlined steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Browse & Reserve', desc: 'Explore certified inventory with 150-point inspection certificates and reserve online.' },
              { step: '02', title: 'Test Drive', desc: 'Schedule a doorstep test drive at your residence or visit our showroom branches.' },
              { step: '03', title: 'Paperless Finance', desc: 'Instant bank loan approvals starting at 8.5% with zero paperwork stress.' },
              { step: '04', title: 'Drive Home', desc: 'Receive home delivery, guaranteed RC transfer, 1-year warranty, and 7-day money-back trial.' },
            ].map((s) => (
              <div key={s.step} className="p-5 rounded-xl border border-border bg-bg-surface-alt relative">
                <span className="text-3xl font-bold text-accent block mb-2">{s.step}</span>
                <h3 className="section-heading text-base font-bold text-text-primary mb-1.5">{s.title}</h3>
                <p className="body-text text-text-secondary text-xs">{s.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── 8. INSTANT CAR VALUATION / SELL YOUR CAR BANNER ── */}
      <section className="py-14 bg-bg-page border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-bg-surface p-6 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <span className="badge badge-warning mb-2">Sell or Exchange</span>
              <h2 className="section-heading text-xl font-bold text-text-primary">
                Sell Your Car At The Highest Market Price
              </h2>
              <p className="body-text text-text-secondary text-xs mt-1.5 leading-relaxed">
                Receive an instant fair market valuation in 60 seconds. Free doorstep physical evaluation, 
                immediate same-day payment, and free RTO transfer.
              </p>
            </div>

            <form onSubmit={handleValuationSubmit} className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto">
              <input
                type="text"
                placeholder="Enter Reg # (e.g. TN02BV0258)"
                value={valuationReg}
                onChange={(e) => setValuationReg(e.target.value)}
                className="w-full sm:w-64 h-10 px-3 rounded-lg border border-border bg-bg-surface-alt text-xs text-text-primary uppercase font-bold focus:border-accent"
              />
              <button
                type="submit"
                className="btn-primary h-10 px-5 text-xs font-bold shrink-0 cursor-pointer"
              >
                Get Instant Quote
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── 9. DYNAMIC VERIFIED CUSTOMER TESTIMONIALS (ONLY WHEN REAL PUBLISHED REVIEWS EXIST IN DATABASE) ── */}
      {publishedReviews.length > 0 && (
        <section className="py-16 bg-bg-surface border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center mb-10">
              <span className="badge badge-success mb-1.5">Real Experiences</span>
              <h2 className="section-heading text-xl font-bold text-text-primary">
                Verified Motorist Testimonials
              </h2>
              <p className="helper-text mt-1 max-w-md mx-auto">
                Authentic reviews submitted by verified owners across our dealerships.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {publishedReviews.map((rev) => {
                const custName = rev.customers 
                  ? `${rev.customers.first_name} ${rev.customers.last_name || ''}`.trim() 
                  : 'Verified Motorist';
                const vehicleLabel = rev.vehicles 
                  ? `${rev.vehicles.make} ${rev.vehicles.model} · ${rev.vehicles.manufacture_year || ''}`.trim() 
                  : 'Certified Vehicle';
                const locationLabel = rev.customers?.city 
                  ? `${rev.customers.city} Showroom` 
                  : 'CarRevive Verified';
                const ratingCount = Math.max(1, Math.min(5, Number(rev.rating || 5)));

                return (
                  <div
                    key={rev.review_id}
                    className="p-6 rounded-xl border border-border bg-bg-surface-alt flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex text-status-warning gap-1">
                          {Array.from({ length: ratingCount }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                        <span className="badge badge-success text-[10px]">
                          Verified Buyer ✓
                        </span>
                      </div>
                      <p className="body-text text-xs italic leading-relaxed text-text-primary">
                        "{rev.comment}"
                      </p>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between">
                      <div>
                        <div className="body-text font-bold text-xs text-text-primary">{custName}</div>
                        <div className="helper-text text-[11px]">{vehicleLabel}</div>
                        <div className="text-[10px] text-accent font-bold">{locationLabel}</div>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-accent text-accent-text flex items-center justify-center font-bold text-xs">
                        {custName.charAt(0)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>
      )}

      {/* ── 10. SHOWROOM DIRECTORY (FETCHED DYNAMICALLY FROM DATABASE) ── */}
      <section className="py-16 bg-bg-page border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-10">
            <span className="badge badge-info mb-1.5">Visit Our Showrooms</span>
            <h2 className="section-heading text-xl font-bold text-text-primary">
              Dealership Network Across Tamil Nadu
            </h2>
            <p className="helper-text mt-1 max-w-md mx-auto">
              Walk in for certified vehicle walkthroughs, express valuations, and test drives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {branches.map((b) => (
              <div key={b.branch_id || b.id} className="p-6 rounded-xl border border-border bg-bg-surface space-y-3">
                <div className="flex items-center gap-2 font-bold text-text-primary">
                  <Building2 className="w-4 h-4 text-accent shrink-0" />
                  <span className="text-sm">{b.branch_name}</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-text-secondary">
                  <MapPin className="w-3.5 h-3.5 text-text-secondary shrink-0 mt-0.5" />
                  <span>{b.address ? `${b.address}, ${b.city}` : b.city}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Clock className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                  <span>Open Daily: 9:00 AM - 8:30 PM</span>
                </div>
                {b.phone && (
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Phone className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                    <span>{b.phone}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-border">
                  <Link
                    href={`/cars?branch=${b.branch_id || b.id}`}
                    className="btn-neutral w-full text-xs h-8 flex items-center justify-center gap-1"
                  >
                    <span>View Showroom Fleet</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── 11. INTERACTIVE BUYER FAQ ACCORDIONS ── */}
      <section className="py-16 bg-bg-surface border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-10">
            <span className="badge badge-info mb-1.5">Questions & Answers</span>
            <h2 className="section-heading text-xl font-bold text-text-primary">
              Frequently Asked Questions
            </h2>
            <p className="helper-text mt-1">
              Everything you need to know about certified pre-owned purchasing with CarRevive.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border bg-bg-surface-alt overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 text-left font-bold text-xs sm:text-sm text-text-primary flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-accent shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-secondary shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 body-text text-xs text-text-secondary border-t border-border/50 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Floating Side-by-Side Car Comparison Drawer */}
      <CarComparisonDrawer />

      {/* AI Vehicle Matchmaker Modal */}
      <AiCarMatchmakerModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
      />

      {/* Instant Car Valuation & Sell Enquiry Modal */}
      <SellCarValuationModal
        isOpen={isValuationModalOpen}
        onClose={() => setIsValuationModalOpen(false)}
        initialReg={valuationReg}
        branches={branches}
      />
    </div>
  );
}
