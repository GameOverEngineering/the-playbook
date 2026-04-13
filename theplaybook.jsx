import React, { useState, useEffect, useCallback, useRef } from "react";
import ReactDOM from "react-dom/client";
import {
  Plus, Calendar, Archive, Settings, X, DollarSign, Globe, MapPin,
  Tag, Clock, RotateCcw, CheckCircle, ChevronLeft, Trophy,
  Repeat, Zap, Search, ChevronDown
} from "lucide-react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const MOCK_WEATHER = [
  { emoji: "☀️", temp: 72, label: "Sunny" },
  { emoji: "⛅", temp: 65, label: "Partly Cloudy" },
  { emoji: "🌧️", temp: 58, label: "Rainy" },
  { emoji: "☀️", temp: 70, label: "Sunny" },
  { emoji: "🌤️", temp: 68, label: "Mostly Clear" },
];

const ACTIVITY_COLORS = [
  { bg: "rgba(255,208,0,0.28)", border: "rgba(255,208,0,0.5)", plate: "#FFD000", plateShadow: "#b89200", plateText: "#3a2600" },
  { bg: "rgba(21,101,192,0.35)", border: "rgba(21,101,192,0.5)", plate: "#1565C0", plateShadow: "#0d47a1", plateText: "#ffffff" },
  { bg: "rgba(76,175,80,0.28)", border: "rgba(76,175,80,0.5)", plate: "#4CAF50", plateShadow: "#2e7d32", plateText: "#ffffff" },
  { bg: "rgba(244,67,54,0.28)", border: "rgba(244,67,54,0.5)", plate: "#F44336", plateShadow: "#c62828", plateText: "#ffffff" },
  { bg: "rgba(156,39,176,0.28)", border: "rgba(156,39,176,0.5)", plate: "#9C27B0", plateShadow: "#6a1b9a", plateText: "#ffffff" },
];

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

const App = () => {
  const [activeTab, setActiveTab] = useState("schedule");
  const [showArchive, setShowArchive] = useState(false);

  return (
    <div className="fixed inset-0 bg-[#2d5a27] font-sans text-slate-900 overflow-hidden select-none">
      {/* Grass Texture Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/p6-mini.png")` }} />

      {/* Main Content Area */}
      <main className="relative h-full flex flex-col pb-20">
        
        {/* Header / Weather Bar */}
        <header className="px-4 pt-6 pb-2">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-white text-3xl font-black italic tracking-tighter uppercase leading-none">
                The Playbook
              </h1>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">
                Mississauga, ON • Week 14
              </p>
            </div>
            <div className="flex gap-1">
              {MOCK_WEATHER.map((w, i) => (
                <div key={i} className="flex flex-col items-center bg-black/20 rounded-lg p-1.5 min-w-[40px]">
                  <span className="text-[10px] font-black text-white/40 uppercase leading-none mb-1">{DAY_SHORT[i]}</span>
                  <span className="text-lg leading-none">{w.emoji}</span>
                  <span className="text-[10px] font-bold text-white mt-1 leading-none">{w.temp}°</span>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* Scrollable Schedule */}
        <div className="flex-1 overflow-y-auto px-4 space-y-6 pt-4 pb-10">
          {DAYS.map((day, idx) => (
            <section key={day} className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-white text-black px-2 py-0.5 rounded text-xs font-black uppercase tracking-tighter italic">
                  {day}
                </div>
                <div className="h-[1px] flex-1 bg-white/20" />
              </div>
              
              <div className="space-y-3">
                {/* Example Lego Plate */}
                <div 
                  className="relative rounded-xl p-4 transition-transform active:scale-95 shadow-lg border-b-4 border-r-4"
                  style={{ 
                    backgroundColor: ACTIVITY_COLORS[idx % 5].bg, 
                    borderColor: ACTIVITY_COLORS[idx % 5].border 
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">09:00 AM</span>
                      <h3 className="text-xl font-black text-white leading-tight uppercase italic">Morning AI Lab</h3>
                    </div>
                    <div 
                      className="w-8 h-8 rounded shadow-inner flex items-center justify-center"
                      style={{ backgroundColor: ACTIVITY_COLORS[idx % 5].plate }}
                    >
                      <Zap size={16} color="white" />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      </main>

      {/* Navigation Dock */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 px-6 py-4 flex justify-between items-center z-40">
        <button onClick={() => setActiveTab("schedule")} className={`flex flex-col items-center gap-1 ${activeTab === "schedule" ? "text-yellow-400" : "text-white/40"}`}>
          <Calendar size={24} />
          <span className="text-[10px] font-bold uppercase">Field</span>
        </button>
        
        <button 
          onClick={() => setShowArchive(true)}
          className="bg-yellow-400 text-black w-14 h-14 rounded-full flex items-center justify-center -mt-10 shadow-[0_0_20px_rgba(250,204,21,0.4)] border-4 border-[#2d5a27] transition-transform active:scale-90"
        >
          <Plus size={28} strokeWidth={3} />
        </button>

        <button onClick={() => setActiveTab("settings")} className={`flex flex-col items-center gap-1 ${activeTab === "settings" ? "text-yellow-400" : "text-white/40"}`}>
          <Settings size={24} />
          <span className="text-[10px] font-bold uppercase">Gear</span>
        </button>
      </nav>

      {/* Archive Drawer Overlay */}
      {showArchive && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowArchive(false)} />
          <div className="relative bg-[#1a1a1a] rounded-t-[32px] p-6 max-h-[85vh] overflow-y-auto border-t border-white/20">
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black italic text-white uppercase italic">Activity Library</h2>
              <button onClick={() => setShowArchive(false)} className="bg-white/10 p-2 rounded-full text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pb-10">
              {['BJJ', 'Art', 'Piano', 'Film', 'Reading', 'Outdoor'].map((item) => (
                <div key={item} className="bg-white/5 border border-white/10 rounded-2xl p-4 active:bg-white/20 transition-colors">
                  <div className="w-10 h-10 bg-yellow-400 rounded-lg mb-3 flex items-center justify-center text-black font-black">
                    {item[0]}
                  </div>
                  <span className="text-white font-bold uppercase text-sm tracking-widest">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── RENDER ──────────────────────────────────────────────────────────────────

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
