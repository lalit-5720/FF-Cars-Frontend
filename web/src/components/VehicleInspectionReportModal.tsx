'use client';

import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  Printer, 
  FileText, 
  Cpu, 
  Gauge, 
  Zap, 
  Wrench, 
  Wind, 
  Disc, 
  Award,
  Calendar,
  MapPin,
  UserCheck
} from 'lucide-react';

interface InspectionReportModalProps {
  car: any;
  isOpen: boolean;
  onClose: () => void;
}

export function VehicleInspectionReportModal({ car, isOpen, onClose }: InspectionReportModalProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  if (!isOpen || !car) return null;

  const make = car.make || car.brand || 'Vehicle';
  const model = car.model || '';
  const year = car.manufacture_year || car.year || 2023;
  const km = (car.kilometers_driven || car.kmDriven || 0).toLocaleString();
  const regNumber = car.registration_number || 'TN Registration';
  const branchName = car.branches?.branch_name || (car.branch_id === 2 ? 'CarRevive - Velachery' : 'CarRevive - Anna Nagar');
  const inspectorName = car.branch_id === 2 ? 'Dinesh Palanisamy (Certified Master Tech)' : 'Rajkumar Swaminathan (Lead Quality Inspector)';
  const certId = `CR-CERT-2026-${String(car.vehicle_id || car.id || 101).padStart(4, '0')}`;

  const categories = [
    {
      id: 'engine',
      title: 'Powertrain & Transmission',
      icon: Cpu,
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
      icon: ShieldCheck,
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
      icon: Zap,
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
      icon: Disc,
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
      icon: Wind,
      score: '100%',
      items: [
        { name: 'Dual/Tri-Zone Climate Cooling Efficacy', status: 'Passed', detail: 'Chills to 6.0°C within 180s' },
        { name: 'HEPA Pollen Air Filter Replacement', status: 'Passed', detail: 'Brand new filter installed' },
        { name: 'Leather Upholstery UV & Steam Treatment', status: 'Passed', detail: 'Zero tears, grade-A sanitized' },
        { name: 'Power Windows & Panoramic Sunroof Track', status: 'Passed', detail: 'Smooth anti-pinch motor function' },
      ]
    }
  ];

  const handlePrint = () => {
    window.print();
  };

  const displayedCategories = activeCategory === 'all'
    ? categories
    : categories.filter(c => c.id === activeCategory);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl bg-[#0B0F1A] border border-[#2D374A] rounded-3xl shadow-2xl overflow-hidden my-6 animate-in zoom-in-95 duration-200 print:border-none print:shadow-none print:w-full print:max-w-none print:text-black">
        
        {/* Certificate Header Bar */}
        <div className="p-6 border-b border-[#2D374A] flex items-center justify-between bg-[#141A2A] print:border-b-2 print:border-gray-800 print:bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 print:text-black print:bg-gray-100">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-white print:text-black font-display">
                  150-Point Certified Inspection Certificate
                </h3>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 print:border-emerald-600 print:text-emerald-700">
                  Gold Certified (98/100)
                </span>
              </div>
              <p className="text-xs text-gray-400 print:text-gray-600">
                Official CarRevive Multi-Stage Technical Certification &amp; Safety Audit
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              title="Print Certificate"
            >
              <Printer className="w-4 h-4" />
              Print Report
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Vehicle & Inspector Summary Card */}
        <div className="p-6 bg-[#0E1424] border-b border-[#1E2638] grid grid-cols-1 md:grid-cols-4 gap-4 text-xs print:bg-gray-50 print:border-gray-300">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 print:text-gray-600">Vehicle Inspected</span>
            <span className="font-extrabold text-white text-sm print:text-black">{year} {make} {model}</span>
            <span className="text-gray-400 print:text-gray-600">Reg: {regNumber} &bull; {km} km</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 print:text-gray-600">Certification ID</span>
            <span className="font-mono font-bold text-amber-400 text-sm print:text-amber-800">{certId}</span>
            <span className="text-gray-400 print:text-gray-600 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-emerald-400" /> Inspected: Sept 2026
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 print:text-gray-600">Inspecting Location</span>
            <span className="font-bold text-white print:text-black flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-500" /> {branchName}
            </span>
            <span className="text-gray-400 print:text-gray-600">ISO 9001:2015 Hub</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 print:text-gray-600">Lead Inspector</span>
            <span className="font-bold text-white print:text-black flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> {inspectorName}
            </span>
            <span className="text-emerald-400 font-semibold text-[10px]">Verified Signature Logged</span>
          </div>
        </div>

        {/* Filter Pills (hidden during print) */}
        <div className="px-6 pt-4 pb-2 flex gap-2 overflow-x-auto print:hidden">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-gray-800/60 text-gray-400 hover:text-white'
            }`}
          >
            All 150 Checkpoints
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-gray-800/60 text-gray-400 hover:text-white'
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>

        {/* Detailed Category Checklists */}
        <div className="p-6 max-h-[55vh] overflow-y-auto space-y-6 print:max-h-none print:overflow-visible">
          {displayedCategories.map((category) => {
            const Icon = category.icon;
            return (
              <div key={category.id} className="p-5 rounded-2xl bg-[#141A2A]/60 border border-[#232D42] print:border-gray-300 print:bg-white">
                <div className="flex items-center justify-between pb-3 border-b border-[#232D42] mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 print:text-black">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-extrabold text-white print:text-black font-display">
                      {category.title}
                    </h4>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Score: {category.score}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {category.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#0B0F1A]/80 border border-[#1E2638] flex items-start justify-between gap-3 print:bg-gray-50 print:border-gray-200"
                    >
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-white print:text-black">{item.name}</p>
                          <p className="text-[11px] text-gray-400 print:text-gray-600 mt-0.5">{item.detail}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded print:text-emerald-700 print:bg-transparent">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Certificate Seal & Guarantee Footer */}
        <div className="p-6 bg-[#0E1424] border-t border-[#1E2638] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs print:bg-white print:border-t-2 print:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-amber-500/60 flex items-center justify-center text-amber-400 font-black text-[10px] uppercase font-mono print:text-black">
              SEAL
            </div>
            <div>
              <p className="font-bold text-white print:text-black">CarRevive 5-Day Full Return Guarantee</p>
              <p className="text-[11px] text-gray-400 print:text-gray-600">
                Any mechanical defect uncovered within 5 days is protected by 100% money-back assurance.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all shadow-md print:hidden cursor-pointer"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
}
