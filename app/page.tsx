"use client";

import React, { useState, useEffect } from "react";
import { useDashboard } from "@/app/providers";
import { getCityTimeInfo, AVAILABLE_CITIES, City, getUtcDateForCityHour } from "@/lib/timezones";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import CommandPalette from "@/components/CommandPalette";
import { 
  Sun, Moon, Plus, Trash2, Calendar, Globe, Compass, Settings, 
  Check, Copy, RefreshCw, Clock 
} from "lucide-react";

export default function WorldClockDashboard() {
  const {
    trackedCities,
    selectedCity,
    use24Hour,
    currentTime,
    activePanel,
    setSelectedCityId,
    untrackCity,
    setCommandPaletteOpen,
    trackCity,
    setUse24Hour,
  } = useDashboard();

  // Hydration Mismatch Fix
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Planner hour slider state (0 to 23 hours in selectedCity's timezone)
  const [plannerHour, setPlannerHour] = useState<number>(12);
  const [plannerMinute, setPlannerMinute] = useState<number>(0);
  const [plannerDate, setPlannerDate] = useState<string>("");
  const [plannerDuration, setPlannerDuration] = useState<number>(1);
  
  // Converter hour state (0 to 23 in selectedCity's timezone)
  const [converterHour, setConverterHour] = useState<number>(12);
  const [copied, setCopied] = useState(false);

  // Settings Accents & Rounding customization
  const [accentColor, setAccentColor] = useState<"green" | "indigo" | "black">("green");
  const [borderRadius, setBorderRadius] = useState<"standard" | "neo" | "pill">("standard");

  // Get active hero clock details (only if mounted, otherwise fallback to static placeholder)
  const heroInfo = mounted 
    ? getCityTimeInfo(selectedCity, currentTime, use24Hour)
    : { time: "00:00:00", date: "Loading...", isNight: false, offsetString: "UTC+0", sunrise: "06:00", sunset: "18:00", dayLength: "12h" };

  // Set local date hour for planner/converter
  useEffect(() => {
    if (mounted) {
      setPlannerHour(currentTime.getHours());
      setConverterHour(currentTime.getHours());
      
      const year = currentTime.getFullYear();
      const month = String(currentTime.getMonth() + 1).padStart(2, "0");
      const day = String(currentTime.getDate()).padStart(2, "0");
      setPlannerDate(`${year}-${month}-${day}`);
    }
  }, [mounted]);

  // Color mapping based on accent selection
  const accentClasses = {
    green: {
      bg: "bg-emerald-900 hover:bg-emerald-800",
      text: "text-emerald-900",
      pill: "bg-emerald-50 text-emerald-950",
      border: "border-emerald-500",
      themeColor: "#0F5132"
    },
    indigo: {
      bg: "bg-indigo-600 hover:bg-indigo-500",
      text: "text-indigo-600",
      pill: "bg-indigo-50 text-indigo-950",
      border: "border-indigo-500",
      themeColor: "#4F46E5"
    },
    black: {
      bg: "bg-slate-950 hover:bg-slate-900",
      text: "text-slate-950",
      pill: "bg-slate-100 text-slate-900",
      border: "border-slate-950",
      themeColor: "#090D16"
    }
  };

  const currentAccent = accentClasses[accentColor];

  // Rounding styles mapping
  const radiusClasses = {
    standard: "rounded-3xl",
    neo: "rounded-xl",
    pill: "rounded-[2rem]",
  };

  const currentRadius = radiusClasses[borderRadius];

  // Helper to copy meeting converter conversions to clipboard
  const handleCopyConversion = () => {
    let text = `Timezone Conversion (Based on ${selectedCity.name}):\n`;
    trackedCities.forEach((city) => {
      // Calculate target time based on converter hour offset
      const convertedInfo = getConvertedHourInfo(city, converterHour);
      text += `• ${city.name}: ${convertedInfo.timeString} (${convertedInfo.label})\n`;
    });
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert custom base hour in base reference city timezone to target timezone values
  const getConvertedHourInfo = (targetCity: City, baseHour: number, baseMinute: number = 0, baseDateStr?: string) => {
    // Determine the reference date (use date override if available)
    let referenceDate = currentTime;
    if (baseDateStr) {
      const [y, m, d] = baseDateStr.split("-").map(Number);
      referenceDate = new Date(y, m - 1, d);
    }

    // Calculate the exact UTC date that corresponds to baseHour:baseMinute in selectedCity's timezone
    const targetDate = getUtcDateForCityHour(selectedCity.timezone, baseHour, referenceDate, baseMinute);
    
    // Format targetDate in targetCity.timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: targetCity.timezone,
      hour: "numeric",
      minute: "2-digit",
      hour12: !use24Hour,
    });
    
    const formattedStr = formatter.format(targetDate);

    // Get numeric local hour in target city's timezone
    const localHourStr = new Intl.DateTimeFormat("en-US", {
      timeZone: targetCity.timezone,
      hour: "numeric",
      hour12: false,
    }).format(targetDate);
    const hour = parseInt(localHourStr, 10);

    let classification = "Work"; // 9am - 5pm
    let bg = "bg-emerald-50 text-emerald-800 border-emerald-100";
    let timelineBg = "bg-emerald-500";
    if (hour >= 22 || hour < 6) {
      classification = "Sleep"; // 10pm - 6am
      bg = "bg-slate-100 text-slate-400 border-slate-200";
      timelineBg = "bg-slate-200";
    } else if (hour < 9 || hour >= 17) {
      classification = "Personal"; // 6am-9am, 5pm-10pm
      bg = "bg-amber-50 text-amber-800 border-amber-100";
      timelineBg = "bg-amber-400/20";
    }

    return {
      timeString: formattedStr,
      hour,
      label: classification,
      classBg: bg,
      timelineBg,
    };
  };

  // Scans all 24 hours of the day to identify the best overlap time across all tracked zones
  const getBestMeetingHour = () => {
    let bestH = 9;
    let maxScore = -999;
    
    for (let h = 0; h < 24; h++) {
      let score = 0;
      trackedCities.forEach((city) => {
        const info = getConvertedHourInfo(city, h, plannerMinute, plannerDate);
        if (info.label === "Work") score += 3;
        else if (info.label === "Personal") score += 1;
        else if (info.label === "Sleep") score -= 10;
      });
      if (score > maxScore) {
        maxScore = score;
        bestH = h;
      }
    }
    return bestH;
  };

  const bestHour = getBestMeetingHour();

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 w-full text-slate-400 font-semibold text-sm">
        Initializing TimeSpot Dashboard...
      </div>
    );
  }

  return (
    <div className="flex-1 flex min-h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Collapsible Left Sidebar */}
      <Sidebar />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto pb-20 md:pb-0">
        {/* Sticky Header */}
        <TopHeader />

        {/* Dynamic Panels */}
        <main className="flex-grow p-6 md:p-10 lg:p-12 max-w-7xl mx-auto w-full flex flex-col gap-8">
          
          {/* ================= PANEL 1: WORLD CLOCK ================= */}
          {activePanel === "world-clock" && (
            <>
              {/* Large Hero Clock Widget */}
              <section 
                className={`w-full bg-white ${currentRadius} p-8 md:p-12 shadow-[0_8px_40px_rgba(0,0,0,0.012)] border border-slate-100/50 flex flex-col justify-between min-h-[360px] relative overflow-hidden transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.025)]`}
              >
                <div className="flex items-center justify-between mb-4 z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full border border-white relative">
                        <div className="absolute top-0.5 left-1 w-1 h-0.5 bg-white origin-left rotate-45"></div>
                      </div>
                    </div>
                    <span className="font-extrabold text-sm text-slate-900 tracking-tight">TimeSpot</span>
                  </div>
                  <span className={`text-xs font-semibold ${currentAccent.pill} px-3 py-1.5 rounded-full`}>
                    Active: {selectedCity.name}
                  </span>
                </div>

                <div className="flex justify-center items-center py-6 md:py-10 z-10">
                  <h1 className="text-[14vw] sm:text-7xl md:text-8xl lg:text-[10rem] font-extrabold leading-none tracking-tighter text-slate-950 font-mono select-all">
                    {heroInfo.time}
                  </h1>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-t border-slate-100 pt-6 z-10">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current</span>
                    <span className="text-sm font-semibold text-slate-600">
                      {selectedCity.name}, {selectedCity.country}
                    </span>
                  </div>

                  <div className="flex flex-col sm:items-center gap-1">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                      Sun ☀️ : {heroInfo.sunrise} - {heroInfo.sunset} ({heroInfo.dayLength})
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      {heroInfo.date}
                    </span>
                  </div>

                  <div className={`text-xs font-bold ${currentAccent.pill} px-3 py-1.5 rounded-full uppercase tracking-wider`}>
                    {heroInfo.offsetString}
                  </div>
                </div>

                <div className="absolute inset-0 bg-radial-gradient from-transparent to-slate-50/10 pointer-events-none opacity-50"></div>
              </section>

              {/* Grid Heading Section */}
              <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>{selectedCity.name},</span>
                    <span className="text-slate-400 font-medium">{selectedCity.country}</span>
                  </h2>
                  <p className="text-xs md:text-sm text-slate-500 font-medium max-w-md">
                    Life moves fast. Stay on time and enjoy every moment!
                  </p>
                </div>

                <button
                  onClick={() => setCommandPaletteOpen(true)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 shadow-[0_4px_15px_rgba(0,0,0,0.01)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.02)] px-4 py-2.5 rounded-full border border-slate-100 transition-all shrink-0 self-start sm:self-auto"
                >
                  <span>Add Another City</span>
                  <Plus className="w-4 h-4" />
                </button>
              </section>

              {/* Timezone Cards Grid */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12">
                {trackedCities.map((city) => {
                  const info = getCityTimeInfo(city, currentTime, use24Hour);
                  const isSelected = city.id === selectedCity.id;

                  return (
                    <div
                      key={city.id}
                      onClick={() => setSelectedCityId(city.id)}
                      className={`group relative ${currentRadius} p-6 flex flex-col justify-between min-h-[160px] cursor-pointer transition-all duration-300 hover:-translate-y-1 border select-none ${
                        isSelected
                          ? accentColor === "green" 
                            ? "bg-emerald-950 text-white border-emerald-950 shadow-[0_20px_40px_rgba(9,51,32,0.15)]"
                            : accentColor === "indigo"
                              ? "bg-indigo-950 text-white border-indigo-950 shadow-[0_20px_40px_rgba(79,70,229,0.15)]"
                              : "bg-slate-950 text-white border-slate-950 shadow-[0_20px_40px_rgba(9,13,22,0.15)]"
                          : "bg-white text-slate-900 border-slate-100 hover:shadow-[0_20px_40px_rgba(0,0,0,0.035)]"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-0.5">
                          <h3 className="font-extrabold text-base tracking-tight truncate max-w-[120px]">
                            {city.name}
                          </h3>
                          <span className={`text-[10px] font-bold text-slate-400`}>
                            {info.offsetString}
                          </span>
                        </div>

                        {trackedCities.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              untrackCity(city.id);
                            }}
                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white text-slate-400 transition-all duration-150"
                            title="Remove city"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-end justify-between mt-8">
                        <span className="text-3xl font-extrabold font-mono tracking-tight">
                          {info.time}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {info.isNight ? (
                            <>
                              <Moon className={`w-3.5 h-3.5 ${isSelected ? "text-amber-400" : "text-slate-500"}`} />
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                isSelected ? "text-slate-300" : "text-slate-500"
                              }`}>
                                Night
                              </span>
                            </>
                          ) : (
                            <>
                              <Sun className={`w-3.5 h-3.5 ${isSelected ? "text-amber-300" : "text-amber-500"}`} />
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                isSelected ? "text-slate-300" : "text-amber-600"
                              }`}>
                                Day
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </section>
            </>
          )}

          {/* ================= PANEL 2: MEETING PLANNER ================= */}
          {activePanel === "planner" && (
            <section className="flex flex-col gap-6">
              <div className="space-y-1">
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-slate-500" />
                  <span>Meeting Planner</span>
                </h2>
                <p className="text-xs md:text-sm text-slate-500 font-medium">
                  Overlap multiple timezone schedules to find optimal work meeting hours.
                </p>
              </div>

              {/* Hour Slider Card */}
              <div className={`bg-white ${currentRadius} p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.01)] border border-slate-100`}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider">
                      Reference Local Time ({selectedCity.name})
                    </h3>
                    <span className="text-2xl font-extrabold text-slate-900 font-mono">
                      {plannerHour.toString().padStart(2, "0")}:{plannerMinute.toString().padStart(2, "0")}
                    </span>
                  </div>

                  {/* Classification color definitions */}
                  <div className="flex gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span>Working (9am - 5pm)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                      <span>Personal (6am - 10pm)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                      <span>Sleeping (10pm - 6am)</span>
                    </span>
                  </div>
                </div>

                {/* Precision Date & Time Picker Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 pt-4 border-t border-slate-100/50">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Meeting Date</span>
                    <input
                      type="date"
                      value={plannerDate}
                      onChange={(e) => setPlannerDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Hour</span>
                    <select
                      value={plannerHour}
                      onChange={(e) => setPlannerHour(parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-400 transition-colors"
                    >
                      {Array.from({ length: 24 }).map((_, h) => (
                        <option key={h} value={h}>
                          {h.toString().padStart(2, "0")}:00
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Minute</span>
                    <select
                      value={plannerMinute}
                      onChange={(e) => setPlannerMinute(parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-400 transition-colors"
                    >
                      <option value={0}>00 min</option>
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration</span>
                    <select
                      value={plannerDuration}
                      onChange={(e) => setPlannerDuration(parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-400 transition-colors"
                    >
                      <option value={1}>1 hour</option>
                      <option value={2}>2 hours</option>
                      <option value={3}>3 hours</option>
                      <option value={4}>4 hours</option>
                    </select>
                  </div>
                </div>

                {/* Slider Input */}
                <input
                  type="range"
                  min="0"
                  max="23"
                  value={plannerHour}
                  onChange={(e) => setPlannerHour(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-950"
                />

                {/* Smart Overlap Recommendation Banner */}
                <div className="mt-6 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-xl text-emerald-950">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-950 block">💡 Smart Overlap Recommendation</span>
                      <span className="text-[11px] text-emerald-800 font-medium">
                        The optimal hour to connect across all pinned cities is at <strong className="font-extrabold font-mono">{bestHour.toString().padStart(2, "0")}:{plannerMinute.toString().padStart(2, "0")}</strong> ({selectedCity.name} time).
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setPlannerHour(bestHour)}
                    className="px-3.5 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-white text-[10px] font-bold rounded-lg shadow-sm transition-all"
                  >
                    Apply Time
                  </button>
                </div>

                {/* Grid of timelines */}
                <div className="space-y-6 mt-8">
                  {trackedCities.map((city) => {
                    const localInfo = getConvertedHourInfo(city, plannerHour, plannerMinute, plannerDate);
                    return (
                      <div key={city.id} className="flex flex-col gap-2 border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-bold text-slate-800">{city.name}</span>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${localInfo.classBg}`}>
                              {localInfo.label}
                            </span>
                            <span className="font-mono font-semibold text-slate-900">{localInfo.timeString}</span>
                          </div>
                        </div>

                        {/* 24h Blocks timeline */}
                        <div className="grid gap-1 h-6" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
                          {Array.from({ length: 24 }).map((_, h) => {
                            const blockInfo = getConvertedHourInfo(city, h);
                            
                            // Check if hour h falls within the base plannerHour + duration window (handling wraps)
                            const isHourInMeeting = ((h - plannerHour + 24) % 24) < plannerDuration;
                            
                            const blockBg = blockInfo.timelineBg;

                            return (
                              <div
                                key={h}
                                title={`${city.name} local: ${blockInfo.timeString} (${blockInfo.label})`}
                                className={`rounded transition-all ${blockBg} ${
                                  isHourInMeeting ? "ring-2 ring-slate-950 scale-y-110 shadow-sm z-10" : ""
                                }`}
                              ></div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* ================= PANEL 3: TIME CONVERTER ================= */}
          {activePanel === "converter" && (
            <section className="flex flex-col gap-6">
              <div className="space-y-1 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Globe className="w-6 h-6 text-slate-500" />
                    <span>Time Zone Converter</span>
                  </h2>
                  <p className="text-xs md:text-sm text-slate-500 font-medium">
                    Choose a time in your base city and instantly convert it for other zones.
                  </p>
                </div>

                <button
                  onClick={handleCopyConversion}
                  className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-full text-xs font-bold text-slate-700 shadow-sm transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Conversion</span>
                    </>
                  )}
                </button>
              </div>

              {/* Conversion Card */}
              <div className={`bg-white ${currentRadius} p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.01)] border border-slate-100`}>
                <div className="mb-8">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Base City</span>
                  <div className="flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-2xl border-2 ${currentAccent.border} bg-slate-50 font-bold text-slate-900 text-sm`}>
                      {selectedCity.name} ({selectedCity.timezone})
                    </div>
                    <span className="text-slate-400 text-xs font-semibold">
                      Use the Sidebar/Grid to change the active base city.
                    </span>
                  </div>
                </div>

                {/* Hours conversion sliders */}
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center text-sm font-semibold mb-2">
                      <span className="text-slate-500">Base Time Select</span>
                      <span className="font-mono text-base text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
                        {converterHour.toString().padStart(2, "0")}:00
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="23"
                      value={converterHour}
                      onChange={(e) => setConverterHour(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-950"
                    />
                  </div>

                  {/* Target conversions list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    {trackedCities.map((city) => {
                      const converted = getConvertedHourInfo(city, converterHour);
                      return (
                        <div key={city.id} className="bg-slate-50/50 border border-slate-100/50 p-4 rounded-2xl flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800 text-sm block">{city.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{city.country}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-base font-extrabold text-slate-950 block">
                              {converted.timeString}
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border inline-block mt-1 ${converted.classBg}`}>
                              {converted.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ================= PANEL 4: EXPLORE ================= */}
          {activePanel === "explore" && (
            <section className="flex flex-col gap-6">
              <div className="space-y-1">
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Compass className="w-6 h-6 text-slate-500" />
                  <span>Explore Time Zones</span>
                </h2>
                <p className="text-xs md:text-sm text-slate-500 font-medium">
                  Search and track other global time zones for your active list.
                </p>
              </div>

              {/* Grid of all available cities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {AVAILABLE_CITIES.map((city) => {
                  const isTracked = trackedCities.some((c) => c.id === city.id);
                  const info = getCityTimeInfo(city, currentTime, use24Hour);
                  return (
                    <div 
                      key={city.id} 
                      className={`bg-white ${currentRadius} p-6 border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[140px]`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-base">{city.name}</h3>
                          <span className="text-xs text-slate-400 font-semibold">{city.country}</span>
                        </div>

                        {isTracked ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                            <Check className="w-3 h-3" />
                            <span>Pinned</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => trackCity(city)}
                            className={`flex items-center gap-1 text-[10px] font-bold text-white ${currentAccent.bg} px-3 py-1 rounded-full transition-all shadow-sm`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-end justify-between mt-4">
                        <span className="font-mono text-xl font-extrabold text-slate-800">{info.time}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {info.offsetString}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ================= PANEL 5: SETTINGS ================= */}
          {activePanel === "settings" && (
            <section className="flex flex-col gap-6">
              <div className="space-y-1">
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Settings className="w-6 h-6 text-slate-500" />
                  <span>Settings Customizer</span>
                </h2>
                <p className="text-xs md:text-sm text-slate-500 font-medium">
                  Customize colors, spacing, formats, and design system properties dynamically.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual Settings Panel */}
                <div className={`lg:col-span-2 bg-white ${currentRadius} p-6 md:p-8 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.01)] space-y-8`}>
                  
                  {/* Format customization */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm">Time Formatter Preferences</h3>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setUse24Hour(false)}
                        className={`px-4 py-2 text-xs font-bold rounded-2xl transition-all border ${
                          !use24Hour
                            ? "bg-slate-950 border-slate-950 text-white"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        12-Hour format (AM/PM)
                      </button>
                      <button
                        onClick={() => setUse24Hour(true)}
                        className={`px-4 py-2 text-xs font-bold rounded-2xl transition-all border ${
                          use24Hour
                            ? "bg-slate-950 border-slate-950 text-white"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        24-Hour format (Military)
                      </button>
                    </div>
                  </div>

                  {/* Accent color picker */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm">Accent Brand Colors</h3>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setAccentColor("green")}
                        className={`w-10 h-10 rounded-xl bg-emerald-900 border-2 transition-all flex items-center justify-center ${
                          accentColor === "green" ? "border-emerald-500 scale-105 shadow-sm" : "border-transparent"
                        }`}
                        title="Forest Emerald"
                      >
                        {accentColor === "green" && <Check className="w-5 h-5 text-white" />}
                      </button>
                      
                      <button
                        onClick={() => setAccentColor("indigo")}
                        className={`w-10 h-10 rounded-xl bg-indigo-600 border-2 transition-all flex items-center justify-center ${
                          accentColor === "indigo" ? "border-indigo-400 scale-105 shadow-sm" : "border-transparent"
                        }`}
                        title="Indigo Royale"
                      >
                        {accentColor === "indigo" && <Check className="w-5 h-5 text-white" />}
                      </button>

                      <button
                        onClick={() => setAccentColor("black")}
                        className={`w-10 h-10 rounded-xl bg-slate-950 border-2 transition-all flex items-center justify-center ${
                          accentColor === "black" ? "border-slate-400 scale-105 shadow-sm" : "border-transparent"
                        }`}
                        title="Space Black"
                      >
                        {accentColor === "black" && <Check className="w-5 h-5 text-white" />}
                      </button>
                    </div>
                  </div>

                  {/* Corner Rounding customization */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm">Corner Border Radius</h3>
                    <div className="flex items-center gap-4">
                      {["neo", "standard", "pill"].map((r) => (
                        <button
                          key={r}
                          onClick={() => setBorderRadius(r as any)}
                          className={`px-4 py-2 text-xs font-bold rounded-2xl transition-all border capitalize ${
                            borderRadius === r
                              ? "bg-slate-950 border-slate-950 text-white"
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {r === "neo" ? "Sharp (12px)" : r === "standard" ? "Round (24px)" : "Organic (32px)"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Info / Showcase Card */}
                <div className="flex flex-col gap-6">
                  <div className={`bg-white ${currentRadius} p-6 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex-grow flex flex-col justify-between min-h-[220px]`}>
                    <div>
                      <h4 className="font-bold text-slate-500 uppercase tracking-widest text-xs mb-2">
                        Preview Customizer Card
                      </h4>
                      <h3 className="font-extrabold text-slate-900 text-lg">Interactive Accent Preview</h3>
                      <p className="text-slate-400 text-xs font-medium mt-1 leading-relaxed">
                        This card reflects the active border-radius and color tokens selected in real time.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                      <span className="font-mono text-sm text-slate-400">Current Theme:</span>
                      <span className={`text-xs font-bold ${currentAccent.pill} px-3 py-1 rounded-full uppercase`}>
                        {accentColor} Accent
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

        </main>
      </div>

      {/* Floating CMD+K Command Palette */}
      <CommandPalette />
    </div>
  );
}
