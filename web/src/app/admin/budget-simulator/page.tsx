'use client';

import { useState } from 'react';

export default function BudgetSimulatorPage() {
  const [principal, setPrincipal] = useState(1000000);
  const [rate, setRate] = useState(9.5);
  const [years, setYears] = useState(5);
  const months = years * 12;
  const monthlyRate = rate / 1200;
  const payment = monthlyRate ? principal * monthlyRate * (1 + monthlyRate) ** months / ((1 + monthlyRate) ** months - 1) : principal / months;
  return <div className="min-h-screen bg-background p-6 text-foreground lg:p-10"><div className="mx-auto max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Admin Tool</p><h1 className="mt-2 text-3xl font-bold">Budget Simulator</h1><p className="mt-2 text-sm text-muted-foreground">Estimate monthly vehicle financing affordability.</p><div className="mt-8 grid gap-6 rounded-2xl border border-border bg-card p-6 md:grid-cols-2"><div className="space-y-5"><label className="block text-sm font-semibold">Loan amount<input type="number" min="0" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} className="mt-2 w-full rounded-lg border border-input bg-secondary px-3 py-2" /></label><label className="block text-sm font-semibold">Annual interest rate (%)<input type="number" min="0" step="0.1" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="mt-2 w-full rounded-lg border border-input bg-secondary px-3 py-2" /></label><label className="block text-sm font-semibold">Tenure (years)<input type="number" min="1" max="10" value={years} onChange={(e) => setYears(Number(e.target.value))} className="mt-2 w-full rounded-lg border border-input bg-secondary px-3 py-2" /></label></div><div className="flex flex-col justify-center rounded-xl bg-secondary p-6"><p className="text-sm text-muted-foreground">Estimated monthly payment</p><p className="mt-3 text-4xl font-bold text-primary">₹{Math.round(payment).toLocaleString('en-IN')}</p><p className="mt-4 text-xs text-muted-foreground">{months} monthly installments at {rate}% annual interest.</p></div></div></div></div>;
}
