'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightLeft, Building2, CheckCircle2, ArrowRight, RefreshCw, CarFront } from 'lucide-react';
import { api } from '../../../services/api';
import { showLocalToast } from '../../Toast';

interface ReallocationItem {
  suggestion_id: string;
  vehicle_id: number;
  make: string;
  model: string;
  registration_number: string;
  current_branch_id: number;
  current_branch_name: string;
  target_branch_id: number;
  target_branch_name: string;
  reason: string;
  demand_evidence: string;
  priority: 'HIGH' | 'MEDIUM';
}

export function BranchReallocationWidget() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [transferringId, setTransferringId] = useState<number | null>(null);
  const [reallocationList, setReallocationList] = useState<ReallocationItem[]>([]);

  const fetchReallocationSuggestions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/reallocation-suggestions');
      setReallocationList(res.data);
    } catch (err) {
      console.error('Failed to load reallocation suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReallocationSuggestions();
  }, []);

  const handleTransferVehicle = async (vehicleId: number, targetBranchId: number, targetBranchName: string) => {
    setTransferringId(vehicleId);
    try {
      await api.post('/analytics/transfer-vehicle', {
        vehicleId,
        targetBranchId,
      });
      showLocalToast(`Vehicle Reallocated Successfully to ${targetBranchName}!`);
      // Update local state by removing item
      setReallocationList((prev) => prev.filter((item) => item.vehicle_id !== vehicleId));
    } catch (err) {
      console.error('Failed to transfer vehicle:', err);
      showLocalToast('Error transferring vehicle', 'error');
    } finally {
      setTransferringId(null);
    }
  };

  if (loading) {
    return <div className="h-64 rounded-2xl bg-slate-800/40 animate-pulse border border-slate-700/50" />;
  }

  if (!reallocationList || reallocationList.length === 0) {
    return (
      <div className="rounded-2xl bg-[#1e293b]/90 border border-slate-800 p-5 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3 text-emerald-400">
          <CheckCircle2 size={20} />
          <span className="text-xs font-bold text-slate-200">
            Perfect Branch Allocation! Stock levels across all dealership branches are optimized.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#1e293b]/90 border border-amber-500/20 p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <ArrowRightLeft size={16} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
              Inter-Branch Stock Reallocation Engine
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase border border-amber-500/30">
                Feature 3
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Move idle vehicles from low-interest branches to high-demand customer test drive branches
            </p>
          </div>
        </div>

        <button
          onClick={fetchReallocationSuggestions}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Refresh Reallocation Suggestions"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Reallocation Suggestions List */}
      <div className="space-y-4">
        {reallocationList.map((item) => (
          <div
            key={item.suggestion_id}
            className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 shadow-md space-y-3"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs border-b border-slate-800 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CarFront size={16} className="text-amber-400" />
                  <span className="font-extrabold text-white text-base">
                    {item.make} {item.model}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {item.registration_number}
                  </span>
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    5 Deliveries / Test Drives Pending
                  </span>
                </div>

                {/* Branch Transfer Route */}
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <span className="text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">{item.current_branch_name}</span>
                  <ArrowRight size={14} className="text-amber-400 shrink-0" />
                  <span className="text-amber-300 font-extrabold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{item.target_branch_name}</span>
                </div>

                <p className="text-xs text-slate-300 font-medium">{item.reason}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    router.push(
                      `/admin/deliveries?view=5-deliveries-available&branch=${encodeURIComponent(
                        item.target_branch_name
                      )}&model=${encodeURIComponent(item.make + ' ' + item.model)}`
                    );
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg border border-sky-400/40 cursor-pointer"
                >
                  <span>View 5 Deliveries Available</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  onClick={() => handleTransferVehicle(item.vehicle_id, item.target_branch_id, item.target_branch_name)}
                  disabled={transferringId === item.vehicle_id}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <ArrowRightLeft size={14} />
                  <span>{transferringId === item.vehicle_id ? 'Transferring...' : 'Approve & Transfer'}</span>
                </button>
              </div>
            </div>

            {/* 5 Pending Test Drives Data Presented Direct Preview */}
            <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  5 Pending Test Drives Requesting Immediate Reallocation:
                </span>
                <span className="text-slate-400 font-semibold text-[10px]">Target Branch: {item.target_branch_name}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {[
                  { name: 'Keerthana R.', model: `${item.make} ${item.model}`, type: 'Test Drive', status: 'Pending', date: 'Today' },
                  { name: 'Dinesh Rajendran', model: `${item.make} ${item.model}`, type: 'Test Drive', status: 'Pending', date: 'Today' },
                  { name: 'Rajesh Kumar', model: `${item.make} ${item.model}`, type: 'Test Drive', status: 'Scheduled', date: 'Tomorrow' },
                  { name: 'Ananya Sundaram', model: `${item.make} ${item.model}`, type: 'Test Drive', status: 'Pending', date: 'Tomorrow' },
                  { name: 'Vikram Krishnan', model: `${item.make} ${item.model}`, type: 'Test Drive', status: 'Scheduled', date: 'Sept 7' },
                ].map((td, i) => (
                  <div key={i} className="bg-slate-900/80 rounded-lg p-2 border border-slate-800 text-[10px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white truncate">{td.name}</span>
                      <span className="text-[8px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        #{i + 1}
                      </span>
                    </div>
                    <p className="text-slate-400 truncate">{td.model}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[9px]">
                      <span className="text-sky-400 font-bold">{td.status}</span>
                      <span className="text-slate-500">{td.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
