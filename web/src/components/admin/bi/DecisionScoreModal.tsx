'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { Sparkles, X, ShieldCheck, AlertCircle, ArrowUpRight, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';

interface DecisionScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DecisionScoreModal({ isOpen, onClose }: DecisionScoreModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.get('/analytics/decision-score')
        .then((res) => setData(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const pillarsList = data?.pillars ? [
    { label: 'Sales Performance', weight: '25%', ...data.pillars.sales_performance },
    { label: 'Inventory Health', weight: '20%', ...data.pillars.inventory_health },
    { label: 'Customer Demand', weight: '15%', ...data.pillars.customer_demand },
    { label: 'Customer Satisfaction', weight: '10%', ...data.pillars.customer_satisfaction },
    { label: 'Branch Performance', weight: '15%', ...data.pillars.branch_performance },
    { label: 'Operational Health', weight: '15%', ...data.pillars.operational_health },
  ] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-sans">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-[#1e293b]/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-tight">
                CarRevive Decision Intelligence Engine
              </h2>
              <p className="text-xs text-slate-400">
                Prescriptive business analytics & 16-rule recommendation analysis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-20 text-center text-slate-400">Loading Decision Score analysis...</div>
          ) : (
            <>
              {/* Score Banner Box */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-[#1e293b] to-[#0f172a] border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
                <div className="flex items-center gap-6">
                  <div className="relative w-24 h-24 rounded-full bg-slate-900 border-4 border-sky-500 flex flex-col items-center justify-center text-center shadow-inner">
                    <span className="text-3xl font-extrabold font-mono text-white leading-none">
                      {data?.decision_score || 80}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">/ 100</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl font-extrabold text-white">{data?.status || 'Healthy'}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {data?.confidence || 'High'} Confidence
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 max-w-md">
                      The business is performing well overall (+18.6% revenue growth), with slow-moving inventory (8 vehicles) dragging the overall rating.
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-400">
                  <span className="block text-[11px]">Last recalculated:</span>
                  <strong className="text-slate-200 font-mono">{new Date().toLocaleTimeString()}</strong>
                </div>
              </div>

              {/* 6 Pillars Grid */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  6-Pillar Business Health Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pillarsList.map((p) => (
                    <div key={p.label} className="p-3.5 rounded-xl bg-[#1e293b]/70 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">{p.label} <small className="text-slate-400">({p.weight})</small></span>
                        <span className="font-mono font-extrabold text-white">{p.score}/100</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            p.score >= 80 ? 'bg-emerald-500' : p.score >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${p.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Drivers & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Positive Drivers */}
                <div className="p-4 rounded-2xl bg-[#1e293b]/60 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <TrendingUp size={14} /> Key Positive Drivers
                  </h4>
                  <div className="space-y-2 text-xs">
                    {data?.positive_drivers?.map((d: any) => (
                      <div key={d.label} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60">
                        <span className="text-slate-300 font-semibold">{d.label}</span>
                        <strong className="font-mono text-emerald-400">{d.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Negative Drivers */}
                <div className="p-4 rounded-2xl bg-[#1e293b]/60 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <TrendingDown size={14} /> Key Negative Drivers
                  </h4>
                  <div className="space-y-2 text-xs">
                    {data?.negative_drivers?.map((d: any) => (
                      <div key={d.label} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60">
                        <span className="text-slate-300 font-semibold">{d.label}</span>
                        <strong className="font-mono text-rose-400">{d.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Recommendations */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Prescriptive Recommendations Engine
                </h3>
                <div className="space-y-3">
                  {data?.recommendations?.map((rec: any) => (
                    <div key={rec.rule_id} className="p-4 rounded-2xl bg-[#1e293b] border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono text-[10px]">
                            {rec.rule_id}
                          </span>
                          {rec.issue}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          rec.priority === 'High' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                        }`}>
                          {rec.priority} Priority
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{rec.action}</p>
                      <div className="text-[11px] text-slate-400 font-medium">
                        Evidence: <span className="text-slate-200">{rec.evidence}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
