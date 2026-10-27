'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../store/useAuthStore';
import { showLocalToast } from '../../Toast';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Building2,
  CarFront,
  HelpCircle,
  Eye,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronRight,
  UserCheck,
  Send,
  Loader2,
  Filter,
} from 'lucide-react';

interface OwnerDecisionCentreProps {
  branchId?: string;
  onDecisionMade?: () => void;
}

export function OwnerDecisionCentre({ branchId, onDecisionMade }: OwnerDecisionCentreProps) {
  const { user } = useAuthStore();
  const isOwner = user?.role === 'SYSTEM_ADMIN';

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedRec, setSelectedRec] = useState<any | null>(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionAction, setDecisionAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [decisionReason, setDecisionReason] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (branchId && branchId !== 'all') params.branchId = branchId;
      if (typeFilter !== 'ALL') params.type = typeFilter;
      const res = await api.get('/bi/recommendations', { params });
      setRecommendations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn('Failed to load recommendations:', err);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [branchId, typeFilter]);

  const handleOpenDecisionModal = (rec: any, action: 'APPROVE' | 'REJECT') => {
    if (!isOwner) {
      showLocalToast('Only Showroom Owners can approve or reject business recommendations.', 'error');
      return;
    }
    setSelectedRec(rec);
    setDecisionAction(action);
    setDecisionReason('');
    setIsDecisionModalOpen(true);
  };

  const handleExecuteDecision = async () => {
    if (!selectedRec) return;
    setSubmittingDecision(true);
    try {
      const endpoint = decisionAction === 'APPROVE'
        ? `/bi/recommendations/${selectedRec.recommendation_id}/approve`
        : `/bi/recommendations/${selectedRec.recommendation_id}/reject`;

      await api.post(endpoint, { reason: decisionReason.trim() || undefined });

      showLocalToast(
        decisionAction === 'APPROVE'
          ? `Recommendation #${selectedRec.recommendation_id} approved successfully.`
          : `Recommendation #${selectedRec.recommendation_id} rejected.`,
        'success'
      );

      setIsDecisionModalOpen(false);
      setSelectedRec(null);
      await fetchRecommendations();
      if (onDecisionMade) onDecisionMade();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Failed to record decision.';
      showLocalToast(errMsg, 'error');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const pendingCount = recommendations.filter((r) => r.status === 'PENDING').length;
  const approvedCount = recommendations.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = recommendations.filter((r) => r.status === 'REJECTED').length;

  const filteredRecs = recommendations.filter((r) => {
    if (activeTab === 'ALL') return true;
    return r.status === activeTab;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'SOURCE_MORE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Procurement Priority</span>;
      case 'REVIEW_STOCK':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Overstock Review</span>;
      case 'INVESTIGATE_CONVERSION':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Conversion Bottleneck</span>;
      case 'TRANSFER_STOCK':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Inter-Branch Transfer</span>;
      case 'REPRICE_STOCK':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Aging Reprice</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">{type}</span>;
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <ShieldCheck size={18} />
            </span>
            <h2 className="text-lg font-extrabold text-slate-900">Owner Decision Centre</h2>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {isOwner ? 'Owner Authorized' : 'Read-Only Mode'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Transparent, rule-driven business decisions for inventory sourcing, showroom transfers, and slow-moving repricing.
          </p>
        </div>

        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Recommendations</span>
        </button>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs text-xs font-medium">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PENDING'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Clock size={13} />
            <span>Pending Decisions ({pendingCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('APPROVED')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'APPROVED'
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 size={13} />
            <span>Approved ({approvedCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'REJECTED'
                ? 'bg-rose-600 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <XCircle size={13} />
            <span>Rejected ({rejectedCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ALL'
                ? 'bg-slate-800 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>All ({recommendations.length})</span>
          </button>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 text-xs">
          <Filter size={13} className="text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-medium cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Categories</option>
            <option value="SOURCE_MORE">Procure More Units</option>
            <option value="TRANSFER_STOCK">Inter-Branch Transfers</option>
            <option value="REVIEW_STOCK">Overstock Reviews</option>
            <option value="INVESTIGATE_CONVERSION">Conversion Bottlenecks</option>
            <option value="REPRICE_STOCK">Slow-Moving Repricing</option>
          </select>
        </div>
      </div>

      {/* Recommendations Cards List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <Loader2 size={24} className="animate-spin mx-auto text-blue-600" />
          <p className="text-xs font-medium">Evaluating inventory demand and generating recommendations...</p>
        </div>
      ) : filteredRecs.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-300 rounded-2xl bg-white space-y-2">
          <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
          <h3 className="font-bold text-slate-900 text-sm">No {activeTab.toLowerCase()} recommendations</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {activeTab === 'PENDING'
              ? 'All current inventory and demand rules are balanced. No pending actions required by the owner.'
              : 'No items recorded in this decision bracket.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3.5">
          {filteredRecs.map((rec) => {
            const isPending = rec.status === 'PENDING';
            const isApproved = rec.status === 'APPROVED';
            const isRejected = rec.status === 'REJECTED';

            return (
              <div
                key={rec.recommendation_id}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 transition-all shadow-2xs hover:shadow-md space-y-3"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      #REC-{rec.recommendation_id}
                    </span>
                    {getTypeBadge(rec.type)}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        rec.priority === 'HIGH'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {rec.priority} PRIORITY
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {new Date(rec.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isApproved && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Approved by {rec.reviewer?.first_name || 'Owner'}
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                        <XCircle size={12} />
                        Rejected by {rec.reviewer?.first_name || 'Owner'}
                      </span>
                    )}
                    {isPending && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Clock size={12} />
                        Pending Decision
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Target */}
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <span>{rec.title}</span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500">
                    {rec.make && rec.model && (
                      <span className="flex items-center gap-1 text-slate-700 font-bold">
                        <CarFront size={12} className="text-purple-600" />
                        {rec.make} {rec.model}
                      </span>
                    )}
                    {rec.source_branch && (
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <Building2 size={12} className="text-blue-600" />
                        {rec.source_branch.branch_name}
                      </span>
                    )}
                    {rec.target_branch && (
                      <span className="flex items-center gap-1 text-emerald-700 font-bold">
                        <ArrowRight size={12} /> Target: {rec.target_branch.branch_name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Reason & Evidence */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <div className="font-medium text-slate-800">
                    <span className="text-slate-500 font-normal">Business Rationale: </span>
                    {rec.reason}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-bold">
                    <span className="text-slate-500 font-normal">Recommended Action: </span>
                    {rec.suggested_action}
                  </div>
                </div>

                {/* Supporting Figures summary */}
                {rec.supporting_figures && (
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-600">
                    {Object.entries(rec.supporting_figures).map(([k, v]) => {
                      if (typeof v === 'object' || v === null) return null;
                      return (
                        <span key={k} className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          <strong className="text-slate-800 capitalize font-bold">{k.replace(/([A-Z])/g, ' $1')}:</strong> {String(v)}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Audit trail for decided recommendations */}
                {(isApproved || isRejected) && rec.decision_reason && (
                  <div className="text-[11px] p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 flex items-center gap-2">
                    <UserCheck size={13} className="text-blue-600 shrink-0" />
                    <span>
                      <strong className="text-slate-800">Owner Remarks:</strong> &ldquo;{rec.decision_reason}&rdquo; ({new Date(rec.reviewed_at).toLocaleDateString()})
                    </span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setSelectedRec(rec);
                      setIsDecisionModalOpen(false);
                    }}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye size={12} />
                    <span>Inspect Evidence</span>
                  </button>

                  {isPending && isOwner && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenDecisionModal(rec, 'REJECT')}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                      >
                        <XCircle size={13} />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => handleOpenDecisionModal(rec, 'APPROVE')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 size={13} />
                        <span>Approve Recommendation</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Decision Execution Modal */}
      {isDecisionModalOpen && selectedRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span
                className={`p-2 rounded-xl ${
                  decisionAction === 'APPROVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                }`}
              >
                {decisionAction === 'APPROVE' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
              </span>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {decisionAction === 'APPROVE' ? 'Approve Recommendation' : 'Reject Recommendation'}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Recommendation #{selectedRec.recommendation_id}: {selectedRec.title}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
              <p className="font-bold text-slate-900 mb-1">Proposed Action:</p>
              <p className="text-slate-600 font-medium">{selectedRec.suggested_action}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900">
                Decision Remarks / Audit Reason (Optional):
              </label>
              <textarea
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                rows={3}
                placeholder={
                  decisionAction === 'APPROVE'
                    ? 'e.g., Authorized for procurement via Mahindra First Choice auction.'
                    : 'e.g., Postponed due to current budget constraints.'
                }
                className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
              Recording this decision registers the owner audit log and updates the executive decision register. No irreversible third-party financial transaction is executed automatically.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDecisionModalOpen(false)}
                disabled={submittingDecision}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDecision}
                disabled={submittingDecision}
                className={`px-4 py-1.5 rounded-xl text-white text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-1.5 ${
                  decisionAction === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submittingDecision && <Loader2 size={13} className="animate-spin" />}
                <span>Confirm {decisionAction === 'APPROVE' ? 'Approval' : 'Rejection'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
