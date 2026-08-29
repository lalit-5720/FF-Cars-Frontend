'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../services/api';
import { ShieldCheck, Calendar, Zap, ArrowRight, Heart, Star, MapPin } from 'lucide-react';
import { useWishlistStore } from '../store/useWishlistStore';
import { useAuthStore } from '../store/useAuthStore';
import { showLocalToast } from '../components/Toast';
import { ThreeDCard } from '../components/ThreeDCard';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=1200';

export default function HomePage() {
  const router = useRouter();
  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [featuredCars, setFeaturedCars] = useState<any[]>([]);
  const [publishedReviews, setPublishedReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await api.get('/vehicles');
        const list = Array.isArray(response.data) ? response.data : (response.data.data || []);
        // Exclude sold cars from home page display completely
        const availableOnly = list.filter((v: any) => (v.status || '').toLowerCase() !== 'sold');
        setAllVehicles(availableOnly);
        setFeaturedCars(availableOnly.slice(0, 6));
      } catch (error) {
        console.error('Failed to fetch vehicles', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  // Dynamically select the costlier (highest price) available vehicle in DB inventory
  const costlierCar = useMemo(() => {
    const availableOnly = allVehicles.filter((v) => (v.status || '').toLowerCase() !== 'sold');
    if (availableOnly.length === 0) return null;
    return [...availableOnly].sort((a, b) => Number(b.price || 0) - Number(a.price || 0))[0];
  }, [allVehicles]);

  useEffect(() => {
    const fetchPublishedReviews = async () => {
      try {
        const response = await api.get('/reviews/published');
        const list = Array.isArray(response.data) ? response.data : (response.data.data || []);
        setPublishedReviews(list || []);
      } catch (e) {
        setPublishedReviews([]);
      }
    };
    fetchPublishedReviews();
  }, []);

  const handleWishlistToggle = async (e: React.MouseEvent, carId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      showLocalToast('Please log in to save vehicles');
      router.push('/login');
      return;
    }
    const added = await toggleWishlist(carId, user?.email);
    showLocalToast(added ? 'Saved to your collection' : 'Removed from collection');
  };

  const brands = [
    { name: 'BMW', abbr: 'BMW' },
    { name: 'Mercedes', abbr: 'MB' },
    { name: 'Audi', abbr: 'Audi' },
    { name: 'Porsche', abbr: 'Pors' },
    { name: 'Tata', abbr: 'Tata' },
    { name: 'Hyundai', abbr: 'Hyun' },
    { name: 'Land Rover', abbr: 'LR' },
    { name: 'Jaguar', abbr: 'Jag' },
  ];

  const guarantees = [
    {
      icon: ShieldCheck,
      title: '200-Point Inspection',
      desc: 'Every vehicle undergoes a rigorous mechanical, structural, and electrical certification by our master technicians.',
    },
    {
      icon: Calendar,
      title: '5-Day Return Assurance',
      desc: 'Complete peace of mind. Return any vehicle within 5 days for a full refund — no conditions, no questions.',
    },
    {
      icon: Zap,
      title: 'Secure Transaction Engine',
      desc: 'Military-grade booking locks ensure your reservation is protected from the moment you initiate.',
    },
  ];

  return (
    <div className="flex flex-col flex-1" style={{ backgroundColor: 'var(--midnight)' }}>

      {/* ═══════════════════════════════════════
          HERO SECTION — Cinematic Full Bleed
      ══════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Background: Deep gradient + dot grid */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 120% 80% at 60% 40%, rgba(201,169,110,0.05) 0%, transparent 70%), var(--midnight)',
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(rgba(201,169,110,0.15) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />

        {/* Ambient gold orbs */}
        <div
          className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(201,169,110,0.06) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(201,169,110,0.04) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />

        <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center py-20">

          {/* ── Left: Editorial Copy ── */}
          <div className="flex flex-col gap-8 z-10">

            {/* Section label */}
            <div className="section-label">
              <span>Chennai's Premier Dealership</span>
            </div>

            {/* Display Heading */}
            <div>
              <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-slate-900 leading-none font-sans">
                Own The <span className="block text-amber-600 font-black mt-1">Extraordinary</span>
              </h1>

              {/* Gold ornamental divider */}
              <div
                className="mt-6 h-px"
                style={{
                  width: '6rem',
                  background: 'linear-gradient(90deg, var(--gold), transparent)',
                }}
              />
            </div>

            <p
              className="max-w-lg leading-relaxed"
              style={{
                color: 'var(--silver)',
                fontSize: '1rem',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 300,
              }}
            >
              A curated collection of certified luxury and premium vehicles. 
              Transparent pricing, white-glove service, and our signature 
              200-point assurance — at every CarRevive showroom.
            </p>

            {/* Location pills */}
            <div className="flex flex-wrap gap-3">
              {['Anna Nagar Showroom', 'Velachery Showroom'].map((loc) => (
                <div
                  key={loc}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs"
                  style={{
                    background: 'rgba(201,169,110,0.08)',
                    border: '1px solid rgba(201,169,110,0.2)',
                    color: 'var(--gold)',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 500,
                    letterSpacing: '0.04em',
                  }}
                >
                  <MapPin className="w-3 h-3" />
                  {loc}
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/cars" className="px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer">
                Browse Inventory
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>
              <Link href="/register" className="px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 font-extrabold text-xs transition-all shadow-sm flex items-center justify-center cursor-pointer">
                Become a Member
              </Link>
            </div>

            {/* Stats row */}
            <div
              className="grid grid-cols-3 gap-8 pt-8"
              style={{ borderTop: '1px solid var(--onyx-border)' }}
            >
              {[
                { value: '250+', label: 'Curated Vehicles' },
                { value: '2', label: 'Premium Showrooms' },
                { value: '100%', label: 'Certified Quality' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <span
                    className="block text-3xl font-bold"
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      color: 'var(--gold)',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {value}
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-widest mt-1 block"
                    style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Dynamic 3D Showcase Card for Costlier Vehicle ── */}
          <div className="flex justify-center items-center z-10">
            <ThreeDCard maxTilt={10} className="w-full max-w-[440px] aspect-[4/5]">
              <div className="relative w-full h-full rounded-3xl p-7 flex flex-col justify-between overflow-hidden shadow-2xl preserve-3d bg-white border border-slate-200/90 text-slate-900">
                
                {/* Card top */}
                <div className="flex justify-between items-start z-10 preserve-3d">
                  <div style={{ transform: 'translateZ(30px)' }}>
                    <span className="text-[10px] font-bold uppercase tracking-widest block text-amber-600 font-sans">
                      💎 Featured Showcase · Flagship Model
                    </span>
                    <h3 className="mt-1 text-2xl font-extrabold text-slate-900 leading-tight font-sans">
                      {costlierCar ? `${costlierCar.make || costlierCar.brand} ${costlierCar.model}` : 'Porsche 911'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-sans">
                      {costlierCar ? `${costlierCar.color || costlierCar.variant || 'Standard'} • ${costlierCar.transmission || 'Automatic'}` : 'GT3 RS · Weissach Package'}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white shadow-sm font-sans" style={{ transform: 'translateZ(40px)' }}>
                    {costlierCar ? (costlierCar.manufacture_year || costlierCar.year || 2024) : '2026'}
                  </span>
                </div>

                {/* Car Image */}
                <div
                  className="relative w-full my-4 flex items-center justify-center z-20 preserve-3d rounded-2xl overflow-hidden aspect-video bg-slate-100 border border-slate-200"
                  style={{ transform: 'translateZ(40px)' }}
                >
                  <img
                    src={costlierCar ? (costlierCar.image_url || costlierCar.thumbnail || FALLBACK_IMG) : 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=900'}
                    alt={costlierCar ? `${costlierCar.make || costlierCar.brand} ${costlierCar.model}` : 'Flagship Showcase'}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>

                {/* Spec grid + price */}
                <div className="flex flex-col gap-4 z-10 preserve-3d">
                  <div
                    className="grid grid-cols-3 gap-2 text-center"
                    style={{ transform: 'translateZ(35px)' }}
                  >
                    {[
                      { label: 'Driven', value: costlierCar ? `${(costlierCar.kilometers_driven || costlierCar.kmDriven || 0).toLocaleString()} km` : '3,200 km' },
                      { label: 'Fuel', value: costlierCar ? (costlierCar.fuel_type || costlierCar.fuelType || 'Petrol') : 'Petrol' },
                      { label: 'Owner', value: costlierCar ? (costlierCar.owner_type || costlierCar.ownership || '1st Owner') : '1st Owner' },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                      >
                        <span className="block text-[9px] uppercase font-bold text-slate-400 font-sans">
                          {label}
                        </span>
                        <span className="text-xs font-bold text-slate-900 mt-0.5 block font-sans truncate">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div
                    className="flex justify-between items-center pt-2 border-t border-slate-100"
                    style={{ transform: 'translateZ(25px)' }}
                  >
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block font-sans">
                        Showcase Price
                      </span>
                      <span className="text-xl font-black text-slate-900 block mt-0.5 font-mono">
                        ₹{costlierCar ? Number(costlierCar.price || 0).toLocaleString() : '2,45,00,000'}
                      </span>
                    </div>
                    <button
                      onClick={() => router.push(costlierCar ? `/cars/${costlierCar.vehicle_id || costlierCar.id}` : '/cars')}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                    >
                      View Details &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </ThreeDCard>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          BRAND FILTER STRIP
      ══════════════════════════════════════ */}
      <section
        className="py-16"
        style={{ borderTop: '1px solid var(--onyx-border)', background: 'var(--obsidian)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Ornamental heading */}
          <div className="flex items-center justify-center gap-6 mb-10">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--onyx-border))' }} />
            <span
              className="text-[10px] uppercase tracking-[0.3em] font-semibold"
              style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif" }}
            >
              Filter by Marque
            </span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, var(--onyx-border), transparent)' }} />
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {brands.map((brand) => (
              <button
                key={brand.name}
                onClick={() => router.push(`/cars?brand=${brand.name}`)}
                className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl transition-all duration-300 group cursor-pointer"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--onyx-border)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,169,110,0.4)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(201,169,110,0.05)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--onyx-border)';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300"
                  style={{
                    background: 'var(--onyx)',
                    border: '1px solid var(--charcoal)',
                    color: 'var(--silver)',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {brand.abbr}
                </div>
                <span
                  className="text-[10px] font-medium text-center leading-tight"
                  style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif" }}
                >
                  {brand.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FEATURED VEHICLES — Editorial Drop
      ══════════════════════════════════════ */}
      <section className="py-28" style={{ backgroundColor: 'var(--midnight)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-16">
            <div>
              <div className="section-label mb-4">Featured Selections</div>
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
                  fontWeight: 500,
                  color: 'var(--platinum)',
                  lineHeight: 1.05,
                  letterSpacing: '-0.01em',
                }}
              >
                Handpicked{' '}
                <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--gold)' }}>
                  Excellence
                </em>
              </h2>
            </div>
            <Link
              href="/cars"
              className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest transition-colors group"
              style={{ color: 'var(--gold)', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.14em' }}
            >
              View Full Inventory
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="rounded-3xl skeleton-shimmer"
                  style={{ height: '460px', border: '1px solid var(--onyx-border)' }}
                />
              ))}
            </div>
          ) : featuredCars.length === 0 ? (
            <div
              className="text-center py-20 rounded-3xl"
              style={{
                border: '1px dashed var(--charcoal)',
                color: 'var(--silver-dim)',
              }}
            >
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontStyle: 'italic' }}>
                No vehicles currently available
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredCars.map((car) => {
                const id = car.vehicle_id || car.id;
                const make = car.make || car.brand;
                const image = car.image_url || car.thumbnail || FALLBACK_IMG;
                const year = car.manufacture_year || car.year || 2022;
                const km = car.kilometers_driven || car.kmDriven || 0;
                const fuel = car.fuel_type || car.fuelType || 'Petrol';
                const owner = car.owner_type || car.ownership || '1st Owner';
                const price = car.price ? Number(car.price) : 0;

                return (
                  <ThreeDCard key={id} maxTilt={5} className="h-full">
                    <Link
                      href={`/vehicles/${id}`}
                      className="group flex flex-col h-full rounded-3xl overflow-hidden transition-all duration-500 preserve-3d"
                      style={{
                        background: 'var(--obsidian)',
                        border: '1px solid var(--onyx-border)',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,169,110,0.3)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,169,110,0.1)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--onyx-border)';
                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                      }}
                    >
                      {/* Image */}
                      <div className="relative aspect-video w-full overflow-hidden" style={{ background: 'var(--onyx)' }}>
                        <img
                          src={image}
                          alt={`${make} ${car.model}`}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                          style={{ transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)' }}
                        />
                        {/* Gold overlay on hover */}
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{
                            background: 'linear-gradient(135deg, rgba(201,169,110,0.06) 0%, transparent 60%)',
                          }}
                        />
                        {/* Wishlist */}
                        <button
                          onClick={(e) => handleWishlistToggle(e, String(id))}
                          className="absolute top-4 right-4 p-2.5 rounded-full transition-all duration-200 preserve-3d"
                          style={{
                            background: isWishlisted(String(id)) ? 'var(--gold)' : 'rgba(5,6,10,0.7)',
                            border: '1px solid rgba(201,169,110,0.3)',
                            backdropFilter: 'blur(8px)',
                            transform: 'translateZ(30px)',
                            color: isWishlisted(String(id)) ? 'var(--midnight)' : 'var(--silver)',
                          }}
                        >
                          <Heart
                            className="w-4 h-4"
                            fill={isWishlisted(String(id)) ? 'currentColor' : 'none'}
                          />
                        </button>
                        {/* Year badge */}
                        <div
                          className="absolute bottom-4 left-4 px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase preserve-3d"
                          style={{
                            background: 'rgba(5,6,10,0.8)',
                            border: '1px solid rgba(201,169,110,0.2)',
                            backdropFilter: 'blur(8px)',
                            color: 'var(--gold)',
                            transform: 'translateZ(25px)',
                            fontFamily: "'DM Mono', monospace",
                          }}
                        >
                          {year}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 flex-1 flex flex-col justify-between preserve-3d">
                        <div>
                          <div
                            className="flex justify-between items-start gap-2 mb-3"
                            style={{ transform: 'translateZ(20px)' }}
                          >
                            <div>
                              <h3
                                style={{
                                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                                  fontSize: '1.3rem',
                                  fontWeight: 600,
                                  color: 'var(--platinum)',
                                  lineHeight: 1.2,
                                  letterSpacing: '-0.01em',
                                }}
                              >
                                {make} {car.model}
                              </h3>
                              <p
                                className="text-xs mt-0.5"
                                style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif" }}
                              >
                                {car.color || 'Premium Edition'}
                              </p>
                            </div>
                            <span
                              className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider"
                              style={{
                                background: 'rgba(201,169,110,0.1)',
                                border: '1px solid rgba(201,169,110,0.2)',
                                color: 'var(--gold)',
                                fontFamily: "'DM Sans', sans-serif",
                              }}
                            >
                              {car.transmission || 'Auto'}
                            </span>
                          </div>

                          {/* Spec row */}
                          <div
                            className="grid grid-cols-3 gap-3 py-4 text-xs"
                            style={{
                              borderTop: '1px solid var(--onyx-border)',
                              borderBottom: '1px solid var(--onyx-border)',
                              transform: 'translateZ(15px)',
                            }}
                          >
                            {[
                              { label: 'Driven', value: `${km.toLocaleString()} km` },
                              { label: 'Fuel', value: fuel },
                              { label: 'Owner', value: owner },
                            ].map(({ label, value }) => (
                              <div key={label}>
                                <span
                                  className="block text-[8px] uppercase tracking-wider font-semibold"
                                  style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif" }}
                                >
                                  {label}
                                </span>
                                <span
                                  className="font-medium mt-0.5 block"
                                  style={{ color: 'var(--platinum)', fontFamily: "'DM Sans', sans-serif" }}
                                >
                                  {value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Price + CTA */}
                        <div
                          className="flex items-end justify-between mt-4 pt-2"
                          style={{ transform: 'translateZ(25px)' }}
                        >
                          <div>
                            <span
                              className="text-[9px] uppercase tracking-widest block"
                              style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif" }}
                            >
                              Price
                            </span>
                            <span
                              className="text-2xl font-bold block mt-0.5"
                              style={{
                                color: 'var(--gold)',
                                fontFamily: "'DM Mono', monospace",
                                letterSpacing: '-0.03em',
                              }}
                            >
                              ₹{price.toLocaleString()}
                            </span>
                          </div>
                          <span
                            className="text-[10px] font-bold uppercase tracking-widest transition-all duration-300 group-hover:translate-x-1"
                            style={{ color: 'var(--gold)', fontFamily: "'DM Sans', sans-serif" }}
                          >
                            View Details →
                          </span>
                        </div>
                      </div>
                    </Link>
                  </ThreeDCard>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          THE CARREVIVE DIFFERENCE
      ══════════════════════════════════════ */}
      <section
        className="py-28"
        style={{
          background: 'var(--obsidian)',
          borderTop: '1px solid var(--onyx-border)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="flex items-center justify-center mb-5">
              <div className="section-label">Our Commitment</div>
            </div>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                fontWeight: 500,
                color: 'var(--platinum)',
                lineHeight: 1.0,
                letterSpacing: '-0.02em',
              }}
            >
              The CarRevive{' '}
              <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--gold)' }}>
                Difference
              </em>
            </h2>
            <p
              className="mt-4 mx-auto max-w-lg"
              style={{ color: 'var(--silver)', fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
            >
              Every aspect of the CarRevive experience is engineered around trust,
              transparency, and excellence.
            </p>
          </div>

          {/* Guarantee Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {guarantees.map(({ icon: Icon, title, desc }, idx) => (
              <div
                key={title}
                className="group relative p-8 rounded-3xl flex flex-col transition-all duration-500"
                style={{
                  background: 'var(--midnight)',
                  border: '1px solid var(--onyx-border)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,169,110,0.3)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 60px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--onyx-border)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                {/* Index */}
                <span
                  className="absolute top-6 right-7 text-6xl font-bold opacity-5"
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    color: 'var(--gold)',
                  }}
                >
                  0{idx + 1}
                </span>

                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-7 transition-all duration-300"
                  style={{
                    background: 'rgba(201,169,110,0.08)',
                    border: '1px solid rgba(201,169,110,0.2)',
                    color: 'var(--gold)',
                  }}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <h3
                  className="mb-3"
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: '1.4rem',
                    fontWeight: 600,
                    color: 'var(--platinum)',
                    lineHeight: 1.2,
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    color: 'var(--silver)',
                    fontSize: '0.875rem',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 300,
                    lineHeight: 1.7,
                  }}
                >
                  {desc}
                </p>

                {/* Gold bottom accent */}
                <div
                  className="mt-8 h-px w-10 transition-all duration-500 group-hover:w-full"
                  style={{ background: 'linear-gradient(90deg, var(--gold), transparent)' }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────
          ANIMATED CUSTOMER REVIEWS MARQUEE SHOWCASE
      ────────────────────────────────────── */}
      <section className="py-24 overflow-hidden relative bg-[#F8FAFC] border-t border-slate-200/90 text-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
          <div className="flex items-center justify-center mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Verified Testimonials
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-sans tracking-tight">
            Client <span className="text-amber-600 font-black">Experiences</span>
          </h2>
          <p className="mt-2 text-xs text-slate-500 max-w-md mx-auto font-sans font-medium">
            Hear from discerning owners who purchased their certified luxury automobiles through CarRevive.
          </p>
        </div>

        {/* Infinite Marquee Container */}
        {publishedReviews.length > 0 ? (
          <div className="relative w-full overflow-hidden py-4">
            {/* Side Fades - Light smooth gradient matching #F8FAFC */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent z-10 pointer-events-none" />

            {/* Marquee Track */}
            <div className="animate-marquee flex gap-6 px-4">
              {[...publishedReviews, ...publishedReviews, ...publishedReviews].map((rev, idx) => {
                const custName = rev.customers ? `${rev.customers.first_name} ${rev.customers.last_name || ''}`.trim() : (rev.name || 'Verified Owner');
                const carModel = rev.vehicles ? `${rev.vehicles.make} ${rev.vehicles.model}` : (rev.carModel || 'Luxury Automobile');
                const rating = Number(rev.rating || 5);

                return (
                  <div
                    key={idx}
                    className="w-[380px] p-7 rounded-2xl flex-shrink-0 flex flex-col justify-between gap-5 bg-white border border-slate-200/90 shadow-sm text-slate-900"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex text-amber-500 gap-1">
                          {Array.from({ length: rating }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current text-amber-500" />
                          ))}
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-sans">
                          Verified Purchaser ✓
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed font-sans font-normal">
                        "{rev.comment}"
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900 font-sans">{custName}</div>
                        <div className="text-[11px] text-slate-500 font-semibold font-sans mt-0.5">{carModel}</div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm font-sans">
                        {custName.charAt(0)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 text-center text-sm text-slate-500">
            No approved customer reviews yet. Once a customer review is approved, it will appear here.
          </div>
        )}
      </section>
    </div>
  );
}
