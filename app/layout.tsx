import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Suspense } from "react";
import Script from "next/script";
import "./globals.css";

// MapPL integration removed - using Leaflet instead

export const metadata: Metadata = {
  title: "JanSamvedan - Smart Civic Issue Reporting",
  description:
    "Report, Track & Resolve Civic Issues Together - Smart India Hackathon Project",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* MapPL integration removed - using Leaflet instead */}
      </head>
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} min-h-screen flex flex-col`}
      >
        <Suspense fallback={<div>Loading...</div>}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
