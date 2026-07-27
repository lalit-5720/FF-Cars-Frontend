'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../services/api';
import { Heart, Search, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useAuthStore } from '../../store/useAuthStore';
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
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await api.get('/vehicles');
        const list = Array.isArray(response.data) ? response.data : (response.data.data || []);
        const uniqueMakes = Array.from(new Set(list.map((v: any) => v.make || v.brand))).filter(Boolean) as string[];
        setBrands(uniqueMakes);
      } catch (error) {
        console.error('Failed to fetch brands list', error);
      }
    };
    fetchBrands();
  }, []);

  const fetchCars = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (selectedBrand) params.make = selectedBrand;
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
    if (fuelType) queryParams.set('fuelType', fuelType);
    if (transmission) queryParams.set('transmission', transmission);
    if (minPrice) queryParams.set('minPrice', minPrice);
    if (maxPrice) queryParams.set('maxPrice', maxPrice);
    if (sortBy) queryParams.set('sortBy', sortBy);
    if (sortOrder) queryParams.set('sortOrder', sortOrder);
    queryParams.set('page', page.toString());
    router.replace(`/cars?${queryParams.toString()}`);
  }, [search, selectedBrand, fuelType, transmission, minPrice, maxPrice, sortBy, sortOrder, page]);

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
    const added = await toggleWishlist(carId);
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

  return (
    <div
      className="flex-1 flex flex-col"
      style={{ backgroundColor: 'var(--midnight)', minHeight: '100vh' }}
    >
      {/* ── Page Header ── */}
      <div
        className="relative py-14 px-4 sm:px-6 lg:px-8 overflow-hidden"
        style={{
          background: 'var(--obsidian)',
          borderBottom: '1px solid var(--onyx-border)',
        }}
      >
        {/* Background dot grid */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(rgba(201,169,110,0.12) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        {/* Gold ambient */}
        <div
          className="absolute top-0 left-1/3 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(201,169,110,0.05) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        <div className="relative max-w-7xl mx-auto">
          <div className="section-label mb-4">Vehicle Inventory</div>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: 500,
              color: 'var(--platinum)',
              lineHeight: 1.0,
              letterSpacing: '-0.02em',
            }}
          >
            Certified{' '}
            <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--gold)' }}>
              Collection
            </em>
          </h1>
          <p
            className="mt-3"
            style={{
              color: 'var(--silver)',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 300,
              maxWidth: '36rem',
            }}
          >
            Explore our curated selection of inspected and certified premium vehicles
            across both Chennai showrooms.
          </p>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* ─────────────────────────────
              SIDEBAR FILTERS
          ───────────────────────────── */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div
              className="sticky top-24 rounded-3xl p-6 flex flex-col gap-7"
              style={{
                background: 'var(--obsidian)',
                border: '1px solid var(--onyx-border)',
              }}
            >
              {/* Filter Header */}
              <div
                className="flex items-center justify-between pb-5"
                style={{ borderBottom: '1px solid var(--onyx-border)' }}
              >
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
                {cars.map((car) => {
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
                      className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-400 relative"
                      style={{
                        background: 'var(--obsidian)',
                        border: '1px solid var(--onyx-border)',
                        opacity: isAvailable ? 1 : 0.75,
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,169,110,0.3)';
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--onyx-border)';
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                      }}
                    >
                      {/* Status */}
                      {!isAvailable && (
                        <div
                          className="absolute top-3 left-3 z-10 badge-sold"
                        >
                          {status}
                        </div>
                      )}

                      {/* Image */}
                      <div
                        className="relative overflow-hidden"
                        style={{ aspectRatio: '16/9', background: 'var(--onyx)' }}
                      >
                        <img
                          src={image}
                          alt={`${make} ${car.model}`}
                          className="w-full h-full object-cover"
                          style={{ transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.07)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                        />

                        {/* Gold edge overlay on hover */}
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                          style={{
                            background: 'linear-gradient(135deg, rgba(201,169,110,0.07) 0%, transparent 50%)',
                          }}
                        />

                        {/* Wishlist */}
                        <button
                          onClick={(e) => handleWishlistToggle(e, String(id))}
                          className="absolute top-3 right-3 p-2.5 rounded-full transition-all duration-200 z-10"
                          style={{
                            background: isWishlisted(String(id))
                              ? 'var(--gold)'
                              : 'rgba(5,6,10,0.75)',
                            border: '1px solid rgba(201,169,110,0.25)',
                            backdropFilter: 'blur(8px)',
                            color: isWishlisted(String(id)) ? 'var(--midnight)' : 'var(--silver)',
                          }}
                        >
                          <Heart
                            className="w-3.5 h-3.5"
                            fill={isWishlisted(String(id)) ? 'currentColor' : 'none'}
                          />
                        </button>

                        {/* Year */}
                        <div
                          className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-[9px] font-bold tracking-widest uppercase"
                          style={{
                            background: 'rgba(5,6,10,0.8)',
                            border: '1px solid rgba(201,169,110,0.2)',
                            backdropFilter: 'blur(8px)',
                            color: 'var(--gold)',
                            fontFamily: "'DM Mono', monospace",
                          }}
                        >
                          {year}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <div>
                            <h3
                              style={{
                                fontFamily: "'Cormorant Garamond', Georgia, serif",
                                fontSize: '1.2rem',
                                fontWeight: 600,
                                color: 'var(--platinum)',
                                lineHeight: 1.2,
                              }}
                            >
                              {make} {car.model}
                            </h3>
                            <p
                              className="text-xs mt-0.5"
                              style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif" }}
                            >
                              {car.color || 'Standard Edition'}
                            </p>
                          </div>
                          <span
                            className="flex-shrink-0 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider"
                            style={{
                              background: 'rgba(201,169,110,0.08)',
                              border: '1px solid rgba(201,169,110,0.18)',
                              color: 'var(--gold)',
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            {car.transmission || 'Auto'}
                          </span>
                        </div>

                        {/* Specs */}
                        <div
                          className="grid grid-cols-3 gap-2 py-3 text-xs my-2"
                          style={{
                            borderTop: '1px solid var(--onyx-border)',
                            borderBottom: '1px solid var(--onyx-border)',
                          }}
                        >
                          {[
                            { label: 'Driven', val: `${km.toLocaleString()} km` },
                            { label: 'Fuel', val: fuel },
                            { label: 'Owner', val: owner },
                          ].map(({ label, val }) => (
                            <div key={label}>
                              <span
                                className="block text-[8px] uppercase tracking-wider"
                                style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
                              >
                                {label}
                              </span>
                              <span
                                className="font-medium mt-0.5 block"
                                style={{ color: 'var(--platinum)', fontFamily: "'DM Sans', sans-serif" }}
                              >
                                {val}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Price + CTA */}
                        <div className="flex items-end justify-between mt-auto pt-3">
                          <div>
                            <span
                              className="text-[9px] uppercase tracking-widest block"
                              style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif" }}
                            >
                              Price
                            </span>
                            <span
                              className="text-xl font-bold block"
                              style={{
                                color: 'var(--gold)',
                                fontFamily: "'DM Mono', monospace",
                                letterSpacing: '-0.02em',
                              }}
                            >
                              ₹{price.toLocaleString()}
                            </span>
                          </div>
                          {isAvailable ? (
                            <span
                              className="text-[10px] font-bold uppercase tracking-widest transition-transform duration-200 group-hover:translate-x-1"
                              style={{ color: 'var(--gold)', fontFamily: "'DM Sans', sans-serif" }}
                            >
                              Enquire →
                            </span>
                          ) : (
                            <span className="badge-sold">Sold</span>
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
                    className="w-9 h-9 flex items-center justify-center text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    style={{
                      background: page === p ? 'var(--gold)' : 'transparent',
                      border: page === p ? '1px solid var(--gold)' : '1px solid var(--onyx-border)',
                      color: page === p ? 'var(--midnight)' : 'var(--silver)',
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(Math.min(meta.totalPages, page + 1))}
                  disabled={page === meta.totalPages}
                  className="px-4 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer disabled:opacity-30"
                  style={{
                    border: '1px solid var(--onyx-border)',
                    color: 'var(--silver)',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
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
