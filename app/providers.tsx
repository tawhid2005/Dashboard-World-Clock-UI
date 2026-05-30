"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { City, AVAILABLE_CITIES, DEFAULT_TRACKED_IDS } from "@/lib/timezones";

interface DashboardContextType {
  trackedCities: City[];
  selectedCity: City;
  use24Hour: boolean;
  isSidebarCollapsed: boolean;
  isCommandPaletteOpen: boolean;
  currentTime: Date;
  activePanel: string;
  trackCity: (city: City) => void;
  untrackCity: (cityId: string) => void;
  setSelectedCityId: (cityId: string) => void;
  setUse24Hour: (val: boolean) => void;
  setSidebarCollapsed: (val: boolean) => void;
  setCommandPaletteOpen: (val: boolean) => void;
  setActivePanel: (panel: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [trackedCities, setTrackedCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<string>("london");
  const [use24Hour, setUse24Hour] = useState<boolean>(true);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [activePanel, setActivePanel] = useState<string>("world-clock");
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Initialize tracked cities from AVAILABLE_CITIES matching default IDs
  useEffect(() => {
    const defaults = AVAILABLE_CITIES.filter((c) => DEFAULT_TRACKED_IDS.includes(c.id));
    setTrackedCities(defaults);
  }, []);

  // Update central clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedCity = AVAILABLE_CITIES.find((c) => c.id === selectedCityId) || AVAILABLE_CITIES[2]; // fallback London

  const trackCity = (city: City) => {
    if (!trackedCities.some((c) => c.id === city.id)) {
      setTrackedCities([...trackedCities, city]);
    }
  };

  const untrackCity = (cityId: string) => {
    // Prevent untracking if it's the last city or currently selected
    if (trackedCities.length <= 1) return;
    
    const newTracked = trackedCities.filter((c) => c.id !== cityId);
    setTrackedCities(newTracked);
    
    if (selectedCityId === cityId) {
      setSelectedCityId(newTracked[0].id);
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        trackedCities,
        selectedCity,
        use24Hour,
        isSidebarCollapsed,
        isCommandPaletteOpen,
        activePanel,
        currentTime,
        trackCity,
        untrackCity,
        setSelectedCityId,
        setUse24Hour,
        setSidebarCollapsed,
        setCommandPaletteOpen,
        setActivePanel,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
