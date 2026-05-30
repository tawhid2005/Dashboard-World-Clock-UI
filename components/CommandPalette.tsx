"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDashboard } from "@/app/providers";
import { AVAILABLE_CITIES, City } from "@/lib/timezones";
import { Search, MapPin, X } from "lucide-react";

export default function CommandPalette() {
  const { isCommandPaletteOpen, setCommandPaletteOpen, trackCity } = useDashboard();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter cities by search query
  const filteredCities = query.trim() === "" 
    ? AVAILABLE_CITIES 
    : AVAILABLE_CITIES.filter((city) =>
        city.name.toLowerCase().includes(query.toLowerCase()) ||
        city.country.toLowerCase().includes(query.toLowerCase())
      );

  // Focus input when palette opens
  useEffect(() => {
    if (isCommandPaletteOpen) {
      inputRef.current?.focus();
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isCommandPaletteOpen]);

  // Handle global Cmd+K to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  // Keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setCommandPaletteOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCities.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCities.length) % filteredCities.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCities[selectedIndex]) {
        handleSelectCity(filteredCities[selectedIndex]);
      }
    }
  };

  const handleSelectCity = (city: City) => {
    trackCity(city);
    setCommandPaletteOpen(false);
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh] px-4"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-slate-100 overflow-hidden flex flex-col transition-all"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Area */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search timezone or city..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent border-0 outline-none text-slate-800 placeholder-slate-400 text-sm py-1"
          />
          <button 
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div 
          ref={listRef}
          className="max-h-[350px] overflow-y-auto p-2"
        >
          {filteredCities.length > 0 ? (
            filteredCities.map((city, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={city.id}
                  onClick={() => handleSelectCity(city)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-left transition-colors ${
                    isSelected ? "bg-emerald-50 text-emerald-950" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className={`w-4 h-4 ${isSelected ? "text-emerald-900" : "text-slate-400"}`} />
                    <div>
                      <div className="font-semibold text-sm">{city.name}</div>
                      <div className={`text-xs ${isSelected ? "text-emerald-800" : "text-slate-400"}`}>
                        {city.country} • {city.timezone}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                    Add
                  </span>
                </button>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-400 text-sm">
              No cities found for &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-4 text-[10px] text-slate-400">
          <span>
            <kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm mr-1 font-mono">↑↓</kbd> 
            Navigate
          </span>
          <span>
            <kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm mr-1 font-mono">Enter</kbd> 
            Select
          </span>
          <span>
            <kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm mr-1 font-mono">Esc</kbd> 
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
