import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="col-span-1 md:col-span-2">
            <span className="font-display text-2xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
              FF-CARS
            </span>
            <p className="mt-4 text-sm text-muted-foreground max-w-sm leading-relaxed">
              We are a next-generation car buying and selling platform offering premium quality, 
              full transparency, and direct digital booking on verified cars.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">Platform</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/cars" className="text-muted-foreground hover:text-foreground transition-colors">
                  Browse Inventory
                </Link>
              </li>
              <li>
                <Link href="/cars?fuelType=electric" className="text-muted-foreground hover:text-foreground transition-colors">
                  Electric Cars
                </Link>
              </li>
              <li>
                <Link href="/cars?sortBy=price&sortOrder=asc" className="text-muted-foreground hover:text-foreground transition-colors">
                  Budget Cars
                </Link>
              </li>
            </ul>
          </div>

          {/* Assurances */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">Our Promise</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                200-Point Inspection
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                5-Day Money Back Guarantee
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Secure Dynamic Booking Locks
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} FF-Cars Inc. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <Link href="#" className="hover:underline">Privacy Policy</Link>
            <Link href="#" className="hover:underline">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
