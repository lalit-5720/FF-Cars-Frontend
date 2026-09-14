'use client';

import React, { useState } from 'react';
import { X, RotateCw, Sparkles, CheckCircle2, Shield, Eye, Cpu, Gauge, Zap } from 'lucide-react';

interface Car360ViewerProps {
  car: any;
  isOpen: boolean;
  onClose: () => void;
}

export function Car360ViewerModal({ car, isOpen, onClose }: Car360ViewerProps) {
  const [activeAngleIndex, setActiveAngleIndex] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  if (!isOpen || !car) return null;

  // Generate 8 angle images (or cycle through car.images gallery)
  const imagesList = (car.images && car.images.length > 0)
    ? car.images
    : [
        'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=1200'
      ];

  const currentImage = imagesList[activeAngleIndex % imagesList.length];

  const hotspots = [
    {
      id: 'engine',
      name: 'Powertrain & Engine Health',
      x: '30%',
      y: '65%',
      icon: Cpu,
      detail: 'Multi-point computer diagnostic verified 100% operational with full service history.',
      status: 'Passed (98% Score)'
    },
    {
      id: 'wheels',
      name: 'Alloy Wheels & Tyres',
      x: '22%',
      y: '75%',
      icon: Gauge,
      detail: 'Premium alloy wheels with 80%+ tread depth remaining on all 4 tyres.',
      status: '85% Tread Left'
    },
    {
      id: 'interior',
      name: 'Cabin & Infotainment',
      x: '55%',
      y: '45%',
      icon: Sparkles,
      detail: 'Leather upholstery sanitized, 10.2-inch touchscreen with Apple CarPlay & Android Auto.',
      status: 'Pristine Condition'
    },
    {
      id: 'sunroof',
      name: 'Panoramic Glass Sunroof',
      x: '50%',
      y: '25%',
      icon: Zap,
      detail: 'Fully functional dual-pane panoramic sunroof with UV solar protective tinting.',
      status: 'Smooth Motor Tested'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#0B0F1A] border border-[#5468F0]/40 rounded-3xl shadow-2xl overflow-hidden my-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-[#2D374A] flex items-center justify-between bg-[#141A2A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <RotateCw className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                360° Interactive Virtual Inspection
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  HD Virtual Studio
                </span>
              </h3>
              <p className="text-xs text-gray-400">Rotate vehicle perspective and click inspection hotspots</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport & Controls */}
        <div className="relative bg-[#070A12] flex flex-col items-center justify-center min-h-[420px] p-6 select-none">
          {/* Main Vehicle Image */}
          <div className="relative w-full max-w-3xl h-[340px] rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
            <img
              src={currentImage}
              alt={`${car.make} ${car.model} 360 view`}
              className="w-full h-full object-cover transition-all duration-300"
            />

            {/* Hotspot Interactive Markers */}
            {hotspots.map((spot) => {
              const Icon = spot.icon;
              const isSelected = activeHotspot === spot.id;
              return (
                <div
                  key={spot.id}
                  style={{ left: spot.x, top: spot.y }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-20"
                  onClick={() => setActiveHotspot(isSelected ? null : spot.id)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isSelected ? 'bg-amber-400 text-black scale-125 ring-4 ring-amber-400/40' : 'bg-[#5468F0] text-white hover:scale-110 shadow-lg shadow-[#5468F0]/50'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Tooltip / Card Popup */}
                  {isSelected && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-64 p-3 bg-[#141A2A] border border-amber-400/50 rounded-xl shadow-xl z-30 text-left animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">{spot.name}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {spot.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-300 leading-tight">{spot.detail}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Angle Slider Controller */}
          <div className="w-full max-w-xl mt-6 bg-[#141A2A] border border-[#2D374A] rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-gray-400 font-semibold">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Eye className="w-4 h-4" /> Perspective Angle: {((activeAngleIndex % 8) * 45)}°
              </span>
              <span>Drag slider to rotate vehicle</span>
            </div>
            <input
              type="range"
              min={0}
              max={15}
              value={activeAngleIndex}
              onChange={(e) => setActiveAngleIndex(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer h-2 bg-gray-800 rounded-lg"
            />
          </div>
        </div>

        {/* Footer Feature Highlights */}
        <div className="p-6 border-t border-[#2D374A] bg-[#141A2A] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center gap-3">
            <Shield className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white block">150-Point Certified</span>
              <span className="text-gray-400">Inspected by master technicians</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-[#5468F0] shrink-0" />
            <div>
              <span className="font-bold text-white block">Non-Accidental Guarantee</span>
              <span className="text-gray-400">Chassis & frame structural audit</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-white block">7-Day Money Back</span>
              <span className="text-gray-400">100% full refund policy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
