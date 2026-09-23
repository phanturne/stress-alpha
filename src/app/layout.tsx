import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

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
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${inter.variable} ${jetbrainsMono.variable}`}
      data-theme="cyber"
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('stress_alpha_theme');var theme=(t==='light')?'light':'cyber';document.documentElement.setAttribute('data-theme',theme);if(theme==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');}else{document.documentElement.classList.remove('light');document.documentElement.classList.add('dark');}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="bg-background font-sans text-foreground antialiased selection:bg-accent/20 selection:text-accent">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
