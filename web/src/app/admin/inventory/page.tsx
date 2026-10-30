'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  Calendar,
  Sliders
} from 'lucide-react';
import { VehicleInspectionReportModal } from '../../../components/VehicleInspectionReportModal';
import { VehicleProfitWhatIfSimulatorModal } from '../../../components/admin/inventory/VehicleProfitWhatIfSimulatorModal';

import { firstError, regNo, money, intRange, maxLen, maxVehicleYear } from '../../../lib/validation';
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
  const router = useRouter();
  const permissions = usePermissions();
  const { user } = useAuthStore();
  const searchParams = useSearchParams();

  const querySearch = searchParams.get('search') || '';
  const queryVehicleId = searchParams.get('vehicleId');
  const queryEditVehicleId = searchParams.get('editVehicleId');
  const querySuggestedPrice = searchParams.get('suggestedPrice');
  const querySimulateId = searchParams.get('simulateVehicleId');
  const queryAction = searchParams.get('action');
  const queryAddReg = searchParams.get('addReg');
  const queryAddMake = searchParams.get('addMake');
  const queryAddModel = searchParams.get('addModel');
  const queryAddYear = searchParams.get('addYear');
  const queryAddKm = searchParams.get('addKm');
  const queryAddFuel = searchParams.get('addFuel');
  const queryAddTrans = searchParams.get('addTrans');
  const queryAddBranch = searchParams.get('addBranch');
  const queryAddPrice = searchParams.get('addPrice');

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(querySearch);
  const [statusFilter, setStatusFilter] = useState('All');

  // Synchronize topbar search parameter dynamically with local inventory search filter
  useEffect(() => {
    if (querySearch !== undefined) {
      setSearch(querySearch);
    }
  }, [querySearch]);

  // What-If Vehicle Profit Simulator Modal State
  const [simulatorVehicle, setSimulatorVehicle] = useState<any>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // Full Vehicle Edit Modal State
  const [editingVehicleFull, setEditingVehicleFull] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    make: '',
    model: '',
    manufacture_year: 2024,
    registration_number: '',
    branch_id: 1,
    status: 'Available',
    fuel_type: 'Petrol',
    transmission: 'Automatic',
    owner_type: 'First Owner',
    kilometers_driven: '0',
    color: '',
    price: '',
    purchase_price: '',
    image_url: '',
    description: '',
    suggested_price: undefined as number | undefined,
    inspection_score: '92',
    certification_tier: 'Gold Certified',
    is_good_to_use: 'true',
    inspection_remarks: '',
  });

  // Price Edit Modal State (Quick markdown shortcut)
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
    inspection_score: 92,
    auditImmediately: true,
  });

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setBranches(list);
    } catch (err) {
      console.error('Failed to load branches:', err);
    }
  };

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vehicles');
      const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setVehicles(list);

      // If query parameters requested specific vehicle for editing or repricing, open edit modal
      const editTargetId = queryEditVehicleId || queryVehicleId;
      if (editTargetId) {
        const target = list.find((v: any) => String(v.vehicle_id || v.id) === String(editTargetId));
        if (target) {
          openEditVehicleModal(target, querySuggestedPrice ? Number(querySuggestedPrice) : undefined);
        }
      }

      // If query parameters requested What-If simulator, launch simulator modal
      if (querySimulateId) {
        const simTarget = list.find((v: any) => String(v.vehicle_id || v.id) === String(querySimulateId));
        if (simTarget) {
          setSimulatorVehicle(simTarget);
          setIsSimulatorOpen(true);
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
    fetchBranches();
  }, []);

  // Update default branch when user auth resolves
  useEffect(() => {
    if (user?.branch_id) {
      setAddForm((prev) => ({ ...prev, branch_id: Number(user.branch_id) }));
    }
  }, [user]);

  // Check if directed from Quotations with pre-filled vehicle details to manually include into inventory
  useEffect(() => {
    if (queryAction === 'add' || queryAddReg) {
      setAddForm((prev) => ({
        ...prev,
        registration_number: queryAddReg || prev.registration_number,
        make: queryAddMake || prev.make,
        model: queryAddModel || prev.model,
        manufacture_year: queryAddYear ? Number(queryAddYear) : prev.manufacture_year,
        kilometers_driven: queryAddKm ? String(queryAddKm) : prev.kilometers_driven,
        fuel_type: queryAddFuel || prev.fuel_type,
        transmission: queryAddTrans || prev.transmission,
        branch_id: queryAddBranch ? Number(queryAddBranch) : (user?.branch_id || prev.branch_id),
        purchase_price: queryAddPrice ? String(queryAddPrice) : prev.purchase_price,
        price: queryAddPrice ? String(Math.round(Number(queryAddPrice) * 1.15)) : prev.price,
      }));
      setIsAddModalOpen(true);
    }
  }, [queryAction, queryAddReg, queryAddMake, queryAddModel, queryAddYear, queryAddKm, queryAddFuel, queryAddTrans, queryAddBranch, queryAddPrice, user]);

  const openEditVehicleModal = (v: any, suggestedPrice?: number) => {
    setEditingVehicleFull(v);
    const insp = v.inspectionReport || {};
    setEditForm({
      make: v.make || '',
      model: v.model || '',
      manufacture_year: Number(v.manufacture_year || v.year || 2024),
      registration_number: v.registration_number || '',
      branch_id: Number(v.branch_id || v.branches?.branch_id || 1),
      status: v.status || 'Available',
      fuel_type: v.fuel_type || 'Petrol',
      transmission: v.transmission || 'Automatic',
      owner_type: v.owner_type || 'First Owner',
      kilometers_driven: String(v.kilometers_driven ?? 0),
      color: v.color || '',
      price: String(suggestedPrice || v.price || ''),
      purchase_price: String(v.purchase_price ?? ''),
      image_url: v.image_url || '',
      description: v.description ? v.description.split('<!--INSPECTION_REPORT-->')[0].trim() : '',
      suggested_price: suggestedPrice || v.suggested_price,
      inspection_score: insp.overallScore !== undefined ? String(insp.overallScore) : '90',
      certification_tier: insp.certificationTier || 'Gold Certified',
      is_good_to_use: insp.isGoodToUse !== false ? 'true' : 'false',
      inspection_remarks: insp.remarks || '150-point inspection roadworthiness audit verified.',
    });
  };

  const handleUpdateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicleFull) return;

    if (!editForm.make.trim() || !editForm.model.trim()) {
      showLocalToast('Please provide vehicle make and model.', 'error');
      return;
    }

    const numericPrice = Number(editForm.price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      showLocalToast('Please specify a valid listing price.', 'error');
      return;
    }
    const vehErr = firstError(
      maxLen(editForm.make.trim(), 50, 'Make'),
      maxLen(editForm.model.trim(), 50, 'Model'),
      intRange(editForm.manufacture_year, 'Manufacture year', 1980, maxVehicleYear(), true),
      regNo(String(editForm.registration_number || ''), false),
      intRange(editForm.kilometers_driven, 'Kilometres driven', 0, 2_000_000),
      money(editForm.price, 'Listing price', { min: 1 }),
      money(editForm.purchase_price, 'Purchase price', { mandatory: false }),
      maxLen(editForm.color, 30, 'Colour'),
    );
    if (vehErr) {
      showLocalToast(vehErr, 'error');
      return;
    }

    setIsUpdating(true);
    try {
      const vehicleId = editingVehicleFull.vehicle_id || editingVehicleFull.id;
      const assignedBranchId = permissions.isBranchManager
        ? Number(user?.branch_id || editingVehicleFull.branch_id || 1)
        : Number(editForm.branch_id || 1);

      const existingInsp = editingVehicleFull.inspectionReport || {};
      const newScore = Number(editForm.inspection_score);
      const isGood = editForm.is_good_to_use === 'true';

      const updatedInspectionReport = {
        ...existingInsp,
        overallScore: isNaN(newScore) ? 90 : Math.min(100, Math.max(0, newScore)),
        certificationTier: editForm.certification_tier || 'Gold Certified',
        isGoodToUse: isGood,
        remarks: editForm.inspection_remarks || existingInsp.remarks || '150-point inspection roadworthiness audit verified.',
        inspectorName: existingInsp.inspectorName || user?.name || 'Lead Quality Inspector',
        inspectionDate: existingInsp.inspectionDate || new Date().toISOString().split('T')[0],
        certificateId: existingInsp.certificateId || `CR-CERT-2026-${vehicleId}`,
        categories: existingInsp.categories && existingInsp.categories.length > 0 ? existingInsp.categories : undefined,
      };

      const payload = {
        make: editForm.make.trim(),
        model: editForm.model.trim(),
        manufacture_year: Number(editForm.manufacture_year),
        registration_number: editForm.registration_number.trim().toUpperCase() || null,
        branch_id: assignedBranchId,
        status: editForm.status,
        fuel_type: editForm.fuel_type,
        transmission: editForm.transmission,
        owner_type: editForm.owner_type,
        kilometers_driven: Number(editForm.kilometers_driven) || 0,
        color: editForm.color.trim(),
        price: numericPrice,
        purchase_price: editForm.purchase_price ? Number(editForm.purchase_price) : undefined,
        image_url: editForm.image_url.trim() || undefined,
        description: editForm.description.trim() || undefined,
        inspectionReport: updatedInspectionReport,
      };

      const res = await api.patch(`/vehicles/${vehicleId}`, payload);
      const updatedVehicle = res.data;

      const matchedBranch = branches.find((b) => b.branch_id === assignedBranchId);

      showLocalToast(`✨ Successfully updated ${updatedVehicle.make} ${updatedVehicle.model} with Score ${updatedInspectionReport.overallScore}/100!`);

      // Update vehicle in local state
      setVehicles((prev) =>
        prev.map((v) =>
          String(v.vehicle_id || v.id) === String(vehicleId)
            ? { ...v, ...updatedVehicle, inspectionReport: updatedInspectionReport, branches: matchedBranch || v.branches }
            : v
        )
      );

      setEditingVehicleFull(null);
    } catch (err: any) {
      console.error('Failed to update vehicle:', err);
      showLocalToast(err.response?.data?.message || 'Failed to update vehicle.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

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
    const vehErr = firstError(
      maxLen(addForm.make.trim(), 50, 'Make'),
      maxLen(addForm.model.trim(), 50, 'Model'),
      intRange(addForm.manufacture_year, 'Manufacture year', 1980, maxVehicleYear(), true),
      regNo(String(addForm.registration_number || ''), false),
      intRange(addForm.kilometers_driven, 'Kilometres driven', 0, 2_000_000),
      money(addForm.price, 'Listing price', { min: 1 }),
      money(addForm.purchase_price, 'Purchase price', { mandatory: false }),
      maxLen(addForm.color, 30, 'Colour'),
    );
    if (vehErr) {
      showLocalToast(vehErr, 'error');
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
        overallScore: Number(addForm.inspection_score) || 92,
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
        inspection_score: 92,
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
    <RequireRole allow={['SYSTEM_ADMIN', 'BRANCH_MANAGER', 'SALES_EXECUTIVE']}>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border p-5 rounded-2xl shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                <CarFront className="w-5 h-5 text-sky-700 dark:text-sky-400" /> Vehicle Inventory Management
              </h1>
              {permissions.isBranchManager && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                  Manager Portal · Branch #{user?.branch_id || 1}
                </span>
              )}
              {permissions.isSystemAdmin && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/20">
                  Admin Master Access (All Showrooms)
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Add new vehicles, audit 150-point inspection roadworthiness certificates, and update live showroom pricing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* What-If Simulator Master Launcher */}
            <button
              onClick={() => {
                if (vehicles.length > 0) {
                  setSimulatorVehicle(vehicles[0]);
                  setIsSimulatorOpen(true);
                } else {
                  showLocalToast('No inventory vehicles loaded yet.', 'info');
                }
              }}
              className="px-3.5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-purple-600/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              title="Simulate vehicle price reductions & profit impacts"
            >
              <Sliders className="w-4 h-4 text-purple-200" />
              <span>What-If Simulator</span>
            </button>

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
                        <Loader2 className="w-4 h-4 animate-spin text-sky-700 dark:text-sky-400" />
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
                          isTarget ? 'bg-accent/20 border-l-4 border-l-accent' : 'hover:bg-bg-surface-alt'
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
                        <td className="py-3.5 px-4 font-mono text-sky-700 dark:text-sky-400 font-bold">{v.registration_number || 'Unregistered'}</td>
                        <td className="py-3.5 px-4 text-text-primary font-medium">
                          {v.manufacture_year || v.year} · {v.fuel_type || 'Petrol'} · {v.transmission || 'Auto'}
                        </td>
                        <td className="py-3.5 px-4 text-text-primary">
                          {v.branches?.branch_name || `Branch #${v.branch_id || 1}`}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                          ₹{Number(v.price || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4">
                          {inspection && inspection.overallScore !== undefined ? (
                            inspection.isGoodToUse !== false ? (
                              <button
                                onClick={() => setInspectingVehicle(v)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all cursor-pointer"
                                title="Certified Good to Use - Click to review or edit 150-point checklist"
                              >
                                <CheckCircle className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                                <span>Certified Good ({inspection.overallScore}/100)</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setInspectingVehicle(v)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer"
                                title="Attention Needed - Click to inspect checkpoints"
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-800 dark:text-amber-400" />
                                <span>Attention Needed ({inspection.overallScore}/100)</span>
                              </button>
                            )
                          ) : (
                            <button
                              onClick={() => setInspectingVehicle(v)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-all cursor-pointer"
                              title="Audit Pending - Click to audit and certify vehicle as Good to Use"
                            >
                              <Award className="w-3 h-3 text-rose-700 dark:text-rose-400" />
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
                            {/* What-If Repricing & Profit Simulator Button */}
                            <button
                              onClick={() => {
                                setSimulatorVehicle(v);
                                setIsSimulatorOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer hover:border-purple-400 shadow-sm"
                              title="Simulate price reduction and profit margin for this car"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                              <span>Simulate</span>
                            </button>

                            <button
                              onClick={() => setInspectingVehicle(v)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              title="Audit & Edit 150-Point Roadworthiness Certificate"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>Audit</span>
                            </button>
                            {permissions.canManageInventory && (
                              <button
                                onClick={() => openEditVehicleModal(v)}
                                className="px-2.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer hover:border-sky-400"
                                title="Edit Vehicle Specifications, Pricing & Status"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                            )}
                            {permissions.isSystemAdmin && (
                              <button
                                onClick={() => handleDeleteVehicle(v.vehicle_id || v.id, `${v.make} ${v.model}`)}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30 transition-all cursor-pointer"
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
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-bg-surface border border-border rounded-[8px] p-6 my-8 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[8px] bg-accent text-accent-text flex items-center justify-center">
                    <CarFront className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-bold text-text-primary flex items-center gap-2">
                      Add New Luxury Vehicle
                      <span className="badge-info">
                        {permissions.isBranchManager ? 'Manager Authorized' : 'Admin Access'}
                      </span>
                    </h3>
                    <p className="text-[12px] text-text-secondary mt-0.5">
                      Register automobile details, branch showroom assignment, and roadworthiness certification
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-[8px] text-text-secondary hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAddVehicle} className="space-y-4 text-[14px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Make */}
                  <div>
                    <label className="text-[12px] font-bold text-text-secondary block mb-1">
                      Make / Brand <span className="text-accent">*</span>
                    </label>
                    <input
                      type="text"
                      list="makes-list"
                      required
                      placeholder="e.g. Mercedes-Benz, BMW, Porsche"
                      value={addForm.make} maxLength={50}
                      onChange={(e) => setAddForm({ ...addForm, make: e.target.value })}
                      className="input-base w-full"
                    />
                    <datalist id="makes-list">
                      {MAKE_SUGGESTIONS.map((m) => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                  </div>

                  {/* Model */}
                  <div>
                    <label className="text-[12px] font-bold text-text-secondary block mb-1">
                      Model Variant <span className="text-accent">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. C-Class C220d Progressive"
                      value={addForm.model} maxLength={50}
                      onChange={(e) => setAddForm({ ...addForm, model: e.target.value })}
                      className="input-base w-full"
                    />
                  </div>

                  {/* Manufacture Year */}
                  <div>
                    <label className="text-[12px] font-bold text-text-secondary block mb-1">
                      Manufacture Year <span className="text-accent">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1980}
                      max={maxVehicleYear()}
                      value={addForm.manufacture_year}
                      onChange={(e) => setAddForm({ ...addForm, manufacture_year: Number(e.target.value) })}
                      className="input-base w-full"
                    />
                  </div>

                  {/* Registration Number */}
                  <div>
                    <label className="text-[12px] font-bold text-text-secondary block mb-1">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TN 09 BK 8890"
                      value={addForm.registration_number} maxLength={20}
                      onChange={(e) => setAddForm({ ...addForm, registration_number: e.target.value })}
                      className="input-base w-full uppercase"
                    />
                  </div>

                  {/* Branch Assignment */}
                  <div>
                    <label className="text-[12px] font-bold text-text-secondary block mb-1 flex items-center justify-between">
                      <span>Showroom Branch <span className="text-accent">*</span></span>
                      {permissions.isBranchManager && (
                        <span className="text-[12px] text-accent flex items-center gap-1 font-bold">
                          <Lock className="w-3 h-3" /> Branch Locked
                        </span>
                      )}
                    </label>
                    {permissions.isBranchManager ? (
                      <div className="w-full bg-bg-surface-alt border border-border rounded-[8px] py-2 px-3 text-[12px] text-text-primary flex items-center justify-between font-bold">
                        <span>Branch #{user?.branch_id || 1} (Your Showroom)</span>
                        <span className="badge-info">
                          Manager Scoped
                        </span>
                      </div>
                    ) : (
                      <select
                        value={addForm.branch_id}
                        onChange={(e) => setAddForm({ ...addForm, branch_id: Number(e.target.value) })}
                        className="input-base w-full cursor-pointer"
                      >
                        <option value={1}>Branch #1 — CarRevive Chennai Central</option>
                        <option value={2}>Branch #2 — CarRevive OMR Expressway</option>
                        <option value={3}>Branch #3 — CarRevive Coimbatore</option>
                      </select>
                    )}
                  </div>

                  {/* Fuel Type */}
                  <div>
                    <label className="text-[12px] font-bold text-text-secondary block mb-1">Fuel Type</label>
                    <select
                      value={addForm.fuel_type}
                      onChange={(e) => setAddForm({ ...addForm, fuel_type: e.target.value })}
                      className="input-base w-full cursor-pointer"
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Electric">Electric</option>
                    </select>
                  </div>

                  {/* Transmission */}
                  <div>
                    <label className="text-[12px] font-bold text-text-secondary block mb-1">Transmission</label>
                    <select
                      value={addForm.transmission}
                      onChange={(e) => setAddForm({ ...addForm, transmission: e.target.value })}
                      className="input-base w-full cursor-pointer"
                    >
                      <option value="Automatic">Automatic (Steptronic/7G-Tronic)</option>
                      <option value="Dual-Clutch">Dual-Clutch (PDK/DSG)</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </div>

                  {/* Kilometers Driven */}
                  <div>
                    <label className="text-[12px] font-bold text-text-secondary block mb-1">Kilometers Driven</label>
                    <input
                      type="number"
                      placeholder="e.g. 15000"
                      value={addForm.kilometers_driven} min={0} max={2000000}
                      onChange={(e) => setAddForm({ ...addForm, kilometers_driven: e.target.value })}
                      className="input-base w-full"
                    />
                  </div>

                  {/* Exterior Color */}
                  <div>
                    <label className="text-[12px] font-bold text-text-secondary block mb-1">Exterior Paint & Finish</label>
                    <input
                      type="text"
                      placeholder="e.g. Obsidian Black Metallic"
                      value={addForm.color} maxLength={30}
                      onChange={(e) => setAddForm({ ...addForm, color: e.target.value })}
                      className="input-base w-full"
                    />
                  </div>

                  {/* Listing Price */}
                  <div>
                    <label className="text-[12px] font-bold text-text-secondary block mb-1">
                      Showroom Listing Price (₹) <span className="text-accent">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary font-bold text-[12px]">₹</span>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 4850000"
                        value={addForm.price} min={1} max={1000000000}
                        onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                        className="input-base w-full pl-8"
                      />
                    </div>
                  </div>

                  {/* Purchase Price */}
                  <div>
                    <label className="text-[12px] font-bold text-text-secondary block mb-1">
                      Vehicle Acquisition Cost (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary font-bold text-[12px]">₹</span>
                      <input
                        type="number"
                        placeholder="e.g. 4200000"
                        value={addForm.purchase_price} min={0} max={1000000000}
                        onChange={(e) => setAddForm({ ...addForm, purchase_price: e.target.value })}
                        className="input-base w-full pl-8"
                      />
                    </div>
                  </div>
                </div>

                {/* Image URL & Presets */}
                <div>
                  <label className="text-[12px] font-bold text-text-secondary block mb-1">Vehicle Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={addForm.image_url} maxLength={1000}
                    onChange={(e) => setAddForm({ ...addForm, image_url: e.target.value })}
                    className="input-base w-full mb-2"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[12px] text-text-secondary font-bold mr-1">Presets:</span>
                    {CAR_IMAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setAddForm({ ...addForm, image_url: preset.url })}
                        className={`text-[12px] px-2 py-0.5 rounded-[8px] border transition-all ${
                          addForm.image_url === preset.url
                            ? 'bg-accent text-accent-text border-accent font-bold'
                            : 'bg-bg-surface-alt text-text-secondary border-border hover:text-text-primary'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 150-Point Roadworthiness Certification Card */}
                <div className="p-4 rounded-[8px] bg-bg-surface-alt border border-border space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-accent flex-shrink-0" />
                    <div>
                      <h4 className="text-[14px] font-bold text-text-primary">150-Point Quality Audit & Certification</h4>
                      <p className="text-[12px] text-text-secondary">
                        Certify this automobile as verified roadworthy and ready for luxury customer delivery.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="flex items-center gap-2 text-[12px] text-text-secondary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addForm.preCertify}
                        onChange={(e) => setAddForm({ ...addForm, preCertify: e.target.checked })}
                        className="rounded border-border text-accent focus:ring-0 h-4 w-4"
                      />
                      <span>Pre-certify vehicle as <strong>"Certified Good to Use"</strong> (Gold Certified · 98/100 Score)</span>
                    </label>

                    <label className="flex items-center gap-2 text-[12px] text-text-secondary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addForm.auditImmediately}
                        onChange={(e) => setAddForm({ ...addForm, auditImmediately: e.target.checked })}
                        className="rounded border-border text-accent focus:ring-0 h-4 w-4"
                      />
                      <span>Launch full <strong>150-Point Checklist Editor</strong> immediately upon vehicle registration</span>
                    </label>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="btn-neutral"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="btn-primary flex items-center gap-2"
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

        {/* EDIT VEHICLE MODAL (Full Specifications & Pricing) */}
        {editingVehicleFull && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-bg-surface border border-border rounded-lg shadow-lg p-6 my-8 animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-bg-surface-alt border border-border flex items-center justify-center text-text-primary">
                    <CarFront className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                      <span>Edit Vehicle Details</span>
                      <span className="badge-neutral text-xs">
                        ID #{editingVehicleFull.vehicle_id || editingVehicleFull.id}
                      </span>
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Update specifications, branch location, inventory status, and showroom pricing.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingVehicleFull(null)}
                  className="btn-neutral w-8 h-8 p-0 flex items-center justify-center rounded-lg"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleUpdateVehicle} className="space-y-4 text-xs font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Make */}
                  <div>
                    <label className="text-xs font-bold text-text-secondary block mb-1">
                      Manufacturer / Make <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      list="makes-list"
                      required
                      placeholder="e.g. Mercedes-Benz, BMW, Porsche"
                      value={editForm.make} maxLength={50}
                      onChange={(e) => setEditForm({ ...editForm, make: e.target.value })}
                      className="input-base text-xs"
                    />
                  </div>

                  {/* Model */}
                  <div>
                    <label className="text-xs font-bold text-text-secondary block mb-1">
                      Model Variant <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. C-Class C220d Progressive"
                      value={editForm.model} maxLength={50}
                      onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                      className="input-base text-xs"
                    />
                  </div>

                  {/* Manufacture Year */}
                  <div>
                    <label className="text-xs font-bold text-text-secondary block mb-1">
                      Manufacture Year <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={2010}
                      max={maxVehicleYear()}
                      value={editForm.manufacture_year}
                      onChange={(e) => setEditForm({ ...editForm, manufacture_year: Number(e.target.value) })}
                      className="input-base text-xs"
                    />
                  </div>

                  {/* Registration Number */}
                  <div>
                    <label className="text-xs font-bold text-text-secondary block mb-1">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TN 09 BK 8890"
                      value={editForm.registration_number} maxLength={20}
                      onChange={(e) => setEditForm({ ...editForm, registration_number: e.target.value })}
                      className="input-base text-xs font-bold uppercase"
                    />
                  </div>

                  {/* Inventory Status */}
                  <div>
                    <label className="text-xs font-bold text-text-secondary block mb-1">
                      Inventory Status <span className="text-danger">*</span>
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="input-base text-xs font-bold cursor-pointer"
                    >
                      <option value="Available">Available (Live on Showroom)</option>
                      <option value="Reserved">Reserved (Customer Deposit In Hand)</option>
                      <option value="Sold">Sold (Delivered)</option>
                    </select>
                  </div>

                  {/* Branch Assignment */}
                  <div>
                    <label className="text-xs font-bold text-text-secondary block mb-1 flex items-center justify-between">
                      <span>Showroom Branch <span className="text-danger">*</span></span>
                      {permissions.isBranchManager && (
                        <span className="text-xs text-text-secondary flex items-center gap-1 font-bold">
                          <Lock className="w-3 h-3" /> Branch Locked
                        </span>
                      )}
                    </label>
                    {permissions.isBranchManager ? (
                      <div className="w-full bg-bg-surface-alt border border-border rounded-lg py-2 px-3 text-xs text-text-primary flex items-center justify-between font-bold">
                        <span>Branch #{user?.branch_id || editingVehicleFull.branch_id || 1} (Your Showroom)</span>
                        <span className="badge-neutral text-xs">
                          Manager Scoped
                        </span>
                      </div>
                    ) : (
                      <select
                        value={editForm.branch_id}
                        onChange={(e) => setEditForm({ ...editForm, branch_id: Number(e.target.value) })}
                        className="input-base text-xs cursor-pointer"
                      >
                        {branches.length > 0 ? (
                          branches.map((b) => (
                            <option key={b.branch_id} value={b.branch_id}>
                              Branch #{b.branch_id} — {b.branch_name} ({b.city})
                            </option>
                          ))
                        ) : (
                          <>
                            <option value={1}>Branch #1 — CarRevive Chennai Central</option>
                            <option value={2}>Branch #2 — CarRevive OMR Expressway</option>
                            <option value={3}>Branch #3 — CarRevive Coimbatore</option>
                          </>
                        )}
                      </select>
                    )}
                  </div>

                  {/* Fuel Type */}
                  <div>
                    <label className="text-xs font-bold text-text-secondary block mb-1">Fuel Type</label>
                    <select
                      value={editForm.fuel_type}
                      onChange={(e) => setEditForm({ ...editForm, fuel_type: e.target.value })}
                      className="input-base text-xs cursor-pointer"
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Electric">Electric</option>
                    </select>
                  </div>

                  {/* Transmission */}
                  <div>
                    <label className="text-xs font-bold text-text-secondary block mb-1">Transmission</label>
                    <select
                      value={editForm.transmission}
                      onChange={(e) => setEditForm({ ...editForm, transmission: e.target.value })}
                      className="input-base text-xs cursor-pointer"
                    >
                      <option value="Automatic">Automatic (DCT / Torque Converter / CVT)</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </div>

                  {/* Owner Type */}
                  <div>
                    <label className="text-xs font-bold text-text-secondary block mb-1">Ownership</label>
                    <select
                      value={editForm.owner_type}
                      onChange={(e) => setEditForm({ ...editForm, owner_type: e.target.value })}
                      className="input-base text-xs cursor-pointer"
                    >
                      <option value="First Owner">First Owner</option>
                      <option value="Second Owner">Second Owner</option>
                      <option value="Third Owner">Third Owner</option>
                      <option value="Corporate Fleet">Corporate Fleet</option>
                    </select>
                  </div>

                  {/* Kilometers Driven */}
                  <div>
                    <label className="text-xs font-bold text-text-secondary block mb-1">Kilometers Driven</label>
                    <input
                      type="number"
                      min={0}
                      value={editForm.kilometers_driven} max={2000000}
                      onChange={(e) => setEditForm({ ...editForm, kilometers_driven: e.target.value })}
                      className="input-base text-xs"
                    />
                  </div>

                  {/* Color */}
                  <div>
                    <label className="text-xs font-bold text-text-secondary block mb-1">Exterior Paint Finish</label>
                    <input
                      type="text"
                      placeholder="e.g. Tanzanite Blue Metallic"
                      value={editForm.color} maxLength={30}
                      onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                      className="input-base text-xs"
                    />
                  </div>

                  {/* Listing Price */}
                  <div>
                    <label className="text-xs font-bold text-text-secondary block mb-1 flex items-center justify-between">
                      <span>Listing Showroom Price (₹) <span className="text-danger">*</span></span>
                      {editForm.suggested_price && (
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, price: String(editForm.suggested_price) })}
                          className="text-xs text-accent font-bold flex items-center gap-1 cursor-pointer hover:underline"
                        >
                          <Sparkles className="w-3 h-3 text-warning" /> Apply Recommended ₹{Number(editForm.suggested_price).toLocaleString('en-IN')}
                        </button>
                      )}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary font-bold text-xs">₹</span>
                      <input
                        type="number"
                        required
                        min={10000}
                        placeholder="e.g. 5800000"
                        value={editForm.price} max={1000000000}
                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                        className="input-base text-xs font-bold pl-7"
                      />
                    </div>
                  </div>

                  {/* Procurement Purchase Price */}
                  <div>
                    <label className="text-xs font-bold text-text-secondary block mb-1">
                      Dealer Acquisition Cost (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary font-bold text-xs">₹</span>
                      <input
                        type="number"
                        placeholder="e.g. 5200000 (Internal Margin Tracking)"
                        value={editForm.purchase_price} min={0} max={1000000000}
                        onChange={(e) => setEditForm({ ...editForm, purchase_price: e.target.value })}
                        className="input-base text-xs pl-7"
                      />
                    </div>
                  </div>
                </div>

                {/* Image URL & Presets */}
                <div>
                  <label className="text-xs font-bold text-text-secondary block mb-1">
                    Automobile Image URL
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="url"
                      placeholder="https://..."
                      value={editForm.image_url} maxLength={1000}
                      onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                      className="flex-1 input-base text-xs"
                    />
                    {editForm.image_url && (
                      <img
                        src={editForm.image_url}
                        alt="Preview"
                        className="w-12 h-9 object-cover rounded-lg border border-border shrink-0"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-xs text-text-secondary">Presets:</span>
                    {CAR_IMAGE_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, image_url: p.url })}
                        className="btn-neutral text-xs py-1 px-2 h-auto"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-bold text-text-secondary block mb-1">
                    Vehicle Description & Condition Summary
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter vehicle highlight notes..."
                    value={editForm.description} maxLength={10000}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full input-base text-xs"
                  />
                </div>

                {/* 150-Point Roadworthiness & Inspection Score (Dynamic Admin Audit) */}
                <div className="p-4 rounded-lg bg-bg-surface-alt border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-warning" />
                      <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                        150-Point Roadworthiness Audit Score
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const target = editingVehicleFull;
                        setEditingVehicleFull(null);
                        setInspectingVehicle(target);
                      }}
                      className="text-xs text-accent font-bold hover:underline cursor-pointer"
                    >
                      Audit 150-Point Checklist &rarr;
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Dynamic Inspection Score (0 - 100) */}
                    <div>
                      <label className="text-xs font-bold text-text-secondary block mb-1">
                        Audit Score (0-100) <span className="text-danger">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          required
                          value={editForm.inspection_score}
                          onChange={(e) => setEditForm({ ...editForm, inspection_score: e.target.value })}
                          className="input-base text-xs font-bold"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs">
                          / 100
                        </span>
                      </div>
                    </div>

                    {/* Certification Tier */}
                    <div>
                      <label className="text-xs font-bold text-text-secondary block mb-1">
                        Certification Tier
                      </label>
                      <select
                        value={editForm.certification_tier}
                        onChange={(e) => setEditForm({ ...editForm, certification_tier: e.target.value })}
                        className="input-base text-xs"
                      >
                        <option value="Gold Certified">Gold Certified</option>
                        <option value="Platinum Certified">Platinum Certified</option>
                        <option value="Diamond Elite Certified">Diamond Elite Certified</option>
                        <option value="Standard Certified">Standard Certified</option>
                        <option value="Pre-Owned Verified">Pre-Owned Verified</option>
                      </select>
                    </div>

                    {/* Roadworthiness Status */}
                    <div>
                      <label className="text-xs font-bold text-text-secondary block mb-1">
                        Roadworthiness
                      </label>
                      <select
                        value={editForm.is_good_to_use}
                        onChange={(e) => setEditForm({ ...editForm, is_good_to_use: e.target.value })}
                        className="input-base text-xs font-bold"
                      >
                        <option value="true">✓ Certified Good to Use</option>
                        <option value="false">⚠ Attention Needed</option>
                      </select>
                    </div>
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="text-xs font-bold text-text-secondary block mb-1">
                      Inspection Engineer Remarks
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 150 mechanical and electrical checkpoints audited. 100% roadworthy."
                      value={editForm.inspection_remarks}
                      onChange={(e) => setEditForm({ ...editForm, inspection_remarks: e.target.value })}
                      className="input-base text-xs"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setEditingVehicleFull(null)}
                    className="btn-neutral"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="btn-primary flex items-center gap-2"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating Vehicle...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Save Vehicle Changes</span>
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
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-bg-surface border border-border rounded-lg shadow-lg p-6 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-bg-surface-alt border border-border flex items-center justify-center text-text-primary">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Edit Vehicle Price</h3>
                    <p className="text-xs text-text-secondary">{editingVehicle.make} {editingVehicle.model} ({editingVehicle.registration_number})</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  className="btn-neutral w-8 h-8 p-0 flex items-center justify-center rounded-lg"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Aging Suggestion Badge if available */}
              {editingVehicle.suggested_price && (
                <div className="mb-4 p-3 rounded-lg bg-bg-surface-alt border border-border flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase font-bold text-text-secondary block">Aging-Based Recommended Markdown</span>
                    <span className="text-sm font-bold text-text-primary font-mono">
                      ₹{Number(editingVehicle.suggested_price).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewPrice(String(editingVehicle.suggested_price))}
                    className="btn-secondary text-xs flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-warning" />
                    Use Suggested
                  </button>
                </div>
              )}

              <form onSubmit={handleSavePrice} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-text-secondary block mb-1">
                    Current Price: <span className="text-text-primary font-bold">₹{Number(editingVehicle.price || 0).toLocaleString('en-IN')}</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary font-bold">₹</span>
                    <input
                      type="number"
                      required
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full input-base pl-8 text-sm font-bold"
                      placeholder="Enter new listing price"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingVehicle(null)}
                    className="btn-neutral"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary"
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

        {/* VEHICLE WHAT-IF REPRICING & PROFIT SIMULATOR MODAL */}
        <VehicleProfitWhatIfSimulatorModal
          isOpen={isSimulatorOpen}
          onClose={() => setIsSimulatorOpen(false)}
          selectedVehicle={simulatorVehicle}
          allVehicles={vehicles}
          onPriceUpdated={(vehicleId, newPrice) => {
            setVehicles((prev) =>
              prev.map((v) =>
                String(v.vehicle_id || v.id) === String(vehicleId)
                  ? { ...v, price: newPrice }
                  : v
              )
            );
          }}
          onOpenFullDealSimulator={(vehicleId) => {
            setIsSimulatorOpen(false);
            router.push(`/admin/budget-simulator?vehicleId=${vehicleId}`);
          }}
        />
      </div>
    </RequireRole>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-text-secondary">Loading inventory dashboard...</div>}>
      <InventoryPageInner />
    </Suspense>
  );
}
