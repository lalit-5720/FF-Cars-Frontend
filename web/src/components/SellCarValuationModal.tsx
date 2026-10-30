'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { showLocalToast } from './Toast';
import { firstError, regNo, email as checkEmail, phone as checkPhone, money, intRange, maxLen } from '../lib/validation';
import {
  X,
  CarFront,
  Phone,
  User,
  Mail,
  Building2,
  Calendar,
  Gauge,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Tag
} from 'lucide-react';

interface SellCarValuationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReg?: string;
  branches: any[];
}

export const SellCarValuationModal: React.FC<SellCarValuationModalProps> = ({
  isOpen,
  onClose,
  initialReg = '',
  branches = [],
}) => {
  const { user, isAuthenticated } = useAuthStore();

  const [regNumber, setRegNumber] = useState(initialReg);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('2021');
  const [kmDriven, setKmDriven] = useState('35000');
  const [fuelType, setFuelType] = useState('Petrol');
  const [transmission, setTransmission] = useState('Manual');
  const [condition, setCondition] = useState('Good');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [branchId, setBranchId] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedQuotation, setSubmittedQuotation] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialReg) setRegNumber(initialReg.trim().toUpperCase());
      if (isAuthenticated && user) {
        setCustomerName(user.name || '');
        setEmail(user.email || '');
      }
      if (branches.length > 0 && !branchId) {
        setBranchId(String(branches[0].branch_id || branches[0].id));
      }
    } else {
      setSubmittedQuotation(null);
    }
  }, [isOpen, initialReg, isAuthenticated, user, branches]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanReg = regNumber.trim().toUpperCase();
    if (!cleanReg) {
      showLocalToast('Please enter your vehicle registration number.', 'error');
      return;
    }
    const sellErr = firstError(
      regNo(cleanReg),
      maxLen(customerName.trim(), 100, 'Name'),
      checkPhone(phone, 'Mobile number', true),
      checkEmail(email),
      intRange(year, 'Manufacture year', 1980, new Date().getFullYear() + 1),
      intRange(kmDriven, 'Kilometres driven', 0, 2_000_000),
      money(expectedPrice, 'Expected price', { mandatory: false }),
      maxLen(make, 50, 'Make'),
      maxLen(model, 50, 'Model'),
      maxLen(notes, 2000, 'Notes'),
    );
    if (sellErr) {
      showLocalToast(sellErr, 'error');
      return;
    }

    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      showLocalToast('Please enter a valid 10-digit mobile number for lead contact.', 'error');
      return;
    }

    if (!customerName.trim()) {
      showLocalToast('Please enter your full name.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        registration_number: cleanReg,
        customer_name: customerName.trim(),
        phone: cleanPhone,
        email: email.trim() || undefined,
        make: make.trim() || undefined,
        model: model.trim() || undefined,
        manufacture_year: year ? parseInt(year, 10) : undefined,
        kilometers_driven: kmDriven ? parseInt(kmDriven, 10) : undefined,
        fuel_type: fuelType,
        transmission,
        condition,
        expected_price: expectedPrice ? parseFloat(expectedPrice) : undefined,
        branch_id: branchId ? parseInt(branchId, 10) : undefined,
        notes: notes.trim() || undefined,
        customer_id: isAuthenticated && user?.id ? user.id : undefined,
      };

      const res = await api.post('/quotations', payload);
      setSubmittedQuotation(res.data);
      showLocalToast('Vehicle valuation enquiry submitted successfully!', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit valuation request. Please try again.';
      showLocalToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedBranchObj = branches.find(
    (b) => String(b.branch_id || b.id) === String(branchId)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl rounded-lg bg-bg-surface border border-border p-6 shadow-lg text-text-primary my-8">

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent text-accent-text flex items-center justify-center">
              <CarFront className="w-4 h-4" />
            </div>
            <div>
              <h2 className="section-heading text-base font-bold text-text-primary">
                Instant Valuation &amp; Sell Enquiry
              </h2>
              <p className="helper-text mt-0.5">
                Get fair market price estimate and schedule free doorstep physical evaluation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-surface-alt transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {submittedQuotation ? (
          <div className="space-y-5 text-center py-4">
            <div className="w-14 h-14 rounded-full bg-status-success-bg text-status-success border border-status-success mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="badge badge-success mb-2 text-xs">
                Enquiry Registered &bull; Reference #QUOT-{submittedQuotation.quotation_id}
              </span>
              <h3 className="section-heading text-lg font-bold text-text-primary">
                Estimated Fair Market Valuation
              </h3>
              <div className="text-2xl font-bold text-accent mt-2">
                ₹{Number(submittedQuotation.estimated_valuation || 650000).toLocaleString('en-IN')}
                <span className="helper-text font-normal text-xs block mt-1">
                  *Subject to 150-Point master technical inspection
                </span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-bg-surface-alt border border-border text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="helper-text">Vehicle Reg:</span>
                <span className="font-bold font-mono text-text-primary">{submittedQuotation.registration_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="helper-text">Customer Name:</span>
                <span className="font-bold text-text-primary">{submittedQuotation.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="helper-text">Contact Phone:</span>
                <span className="font-bold text-text-primary">{submittedQuotation.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="helper-text">Assigned Dealership:</span>
                <span className="font-bold text-accent">
                  {submittedQuotation.branches?.branch_name || selectedBranchObj?.branch_name || 'CarRevive Hub'}
                </span>
              </div>
            </div>

            <p className="body-text text-text-secondary text-xs leading-relaxed">
              Our Branch Manager at <strong>{submittedQuotation.branches?.branch_name || selectedBranchObj?.branch_name || 'CarRevive Showroom'}</strong> has received your sale enquiry and will assign a dedicated Sales Executive to contact you at <strong>{submittedQuotation.phone}</strong> for doorstep inspection and same-day payment.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="btn-primary w-full h-9 text-xs font-bold"
            >
              Done &bull; Close Window
            </button>
          </div>
        ) : (
          /* Input Form */
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">

            {/* Registration Number & Showroom Branch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="helper-text font-bold block mb-1">
                  Registration Number *
                </label>
                <div className="relative">
                  <CarFront className="w-3.5 h-3.5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. TN02BV0258"
                    value={regNumber} maxLength={20}
                    onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                    className="w-full pl-9 pr-3 h-9 rounded-lg border border-border bg-bg-surface text-text-primary uppercase font-bold focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="helper-text font-bold block mb-1">
                  Select Preferred Showroom *
                </label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full pl-9 pr-3 h-9 rounded-lg border border-border bg-bg-surface text-text-primary focus:border-accent focus:outline-none cursor-pointer"
                  >
                    {branches.map((b) => (
                      <option key={b.branch_id || b.id} value={b.branch_id || b.id}>
                        {b.branch_name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Customer Name & Phone Number (Required for Lead) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="helper-text font-bold block mb-1">
                  Your Full Name *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arun Kumar"
                    value={customerName} maxLength={100}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-9 pr-3 h-9 rounded-lg border border-border bg-bg-surface text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="helper-text font-bold block mb-1">
                  Phone Number (For Lead Contact) *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-accent absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={phone} maxLength={15} inputMode="tel"
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full pl-9 pr-3 h-9 rounded-lg border border-accent bg-bg-surface text-text-primary font-bold focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Email & Expected Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="helper-text block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email} maxLength={100}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 h-9 rounded-lg border border-border bg-bg-surface text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="helper-text block mb-1">Expected Selling Price (₹)</label>
                <div className="relative">
                  <Tag className="w-3.5 h-3.5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    placeholder="e.g. 750000"
                    value={expectedPrice} min={0} max={1000000000}
                    onChange={(e) => setExpectedPrice(e.target.value)}
                    className="w-full pl-9 pr-3 h-9 rounded-lg border border-border bg-bg-surface text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Optional Vehicle Details: Make, Model, Year, KM */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div>
                <label className="helper-text block mb-1">Make / Brand</label>
                <input
                  type="text"
                  placeholder="e.g. Hyundai"
                  value={make} maxLength={50}
                  onChange={(e) => setMake(e.target.value)}
                  className="w-full px-2.5 h-9 rounded-lg border border-border bg-bg-surface text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="helper-text block mb-1">Model / Trim</label>
                <input
                  type="text"
                  placeholder="e.g. Creta SX"
                  value={model} maxLength={50}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-2.5 h-9 rounded-lg border border-border bg-bg-surface text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="helper-text block mb-1">Mfg Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-2 h-9 rounded-lg border border-border bg-bg-surface text-text-primary focus:border-accent focus:outline-none cursor-pointer"
                >
                  {[2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="helper-text block mb-1">Odometer (KM)</label>
                <input
                  type="number"
                  placeholder="35000"
                  value={kmDriven} min={0} max={2000000}
                  onChange={(e) => setKmDriven(e.target.value)}
                  className="w-full px-2.5 h-9 rounded-lg border border-border bg-bg-surface text-text-primary focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            {/* Fuel & Condition */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="helper-text block mb-1">Fuel Type</label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full px-2.5 h-9 rounded-lg border border-border bg-bg-surface text-text-primary focus:border-accent focus:outline-none cursor-pointer"
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="helper-text block mb-1">Transmission</label>
                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                  className="w-full px-2.5 h-9 rounded-lg border border-border bg-bg-surface text-text-primary focus:border-accent focus:outline-none cursor-pointer"
                >
                  <option value="Manual">Manual</option>
                  <option value="Automatic">Automatic</option>
                </select>
              </div>

              <div>
                <label className="helper-text block mb-1">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-2.5 h-9 rounded-lg border border-border bg-bg-surface text-text-primary focus:border-accent focus:outline-none cursor-pointer"
                >
                  <option value="Excellent">Excellent (Like New)</option>
                  <option value="Good">Good (Clean &amp; Maintained)</option>
                  <option value="Fair">Fair (Minor Scratches)</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="helper-text block mb-1">Additional Vehicle Notes / Service History</label>
              <textarea
                rows={2}
                placeholder="e.g. Single owner, complete company service records, insurance valid till Dec 2026..."
                value={notes} maxLength={2000}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-border bg-bg-surface text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="btn-neutral h-9 px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary h-9 px-5 flex items-center gap-1.5"
              >
                <span>{isSubmitting ? 'Calculating Quote...' : 'Submit Sell Enquiry & Get Quote'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
