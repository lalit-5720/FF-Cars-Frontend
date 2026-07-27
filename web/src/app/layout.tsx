import type { Metadata } from "next";
import "./globals.css";
import ClientWrapper from "../components/ClientWrapper";
import Preloader from "../components/Preloader";

export const metadata: Metadata = {
  title: "FF-Cars | Luxury Automotive Concierge — Chennai's Premier Dealership",
  description:
    "Experience the finest pre-owned luxury vehicles at FF-Cars. Certified inventory, transparent pricing, and white-glove service across our Chennai showrooms.",
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
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=DM+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-full flex flex-col"
        style={{
          backgroundColor: 'var(--midnight)',
          color: 'var(--platinum)',
          fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <Preloader />
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
