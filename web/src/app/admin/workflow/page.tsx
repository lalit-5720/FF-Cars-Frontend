'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Car, 
  FileText, 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  Calendar, 
  CreditCard, 
  Truck, 
  Award, 
  ArrowRight,
  Sparkles,
  Lock,
  Percent,
  Check,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  Calculator
} from 'lucide-react';

interface StageInfo {
  id: number;
  name: string;
  shortName: string;
  tagline: string;
  icon: any;
  color: string;
  gradient: string;
  badge: string;
  operationalLink: string;
  linkText: string;
  purpose: string;
  checklist: string[];
  inputs: { name: string; desc: string }[];
  processing: { title: string; desc: string }[];
  outputs: { name: string; desc: string }[];
  stateTransitions: { entity: string; from: string; to: string; trigger: string }[];
  safeguards: string[];
}

export default function AdminWorkflowPage() {
  const router = useRouter();
  const [activeStageId, setActiveStageId] = useState<number>(2); // Default to Stage 2 (Payment & Deal)
  
  // Interactive Simulator state
  const [simMode, setSimMode] = useState<'CASH' | 'LOAN'>('LOAN');
  const [simPrice, setSimPrice] = useState<number>(1000000);
  const [simToken, setSimToken] = useState<number>(50000);
  const [simDownPayment, setSimDownPayment] = useState<number>(200000);

  // Derived simulator values
  const simLoanAmount = simMode === 'LOAN' ? Math.max(0, simPrice - simDownPayment) : 0;
  const simRemainingDownpayment = simMode === 'LOAN' ? Math.max(0, simDownPayment - simToken) : 0;
  const simRemainingCash = simMode === 'CASH' ? Math.max(0, simPrice - simToken) : 0;
  const simExcessDownpayment = simMode === 'LOAN' && simToken > simDownPayment ? simToken - simDownPayment : 0;
  const simBankCommission = simMode === 'LOAN' ? Math.round(simLoanAmount * 0.02) : 0;

  const formatINR = (val: number) => `₹${Math.round(val || 0).toLocaleString('en-IN')}`;

  const stages: StageInfo[] = [
    {
      id: 1,
      name: 'Stage 1: Lead Engagement & Vehicle Trial',
      shortName: 'Discovery & Trial',
      tagline: 'Lead capture, staff assignment, qualification & test-drive feedback',
      icon: Users,
      color: 'text-blue-400',
      gradient: 'from-blue-500/20 via-indigo-500/10 to-transparent',
      badge: 'CRM & Customer Experience',
      operationalLink: '/admin/leads',
      linkText: 'Open Leads & Test Drives',
      purpose: 'Capture prospective car buyers via online inquiries or showroom walk-ins, qualify intent and budget, and execute verified showroom test drives with post-drive customer feedback.',
      checklist: [
        'Customer inquiry and profile creation with unique phone indexing.',
        'Automatic round-robin salesperson assignment by branch.',
        'Lead qualification into actionable tiers (Hot Lead 🔥 vs. Qualified Inquiry).',
        'Conflict-free test-drive calendar scheduling with zero double-booking.',
        'Post-drive quantitative 1-to-5 star rating and qualitative vehicle feedback collection.'
      ],
      inputs: [
        { name: 'Customer Identity', desc: 'Name, phone, email, city, preferred contact channel.' },
        { name: 'Vehicle & Branch', desc: 'Target vehicle ID, physical branch stockyard location.' },
        { name: 'Source Attribution', desc: 'Website Booking, Walk-in, or Referral.' },
        { name: 'Appointment Slot', desc: 'Requested test-drive calendar date and time window.' }
      ],
      processing: [
        { title: 'De-duplicated Profile Creation', desc: 'Matches existing customer records by phone number to preserve interaction history.' },
        { title: 'Direct Intent Qualification', desc: 'Sales executive contacts prospect directly; qualifies budget and timeline without intermediate artificial gates.' },
        { title: 'Single-Click Slot Reservation', desc: 'Verifies vehicle availability in the calendar and locks the appointment with assigned sales executive.' },
        { title: 'Immediate Feedback Capture', desc: 'Logs suspension, engine response, and cabin comfort feedback directly into test_drives table.' }
      ],
      outputs: [
        { name: 'leads record', desc: "Status: 'In-Progress' | 'Qualified' | 'Lost' with diagnostic remarks." },
        { name: 'test_drives record', desc: "Status: 'Scheduled' | 'Completed' with 1-5 star rating and notes." }
      ],
      stateTransitions: [
        { entity: 'leads', from: 'NULL', to: 'New → In-Progress', trigger: 'Customer booking inquiry submitted' },
        { entity: 'leads', from: 'In-Progress', to: 'Qualified / Hot Lead', trigger: 'Executive qualifies intent & budget' },
        { entity: 'test_drives', from: 'NULL', to: 'Scheduled → Completed', trigger: 'Road test executed & rating logged' }
      ],
      safeguards: [
        'An inquiry is never an automatic test-drive to prevent fleet paralysis by exploratory window-shoppers.',
        'Calendar algorithm enforces conflict detection: demo vehicle cannot be booked for overlapping slots.',
        'Disqualified leads require structured diagnostic lost remarks for conversion analytics.'
      ]
    },
    {
      id: 2,
      name: 'Stage 2: Deal Structuring & Financial Settlement',
      shortName: 'Contract & Payments',
      tagline: 'Sales contract, token advance, down payment & bank loan reconciliation',
      icon: CreditCard,
      color: 'text-amber-400',
      gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
      badge: 'Contract & Dual-Payment Engine',
      operationalLink: '/admin/sales',
      linkText: 'Open Sales & Payment Hub',
      purpose: 'Formulate a legally binding sales purchase agreement, atomically lock vehicle inventory as Reserved, and reconcile 100% financial clearance via Cash or Bank Loan financing.',
      checklist: [
        'Sales contract creation with algorithmic pricing: Final = Selling Price - Discount + Tax.',
        'Atomic vehicle reservation locking (status: Reserved) preventing inter-branch double-booking.',
        'Separate Token Advance collection and tracking (never confused with total payment).',
        'Cash settlement: remaining balance calculation and receipt recording.',
        'Bank loan processing: token advance credited toward down payment + 2% dealer commission.',
        'Cancellation safeguard: clean rollback to Available status with zero relational corruption.'
      ],
      inputs: [
        { name: 'Deal Parameters', desc: 'Agreed Selling Price, Commercial Discount, Statutory Road Tax.' },
        { name: 'Token Advance', desc: 'Upfront booking deposit paid by customer to reserve chassis.' },
        { name: 'Financing Choice', desc: 'Full Cash Clearance OR Down Payment + Financed Bank Loan.' },
        { name: 'Payment Proof', desc: 'Bank reference UTR, UPI ID, or credit sanction letter.' }
      ],
      processing: [
        { title: 'Atomic Inventory Lock', desc: "Database transaction ($transaction) sets vehicle status to 'Reserved'." },
        { title: 'Separate Token Tracking', desc: 'Token advance is stored as an identifiable payment; never overwrites contract amount or total paid.' },
        { title: 'Down Payment Reconciliation', desc: 'Token advance is credited directly toward required down payment (Remaining = Required - Token).' },
        { title: 'Bank Loan Disbursal & 2% Payout', desc: 'Verifies loan funds received and automatically logs 2% dealership partner commission.' }
      ],
      outputs: [
        { name: 'sales contract', desc: "Binding agreement with final_amount, deposit_amount, and payment_status: 'Paid'." },
        { name: 'payments ledger', desc: 'Verified entries with explicit types: TOKEN_ADVANCE, DOWN_PAYMENT, BANK_DISBURSAL.' },
        { name: 'vehicles record', desc: "Inventory status atomically locked as 'Reserved'." }
      ],
      stateTransitions: [
        { entity: 'vehicles', from: 'Available', to: 'Reserved', trigger: 'Sales contract drafted & token advance received' },
        { entity: 'sales', from: 'Pending', to: 'Token Received → Loan Pending → Paid', trigger: 'Down payment & bank disbursal verified' },
        { entity: 'leads', from: 'Qualified', to: 'Converted & Booked', trigger: 'Contract formulated' }
      ],
      safeguards: [
        'Token advance is never treated as total payment; outstanding balance tracks true receivables.',
        'Bank loan approval alone is not counted as received funds until verified disbursal is recorded.',
        'Rejection of loan enables Cancel Deal action, reverting vehicle cleanly to Available.'
      ]
    },
    {
      id: 3,
      name: 'Stage 3: Inspection, Gate-Pass & Vehicle Handover',
      shortName: 'Fulfillment & Delivery',
      tagline: 'Pre-delivery inspection, digital gate-pass & customer handover sign-off',
      icon: Truck,
      color: 'text-emerald-400',
      gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      badge: 'Security & Title Transfer',
      operationalLink: '/admin/deliveries',
      linkText: 'Open Delivery Operations',
      purpose: 'Enforce strict 100% financial clearance verification, verify mechanical safety via Pre-Delivery Inspection (PDI), issue digital gate-pass, log departure odometer, and transfer vehicle title to Sold.',
      checklist: [
        'Pre-Delivery Inspection (PDI) mechanical and detailing sign-off.',
        'Strict financial barrier check: delivery blocked until outstanding balance is zero.',
        'Digital gate-pass generation with departure security verification.',
        'Physical odometer reading logged to prevent showroom joyriding.',
        'Customer physical acknowledgment sign-off (customer_received: true).',
        'Vehicle status atomically updated to Sold only upon verified physical handover.'
      ],
      inputs: [
        { name: 'Sale Verification', desc: "Validated sale_id with confirmed payment_status === 'Paid'." },
        { name: 'PDI Checklist', desc: '150-point audit: fluids, battery, tires, diagnostics, detailing.' },
        { name: 'Gate Odometer', desc: 'Actual odometer reading at showroom delivery bay.' },
        { name: 'Customer Release', desc: 'Customer physical handover acknowledgment signature.' }
      ],
      processing: [
        { title: 'Zero-Balance Delivery Barrier', desc: 'Backend delivery controller strictly rejects dispatch if outstanding balance > 0.' },
        { title: 'PDI Certification', desc: 'Showroom auditor inspects vehicle condition and issues pre-delivery clearance.' },
        { title: 'Gate-Pass Generation', desc: 'Creates digital release note with vehicle VIN, engine number, and delivery executive ID.' },
        { title: 'Title Transfer at Bay', desc: "Updates delivery_status to 'Delivered' and atomically flips vehicle status to 'Sold'." }
      ],
      outputs: [
        { name: 'deliveries record', desc: "Status: 'Delivered', odometer_reading, customer_received: true." },
        { name: 'vehicles record', desc: "Final ownership transition: status permanently marked 'Sold'." },
        { name: 'Digital Gate-Pass', desc: 'Showroom release document with security audit trail.' }
      ],
      stateTransitions: [
        { entity: 'deliveries', from: 'Pending', to: 'Scheduled → Delivered', trigger: 'Handover sign-off completed' },
        { entity: 'vehicles', from: 'Reserved', to: 'Sold', trigger: 'Physical vehicle handover at delivery bay' },
        { entity: 'sales', from: 'Paid', to: 'Delivered', trigger: 'Customer takes possession of keys' }
      ],
      safeguards: [
        'Vehicle status remains Reserved throughout preparation; changes to Sold only after physical release.',
        'Odometer sanity check ensures departure reading is greater than or equal to acquisition reading.',
        'Unpaid balance of even ₹1 prevents gate-pass dispatch.'
      ]
    },
    {
      id: 4,
      name: 'Stage 4: Customer Retention & Dealership Intelligence',
      shortName: 'Retention & BI Analytics',
      tagline: 'Customer review moderation, GAAP gross profit & algorithmic procurement buy scoring',
      icon: TrendingUp,
      color: 'text-purple-400',
      gradient: 'from-purple-500/20 via-pink-500/10 to-transparent',
      badge: 'Social Proof & Executive BI',
      operationalLink: '/admin/bi',
      linkText: 'Open Executive BI Console',
      purpose: 'Capture verified customer social proof for brand trust and automatically ingest finalized deal economics into executive business intelligence dashboards and 4-pillar procurement decision scoring.',
      checklist: [
        'Customer experiential review and 1-to-5 star rating submission.',
        'Showroom administrator review moderation before public concierge publishing.',
        'Real-time GAAP Gross Profit calculation: (Contract - Cost) + 2% Bank Loan Commission.',
        'Executive Difference Ledger ("Click to View Difference") and What-If Sensitivity Simulator.',
        'Live 4-Pillar Algorithmic Buy Decision Scoring (0-100) recommending trade-in price ceilings.'
      ],
      inputs: [
        { name: 'Customer Review', desc: '1 to 5 star rating and verified buyer comments.' },
        { name: 'Delivered Deals', desc: 'Finalized contract values, trade-in acquisition costs, loan amounts.' },
        { name: 'Market Baselines', desc: 'Indian automotive MSRP registry, variant tiers, depreciation curves.' }
      ],
      processing: [
        { title: 'Social Proof Moderation', desc: 'Authenticated customer reviews held in queue (is_published: false) until showroom admin approves.' },
        { title: 'Automated BI Ingestion', desc: 'BiService computes real-time gross margins, inventory turnover days, and branch comparisons.' },
        { title: 'Sensitivity Modeling', desc: 'Executive simulator calculates margin reduction impact and salesperson negotiation floors.' },
        { title: '4-Pillar Buy Scoring', desc: 'Calculates dynamic Buy Decision Score: Turnover (30%) + Margin (30%) + Demand (25%) + Risk (15%).' }
      ],
      outputs: [
        { name: 'Published Reviews', desc: 'Verified 5-star customer testimonials displayed on luxury catalog.' },
        { name: 'Executive P&L Analytics', desc: 'Multi-branch gross margins, turnover velocity, and lead conversion rates.' },
        { name: 'Procurement Tiers', desc: 'Actionable guidance: STRONG_BUY, BUY, CAUTION, DO_NOT_BUY with Buy Ceiling Prices.' }
      ],
      stateTransitions: [
        { entity: 'reviews', from: 'Pending (is_published: false)', to: 'Published (is_published: true)', trigger: 'Admin review moderation' },
        { entity: 'BI Analytics', from: 'Historical State', to: 'Live Recalculated Metric', trigger: 'Sale delivery event emitted' }
      ],
      safeguards: [
        'Profanity and spam filtering on public reviews before administrative moderation queue.',
        'Safe division calculations protect against division by zero on new vehicle lines with zero inquiries.',
        'Hybrid Redis cache with automatic in-memory fallback guarantees sub-10ms executive query responses.'
      ]
    }
  ];

  const activeStage = stages.find(s => s.id === activeStageId) || stages[1];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-4 sm:p-8 lg:p-12 space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Enterprise Operations Framework
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Simplified 4-Stage Architecture
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground font-display tracking-tight">
            CarRevive Dealership Operational Workflow
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Streamlined from 7 fragmented micro-steps into 4 cohesive, modular stages with atomic inventory reservation, segregated token advance accounting, dual-payment settlement, and real-time business intelligence.
          </p>
        </div>

        <button
          onClick={() => router.push('/admin')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-bold text-xs transition-all shadow-sm w-fit"
        >
          <ArrowLeft size={14} /> Back to Command Console
        </button>
      </div>

      {/* 6-STEP ROLE & OPERATIONAL LIFECYCLE MATRIX */}
      <div className="rounded-3xl bg-gradient-to-br from-card via-card/80 to-secondary/30 border border-border p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/20">
                Operating Model
              </span>
              <span className="text-xs text-muted-foreground font-semibold">
                Role Boundaries &amp; Execution Responsibilities
              </span>
            </div>
            <h2 className="text-lg font-black text-foreground font-display mt-0.5">
              The 6-Step Showroom Operational Flow
            </h2>
          </div>
          <span className="text-xs text-muted-foreground italic">
            Strict separation between Financial Settlement &amp; Sales Operations
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-1.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-black text-blue-400 uppercase tracking-wider">Step 01 &bull; Intake</span>
              <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-blue-500/10 text-blue-400 border border-blue-500/20">System / Web</span>
            </div>
            <h4 className="font-extrabold text-foreground text-sm font-display">New Lead Created</h4>
            <p className="text-muted-foreground leading-relaxed">
              Customer inquiry is registered online or via walk-in and marked as <strong className="text-white">"New"</strong> in the unassigned triage queue.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-1.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-black text-purple-400 uppercase tracking-wider">Step 02 &bull; Delegation</span>
              <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-purple-500/10 text-purple-400 border border-purple-500/20">Branch Manager</span>
            </div>
            <h4 className="font-extrabold text-foreground text-sm font-display">Assign Lead to Executive</h4>
            <p className="text-muted-foreground leading-relaxed">
              Branch Manager reviews showroom capacity and assigns the lead to a Sales Executive (status updates to <strong className="text-white">"Assigned"</strong>).
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-1.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-black text-sky-400 uppercase tracking-wider">Step 03 &bull; Engagement</span>
              <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-sky-500/10 text-sky-400 border border-sky-500/20">Sales Executive</span>
            </div>
            <h4 className="font-extrabold text-foreground text-sm font-display">Follow-Up Note &amp; Test Drive</h4>
            <p className="text-muted-foreground leading-relaxed">
              Sales Executive records follow-up notes, calls customer, and conducts the test drive. <em className="text-slate-400">(Hidden from Branch Manager &amp; Admin sidebar)</em>.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-1.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-wider">Step 04 &bull; Finance</span>
              <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20">Branch Manager</span>
            </div>
            <h4 className="font-extrabold text-foreground text-sm font-display">Token Advance &amp; Payment</h4>
            <p className="text-muted-foreground leading-relaxed">
              Drive completed &rarr; deal moves to Branch Manager to collect token advance, reserve car, and process full cash or bank loans. <em className="text-slate-400">(Hidden from Executive)</em>.
            </p>
          </div>

          {/* Step 5 */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-1.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-wider">Step 05 &bull; Handover</span>
              <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Manager &rarr; Exec</span>
            </div>
            <h4 className="font-extrabold text-foreground text-sm font-display">Delivery Based on Customer Dates</h4>
            <p className="text-muted-foreground leading-relaxed">
              Payment cleared &rarr; Manager assigns delivery entry to Sales Executive with customer date. Executive conducts PDI, logs odometer, and hands over keys (<strong className="text-white">"Sold"</strong>).
            </p>
          </div>

          {/* Step 6 */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-1.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-black text-rose-400 uppercase tracking-wider">Step 06 &bull; Social Proof</span>
              <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/20">Manager &amp; Admin</span>
            </div>
            <h4 className="font-extrabold text-foreground text-sm font-display">Approve &amp; Publish Reviews</h4>
            <p className="text-muted-foreground leading-relaxed">
              Customer submits rating and feedback. Branch Manager and Admin moderate testimonials to publish live onto the website catalog.
            </p>
          </div>
        </div>
      </div>

      {/* 4-STAGE INTERACTIVE STEPPER BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const isActive = stage.id === activeStageId;
          return (
            <button
              key={stage.id}
              onClick={() => setActiveStageId(stage.id)}
              className={`text-left p-5 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                isActive
                  ? 'bg-card border-purple-500/50 shadow-xl shadow-purple-500/5 ring-2 ring-purple-500/20'
                  : 'bg-card/50 border-border hover:border-border/80 hover:bg-card/80 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-2xl bg-secondary border border-border ${stage.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-lg border ${
                    isActive ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-secondary text-muted-foreground border-border'
                  }`}>
                    STAGE 0{stage.id}
                  </span>
                </div>
                <div>
                  <h3 className="font-extrabold text-foreground text-sm font-display">
                    {stage.shortName}
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                    {stage.tagline}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px]">
                <span className="font-bold text-muted-foreground">{stage.badge}</span>
                <ChevronRight size={14} className={isActive ? stage.color : 'text-muted-foreground'} />
              </div>

              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* ACTIVE STAGE DEEP DIVE CARD */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">
        
        {/* STAGE HEADER BANNER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-secondary/30 border border-border">
          <div className="flex items-start sm:items-center gap-4">
            <div className={`p-4 rounded-2xl bg-secondary border border-border ${activeStage.color}`}>
              {React.createElement(activeStage.icon, { className: 'w-8 h-8' })}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-extrabold text-purple-400">STAGE {activeStage.id}</span>
                <span className="text-muted-foreground">&bull;</span>
                <span className="text-xs font-bold text-muted-foreground uppercase">{activeStage.badge}</span>
              </div>
              <h2 className="text-2xl font-black text-foreground font-display mt-0.5">
                {activeStage.name}
              </h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                {activeStage.purpose}
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push(activeStage.operationalLink)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg transition-all shrink-0 w-fit cursor-pointer"
          >
            <span>{activeStage.linkText}</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* 2-COLUMN OPERATIONAL BREAKDOWN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* COLUMN 1: REQUIREMENTS & CORE PROCESSING */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-secondary/20 border border-border space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground font-display flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-400" />
                Operational Requirements &amp; Checklist
              </h4>
              <ul className="space-y-2.5 text-xs">
                {activeStage.checklist.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-muted-foreground leading-relaxed">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span className="text-foreground font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-secondary/20 border border-border space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground font-display flex items-center gap-2">
                <Sparkles size={15} className="text-purple-400" />
                Internal Processing &amp; Business Logic
              </h4>
              <div className="space-y-3">
                {activeStage.processing.map((proc, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-card border border-border/60">
                    <strong className="text-foreground text-xs block">{proc.title}</strong>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">{proc.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 2: INPUTS, OUTPUTS & STATE TRANSITIONS */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-secondary/20 border border-border space-y-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                  Stage Inputs
                </span>
                <div className="space-y-2 text-xs">
                  {activeStage.inputs.map((inp, idx) => (
                    <div key={idx} className="border-b border-border/40 pb-1.5 last:border-0 last:pb-0">
                      <strong className="text-foreground block text-[11px]">{inp.name}</strong>
                      <span className="text-[10px] text-muted-foreground">{inp.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-secondary/20 border border-border space-y-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                  Stage Outputs
                </span>
                <div className="space-y-2 text-xs">
                  {activeStage.outputs.map((out, idx) => (
                    <div key={idx} className="border-b border-border/40 pb-1.5 last:border-0 last:pb-0">
                      <strong className="text-emerald-400 block text-[11px]">{out.name}</strong>
                      <span className="text-[10px] text-muted-foreground">{out.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RELATIONAL DATABASE STATE TRANSITIONS */}
            <div className="p-5 rounded-2xl bg-secondary/20 border border-border space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground font-display flex items-center gap-2">
                <FileText size={14} className="text-sky-400" />
                Relational Database State Transitions
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="pb-2">Table</th>
                      <th className="pb-2">Previous State</th>
                      <th className="pb-2">New State</th>
                      <th className="pb-2">Trigger Event</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-mono">
                    {activeStage.stateTransitions.map((tr, idx) => (
                      <tr key={idx} className="text-foreground">
                        <td className="py-2 font-bold text-purple-400">{tr.entity}</td>
                        <td className="py-2 text-muted-foreground">{tr.from}</td>
                        <td className="py-2 text-emerald-400 font-bold">{tr.to}</td>
                        <td className="py-2 text-[10px] text-muted-foreground font-sans">{tr.trigger}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SAFEGUARDS & ERROR HANDLING */}
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <AlertCircle size={13} /> Stage Safeguards &amp; Concurrency Handlers
              </span>
              <ul className="text-[11px] text-muted-foreground space-y-1.5 pl-4 list-disc">
                {activeStage.safeguards.map((sg, idx) => (
                  <li key={idx}>{sg}</li>
                ))}
              </ul>
            </div>

          </div>

        </div>

      </div>

      {/* INTERACTIVE PAYMENT & FINANCIAL SETTLEMENT SIMULATOR */}
      <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-foreground font-display">
                Interactive Dual-Payment Calculation Engine
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Demonstrating segregated Token Advance, Required Down Payment, Bank Disbursal, and Zero Double-Counting.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1 bg-secondary rounded-xl border border-border">
            <button
              onClick={() => setSimMode('LOAN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                simMode === 'LOAN'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Bank Loan Financing (75% Deals)
            </button>
            <button
              onClick={() => setSimMode('CASH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                simMode === 'CASH'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Full Cash Purchase
            </button>
          </div>
        </div>

        {/* SIMULATOR CONTROLS & LIVE KPIS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* SLIDERS / INPUT CONTROLS */}
          <div className="p-5 rounded-2xl bg-secondary/30 border border-border space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-bold mb-1">
                <span className="text-muted-foreground">Vehicle Final Contract Amount</span>
                <span className="text-foreground font-mono">{formatINR(simPrice)}</span>
              </div>
              <input
                type="range"
                min={300000}
                max={5000000}
                step={50000}
                value={simPrice}
                onChange={(e) => setSimPrice(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>

            <div>
              <div className="flex justify-between font-bold mb-1">
                <span className="text-muted-foreground">Token Advance Received Upfront</span>
                <span className="text-emerald-400 font-mono">{formatINR(simToken)}</span>
              </div>
              <input
                type="range"
                min={10000}
                max={simPrice * 0.4}
                step={10000}
                value={simToken}
                onChange={(e) => setSimToken(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <span className="text-[10px] text-muted-foreground">
                Stored separately as Token Advance. Never treated as full purchase price.
              </span>
            </div>

            {simMode === 'LOAN' && (
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-muted-foreground">Total Required Down Payment</span>
                  <span className="text-amber-400 font-mono">{formatINR(simDownPayment)}</span>
                </div>
                <input
                  type="range"
                  min={simToken}
                  max={simPrice * 0.6}
                  step={20000}
                  value={simDownPayment}
                  onChange={(e) => setSimDownPayment(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <span className="text-[10px] text-muted-foreground">
                  Token advance is credited directly toward this amount.
                </span>
              </div>
            )}
          </div>

          {/* FINANCIAL BREAKDOWN CARDS */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
            
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Final Contract Amount
              </span>
              <span className="text-lg font-mono font-black text-foreground block mt-1">
                {formatINR(simPrice)}
              </span>
              <span className="text-[9px] text-muted-foreground">Agreed Selling Price</span>
            </div>

            <div className="p-4 rounded-2xl bg-secondary/40 border border-border">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Token Advance Received
              </span>
              <span className="text-lg font-mono font-black text-emerald-400 block mt-1">
                {formatINR(simToken)}
              </span>
              <span className="text-[9px] text-emerald-500/80">Stored separately in ledger</span>
            </div>

            {simMode === 'LOAN' ? (
              <>
                <div className="p-4 rounded-2xl bg-secondary/40 border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Required Down Payment
                  </span>
                  <span className="text-lg font-mono font-black text-amber-400 block mt-1">
                    {formatINR(simDownPayment)}
                  </span>
                  <span className="text-[9px] text-muted-foreground">Total upfront required</span>
                </div>

                <div className="p-4 rounded-2xl bg-secondary/40 border border-amber-500/30 bg-amber-500/5">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block">
                    Remaining Down Payment
                  </span>
                  <span className="text-lg font-mono font-black text-amber-300 block mt-1">
                    {formatINR(simRemainingDownpayment)}
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    Required ({formatINR(simDownPayment)}) - Token ({formatINR(simToken)})
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-secondary/40 border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Financed Loan Amount
                  </span>
                  <span className="text-lg font-mono font-black text-sky-400 block mt-1">
                    {formatINR(simLoanAmount)}
                  </span>
                  <span className="text-[9px] text-sky-500/80">Awaiting Bank Disbursal</span>
                </div>

                <div className="p-4 rounded-2xl bg-secondary/40 border border-emerald-500/30 bg-emerald-500/5">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                    2% Partner Commission
                  </span>
                  <span className="text-lg font-mono font-black text-emerald-300 block mt-1">
                    +{formatINR(simBankCommission)}
                  </span>
                  <span className="text-[9px] text-emerald-500/80">Bonus dealer income</span>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-secondary/40 border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Total Amount Paid
                  </span>
                  <span className="text-lg font-mono font-black text-emerald-400 block mt-1">
                    {formatINR(simToken)}
                  </span>
                  <span className="text-[9px] text-muted-foreground">Current verified receipts</span>
                </div>

                <div className="p-4 rounded-2xl bg-secondary/40 border border-rose-500/30 bg-rose-500/5 col-span-2">
                  <span className="text-[10px] uppercase font-bold text-rose-400 block">
                    Remaining Cash Balance Due
                  </span>
                  <span className="text-xl font-mono font-black text-rose-300 block mt-1">
                    {formatINR(simRemainingCash)}
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    Contract ({formatINR(simPrice)}) - Token ({formatINR(simToken)}). Collect prior to vehicle release.
                  </span>
                </div>
              </>
            )}

          </div>

        </div>

        {/* AUDIT NOTE ON PAYMENT RULES */}
        <div className="p-4 rounded-2xl bg-secondary/30 border border-border text-xs flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-foreground">Audited Accounting Safeguards Enforced:</strong>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              1. <strong>No Double Counting:</strong> The token advance of {formatINR(simToken)} is already included within the {formatINR(simDownPayment)} down payment; it is subtracted from it, leaving {formatINR(simRemainingDownpayment)} remaining due.
              <br />
              2. <strong>Delivery Barrier:</strong> Physical vehicle handover is forbidden until the outstanding balance reaches zero and all bank disbursements are confirmed.
            </p>
          </div>
        </div>

      </div>

      {/* BEFORE VS. AFTER COMPARATIVE ARCHITECTURAL TABLE */}
      <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xl space-y-4">
        <h3 className="text-lg font-extrabold text-foreground font-display">
          Comparative Analysis: 7-Stage Legacy vs. Simplified 4-Stage Architecture
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-3 px-4">Architectural Dimension</th>
                <th className="py-3 px-4">Legacy Workflow (7 Stages)</th>
                <th className="py-3 px-4">Simplified Architecture (4 Stages)</th>
                <th className="py-3 px-4">Engineering Benefit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <tr>
                <td className="py-3 px-4 font-bold text-foreground">Pipeline Stages</td>
                <td className="py-3 px-4 text-rose-400">7 fragmented, micro-gated steps</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">4 unified, domain-aligned stages</td>
                <td className="py-3 px-4 text-muted-foreground">43% reduction in pipeline friction</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-foreground">Token Advance Handling</td>
                <td className="py-3 px-4 text-rose-400">Overwrote contract price or down payment</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">Stored separately in payment ledger</td>
                <td className="py-3 px-4 text-muted-foreground">Zero double counting; true receivables audit</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-foreground">Loan Approval State</td>
                <td className="py-3 px-4 text-rose-400">Parsed from free-form text remarks</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">Explicit ledger disbursal payment type</td>
                <td className="py-3 px-4 text-muted-foreground">100% type-safe; zero runtime string bugs</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-foreground">Vehicle Title Transfer</td>
                <td className="py-3 px-4 text-rose-400">Flipped to Sold prematurely at schedule</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">Flipped to Sold only on customer handover</td>
                <td className="py-3 px-4 text-muted-foreground">Prevents accounting discrepancies on rejected PDI</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-foreground">BI Ingestion</td>
                <td className="py-3 px-4 text-rose-400">Mixed as manual operational step (Stage 7)</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">Automated, event-driven reactive aggregation</td>
                <td className="py-3 px-4 text-muted-foreground">Clean separation of transaction vs analytics</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
