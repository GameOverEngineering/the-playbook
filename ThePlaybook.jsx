import { useState, useEffect, useCallback } from "react";
import {
  Plus, Calendar, Archive, Settings, Sun, Cloud, CloudRain, CloudSnow,
  X, DollarSign, Globe, MapPin, Tag, Clock, RotateCcw, CheckCircle,
  ChevronLeft, Trophy,
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
  { bg: "rgba(255,208,0,0.28)",  border: "rgba(255,208,0,0.5)",  plate: "#FFD000", plateShadow: "#b89200", plateText: "#3a2600" },
  { bg: "rgba(21,101,192,0.35)", border: "rgba(21,101,192,0.5)", plate: "#1565C0", plateShadow: "#0a3f7f", plateText: "#fff" },
  { bg: "rgba(211,47,47,0.3)",   border: "rgba(211,47,47,0.5)",  plate: "#D32F2F", plateShadow: "#7f1a1a", plateText: "#fff" },
  { bg: "rgba(46,160,67,0.35)",  border: "rgba(46,160,67,0.5)",  plate: "#2e7d32", plateShadow: "#1a4a1d", plateText: "#fff" },
  { bg: "rgba(156,39,176,0.3)",  border: "rgba(156,39,176,0.5)", plate: "#7B1FA2", plateShadow: "#4a0072", plateText: "#fff" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function generateId() {
  return `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function snapSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.12);
  } catch (e) {}
}

function missionSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "square"; osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.start(t); osc.stop(t + 0.12);
    });
  } catch (e) {}
}

function buildInitialState() {
  const weeks = {};
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const baseMonday = new Date(today);
  baseMonday.setDate(today.getDate() + diff);
  for (let w = 0; w < 4; w++) {
    const weekKey = `week_${w}`;
    weeks[weekKey] = { days: {} };
    for (let d = 0; d < 5; d++) {
      const date = new Date(baseMonday);
      date.setDate(baseMonday.getDate() + w * 7 + d);
      weeks[weekKey].days[DAYS[d]] = { date: date.toISOString().slice(0, 10), activities: [] };
    }
  }
  return { weeks, activeWeek: "week_0" };
}

function loadState() {
  try {
    const raw = localStorage.getItem("thePlaybook_v1");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateFull(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function formatTime(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function getWeekRange(weekData) {
  const dates = Object.values(weekData.days).map(d => d.date).filter(Boolean);
  if (!dates.length) return "";
  return `${formatDate(dates[0])} – ${formatDate(dates[dates.length - 1])}`;
}

// ─── LEGO BUTTON ─────────────────────────────────────────────────────────────

function LegoBtn({ color = "blue", onClick, children, small = false, disabled = false, style: extra = {} }) {
  const themes = {
    blue:   { bg: "#1565C0", shadow: "#0a3f7f", text: "#fff" },
    yellow: { bg: "#FFD000", shadow: "#b89200", text: "#3a2600" },
    red:    { bg: "#D32F2F", shadow: "#7f1a1a", text: "#fff" },
    gray:   { bg: "rgba(255,255,255,0.18)", shadow: "rgba(0,0,0,0.35)", text: "#fff" },
    green:  { bg: "#2e7d32", shadow: "#1a4a1d", text: "#fff" },
  };
  const t = themes[color] || themes.blue;
  return (
    <button disabled={disabled} onClick={onClick}
      style={{
        background: disabled ? "rgba(255,255,255,0.12)" : t.bg,
        color: disabled ? "rgba(255,255,255,0.4)" : t.text,
        borderBottom: `4px solid ${disabled ? "rgba(0,0,0,0.15)" : t.shadow}`,
        borderTop: "none", borderLeft: "none", borderRight: "none",
        borderRadius: 9, padding: small ? "6px 12px" : "9px 18px",
        fontWeight: 900, fontSize: small ? 11 : 13,
        fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.3px",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", gap: 6,
        transition: "transform 0.08s",
        boxShadow: "0 1px 0 rgba(255,255,255,0.18) inset",
        textTransform: "uppercase", userSelect: "none",
        ...extra,
      }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = "scale(0.96) translateY(2px)"; }}
      onMouseUp={e => { e.currentTarget.style.transform = ""; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
    >{children}</button>
  );
}

// ─── ACTIVITY CHIP (turf view) ────────────────────────────────────────────────

function ActivityChip({ activity, onToggle, colorIdx }) {
  const c = ACTIVITY_COLORS[colorIdx % ACTIVITY_COLORS.length];
  return (
    <div onClick={() => onToggle(activity.id)} style={{
      background: activity.isComplete ? "rgba(46,160,67,0.3)" : c.bg,
      border: `1px solid ${activity.isComplete ? "rgba(46,160,67,0.5)" : c.border}`,
      borderRadius: 7, padding: "5px 5px", fontSize: 9, fontWeight: 900, color: "#fff",
      textAlign: "center", lineHeight: 1.25, cursor: "pointer",
      minHeight: 34, display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
      fontFamily: "'Arial Black', Arial, sans-serif", textShadow: "0 1px 2px rgba(0,0,0,0.4)",
      transition: "opacity 0.15s",
      textDecoration: activity.isComplete ? "line-through" : "none",
      opacity: activity.isComplete ? 0.7 : 1,
    }}>
      {activity.isComplete && <CheckCircle size={8} style={{ flexShrink: 0 }} />}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 52 }}>{activity.title}</span>
    </div>
  );
}

function EmptyChip({ onAdd }) {
  return (
    <div onClick={onAdd} style={{
      background: "rgba(255,255,255,0.06)", border: "1.5px dashed rgba(255,255,255,0.22)",
      borderRadius: 7, padding: "5px 4px", fontSize: 16, color: "rgba(255,255,255,0.3)",
      textAlign: "center", cursor: "pointer", minHeight: 34,
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "background 0.15s, border-color 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,208,0,0.12)"; e.currentTarget.style.borderColor = "rgba(255,208,0,0.4)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"; }}
    >+</div>
  );
}

// ─── DAY CARD (turf view) ─────────────────────────────────────────────────────

function DayCard({ dayName, dayIndex, dayData, onAddClick, onToggleActivity, onOpenDetail }) {
  const w = MOCK_WEATHER[dayIndex];
  const activities = dayData?.activities || [];
  const slots = 3;
  const empties = Math.max(0, slots - activities.length);

  return (
    <div
      onClick={() => onOpenDetail(dayName)}
      style={{
        flex: 1, background: "rgba(255,255,255,0.16)",
        backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
        borderRadius: 13, border: "1px solid rgba(255,255,255,0.28)",
        display: "flex", flexDirection: "column",
        padding: "8px 5px 8px", gap: 5, minHeight: 340,
        position: "relative", overflow: "hidden", cursor: "pointer",
        transition: "background 0.15s, transform 0.12s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.22)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.16)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.22)", borderRadius: "13px 13px 0 0" }} />
      <div style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontSize: 10, fontWeight: 900, color: "#fff", textAlign: "center", letterSpacing: "0.5px", textTransform: "uppercase", textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>{DAY_SHORT[dayIndex]}</div>
      <div style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontSize: 17, fontWeight: 900, color: "#fff", textAlign: "center", textShadow: "0 1px 3px rgba(0,0,0,0.4)", lineHeight: 1 }}>
        {dayData?.date ? new Date(dayData.date + "T12:00:00").getDate() : "–"}
      </div>
      <div style={{ height: 1, background: "rgba(255,255,255,0.18)", margin: "0 3px" }} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
        <span style={{ fontSize: 17, lineHeight: 1 }}>{w.emoji}</span>
        <span style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.85)" }}>{w.temp}°F</span>
      </div>
      <div style={{ height: 1, background: "rgba(255,255,255,0.18)", margin: "0 3px" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, padding: "0 2px" }} onClick={e => e.stopPropagation()}>
        {activities.map((act, i) => <ActivityChip key={act.id} activity={act} colorIdx={i} onToggle={(id) => onToggleActivity(dayName, id)} />)}
        {Array.from({ length: empties }).map((_, i) => <EmptyChip key={`e${i}`} onAdd={() => onAddClick(dayName)} />)}
        {activities.length >= slots && <EmptyChip onAdd={() => onAddClick(dayName)} />}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 4, paddingTop: 2 }}>
        {[0, 1].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.1)" }} />)}
      </div>
    </div>
  );
}

// ─── ACTIVITY PLATE (day detail) ──────────────────────────────────────────────

function ActivityPlate({ activity, colorIdx, onToggle }) {
  const c = ACTIVITY_COLORS[colorIdx % ACTIVITY_COLORS.length];
  const done = activity.isComplete;

  return (
    <div style={{
      background: done ? "rgba(46,160,67,0.18)" : "rgba(255,255,255,0.13)",
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      border: `1.5px solid ${done ? "rgba(46,160,67,0.45)" : "rgba(255,255,255,0.25)"}`,
      borderRadius: 14, overflow: "hidden", transition: "all 0.25s ease",
      position: "relative",
    }}>
      {/* Left color bar */}
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 5, background: done ? "#4caf50" : c.plate, borderRadius: "14px 0 0 14px" }} />

      {/* Stud header strip */}
      <div style={{
        background: done ? "rgba(46,160,67,0.25)" : `${c.plate}33`,
        padding: "6px 14px 6px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${done ? "rgba(46,160,67,0.2)" : "rgba(255,255,255,0.12)"}`,
      }}>
        <div style={{ display: "flex", gap: 5 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: done ? "rgba(46,160,67,0.55)" : `${c.plate}88`, border: `1px solid ${done ? "rgba(46,160,67,0.3)" : `${c.plate}55`}` }} />
          ))}
        </div>
        {done && (
          <div style={{ background: "#4caf50", borderRadius: 20, padding: "2px 10px", fontSize: 9, fontWeight: 900, color: "#fff", fontFamily: "'Arial Black', Arial, sans-serif", display: "flex", alignItems: "center", gap: 4, letterSpacing: "0.3px" }}>
            <Trophy size={9} /> MISSION COMPLETE
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "12px 14px 14px 18px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            {/* Title */}
            <div style={{
              fontFamily: "'Arial Black', Arial, sans-serif", fontSize: 17, fontWeight: 900, color: "#fff",
              textShadow: "0 1px 3px rgba(0,0,0,0.4)",
              textDecoration: done ? "line-through" : "none", opacity: done ? 0.65 : 1,
              lineHeight: 1.2, marginBottom: 6,
            }}>{activity.title}</div>

            {/* Meta pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
              {activity.time && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "rgba(255,255,255,0.15)", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.9)", fontFamily: "Arial, sans-serif" }}>
                  <Clock size={10} /> {formatTime(activity.time)}
                </span>
              )}
              {activity.isPaid && activity.cost > 0 && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "rgba(255,208,0,0.2)", border: "1px solid rgba(255,208,0,0.4)", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, color: "#FFD000", fontFamily: "Arial, sans-serif" }}>
                  <DollarSign size={10} /> ${Number(activity.cost).toFixed(2)}
                </span>
              )}
              {activity.isRepeatable && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "rgba(255,255,255,0.1)", borderRadius: 6, padding: "3px 7px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.6)", fontFamily: "Arial, sans-serif" }}>
                  <RotateCcw size={9} /> Weekly
                </span>
              )}
            </div>

            {/* Tags */}
            {activity.tags?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                {activity.tags.map(tag => (
                  <span key={tag} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "2px 8px", fontSize: 10, color: "rgba(255,255,255,0.65)", fontFamily: "Arial, sans-serif" }}>#{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* 2×2 Lego complete toggle */}
          <button
            onClick={() => onToggle(activity.id)}
            title={done ? "Mark incomplete" : "Mark complete"}
            style={{
              width: 48, height: 48, borderRadius: 10, border: "none", cursor: "pointer", flexShrink: 0,
              background: done ? "#4caf50" : "rgba(255,255,255,0.18)",
              borderBottom: `4px solid ${done ? "#2e7d32" : "rgba(0,0,0,0.28)"}`,
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, padding: 9,
              transition: "background 0.2s, border-color 0.2s",
              boxShadow: "0 1px 0 rgba(255,255,255,0.18) inset",
            }}
            onMouseDown={e => { e.currentTarget.style.transform = "scale(0.92) translateY(2px)"; }}
            onMouseUp={e => { e.currentTarget.style.transform = ""; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
          >
            {[0,1,2,3].map(i => (
              <div key={i} style={{ borderRadius: "50%", background: done ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.32)", border: `1px solid ${done ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.18)"}` }} />
            ))}
          </button>
        </div>

        {/* Map + Website buttons — only if links exist */}
        {(activity.mapLink || activity.website) && (
          <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
            {activity.mapLink && (
              <a href={activity.mapLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }} onClick={e => e.stopPropagation()}>
                <LegoBtn color="blue" small><MapPin size={11} /> Map</LegoBtn>
              </a>
            )}
            {activity.website && (
              <a href={activity.website} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }} onClick={e => e.stopPropagation()}>
                <LegoBtn color="green" small><Globe size={11} /> Website</LegoBtn>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DAY DETAIL VIEW ──────────────────────────────────────────────────────────

function DayDetail({ dayName, dayData, dayIndex, onBack, onToggleActivity, onAddClick }) {
  const activities = dayData?.activities || [];
  const dailyCost = activities.reduce((sum, a) => sum + (a.isPaid ? Number(a.cost) || 0 : 0), 0);
  const completed = activities.filter(a => a.isComplete).length;
  const allDone = activities.length > 0 && completed === activities.length;
  const w = MOCK_WEATHER[dayIndex];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, overflowY: "auto", display: "flex", justifyContent: "center" }}>
      {/* Tactical-map / locker-room background */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        background: "#162a1c",
        backgroundImage: `
          radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px),
          linear-gradient(60deg, rgba(0,0,0,0.07) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.07) 75%),
          linear-gradient(120deg, rgba(0,0,0,0.05) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.05) 75%)
        `,
        backgroundSize: "26px 26px, 52px 30px, 52px 30px",
      }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 1, background: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.35) 100%)" }} />

      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 430, display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        {/* ── STICKY HEADER BRICK */}
        <div style={{ background: "#162a1c", borderBottom: "4px solid #0b1a10", position: "sticky", top: 0, zIndex: 10 }}>
          {/* Stud row */}
          <div style={{ background: "#1e3825", padding: "6px 14px", display: "flex", gap: 6 }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.16)", border: "1.5px solid rgba(255,255,255,0.08)" }} />
            ))}
          </div>

          <div style={{ padding: "12px 14px 10px", display: "flex", alignItems: "center", gap: 12 }}>
            {/* 2×2 Red back brick */}
            <button
              onClick={onBack}
              title="Back"
              style={{
                width: 50, height: 50, borderRadius: 10, border: "none", cursor: "pointer", flexShrink: 0,
                background: "#D32F2F", borderBottom: "5px solid #7f1a1a",
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, padding: 9,
                boxShadow: "0 1px 0 rgba(255,255,255,0.15) inset",
                transition: "transform 0.08s",
              }}
              onMouseDown={e => { e.currentTarget.style.transform = "scale(0.92) translateY(3px)"; }}
              onMouseUp={e => { e.currentTarget.style.transform = ""; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
            >
              {[0,1,2,3].map(i => <div key={i} style={{ borderRadius: "50%", background: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.25)" }} />)}
            </button>

            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.45)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 1 }}>Daily Briefing</div>
              <div style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontSize: 28, fontWeight: 900, color: "#fff", textShadow: "0 2px 0 rgba(0,0,0,0.45)", lineHeight: 1, letterSpacing: "-0.5px" }}>{dayName.toUpperCase()}</div>
              <div style={{ fontFamily: "Arial, sans-serif", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{formatDateFull(dayData?.date)}</div>
            </div>

            {/* Weather block */}
            <div style={{ textAlign: "center", background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "8px 12px", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
              <div style={{ fontSize: 24, lineHeight: 1 }}>{w.emoji}</div>
              <div style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontSize: 14, fontWeight: 900, color: "#fff", marginTop: 2 }}>{w.temp}°F</div>
              <div style={{ fontFamily: "Arial, sans-serif", fontSize: 9, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>{w.label}</div>
            </div>
          </div>

          {/* Progress bar */}
          {activities.length > 0 && (
            <div style={{ padding: "0 14px 10px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 3,
                  background: allDone ? "#4caf50" : "#FFD000",
                  width: `${(completed / activities.length) * 100}%`,
                  transition: "width 0.4s ease, background 0.4s",
                }} />
              </div>
              <span style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontSize: 10, fontWeight: 900, color: allDone ? "#4caf50" : "rgba(255,255,255,0.55)", whiteSpace: "nowrap" }}>
                {completed}/{activities.length}
              </span>
            </div>
          )}
        </div>

        {/* ── MISSION ACCOMPLISHED BANNER */}
        {allDone && (
          <div style={{
            margin: "12px 14px 0",
            background: "rgba(46,125,50,0.22)",
            border: "2px solid rgba(76,175,80,0.55)",
            borderRadius: 14, padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 12,
            animation: "pulseGreen 2.5s ease infinite",
          }}>
            <div style={{ fontSize: 32 }}>🏆</div>
            <div>
              <div style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontSize: 15, fontWeight: 900, color: "#4caf50", textShadow: "0 1px 3px rgba(0,0,0,0.5)", letterSpacing: "0.3px" }}>MISSION ACCOMPLISHED!</div>
              <div style={{ fontFamily: "Arial, sans-serif", fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>All {dayName} activities complete 🎉</div>
            </div>
          </div>
        )}

        {/* ── ACTIVITY LIST */}
        <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
          {activities.length === 0 ? (
            <div style={{ background: "rgba(255,255,255,0.06)", border: "2px dashed rgba(255,255,255,0.15)", borderRadius: 16, padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <div style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontSize: 14, fontWeight: 900, color: "rgba(255,255,255,0.45)", marginBottom: 14, textTransform: "uppercase" }}>No Plays Scheduled</div>
              <LegoBtn color="yellow" onClick={() => onAddClick(dayName)}><Plus size={14} /> Add First Activity</LegoBtn>
            </div>
          ) : (
            activities.map((act, i) => (
              <ActivityPlate key={act.id} activity={act} colorIdx={i} onToggle={(id) => onToggleActivity(dayName, id)} />
            ))
          )}
        </div>

        {/* ── DAILY MISSION COST */}
        {dailyCost > 0 && (
          <div style={{ margin: "0 14px 10px" }}>
            <div style={{
              background: "rgba(255,208,0,0.1)", border: "2px solid rgba(255,208,0,0.3)",
              borderRadius: 14, padding: "14px 18px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontSize: 10, fontWeight: 900, color: "rgba(255,208,0,0.8)", letterSpacing: "1px", textTransform: "uppercase" }}>Daily Mission Cost</div>
                <div style={{ fontFamily: "Arial, sans-serif", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                  {activities.filter(a => a.isPaid && a.cost > 0).length} paid {activities.filter(a => a.isPaid && a.cost > 0).length === 1 ? "activity" : "activities"}
                </div>
              </div>
              <div style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontSize: 32, fontWeight: 900, color: "#FFD000", textShadow: "0 2px 0 rgba(0,0,0,0.4)" }}>
                ${dailyCost.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* ── FOOTER */}
        <div style={{
          padding: "10px 14px 20px",
          background: "rgba(0,0,0,0.35)", backdropFilter: "blur(10px)",
          borderTop: "2px solid rgba(255,255,255,0.07)",
          display: "flex", gap: 8,
          position: "sticky", bottom: 0,
        }}>
          <LegoBtn color="red" onClick={onBack} style={{ flex: 1 }}><ChevronLeft size={15} /> Back</LegoBtn>
          <LegoBtn color="yellow" onClick={() => onAddClick(dayName)} style={{ flex: 2 }}><Plus size={15} /> Add Activity</LegoBtn>
        </div>
      </div>

      <style>{`
        @keyframes pulseGreen {
          0%,100% { box-shadow: 0 0 0 0 rgba(76,175,80,0); }
          50%      { box-shadow: 0 0 0 8px rgba(76,175,80,0.1); }
        }
      `}</style>
    </div>
  );
}

// ─── ADD ACTIVITY MODAL ───────────────────────────────────────────────────────

function AddModal({ defaultDay, onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [day, setDay] = useState(defaultDay || DAYS[0]);
  const [time, setTime] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [cost, setCost] = useState("");
  const [website, setWebsite] = useState("");
  const [mapLink, setMapLink] = useState("");
  const [tags, setTags] = useState("");
  const [isRepeatable, setIsRepeatable] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [shake, setShake] = useState(false);

  function handleSave() {
    if (!title.trim()) { setShake(true); setTimeout(() => setShake(false), 500); return; }
    onSave({ id: generateId(), title: title.trim(), day, time, isPaid, cost: isPaid ? parseFloat(cost) || 0 : 0, website: website.trim(), mapLink: mapLink.trim(), tags: tags.split(",").map(t => t.trim()).filter(Boolean), isComplete: false, isRepeatable });
  }

  const inputStyle = { width: "100%", background: "rgba(255,255,255,0.92)", border: "none", borderBottom: "3px solid rgba(0,0,0,0.15)", borderRadius: 8, padding: "9px 12px", fontSize: 14, fontWeight: 700, fontFamily: "'Arial Black', Arial, sans-serif", color: "#1a1a2e", outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontFamily: "'Arial Black', Arial, sans-serif", fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.85)", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 };
  const Toggle = ({ on, toggle }) => (
    <div onClick={toggle} style={{ width: 38, height: 22, borderRadius: 11, background: on ? "#FFD000" : "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.3)", position: "relative", transition: "background 0.2s", cursor: "pointer", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 1, left: on ? 17 : 1, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 8px 8px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "100%", maxWidth: 430, background: "#1565C0", borderRadius: "20px 20px 14px 14px", borderBottom: "6px solid #0a3f7f", overflow: "hidden", animation: shake ? "shake 0.4s ease" : "slideUp 0.25s cubic-bezier(0.34,1.4,0.64,1)", boxShadow: "0 -4px 40px rgba(0,0,0,0.5)" }}>
        <style>{`
          @keyframes slideUp { from{transform:translateY(60px);opacity:0} to{transform:translateY(0);opacity:1} }
          @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
        `}</style>
        <div style={{ background: "#1976D2", padding: "8px 16px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 6 }}>{[0,1,2,3,4,5].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.3)", border: "1.5px solid rgba(255,255,255,0.15)" }} />)}</div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.2)", borderRadius: 6, padding: "3px 6px", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center" }}><X size={14} /></button>
        </div>
        <div style={{ padding: "14px 16px 6px" }}>
          <div style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontSize: 18, fontWeight: 900, color: "#fff", textShadow: "0 2px 0 rgba(0,0,0,0.25)", marginBottom: 14 }}>➕ NEW ACTIVITY</div>
          <div style={{ marginBottom: 11 }}>
            <div style={labelStyle}>📝 Activity Title *</div>
            <input autoFocus style={{ ...inputStyle, borderBottomColor: title ? "rgba(255,208,0,0.8)" : "rgba(0,0,0,0.15)" }} placeholder="e.g. Soccer Practice" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSave()} />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 11 }}>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}><Calendar size={10} /> Day</div>
              <select style={{ ...inputStyle, appearance: "none", cursor: "pointer" }} value={day} onChange={e => setDay(e.target.value)}>{DAYS.map(d => <option key={d} value={d}>{d}</option>)}</select>
            </div>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}><Clock size={10} /> Time</div>
              <input type="time" style={inputStyle} value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: isPaid ? 10 : 14 }}>
            <Toggle on={isPaid} toggle={() => setIsPaid(!isPaid)} />
            <span style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,0.85)", textTransform: "uppercase" }}><DollarSign size={10} style={{ display: "inline" }} /> Paid Activity</span>
          </div>
          {isPaid && (
            <div style={{ marginBottom: 11 }}>
              <div style={labelStyle}><DollarSign size={10} /> Cost ($)</div>
              <input type="number" style={inputStyle} placeholder="0.00" value={cost} onChange={e => setCost(e.target.value)} min="0" step="0.01" />
            </div>
          )}
          <button onClick={() => setExpanded(!expanded)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 800, fontFamily: "'Arial Black', Arial, sans-serif", cursor: "pointer", padding: "0 0 12px", letterSpacing: "0.3px", textTransform: "uppercase" }}>
            {expanded ? "▲ Less details" : "▼ More details (website, map, tags)"}
          </button>
          {expanded && (
            <div style={{ marginBottom: 11, display: "flex", flexDirection: "column", gap: 10 }}>
              <div><div style={labelStyle}><Globe size={10} /> Website URL</div><input style={inputStyle} placeholder="https://..." value={website} onChange={e => setWebsite(e.target.value)} /></div>
              <div><div style={labelStyle}><MapPin size={10} /> Map / Location Link</div><input style={inputStyle} placeholder="https://maps.google.com/..." value={mapLink} onChange={e => setMapLink(e.target.value)} /></div>
              <div><div style={labelStyle}><Tag size={10} /> Tags (comma-separated)</div><input style={inputStyle} placeholder="outdoor, sports, kids" value={tags} onChange={e => setTags(e.target.value)} /></div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <Toggle on={isRepeatable} toggle={() => setIsRepeatable(!isRepeatable)} />
                <span style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,0.85)", textTransform: "uppercase" }}><RotateCcw size={10} style={{ display: "inline" }} /> Repeatable weekly</span>
              </label>
            </div>
          )}
        </div>
        <div style={{ padding: "4px 16px 16px", display: "flex", gap: 8 }}>
          <LegoBtn color="gray" onClick={onClose} style={{ flex: 1 }}><X size={12} /> Cancel</LegoBtn>
          <LegoBtn color="yellow" onClick={handleSave} style={{ flex: 2 }}><Plus size={14} /> SNAP IT IN!</LegoBtn>
        </div>
        <div style={{ background: "#0d4d9e", padding: "7px 16px", display: "flex", gap: 6, justifyContent: "center" }}>
          {[0,1,2,3,4,5,6,7].map(i => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.12)" }} />)}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function ThePlaybook() {
  const [state, setState] = useState(() => loadState() || buildInitialState());
  const [modal, setModal] = useState(null);
  const [view, setView] = useState("week");
  const [detailDay, setDetailDay] = useState(null);
  const [snapAnim, setSnapAnim] = useState(false);

  useEffect(() => {
    try { localStorage.setItem("thePlaybook_v1", JSON.stringify(state)); } catch (e) {}
  }, [state]);

  const activeWeekData = state.weeks[state.activeWeek];
  const weekKeys = Object.keys(state.weeks);
  const activeIdx = weekKeys.indexOf(state.activeWeek);
  const totalActivities = weekKeys.reduce((sum, wk) => sum + Object.values(state.weeks[wk].days).reduce((s, d) => s + (d.activities?.length || 0), 0), 0);
  const completedThisWeek = Object.values(activeWeekData.days).flatMap(d => d.activities || []).filter(a => a.isComplete).length;
  const totalThisWeek = Object.values(activeWeekData.days).flatMap(d => d.activities || []).length;

  const handleAddActivity = useCallback((activity) => {
    const { day, ...rest } = activity;
    setState(prev => {
      const wk = { ...prev.weeks[prev.activeWeek] };
      const dayData = { ...wk.days[day] };
      dayData.activities = [...(dayData.activities || []), rest];
      wk.days = { ...wk.days, [day]: dayData };
      return { ...prev, weeks: { ...prev.weeks, [prev.activeWeek]: wk } };
    });
    snapSound();
    setSnapAnim(true);
    setTimeout(() => setSnapAnim(false), 600);
    setModal(null);
  }, []);

  const handleToggleActivity = useCallback((dayName, actId) => {
    setState(prev => {
      const wk = { ...prev.weeks[prev.activeWeek] };
      const dayData = { ...wk.days[dayName] };
      const act = dayData.activities.find(a => a.id === actId);
      if (act && !act.isComplete) missionSound();
      dayData.activities = dayData.activities.map(a => a.id === actId ? { ...a, isComplete: !a.isComplete } : a);
      wk.days = { ...wk.days, [dayName]: dayData };
      return { ...prev, weeks: { ...prev.weeks, [prev.activeWeek]: wk } };
    });
  }, []);

  // Day detail active
  if (detailDay) {
    return (
      <>
        <DayDetail
          dayName={detailDay}
          dayData={activeWeekData.days[detailDay]}
          dayIndex={DAYS.indexOf(detailDay)}
          onBack={() => setDetailDay(null)}
          onToggleActivity={handleToggleActivity}
          onAddClick={(d) => setModal({ defaultDay: d })}
        />
        {modal && <AddModal defaultDay={modal.defaultDay} onClose={() => setModal(null)} onSave={handleAddActivity} />}
      </>
    );
  }

  // Main turf view
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 0", minHeight: "100vh" }}>
      <style>{`
        @keyframes snapPop { 0%{transform:scale(1)} 30%{transform:scale(1.04)} 60%{transform:scale(0.98)} 100%{transform:scale(1)} }
        * { box-sizing: border-box; }
        input[type=time]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
        select option { background: #1565C0; color: #fff; }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 430, minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", animation: snapAnim ? "snapPop 0.5s ease" : "none" }}>
        {/* Turf bg */}
        <div style={{
          position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 430, height: "100vh", zIndex: 0,
          backgroundImage: `
            repeating-linear-gradient(0deg, rgba(0,0,0,0.07) 0px, rgba(0,0,0,0.07) 10px, transparent 10px, transparent 20px),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.022) 0px, rgba(255,255,255,0.022) 1px, transparent 1px, transparent 40px),
            linear-gradient(180deg, #2e7320 0%, #337a24 12%, #2a6a1c 25%, #337a24 37%, #2a6a1c 50%, #337a24 62%, #2a6a1c 75%, #337a24 87%, #2a6a1c 100%)
          `,
        }} />

        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1 }}>
          {/* Header */}
          <div style={{ padding: "13px 14px 9px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.28)", borderBottom: "2px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 30, height: 30, background: "#FFD000", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, borderBottom: "3px solid #b89200" }}>📋</div>
              <span style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px", textShadow: "0 2px 0 rgba(0,0,0,0.35)" }}>The Playbook</span>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <LegoBtn color="yellow" small><Calendar size={11} /> Month</LegoBtn>
              <LegoBtn color="gray" small><Settings size={12} /></LegoBtn>
            </div>
          </div>

          {/* Week nav */}
          <div style={{ padding: "8px 14px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <LegoBtn color="gray" small disabled={activeIdx === 0} onClick={() => setState(p => ({ ...p, activeWeek: weekKeys[activeIdx - 1] }))}>◀</LegoBtn>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,0.85)", letterSpacing: "0.5px", textTransform: "uppercase" }}>{getWeekRange(activeWeekData)}</div>
              {totalThisWeek > 0 && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", fontWeight: 700, fontFamily: "Arial, sans-serif", marginTop: 1 }}>{completedThisWeek}/{totalThisWeek} done</div>}
            </div>
            <LegoBtn color="gray" small disabled={activeIdx === weekKeys.length - 1} onClick={() => setState(p => ({ ...p, activeWeek: weekKeys[activeIdx + 1] }))}>▶</LegoBtn>
          </div>

          <div style={{ textAlign: "center", fontFamily: "Arial, sans-serif", fontSize: 10, color: "rgba(255,255,255,0.38)", padding: "0 0 3px", letterSpacing: "0.3px" }}>Tap a day for details</div>

          {/* Day cards */}
          <div style={{ padding: "0 8px 10px", display: "flex", gap: 6, flex: 1 }}>
            {DAYS.map((day, i) => (
              <DayCard key={day} dayName={day} dayIndex={i} dayData={activeWeekData.days[day]}
                onAddClick={(d) => setModal({ defaultDay: d })}
                onToggleActivity={handleToggleActivity}
                onOpenDetail={(d) => setDetailDay(d)}
              />
            ))}
          </div>

          {/* Bottom nav */}
          <div style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", borderTop: "2px solid rgba(255,255,255,0.1)", padding: "10px 10px 16px", display: "flex", gap: 7 }}>
            <button onClick={() => setView("week")} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "9px 4px 7px", borderRadius: 10, border: "none", cursor: "pointer", background: view === "week" ? "#1565C0" : "rgba(255,255,255,0.1)", color: "#fff", borderBottom: `4px solid ${view === "week" ? "#0a3f7f" : "rgba(0,0,0,0.25)"}`, fontFamily: "'Arial Black', Arial, sans-serif", fontWeight: 900, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.3px" }}>
              <Calendar size={17} />This Week
            </button>
            <button onClick={() => setModal({ defaultDay: DAYS[0] })} style={{ flex: 1.4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "9px 4px 7px", borderRadius: 10, border: "none", cursor: "pointer", background: "#FFD000", color: "#3a2600", borderBottom: "4px solid #b89200", fontFamily: "'Arial Black', Arial, sans-serif", fontWeight: 900, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.3px" }}>
              <Plus size={19} strokeWidth={3} />Add Activity
            </button>
            <button onClick={() => setView("archive")} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "9px 4px 7px", borderRadius: 10, border: "none", cursor: "pointer", background: view === "archive" ? "#D32F2F" : "rgba(255,255,255,0.1)", color: "#fff", borderBottom: `4px solid ${view === "archive" ? "#7f1a1a" : "rgba(0,0,0,0.25)"}`, fontFamily: "'Arial Black', Arial, sans-serif", fontWeight: 900, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.3px", position: "relative" }}>
              <Archive size={17} />Archive
              {totalActivities > 0 && <div style={{ position: "absolute", top: 6, right: 8, width: 16, height: 16, borderRadius: "50%", background: "#FFD000", color: "#3a2600", fontSize: 9, fontWeight: 900, fontFamily: "'Arial Black', Arial, sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>{totalActivities}</div>}
            </button>
          </div>
        </div>
      </div>

      {modal && <AddModal defaultDay={modal.defaultDay} onClose={() => setModal(null)} onSave={handleAddActivity} />}
    </div>
  );
}
