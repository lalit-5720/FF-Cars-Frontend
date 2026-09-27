'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '../../../services/api';
import { usePermissions } from '../../../hooks/usePermissions';
import { useAuthStore } from '../../../store/useAuthStore';
import { RequireRole } from '../../../components/auth/RequireRole';
import { showLocalToast } from '../../../components/Toast';
import { 
  CarFront, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  CheckCircle, 
  X, 
  Sparkles, 
  DollarSign, 
  Tag, 
  Award, 
  Building2, 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  Loader2, 
  ExternalLink,
  Fuel,
  Gauge,
  Calendar
} from 'lucide-react';
import { VehicleInspectionReportModal } from '../../../components/VehicleInspectionReportModal';

const CAR_IMAGE_PRESETS = [
  { name: 'Mercedes E-Class', url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80' },
  { name: 'BMW M4 Competition', url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Porsche 911 GT3', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Range Rover SV', url: 'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Audi RS6 Avant', url: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1200&q=80' },
];

const MAKE_SUGGESTIONS = [
  'Mercedes-Benz',
  'BMW',
  'Audi',
  'Porsche',
  'Land Rover',
  'Volvo',
  'Jaguar',
  'Lexus',
  'Bentley',
  'Rolls-Royce'
];

function InventoryPageInner() {
  const permissions = usePermissions();
  const { user } = useAuthStore();
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

  // 150-Point Certified Inspection Modal State
  const [inspectingVehicle, setInspectingVehicle] = useState<any>(null);

  // Add Vehicle Modal State (Strictly Managers & Admins only)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    make: 'Mercedes-Benz',
    model: '',
    manufacture_year: 2024,
    registration_number: '',
    branch_id: user?.branch_id || 1,
    fuel_type: 'Petrol',
    transmission: 'Automatic',
    owner_type: 'First Owner',
    kilometers_driven: '12000',
    color: 'Obsidian Black Metallic',
    price: '',
    purchase_price: '',
    image_url: CAR_IMAGE_PRESETS[0].url,
    preCertify: true,
    auditImmediately: true,
  });

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

  // Update default branch when user auth resolves
  useEffect(() => {
    if (user?.branch_id) {
      setAddForm((prev) => ({ ...prev, branch_id: Number(user.branch_id) }));
    }
  }, [user]);

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

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addForm.make.trim() || !addForm.model.trim()) {
      showLocalToast('Please provide vehicle make and model.', 'error');
      return;
    }

    const numericPrice = Number(addForm.price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      showLocalToast('Please specify a valid listing price.', 'error');
      return;
    }

    setIsAdding(true);
    try {
      // Manager's branch is strictly enforced
      const assignedBranchId = permissions.isBranchManager
        ? Number(user?.branch_id || 1)
        : Number(addForm.branch_id || 1);

      const defaultCertId = `CR-CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const initialInspection = addForm.preCertify ? {
        certificationTier: 'Gold Certified',
        overallScore: 98,
        isGoodToUse: true,
        inspectorName: permissions.isBranchManager
          ? `${user?.name || 'Branch Manager'} (Roadworthiness Certified)`
          : 'Lead Quality Inspector (System Certified)',
        inspectionDate: new Date().toISOString().split('T')[0],
        certificateId: defaultCertId,
        remarks: '150-Point certified intake inspection completed. Powertrain, chassis, electronics, and braking verified 100% roadworthy and good to use.',
      } : null;

      const payload = {
        make: addForm.make.trim(),
        model: addForm.model.trim(),
        manufacture_year: Number(addForm.manufacture_year),
        registration_number: addForm.registration_number.trim().toUpperCase() || undefined,
        branch_id: assignedBranchId,
        fuel_type: addForm.fuel_type,
        transmission: addForm.transmission,
        owner_type: addForm.owner_type,
        kilometers_driven: Number(addForm.kilometers_driven) || 0,
        color: addForm.color.trim(),
        price: numericPrice,
        purchase_price: addForm.purchase_price ? Number(addForm.purchase_price) : undefined,
        image_url: addForm.image_url || CAR_IMAGE_PRESETS[0].url,
        status: 'Available',
        inspectionReport: initialInspection,
      };

      const res = await api.post('/vehicles', payload);
      const createdVehicle = res.data;

      showLocalToast(`✨ ${createdVehicle.make} ${createdVehicle.model} added to showroom inventory!`);
      
      // Prepend newly added car to current inventory
      setVehicles((prev) => [createdVehicle, ...prev]);
      setIsAddModalOpen(false);

      // If user checked "Audit Immediately", open the 150-point report modal right away
      if (addForm.auditImmediately) {
        setInspectingVehicle(createdVehicle);
      }

      // Reset form
      setAddForm({
        make: 'Mercedes-Benz',
        model: '',
        manufacture_year: 2024,
        registration_number: '',
        branch_id: user?.branch_id || 1,
        fuel_type: 'Petrol',
        transmission: 'Automatic',
        owner_type: 'First Owner',
        kilometers_driven: '12000',
        color: 'Obsidian Black Metallic',
        price: '',
        purchase_price: '',
        image_url: CAR_IMAGE_PRESETS[0].url,
        preCertify: true,
        auditImmediately: true,
      });

    } catch (err: any) {
      console.error('Failed to create vehicle:', err);
      showLocalToast(err.response?.data?.message || 'Failed to add vehicle to inventory.', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: number, name: string) => {
    if (!confirm(`Are you sure you want to permanently remove ${name} from inventory?`)) {
      return;
    }

    try {
      await api.delete(`/vehicles/${vehicleId}`);
      showLocalToast(`${name} removed from inventory.`);
      setVehicles((prev) => prev.filter((v) => (v.vehicle_id || v.id) !== vehicleId));
    } catch (err: any) {
      showLocalToast(err.response?.data?.message || 'Failed to delete vehicle', 'error');
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

  // Only Managers and Admins can add vehicles
  const canAddVehicle = permissions.isBranchManager || permissions.isSystemAdmin;

  return (
    <RequireRole allow={['SYSTEM_ADMIN', 'BRANCH_MANAGER']}>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border p-5 rounded-2xl shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                <CarFront className="w-5 h-5 text-sky-400" /> Vehicle Inventory Management
              </h1>
              {permissions.isBranchManager && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Manager Portal · Branch #{user?.branch_id || 1}
                </span>
              )}
              {permissions.isSystemAdmin && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Admin Master Access (All Showrooms)
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Add new vehicles, audit 150-point inspection roadworthiness certificates, and update live showroom pricing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canAddVehicle && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-sky-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" /> Add New Vehicle
              </button>
            )}
          </div>
        </div>

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

        {/* Inventory Table */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Registration</th>
                  <th className="py-3 px-4">Year & Specs</th>
                  <th className="py-3 px-4">Branch Showroom</th>
                  <th className="py-3 px-4">Listing Price</th>
                  <th className="py-3 px-4">150-Pt Roadworthiness</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                        <span>Loading vehicle inventory...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      No vehicles found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((v) => {
                    const isTarget = String(v.vehicle_id || v.id) === String(queryVehicleId);
                    const inspection = v.inspectionReport;
                    const isGood = inspection?.isGoodToUse !== false && inspection?.isGoodToUse !== undefined;

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
                        <td className="py-3.5 px-4 text-slate-300 font-medium">
                          {v.manufacture_year || v.year} · {v.fuel_type || 'Petrol'} · {v.transmission || 'Auto'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {v.branches?.branch_name || `Branch #${v.branch_id || 1}`}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                          ₹{Number(v.price || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4">
                          {inspection?.isGoodToUse ? (
                            <button
                              onClick={() => setInspectingVehicle(v)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all cursor-pointer"
                              title="Certified Good to Use - Click to review or edit 150-point checklist"
                            >
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              <span>Certified Good ({inspection.overallScore ?? 98}/100)</span>
                            </button>
                          ) : inspection && inspection.isGoodToUse === false ? (
                            <button
                              onClick={() => setInspectingVehicle(v)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer"
                              title="Attention Needed - Click to inspect checkpoints"
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              <span>Attention ({inspection.overallScore ?? 75}/100)</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setInspectingVehicle(v)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-all cursor-pointer"
                              title="Audit Pending - Click to audit and certify vehicle as Good to Use"
                            >
                              <Award className="w-3 h-3 text-rose-400" />
                              <span>Audit Pending</span>
                            </button>
                          )}
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
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setInspectingVehicle(v)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              title="Audit & Edit 150-Point Roadworthiness Certificate"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>Audit</span>
                            </button>
                            {permissions.canManageInventory && (
                              <button
                                onClick={() => openEditModal(v)}
                                className="px-2.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Edit Listing Price"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Price</span>
                              </button>
                            )}
                            {permissions.isSystemAdmin && (
                              <button
                                onClick={() => handleDeleteVehicle(v.vehicle_id || v.id, `${v.make} ${v.model}`)}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all cursor-pointer"
                                title="Remove Vehicle from Inventory"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADD VEHICLE MODAL (Manager & Admin only) */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-[#0B0F1A] border border-[#5468F0]/40 rounded-2xl shadow-2xl p-6 my-8 animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#2D374A] mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                    <CarFront className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      Add New Luxury Vehicle
                      <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 font-semibold">
                        {permissions.isBranchManager ? 'Manager Authorized' : 'Admin Universal Access'}
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400">
                      Register automobile details, branch showroom assignment, and roadworthiness certification
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAddVehicle} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Make */}
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      Make / Brand <span className="text-sky-400">*</span>
                    </label>
                    <input
                      type="text"
                      list="makes-list"
                      required
                      placeholder="e.g. Mercedes-Benz, BMW, Porsche"
                      value={addForm.make}
                      onChange={(e) => setAddForm({ ...addForm, make: e.target.value })}
                      className="w-full bg-[#141A2A] border border-[#2D374A] focus:border-sky-500 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                    />
                    <datalist id="makes-list">
                      {MAKE_SUGGESTIONS.map((m) => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                  </div>

                  {/* Model */}
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      Model Variant <span className="text-sky-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. C-Class C220d Progressive"
                      value={addForm.model}
                      onChange={(e) => setAddForm({ ...addForm, model: e.target.value })}
                      className="w-full bg-[#141A2A] border border-[#2D374A] focus:border-sky-500 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                    />
                  </div>

                  {/* Manufacture Year */}
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      Manufacture Year <span className="text-sky-400">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={2015}
                      max={2027}
                      value={addForm.manufacture_year}
                      onChange={(e) => setAddForm({ ...addForm, manufacture_year: Number(e.target.value) })}
                      className="w-full bg-[#141A2A] border border-[#2D374A] focus:border-sky-500 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                    />
                  </div>

                  {/* Registration Number */}
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TN 09 BK 8890"
                      value={addForm.registration_number}
                      onChange={(e) => setAddForm({ ...addForm, registration_number: e.target.value })}
                      className="w-full bg-[#141A2A] border border-[#2D374A] focus:border-sky-500 rounded-xl py-2 px-3 text-xs font-mono font-bold text-white focus:outline-none uppercase"
                    />
                  </div>

                  {/* Branch Assignment */}
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1 flex items-center justify-between">
                      <span>Showroom Branch <span className="text-sky-400">*</span></span>
                      {permissions.isBranchManager && (
                        <span className="text-[10px] text-indigo-400 flex items-center gap-1 font-semibold">
                          <Lock className="w-3 h-3" /> Branch Locked
                        </span>
                      )}
                    </label>
                    {permissions.isBranchManager ? (
                      <div className="w-full bg-[#1e293b]/80 border border-indigo-500/30 rounded-xl py-2 px-3 text-xs text-indigo-200 flex items-center justify-between font-semibold">
                        <span>Branch #{user?.branch_id || 1} (Your Showroom)</span>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
                          Manager Scoped
                        </span>
                      </div>
                    ) : (
                      <select
                        value={addForm.branch_id}
                        onChange={(e) => setAddForm({ ...addForm, branch_id: Number(e.target.value) })}
                        className="w-full bg-[#141A2A] border border-[#2D374A] focus:border-sky-500 rounded-xl py-2 px-3 text-xs text-white focus:outline-none cursor-pointer"
                      >
                        <option value={1}>Branch #1 — CarRevive Chennai Central</option>
                        <option value={2}>Branch #2 — CarRevive OMR Expressway</option>
                        <option value={3}>Branch #3 — CarRevive Coimbatore</option>
                      </select>
                    )}
                  </div>

                  {/* Fuel Type */}
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">Fuel Type</label>
                    <select
                      value={addForm.fuel_type}
                      onChange={(e) => setAddForm({ ...addForm, fuel_type: e.target.value })}
                      className="w-full bg-[#141A2A] border border-[#2D374A] focus:border-sky-500 rounded-xl py-2 px-3 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Electric">Electric</option>
                    </select>
                  </div>

                  {/* Transmission */}
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">Transmission</label>
                    <select
                      value={addForm.transmission}
                      onChange={(e) => setAddForm({ ...addForm, transmission: e.target.value })}
                      className="w-full bg-[#141A2A] border border-[#2D374A] focus:border-sky-500 rounded-xl py-2 px-3 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="Automatic">Automatic (Steptronic/7G-Tronic)</option>
                      <option value="Dual-Clutch">Dual-Clutch (PDK/DSG)</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </div>

                  {/* Kilometers Driven */}
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">Kilometers Driven</label>
                    <input
                      type="number"
                      placeholder="e.g. 15000"
                      value={addForm.kilometers_driven}
                      onChange={(e) => setAddForm({ ...addForm, kilometers_driven: e.target.value })}
                      className="w-full bg-[#141A2A] border border-[#2D374A] focus:border-sky-500 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                    />
                  </div>

                  {/* Exterior Color */}
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">Exterior Paint & Finish</label>
                    <input
                      type="text"
                      placeholder="e.g. Obsidian Black Metallic"
                      value={addForm.color}
                      onChange={(e) => setAddForm({ ...addForm, color: e.target.value })}
                      className="w-full bg-[#141A2A] border border-[#2D374A] focus:border-sky-500 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                    />
                  </div>

                  {/* Listing Price */}
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      Showroom Listing Price (₹) <span className="text-sky-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 4850000"
                        value={addForm.price}
                        onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                        className="w-full bg-[#141A2A] border border-[#2D374A] focus:border-sky-500 rounded-xl py-2 pl-7 pr-3 text-xs font-mono font-bold text-emerald-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Purchase Price */}
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      Vehicle Acquisition Cost (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        placeholder="e.g. 4200000"
                        value={addForm.purchase_price}
                        onChange={(e) => setAddForm({ ...addForm, purchase_price: e.target.value })}
                        className="w-full bg-[#141A2A] border border-[#2D374A] focus:border-sky-500 rounded-xl py-2 pl-7 pr-3 text-xs font-mono font-bold text-slate-300 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Image URL & Presets */}
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Vehicle Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={addForm.image_url}
                    onChange={(e) => setAddForm({ ...addForm, image_url: e.target.value })}
                    className="w-full bg-[#141A2A] border border-[#2D374A] focus:border-sky-500 rounded-xl py-2 px-3 text-xs text-white focus:outline-none mb-2"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-gray-400 font-semibold mr-1">Presets:</span>
                    {CAR_IMAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setAddForm({ ...addForm, image_url: preset.url })}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all ${
                          addForm.image_url === preset.url
                            ? 'bg-sky-500/20 text-sky-400 border-sky-500/40 font-bold'
                            : 'bg-secondary/40 text-muted-foreground border-border hover:text-white'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 150-Point Roadworthiness Certification Card */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/30 to-emerald-950/30 border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-extrabold text-white">150-Point Quality Audit & Certification</h4>
                      <p className="text-[11px] text-gray-300">
                        Certify this automobile as verified roadworthy and ready for luxury customer delivery.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="flex items-center gap-2 text-xs text-gray-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addForm.preCertify}
                        onChange={(e) => setAddForm({ ...addForm, preCertify: e.target.checked })}
                        className="rounded border-gray-600 text-sky-500 focus:ring-sky-500 h-4 w-4 bg-[#141A2A]"
                      />
                      <span>Pre-certify vehicle as <strong>"Certified Good to Use"</strong> (Gold Certified · 98/100 Score)</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-gray-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addForm.auditImmediately}
                        onChange={(e) => setAddForm({ ...addForm, auditImmediately: e.target.checked })}
                        className="rounded border-gray-600 text-sky-500 focus:ring-sky-500 h-4 w-4 bg-[#141A2A]"
                      />
                      <span>Launch full <strong>150-Point Checklist Editor</strong> immediately upon vehicle registration</span>
                    </label>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2D374A]">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Registering Automobile...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Register Vehicle to Inventory</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT PRICE MODAL */}
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

              {/* Aging Suggestion Badge if available */}
              {editingVehicle.suggested_price && (
                <div className="mb-4 p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-400 block">Aging-Based Recommended Markdown</span>
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

        {/* 150-Point Certified Inspection Certificate Modal (Editable by Managers & Admins) */}
        <VehicleInspectionReportModal
          car={inspectingVehicle}
          isOpen={Boolean(inspectingVehicle)}
          onClose={() => setInspectingVehicle(null)}
          onUpdated={(updatedCar) => {
            setVehicles((prev) =>
              prev.map((v) =>
                String(v.vehicle_id || v.id) === String(updatedCar.vehicle_id || updatedCar.id)
                  ? { ...v, ...updatedCar }
                  : v
              )
            );
            if (
              inspectingVehicle &&
              String(inspectingVehicle.vehicle_id || inspectingVehicle.id) === String(updatedCar.vehicle_id || updatedCar.id)
            ) {
              setInspectingVehicle((prev: any) => ({ ...prev, ...updatedCar }));
            }
          }}
        />
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
