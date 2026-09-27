'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, BookOpen } from 'lucide-react';

export default function AdminWorkflowPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12 text-foreground font-sans flex items-center justify-center">
      <div className="max-w-xl w-full rounded-3xl border border-border bg-card p-8 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mx-auto shadow-inner">
          <BookOpen className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-secondary text-muted-foreground border border-border">
            Architectural Specification
          </span>
          <h1 className="text-2xl font-extrabold text-foreground font-display">
            Operational Workflow Documented
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Per system standards, the 7-stage dealership operational workflow and relational state transitions are documented in detail within the comprehensive engineering reports (<code className="text-purple-400 font-mono">FULL_PROJECT_FEATURE_REPORT.md</code>) rather than rendered as interactive website pages.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-secondary/30 border border-border text-left text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <CheckCircle2 size={15} className="text-emerald-400" />
            <span>Documented Workflow Stages:</span>
          </div>
          <ul className="text-muted-foreground text-[11px] space-y-1 pl-6 list-disc">
            <li>Stage 1: Lead Ingestion &amp; Assignment (New &rarr; Contacted)</li>
            <li>Stage 2: Qualification (Hot Lead &amp; Qualified Inquiry)</li>
            <li>Stage 3: Test-Drive Confirmation &amp; Experiential Feedback</li>
            <li>Stage 4: Sales Contract Formulation &amp; Deposit Locking</li>
            <li>Stage 5: Dual Payment Settlement (Cash vs. 2% Loan Financing)</li>
            <li>Stage 6: Pre-Delivery Inspection (PDI) &amp; Digital Gate-Pass Handover</li>
            <li>Stage 7: Vehicle Delivery Sign-Off &amp; BI Metric Ingestion</li>
          </ul>
        </div>

        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-all"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
