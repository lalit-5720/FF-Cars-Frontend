'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../services/api';
import { Heart, Search, SlidersHorizontal, RefreshCw, Scale, MapPin, Building2 } from 'lucide-react';
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

  const sortedCars = useMemo(() => {
    return [...cars].sort((a, b) => {
      const isAvailA = (a.status || '').toLowerCase() === 'available' ? 0 : 1;
      const isAvailB = (b.status || '').toLowerCase() === 'available' ? 0 : 1;
      if (isAvailA !== isAvailB) return isAvailA - isAvailB;

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
    <div className="flex-1 flex flex-col bg-bg-page text-text-primary min-h-screen">
      {/* ── Page Header ── */}
      <div className="bg-bg-surface border-b border-border py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <span className="helper-text font-bold uppercase tracking-wider block mb-1">
            Vehicle Inventory
          </span>
          <h1 className="page-title text-text-primary">
            Certified Inventory
          </h1>
          <p className="body-text text-text-secondary mt-1 max-w-lg">
            Explore inspected and certified quality pre-owned vehicles across our showrooms.
          </p>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* SIDEBAR FILTERS */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="sticky top-20 rounded-lg p-6 flex flex-col gap-6 bg-bg-surface border border-border">
              {/* Filter Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-accent" />
                  <span className="section-heading text-sm text-text-primary">
                    Filters
                  </span>
                  {activeFilterCount > 0 && (
                    <span className="badge badge-info text-[10px] px-1.5 py-0">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center gap-1 helper-text font-bold text-accent hover:underline cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>

              {/* Search */}
              <div>
                <label className="block helper-text font-bold uppercase tracking-wider mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Make or model..."
                    className="w-full bg-bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              {/* Brand */}
              <div>
                <label className="block helper-text font-bold uppercase tracking-wider mb-2">
                  Brand / Make
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => { setSelectedBrand(e.target.value); setPage(1); }}
                  className="w-full bg-bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none cursor-pointer"
                >
                  <option value="">All Brands</option>
                  {brands.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Showroom Branch */}
              <div>
                <label className="block helper-text font-bold uppercase tracking-wider mb-2">
                  Showroom Location
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => { setSelectedBranch(e.target.value); setPage(1); }}
                  className="w-full bg-bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none cursor-pointer"
                >
                  <option value="">All Showroom Locations</option>
                  {branchesList.map((br) => (
                    <option key={br.branch_id} value={br.branch_id}>
                      {br.branch_name} {br.city ? `(${br.city})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fuel Type */}
              <div>
                <label className="block helper-text font-bold uppercase tracking-wider mb-2">
                  Fuel Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map((type) => (
                    <button
                      key={type}
                      onClick={() => { setFuelType(fuelType === type ? '' : type); setPage(1); }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        fuelType === type
                          ? 'bg-accent text-accent-text border-accent'
                          : 'bg-bg-surface border-border text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transmission */}
              <div>
                <label className="block helper-text font-bold uppercase tracking-wider mb-2">
                  Transmission
                </label>
                <div className="flex gap-2">
                  {['Manual', 'Automatic'].map((trans) => (
                    <button
                      key={trans}
                      onClick={() => { setTransmission(transmission === trans ? '' : trans); setPage(1); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer text-center ${
                        transmission === trans
                          ? 'bg-accent text-accent-text border-accent'
                          : 'bg-bg-surface border-border text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {trans}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block helper-text font-bold uppercase tracking-wider mb-2">
                  Budget Range (₹)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                    className="w-full bg-bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-center text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
                  />
                  <span className="text-text-secondary">—</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                    className="w-full bg-bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-center text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* ── VEHICLES GRID ── */}
          <div className="flex-1 flex flex-col gap-6">

            {/* Sort / Meta Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
              <span className="body-text text-text-secondary">
                <strong className="text-text-primary">{cars.length}</strong> vehicles found
              </span>

              <div className="flex items-center gap-2">
                <span className="helper-text font-bold">
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
                  className="bg-bg-surface border border-border rounded-lg text-xs py-1.5 px-3 text-text-primary focus:border-accent focus:outline-none cursor-pointer"
                >
                  <option value="createdAt-desc">Newest Arrivals</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="year-desc">Year: Newest First</option>
                  <option value="kmDriven-asc">Lowest Mileage</option>
                </select>
              </div>
            </div>

            {/* Cards */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="rounded-lg h-80 bg-bg-surface border border-border animate-pulse"
                  />
                ))}
              </div>
            ) : cars.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-lg border border-border bg-bg-surface">
                <h3 className="section-heading text-text-primary">
                  No vehicles match your criteria
                </h3>
                <p className="body-text text-text-secondary mt-1 max-w-sm">
                  Try adjusting your filters or broadening your search.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="btn-primary mt-4"
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

                  // Branch lookup dynamically from car.branches or branchesList
                  const matchedBranch = car.branches || branchesList.find((b) => (b.branch_id || b.id) === car.branch_id);
                  const branchName = matchedBranch?.branch_name || 'CarRevive Showroom';
                  const branchCity = matchedBranch?.city || '';

                  return (
                    <div
                      key={id}
                      className="group flex flex-col rounded-lg border border-border bg-bg-surface overflow-hidden transition-colors"
                      style={{ opacity: isAvailable ? 1 : 0.8 }}
                    >
                      {/* Image */}
                      <div className="relative overflow-hidden aspect-video bg-bg-surface-alt border-b border-border">
                        <img
                          src={image}
                          alt={`${make} ${car.model}`}
                          className="w-full h-full object-cover"
                        />

                        {/* Status badge */}
                        {!isAvailable && (
                          <div className="absolute top-3 left-3 badge badge-danger">
                            {status}
                          </div>
                        )}

                        {/* Wishlist & Compare Overlay */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
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
                            className={`p-1.5 rounded-lg border text-xs font-bold transition-colors ${
                              isInCompare(String(id))
                                ? 'bg-accent text-accent-text border-accent'
                                : 'bg-bg-surface border-border text-text-secondary hover:text-text-primary'
                            }`}
                            title={isInCompare(String(id)) ? 'Remove from Compare' : 'Add to Compare'}
                          >
                            <Scale className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleWishlistToggle(e, String(id))}
                            className={`p-1.5 rounded-lg border text-xs font-bold transition-colors ${
                              isWishlisted(String(id))
                                ? 'bg-status-danger text-white border-status-danger'
                                : 'bg-bg-surface border-border text-text-secondary hover:text-text-primary'
                            }`}
                          >
                            <Heart
                              className="w-3.5 h-3.5"
                              fill={isWishlisted(String(id)) ? 'currentColor' : 'none'}
                            />
                          </button>
                        </div>

                        {/* Year & Branch Location Badges */}
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                          <span className="badge badge-info">{year}</span>
                          <span className="badge badge-neutral flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-accent" />
                            <span>{branchCity || 'Showroom'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <div>
                              <h3 className="section-heading text-text-primary">
                                {make} {car.model}
                              </h3>
                              <p className="helper-text mt-0.5">
                                {car.color || 'Standard Edition'}
                              </p>
                            </div>
                            <span className="badge badge-info">
                              {car.transmission || 'Auto'}
                            </span>
                          </div>

                          {/* Specs */}
                          <div className="grid grid-cols-3 gap-2 py-2.5 my-2 border-y border-border text-xs">
                            {[
                              { label: 'Driven', val: `${km.toLocaleString()} km` },
                              { label: 'Fuel', val: fuel },
                              { label: 'Owner', val: owner },
                            ].map(({ label, val }) => (
                              <div key={label}>
                                <span className="helper-text uppercase block">
                                  {label}
                                </span>
                                <span className="body-text font-bold text-xs block truncate mt-0.5">
                                  {val}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Branch Location Row */}
                          <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-2.5 pt-2 border-t border-border">
                            <Building2 className="w-3.5 h-3.5 text-accent shrink-0" />
                            <span className="font-bold text-text-primary truncate">
                              {branchName}
                            </span>
                            {branchCity && (
                              <span className="helper-text shrink-0 text-[11px]">
                                &bull; {branchCity}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price + CTA */}
                        <div className="flex items-center justify-between pt-3 mt-auto">
                          <div>
                            <span className="helper-text block">Price</span>
                            <span className="section-heading text-text-primary block">
                              ₹{price.toLocaleString()}
                            </span>
                          </div>
                          <Link
                            href={`/cars/${id}`}
                            className="btn-primary"
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

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6 border-t border-border">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn-neutral"
                >
                  Previous
                </button>
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={page === p ? 'btn-primary' : 'btn-neutral'}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(Math.min(meta.totalPages, page + 1))}
                  disabled={page === meta.totalPages}
                  className="btn-neutral"
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
        <div className="flex-1 flex items-center justify-center p-12 bg-bg-page">
          <div className="w-8 h-8 rounded-full border-2 border-border border-t-accent animate-spin" />
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
