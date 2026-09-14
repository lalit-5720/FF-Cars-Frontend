'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../services/api';
import { Heart, Search, SlidersHorizontal, RefreshCw, Scale } from 'lucide-react';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useCompareStore } from '../../store/useCompareStore';
import { CarComparisonDrawer } from '../../components/CarComparisonDrawer';
import { showLocalToast } from '../../components/Toast';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=1200';

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
  const { addToCompare, removeFromCompare, isInCompare } = useCompareStore();
  const { user, isAuthenticated } = useAuthStore();

  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState(searchParams.get('branchId') || '');

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [vehRes, branchRes] = await Promise.all([
          api.get('/vehicles'),
          api.get('/branches').catch(() => ({ data: [] })),
        ]);
        const list = Array.isArray(vehRes.data) ? vehRes.data : (vehRes.data.data || []);
        const uniqueMakes = Array.from(new Set(list.map((v: any) => v.make || v.brand))).filter(Boolean) as string[];
        setBrands(uniqueMakes);

        const bList = Array.isArray(branchRes.data) ? branchRes.data : (branchRes.data.data || []);
        setBranchesList(bList);
      } catch (error) {
        console.error('Failed to fetch metadata', error);
      }
    };
    fetchMetadata();
  }, []);

  const fetchCars = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (selectedBrand) params.make = selectedBrand;
      if (selectedBranch) params.branchId = selectedBranch;
      if (fuelType) params.fuelType = fuelType;
      if (transmission) params.transmission = transmission;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const response = await api.get('/vehicles', { params });
      const list = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setCars(list);
      setMeta({ totalPages: 1, page: 1 });
    } catch (error) {
      console.error('Failed to fetch vehicles', error);
      showLocalToast('Error loading vehicles. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
    const queryParams = new URLSearchParams();
    if (search) queryParams.set('search', search);
    if (selectedBrand) queryParams.set('brand', selectedBrand);
    if (selectedBranch) queryParams.set('branchId', selectedBranch);
    if (fuelType) queryParams.set('fuelType', fuelType);
    if (transmission) queryParams.set('transmission', transmission);
    if (minPrice) queryParams.set('minPrice', minPrice);
    if (maxPrice) queryParams.set('maxPrice', maxPrice);
    if (sortBy) queryParams.set('sortBy', sortBy);
    if (sortOrder) queryParams.set('sortOrder', sortOrder);
    queryParams.set('page', page.toString());
    router.replace(`/cars?${queryParams.toString()}`);
  }, [search, selectedBrand, selectedBranch, fuelType, transmission, minPrice, maxPrice, sortBy, sortOrder, page]);

  useEffect(() => {
    const handleAvailabilityChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { carId, status } = customEvent.detail;
      setCars((prevCars) =>
        prevCars.map((car) => (car.id === carId ? { ...car, status } : car))
      );
    };
    window.addEventListener('car_availability_changed', handleAvailabilityChange);
    return () => window.removeEventListener('car_availability_changed', handleAvailabilityChange);
  }, []);

  const handleWishlistToggle = async (e: React.MouseEvent, carId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      showLocalToast('Sign in to save vehicles to your collection');
      router.push('/login');
      return;
    }
    const added = await toggleWishlist(carId, user?.email);
    showLocalToast(added ? 'Saved to your collection' : 'Removed from collection');
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

  const activeFilterCount = [search, selectedBrand, fuelType, transmission, minPrice, maxPrice]
    .filter(Boolean).length;

  // Prioritize Available vehicles first in the inventory list
  const sortedCars = useMemo(() => {
    return [...cars].sort((a, b) => {
      const isAvailA = (a.status || '').toLowerCase() === 'available' ? 0 : 1;
      const isAvailB = (b.status || '').toLowerCase() === 'available' ? 0 : 1;
      if (isAvailA !== isAvailB) return isAvailA - isAvailB; // Available vehicles come first!

      if (sortBy === 'price') {
        return sortOrder === 'asc' ? Number(a.price) - Number(b.price) : Number(b.price) - Number(a.price);
      }
      if (sortBy === 'year') {
        const yearA = Number(a.manufacture_year || a.year || 0);
        const yearB = Number(b.manufacture_year || b.year || 0);
        return sortOrder === 'asc' ? yearA - yearB : yearB - yearA;
      }
      return new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime();
    });
  }, [cars, sortBy, sortOrder]);

  return (
    <div
      className="flex-1 flex flex-col bg-background text-foreground min-h-screen"
    >
      {/* ── Page Header ── */}
      <div className="bg-card border-b border-border py-7 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Vehicle Inventory</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight font-display">
            Certified <em className="italic text-amber-600 font-normal">Collection</em>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg font-sans">
            Explore our curated selection of inspected and certified premium vehicles across all showroom locations.
          </p>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* SIDEBAR FILTERS */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="sticky top-24 rounded-2xl p-6 flex flex-col gap-6 bg-card border border-border/90 shadow-sm">
              {/* Filter Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <SlidersHorizontal className="w-4 h-4" style={{ color: 'var(--gold)' }} />
                  <span
                    className="font-semibold text-sm"
                    style={{ color: 'var(--platinum)', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Filters
                  </span>
                  {activeFilterCount > 0 && (
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: 'var(--gold)', color: 'var(--midnight)' }}
                    >
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center gap-1 text-xs font-medium transition-colors"
                    style={{ color: 'var(--gold)', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>

              {/* Search */}
              <div>
                <label
                  className="block text-[10px] uppercase tracking-widest font-semibold mb-2"
                  style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif" }}
                >
                  Search
                </label>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: 'var(--silver-dim)' }}
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Make or model..."
                    className="input-luxury pl-10 text-sm"
                  />
                </div>
              </div>

              {/* Brand */}
              <div>
                <label
                  className="block text-[10px] uppercase tracking-widest font-semibold mb-2"
                  style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif" }}
                >
                  Marque
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => { setSelectedBrand(e.target.value); setPage(1); }}
                  className="input-luxury text-sm cursor-pointer"
                  style={{ WebkitAppearance: 'none', appearance: 'none' }}
                >
                  <option value="" style={{ background: '#0C0E14' }}>All Marques</option>
                  {brands.map((b) => (
                    <option key={b} value={b} style={{ background: '#0C0E14' }}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Showroom Branch */}
              <div>
                <label
                  className="block text-[10px] uppercase tracking-widest font-semibold mb-2"
                  style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif" }}
                >
                  Showroom Location
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => { setSelectedBranch(e.target.value); setPage(1); }}
                  className="input-luxury text-sm cursor-pointer"
                  style={{ WebkitAppearance: 'none', appearance: 'none' }}
                >
                  <option value="" style={{ background: '#0C0E14' }}>All Showrooms (Chennai)</option>
                  {branchesList.map((br) => (
                    <option key={br.branch_id} value={br.branch_id} style={{ background: '#0C0E14' }}>
                      📍 {br.branch_name} ({br.city || 'Chennai'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Fuel Type */}
              <div>
                <label
                  className="block text-[10px] uppercase tracking-widest font-semibold mb-2.5"
                  style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif" }}
                >
                  Fuel Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map((type) => (
                    <button
                      key={type}
                      onClick={() => { setFuelType(fuelType === type ? '' : type); setPage(1); }}
                      className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer"
                      style={{
                        background: fuelType === type ? 'var(--gold)' : 'rgba(255,255,255,0.03)',
                        border: fuelType === type ? '1px solid var(--gold)' : '1px solid var(--onyx-border)',
                        color: fuelType === type ? 'var(--midnight)' : 'var(--silver)',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transmission */}
              <div>
                <label
                  className="block text-[10px] uppercase tracking-widest font-semibold mb-2.5"
                  style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif" }}
                >
                  Transmission
                </label>
                <div className="flex gap-2">
                  {['Manual', 'Automatic'].map((trans) => (
                    <button
                      key={trans}
                      onClick={() => { setTransmission(transmission === trans ? '' : trans); setPage(1); }}
                      className="flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer text-center"
                      style={{
                        background: transmission === trans ? 'var(--gold)' : 'rgba(255,255,255,0.03)',
                        border: transmission === trans ? '1px solid var(--gold)' : '1px solid var(--onyx-border)',
                        color: transmission === trans ? 'var(--midnight)' : 'var(--silver)',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {trans}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label
                  className="block text-[10px] uppercase tracking-widest font-semibold mb-2"
                  style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif" }}
                >
                  Budget Range (₹)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                    className="input-luxury text-xs text-center py-2.5"
                  />
                  <span style={{ color: 'var(--silver-dim)' }}>—</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                    className="input-luxury text-xs text-center py-2.5"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* ─────────────────────────────
              VEHICLES GRID
          ───────────────────────────── */}
          <div className="flex-1 flex flex-col gap-8">

            {/* Sort / Meta Bar */}
            <div
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5"
              style={{ borderBottom: '1px solid var(--onyx-border)' }}
            >
              <span
                className="text-sm"
                style={{ color: 'var(--silver)', fontFamily: "'DM Sans', sans-serif" }}
              >
                <span style={{ color: 'var(--platinum)', fontWeight: 600 }}>{cars.length}</span>
                {' '}vehicles found
              </span>

              <div className="flex items-center gap-3">
                <span
                  className="text-xs"
                  style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif" }}
                >
                  Sort:
                </span>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                    setPage(1);
                  }}
                  className="text-xs py-2 px-3 rounded-xl cursor-pointer focus:outline-none"
                  style={{
                    background: 'var(--obsidian)',
                    border: '1px solid var(--onyx-border)',
                    color: 'var(--platinum)',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <option value="createdAt-desc" style={{ background: '#0C0E14' }}>Newest Arrivals</option>
                  <option value="price-asc" style={{ background: '#0C0E14' }}>Price: Low to High</option>
                  <option value="price-desc" style={{ background: '#0C0E14' }}>Price: High to Low</option>
                  <option value="year-desc" style={{ background: '#0C0E14' }}>Year: Newest First</option>
                  <option value="kmDriven-asc" style={{ background: '#0C0E14' }}>Lowest Mileage</option>
                </select>
              </div>
            </div>

            {/* Cards */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="rounded-2xl skeleton-shimmer"
                    style={{ height: '380px', border: '1px solid var(--onyx-border)' }}
                  />
                ))}
              </div>
            ) : cars.length === 0 ? (
              <div
                className="flex-1 flex flex-col items-center justify-center p-16 text-center rounded-3xl"
                style={{ border: '1px dashed var(--charcoal)' }}
              >
                <h3
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: '1.75rem',
                    fontWeight: 400,
                    fontStyle: 'italic',
                    color: 'var(--silver)',
                  }}
                >
                  No vehicles match your criteria
                </h3>
                <p
                  className="mt-2 text-sm max-w-sm"
                  style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
                >
                  Try adjusting your filters or broadening your search.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="btn-gold mt-6"
                  style={{ padding: '0.625rem 1.5rem', fontSize: '0.7rem' }}
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedCars.map((car) => {
                  const id = car.vehicle_id || car.id;
                  const make = car.make || car.brand;
                  const image = car.image_url || car.thumbnail || FALLBACK_IMG;
                  const year = car.manufacture_year || car.year || 2022;
                  const km = car.kilometers_driven || car.kmDriven || 0;
                  const fuel = car.fuel_type || car.fuelType || 'Petrol';
                  const owner = car.owner_type || car.ownership || '1st Owner';
                  const price = car.price ? Number(car.price) : 0;
                  const status = car.status || 'Available';
                  const isAvailable = status === 'Available' || status === 'AVAILABLE';

                  return (
                    <Link
                      key={id}
                      href={`/cars/${id}`}
                      className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-300 relative bg-card border border-border/90 shadow-sm hover:border-border hover:shadow-md"
                      style={{
                        opacity: isAvailable ? 1 : 0.75,
                      }}
                    >
                      {/* Status */}
                      {!isAvailable && (
                        <div className="absolute top-3 left-3 z-10 px-3 py-0.5 rounded-full text-[9px] font-bold uppercase bg-rose-600 text-primary-foreground shadow-sm">
                          {status}
                        </div>
                      )}

                      {/* Image */}
                      <div className="relative overflow-hidden aspect-video bg-secondary">
                        <img
                          src={image}
                          alt={`${make} ${car.model}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* Wishlist & Compare Overlay */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
                          <button
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
                            className="p-2 rounded-full backdrop-blur-md shadow-sm transition-all border text-white hover:scale-110"
                            style={{
                              background: isInCompare(String(id)) ? '#5468F0' : 'rgba(15,23,42,0.8)',
                              borderColor: isInCompare(String(id)) ? '#5468F0' : 'rgba(255,255,255,0.15)',
                            }}
                            title={isInCompare(String(id)) ? 'Remove from Compare' : 'Add to Compare'}
                          >
                            <Scale className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleWishlistToggle(e, String(id))}
                            className="p-2 rounded-full backdrop-blur-md shadow-sm transition-all border text-rose-500 hover:scale-110"
                            style={{
                              background: 'rgba(15,23,42,0.8)',
                              borderColor: 'rgba(255,255,255,0.15)',
                            }}
                          >
                            <Heart
                              className="w-3.5 h-3.5"
                              fill={isWishlisted(String(id)) ? 'currentColor' : 'none'}
                            />
                          </button>
                        </div>

                        {/* Year */}
                        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-secondary/90 text-primary-foreground">
                          {year}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <div>
                            <h3 className="font-extrabold text-base leading-tight text-foreground group-hover:text-foreground transition-colors font-display">
                              {make} {car.model}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5 font-sans">
                              {car.color || 'Standard Edition'}
                            </p>
                          </div>
                          <span className="flex-shrink-0 px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-secondary border border-border text-foreground">
                            {car.transmission || 'Auto'}
                          </span>
                        </div>

                        {/* Specs */}
                        <div className="grid grid-cols-3 gap-2 py-3 text-xs my-2 border-y border-border text-muted-foreground">
                          {[
                            { label: 'Driven', val: `${km.toLocaleString()} km` },
                            { label: 'Fuel', val: fuel },
                            { label: 'Owner', val: owner },
                          ].map(({ label, val }) => (
                            <div key={label}>
                              <span className="block text-[9px] uppercase font-bold text-muted-foreground">
                                {label}
                              </span>
                              <span className="font-bold text-foreground mt-0.5 block font-sans">
                                {val}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Price + CTA */}
                        <div className="flex items-end justify-between mt-auto pt-3">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                              Price
                            </span>
                            <span className="text-lg font-black text-foreground block font-mono">
                              ₹{price.toLocaleString()}
                            </span>
                          </div>
                          {isAvailable ? (
                            <span className="text-xs font-bold text-foreground group-hover:text-foreground flex items-center gap-1">
                              View Details &rarr;
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-rose-500">
                              Reserved / Sold
                            </span>
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
              <div
                className="flex items-center justify-center gap-2 pt-8"
                style={{ borderTop: '1px solid var(--onyx-border)' }}
              >
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer disabled:opacity-30"
                  style={{
                    border: '1px solid var(--onyx-border)',
                    color: 'var(--silver)',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Previous
                </button>
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 flex items-center justify-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      page === p
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-card border border-border text-foreground hover:bg-secondary'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(Math.min(meta.totalPages, page + 1))}
                  disabled={page === meta.totalPages}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-card border border-border text-foreground hover:bg-secondary transition-all cursor-pointer disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <CarComparisonDrawer />
    </div>
  );
}

export default function CarsPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex-1 flex items-center justify-center p-12"
          style={{ backgroundColor: 'var(--midnight)' }}
        >
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{
              borderColor: 'var(--onyx-border)',
              borderTopColor: 'var(--gold)',
            }}
          />
        </div>
      }
    >
      <CarsListingPageWrapper />
    </Suspense>
  );
}

function CarsListingPageWrapper() {
  return <CarsListingPage />;
}
