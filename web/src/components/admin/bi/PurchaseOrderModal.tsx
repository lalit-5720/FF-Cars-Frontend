'use client';

import React, { useState } from 'react';
import { X, ShoppingBag, CheckCircle2, Building2, Calendar, FileText, Send } from 'lucide-react';
import { api } from '../../../services/api';
import { showLocalToast } from '../../Toast';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    manufactureYear?: string;
    priceBand?: string;
    vehicleCategory?: string;
  };
  onSuccess?: () => void;
}

export function PurchaseOrderModal({ isOpen, onClose, initialData, onSuccess }: PurchaseOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.vehicleCategory ? `Procure ${initialData.manufactureYear} ${initialData.vehicleCategory}` : 'Procure 2022-2024 Executive Vehicles',
    manufacture_year_range: initialData?.manufactureYear || '2022 - 2024',
    price_band: initialData?.priceBand || '₹20L - ₹35L',
    vehicle_category: initialData?.vehicleCategory || 'SUV / Premium Sedan',
    quantity: 2,
    vendor_name: 'Mahindra First Choice / Auction Partner',
    target_branch_id: 1,
    estimated_budget: 6500000,
    notes: 'High customer test drive demand recorded in business intelligence hub.',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/analytics/purchase-orders', formData);
      showLocalToast('Procurement Purchase Order Created Successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to create purchase order:', err);
      showLocalToast('Error creating Purchase Order', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-sans">
      <div className="w-full max-w-xl rounded-2xl bg-[#0f172a] border border-sky-500/30 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <ShoppingBag size={20} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400 block">
                Automated Procurement System
              </span>
              <h2 className="text-lg font-extrabold text-white">Create Purchase Order</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">Order Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white font-semibold focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Manufacture Year Range</label>
              <select
                value={formData.manufacture_year_range}
                onChange={(e) => setFormData({ ...formData, manufacture_year_range: e.target.value })}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white font-semibold focus:border-sky-500 focus:outline-none"
              >
                <option value="2023 - 2024">2023 - 2024</option>
                <option value="2021 - 2022">2021 - 2022</option>
                <option value="2018 - 2020">2018 - 2020</option>
                <option value="Before 2018">Before 2018</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Target Budget Band</label>
              <select
                value={formData.price_band}
                onChange={(e) => setFormData({ ...formData, price_band: e.target.value })}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white font-semibold focus:border-sky-500 focus:outline-none"
              >
                <option value="< ₹10 Lakhs">&lt; ₹10 Lakhs</option>
                <option value="₹10L - ₹20L">₹10L - ₹20L</option>
                <option value="₹20L - ₹35L">₹20L - ₹35L</option>
                <option value="₹35L - ₹50L">₹35L - ₹50L</option>
                <option value="> ₹50 Lakhs">&gt; ₹50 Lakhs</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Vehicle Category</label>
              <input
                type="text"
                value={formData.vehicle_category}
                onChange={(e) => setFormData({ ...formData, vehicle_category: e.target.value })}
                required
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white font-semibold focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Quantity to Procure</label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                required
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white font-semibold focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Auction / Vendor Partner</label>
              <input
                type="text"
                value={formData.vendor_name}
                onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                required
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white font-semibold focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Estimated Total Budget (₹)</label>
              <input
                type="number"
                step="100000"
                value={formData.estimated_budget}
                onChange={(e) => setFormData({ ...formData, estimated_budget: Number(e.target.value) })}
                required
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white font-semibold focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Internal Procurement Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white font-medium focus:border-sky-500 focus:outline-none resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Send size={14} />
              <span>{loading ? 'Issuing Order...' : 'Issue Purchase Order'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
