import type { Metadata } from "next";
import "./globals.css";
import ClientWrapper from "../components/ClientWrapper";
import Preloader from "../components/Preloader";

export const metadata: Metadata = {
  title: "CarRevive | Certified Pre-Owned Automotive Dealership",
  description:
    "Experience the finest certified vehicles at CarRevive. Transparent pricing, multi-point inspection, and warranty service across our showrooms.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/apple-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('carrevive_theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-bg-page text-text-primary">
        <Preloader />
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
