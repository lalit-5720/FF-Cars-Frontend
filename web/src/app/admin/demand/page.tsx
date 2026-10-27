'use client';

import React, { useState, useEffect } from 'react';
import { RequireRole } from '../../../components/auth/RequireRole';
import { api } from '../../../services/api';
import { Gauge, ShoppingBag, TrendingUp, AlertTriangle, CarFront, CheckCircle2, RefreshCw, ArrowRight } from 'lucide-react';
import { showLocalToast } from '../../../components/Toast';
import { CustomerDemandIntelligenceReport } from '../../../components/admin/bi/CustomerDemandIntelligenceReport';

interface DemandItem {
  make: string;
  model: string;
  vehicleName: string;
  leadsCount: number;
  testDrivesCount: number;
  salesCount: number;
  availableStock: number;
  demandScore: number;
  status: 'HIGH_DEMAND_BUY' | 'MODERATE_BUY' | 'HOLD_OVERSTOCKED' | 'BALANCED';
  buySuggestion: string;
}

export default function AdminDemandPage() {
  const [loading, setLoading] = useState(true);
  const [demandList, setDemandList] = useState<DemandItem[]>([]);

  const fetchDemand = async () => {
    setLoading(true);
    try {
      let res;
      try {
        res = await api.get('/analytics/vehicle-demand');
      } catch {
        res = await api.get('/bi/vehicle-demand');
      }
      if (res.data) setDemandList(res.data);
    } catch (err) {
      console.error('Failed to load vehicle demand:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemand();
  }, []);

  return (
    <RequireRole allow={['SYSTEM_ADMIN', 'BRANCH_MANAGER']}>
      <div className="space-y-6 pb-10">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-surface border border-border p-6 rounded-[8px]">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge-info">
                Live Database Intelligence
              </span>
              <span className="text-[12px] text-text-secondary">Customer Inquiries & Test Drive Signals</span>
            </div>
            <h1 className="text-[24px] font-bold text-text-primary mt-2 flex items-center gap-2.5">
              <Gauge size={24} className="text-accent" />
              Vehicle Demand & Purchase Suggestions
            </h1>
            <p className="text-[12px] text-text-secondary mt-1">
              Real-time vehicle buy suggestions calculated from lead inquiries, test drives, and stock levels (e.g. Mahindra XUV300, Kia Seltos)
            </p>
          </div>

          <button
            onClick={fetchDemand}
            className="btn-neutral flex items-center gap-2"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Demand Scores</span>
          </button>
        </div>

        {/* Customer Preference & Procurement Evidence Report */}
        <CustomerDemandIntelligenceReport />

        {/* Top KPI Cards Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-[8px] bg-bg-surface border border-border p-4">
            <span className="text-[12px] font-bold uppercase text-text-secondary block">TOTAL MODELS ANALYZED</span>
            <strong className="text-[24px] font-bold text-text-primary block mt-1">{demandList.length} Models</strong>
          </div>
          <div className="rounded-[8px] bg-bg-surface border border-border p-4">
            <span className="text-[12px] font-bold uppercase text-accent block">HIGH BUY SIGNALS</span>
            <strong className="text-[24px] font-bold text-accent block mt-1">
              {demandList.filter((d) => d.status === 'HIGH_DEMAND_BUY').length} Models
            </strong>
          </div>
          <div className="rounded-[8px] bg-bg-surface border border-border p-4">
            <span className="text-[12px] font-bold uppercase text-status-success block">MODERATE BUY SIGNALS</span>
            <strong className="text-[24px] font-bold text-status-success block mt-1">
              {demandList.filter((d) => d.status === 'MODERATE_BUY').length} Models
            </strong>
          </div>
          <div className="rounded-[8px] bg-bg-surface border border-border p-4">
            <span className="text-[12px] font-bold uppercase text-status-warning block">ZERO STOCK DEFICIT</span>
            <strong className="text-[24px] font-bold text-status-warning block mt-1">
              {demandList.filter((d) => d.availableStock === 0).length} Models
            </strong>
          </div>
        </div>

        {/* Vehicle Demand & Buy Suggestion Cards */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-[8px] bg-bg-surface animate-pulse border border-border" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-[18px] font-bold text-text-primary flex items-center gap-2">
              <ShoppingBag size={18} className="text-accent" />
              <span>Calculated Vehicle Purchase Recommendations</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {demandList.map((item) => {
                const isHighBuy = item.status === 'HIGH_DEMAND_BUY';
                const isModerateBuy = item.status === 'MODERATE_BUY';
                const isOverstocked = item.status === 'HOLD_OVERSTOCKED';

                return (
                  <div
                    key={item.vehicleName}
                    className="rounded-[8px] bg-bg-surface border border-border p-4 flex flex-col justify-between space-y-4 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={
                            isHighBuy
                              ? 'badge-info'
                              : isModerateBuy
                              ? 'badge-success'
                              : isOverstocked
                              ? 'badge-danger'
                              : 'px-2.5 py-0.5 rounded-[999px] text-[12px] font-bold bg-bg-surface-alt text-text-secondary border border-border'
                          }
                        >
                          {isHighBuy ? 'HIGH PRIORITY BUY' : isModerateBuy ? 'BUY SUGGESTION' : isOverstocked ? 'HOLD STOCK' : 'BALANCED'}
                        </span>
                        <span className="text-[12px] font-bold text-text-secondary">
                          Score: <strong className="text-text-primary">{item.demandScore}</strong>
                        </span>
                      </div>

                      <h3 className="text-[18px] font-bold text-text-primary flex items-center gap-2">
                        <CarFront size={18} className="text-accent" />
                        {item.vehicleName}
                      </h3>

                      {/* Demand Signals Metrics */}
                      <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-border text-center text-[12px]">
                        <div className="bg-bg-surface-alt p-2 rounded-[8px] border border-border">
                          <span className="text-[12px] text-text-secondary block font-bold">LEADS</span>
                          <strong className="text-text-primary font-bold">{item.leadsCount}</strong>
                        </div>
                        <div className="bg-bg-surface-alt p-2 rounded-[8px] border border-border">
                          <span className="text-[12px] text-text-secondary block font-bold">TESTS</span>
                          <strong className="text-accent font-bold">{item.testDrivesCount}</strong>
                        </div>
                        <div className="bg-bg-surface-alt p-2 rounded-[8px] border border-border">
                          <span className="text-[12px] text-text-secondary block font-bold">SALES</span>
                          <strong className="text-status-success font-bold">{item.salesCount}</strong>
                        </div>
                        <div className="bg-bg-surface-alt p-2 rounded-[8px] border border-border">
                          <span className="text-[12px] text-text-secondary block font-bold">STOCK</span>
                          <strong className={item.availableStock === 0 ? 'text-status-danger font-bold' : 'text-status-warning font-bold'}>
                            {item.availableStock}
                          </strong>
                        </div>
                      </div>

                      <p className="text-[12px] text-text-secondary mt-3 leading-relaxed bg-bg-surface-alt p-3 rounded-[8px] border border-border">
                        {item.buySuggestion}
                      </p>
                    </div>

                    <button
                      onClick={() => showLocalToast(`Creating procurement request for ${item.vehicleName}`)}
                      className="btn-primary flex items-center justify-center gap-1.5 w-full"
                    >
                      <ShoppingBag size={14} />
                      <span>Procure {item.make} {item.model}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </RequireRole>
  );
}
