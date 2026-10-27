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
    return <div className="h-64 rounded-lg bg-bg-surface-alt animate-pulse border border-border" />;
  }

  if (!reallocationList || reallocationList.length === 0) {
    return (
      <div className="rounded-lg bg-bg-surface border border-border p-5 flex items-center justify-between">
        <div className="flex items-center gap-3 text-success">
          <CheckCircle2 size={20} />
          <span className="text-xs font-bold text-text-primary">
            Perfect Branch Allocation! Stock levels across all dealership branches are optimized.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-bg-surface border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-bg-surface-alt border border-border flex items-center justify-center text-text-primary">
            <ArrowRightLeft size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              Inter-Branch Stock Reallocation Engine
              <span className="badge-info text-xs">
                Feature 3
              </span>
            </h3>
            <p className="text-xs text-text-secondary">
              Move idle vehicles from low-interest branches to high-demand customer test drive branches
            </p>
          </div>
        </div>

        <button
          onClick={fetchReallocationSuggestions}
          className="btn-neutral p-1.5 rounded-lg"
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
            className="rounded-lg bg-bg-surface-alt border border-border p-4 space-y-3"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs border-b border-border pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CarFront size={16} className="text-accent" />
                  <span className="font-bold text-text-primary text-base">
                    {item.make} {item.model}
                  </span>
                  <span className="badge-neutral text-xs font-mono">
                    {item.registration_number}
                  </span>
                  <span className="badge-success text-xs">
                    5 Deliveries / Test Drives Pending
                  </span>
                </div>

                {/* Branch Transfer Route */}
                <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                  <span className="text-text-secondary bg-bg-surface px-2 py-0.5 rounded border border-border">{item.current_branch_name}</span>
                  <ArrowRight size={14} className="text-text-secondary shrink-0" />
                  <span className="text-accent font-bold bg-bg-surface px-2 py-0.5 rounded border border-border">{item.target_branch_name}</span>
                </div>

                <p className="text-xs text-text-secondary">{item.reason}</p>
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
                  className="btn-secondary text-xs flex items-center justify-center gap-1.5"
                >
                  <span>View 5 Deliveries Available</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  onClick={() => handleTransferVehicle(item.vehicle_id, item.target_branch_id, item.target_branch_name)}
                  disabled={transferringId === item.vehicle_id}
                  className="btn-primary text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <ArrowRightLeft size={14} />
                  <span>{transferringId === item.vehicle_id ? 'Transferring...' : 'Approve & Transfer'}</span>
                </button>
              </div>
            </div>

            {/* 5 Pending Test Drives Data Presented Direct Preview */}
            <div className="bg-bg-surface rounded-lg p-3 border border-border space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  5 Pending Test Drives Requesting Immediate Reallocation:
                </span>
                <span className="text-text-secondary text-xs font-bold">Target Branch: {item.target_branch_name}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {[
                  { name: 'Keerthana R.', model: `${item.make} ${item.model}`, type: 'Test Drive', status: 'Pending', date: 'Today' },
                  { name: 'Dinesh Rajendran', model: `${item.make} ${item.model}`, type: 'Test Drive', status: 'Pending', date: 'Today' },
                  { name: 'Rajesh Kumar', model: `${item.make} ${item.model}`, type: 'Test Drive', status: 'Scheduled', date: 'Tomorrow' },
                  { name: 'Ananya Sundaram', model: `${item.make} ${item.model}`, type: 'Test Drive', status: 'Pending', date: 'Tomorrow' },
                  { name: 'Vikram Krishnan', model: `${item.make} ${item.model}`, type: 'Test Drive', status: 'Scheduled', date: 'Sept 7' },
                ].map((td, i) => (
                  <div key={i} className="bg-bg-surface-alt rounded-lg p-2 border border-border text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-primary truncate">{td.name}</span>
                      <span className="badge-neutral text-xs">
                        #{i + 1}
                      </span>
                    </div>
                    <p className="text-text-secondary truncate">{td.model}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-border text-xs">
                      <span className="text-accent font-bold">{td.status}</span>
                      <span className="text-text-secondary">{td.date}</span>
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
