'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '../../../services/api';
import { usePermissions } from '../../../hooks/usePermissions';
import { RequireRole } from '../../../components/auth/RequireRole';
import { showLocalToast } from '../../../components/Toast';
import { CarFront, Plus, Search, Filter, Trash2, Edit, CheckCircle, X, Sparkles, DollarSign, ArrowDownRight, Tag, Calculator } from 'lucide-react';
import { VehicleValuationCalculator } from '../../../components/admin/bi/VehicleValuationCalculator';

function InventoryPageInner() {
  const permissions = usePermissions();
  const searchParams = useSearchParams();

  const querySearch = searchParams.get('search') || '';
  const queryVehicleId = searchParams.get('vehicleId');
  const querySuggestedPrice = searchParams.get('suggestedPrice');

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(querySearch);
  const [statusFilter, setStatusFilter] = useState('All');

  // Price Edit Modal State
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [newPrice, setNewPrice] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vehicles');
      const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setVehicles(list);

      // If query parameters requested specific vehicle for repricing, open edit modal
      if (queryVehicleId) {
        const target = list.find((v: any) => String(v.vehicle_id || v.id) === String(queryVehicleId));
        if (target) {
          openEditModal(target, querySuggestedPrice ? Number(querySuggestedPrice) : undefined);
        }
      }
    } catch (err) {
      showLocalToast('Failed to load vehicle inventory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const openEditModal = (v: any, suggested?: number) => {
    setEditingVehicle({
      ...v,
      suggested_price: suggested || v.suggested_price
    });
    setNewPrice(String(suggested || v.price || ''));
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle || !newPrice) return;

    const numericPrice = Number(newPrice);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      showLocalToast('Please enter a valid price amount.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const vehicleId = editingVehicle.vehicle_id || editingVehicle.id;
      await api.patch(`/vehicles/${vehicleId}`, {
        price: numericPrice
      });
      showLocalToast(`Updated price for ${editingVehicle.make} ${editingVehicle.model} to ₹${numericPrice.toLocaleString('en-IN')}!`);
      
      // Update local vehicle state
      setVehicles((prev) =>
        prev.map((v) =>
          String(v.vehicle_id || v.id) === String(vehicleId)
            ? { ...v, price: numericPrice }
            : v
        )
      );
      setEditingVehicle(null);
    } catch (err: any) {
      console.error('Failed to update vehicle price:', err);
      showLocalToast('Failed to save vehicle price.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = vehicles.filter((v) => {
    const matchesSearch =
      `${v.make} ${v.model} ${v.registration_number || ''}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const [showValuationTool, setShowValuationTool] = useState(false);

  return (
    <RequireRole allow={['SYSTEM_ADMIN', 'BRANCH_MANAGER', 'SALES_EXECUTIVE']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border p-5 rounded-2xl">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <CarFront className="w-5 h-5 text-sky-400" /> Vehicle Inventory Management
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Browse, manage, and update vehicle prices & availability across branch showrooms
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowValuationTool(!showValuationTool)}
              className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40 rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              {showValuationTool ? 'Close AI Estimator' : 'AI Valuation Estimator'}
            </button>

            {permissions.canManageInventory && (
              <button
                onClick={() => showLocalToast('Add Vehicle feature available in Admin Console')}
                className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add New Vehicle
              </button>
            )}
          </div>
        </div>

        {/* Expandable AI Valuation Calculator Tool */}
        {showValuationTool && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <VehicleValuationCalculator
              onApplyPrice={(recommended) => {
                showLocalToast(`AI Valuation calculated: ₹${recommended.toLocaleString('en-IN')}`);
              }}
            />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search by make, model, registration number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-border rounded-xl px-4 py-2.5 pl-10 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 text-xs">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-foreground font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Reserved">Reserved</option>
              <option value="Sold">Sold</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Registration</th>
                  <th className="py-3 px-4">Year & Specs</th>
                  <th className="py-3 px-4">Branch Location</th>
                  <th className="py-3 px-4">Listing Price</th>
                  <th className="py-3 px-4">Status</th>
                  {permissions.canManageInventory && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      Loading vehicle inventory...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No vehicles found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((v) => {
                    const isTarget = String(v.vehicle_id || v.id) === String(queryVehicleId);
                    return (
                      <tr
                        key={v.vehicle_id || v.id}
                        className={`transition-colors ${
                          isTarget ? 'bg-[#5468F0]/20 border-l-4 border-l-[#5468F0]' : 'hover:bg-secondary/40'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {v.image_url ? (
                              <img src={v.image_url} alt={v.make} className="w-12 h-9 object-cover rounded-lg border border-border" />
                            ) : (
                              <div className="w-12 h-9 bg-secondary rounded-lg flex items-center justify-center border border-border">
                                <CarFront className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <strong className="block text-foreground font-bold">{v.make} {v.model}</strong>
                              <small className="text-muted-foreground">{v.color || 'Standard'}</small>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-sky-400 font-bold">{v.registration_number || 'Unregistered'}</td>
                        <td className="py-3.5 px-4 text-slate-300 font-medium">{v.manufacture_year || v.year} · {v.fuel_type || 'Petrol'} · {v.transmission || 'Auto'}</td>
                        <td className="py-3.5 px-4 text-slate-300">{v.branches?.branch_name || `Branch #${v.branch_id || 1}`}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                          ₹{Number(v.price || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            v.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            v.status === 'Reserved' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          }`}>
                            {v.status}
                          </span>
                        </td>
                        {permissions.canManageInventory && (
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => openEditModal(v)}
                              className="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-bold transition-all flex items-center gap-1.5 ml-auto"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit Price</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Price Modal */}
        {editingVehicle && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-[#0B0F1A] border border-[#5468F0]/40 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-[#2D374A] mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#5468F0]/20 border border-[#5468F0]/40 flex items-center justify-center text-[#5468F0]">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Edit Vehicle Price</h3>
                    <p className="text-xs text-gray-400">{editingVehicle.make} {editingVehicle.model} ({editingVehicle.registration_number})</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingVehicle(null)}
                  className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* AI Suggestion Badge if available */}
              {editingVehicle.suggested_price && (
                <div className="mb-4 p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-400 block">AI Recommended Markdown</span>
                    <span className="text-sm font-extrabold text-white font-mono">
                      ₹{Number(editingVehicle.suggested_price).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewPrice(String(editingVehicle.suggested_price))}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    Use Suggested
                  </button>
                </div>
              )}

              <form onSubmit={handleSavePrice} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Current Price: <span className="text-gray-400 font-normal">₹{Number(editingVehicle.price || 0).toLocaleString('en-IN')}</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                    <input
                      type="number"
                      required
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full bg-[#141A2A] border border-[#2D374A] focus:border-[#5468F0] rounded-xl py-2.5 pl-8 pr-4 text-sm font-mono font-bold text-white focus:outline-none"
                      placeholder="Enter new listing price"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingVehicle(null)}
                    className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#5468F0] to-[#7B8CFF] hover:from-[#4355D6] text-white text-xs font-bold shadow-lg shadow-[#5468F0]/30 transition-all disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Update Inventory Price'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RequireRole>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading inventory dashboard...</div>}>
      <InventoryPageInner />
    </Suspense>
  );
}
