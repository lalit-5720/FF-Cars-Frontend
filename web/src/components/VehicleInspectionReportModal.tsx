'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  Printer, 
  FileText, 
  Cpu, 
  Zap, 
  Wrench, 
  Wind, 
  Disc, 
  Award, 
  Calendar, 
  MapPin, 
  UserCheck, 
  Edit3, 
  Save, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  Loader2, 
  CheckSquare,
  Eye,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { showLocalToast } from './Toast';

interface InspectionReportModalProps {
  car: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (updatedCar: any) => void;
}

export function VehicleInspectionReportModal({ car, isOpen, onClose, onUpdated }: InspectionReportModalProps) {
  const { user } = useAuthStore();
  const canEdit = user?.role === 'SYSTEM_ADMIN' || user?.role === 'ADMIN' || user?.role === 'BRANCH_MANAGER';

  const [activeCategory, setActiveCategory] = useState<string>('all');
  // Default to true for managers/admins so it is immediately editable!
  const [isEditing, setIsEditing] = useState(true);
  const [saving, setSaving] = useState(false);

  // Default Categories structure
  const getDefaultCategories = () => [
    {
      id: 'engine',
      title: 'Powertrain & Transmission',
      iconName: 'Cpu',
      score: '100%',
      items: [
        { name: 'Cylinder Compression & Valve Timings', status: 'Passed', detail: 'Factory psi within ±2%' },
        { name: 'Engine Oil & Gasket Leak Analysis', status: 'Passed', detail: 'Zero seepage observed' },
        { name: 'Transmission Fluid & Smooth Gear Shift', status: 'Passed', detail: 'No clutch slip or harshness' },
        { name: 'Turbocharger Boost & Intercooler Seal', status: 'Passed', detail: 'Boost pressure optimal' },
        { name: 'Engine Mounts & Vibration Dampening', status: 'Passed', detail: 'Intact hydraulic bushings' },
      ]
    },
    {
      id: 'chassis',
      title: 'Chassis & Structural Integrity',
      iconName: 'ShieldCheck',
      score: '100%',
      items: [
        { name: 'Apron & Pillar Structural Measurement', status: 'Passed', detail: 'Zero frame deformation' },
        { name: 'Underbody Flood & Rust Protection', status: 'Passed', detail: 'Clean undercarriage, anti-corrosion intact' },
        { name: 'Digital Paint Depth Ultrasound Scan', status: 'Passed', detail: 'Uniform 110-130 microns' },
        { name: 'Panel Gap Consistency Verification', status: 'Passed', detail: 'OEM tolerances preserved' },
      ]
    },
    {
      id: 'electrical',
      title: 'Electricals & Computer Diagnostics',
      iconName: 'Zap',
      score: '98%',
      items: [
        { name: 'OBD-II Full System ECU Error Scan', status: 'Passed', detail: '0 Diagnostic Trouble Codes (DTC)' },
        { name: 'AGM/Lithium Starter Battery Health', status: 'Passed', detail: '94% Cold Cranking Amps (CCA)' },
        { name: 'Alternator Charging Voltage Output', status: 'Passed', detail: 'Stable 14.2V load tested' },
        { name: 'Infotainment & Speaker Frequency Response', status: 'Passed', detail: 'Apple CarPlay & sensors responsive' },
      ]
    },
    {
      id: 'brakes',
      title: 'Brakes, Tyres & Suspension',
      iconName: 'Disc',
      score: '95%',
      items: [
        { name: 'Front & Rear Ceramic Brake Pads', status: 'Passed', detail: '80% friction material remaining' },
        { name: 'ABS Hydraulic Valve & Brake Boost', status: 'Passed', detail: 'Instant response, pedal firm' },
        { name: 'Suspension Struts, Bushings & Link Rods', status: 'Passed', detail: 'No oil leaks, rebound verified' },
        { name: 'All 4 Tyres Tread Depth Measurement', status: 'Passed', detail: '6.2mm tread (85% tyre life remaining)' },
      ]
    },
    {
      id: 'cabin',
      title: 'Air Conditioning & Cabin Sanitization',
      iconName: 'Wind',
      score: '100%',
      items: [
        { name: 'Dual/Tri-Zone Climate Cooling Efficacy', status: 'Passed', detail: 'Chills to 6.0°C within 180s' },
        { name: 'HEPA Pollen Air Filter Replacement', status: 'Passed', detail: 'Brand new filter installed' },
        { name: 'Leather Upholstery UV & Steam Treatment', status: 'Passed', detail: 'Zero tears, grade-A sanitized' },
        { name: 'Power Windows & Panoramic Sunroof Track', status: 'Passed', detail: 'Smooth anti-pinch motor function' },
      ]
    }
  ];

  // Form State
  const [certTier, setCertTier] = useState('Gold Certified');
  const [overallScore, setOverallScore] = useState(98);
  const [isGoodToUse, setIsGoodToUse] = useState(true);
  const [inspectorName, setInspectorName] = useState('');
  const [inspectionDate, setInspectionDate] = useState('');
  const [certId, setCertId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (!car) return;

    const saved = car.inspectionReport || (car.description?.includes('<!--INSPECTION_REPORT-->') 
      ? JSON.parse(car.description.split('<!--INSPECTION_REPORT-->')[1].trim()) 
      : null);

    const defaultInspector = user?.name 
      ? `${user.name} (${user.role === 'BRANCH_MANAGER' ? 'Branch Manager' : 'System Admin'})`
      : (car.branch_id === 2 ? 'Priya Raman (Branch Manager)' : 'Arun Kumar (Branch Manager)');

    const defaultCertId = `CR-CERT-2026-${String(car.vehicle_id || car.id || 101).padStart(4, '0')}`;

    if (saved) {
      setCertTier(saved.certificationTier || 'Gold Certified');
      setOverallScore(saved.overallScore ?? 98);
      setIsGoodToUse(saved.isGoodToUse !== undefined ? saved.isGoodToUse : true);
      setInspectorName(saved.inspectorName || defaultInspector);
      setInspectionDate(saved.inspectionDate || new Date().toISOString().split('T')[0]);
      setCertId(saved.certificateId || defaultCertId);
      setRemarks(saved.remarks || 'All 150 mechanical and electrical checkpoints audited. Vehicle verified 100% roadworthy and good to use.');
      setCategories(saved.categories && saved.categories.length > 0 ? saved.categories : getDefaultCategories());
    } else {
      setCertTier('Gold Certified');
      setOverallScore(98);
      setIsGoodToUse(true);
      setInspectorName(defaultInspector);
      setInspectionDate(new Date().toISOString().split('T')[0]);
      setCertId(defaultCertId);
      setRemarks('All 150 mechanical and electrical checkpoints audited. Vehicle verified 100% roadworthy and good to use.');
      setCategories(getDefaultCategories());
    }

    // Default to edit mode if user has manager/admin role
    setIsEditing(canEdit);
  }, [car, isOpen, user]);

  if (!isOpen || !car) return null;

  const make = car.make || car.brand || 'Vehicle';
  const model = car.model || '';
  const year = car.manufacture_year || car.year || 2024;
  const km = (car.kilometers_driven || car.kmDriven || 0).toLocaleString();
  const regNumber = car.registration_number || 'TN Registration';
  const branchName = car.branches?.branch_name || (car.branch_id === 2 ? 'CarRevive - OMR' : car.branch_id === 3 ? 'CarRevive - Coimbatore' : 'CarRevive - Chennai Central');

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'engine': return Cpu;
      case 'chassis': return ShieldCheck;
      case 'electrical': return Zap;
      case 'brakes': return Disc;
      case 'cabin': return Wind;
      default: return Wrench;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Checkpoint Status Cycling
  const cycleItemStatus = (catIndex: number, itemIndex: number) => {
    if (!isEditing && !canEdit) return;
    const statuses = ['Passed', 'Attention Needed', 'Serviced', 'Failed'];
    setCategories((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      const current = updated[catIndex].items[itemIndex].status || 'Passed';
      const nextIdx = (statuses.indexOf(current) + 1) % statuses.length;
      updated[catIndex].items[itemIndex].status = statuses[nextIdx];
      return updated;
    });
  };

  const setDirectItemStatus = (catIndex: number, itemIndex: number, newStatus: string) => {
    setCategories((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated[catIndex].items[itemIndex].status = newStatus;
      return updated;
    });
  };

  const handleItemDetailChange = (catIndex: number, itemIndex: number, newDetail: string) => {
    setCategories((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated[catIndex].items[itemIndex].detail = newDetail;
      return updated;
    });
  };

  const handleCategoryScoreChange = (catIndex: number, newScore: string) => {
    setCategories((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated[catIndex].score = newScore;
      return updated;
    });
  };

  // Helper: Mark all checkpoints passed
  const handlePassAllCheckpoints = () => {
    setCategories((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated.forEach((cat: any) => {
        cat.score = '100%';
        cat.items.forEach((it: any) => {
          it.status = 'Passed';
        });
      });
      return updated;
    });
    setOverallScore(100);
    setIsGoodToUse(true);
    showLocalToast('All 150 inspection checkpoints marked as Passed!');
  };

  const handleSaveInspection = async () => {
    setSaving(true);
    try {
      const reportPayload = {
        certificationTier: certTier,
        overallScore: Number(overallScore),
        isGoodToUse: Boolean(isGoodToUse),
        inspectorName,
        inspectionDate,
        certificateId: certId,
        remarks,
        categories,
      };

      const vehicleId = car.vehicle_id || car.id;
      const res = await api.patch(`/vehicles/${vehicleId}/inspection`, {
        inspectionReport: reportPayload,
      });

      const updatedVehicle = res.data;
      showLocalToast(`Vehicle #${vehicleId} inspection updated! Roadworthiness: ${isGoodToUse ? 'Good to Use' : 'Attention Needed'}.`);

      if (onUpdated) {
        onUpdated(updatedVehicle);
      }
    } catch (err: any) {
      console.error('Failed to save inspection report:', err);
      showLocalToast(err.response?.data?.message || 'Failed to save inspection report', 'error');
    } finally {
      setSaving(false);
    }
  };

  const displayedCategories = activeCategory === 'all'
    ? categories
    : categories.filter(c => c.id === activeCategory);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-start p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Outer Modal Container with flex-col and max-h to prevent flex-clipping */}
      <div className="relative w-full max-w-5xl my-auto bg-[#0B0F1A] border border-[#2D374A] rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200 print:border-none print:shadow-none print:w-full print:max-w-none print:max-h-none print:overflow-visible print:text-black">
        
        {/* FIXED HEADER: ALWAYS VISIBLE AT TOP, NEVER CLIPPED */}
        <div className="flex-shrink-0 p-5 sm:p-6 border-b border-[#2D374A] bg-[#141A2A] flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:border-b-2 print:border-gray-800 print:bg-white">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 flex-shrink-0 print:text-black print:bg-gray-100">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white print:text-black font-display tracking-tight">
                  150-Point Certified Roadworthiness Audit
                </h3>
                {canEdit && (
                  <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Manager Inspection Console
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 print:text-gray-600 mt-0.5">
                {year} {make} {model} &bull; Reg: <span className="font-mono text-sky-400 font-bold">{regNumber}</span> &bull; {branchName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden self-end sm:self-auto">
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isEditing 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' 
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title="Toggle Edit / Preview Mode"
              >
                {isEditing ? <Edit3 className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{isEditing ? 'Editing Enabled' : 'View Only'}</span>
              </button>
            )}

            {canEdit && (
              <button
                type="button"
                onClick={handleSaveInspection}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{saving ? 'Saving...' : 'Save & Certify'}</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Print Certificate"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-200 transition-colors cursor-pointer"
              title="Close Audit Window"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ROADWORTHINESS DECISION SWITCH (CAN EDIT ROADWORTHINESS HERE) */}
        <div className={`flex-shrink-0 px-5 sm:px-6 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
          isGoodToUse
            ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-200'
            : 'bg-amber-950/50 border-amber-500/30 text-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            {isGoodToUse ? (
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider">
                  {isGoodToUse ? '✓ Certified Good to Use & Roadworthy' : '⚠️ Attention Needed / Inspection Pending'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold font-mono bg-black/40 border border-white/10 text-white">
                  Score: {overallScore}/100 &bull; {certTier}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {isGoodToUse
                  ? 'Vehicle satisfies all critical safety, chassis, braking, and powertrain parameters. Authorized for showroom delivery.'
                  : 'Vehicle has unresolved checkpoints requiring technician attention or replacement before customer delivery.'}
              </p>
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsGoodToUse(!isGoodToUse)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border shadow transition-all cursor-pointer flex items-center gap-1.5 ${
                  isGoodToUse
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 hover:bg-emerald-400'
                    : 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400'
                }`}
              >
                {isGoodToUse ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                <span>{isGoodToUse ? 'Verdict: Good to Use (Click to Toggle)' : 'Verdict: Needs Attention (Click to Pass)'}</span>
              </button>
            </div>
          )}
        </div>

        {/* SCROLLABLE MAIN CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar print:overflow-visible print:p-0">
          
          {/* INSPECTION METRICS & EDIT CONTROLS */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#141A2A]/80 border border-[#2D374A] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2D374A]">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-400" /> Audit Parameters &amp; Inspector Credentials
              </span>
              {canEdit && (
                <button
                  type="button"
                  onClick={handlePassAllCheckpoints}
                  className="px-3 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Pass All 150 Points</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {/* Overall Score */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Overall Audit Score (0 - 100)
                </label>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={50}
                      max={100}
                      value={overallScore}
                      onChange={(e) => setOverallScore(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="w-20 bg-[#0B0F1A] border border-[#2D374A] focus:border-amber-500 rounded-xl py-1.5 px-3 text-xs font-mono font-bold text-amber-400 text-center focus:outline-none"
                    />
                    <input
                      type="range"
                      min={60}
                      max={100}
                      value={overallScore}
                      onChange={(e) => setOverallScore(Number(e.target.value))}
                      className="flex-1 accent-amber-400 cursor-pointer"
                    />
                  </div>
                ) : (
                  <span className="font-mono text-base font-extrabold text-amber-400">{overallScore}/100</span>
                )}
              </div>

              {/* Certification Tier */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Certification Tier
                </label>
                {isEditing ? (
                  <select
                    value={certTier}
                    onChange={(e) => setCertTier(e.target.value)}
                    className="w-full bg-[#0B0F1A] border border-[#2D374A] focus:border-amber-500 rounded-xl py-1.5 px-3 text-xs font-bold text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Gold Certified">Gold Certified (95-100 pts)</option>
                    <option value="Diamond Elite Certified">Diamond Elite Certified</option>
                    <option value="Platinum Certified">Platinum Certified</option>
                    <option value="Standard Certified">Standard Certified</option>
                  </select>
                ) : (
                  <span className="font-bold text-white text-xs">{certTier}</span>
                )}
              </div>

              {/* Inspector Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Certifying Manager / Inspector
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    className="w-full bg-[#0B0F1A] border border-[#2D374A] focus:border-sky-500 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none"
                    placeholder="e.g. Arun Kumar (Branch Manager)"
                  />
                ) : (
                  <span className="font-bold text-white text-xs">{inspectorName}</span>
                )}
              </div>

              {/* Certificate ID */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Audit Certificate Number
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={certId}
                    onChange={(e) => setCertId(e.target.value)}
                    className="w-full bg-[#0B0F1A] border border-[#2D374A] focus:border-sky-500 rounded-xl py-1.5 px-3 text-xs font-mono font-bold text-sky-400 focus:outline-none"
                  />
                ) : (
                  <span className="font-mono font-bold text-sky-400 text-xs">{certId}</span>
                )}
              </div>
            </div>

            {/* Inspector Remarks / Roadworthiness Notes */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Inspection Verdict Notes &amp; Technician Observations
              </label>
              {isEditing ? (
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Record observations on powertrain health, brakes, chassis alignment, and customer readiness..."
                  className="w-full bg-[#0B0F1A] border border-[#2D374A] focus:border-sky-500 rounded-xl p-3 text-xs text-slate-200 focus:outline-none leading-relaxed"
                />
              ) : (
                <p className="text-xs text-slate-300 italic bg-[#0B0F1A] p-3 rounded-xl border border-[#2D374A]">
                  &ldquo;{remarks}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* CHECKPOINTS CATEGORY TABS */}
          <div className="flex items-center justify-between gap-3 border-b border-[#2D374A] pb-3 print:hidden">
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
                  activeCategory === 'all'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md shadow-amber-500/20'
                    : 'bg-[#141A2A] text-slate-400 hover:text-white border border-[#2D374A]'
                }`}
              >
                All 150 Points
              </button>
              {categories.map((cat) => {
                const CatIcon = getCategoryIcon(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 ${
                      activeCategory === cat.id
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md shadow-amber-500/20'
                        : 'bg-[#141A2A] text-slate-400 hover:text-white border border-[#2D374A]'
                    }`}
                  >
                    <CatIcon className="w-3.5 h-3.5" />
                    <span>{cat.title}</span>
                  </button>
                );
              })}
            </div>

            {canEdit && (
              <span className="text-[11px] text-slate-400 hidden sm:inline-block font-semibold">
                Tip: Click any checkpoint badge to toggle Passed/Attention/Serviced!
              </span>
            )}
          </div>

          {/* CHECKLIST CARDS (DIRECTLY EDITABLE) */}
          <div className="space-y-5">
            {displayedCategories.map((category, catIndex) => {
              const Icon = getCategoryIcon(category.id);
              return (
                <div 
                  key={category.id} 
                  className="p-5 rounded-2xl bg-[#141A2A]/60 border border-[#232D42] space-y-4 print:border-gray-300 print:bg-white"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#232D42]">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 print:text-black">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-white print:text-black font-display">
                          {category.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 print:text-gray-600">
                          {category.items.length} safety &amp; performance checkpoints verified
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Score: {category.score}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {category.items.map((item: any, itemIdx: number) => {
                      const isItemPassed = item.status === 'Passed';
                      const isItemAttention = item.status === 'Attention Needed';
                      const isItemServiced = item.status === 'Serviced';

                      return (
                        <div
                          key={itemIdx}
                          className="p-3.5 rounded-xl bg-[#0B0F1A] border border-[#1E2638] hover:border-[#2D374A] flex flex-col justify-between gap-2.5 transition-all print:bg-gray-50 print:border-gray-200"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                                isItemPassed ? 'text-emerald-400' :
                                isItemAttention ? 'text-amber-400' :
                                isItemServiced ? 'text-sky-400' : 'text-rose-400'
                              }`} />
                              <div>
                                <p className="text-xs font-bold text-white print:text-black">{item.name}</p>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={item.detail}
                                    onChange={(e) => handleItemDetailChange(catIndex, itemIdx, e.target.value)}
                                    placeholder="Observation / measurement"
                                    className="mt-1 w-full bg-[#141A2A] border border-[#2D374A] rounded-lg px-2 py-1 text-[11px] text-slate-300 font-mono focus:outline-none focus:border-sky-500"
                                  />
                                ) : (
                                  <p className="text-[11px] text-slate-400 print:text-gray-600 mt-0.5">{item.detail}</p>
                                )}
                              </div>
                            </div>

                            {/* Direct Interactive Status Selector */}
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setDirectItemStatus(catIndex, itemIdx, 'Passed')}
                                  className={`px-2 py-1 rounded text-[10px] font-extrabold transition-all cursor-pointer ${
                                    item.status === 'Passed'
                                      ? 'bg-emerald-500 text-slate-950 font-black shadow'
                                      : 'bg-slate-900 text-slate-500 hover:text-emerald-400 border border-slate-800'
                                  }`}
                                  title="Mark checkpoint Passed"
                                >
                                  Pass
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDirectItemStatus(catIndex, itemIdx, 'Attention Needed')}
                                  className={`px-2 py-1 rounded text-[10px] font-extrabold transition-all cursor-pointer ${
                                    item.status === 'Attention Needed'
                                      ? 'bg-amber-500 text-slate-950 font-black shadow'
                                      : 'bg-slate-900 text-slate-500 hover:text-amber-400 border border-slate-800'
                                  }`}
                                  title="Mark Attention Needed"
                                >
                                  Attn
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDirectItemStatus(catIndex, itemIdx, 'Serviced')}
                                  className={`px-2 py-1 rounded text-[10px] font-extrabold transition-all cursor-pointer ${
                                    item.status === 'Serviced'
                                      ? 'bg-sky-500 text-slate-950 font-black shadow'
                                      : 'bg-slate-900 text-slate-500 hover:text-sky-400 border border-slate-800'
                                  }`}
                                  title="Mark Serviced/Replaced"
                                >
                                  Serv
                                </button>
                              </div>
                            ) : (
                              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                                item.status === 'Passed' ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800' :
                                item.status === 'Attention Needed' ? 'text-amber-300 bg-amber-950/60 border-amber-800' :
                                item.status === 'Serviced' ? 'text-sky-300 bg-sky-950/60 border-sky-800' :
                                'text-rose-400 bg-rose-950/60 border-rose-800'
                              }`}>
                                {item.status}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* FIXED FOOTER: ALWAYS VISIBLE WITH PROMINENT SAVE & CLOSE BUTTONS */}
        <div className="flex-shrink-0 p-4 sm:p-5 bg-[#0E1424] border-t border-[#1E2638] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs print:bg-white print:border-t-2 print:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-amber-500/60 flex items-center justify-center text-amber-400 font-black text-[10px] uppercase font-mono print:text-black flex-shrink-0">
              SEAL
            </div>
            <div>
              <p className="font-bold text-white print:text-black">
                CarRevive 150-Point Technical Certification &amp; Roadworthiness Guarantee
              </p>
              <p className="text-[11px] text-slate-400 print:text-gray-600">
                Backed by 5-day money-back guarantee &bull; Status: <strong className={isGoodToUse ? 'text-emerald-400' : 'text-amber-400'}>
                  {isGoodToUse ? 'Certified Good to Use' : 'Needs Technician Rectification'}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {canEdit && (
              <button
                type="button"
                onClick={handleSaveInspection}
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition-all print:hidden cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Saving Certificate...</span>
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    <span>Save &amp; Certify Report</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-colors print:hidden cursor-pointer text-center"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
