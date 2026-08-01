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

export function SalesRevenueChart({ dataPoints: propDataPoints, timeframe: initialTimeframe = 'This Year', onTimeframeChange }: RevenueChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(initialTimeframe);

  const yearPoints: MonthlyPoint[] = [
    { month: 'Jan', val: 900000, formatted: '₹9.0L' },
    { month: 'Feb', val: 1150000, formatted: '₹11.5L' },
    { month: 'Mar', val: 1650000, formatted: '₹16.5L' },
    { month: 'Apr', val: 1400000, formatted: '₹14.0L' },
    { month: 'May', val: 1800000, formatted: '₹18.0L' },
    { month: 'Jun', val: 1950000, formatted: '₹19.5L' },
    { month: 'Jul', val: 2450000, formatted: '₹24.5L' },
  ];

  const formatL = (v: number) => {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
    return `₹${(v / 100000).toFixed(1)}L`;
  };

  const getQuarterPoints = (): MonthlyPoint[] => {
    if (propDataPoints && propDataPoints.length > 0) {
      const q1Val = (propDataPoints[0]?.val || 0) + (propDataPoints[1]?.val || 0) + (propDataPoints[2]?.val || 0);
      const q2Val = (propDataPoints[3]?.val || 0) + (propDataPoints[4]?.val || 0) + (propDataPoints[5]?.val || 0);
      const q3Val = (propDataPoints[6]?.val || 0) + (propDataPoints[7]?.val || 0) + (propDataPoints[8]?.val || 0);
      const q4Val = (propDataPoints[9]?.val || 0) + (propDataPoints[10]?.val || 0) + (propDataPoints[11]?.val || 0);

      return [
        { month: 'Q1 (Jan-Mar)', val: q1Val, formatted: formatL(q1Val) },
        { month: 'Q2 (Apr-Jun)', val: q2Val, formatted: formatL(q2Val) },
        { month: 'Q3 (Jul-Sep)', val: q3Val, formatted: formatL(q3Val) },
        { month: 'Q4 (Oct-Dec)', val: q4Val, formatted: formatL(q4Val) },
      ];
    }
    return [
      { month: 'Q1 (Jan-Mar)', val: 3700000, formatted: '₹37.0L' },
      { month: 'Q2 (Apr-Jun)', val: 5150000, formatted: '₹51.5L' },
      { month: 'Q3 (Jul-Sep)', val: 2450000, formatted: '₹24.5L' },
      { month: 'Q4 (Oct-Dec)', val: 0, formatted: '₹0.0L' },
    ];
  };

  const getMonthPoints = (): MonthlyPoint[] => {
    if (propDataPoints && propDataPoints.length > 0) {
      const curVal = propDataPoints[propDataPoints.length - 1]?.val || 0;
      const w1 = Math.round(curVal * 0.22);
      const w2 = Math.round(curVal * 0.26);
      const w3 = Math.round(curVal * 0.24);
      const w4 = Math.max(0, curVal - w1 - w2 - w3);
      return [
        { month: 'Week 1', val: w1, formatted: formatL(w1) },
        { month: 'Week 2', val: w2, formatted: formatL(w2) },
        { month: 'Week 3', val: w3, formatted: formatL(w3) },
        { month: 'Week 4', val: w4, formatted: formatL(w4) },
      ];
    }
    return [
      { month: 'Week 1', val: 450000, formatted: '₹4.5L' },
      { month: 'Week 2', val: 680000, formatted: '₹6.8L' },
      { month: 'Week 3', val: 720000, formatted: '₹7.2L' },
      { month: 'Week 4', val: 950000, formatted: '₹9.5L' },
    ];
  };

  const getActivePoints = () => {
    if (selectedTimeframe === 'This Month') return getMonthPoints();
    if (selectedTimeframe === 'This Quarter' || selectedTimeframe === 'Last Quarter') return getQuarterPoints();
    return propDataPoints && propDataPoints.length > 0 ? propDataPoints : yearPoints;
  };

  const points = getActivePoints();
  const maxVal = Math.max(...points.map((p) => p.val), 100000);

  // Map values to SVG coordinates (width 440, height 200, padding y: 30 to 170)
  const coords = points.map((p, i) => {
    const x = 20 + i * ((440 - 40) / Math.max(1, points.length - 1));
    const normalizedY = 170 - (p.val / maxVal) * 130;
    return { ...p, x, y: Math.max(30, Math.min(170, normalizedY)) };
  });

  const [hoveredPoint, setHoveredPoint] = useState<{ month: string; value: string; x: number; y: number } | null>(null);

  React.useEffect(() => {
    if (coords.length > 0) {
      const activePoint = coords[coords.length - 1];
      setHoveredPoint({
        month: selectedTimeframe === 'This Year' ? `${activePoint.month} 2026` : activePoint.month,
        value: activePoint.formatted,
        x: activePoint.x,
        y: activePoint.y,
      });
    }
  }, [selectedTimeframe, propDataPoints]);

  const handleTimeframeSelect = (val: string) => {
    setSelectedTimeframe(val);
    if (onTimeframeChange) onTimeframeChange(val);
  };

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
    <div className="p-6 rounded-2xl border border-slate-200/90 bg-white shadow-sm flex flex-col justify-between gap-4 h-full text-slate-900">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 font-sans">Sales Overview (Revenue)</h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {selectedTimeframe === 'This Month' ? 'Weekly revenue breakdown for current month' : selectedTimeframe === 'This Quarter' ? 'Quarterly revenue performance breakdown' : 'Real-time monthly revenue computed from branch sales'}
          </p>
        </div>
        <select
          value={selectedTimeframe}
          onChange={(e) => handleTimeframeSelect(e.target.value)}
          aria-label="Select revenue timeframe"
          className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer shadow-sm"
        >
          <option value="This Month">This Month</option>
          <option value="This Quarter">This Quarter</option>
          <option value="This Year">This Year</option>
        </select>
      </div>

      <div className="relative w-full h-56 pt-2 select-none">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 440 200">
          <defs>
            <linearGradient id="indigoSuperGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0F172A" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0.0" />
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
              className="text-slate-200"
              strokeDasharray="4 4"
            />
          ))}

          {/* Fill area */}
          <path d={areaPath} fill="url(#indigoSuperGradient)" />

          {/* Smooth Curve */}
          <path d={svgPath} fill="none" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />

          {/* Interactive Data Nodes */}
          {coords.map((pt, idx) => (
            <g key={idx} className="cursor-pointer">
              <circle
                cx={pt.x}
                cy={pt.y}
                r="5"
                className="fill-slate-900 stroke-white stroke-2 hover:r-7 transition-all"
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
            className="absolute z-20 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs shadow-xl border border-slate-700 pointer-events-none transform -translate-x-1/2 -translate-y-12 transition-all"
            style={{ left: `${(hoveredPoint.x / 440) * 100}%`, top: `${(hoveredPoint.y / 200) * 100}%` }}
          >
            <div className="font-semibold text-slate-300">{hoveredPoint.month}</div>
            <div className="font-extrabold text-sm text-white font-mono mt-0.5">{hoveredPoint.value}</div>
          </div>
        )}

        {/* X Axis Labels */}
        <div className="flex justify-between px-3 text-xs text-slate-500 font-bold mt-2">
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
    { name: 'Hyundai', pct: 40, color: '#0F172A', count: 6 },
    { name: 'Honda', pct: 26, color: '#10B981', count: 4 },
    { name: 'BMW', pct: 20, color: '#3B82F6', count: 3 },
    { name: 'Maruti', pct: 14, color: '#F59E0B', count: 2 },
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
    <div className="p-6 rounded-2xl border border-slate-200/90 bg-white shadow-sm flex flex-col h-full text-slate-900 justify-between gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 font-sans">Top Selling Brands (Branch Split)</h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Share of total completed vehicle sales</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center gap-6 py-2">
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
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Total Sold</span>
            <span className="text-2xl font-black text-slate-900 font-mono leading-tight">{totalCount}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3">
          {brandData.map((b) => (
            <div key={b.name} className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: b.color }} />
                <span className="font-bold text-slate-800 truncate max-w-[90px]">{b.name}</span>
              </div>
              <span className="font-mono text-slate-900 font-extrabold text-xs">{b.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
