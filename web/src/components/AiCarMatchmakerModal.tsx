'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Car, 
  Gauge, 
  Fuel, 
  ShieldCheck, 
  Flame, 
  Briefcase, 
  Users, 
  Zap,
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api';

interface AiCarMatchmakerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiCarMatchmakerModal({ isOpen, onClose }: AiCarMatchmakerModalProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [allCars, setAllCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // User Quiz Answers
  const [lifestyle, setLifestyle] = useState<string>('executive');
  const [budget, setBudget] = useState<string>('mid');
  const [transmission, setTransmission] = useState<string>('any');
  const [priority, setPriority] = useState<string>('luxury');
  const [matchedCars, setMatchedCars] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      const fetchCars = async () => {
        setLoading(true);
        try {
          const res = await api.get('/vehicles');
          const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
          const available = list.filter((c: any) => (c.status || '').toLowerCase() !== 'sold');
          setAllCars(available);
        } catch (err) {
          console.error('Failed to load cars for quiz', err);
        } finally {
          setLoading(false);
        }
      };
      fetchCars();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const calculateMatches = () => {
    if (allCars.length === 0) return;

    const scored = allCars.map((car) => {
      let score = 70;
      const price = Number(car.price || 0);
      const km = Number(car.kilometers_driven || car.kmDriven || 0);
      const trans = (car.transmission || '').toLowerCase();
      const make = (car.make || car.brand || '').toLowerCase();
      const reasons: string[] = [];

      // Lifestyle scoring
      if (lifestyle === 'performance' && (make.includes('porsche') || make.includes('bmw') || make.includes('jaguar') || price > 5000000)) {
        score += 15;
        reasons.push('High-output sports powertrain');
      } else if (lifestyle === 'family' && (make.includes('land rover') || make.includes('range rover') || car.model?.toLowerCase().includes('velar') || car.model?.toLowerCase().includes('f-pace'))) {
        score += 15;
        reasons.push('Expansive cabin & luggage volume');
      } else if (lifestyle === 'executive' && (make.includes('mercedes') || make.includes('audi') || make.includes('bmw'))) {
        score += 15;
        reasons.push('Prestige corporate road presence');
      } else {
        score += 8;
        reasons.push('Versatile daily drivability');
      }

      // Budget scoring
      if (budget === 'smart' && price <= 3000000) {
        score += 10;
        reasons.push('Optimal budget alignment');
      } else if (budget === 'mid' && price > 3000000 && price <= 6000000) {
        score += 10;
        reasons.push('High-tier value for money');
      } else if (budget === 'high' && price > 6000000 && price <= 12000000) {
        score += 10;
        reasons.push('Premium luxury bracket');
      } else if (budget === 'flagship' && price > 12000000) {
        score += 10;
        reasons.push('Pinnacle flagship acquisition');
      }

      // Transmission scoring
      if (transmission === 'automatic' && (trans.includes('auto') || trans.includes('pdk') || trans.includes('dsg'))) {
        score += 5;
        reasons.push('Effortless automatic gearbox');
      }

      // Priority scoring
      if (priority === 'low_km' && km < 20000) {
        score += 5;
        reasons.push(`Ultra-low mileage (${km.toLocaleString()} km)`);
      } else if (priority === 'luxury' && (make.includes('mercedes') || make.includes('audi') || make.includes('porsche'))) {
        score += 5;
        reasons.push('Signature luxury craftsmanship');
      }

      const clampedScore = Math.min(99, Math.max(78, score));
      return { ...car, matchScore: clampedScore, matchReasons: reasons.slice(0, 3) };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    setMatchedCars(scored.slice(0, 3));
    setStep(5); // Results step
  };

  const resetQuiz = () => {
    setStep(1);
    setLifestyle('executive');
    setBudget('mid');
    setTransmission('any');
    setPriority('luxury');
    setMatchedCars([]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-bg-surface border border-border rounded-lg shadow-lg overflow-hidden my-6 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-bg-surface-alt">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-bg-surface border border-border flex items-center justify-center text-text-primary">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                AI Vehicle Matchmaker
                <span className="badge-info text-xs">
                  Concierge Quiz
                </span>
              </h3>
              <p className="text-xs text-text-secondary">Answer 4 quick questions to find your dream luxury car</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-neutral w-8 h-8 p-0 flex items-center justify-center rounded-lg"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar (for steps 1-4) */}
        {step <= 4 && (
          <div className="w-full bg-border h-1.5">
            <div
              className="bg-accent h-1.5 transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        )}

        {/* Quiz Steps Body */}
        <div className="p-6 min-h-[360px] flex flex-col justify-between">
          
          {/* STEP 1: LIFESTYLE */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <span className="text-xs font-bold uppercase tracking-wider text-accent">Step 1 of 4</span>
              <h4 className="text-base font-bold text-text-primary">What is your primary driving purpose?</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { id: 'executive', title: 'Executive & Business', icon: Briefcase, desc: 'Prestigious corporate presence & luxury client transport' },
                  { id: 'performance', title: 'Sport & Pure Thrill', icon: Flame, desc: 'High acceleration, precision cornering & sport exhaust note' },
                  { id: 'family', title: 'Family & Long Drives', icon: Users, desc: 'Expansive SUV cabin, high safety rating & luggage capacity' },
                  { id: 'commute', title: 'Daily Urban Agility', icon: Zap, desc: 'Effortless city maneuverability & refined daily fuel efficiency' },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = lifestyle === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setLifestyle(opt.id)}
                      className={`p-4 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-2 ${
                        isSelected
                          ? 'border-accent bg-bg-surface-alt shadow-sm'
                          : 'border-border bg-bg-surface hover:bg-bg-surface-alt'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-accent' : 'text-text-secondary'}`} />
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-accent" />}
                      </div>
                      <span className="text-sm font-bold text-text-primary">{opt.title}</span>
                      <span className="text-xs text-text-secondary leading-snug">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: BUDGET */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <span className="text-xs font-bold uppercase tracking-wider text-accent">Step 2 of 4</span>
              <h4 className="text-base font-bold text-text-primary">What is your targeted budget envelope?</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { id: 'smart', title: 'Curated Value', range: 'Under ₹25 Lakhs', desc: 'Virtus GT, Skoda Superb, entry premium choices' },
                  { id: 'mid', title: 'Executive Luxury', range: '₹25L – ₹50 Lakhs', desc: 'BMW 3 Series, Audi A4, Mercedes C-Class sedans' },
                  { id: 'high', title: 'High-End Prestige', range: '₹50L – ₹1 Crore', desc: 'Velar, Jaguar F-Pace, BMW 5 Series, Audi Q7' },
                  { id: 'flagship', title: 'Ultra Luxury & Supercar', range: '₹1 Crore & Above', desc: 'Porsche 911, AMG GT, S-Class, Range Rover Autobiography' },
                ].map((opt) => {
                  const isSelected = budget === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setBudget(opt.id)}
                      className={`p-4 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'border-accent bg-bg-surface-alt shadow-sm'
                          : 'border-border bg-bg-surface hover:bg-bg-surface-alt'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-text-primary">{opt.title}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-accent" />}
                      </div>
                      <span className="text-xs font-mono font-bold text-accent">{opt.range}</span>
                      <span className="text-xs text-text-secondary leading-snug">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: TRANSMISSION */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <span className="text-xs font-bold uppercase tracking-wider text-accent">Step 3 of 4</span>
              <h4 className="text-base font-bold text-text-primary">Preferred transmission style?</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { id: 'automatic', title: 'Automatic / Dual-Clutch', desc: 'Smooth city traffic crawling & lightning-fast paddle shifts (DSG/PDK)' },
                  { id: 'manual', title: 'Manual Engagement', desc: 'Purity of mechanical clutch control for driving purists' },
                  { id: 'any', title: 'Open to All Options', desc: 'Focus on vehicle quality and performance over transmission type' },
                ].map((opt) => {
                  const isSelected = transmission === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTransmission(opt.id)}
                      className={`p-4 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'border-accent bg-bg-surface-alt shadow-sm'
                          : 'border-border bg-bg-surface hover:bg-bg-surface-alt'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-text-primary">{opt.title}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-accent" />}
                      </div>
                      <span className="text-xs text-text-secondary leading-snug">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: TOP PRIORITY */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <span className="text-xs font-bold uppercase tracking-wider text-accent">Step 4 of 4</span>
              <h4 className="text-base font-bold text-text-primary">What is your single most important buying priority?</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { id: 'luxury', title: 'Supreme Luxury & Tech', desc: 'Panoramic sunroof, premium sound, ventilated seats & pristine upholstery' },
                  { id: 'low_km', title: 'Low Odometer & Newer Year', desc: 'Under 25,000 km driven with latest generation safety suite' },
                  { id: 'performance', title: 'Raw Acceleration & Dynamics', desc: 'Sub-6s 0-100 km/h, tuned suspension and sport driving modes' },
                  { id: 'value', title: 'Maximum Resale & Reliability', desc: 'Trusted marques with extensive service network and high retention' },
                ].map((opt) => {
                  const isSelected = priority === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPriority(opt.id)}
                      className={`p-4 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'border-accent bg-bg-surface-alt shadow-sm'
                          : 'border-border bg-bg-surface hover:bg-bg-surface-alt'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-text-primary">{opt.title}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-accent" />}
                      </div>
                      <span className="text-xs text-text-secondary leading-snug">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* RESULTS STEP (STEP 5) */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-accent">AI Recommendations</span>
                  <h4 className="text-base font-bold text-text-primary">Your Personalized Vehicle Matches</h4>
                </div>
                <button
                  type="button"
                  onClick={resetQuiz}
                  className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retake Quiz
                </button>
              </div>

              {matchedCars.length === 0 ? (
                <div className="text-center py-12 text-text-secondary">
                  <Car className="w-10 h-10 mx-auto text-text-secondary mb-2" />
                  <p className="text-sm">No vehicles matched this exact criteria right now.</p>
                  <button
                    type="button"
                    onClick={() => { onClose(); router.push('/cars'); }}
                    className="btn-primary mt-4"
                  >
                    Browse All Inventory
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {matchedCars.map((car, idx) => {
                    const id = car.vehicle_id || car.id;
                    const make = car.make || car.brand;
                    const price = Number(car.price || 0);
                    const km = Number(car.kilometers_driven || car.kmDriven || 0);
                    const img = car.image_url || 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=600';

                    return (
                      <div
                        key={id}
                        className="p-4 rounded-lg bg-bg-surface-alt border border-border flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:border-accent"
                      >
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className="relative w-20 h-16 rounded-lg overflow-hidden bg-bg-surface flex-shrink-0 border border-border">
                            <img src={img} alt={car.model} className="w-full h-full object-cover" />
                            <span className="badge-neutral absolute bottom-1 left-1 text-xs">
                              #{idx + 1}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-text-primary text-sm">{make} {car.model}</h5>
                              <span className="badge-success text-xs">
                                {car.matchScore}% Match
                              </span>
                            </div>
                            <div className="text-xs text-text-secondary mt-0.5">
                              {car.manufacture_year || 2022} &bull; {km.toLocaleString()} km &bull; {car.fuel_type || 'Petrol'}
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {car.matchReasons?.map((r: string, rIdx: number) => (
                                <span key={rIdx} className="text-xs px-2 py-0.5 rounded bg-bg-surface text-text-secondary border border-border">
                                  &bull; {r}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-border">
                          <span className="font-mono font-bold text-accent text-base">
                            ₹{price.toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              router.push(`/cars/${id}`);
                            }}
                            className="btn-primary text-xs"
                          >
                            View Vehicle &rarr;
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Navigation Controls (Steps 1-4) */}
          {step <= 4 && (
            <div className="flex items-center justify-between pt-6 border-t border-border">
              <button
                type="button"
                disabled={step === 1}
                onClick={() => setStep(prev => Math.max(1, prev - 1))}
                className="btn-neutral text-xs disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep(prev => prev + 1)}
                  className="btn-primary text-xs"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={calculateMatches}
                  className="btn-primary text-xs flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 fill-current" /> Find My Match
                </button>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
