import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientWrapper from "../components/ClientWrapper";
import Preloader from "../components/Preloader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FF-Cars | Premium Car Marketplace & Real-Time Booking Platform",
  description: "Browse, compare, and instantly book certified luxury and budget cars with live locking protection and 200-point inspected assurance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Preloader />
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
