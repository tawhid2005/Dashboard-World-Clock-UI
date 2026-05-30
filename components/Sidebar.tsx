"use client";

import React from "react";
import { useDashboard } from "@/app/providers";
import { Clock, Calendar, Globe, Settings, ChevronLeft, ChevronRight, Compass } from "lucide-react";

export default function Sidebar() {
  const { isSidebarCollapsed, setSidebarCollapsed, activePanel, setActivePanel } = useDashboard();

  const menuItems = [
    { id: "world-clock", label: "World Clock", icon: Clock },
    { id: "planner", label: "Meeting Planner", icon: Calendar },
    { id: "converter", label: "Converter", icon: Globe },
    { id: "explore", label: "Explore", icon: Compass },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 left-0 bg-white border-r border-slate-100 z-40 transition-all duration-300 ease-out select-none ${
          isSidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Sidebar Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-900 flex items-center justify-center text-white font-bold shrink-0">
            T
          </div>
          {!isSidebarCollapsed && (
            <span className="font-extrabold text-lg text-slate-900 tracking-tight transition-opacity duration-300">
              TimeSpot
            </span>
          )}
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-4 py-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activePanel;
            return (
              <button
                key={item.id}
                onClick={() => setActivePanel(item.id)}
                className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group text-left ${
                  isActive
                    ? "bg-emerald-50 text-emerald-950 font-semibold"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                    isActive ? "text-emerald-900" : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                {!isSidebarCollapsed && (
                  <span className="text-sm tracking-wide transition-opacity duration-300">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-2 text-xs font-semibold">
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Panel</span>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-t border-slate-100 z-40 flex items-center justify-around px-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activePanel;
          return (
            <button
              key={item.id}
              onClick={() => setActivePanel(item.id)}
              className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors ${
                isActive ? "text-emerald-900" : "text-slate-400"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
