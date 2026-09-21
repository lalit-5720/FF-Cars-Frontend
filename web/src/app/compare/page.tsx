'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Scale, 
  X, 
  Plus, 
  ArrowRight, 
  Check, 
  ShieldCheck, 
  Gauge, 
  Fuel, 
  Calendar, 
  MapPin, 
  CircleDollarSign,
  Sparkles,
  Award
} from 'lucide-react';
import { useCompareStore } from '../../store/useCompareStore';
import { api } from '../../services/api';

export default function ComparePage() {
  const router = useRouter();
  const { compareList, removeFromCompare, clearCompare, addToCompare } = useCompareStore();
  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [isAddPickerOpen, setIsAddPickerOpen] = useState(false);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await api.get('/vehicles');
        const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
        setAllVehicles(list.filter((v: any) => (v.status || '').toLowerCase() !== 'sold'));
      } catch (err) {
        console.error('Failed to load inventory for compare', err);
      }
    };
    fetchVehicles();
  }, []);

  const calculateEmi = (price: number) => {
    const downPayment = price * 0.2;
    const principal = price - downPayment;
    const monthlyRate = 8.5 / 12 / 100;
    const tenureMonths = 60;
    if (principal <= 0) return 0;
    return Math.round(
      (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1)
    );
  };

  // Compute lowest KM, lowest Price, newest Year for winner badges
  const lowestKmCar = compareList.length > 1
    ? [...compareList].sort((a, b) => Number(a.kilometers_driven || a.kmDriven || 0) - Number(b.kilometers_driven || b.kmDriven || 0))[0]
    : null;

  const lowestPriceCar = compareList.length > 1
    ? [...compareList].sort((a, b) => Number(a.price || 0) - Number(b.price || 0))[0]
    : null;

  const newestYearCar = compareList.length > 1
    ? [...compareList].sort((a, b) => Number(b.manufacture_year || b.year || 0) - Number(a.manufacture_year || a.year || 0))[0]
    : null;

  return (
    <div className="min-h-screen bg-[#070A12] text-foreground py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest mb-1">
              <Scale className="w-4 h-4" />
              <span>Comparative Intelligence</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
              Side-by-Side Vehicle Comparison
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Compare luxury specifications, financing EMIs, and certified inspection ratings.
            </p>
          </div>

          {compareList.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={clearCompare}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white border border-gray-800 hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Clear Comparison
              </button>
              {compareList.length < 4 && (
                <button
                  onClick={() => setIsAddPickerOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Vehicle ({compareList.length}/4)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Empty State */}
        {compareList.length === 0 ? (
          <div className="p-16 rounded-3xl bg-[#0B0F1A] border border-[#1E2638] text-center flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Scale className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white font-display">No Vehicles in Comparison</h3>
            <p className="text-xs text-gray-400 max-w-md">
              Select up to 4 certified luxury cars from our catalog to compare performance, features, and ownership costs.
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => router.push('/cars')}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all shadow-md cursor-pointer"
              >
                Browse Inventory
              </button>
              <button
                onClick={() => setIsAddPickerOpen(true)}
                className="px-6 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Quick Pick From Showroom
              </button>
            </div>
          </div>
        ) : (
          /* Matrix Comparison Table */
          <div className="overflow-x-auto rounded-3xl border border-[#1E2638] bg-[#0B0F1A] shadow-2xl">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-[#1E2638] bg-[#101626]">
                  <th className="p-5 w-56 text-xs font-bold uppercase tracking-wider text-gray-400">
                    Vehicle Model
                  </th>
                  {compareList.map((car) => {
                    const id = car.vehicle_id || car.id;
                    const make = car.make || car.brand;
                    const price = Number(car.price || 0);
                    const isLowestKm = lowestKmCar && (lowestKmCar.vehicle_id || lowestKmCar.id) === id;
                    const isLowestPrice = lowestPriceCar && (lowestPriceCar.vehicle_id || lowestPriceCar.id) === id;
                    const isNewest = newestYearCar && (newestYearCar.vehicle_id || newestYearCar.id) === id;

                    return (
                      <th key={id} className="p-5 min-w-[240px] align-top">
                        <div className="relative flex flex-col gap-3">
                          <button
                            onClick={() => removeFromCompare(String(id))}
                            className="absolute -top-2 -right-2 p-1.5 rounded-full bg-gray-800 hover:bg-red-500 text-gray-400 hover:text-white transition-colors cursor-pointer"
                            title="Remove"
                          >
                            <X className="w-4 h-4" />
                          </button>

                          {/* Image */}
                          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-gray-900 border border-gray-800">
                            <img
                              src={car.image_url || car.images?.[0] || 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=600'}
                              alt={car.model}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Winner Badges */}
                          <div className="flex flex-wrap gap-1 min-h-[22px]">
                            {isLowestPrice && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                                💰 Best Price
                              </span>
                            )}
                            {isLowestKm && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[9px] font-bold">
                                🚀 Lowest Mileage
                              </span>
                            )}
                            {isNewest && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-bold">
                                ✨ Newest Model
                              </span>
                            )}
                          </div>

                          <div>
                            <h4 className="font-extrabold text-white text-base font-display">
                              {make} {car.model}
                            </h4>
                            <span className="text-xs text-gray-400">{car.color || 'Premium Edition'}</span>
                          </div>

                          <div className="pt-2 border-t border-gray-800">
                            <span className="font-mono font-black text-amber-400 text-xl block">
                              ₹{price.toLocaleString()}
                            </span>
                            <span className="text-[11px] text-gray-400 font-mono">
                              Est. EMI: ₹{calculateEmi(price).toLocaleString()}/mo
                            </span>
                          </div>

                          <button
                            onClick={() => router.push(`/cars/${id}`)}
                            className="mt-1 w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all shadow-sm cursor-pointer text-center"
                          >
                            View Details &rarr;
                          </button>
                        </div>
                      </th>
                    );
                  })}
                  {/* Empty Slot */}
                  {compareList.length < 4 && (
                    <th className="p-5 min-w-[200px] align-middle text-center bg-[#070A12]/50">
                      <button
                        onClick={() => setIsAddPickerOpen(true)}
                        className="p-6 rounded-2xl border-2 border-dashed border-gray-800 hover:border-amber-500/60 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-amber-400 transition-colors cursor-pointer w-full"
                      >
                        <Plus className="w-8 h-8" />
                        <span className="text-xs font-bold">Add Another Car</span>
                      </button>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2638] text-xs">
                {/* Year */}
                <tr>
                  <td className="p-4 font-bold text-gray-400 bg-[#0E1424]">Model Year</td>
                  {compareList.map((car) => (
                    <td key={car.id} className="p-4 font-semibold text-white">
                      {car.manufacture_year || car.year || 2022}
                    </td>
                  ))}
                  {compareList.length < 4 && <td className="bg-[#070A12]/30"></td>}
                </tr>

                {/* Kilometers Driven */}
                <tr>
                  <td className="p-4 font-bold text-gray-400 bg-[#0E1424]">Kilometers Driven</td>
                  {compareList.map((car) => (
                    <td key={car.id} className="p-4 font-semibold text-white font-mono">
                      {(car.kilometers_driven || car.kmDriven || 0).toLocaleString()} km
                    </td>
                  ))}
                  {compareList.length < 4 && <td className="bg-[#070A12]/30"></td>}
                </tr>

                {/* Fuel Type */}
                <tr>
                  <td className="p-4 font-bold text-gray-400 bg-[#0E1424]">Fuel Type</td>
                  {compareList.map((car) => (
                    <td key={car.id} className="p-4 font-semibold text-white">
                      {car.fuel_type || car.fuelType || 'Petrol'}
                    </td>
                  ))}
                  {compareList.length < 4 && <td className="bg-[#070A12]/30"></td>}
                </tr>

                {/* Transmission */}
                <tr>
                  <td className="p-4 font-bold text-gray-400 bg-[#0E1424]">Transmission</td>
                  {compareList.map((car) => (
                    <td key={car.id} className="p-4 font-semibold text-white">
                      {car.transmission || 'Automatic'}
                    </td>
                  ))}
                  {compareList.length < 4 && <td className="bg-[#070A12]/30"></td>}
                </tr>

                {/* Ownership History */}
                <tr>
                  <td className="p-4 font-bold text-gray-400 bg-[#0E1424]">Ownership History</td>
                  {compareList.map((car) => (
                    <td key={car.id} className="p-4 font-semibold text-white">
                      {car.owner_type || car.ownership || '1st Owner'}
                    </td>
                  ))}
                  {compareList.length < 4 && <td className="bg-[#070A12]/30"></td>}
                </tr>

                {/* Showroom Branch */}
                <tr>
                  <td className="p-4 font-bold text-gray-400 bg-[#0E1424]">Showroom Hub</td>
                  {compareList.map((car) => (
                    <td key={car.id} className="p-4 font-semibold text-white">
                      {car.branches?.branch_name || (car.branch_id === 2 ? 'Velachery Showroom' : 'Anna Nagar Showroom')}
                    </td>
                  ))}
                  {compareList.length < 4 && <td className="bg-[#070A12]/30"></td>}
                </tr>

                {/* Inspection Quality Certification */}
                <tr>
                  <td className="p-4 font-bold text-gray-400 bg-[#0E1424]">Inspection Score</td>
                  {compareList.map((car) => (
                    <td key={car.id} className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 font-mono">
                        <Award className="w-3.5 h-3.5" /> 98/100 Gold
                      </span>
                    </td>
                  ))}
                  {compareList.length < 4 && <td className="bg-[#070A12]/30"></td>}
                </tr>

                {/* Down Payment & Loan Principal */}
                <tr>
                  <td className="p-4 font-bold text-gray-400 bg-[#0E1424]">20% Down Payment</td>
                  {compareList.map((car) => {
                    const price = Number(car.price || 0);
                    return (
                      <td key={car.id} className="p-4 font-mono font-semibold text-white">
                        ₹{Math.round(price * 0.2).toLocaleString()}
                      </td>
                    );
                  })}
                  {compareList.length < 4 && <td className="bg-[#070A12]/30"></td>}
                </tr>
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Quick Add Picker Modal */}
      {isAddPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#0B0F1A] border border-[#2D374A] rounded-3xl shadow-2xl p-6 my-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white font-display">Add Vehicle to Comparison</h3>
              <button
                onClick={() => setIsAddPickerOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 max-h-96 overflow-y-auto space-y-2">
              {allVehicles
                .filter(v => !compareList.some(c => String(c.id || c.vehicle_id) === String(v.vehicle_id || v.id)))
                .map((car) => {
                  const id = car.vehicle_id || car.id;
                  const price = Number(car.price || 0);
                  return (
                    <div
                      key={id}
                      className="p-3 rounded-xl bg-[#141A2A] border border-gray-800 flex items-center justify-between gap-3 hover:border-amber-500/40 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={car.image_url || 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=200'}
                          alt={car.model}
                          className="w-16 h-12 rounded-lg object-cover bg-gray-900 border border-gray-800"
                        />
                        <div>
                          <h5 className="font-bold text-white text-sm">{car.make || car.brand} {car.model}</h5>
                          <span className="text-xs text-gray-400">{car.manufacture_year || 2022} &bull; ₹{price.toLocaleString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          addToCompare({ id: String(id), ...car });
                          setIsAddPickerOpen(false);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
