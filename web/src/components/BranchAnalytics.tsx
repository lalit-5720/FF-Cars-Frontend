'use client';

import React, { useState } from 'react';

export interface MonthlyPoint {
  month: string;
  val: number;
  formatted: string;
}

export interface BrandShare {
  name: string;
  pct: number;
  color: string;
  count: number;
}

interface RevenueChartProps {
  dataPoints?: MonthlyPoint[];
  timeframe?: string;
  onTimeframeChange?: (val: string) => void;
}

export function SalesRevenueChart({ dataPoints: propDataPoints, timeframe = 'This Year', onTimeframeChange }: RevenueChartProps) {
  const defaultPoints: MonthlyPoint[] = [
    { month: 'Jan', val: 900000, formatted: '₹9.0L' },
    { month: 'Feb', val: 1150000, formatted: '₹11.5L' },
    { month: 'Mar', val: 1650000, formatted: '₹16.5L' },
    { month: 'Apr', val: 1400000, formatted: '₹14.0L' },
    { month: 'May', val: 1800000, formatted: '₹18.0L' },
    { month: 'Jun', val: 1950000, formatted: '₹19.5L' },
    { month: 'Jul', val: 2450000, formatted: '₹24.5L' },
  ];

  const points = propDataPoints && propDataPoints.length > 0 ? propDataPoints : defaultPoints;
  const maxVal = Math.max(...points.map((p) => p.val), 100000);

  // Map values to SVG coordinates (width 440, height 200, padding y: 30 to 170)
  const coords = points.map((p, i) => {
    const x = 20 + i * ((440 - 40) / Math.max(1, points.length - 1));
    const normalizedY = 170 - (p.val / maxVal) * 130;
    return { ...p, x, y: Math.max(30, Math.min(170, normalizedY)) };
  });

  const [hoveredPoint, setHoveredPoint] = useState<{ month: string; value: string; x: number; y: number } | null>({
    month: `${coords[coords.length - 1]?.month || 'Jul'} 2026`,
    value: coords[coords.length - 1]?.formatted || '₹24,500,000',
    x: coords[coords.length - 1]?.x || 416,
    y: coords[coords.length - 1]?.y || 48,
  });

  // Construct SVG spline path
  const svgPath = coords.reduce((acc, curr, idx) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    const prev = coords[idx - 1];
    const cx1 = prev.x + (curr.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (curr.x - prev.x) / 2;
    const cy2 = curr.y;
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
  }, '');

  const areaPath = `${svgPath} L ${coords[coords.length - 1]?.x || 416} 190 L ${coords[0]?.x || 20} 190 Z`;

  return (
    <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-2xl shadow-2xl flex flex-col justify-between gap-4 h-full">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-extrabold text-lg text-white font-display">Sales Overview (Revenue)</h3>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Real-time monthly revenue computed from branch sales</p>
        </div>
        <select
          value={timeframe}
          onChange={(e) => onTimeframeChange && onTimeframeChange(e.target.value)}
          aria-label="Select revenue timeframe"
          className="px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-md"
        >
          <option value="This Year">This Year</option>
          <option value="This Month">This Month</option>
          <option value="Last Quarter">Last Quarter</option>
        </select>
      </div>

      <div className="relative w-full h-56 pt-2 select-none">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 440 200">
          <defs>
            <linearGradient id="indigoSuperGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[40, 80, 120, 160].map((yVal, idx) => (
            <line
              key={idx}
              x1="20"
              y1={yVal}
              x2="420"
              y2={yVal}
              stroke="currentColor"
              className="text-slate-800"
              strokeDasharray="4 4"
            />
          ))}

          {/* Fill area */}
          <path d={areaPath} fill="url(#indigoSuperGradient)" />

          {/* Smooth Curve */}
          <path d={svgPath} fill="none" stroke="#818cf8" strokeWidth="3.5" strokeLinecap="round" />

          {/* Interactive Data Nodes */}
          {coords.map((pt, idx) => (
            <g key={idx} className="cursor-pointer">
              <circle
                cx={pt.x}
                cy={pt.y}
                r="6"
                className="fill-indigo-400 stroke-slate-950 stroke-2 hover:r-8 transition-all"
                onMouseEnter={() =>
                  setHoveredPoint({
                    month: `${pt.month} 2026`,
                    value: pt.formatted,
                    x: pt.x,
                    y: pt.y,
                  })
                }
              />
            </g>
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="absolute z-20 px-3 py-1.5 rounded-xl bg-slate-950 text-white text-xs shadow-2xl border border-indigo-500/40 pointer-events-none transform -translate-x-1/2 -translate-y-12 transition-all"
            style={{ left: `${(hoveredPoint.x / 440) * 100}%`, top: `${(hoveredPoint.y / 200) * 100}%` }}
          >
            <div className="font-semibold text-slate-400">{hoveredPoint.month}</div>
            <div className="font-extrabold text-sm text-white font-mono mt-0.5">{hoveredPoint.value}</div>
          </div>
        )}

        {/* X Axis Labels */}
        <div className="flex justify-between px-3 text-xs text-slate-400 font-bold mt-2">
          {coords.map((pt) => (
            <span key={pt.month}>{pt.month}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

interface DonutChartProps {
  brandData?: BrandShare[];
  totalSold?: number;
}

export function TopBrandsDonutChart({ brandData: propBrandData, totalSold: propTotalSold }: DonutChartProps) {
  const defaultBrands: BrandShare[] = [
    { name: 'Hyundai', pct: 40, color: '#6366f1', count: 6 },
    { name: 'Honda', pct: 26, color: '#10b981', count: 4 },
    { name: 'BMW', pct: 20, color: '#3b82f6', count: 3 },
    { name: 'Maruti', pct: 14, color: '#f59e0b', count: 2 },
  ];

  const brandData = propBrandData && propBrandData.length > 0 ? propBrandData : defaultBrands;
  const totalCount = propTotalSold ?? brandData.reduce((a, b) => a + b.count, 0);

  // Compute stroke offsets for Donut SVG
  let accumPct = 0;
  const donutSegments = brandData.map((b) => {
    const strokeDasharray = `${b.pct} ${100 - b.pct}`;
    const strokeDashoffset = -accumPct;
    accumPct += b.pct;
    return { ...b, strokeDasharray, strokeDashoffset };
  });

  return (
    <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-2xl shadow-2xl flex flex-col justify-between gap-4 h-full">
      <div className="flex justify-between items-center">
        <h3 className="font-extrabold text-lg text-white font-display">Top Selling Brands (Branch Split)</h3>
      </div>

      <div className="flex items-center justify-center gap-6 my-2">
        {/* SVG Donut Chart */}
        <div className="relative w-36 h-36 flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            {donutSegments.map((b, idx) => (
              <circle
                key={idx}
                cx="18"
                cy="18"
                r="15.915"
                fill="transparent"
                stroke={b.color}
                strokeWidth="4.5"
                strokeDasharray={b.strokeDasharray}
                strokeDashoffset={b.strokeDashoffset}
              />
            ))}
          </svg>

          {/* Center Badge */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Total Sold</span>
            <span className="text-2xl font-black text-white font-mono leading-tight">{totalCount}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3">
          {brandData.map((b) => (
            <div key={b.name} className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: b.color }} />
                <span className="font-bold text-white truncate max-w-[90px]">{b.name}</span>
              </div>
              <span className="font-mono text-slate-300 font-extrabold text-xs">{b.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
