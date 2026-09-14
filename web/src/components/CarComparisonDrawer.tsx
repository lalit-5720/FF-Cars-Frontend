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
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-4xl bg-[#141A2A]/95 backdrop-blur-xl border border-[#5468F0]/40 rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5468F0]/20 border border-[#5468F0]/40 flex items-center justify-center text-[#5468F0]">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Compare Vehicles</span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#5468F0] text-white">
                {compareList.length}/4
              </span>
            </div>
            <p className="text-xs text-gray-400">Select up to 4 models for side-by-side comparison</p>
          </div>
        </div>

        {/* Selected Car Thumbnails */}
        <div className="hidden md:flex items-center gap-2">
          {compareList.map((car) => (
            <div
              key={car.id}
              className="relative group w-12 h-12 rounded-lg overflow-hidden border border-gray-700 bg-gray-900"
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
            className="text-xs text-gray-400 hover:text-white px-3 py-2 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={() => setIsOpenModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5468F0] to-[#7B8CFF] hover:from-[#4355D6] hover:to-[#6A7BEE] text-white text-xs font-bold shadow-lg shadow-[#5468F0]/30 transition-all hover:scale-105"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            Compare Specs Now
          </button>
        </div>
      </div>

      {/* Comparison Fullscreen Modal */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-6xl bg-[#0B0F1A] border border-[#2D374A] rounded-3xl shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#2D374A] flex items-center justify-between bg-[#141A2A]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#5468F0]/20 border border-[#5468F0]/40 flex items-center justify-center text-[#5468F0]">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Side-by-Side Vehicle Comparison
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#5468F0]/20 text-[#5468F0] border border-[#5468F0]/30">
                      {compareList.length} Selected
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400">Detailed specification and value breakdown</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpenModal(false)}
                className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Matrix Table Container */}
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr>
                    <th className="p-4 w-48 text-xs font-bold uppercase tracking-wider text-gray-500 bg-[#141A2A]/50 rounded-l-xl">
                      Features / Specs
                    </th>
                    {compareList.map((car) => (
                      <th key={car.id} className="p-4 text-center bg-[#141A2A]/30 min-w-[200px]">
                        <div className="relative group flex flex-col items-center">
                          <button
                            onClick={() => removeFromCompare(car.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500/80 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <img
                            src={car.images?.[0] || 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=400'}
                            alt={car.title || car.model}
                            className="w-36 h-24 object-cover rounded-xl border border-gray-700 mb-3 shadow-md"
                          />
                          <span className="text-sm font-bold text-white line-clamp-1">{car.make} {car.model}</span>
                          <span className="text-xs text-amber-400 font-bold mt-1">
                            ₹{(Number(car.price || 0) / 100000).toFixed(2)} Lakhs
                          </span>
                          <Link
                            href={`/cars/${car.id}`}
                            onClick={() => setIsOpenModal(false)}
                            className="mt-3 text-xs font-semibold text-[#5468F0] hover:text-[#7B8CFF] flex items-center gap-1 group-hover:underline"
                          >
                            View Details <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D374A]/60 text-sm text-gray-300">
                  <tr>
                    <td className="p-4 font-semibold text-gray-400 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#5468F0]" /> Year
                    </td>
                    {compareList.map((car) => (
                      <td key={car.id} className="p-4 text-center font-medium">
                        {car.year || 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-gray-400 flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-emerald-400" /> Mileage (KM)
                    </td>
                    {compareList.map((car) => (
                      <td key={car.id} className="p-4 text-center font-medium">
                        {car.mileage ? `${car.mileage.toLocaleString()} km` : 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-gray-400 flex items-center gap-2">
                      <Fuel className="w-4 h-4 text-amber-400" /> Fuel Type
                    </td>
                    {compareList.map((car) => (
                      <td key={car.id} className="p-4 text-center font-medium capitalize">
                        {car.fuelType || 'Petrol'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-gray-400 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-400" /> Branch Location
                    </td>
                    {compareList.map((car) => (
                      <td key={car.id} className="p-4 text-center font-medium">
                        {car.branch?.name || 'Main Showroom'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-gray-400 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-400" /> Certification
                    </td>
                    {compareList.map((car) => (
                      <td key={car.id} className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Check className="w-3 h-3" /> 150-Pt Inspected
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-[#2D374A] bg-[#141A2A] flex justify-end">
              <button
                onClick={() => setIsOpenModal(false)}
                className="px-6 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold transition-colors"
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
