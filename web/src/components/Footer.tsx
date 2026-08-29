import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        backgroundColor: 'var(--obsidian)',
        borderTop: '1px solid var(--onyx-border)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Gold top accent line */}
      <div
        style={{
          height: '1px',
          background:
            'linear-gradient(90deg, transparent 0%, rgba(201,169,110,0.4) 30%, rgba(232,201,122,0.6) 50%, rgba(201,169,110,0.4) 70%, transparent 100%)',
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(201,169,110,0.04) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="relative max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">

          {/* Brand Column */}
          <div className="md:col-span-5">
            {/* Logotype */}
            <div className="mb-5">
              <span
                className="font-black tracking-widest text-lg"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  color: 'var(--gold)',
                  letterSpacing: '0.18em',
                }}
              >
                CarRevive
              </span>
              <span
                className="block text-[9px] uppercase tracking-widest mt-0.5"
                style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif" }}
              >
                Automotive Concierge · Chennai
              </span>
            </div>

            {/* Ornamental divider */}
            <div className="my-5 h-px w-16" style={{ background: 'var(--gold-dim)' }} />

            <p
              className="text-sm max-w-xs leading-relaxed"
              style={{ color: 'var(--silver)', fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
            >
              Chennai's premier destination for certified luxury and premium pre-owned vehicles.
              Serving discerning buyers across Anna Nagar & Velachery.
            </p>

            {/* Showrooms */}
            <div className="mt-6 flex flex-col gap-2">
              {[
                { name: 'Anna Nagar Showroom', addr: '100 Feet Road, Chennai 600040' },
                { name: 'Velachery Showroom', addr: '100 Feet Bypass Road, Chennai 600042' },
              ].map(({ name, addr }) => (
                <div key={name}>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: 'var(--platinum)', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {name}
                  </p>
                  <p
                    className="text-[11px]"
                    style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {addr}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div className="md:col-span-3">
            <h3
              className="text-[10px] uppercase tracking-widest font-semibold mb-5"
              style={{ color: 'var(--gold)', fontFamily: "'DM Sans', sans-serif" }}
            >
              Inventory
            </h3>
            <ul className="flex flex-col gap-3">
              {[
                { label: 'Browse All Vehicles', href: '/cars' },
                { label: 'Electric Cars', href: '/cars?fuelType=Electric' },
                { label: 'Diesel Cars', href: '/cars?fuelType=Diesel' },
                { label: 'Premium Sedans', href: '/cars?search=sedan' },
                { label: 'Budget Cars', href: '/cars?sortBy=price&sortOrder=asc' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm transition-colors duration-200"
                    style={{ color: 'var(--silver)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--silver)')}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Our Promise */}
          <div className="md:col-span-4">
            <h3
              className="text-[10px] uppercase tracking-widest font-semibold mb-5"
              style={{ color: 'var(--gold)', fontFamily: "'DM Sans', sans-serif" }}
            >
              Our Promise
            </h3>
            <ul className="flex flex-col gap-3.5">
              {[
                { point: '200-Point Certified Inspection', sub: 'Every vehicle rigorously tested' },
                { point: '5-Day Money-Back Guarantee', sub: 'Complete purchase confidence' },
                { point: 'Transparent Pricing', sub: 'No hidden charges, ever' },
                { point: 'White-Glove Delivery', sub: 'Handover to your doorstep' },
              ].map(({ point, sub }) => (
                <li key={point} className="flex items-start gap-2.5">
                  <span
                    className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0"
                    style={{ background: 'var(--gold)' }}
                  />
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: 'var(--platinum)', fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {point}
                    </p>
                    <p
                      className="text-[11px]"
                      style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {sub}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid var(--onyx-border)' }}
        >
          <p
            className="text-xs"
            style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif" }}
          >
            &copy; {year} CarRevive Pvt. Ltd. All rights reserved. Chennai, Tamil Nadu.
          </p>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms of Service', 'Contact Us'].map((item) => (
              <Link
                key={item}
                href="#"
                className="text-xs transition-colors duration-200"
                style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif" }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--silver-dim)')}
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
