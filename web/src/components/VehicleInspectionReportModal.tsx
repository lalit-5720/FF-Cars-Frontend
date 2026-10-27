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

  // Helper: Calculate category score dynamically from its audited checkpoints
  const calcScoreFromItems = (items: any[]) => {
    if (!items || items.length === 0) return 95;
    const weights: Record<string, number> = {
      'Passed': 100,
      'Serviced': 90,
      'Attention Needed': 72,
      'Failed': 40
    };
    const sum = items.reduce((acc, it) => acc + (weights[it.status || 'Passed'] ?? 100), 0);
    return Math.round(sum / items.length);
  };

  // Default Categories structure - DYNAMICALLY calibrated based on vehicle attributes
  const getDefaultCategories = (targetCar?: any) => {
    const km = Number(targetCar?.kilometers_driven || targetCar?.kmDriven || 28000);
    const yr = Number(targetCar?.manufacture_year || targetCar?.year || 2023);
    const age = Math.max(1, 2026 - yr);
    const vId = Number(targetCar?.vehicle_id || targetCar?.id || 101);

    // Dynamic, realistic component scores based on vehicle condition & age:
    const engineScore = Math.max(84, Math.min(100, Math.round(99 - (km / 50000) * 3 - age * 0.7 + ((vId * 7) % 4))));
    const chassisScore = Math.max(90, Math.min(100, Math.round(100 - (age > 4 ? 2 : 0) + ((vId * 3) % 3))));
    const electricalScore = Math.max(82, Math.min(100, Math.round(97 - age * 1.1 + ((vId * 11) % 5))));
    const brakesScore = Math.max(78, Math.min(100, Math.round(96 - (km / 22000) * 5 + ((vId * 5) % 5))));
    const cabinScore = Math.max(85, Math.min(100, Math.round(98 - age * 1.3 + ((vId * 9) % 4))));

    return [
      {
        id: 'engine',
        title: 'Powertrain & Transmission',
        iconName: 'Cpu',
        score: `${engineScore}%`,
        items: [
          { name: 'Cylinder Compression & Valve Timings', status: 'Passed', detail: 'Factory psi within ±2%' },
          { name: 'Engine Oil & Gasket Leak Analysis', status: 'Passed', detail: 'Zero seepage observed' },
          { name: 'Transmission Fluid & Smooth Gear Shift', status: engineScore < 90 ? 'Serviced' : 'Passed', detail: engineScore < 90 ? 'Transmission fluid topped & shifts re-calibrated' : 'No clutch slip or harshness' },
          { name: 'Turbocharger Boost & Intercooler Seal', status: 'Passed', detail: 'Boost pressure optimal' },
          { name: 'Engine Mounts & Vibration Dampening', status: 'Passed', detail: 'Intact hydraulic bushings' },
        ]
      },
      {
        id: 'chassis',
        title: 'Chassis & Structural Integrity',
        iconName: 'ShieldCheck',
        score: `${chassisScore}%`,
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
        score: `${electricalScore}%`,
        items: [
          { name: 'OBD-II Full System ECU Error Scan', status: 'Passed', detail: '0 Diagnostic Trouble Codes (DTC)' },
          { name: 'AGM/Lithium Starter Battery Health', status: electricalScore < 92 ? 'Serviced' : 'Passed', detail: `${Math.round(88 + ((vId * 3) % 10))}% Cold Cranking Amps (CCA)` },
          { name: 'Alternator Charging Voltage Output', status: 'Passed', detail: 'Stable 14.2V load tested' },
          { name: 'Infotainment & Speaker Frequency Response', status: 'Passed', detail: 'Apple CarPlay & sensors responsive' },
        ]
      },
      {
        id: 'brakes',
        title: 'Brakes, Tyres & Suspension',
        iconName: 'Disc',
        score: `${brakesScore}%`,
        items: [
          { name: 'Front & Rear Ceramic Brake Pads', status: brakesScore < 86 ? 'Attention Needed' : brakesScore < 92 ? 'Serviced' : 'Passed', detail: `${Math.round(70 + ((vId * 7) % 25))}% friction material remaining` },
          { name: 'ABS Hydraulic Valve & Brake Boost', status: 'Passed', detail: 'Instant response, pedal firm' },
          { name: 'Suspension Struts, Bushings & Link Rods', status: 'Passed', detail: 'No oil leaks, rebound verified' },
          { name: 'All 4 Tyres Tread Depth Measurement', status: km > 40000 ? 'Serviced' : 'Passed', detail: `${(5.5 + ((vId % 4) * 0.4)).toFixed(1)}mm tread depth verified` },
        ]
      },
      {
        id: 'cabin',
        title: 'Air Conditioning & Cabin Sanitization',
        iconName: 'Wind',
        score: `${cabinScore}%`,
        items: [
          { name: 'Dual/Tri-Zone Climate Cooling Efficacy', status: 'Passed', detail: `Chills to ${(5.8 + ((vId % 3) * 0.4)).toFixed(1)}°C within 180s` },
          { name: 'HEPA Pollen Air Filter Replacement', status: cabinScore < 92 ? 'Serviced' : 'Passed', detail: 'Brand new cabin filter installed' },
          { name: 'Leather Upholstery UV & Steam Treatment', status: 'Passed', detail: 'Zero tears, grade-A sanitized' },
          { name: 'Power Windows & Panoramic Sunroof Track', status: 'Passed', detail: 'Smooth anti-pinch motor function' },
        ]
      }
    ];
  };

  // Form State
  const [certTier, setCertTier] = useState('Gold Certified');
  const [overallScore, setOverallScore] = useState(98);
  const [isGoodToUse, setIsGoodToUse] = useState(true);
  const [inspectorName, setInspectorName] = useState('');
  const [inspectionDate, setInspectionDate] = useState('');
  const [certId, setCertId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  // Synchronize Overall Score and Roadworthiness when components change
  const syncOverallScore = (cats: any[]) => {
    if (!cats || cats.length === 0) return;
    const scores = cats.map((c) => parseInt(c.score) || 90);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / cats.length);
    setOverallScore(avg);

    const hasFailed = cats.some((c) => (c.items || []).some((it: any) => it.status === 'Failed'));
    const isRoadworthy = avg >= 80 && !hasFailed;
    setIsGoodToUse(isRoadworthy);

    if (avg >= 95) setCertTier('Platinum Certified');
    else if (avg >= 90) setCertTier('Gold Certified');
    else if (avg >= 80) setCertTier('Silver Certified');
    else setCertTier('Standard Certified');
  };

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
      setOverallScore(saved.overallScore !== undefined ? saved.overallScore : 90);
      setIsGoodToUse(saved.isGoodToUse !== undefined ? saved.isGoodToUse : true);
      setInspectorName(saved.inspectorName || defaultInspector);
      setInspectionDate(saved.inspectionDate || new Date().toISOString().split('T')[0]);
      setCertId(saved.certificateId || defaultCertId);
      setRemarks(saved.remarks || 'All 150 mechanical and electrical checkpoints audited. Vehicle verified 100% roadworthy and good to use.');
      setCategories(saved.categories && saved.categories.length > 0 ? saved.categories : getDefaultCategories(car));
    } else {
      const initialCats = getDefaultCategories(car);
      const scores = initialCats.map(c => parseInt(c.score) || 90);
      const computedOverall = Math.round(scores.reduce((a, b) => a + b, 0) / initialCats.length);
      setCertTier(computedOverall >= 95 ? 'Platinum Certified' : computedOverall >= 90 ? 'Gold Certified' : 'Silver Certified');
      setOverallScore(computedOverall);
      setIsGoodToUse(computedOverall >= 80);
      setInspectorName(defaultInspector);
      setInspectionDate(new Date().toISOString().split('T')[0]);
      setCertId(defaultCertId);
      setRemarks('All 150 mechanical and electrical checkpoints audited. Vehicle verified 100% roadworthy and good to use.');
      setCategories(initialCats);
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

  // Checkpoint Status Cycling with dynamic score recalculation
  const cycleItemStatus = (catIndex: number, itemIndex: number) => {
    if (!isEditing && !canEdit) return;
    const statuses = ['Passed', 'Attention Needed', 'Serviced', 'Failed'];
    setCategories((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      const current = updated[catIndex].items[itemIndex].status || 'Passed';
      const nextIdx = (statuses.indexOf(current) + 1) % statuses.length;
      updated[catIndex].items[itemIndex].status = statuses[nextIdx];
      // Recalculate category score dynamically from checkpoints
      updated[catIndex].score = `${calcScoreFromItems(updated[catIndex].items)}%`;
      syncOverallScore(updated);
      return updated;
    });
  };

  const setDirectItemStatus = (catIndex: number, itemIndex: number, newStatus: string) => {
    setCategories((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated[catIndex].items[itemIndex].status = newStatus;
      // Recalculate category score dynamically from checkpoints
      updated[catIndex].score = `${calcScoreFromItems(updated[catIndex].items)}%`;
      syncOverallScore(updated);
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

  const handleCategoryScoreChange = (catIndex: number, newScoreVal: number | string) => {
    const num = Math.min(100, Math.max(0, Number(newScoreVal) || 0));
    setCategories((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated[catIndex].score = `${num}%`;
      syncOverallScore(updated);
      return updated;
    });
  };

  const handleRecalculateCategory = (catIndex: number) => {
    setCategories((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      const calc = calcScoreFromItems(updated[catIndex].items);
      updated[catIndex].score = `${calc}%`;
      syncOverallScore(updated);
      showLocalToast(`${updated[catIndex].title} dynamic score recalculated: ${calc}%`, 'info');
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
    <div className="fixed inset-0 z-50 bg-black/60 flex flex-col items-center justify-start p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Outer Modal Container */}
      <div className="relative w-full max-w-5xl my-auto bg-bg-surface border border-border rounded-lg shadow-xl flex flex-col max-h-[92vh] overflow-hidden print:border-none print:shadow-none print:w-full print:max-w-none print:max-h-none print:overflow-visible print:text-text-primary">
        
        {/* FIXED HEADER */}
        <div className="flex-shrink-0 p-4 sm:p-5 border-b border-border bg-bg-surface-alt flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:border-b-2 print:border-border print:bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-bg-surface border border-border flex items-center justify-center text-accent flex-shrink-0 print:text-text-primary print:bg-bg-surface-alt">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-text-primary print:text-text-primary">
                  150-Point Certified Roadworthiness Audit
                </h3>
                {canEdit && (
                  <span className="badge badge-info">
                    Manager Inspection Console
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary print:text-text-secondary mt-0.5">
                {year} {make} {model} &bull; Reg: <span className="font-bold text-accent">{regNumber}</span> &bull; {branchName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden self-end sm:self-auto">
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="btn-neutral text-xs h-8 px-3 flex items-center gap-1.5"
                title="Toggle Edit / Preview Mode"
              >
                {isEditing ? <Edit3 className="w-3.5 h-3.5 text-accent" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{isEditing ? 'Editing Enabled' : 'View Only'}</span>
              </button>
            )}

            {canEdit && (
              <button
                type="button"
                onClick={handleSaveInspection}
                disabled={saving}
                className="btn-primary text-xs h-8 px-3 flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{saving ? 'Saving...' : 'Save & Certify'}</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="btn-neutral w-8 h-8 p-0 flex items-center justify-center rounded-lg"
              title="Print Certificate"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="btn-neutral w-8 h-8 p-0 flex items-center justify-center rounded-lg"
              title="Close Audit Window"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ROADWORTHINESS DECISION SWITCH */}
        <div className="flex-shrink-0 px-4 sm:px-5 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-bg-surface-alt">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-bg-surface border border-border flex items-center justify-center text-accent flex-shrink-0">
              {isGoodToUse ? <ShieldCheck className="w-5 h-5 text-status-success" /> : <AlertTriangle className="w-5 h-5 text-status-warning" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  {isGoodToUse ? 'Certified Good to Use & Roadworthy' : 'Attention Needed / Inspection Pending'}
                </span>
                <span className={`badge ${isGoodToUse ? 'badge-success' : 'badge-warning'}`}>
                  Score: {overallScore}/100 &bull; {certTier}
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
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
                className={`btn-primary text-xs h-8 px-3 flex items-center gap-1.5`}
              >
                {isGoodToUse ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                <span>{isGoodToUse ? 'Verdict: Good to Use (Click to Toggle)' : 'Verdict: Needs Attention (Click to Pass)'}</span>
              </button>
            </div>
          )}
        </div>

        {/* SCROLLABLE MAIN CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 print:overflow-visible print:p-0">
          
          {/* INSPECTION METRICS & EDIT CONTROLS */}
          <div className="p-4 rounded-lg bg-bg-surface-alt border border-border space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                <Sliders className="w-4 h-4 text-accent" /> Audit Parameters &amp; Inspector Credentials
              </span>
              {canEdit && (
                <button
                  type="button"
                  onClick={handlePassAllCheckpoints}
                  className="btn-neutral text-xs h-7 px-2.5 flex items-center gap-1"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Pass All 150 Points</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {/* Overall Score */}
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Overall Audit Score (0 - 100)
                </label>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={overallScore}
                      onChange={(e) => setOverallScore(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="w-16 input-base text-xs text-center font-bold"
                    />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={overallScore}
                      onChange={(e) => setOverallScore(Number(e.target.value))}
                      className="flex-1 cursor-pointer h-2 bg-bg-surface rounded-lg"
                    />
                  </div>
                ) : (
                  <span className="text-sm font-bold text-accent">{overallScore}/100</span>
                )}
              </div>

              {/* Certification Tier */}
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Certification Tier
                </label>
                {isEditing ? (
                  <select
                    value={certTier}
                    onChange={(e) => setCertTier(e.target.value)}
                    className="input-base w-full text-xs h-9 cursor-pointer"
                  >
                    <option value="Gold Certified">Gold Certified (95-100 pts)</option>
                    <option value="Diamond Elite Certified">Diamond Elite Certified</option>
                    <option value="Platinum Certified">Platinum Certified</option>
                    <option value="Standard Certified">Standard Certified</option>
                  </select>
                ) : (
                  <span className="font-bold text-text-primary text-xs">{certTier}</span>
                )}
              </div>

              {/* Inspector Name */}
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Certifying Manager / Inspector
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    className="input-base w-full text-xs h-9"
                    placeholder="e.g. Arun Kumar (Branch Manager)"
                  />
                ) : (
                  <span className="font-bold text-text-primary text-xs">{inspectorName}</span>
                )}
              </div>

              {/* Certificate ID */}
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Audit Certificate Number
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={certId}
                    onChange={(e) => setCertId(e.target.value)}
                    className="input-base w-full text-xs h-9 font-bold"
                  />
                ) : (
                  <span className="font-bold text-text-primary text-xs">{certId}</span>
                )}
              </div>
            </div>

            {/* Inspector Remarks / Roadworthiness Notes */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Inspection Verdict Notes &amp; Technician Observations
              </label>
              {isEditing ? (
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Record observations on powertrain health, brakes, chassis alignment, and customer readiness..."
                  className="input-base w-full p-2 text-xs leading-normal"
                />
              ) : (
                <p className="text-xs text-text-secondary italic bg-bg-surface p-3 rounded-lg border border-border">
                  &ldquo;{remarks}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* CHECKPOINTS CATEGORY TABS */}
          <div className="flex items-center justify-between gap-3 border-b border-border pb-3 print:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer flex-shrink-0 ${
                  activeCategory === 'all'
                    ? 'btn-primary'
                    : 'btn-neutral'
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
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0 ${
                      activeCategory === cat.id
                        ? 'btn-primary'
                        : 'btn-neutral'
                    }`}
                  >
                    <CatIcon className="w-3.5 h-3.5" />
                    <span>{cat.title}</span>
                  </button>
                );
              })}
            </div>

            {canEdit && (
              <span className="text-xs text-text-secondary hidden sm:inline-block">
                Tip: Click any checkpoint badge to toggle Passed/Attention/Serviced!
              </span>
            )}
          </div>

          {/* CHECKLIST CARDS */}
          <div className="space-y-4">
            {displayedCategories.map((category, catIndex) => {
              const Icon = getCategoryIcon(category.id);
              return (
                <div 
                  key={category.id} 
                  className="p-4 rounded-lg bg-bg-surface-alt border border-border space-y-3 print:border-border print:bg-white"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-bg-surface text-accent border border-border">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-text-primary print:text-text-primary">
                          {category.title}
                        </h4>
                        <span className="text-xs text-text-secondary print:text-text-secondary">
                          {category.items.length} safety &amp; performance checkpoints verified
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-2 bg-bg-surface p-1 px-2.5 rounded-lg border border-border print:hidden">
                          <span className="text-xs font-bold text-text-secondary">Score:</span>
                          <input
                            type="range"
                            min="50"
                            max="100"
                            value={parseInt(category.score) || 90}
                            onChange={(e) => handleCategoryScoreChange(catIndex, Number(e.target.value))}
                            className="w-20 cursor-pointer"
                            title="Adjust component score dynamically"
                          />
                          <div className="flex items-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={parseInt(category.score) || 90}
                              onChange={(e) => handleCategoryScoreChange(catIndex, Number(e.target.value))}
                              className="w-10 input-base text-center text-xs h-7 font-bold"
                            />
                            <span className="text-xs font-bold text-text-secondary ml-1">%</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRecalculateCategory(catIndex)}
                            className="btn-neutral text-xs h-7 px-2"
                            title="Auto-calculate score from audited checkpoints"
                          >
                            Auto
                          </button>
                        </div>
                      ) : (
                        <span className={`badge ${
                          (parseInt(category.score) || 90) >= 90
                            ? 'badge-success'
                            : (parseInt(category.score) || 90) >= 80
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}>
                          Score: {category.score}
                        </span>
                      )}
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
                          className="p-3 rounded-lg bg-bg-surface border border-border flex flex-col justify-between gap-2 print:bg-white print:border-border"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                                isItemPassed ? 'text-status-success' :
                                isItemAttention ? 'text-status-warning' :
                                isItemServiced ? 'text-accent' : 'text-status-danger'
                              }`} />
                              <div>
                                <p className="text-xs font-bold text-text-primary print:text-text-primary">{item.name}</p>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={item.detail}
                                    onChange={(e) => handleItemDetailChange(catIndex, itemIdx, e.target.value)}
                                    placeholder="Observation / measurement"
                                    className="input-base mt-1 w-full text-xs h-7"
                                  />
                                ) : (
                                  <p className="text-xs text-text-secondary print:text-text-secondary mt-0.5">{item.detail}</p>
                                )}
                              </div>
                            </div>

                            {/* Direct Interactive Status Selector */}
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setDirectItemStatus(catIndex, itemIdx, 'Passed')}
                                  className={`px-2 py-0.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                                    item.status === 'Passed'
                                      ? 'bg-status-success text-white'
                                      : 'bg-bg-surface-alt text-text-secondary border border-border'
                                  }`}
                                  title="Mark checkpoint Passed"
                                >
                                  Pass
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDirectItemStatus(catIndex, itemIdx, 'Attention Needed')}
                                  className={`px-2 py-0.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                                    item.status === 'Attention Needed'
                                      ? 'bg-status-warning text-white'
                                      : 'bg-bg-surface-alt text-text-secondary border border-border'
                                  }`}
                                  title="Mark Attention Needed"
                                >
                                  Attn
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDirectItemStatus(catIndex, itemIdx, 'Serviced')}
                                  className={`px-2 py-0.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                                    item.status === 'Serviced'
                                      ? 'bg-accent text-white'
                                      : 'bg-bg-surface-alt text-text-secondary border border-border'
                                  }`}
                                  title="Mark Serviced/Replaced"
                                >
                                  Serv
                                </button>
                              </div>
                            ) : (
                              <span className={`badge ${
                                item.status === 'Passed' ? 'badge-success' :
                                item.status === 'Attention Needed' ? 'badge-warning' :
                                item.status === 'Serviced' ? 'badge-info' :
                                'badge-danger'
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

        {/* FIXED FOOTER */}
        <div className="flex-shrink-0 p-4 sm:p-5 bg-bg-surface-alt border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs print:bg-white print:border-t-2 print:border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border border-dashed border-border flex items-center justify-center text-accent font-bold text-xs uppercase flex-shrink-0">
              SEAL
            </div>
            <div>
              <p className="font-bold text-text-primary print:text-text-primary">
                CarRevive 150-Point Technical Certification &amp; Roadworthiness Guarantee
              </p>
              <p className="text-xs text-text-secondary print:text-text-secondary">
                Backed by 5-day money-back guarantee &bull; Status: <strong className={isGoodToUse ? 'text-status-success' : 'text-status-warning'}>
                  {isGoodToUse ? 'Certified Good to Use' : 'Needs Technician Rectification'}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {canEdit && (
              <button
                type="button"
                onClick={handleSaveInspection}
                disabled={saving}
                className="btn-primary w-full sm:w-auto text-xs h-9 px-4 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving Certificate...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Save &amp; Certify Report</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="btn-neutral w-full sm:w-auto text-xs h-9 px-4 text-center"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
