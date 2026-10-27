'use client';

import React, { useState } from 'react';
import { useCompareStore } from '../store/useCompareStore';
import { X, Scale, Check, Minus, Sparkles, MapPin, Fuel, Gauge, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function CarComparisonDrawer() {
  const { compareList, removeFromCompare, clearCompare } = useCompareStore();
  const [isOpenModal, setIsOpenModal] = useState(false);

  if (compareList.length === 0) return null;

  return (
    <>
      {/* Floating Sticky Bottom Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-4xl bg-bg-surface border border-border rounded-lg shadow-lg p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-bg-surface-alt border border-border flex items-center justify-center text-accent">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-text-primary">Compare Vehicles</span>
              <span className="badge badge-info">
                {compareList.length}/4
              </span>
            </div>
            <p className="text-xs text-text-secondary">Select up to 4 models for side-by-side comparison</p>
          </div>
        </div>

        {/* Selected Car Thumbnails */}
        <div className="hidden md:flex items-center gap-2">
          {compareList.map((car) => (
            <div
              key={car.id}
              className="relative group w-10 h-10 rounded-lg overflow-hidden border border-border bg-bg-surface-alt"
            >
              <img
                src={car.images?.[0] || 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=400'}
                alt={car.title || car.model}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removeFromCompare(car.id)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                title="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={clearCompare}
            className="btn-neutral text-xs h-9 px-3"
          >
            Clear All
          </button>
          <button
            onClick={() => setIsOpenModal(true)}
            className="btn-primary text-xs h-9 px-4 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Compare Specs Now
          </button>
        </div>
      </div>

      {/* Comparison Fullscreen Modal */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-bg-surface border border-border rounded-lg shadow-lg overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-bg-surface-alt">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-bg-surface border border-border flex items-center justify-center text-accent">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-text-primary">
                      Side-by-Side Vehicle Comparison
                    </h3>
                    <span className="badge badge-info">
                      {compareList.length} Selected
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">Detailed specification and value breakdown</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpenModal(false)}
                className="btn-neutral w-8 h-8 p-0 flex items-center justify-center rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Matrix Table Container */}
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-border bg-bg-surface-alt">
                    <th className="p-3 w-48 text-xs font-bold uppercase tracking-wider text-text-secondary">
                      Features / Specs
                    </th>
                    {compareList.map((car) => (
                      <th key={car.id} className="p-3 text-center min-w-[200px]">
                        <div className="relative group flex flex-col items-center">
                          <button
                            onClick={() => removeFromCompare(car.id)}
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-status-danger text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <img
                            src={car.images?.[0] || 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=400'}
                            alt={car.title || car.model}
                            className="w-32 h-20 object-cover rounded-lg border border-border mb-2 shadow-sm"
                          />
                          <span className="text-sm font-bold text-text-primary line-clamp-1">{car.make} {car.model}</span>
                          <span className="text-xs text-accent font-bold mt-0.5">
                            ₹{(Number(car.price || 0) / 100000).toFixed(2)} Lakhs
                          </span>
                          <Link
                            href={`/cars/${car.id}`}
                            onClick={() => setIsOpenModal(false)}
                            className="mt-2 text-xs font-bold text-accent hover:underline flex items-center gap-1"
                          >
                            View Details <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  <tr className="hover:bg-bg-surface-alt transition-colors">
                    <td className="p-4 font-bold text-text-primary flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-accent" /> Year
                    </td>
                    {compareList.map((car) => (
                      <td key={car.id} className="p-4 text-center font-normal text-text-primary">
                        {car.year || '—'}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-bg-surface-alt transition-colors">
                    <td className="p-4 font-bold text-text-primary flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-accent" /> Mileage (KM)
                    </td>
                    {compareList.map((car) => (
                      <td key={car.id} className="p-4 text-center font-normal text-text-primary">
                        {car.mileage ? `${car.mileage.toLocaleString()} km` : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-bg-surface-alt transition-colors">
                    <td className="p-4 font-bold text-text-primary flex items-center gap-2">
                      <Fuel className="w-4 h-4 text-accent" /> Fuel Type
                    </td>
                    {compareList.map((car) => (
                      <td key={car.id} className="p-4 text-center font-normal text-text-primary capitalize">
                        {car.fuelType || 'Petrol'}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-bg-surface-alt transition-colors">
                    <td className="p-4 font-bold text-text-primary flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-accent" /> Branch Location
                    </td>
                    {compareList.map((car) => (
                      <td key={car.id} className="p-4 text-center font-normal text-text-primary">
                        {car.branch?.name || 'Main Showroom'}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-bg-surface-alt transition-colors">
                    <td className="p-4 font-bold text-text-primary flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-accent" /> Certification
                    </td>
                    {compareList.map((car) => (
                      <td key={car.id} className="p-4 text-center">
                        <span className="badge badge-success inline-flex items-center gap-1">
                          <Check className="w-3 h-3" /> 150-Pt Inspected
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-border bg-bg-surface-alt flex justify-end">
              <button
                onClick={() => setIsOpenModal(false)}
                className="btn-neutral text-xs h-9 px-4"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
