'use client';

import React, { useEffect, useState } from 'react';
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
  const [featuredCars, setFeaturedCars] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await api.get('/vehicles?limit=3');
        const list = Array.isArray(response.data) ? response.data : (response.data.data || []);
        setFeaturedCars(list);
      } catch (error) {
        console.error('Failed to load featured cars', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleWishlistToggle = async (e: React.MouseEvent, carId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      showLocalToast('Please log in to save vehicles');
      router.push('/login');
      return;
    }
    const added = await toggleWishlist(carId);
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
              <h1
                className="leading-none"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 'clamp(3.5rem, 8vw, 6.5rem)',
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  color: 'var(--platinum)',
                  lineHeight: 1.0,
                }}
              >
                Own The{' '}
                <em
                  className="block"
                  style={{
                    fontStyle: 'italic',
                    fontWeight: 300,
                    color: 'var(--gold)',
                    lineHeight: 1.05,
                  }}
                >
                  Extraordinary
                </em>
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
              200-point assurance — at every FF-Cars showroom.
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
              <Link href="/cars" className="btn-gold">
                Browse Inventory
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/register" className="btn-outline-gold">
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

          {/* ── Right: 3D Showcase Card ── */}
          <div className="flex justify-center items-center z-10">
            <ThreeDCard maxTilt={10} className="w-full max-w-[440px] aspect-[4/5]">
              <div
                className="relative w-full h-full rounded-3xl p-7 flex flex-col justify-between overflow-hidden shadow-2xl preserve-3d"
                style={{
                  background: 'var(--obsidian)',
                  border: '1px solid var(--onyx-border)',
                  boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,169,110,0.08)',
                }}
              >
                {/* Background micro-grid */}
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(rgba(201,169,110,0.25) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                />
                {/* Gold ambient glow */}
                <div
                  className="absolute -top-20 -right-20 w-48 h-48 rounded-full pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, rgba(201,169,110,0.12) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                  }}
                />

                {/* Card top */}
                <div className="flex justify-between items-start z-10 preserve-3d">
                  <div style={{ transform: 'translateZ(30px)' }}>
                    <span
                      className="text-[9px] uppercase tracking-[0.2em] font-semibold block"
                      style={{ color: 'var(--gold)', fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Showcase · 2026 Collection
                    </span>
                    <h3
                      className="mt-1"
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontSize: '1.75rem',
                        fontWeight: 600,
                        color: 'var(--platinum)',
                        lineHeight: 1.1,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      Porsche 911
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--silver-dim)' }}>GT3 RS · Weissach Package</p>
                  </div>
                  <span
                    className="px-3 py-1 rounded-lg text-xs font-bold"
                    style={{
                      background: 'var(--gold)',
                      color: 'var(--midnight)',
                      transform: 'translateZ(40px)',
                      fontFamily: "'DM Mono', monospace",
                      display: 'block',
                    }}
                  >
                    MY 2026
                  </span>
                </div>

                {/* Car Image */}
                <div
                  className="relative w-full my-4 flex items-center justify-center z-20 preserve-3d"
                  style={{ transform: 'translateZ(50px) scale(1.08)', aspectRatio: '16/9' }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=900"
                    alt="Porsche GT3 RS"
                    className="w-full h-full object-contain"
                    style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.9))' }}
                  />
                </div>

                {/* Spec grid + price */}
                <div className="flex flex-col gap-4 z-10 preserve-3d">
                  <div
                    className="grid grid-cols-3 gap-2 text-center"
                    style={{ transform: 'translateZ(35px)' }}
                  >
                    {[
                      { label: '0–100 km/h', value: '3.2s' },
                      { label: 'Max Power', value: '525 HP' },
                      { label: 'Top Speed', value: '296 km/h' },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="p-2.5 rounded-xl"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--onyx-border)',
                        }}
                      >
                        <span
                          className="block text-[8px] uppercase tracking-wider"
                          style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif" }}
                        >
                          {label}
                        </span>
                        <span
                          className="text-sm font-bold mt-0.5 block"
                          style={{ color: 'var(--platinum)', fontFamily: "'DM Mono', monospace" }}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div
                    className="flex justify-between items-center"
                    style={{ transform: 'translateZ(25px)' }}
                  >
                    <div>
                      <span
                        className="text-[9px] uppercase tracking-widest block"
                        style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Starting Price
                      </span>
                      <span
                        className="text-xl font-bold block mt-0.5"
                        style={{ color: 'var(--gold)', fontFamily: "'DM Mono', monospace", letterSpacing: '-0.02em' }}
                      >
                        ₹2.45 Cr
                      </span>
                    </div>
                    <button
                      onClick={() => router.push('/cars')}
                      className="btn-gold"
                      style={{ padding: '0.625rem 1rem', fontSize: '0.65rem' }}
                    >
                      View Inventory
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
          THE FF-CARS DIFFERENCE
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
              The FF-Cars{' '}
              <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--gold)' }}>
                Difference
              </em>
            </h2>
            <p
              className="mt-4 mx-auto max-w-lg"
              style={{ color: 'var(--silver)', fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
            >
              Every aspect of the FF-Cars experience is engineered around trust,
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
    </div>
  );
}
