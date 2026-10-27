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
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-bg-surface border border-border rounded-lg shadow-lg overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-bg-surface-alt">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-bg-surface border border-border flex items-center justify-center text-accent">
              <RotateCw className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-text-primary">
                  360° Interactive Virtual Inspection
                </h3>
                <span className="badge badge-info">
                  HD Virtual Studio
                </span>
              </div>
              <p className="text-xs text-text-secondary">Rotate vehicle perspective and click inspection hotspots</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-neutral w-9 h-9 p-0 flex items-center justify-center rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport & Controls */}
        <div className="relative bg-bg-page flex flex-col items-center justify-center min-h-[400px] p-6 select-none">
          {/* Main Vehicle Image */}
          <div className="relative w-full max-w-2xl h-[320px] rounded-lg overflow-hidden border border-border bg-bg-surface">
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
                    isSelected ? 'bg-accent text-white scale-110 ring-2 ring-accent/30' : 'bg-bg-surface text-text-primary border border-border hover:border-accent shadow-sm'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Tooltip / Card Popup */}
                  {isSelected && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-64 p-3 bg-bg-surface border border-border rounded-lg shadow-lg z-30 text-left">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <span className="text-xs font-bold text-text-primary">{spot.name}</span>
                        <span className="badge badge-success text-[10px]">
                          {spot.status}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary leading-normal">{spot.detail}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Angle Slider Controller */}
          <div className="w-full max-w-xl mt-6 bg-bg-surface border border-border rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-text-secondary font-bold">
              <span className="flex items-center gap-1.5 text-accent">
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
              className="w-full cursor-pointer h-2 bg-bg-surface-alt rounded-lg"
            />
          </div>
        </div>

        {/* Footer Feature Highlights */}
        <div className="p-4 border-t border-border bg-bg-surface-alt grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-bg-surface border border-border flex items-center gap-3">
            <Shield className="w-5 h-5 text-accent shrink-0" />
            <div>
              <span className="font-bold text-text-primary block">150-Point Certified</span>
              <span className="text-text-secondary text-xs">Inspected by master technicians</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-bg-surface border border-border flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
            <div>
              <span className="font-bold text-text-primary block">Non-Accidental Guarantee</span>
              <span className="text-text-secondary text-xs">Chassis & frame structural audit</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-bg-surface border border-border flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-accent shrink-0" />
            <div>
              <span className="font-bold text-text-primary block">7-Day Money Back</span>
              <span className="text-text-secondary text-xs">100% full refund policy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
