'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Toast } from './Toast';
import { useSocket } from '../hooks/useSocket';

interface ClientWrapperProps {
  children: React.ReactNode;
}

export const ClientWrapper: React.FC<ClientWrapperProps> = ({ children }) => {
  // Initialize Socket.IO connection when authenticated
  useSocket();
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return <>{children}<Toast /></>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
      <Toast />
    </div>
  );
};
export default ClientWrapper;
