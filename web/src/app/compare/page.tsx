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
    <div className="min-h-screen bg-bg-page text-text-primary py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-1.5 helper-text font-bold text-accent uppercase tracking-wider mb-1">
              <Scale className="w-4 h-4" />
              <span>Comparative Analysis</span>
            </div>
            <h1 className="page-title text-text-primary">
              Vehicle Comparison
            </h1>
            <p className="helper-text mt-1">
              Compare vehicle specifications, monthly loan EMIs, and inspection ratings side by side.
            </p>
          </div>

          {compareList.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={clearCompare}
                className="btn-neutral"
              >
                Clear All
              </button>
              {compareList.length < 4 && (
                <button
                  onClick={() => setIsAddPickerOpen(true)}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Vehicle ({compareList.length}/4)</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Empty State */}
        {compareList.length === 0 ? (
          <div className="p-12 rounded-lg bg-bg-surface border border-border text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-bg-surface-alt border border-border flex items-center justify-center text-accent">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="section-heading text-text-primary">No Vehicles Selected</h3>
            <p className="body-text text-text-secondary max-w-md">
              Select up to 4 certified vehicles from our inventory to compare specifications and prices side-by-side.
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => router.push('/cars')}
                className="btn-primary"
              >
                Browse Inventory
              </button>
              <button
                onClick={() => setIsAddPickerOpen(true)}
                className="btn-neutral"
              >
                Quick Add Vehicle
              </button>
            </div>
          </div>
        ) : (
          /* Matrix Comparison Table */
          <div className="overflow-x-auto rounded-lg border border-border bg-bg-surface">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-border bg-bg-surface-alt">
                  <th className="p-4 w-56 table-header">
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
                      <th key={id} className="p-4 min-w-[240px] align-top bg-bg-surface border-l border-border">
                        <div className="relative flex flex-col gap-3">
                          <button
                            onClick={() => removeFromCompare(String(id))}
                            className="absolute -top-1 -right-1 p-1 rounded-lg bg-bg-surface-alt border border-border text-text-secondary hover:text-status-danger transition-colors cursor-pointer"
                            title="Remove"
                          >
                            <X className="w-4 h-4" />
                          </button>

                          {/* Image */}
                          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-bg-surface-alt border border-border">
                            <img
                              src={car.image_url || car.images?.[0] || 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=600'}
                              alt={car.model}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Winner Badges */}
                          <div className="flex flex-wrap gap-1 min-h-[22px]">
                            {isLowestPrice && (
                              <span className="badge badge-success text-[10px]">
                                Best Price
                              </span>
                            )}
                            {isLowestKm && (
                              <span className="badge badge-info text-[10px]">
                                Lowest Mileage
                              </span>
                            )}
                            {isNewest && (
                              <span className="badge badge-warning text-[10px]">
                                Newest Model
                              </span>
                            )}
                          </div>

                          <div>
                            <h4 className="section-heading text-sm text-text-primary">
                              {make} {car.model}
                            </h4>
                            <span className="helper-text">{car.color || 'Standard Edition'}</span>
                          </div>

                          <div className="pt-2 border-t border-border">
                            <span className="section-heading text-text-primary block">
                              ₹{price.toLocaleString()}
                            </span>
                            <span className="helper-text block">
                              Est. EMI: ₹{calculateEmi(price).toLocaleString()}/mo
                            </span>
                          </div>

                          <button
                            onClick={() => router.push(`/cars/${id}`)}
                            className="btn-primary w-full text-xs"
                          >
                            View Details
                          </button>
                        </div>
                      </th>
                    );
                  })}
                  {/* Empty Slot */}
                  {compareList.length < 4 && (
                    <th className="p-4 min-w-[200px] align-middle text-center bg-bg-surface-alt border-l border-border">
                      <button
                        onClick={() => setIsAddPickerOpen(true)}
                        className="p-6 rounded-lg border border-dashed border-border hover:border-accent flex flex-col items-center justify-center gap-2 text-text-secondary hover:text-text-primary transition-colors cursor-pointer w-full bg-bg-surface"
                      >
                        <Plus className="w-6 h-6 text-accent" />
                        <span className="helper-text font-bold">Add Another Car</span>
                      </button>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {/* Year */}
                <tr>
                  <td className="p-4 helper-text font-bold uppercase bg-bg-surface-alt">Model Year</td>
                  {compareList.map((car) => (
                    <td key={car.id} className="p-4 body-text font-bold border-l border-border">
                      {car.manufacture_year || car.year || 2022}
                    </td>
                  ))}
                  {compareList.length < 4 && <td className="border-l border-border bg-bg-surface-alt">—</td>}
                </tr>

                {/* Kilometers Driven */}
                <tr>
                  <td className="p-4 helper-text font-bold uppercase bg-bg-surface-alt">Kilometers Driven</td>
                  {compareList.map((car) => (
                    <td key={car.id} className="p-4 body-text border-l border-border">
                      {(car.kilometers_driven || car.kmDriven || 0).toLocaleString()} km
                    </td>
                  ))}
                  {compareList.length < 4 && <td className="border-l border-border bg-bg-surface-alt">—</td>}
                </tr>

                {/* Fuel Type */}
                <tr>
                  <td className="p-4 helper-text font-bold uppercase bg-bg-surface-alt">Fuel Type</td>
                  {compareList.map((car) => (
                    <td key={car.id} className="p-4 body-text border-l border-border">
                      {car.fuel_type || car.fuelType || 'Petrol'}
                    </td>
                  ))}
                  {compareList.length < 4 && <td className="border-l border-border bg-bg-surface-alt">—</td>}
                </tr>

                {/* Transmission */}
                <tr>
                  <td className="p-4 helper-text font-bold uppercase bg-bg-surface-alt">Transmission</td>
                  {compareList.map((car) => (
                    <td key={car.id} className="p-4 body-text border-l border-border">
                      {car.transmission || 'Automatic'}
                    </td>
                  ))}
                  {compareList.length < 4 && <td className="border-l border-border bg-bg-surface-alt">—</td>}
                </tr>

                {/* Ownership History */}
                <tr>
                  <td className="p-4 helper-text font-bold uppercase bg-bg-surface-alt">Ownership History</td>
                  {compareList.map((car) => (
                    <td key={car.id} className="p-4 body-text border-l border-border">
                      {car.owner_type || car.ownership || '1st Owner'}
                    </td>
                  ))}
                  {compareList.length < 4 && <td className="border-l border-border bg-bg-surface-alt">—</td>}
                </tr>

                {/* Showroom Branch */}
                <tr>
                  <td className="p-4 helper-text font-bold uppercase bg-bg-surface-alt">Showroom Location</td>
                  {compareList.map((car) => (
                    <td key={car.id} className="p-4 body-text border-l border-border">
                      {car.branches?.branch_name || (car.branch_id === 2 ? 'Velachery Showroom' : 'Anna Nagar Showroom')}
                    </td>
                  ))}
                  {compareList.length < 4 && <td className="border-l border-border bg-bg-surface-alt">—</td>}
                </tr>

                {/* Inspection Quality Certification */}
                <tr>
                  <td className="p-4 helper-text font-bold uppercase bg-bg-surface-alt">Inspection Score</td>
                  {compareList.map((car) => (
                    <td key={car.id} className="p-4 border-l border-border">
                      <span className="badge badge-success">
                        <Award className="w-3.5 h-3.5" /> 98/100 Gold
                      </span>
                    </td>
                  ))}
                  {compareList.length < 4 && <td className="border-l border-border bg-bg-surface-alt">—</td>}
                </tr>

                {/* Down Payment & Loan Principal */}
                <tr>
                  <td className="p-4 helper-text font-bold uppercase bg-bg-surface-alt">20% Down Payment</td>
                  {compareList.map((car) => {
                    const price = Number(car.price || 0);
                    return (
                      <td key={car.id} className="p-4 body-text font-bold border-l border-border">
                        ₹{Math.round(price * 0.2).toLocaleString()}
                      </td>
                    );
                  })}
                  {compareList.length < 4 && <td className="border-l border-border bg-bg-surface-alt">—</td>}
                </tr>
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Quick Add Picker Modal */}
      {isAddPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-bg-surface border border-border rounded-lg p-6 my-6 text-text-primary">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="section-heading text-sm">Add Vehicle to Comparison</h3>
              <button
                onClick={() => setIsAddPickerOpen(false)}
                className="p-1 rounded-lg text-text-secondary hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto flex flex-col gap-2">
              {allVehicles
                .filter(v => !compareList.some(c => String(c.id || c.vehicle_id) === String(v.vehicle_id || v.id)))
                .map((car) => {
                  const id = car.vehicle_id || car.id;
                  const price = Number(car.price || 0);
                  return (
                    <div
                      key={id}
                      className="p-3 rounded-lg bg-bg-surface-alt border border-border flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={car.image_url || 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=200'}
                          alt={car.model}
                          className="w-16 h-12 rounded-lg object-cover bg-bg-surface border border-border"
                        />
                        <div>
                          <h5 className="body-text font-bold">{car.make || car.brand} {car.model}</h5>
                          <span className="helper-text">{car.manufacture_year || 2022} &bull; ₹{price.toLocaleString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          addToCompare({ id: String(id), ...car });
                          setIsAddPickerOpen(false);
                        }}
                        className="btn-primary h-8 px-3 text-xs"
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
