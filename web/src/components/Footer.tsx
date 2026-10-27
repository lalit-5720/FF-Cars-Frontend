'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../services/api';

export const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await api.get('/branches');
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setBranches(list);
      } catch (_) {
        setBranches([]);
      }
    };
    fetchBranches();
  }, []);

  return (
    <footer className="bg-bg-surface border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">

          {/* Brand Column */}
          <div className="md:col-span-5">
            <div className="mb-4">
              <span className="font-bold text-lg text-text-primary tracking-wide">
                CarRevive
              </span>
              <span className="block helper-text mt-0.5">
                Certified Pre-Owned Automotive Dealership
              </span>
            </div>

            <p className="body-text max-w-xs mb-4">
              Your destination for certified, quality pre-owned vehicles with transparent fixed pricing and comprehensive warranty.
            </p>

            {/* Dynamic Showrooms from Database */}
            <div className="flex flex-col gap-2">
              {branches.map((b) => (
                <div key={b.branch_id || b.id}>
                  <p className="body-text font-bold text-xs">
                    {b.branch_name}
                  </p>
                  <p className="helper-text">
                    {b.address ? `${b.address}, ${b.city}` : b.city}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div className="md:col-span-3">
            <h3 className="section-heading text-xs uppercase tracking-wider text-text-secondary mb-4">
              Inventory
            </h3>
            <ul className="flex flex-col gap-2.5">
              {[
                { label: 'Browse All Vehicles', href: '/cars' },
                { label: 'Electric Cars', href: '/cars?fuelType=Electric' },
                { label: 'Diesel Cars', href: '/cars?fuelType=Diesel' },
                { label: 'Petrol Cars', href: '/cars?fuelType=Petrol' },
                { label: 'Automatic Fleet', href: '/cars?transmission=Automatic' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="body-text text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Our Promise */}
          <div className="md:col-span-4">
            <h3 className="section-heading text-xs uppercase tracking-wider text-text-secondary mb-4">
              Our Promise
            </h3>
            <ul className="flex flex-col gap-3">
              {[
                { point: '150-Point Roadworthiness Audit', sub: 'Every vehicle rigorously certified' },
                { point: '7-Day / 500 km Money-Back Guarantee', sub: 'Complete purchase confidence' },
                { point: 'Transparent Fixed Pricing', sub: 'No hidden charges, ever' },
                { point: 'Pan-India 1-Year Warranty', sub: 'Engine and gearbox protection' },
              ].map(({ point, sub }) => (
                <li key={point} className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                  <div>
                    <p className="body-text font-bold text-xs">
                      {point}
                    </p>
                    <p className="helper-text">
                      {sub}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="helper-text">
            &copy; {year} CarRevive Pvt. Ltd. All rights reserved. Chennai, Tamil Nadu.
          </p>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms of Service', 'Contact Us'].map((item) => (
              <Link
                key={item}
                href="#"
                className="helper-text hover:text-text-primary transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
