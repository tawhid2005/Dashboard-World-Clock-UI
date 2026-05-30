import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { DashboardProvider } from "@/app/providers";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TimeSpot - World Clock & Productivity Dashboard",
  description: "A clean, modern time zone dashboard concept for tracking multiple global cities, day/night states, sunrise/sunset, and planning virtual collaboration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} h-full`}>
      <body className="min-h-full flex bg-slate-50 text-slate-950 antialiased">
        <DashboardProvider>
          <div className="flex-1 flex min-h-screen relative overflow-hidden">
            {children}
          </div>
        </DashboardProvider>
      </body>
    </html>
  );
}
