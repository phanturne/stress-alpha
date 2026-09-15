import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StressAlpha — Equity Decision & Earnings Stress Engine",
  description:
    "Deterministic forward-looking financial decision and scenario-simulation platform for fundamental equity analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-slate-100 font-sans antialiased selection:bg-accent/20 selection:text-accent">
        {children}
      </body>
    </html>
  );
}
