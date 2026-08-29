import type { Metadata } from "next";
import "./globals.css";
import ClientWrapper from "../components/ClientWrapper";
import Preloader from "../components/Preloader";

export const metadata: Metadata = {
  title: "CarRevive | Luxury Automotive Concierge — Chennai's Premier Dealership",
  description:
    "Experience the finest pre-owned luxury vehicles at CarRevive. Certified inventory, transparent pricing, and white-glove service across our Chennai showrooms.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=DM+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-full flex flex-col font-sans"
        style={{
          backgroundColor: 'var(--midnight)',
          color: 'var(--platinum)',
          fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
        }}
      >
        <Preloader />
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
