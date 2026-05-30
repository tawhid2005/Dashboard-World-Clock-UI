"use client";

import React from "react";
import { useDashboard } from "@/app/providers";
import { Search } from "lucide-react";

export default function TopHeader() {
  const { use24Hour, setUse24Hour, setCommandPaletteOpen } = useDashboard();

  return (
    <header className="sticky top-0 right-0 left-0 bg-slate-50/80 backdrop-blur-md z-30 px-6 py-4 flex items-center justify-between border-b border-slate-100/50">
      {/* Left side: Search trigger */}
      <div className="flex-1 max-w-md">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white border-0 shadow-[0_4px_20px_rgba(0,0,0,0.01)] text-slate-400 hover:text-slate-600 hover:shadow-[0_4px_25px_rgba(0,0,0,0.025)] transition-all text-left text-sm"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span>Search cities...</span>
          <kbd className="ml-auto hidden sm:inline-flex h-5 items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 font-mono text-[10px] font-medium text-slate-400 select-none">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right side: 12h/24h toggle, Log In, Get the App */}
      <div className="flex items-center gap-6">
        {/* Time Format Toggle Pill */}
        <div className="flex bg-white p-1 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
          <button
            onClick={() => setUse24Hour(false)}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
              !use24Hour
                ? "bg-slate-950 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            12h
          </button>
          <button
            onClick={() => setUse24Hour(true)}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
              use24Hour
                ? "bg-slate-950 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            24h
          </button>
        </div>

        {/* Log In Link */}
        <button className="hidden sm:inline-block text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
          Log In
        </button>

        {/* Get the App Capsule Button */}
        <button className="px-5 py-2.5 bg-slate-950 text-white text-xs font-bold rounded-full hover:bg-slate-900 hover:scale-[1.02] shadow-[0_4px_15px_rgba(0,0,0,0.05)] transition-all">
          Get the App
        </button>
      </div>
    </header>
  );
}
