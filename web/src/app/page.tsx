'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../services/api';
import { ShieldCheck, Calendar, Zap, Sparkles, ArrowRight, Heart, Star } from 'lucide-react';
import { useWishlistStore } from '../store/useWishlistStore';
import { useAuthStore } from '../store/useAuthStore';
import { showLocalToast } from '../components/Toast';
import { ThreeDCard } from '../components/ThreeDCard';

export default function HomePage() {
  const router = useRouter();
  const [featuredCars, setFeaturedCars] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await api.get('/cars?limit=3');
        setFeaturedCars(response.data.data);
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
      showLocalToast('Please log in to wishlist cars');
      router.push('/login');
      return;
    }
    const added = await toggleWishlist(carId);
    showLocalToast(added ? 'Added to wishlist!' : 'Removed from wishlist.');
  };

  const brands = [
    { name: 'Porsche', logo: 'P' },
    { name: 'BMW', logo: 'B' },
    { name: 'Mercedes-Benz', logo: 'M' },
    { name: 'Audi', logo: 'A' },
    { name: 'Tesla', logo: 'T' },
    { name: 'Land Rover', logo: 'L' },
    { name: 'Jaguar', logo: 'J' },
    { name: 'Aston Martin', logo: 'AM' },
  ];

  return (
    <div className="flex flex-col flex-1 bg-black text-white">
      {/* 3D Interactive Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-zinc-900 bg-radial-[circle_at_top,_var(--tw-gradient-stops)] from-zinc-900 via-black to-black">
        {/* Dot Matrix Wireframe Grid Backdrop */}
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        
        {/* Soft Radial Ambient Lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Premium Pitch */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-left items-start z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] bg-white/10 text-white border border-white/20 uppercase backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Next-Gen Luxury Car Marketplace
            </div>
            
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.05]">
              DRIVE THE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-600">
                ULTIMATE CHOICE
              </span>
            </h1>
            
            <p className="max-w-xl text-base sm:text-lg text-zinc-400 leading-relaxed font-light">
              Direct peer-to-peer secure transaction locks. 200-point inspected certifications. 
              Zero hidden fees. Reimagining premium automotive trading with absolute transparency.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
              <Link
                href="/cars"
                className="px-8 py-4 rounded-full bg-white text-black font-extrabold text-sm tracking-wider uppercase hover:bg-zinc-200 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 group cursor-pointer"
              >
                Browse Inventory 
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/register"
                className="px-8 py-4 rounded-full border border-zinc-800 text-white bg-black/40 backdrop-blur-md font-extrabold text-sm tracking-wider uppercase hover:bg-white hover:text-black hover:border-white transition-all flex items-center justify-center cursor-pointer"
              >
                Join FF-Cars
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-8 mt-8 pt-8 border-t border-zinc-900 w-full max-w-md">
              <div>
                <span className="block text-2xl font-black text-white font-mono">250+</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Premium Cars</span>
              </div>
              <div>
                <span className="block text-2xl font-black text-white font-mono">0.0s</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Lock Latency</span>
              </div>
              <div>
                <span className="block text-2xl font-black text-white font-mono">100%</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Guaranteed</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Parallax Showcase Hero Card */}
          <div className="lg:col-span-5 flex justify-center items-center z-10">
            <ThreeDCard maxTilt={12} className="w-full max-w-[420px] aspect-[3/4]">
              <div className="relative w-full h-full rounded-3xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col justify-between overflow-hidden shadow-2xl preserve-3d">
                {/* Background grid */}
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)',
                    backgroundSize: '16px 16px',
                  }}
                />
                
                {/* Floating Glow */}
                <div className="absolute -top-16 -right-16 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                {/* Top details */}
                <div className="flex justify-between items-start z-10 preserve-3d">
                  <div style={{ transform: 'translateZ(30px)' }}>
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Showcase</span>
                    <h3 className="font-display font-black text-2xl text-white mt-1">Porsche 911</h3>
                    <p className="text-xs text-zinc-400">GT3 RS Coupe</p>
                  </div>
                  <span
                    className="px-3 py-1 rounded bg-white text-black font-mono text-xs font-black"
                    style={{ transform: 'translateZ(40px)' }}
                  >
                    MY26
                  </span>
                </div>

                {/* Center Image Container with 3D Depth */}
                <div 
                  className="relative w-full aspect-[16/10] my-4 flex items-center justify-center z-20 preserve-3d"
                  style={{ transform: 'translateZ(50px) scale(1.1)' }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=800"
                    alt="Porsche GT3"
                    className="w-full h-full object-contain filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.85)]"
                  />
                </div>

                {/* Bottom Spec Floating Tags */}
                <div className="flex flex-col gap-4 z-10 preserve-3d">
                  <div className="grid grid-cols-3 gap-2 text-center" style={{ transform: 'translateZ(35px)' }}>
                    <div className="bg-zinc-900/80 border border-zinc-800 p-2.5 rounded-xl">
                      <span className="block text-[8px] uppercase tracking-wider text-zinc-500">0-100 km/h</span>
                      <span className="font-mono text-xs font-bold text-white">3.2s</span>
                    </div>
                    <div className="bg-zinc-900/80 border border-zinc-800 p-2.5 rounded-xl">
                      <span className="block text-[8px] uppercase tracking-wider text-zinc-500">Max Power</span>
                      <span className="font-mono text-xs font-bold text-white">525 HP</span>
                    </div>
                    <div className="bg-zinc-900/80 border border-zinc-800 p-2.5 rounded-xl">
                      <span className="block text-[8px] uppercase tracking-wider text-zinc-500">Top Speed</span>
                      <span className="font-mono text-xs font-bold text-white">296 km/h</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center" style={{ transform: 'translateZ(25px)' }}>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-zinc-500">Direct Lock Price</span>
                      <span className="block text-lg font-black text-white font-mono">₹24,500,000</span>
                    </div>
                    <button 
                      onClick={() => router.push('/cars')}
                      className="px-4 py-2 bg-white text-black font-extrabold text-[10px] uppercase tracking-widest rounded-lg hover:bg-zinc-200 transition-colors"
                    >
                      Inspect Live
                    </button>
                  </div>
                </div>

              </div>
            </ThreeDCard>
          </div>

        </div>
      </section>

      {/* Quick Brand Filter */}
      <section className="py-16 bg-zinc-950 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-8">
            Filter by Premium Brand
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {brands.map((brand) => (
              <button
                key={brand.name}
                onClick={() => router.push(`/cars?brand=${brand.name}`)}
                className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:bg-white hover:text-black hover:border-white transition-all duration-300 cursor-pointer text-center group"
              >
                <div className="w-12 h-12 rounded-full border border-zinc-800 bg-zinc-900 text-white flex items-center justify-center font-display font-extrabold text-sm group-hover:bg-black group-hover:border-zinc-900 transition-colors">
                  {brand.logo}
                </div>
                <span className="text-xs font-semibold tracking-wide truncate max-w-full">{brand.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings Section */}
      <section className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-14">
            <div>
              <span className="text-zinc-500 font-extrabold text-xs uppercase tracking-[0.25em]">Handpicked Options</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 font-display">Featured Cars</h2>
            </div>
            <Link
              href="/cars"
              className="text-white hover:text-zinc-300 font-extrabold text-xs uppercase tracking-widest flex items-center gap-2 group border-b border-white/20 pb-1"
            >
              View All Cars 
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="rounded-3xl border border-zinc-950 bg-zinc-950/80 overflow-hidden h-[420px] skeleton-shimmer" />
              ))}
            </div>
          ) : featuredCars.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
              No cars currently listed in database. Seeding failed or table empty.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredCars.map((car) => (
                <ThreeDCard key={car.id} maxTilt={6} className="h-full">
                  <Link
                    href={`/cars/${car.id}`}
                    className="group rounded-3xl border border-zinc-900 bg-zinc-950 overflow-hidden flex flex-col h-full hover:border-zinc-700 transition-colors shadow-xl preserve-3d"
                  >
                    {/* Photo Container */}
                    <div className="relative aspect-video w-full overflow-hidden bg-zinc-900 preserve-3d">
                      <img
                        src={car.thumbnail}
                        alt={`${car.brand} ${car.model}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <button
                        onClick={(e) => handleWishlistToggle(e, car.id)}
                        className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md shadow-md transition-all border ${
                          isWishlisted(car.id)
                            ? 'bg-white border-white text-black'
                            : 'bg-black/45 border-white/10 text-white hover:bg-black/75'
                        }`}
                        style={{ transform: 'translateZ(30px)' }}
                      >
                        <Heart className="w-4 h-4" fill={isWishlisted(car.id) ? 'currentColor' : 'none'} />
                      </button>
                      <div 
                        className="absolute bottom-4 left-4 px-3 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase backdrop-blur-md bg-black/60 text-white border border-white/10"
                        style={{ transform: 'translateZ(25px)' }}
                      >
                        {car.year}
                      </div>
                    </div>

                    {/* Description Box */}
                    <div className="p-6 flex-1 flex flex-col justify-between preserve-3d">
                      <div className="preserve-3d">
                        <div className="flex justify-between items-start gap-2 mb-2" style={{ transform: 'translateZ(20px)' }}>
                          <div>
                            <h3 className="font-semibold text-lg leading-tight text-white group-hover:text-zinc-300 transition-colors">
                              {car.brand} {car.model}
                            </h3>
                            <p className="text-xs text-zinc-500 mt-1">{car.variant}</p>
                          </div>
                          <span className="flex-shrink-0 inline-block px-2.5 py-0.5 rounded text-[9px] font-black bg-zinc-900 text-zinc-400 border border-zinc-800 uppercase tracking-wider">
                            {car.transmission}
                          </span>
                        </div>

                        <div 
                          className="grid grid-cols-3 gap-2 py-4 border-y border-zinc-900 my-4 text-xs text-zinc-400"
                          style={{ transform: 'translateZ(15px)' }}
                        >
                          <div>
                            <span className="block text-[9px] uppercase font-bold text-zinc-600 tracking-wider">Driven</span>
                            <span className="font-semibold text-white mt-0.5 block">{(car.kmDriven).toLocaleString()} km</span>
                          </div>
                          <div>
                            <span className="block text-[9px] uppercase font-bold text-zinc-600 tracking-wider">Fuel</span>
                            <span className="font-semibold text-white mt-0.5 block">{car.fuelType}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] uppercase font-bold text-zinc-600 tracking-wider">Owner</span>
                            <span className="font-semibold text-white mt-0.5 block">{car.ownership}</span>
                          </div>
                        </div>
                      </div>

                      {/* Price and Action */}
                      <div className="flex items-end justify-between mt-auto pt-2 preserve-3d" style={{ transform: 'translateZ(25px)' }}>
                        <div>
                          <span className="text-[9px] uppercase text-zinc-600 font-bold tracking-wider block">Price</span>
                          <span className="text-xl font-black text-white font-mono mt-1 block">
                            ₹{(car.price).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-[11px] font-black uppercase tracking-widest text-white flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Details / Test Ride <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </ThreeDCard>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Assurances Banner */}
      <section className="py-24 bg-zinc-950 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-zinc-500 font-extrabold text-xs uppercase tracking-[0.25em]">Our Guarantees</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 mb-16 font-display">The FF-Cars Difference</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl border border-zinc-900 bg-zinc-950 hover:border-zinc-700 transition-colors flex flex-col items-center text-center">
              <div className="p-4 rounded-2xl bg-zinc-900 text-white mb-6 border border-zinc-800">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold">200-Point Inspection</h3>
              <p className="text-sm text-zinc-400 mt-3 leading-relaxed font-light">
                Every vehicle undergoes a rigorous 200-point mechanical, structural, and electrical inspection 
                by our expert technicians before certification.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-zinc-900 bg-zinc-950 hover:border-zinc-700 transition-colors flex flex-col items-center text-center">
              <div className="p-4 rounded-2xl bg-zinc-900 text-white mb-6 border border-zinc-800">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold">5-Day Money-Back</h3>
              <p className="text-sm text-zinc-400 mt-3 leading-relaxed font-light">
                Change your mind? No worries. We offer a full 100% money-back guarantee within 5 days of purchase 
                if you aren't completely satisfied.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-zinc-900 bg-zinc-950 hover:border-zinc-700 transition-colors flex flex-col items-center text-center">
              <div className="p-4 rounded-2xl bg-zinc-900 text-white mb-6 border border-zinc-800">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold">Secure Concurrency Queue</h3>
              <p className="text-sm text-zinc-400 mt-3 leading-relaxed font-light">
                Our transaction engine processes test ride requests securely, ensuring seamless concurrency management prior to admin approval.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
