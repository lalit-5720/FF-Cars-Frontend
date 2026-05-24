'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../services/api';
import { Heart, Search, SlidersHorizontal, ChevronDown, RefreshCw, Star } from 'lucide-react';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useAuthStore } from '../../store/useAuthStore';
import { showLocalToast } from '../../components/Toast';

function CarsListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [cars, setCars] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ totalPages: 1, page: 1 });
  const [brands, setBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [fuelType, setFuelType] = useState(searchParams.get('fuelType') || '');
  const [transmission, setTransmission] = useState(searchParams.get('transmission') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Fetch unique brands list for filters
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await api.get('/cars/brands');
        setBrands(response.data);
      } catch (error) {
        console.error('Failed to fetch brands list', error);
      }
    };
    fetchBrands();
  }, []);

  // Fetch cars list with filters
  const fetchCars = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page,
        limit: 6,
        sortBy,
        sortOrder,
      };

      if (search) params.search = search;
      if (selectedBrand) params.brand = selectedBrand;
      if (fuelType) params.fuelType = fuelType;
      if (transmission) params.transmission = transmission;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const response = await api.get('/cars', { params });
      setCars(response.data.data);
      setMeta(response.data.meta);
    } catch (error) {
      console.error('Failed to fetch cars', error);
      showLocalToast('Error fetching car list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
    // Update URL query parameters
    const queryParams = new URLSearchParams();
    if (search) queryParams.set('search', search);
    if (selectedBrand) queryParams.set('brand', selectedBrand);
    if (fuelType) queryParams.set('fuelType', fuelType);
    if (transmission) queryParams.set('transmission', transmission);
    if (minPrice) queryParams.set('minPrice', minPrice);
    if (maxPrice) queryParams.set('maxPrice', maxPrice);
    if (sortBy) queryParams.set('sortBy', sortBy);
    if (sortOrder) queryParams.set('sortOrder', sortOrder);
    queryParams.set('page', page.toString());
    router.replace(`/cars?${queryParams.toString()}`);
  }, [search, selectedBrand, fuelType, transmission, minPrice, maxPrice, sortBy, sortOrder, page]);

  // Real-time listener via Window custom events (triggered from useSocket)
  useEffect(() => {
    const handleAvailabilityChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { carId, status } = customEvent.detail;
      setCars((prevCars) =>
        prevCars.map((car) => (car.id === carId ? { ...car, status } : car))
      );
    };

    window.addEventListener('car_availability_changed', handleAvailabilityChange);
    return () => {
      window.removeEventListener('car_availability_changed', handleAvailabilityChange);
    };
  }, []);

  const handleWishlistToggle = async (e: React.MouseEvent, carId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      showLocalToast('Please log in to wishlist cars');
      router.push('/login');
      return;
    }
    const added = await toggleWishlist(carId);
    showLocalToast(added ? 'Added to wishlist!' : 'Removed from wishlist.');
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedBrand('');
    setFuelType('');
    setTransmission('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Explore Certified Cars</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse through our verified collection. Dynamically lock-checked bookings.
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by brand or model..."
            className="block w-full pl-9 pr-4 py-2 border border-border rounded-xl bg-secondary/20 text-xs placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 flex-1">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-6">
          <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="font-semibold text-sm flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                Filters
              </span>
              <button
                onClick={handleClearFilters}
                className="text-xs text-primary font-medium hover:underline"
              >
                Clear all
              </button>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Brand
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setPage(1);
                }}
                className="w-full py-2 px-3 border border-border rounded-lg bg-secondary/10 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Brands</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Fuel Type */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Fuel Type
              </label>
              <div className="flex flex-wrap gap-2">
                {['Petrol', 'Diesel', 'Electric'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setFuelType(fuelType === type ? '' : type);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      fuelType === type
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-border bg-secondary/10 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Transmission */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Transmission
              </label>
              <div className="flex gap-2">
                {['Manual', 'Automatic'].map((trans) => (
                  <button
                    key={trans}
                    onClick={() => {
                      setTransmission(transmission === trans ? '' : trans);
                      setPage(1);
                    }}
                    className={`flex-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer text-center ${
                      transmission === trans
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-border bg-secondary/10 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {trans}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Price (INR)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setPage(1);
                  }}
                  className="w-full py-2 px-2 border border-border rounded-lg bg-secondary/10 text-xs text-center"
                />
                <span className="text-muted-foreground text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setPage(1);
                  }}
                  className="w-full py-2 px-2 border border-border rounded-lg bg-secondary/10 text-xs text-center"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Content Container */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Sorting / Meta Header */}
          <div className="flex justify-between items-center text-xs text-muted-foreground border-b border-border/50 pb-3">
            <span>
              Showing {cars.length} of {meta.total || 0} cars
            </span>

            {/* Sort Selection */}
            <div className="flex items-center gap-2">
              <span>Sort by:</span>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                  setPage(1);
                }}
                className="py-1 px-2 border border-border rounded bg-secondary/10 text-foreground cursor-pointer focus:outline-none"
              >
                <option value="createdAt-desc">Newest Listings</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="year-desc">Year: Newest First</option>
                <option value="kmDriven-asc">KMs Driven: Lowest</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="rounded-2xl border border-border bg-card overflow-hidden h-96 skeleton-shimmer" />
              ))}
            </div>
          ) : cars.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-2xl bg-card">
              <span className="font-semibold text-lg text-muted-foreground">No matches found</span>
              <p className="text-sm text-muted-foreground max-w-sm mt-2">
                Try widening your price range, choosing another brand, or resetting the search text.
              </p>
              <button
                onClick={handleClearFilters}
                className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cars.map((car) => {
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
                        onClick={(e) => handleWishlistToggle(e, car.id)}
                        className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md shadow-md transition-all border z-10 ${
                          isWishlisted(car.id)
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'bg-black/35 border-white/10 text-white hover:bg-black/55'
                        }`}
                      >
                        <Heart className="w-4 h-4" fill={isWishlisted(car.id) ? 'currentColor' : 'none'} />
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
                            Book Now
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
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 border-t border-border/50 pt-6">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 flex items-center justify-center text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    page === p ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(meta.totalPages, page + 1))}
                disabled={page === meta.totalPages}
                className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CarsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CustomerDashboardFallbackWrap />
    </Suspense>
  );
}

function CustomerDashboardFallbackWrap() {
  return <CarsListingPage />;
}
