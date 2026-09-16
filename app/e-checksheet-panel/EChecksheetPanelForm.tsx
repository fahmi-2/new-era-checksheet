// app/e-checksheet-panel/EChecksheetPanelForm.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { useConnection } from "@/lib/connection-context";

import {
  Zap, CheckCircle2, AlertCircle, ChevronRight, Save,
  Calendar, User, ClipboardList, BarChart3, Info,
  ThermometerSun, Volume2, Wind, Sparkles, Gauge,
  ArrowRight, Building2, Shield, Trash2, Edit3, Eye, X,
} from "lucide-react";

// ─── STATIC DATA ─────────────────────────────────────────────────────────────

type MonthGroup = "A" | "B" | "C";

interface AreaConfig {
  key: string;
  label: string;
  group: MonthGroup;
  months: string[];
  panels: PanelConfig[];
}

interface PanelConfig {
  id: string;
  name: string;
}

const AREAS: AreaConfig[] = [
  {
    key: "GENBA-A", label: "Genba A (SUM)", group: "A",
    months: ["Januari", "April", "Juli", "Oktober"],
    panels: [
      { id: "SUM-PP1", name: "PP 1" }, { id: "SUM-PP2", name: "PP 2" }, { id: "SUM-PP3", name: "PP 3" },
      { id: "SUM-PP4", name: "PP 4" }, { id: "SUM-PP41", name: "PP 4.1" }, { id: "SUM-PP5", name: "PP 5" },
      { id: "SUM-PP51", name: "PP 5.1" }, { id: "SUM-PP6", name: "PP 6" }, { id: "SUM-PP61", name: "PP 6.1" },
      { id: "SUM-PP62", name: "PP 6.2" }, { id: "SUM-PP7", name: "PP 7" }, { id: "SUM-PP8", name: "PP 8" },
      { id: "SUM-PP81", name: "PP 8.1" }, { id: "SUM-PP9", name: "PP 9" }, { id: "SUM-PP10", name: "PP 10" },
      { id: "SUM-AC", name: "AC Mezzanine" },
    ],
  },
  {
    key: "EXIM", label: "Genba EXIM", group: "A",
    months: ["Januari", "April", "Juli", "Oktober"],
    panels: [{ id: "EXIM-PP82", name: "PP 8.2" }, { id: "EXIM-PP83", name: "PP 8.3" }, { id: "EXIM-PP84", name: "PP 8.4" }],
  },
  {
    key: "GD-B", label: "Gedung B", group: "B",
    months: ["Februari", "Mei", "Agustus", "November"],
    panels: [
      { id: "GDB-PP1", name: "PP 1" }, { id: "GDB-PP2", name: "PP 2" }, { id: "GDB-PPIG", name: "PP I.G" },
      { id: "GDB-LP1", name: "LP 1" }, { id: "GDB-LP11", name: "LP 1.1" }, { id: "GDB-FEEDER-LP", name: "Feeder LP" },
      { id: "GDB-SDP-LP", name: "SDP-LP" }, { id: "GDB-FEEDER-PP", name: "Feeder PP" }, { id: "GDB-SDP-PP", name: "SDP-PP" },
      { id: "GDB-LP-MEZ", name: "LP Mezzanine" },
    ],
  },
  {
    key: "PH-B", label: "Power House B", group: "B",
    months: ["Februari", "Mei", "Agustus", "November"],
    panels: [
      { id: "PHB-SDP-PP", name: "SDP PP" }, { id: "PHB-SDP-LP", name: "SDP LP" }, { id: "PHB-CAP", name: "Capasitor Bank" },
      { id: "PHB-PLN", name: "PLN" }, { id: "PHB-GENSET", name: "Genset" }, { id: "PHB-COMP", name: "Compressor" },
      { id: "PHB-GND", name: "Main Grounding" },
    ],
  },
  {
    key: "FAN-A", label: "Fan A / PAC Gedung A", group: "B",
    months: ["Februari", "Mei", "Agustus", "November"],
    panels: [
      { id: "FAN-PAC01-IN", name: "P.PAC-01 Incoming" }, { id: "FAN-PAC01-OUT", name: "P.PAC-01 Outgoing" },
      { id: "FAN-PAC02-IN", name: "P.PAC-02 Incoming" }, { id: "FAN-PAC02-OUT", name: "P.PAC-02 Outgoing" },
      { id: "FAN-PAC03-IN", name: "P.PAC-03 Incoming" }, { id: "FAN-PAC03-OUT", name: "P.PAC-03 Outgoing" },
      { id: "FAN-PAC04-IN", name: "P.PAC-04 Incoming" }, { id: "FAN-PAC04-OUT", name: "P.PAC-04 Outgoing" },
      { id: "FAN-PAC05-IN", name: "P.PAC-05 Incoming" }, { id: "FAN-PAC05-OUT", name: "P.PAC-05 Outgoing" },
      { id: "FAN-VRV", name: "P. VRV" },
    ],
  },
  {
    key: "GD-C", label: "Gedung C", group: "C",
    months: ["Maret", "Juni", "September", "Desember"],
    panels: [
      { id: "GDC-KIPAS-A", name: "Kipas A (C Timur)" }, { id: "GDC-KIPAS-B", name: "Kipas B (C Barat)" },
      { id: "GDC-KIPAS-C", name: "Kipas C (C Barat)" }, { id: "GDC-KIPAS-D", name: "Kipas D (C Timur)" },
      { id: "GDC-KIPAS-E", name: "Kipas E (C Timur)" }, { id: "GDC-PAC1-IN", name: "P-PAC.1 Indoor" },
      { id: "GDC-PAC1-OUT", name: "P-PAC.1 Outdoor" }, { id: "GDC-KIPAS-F", name: "Kipas F (C Barat)" },
      { id: "GDC-NEW-AC", name: "New Panel Distribusi AC" }, { id: "GDC-PP-NP1", name: "PP-NP 1" },
      { id: "GDC-PP-NP2", name: "PP-NP 2" }, { id: "GDC-PP-NP3", name: "PP-NP 3" }, { id: "GDC-PP-NP4", name: "PP-NP 4" },
      { id: "GDC-LP-NP1", name: "LP-NP 1" }, { id: "GDC-PP-WLD", name: "PP Welding" },
    ],
  },
  {
    key: "PH-C", label: "Power House C", group: "C",
    months: ["Maret", "Juni", "September", "Desember"],
    panels: [
      { id: "PHC-INCFED", name: "Incoming & Feeder" }, { id: "PHC-ATS-PLN", name: "Incoming ATS & PLN" },
      { id: "PHC-CAP", name: "Capasitor Bank" }, { id: "PHC-GND", name: "Grounding Box" },
      { id: "PHC-PAC05-IN", name: "P.PAC.05 Incoming" }, { id: "PHC-PAC05-OUT", name: "P.PAC.05 Outgoing" },
      { id: "PHC-PAC04-IN", name: "P.PAC.04 Incoming" }, { id: "PHC-PAC04-OUT", name: "P.PAC.04 Outgoing" },
      { id: "PHC-PAC03-IN", name: "P.PAC.03 Incoming" }, { id: "PHC-PAC03-OUT", name: "P.PAC.03 Outgoing" },
      { id: "PHC-PAC02-IN", name: "P.PAC.02 Incoming" }, { id: "PHC-PAC02-OUT", name: "P.PAC.02 Outgoing" },
      { id: "PHC-VRV", name: "P.VRV" }, { id: "PHC-PAC01-IN", name: "P.PAC.01 Incoming" },
      { id: "PHC-PAC01-OUT", name: "P.PAC.01 Outgoing" },
    ],
  },
  {
    key: "AREA-OTHER", label: "Area Lain (SUMP/OLP/dll)", group: "B",
    months: ["Februari", "Mei", "Agustus", "November"],
    panels: [
      { id: "OTH-SUMP1", name: "SUMP 1" }, { id: "OTH-SUMP2", name: "SUMP 2" }, { id: "OTH-SUMP3", name: "SUMP 3" },
      { id: "OTH-SUMP4", name: "SUMP 4" }, { id: "OTH-SUMP5", name: "SUMP 5" }, { id: "OTH-SUMP6", name: "SUMP 6" },
      { id: "OTH-SUMP7", name: "SUMP 7" }, { id: "OTH-SUMPM", name: "SUMP Main" }, { id: "OTH-SUMPCP", name: "SUMP Control Panel" },
      { id: "OTH-OLP1", name: "LP OLP 1" }, { id: "OTH-OLP2", name: "LP OLP 2" }, { id: "OTH-KANTIN", name: "LP Kantin" },
      { id: "OTH-AC-KNT", name: "AC Kantin" }, { id: "OTH-DPWELL", name: "PP Deep Well (ABT)" }, { id: "OTH-STP", name: "STP (IPAL)" },
      { id: "OTH-WTP1", name: "WTP 1 (IPAL)" }, { id: "OTH-WTP2", name: "WTP 2 (IPAL)" }, { id: "OTH-GUARD", name: "LP Guard" },
      { id: "OTH-WRKSHP", name: "LP Workshop" }, { id: "OTH-SEGI", name: "PP Segitiga Box" }, { id: "OTH-LOCKER", name: "LP Locker" },
      { id: "OTH-PORTAL", name: "PP Portal EXIM" }, { id: "OTH-MOTO", name: "LP Motor Cycle" }, { id: "OTH-AUDI", name: "LP Auditorium" },
      { id: "OTH-OFFICE", name: "LP Office" }, { id: "OTH-COMP", name: "PP Computer" }, { id: "OTH-MTC", name: "PP MTC-Office" },
      { id: "OTH-LP4", name: "LP 4" }, { id: "OTH-JIGP1", name: "LP Jig Proto-1" }, { id: "OTH-JIGP2", name: "LP Jig Proto-2" },
      { id: "OTH-TRAIN", name: "LP Training" }, { id: "OTH-WTP", name: "PP WTP" }, { id: "OTH-POMPA", name: "PP Pompa Gardu PLN" },
      { id: "OTH-UTLOFF", name: "PP Office Utility" },
    ],
  },
];

// ─── TYPES ────────────────────────────────────────────────────────────────────

type SymbolValue = "O" | "X" | "";

interface PanelReading {
  panelId: string;
  temp: string;
  bau: SymbolValue;
  suara: SymbolValue;
  fiveS: SymbolValue;
  tegOut3Phase: string;
  tegOut1Phase: string;
  arusR: string;
  arusS: string;
  arusT: string;
  catatan: string;
}

interface InspectionSession {
  id: string;
  areaKey: string;
  areaLabel: string;
  month: string;
  year: number;
  readings: PanelReading[];
  tgl: string;
  picCheck: string;
  spvFrm?: string;
  savedAt: number;
  updatedAt?: string;
  isEdited?: boolean;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const getNowDateTimeString = () => {
  const now = new Date();
  return now.toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).replace(/\./g, ":");
};

const mkId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const mkReading = (panelId: string): PanelReading => ({
  panelId, temp: "", bau: "", suara: "", fiveS: "",
  tegOut3Phase: "", tegOut1Phase: "", arusR: "", arusS: "", arusT: "", catatan: "",
});

const isReadingFilled = (r: PanelReading) =>
  Boolean(r.temp || r.bau || r.suara || r.fiveS || r.tegOut3Phase || r.tegOut1Phase || r.arusR);

const isReadingNg = (r: PanelReading): boolean => {
  const tempNg = Boolean(r.temp && !isNaN(Number(r.temp)) && Number(r.temp) > 65);
  const qualNg = r.bau === "X" || r.suara === "X" || r.fiveS === "X";
  const teg3Ng = Boolean(
    r.tegOut3Phase &&
    !isNaN(Number(r.tegOut3Phase)) &&
    (Number(r.tegOut3Phase) < 380 || Number(r.tegOut3Phase) > 415)
  );
  const teg1Ng = Boolean(
    r.tegOut1Phase &&
    !isNaN(Number(r.tegOut1Phase)) &&
    (Number(r.tegOut1Phase) < 220 || Number(r.tegOut1Phase) > 240)
  );
  return tempNg || qualNg || teg3Ng || teg1Ng;
};

// Klasifikasi NG spesifik per item check
export interface NgClassification {
  tempHigh: number;      // Suhu Tinggi (> 65°C)
  odorHangus: number;    // Bau Hangus / Abnormal
  noiseAbnormal: number; // Suara Bising / Arcing
  fiveSAbnormal: number; // 5S / Kebersihan Kotor
  volt3Phase: number;    // Tegangan 3 Phase Di Luar Standar (bukan 380-415V)
  volt1Phase: number;    // Tegangan 1 Phase Di Luar Standar (bukan 220-240V)
}

export const NG_CATEGORIES: { key: keyof NgClassification; label: string; desc: string; color: string }[] = [
  { key: "tempHigh", label: "Suhu Tinggi (>65°C)", desc: "Suhu panel melebihi batas aman 65°C", color: "#ef4444" },
  { key: "odorHangus", label: "Bau Hangus / Terbakar", desc: "Tercium bau hangus atau isolasi terbakar", color: "#f97316" },
  { key: "noiseAbnormal", label: "Suara Bising / Arcing", desc: "Suara dengung keras atau percikan listrik", color: "#eab308" },
  { key: "fiveSAbnormal", label: "5S Kotor / Terbuka", desc: "Panel kotor, berdebu, atau tidak tertutup rapat", color: "#8b5cf6" },
  { key: "volt3Phase", label: "Tegangan 3Φ Abnormal", desc: "Tegangan 3 Phase di luar toleransi (380–415V)", color: "#2563eb" },
  { key: "volt1Phase", label: "Tegangan 1Φ Abnormal", desc: "Tegangan 1 Phase di luar toleransi (220–240V)", color: "#06b6d4" },
];

export const classifyReadingNg = (r: PanelReading): (keyof NgClassification)[] => {
  const flags: (keyof NgClassification)[] = [];
  if (r.temp && !isNaN(Number(r.temp)) && Number(r.temp) > 65) flags.push("tempHigh");
  if (r.bau === "X") flags.push("odorHangus");
  if (r.suara === "X") flags.push("noiseAbnormal");
  if (r.fiveS === "X") flags.push("fiveSAbnormal");
  if (r.tegOut3Phase && !isNaN(Number(r.tegOut3Phase)) && (Number(r.tegOut3Phase) < 380 || Number(r.tegOut3Phase) > 415)) {
    flags.push("volt3Phase");
  }
  if (r.tegOut1Phase && !isNaN(Number(r.tegOut1Phase)) && (Number(r.tegOut1Phase) < 220 || Number(r.tegOut1Phase) > 240)) {
    flags.push("volt1Phase");
  }
  return flags;
};

// Persentase OK: (Panel terisi yang tidak NG) / (Total panel) * 100%
// Jika ada panel NG, persentase belum bisa 100% hingga sesi diedit dan semua kondisi NG teratasi
const sessionPct = (s: InspectionSession) => {
  if (!s.readings.length) return 0;
  const okCount = s.readings.filter(r => isReadingFilled(r) && !isReadingNg(r)).length;
  return Math.round((okCount / s.readings.length) * 100);
};

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const CURRENT_MONTH = new Date().toLocaleDateString("id-ID", { month: "long" });
const CURRENT_YEAR = new Date().getFullYear();

const GROUP_COLOR: Record<MonthGroup, { bg: string; ring: string; text: string; bar: string }> = {
  A: { bg: "#eff6ff", ring: "#bfdbfe", text: "#1d4ed8", bar: "#3b82f6" },
  B: { bg: "#f0fdf4", ring: "#bbf7d0", text: "#15803d", bar: "#22c55e" },
  C: { bg: "#fdf4ff", ring: "#e9d5ff", text: "#7e22ce", bar: "#a855f7" },
};

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
  .panel-page { min-height:100vh; background:#f1f5f9; font-family:'Segoe UI',sans-serif; }
  .panel-main { margin-left:280px; min-width:0; transition:margin-left .3s; }
  @media (min-width:481px) and (max-width:1024px){ .panel-main{margin-left:240px;} }
  @media (max-width:480px){ .panel-main{margin-left:0!important;padding-top:56px;} }
  .sidebar-container.collapsed ~ .panel-main,
  body:has(.sidebar-container.collapsed) .panel-main { margin-left:80px; }
  .panel-inner { max-width:1100px; margin:0 auto; padding:20px 18px 56px; }
  @media (max-width:640px){ .panel-inner{padding:12px 10px 56px;} }

  .p-card { background:#fff; border:1px solid #e2e8f0; border-radius:14px; box-shadow:0 1px 6px rgba(0,0,0,.05); }

  .area-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:12px; }
  .area-btn { display:flex; flex-direction:column; gap:10px; padding:16px;
    border:1.5px solid #e2e8f0; border-radius:12px; background:#fff;
    cursor:pointer; text-align:left; font-family:inherit; transition:all .15s; }
  .area-btn:hover { border-color:#93c5fd; background:#eff6ff; box-shadow:0 2px 10px rgba(37,99,235,.08); }

  .insp-table { width:100%; border-collapse:collapse; font-size:13px; }
  .insp-table th { background:#f8fafc; color:#475569; font-weight:700;
    padding:9px 12px; border:1px solid #e2e8f0; white-space:nowrap; text-align:center; }
  .insp-table th.left { text-align:left; }
  .insp-table td { padding:6px 8px; border:1px solid #e8edf2; vertical-align:middle; }
  .insp-table tr:nth-child(even) td { background:#fafbfc; }
  .insp-table tr:hover td { background:#f0f9ff; }
  .insp-table td.panel-name { font-weight:600; color:#1e293b; white-space:nowrap;
    background:#f8fafc!important; padding:8px 12px; min-width:160px; }
  .insp-table td.no-cell { text-align:center; color:#94a3b8; width:36px;
    background:#f8fafc!important; font-weight:600; }

  .num-in { width:64px; padding:5px 7px; border:1px solid #e2e8f0; border-radius:7px;
    font-size:13px; text-align:center; outline:none; font-family:inherit;
    background:#f8fafc; color:#1e293b; box-sizing:border-box; }
  .num-in:focus { border-color:#3b82f6; background:#fff; box-shadow:0 0 0 2px rgba(59,130,246,.15); }
  .txt-in { width:100%; min-width:90px; padding:5px 8px; border:1px solid #e2e8f0;
    border-radius:7px; font-size:12px; outline:none; font-family:inherit;
    background:#f8fafc; color:#1e293b; box-sizing:border-box; }
  .txt-in:focus { border-color:#3b82f6; background:#fff; box-shadow:0 0 0 2px rgba(59,130,246,.15); }
  .note-in { width:100%; min-width:120px; padding:4px 8px; border:1px solid #e2e8f0;
    border-radius:7px; font-size:12px; outline:none; font-family:inherit;
    background:#f8fafc; color:#1e293b; box-sizing:border-box; }
  .note-in:focus { border-color:#3b82f6; background:#fff; }

  .sym-group { display:flex; gap:4px; justify-content:center; }
  .sym-btn { width:32px; height:28px; border:1.5px solid #e2e8f0; border-radius:7px;
    font-size:13px; font-weight:700; cursor:pointer; background:#f8fafc; color:#94a3b8;
    font-family:inherit; transition:all .12s; display:flex; align-items:center; justify-content:center; }
  .sym-btn:hover { border-color:#94a3b8; color:#475569; }
  .sym-btn.ok  { background:#dcfce7; border-color:#86efac; color:#15803d; }
  .sym-btn.nok { background:#fee2e2; border-color:#fca5a5; color:#b91c1c; }
  .sym-btn.rep { background:#fef3c7; border-color:#fcd34d; color:#b45309; }

  .foot-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  @media (max-width:640px){ .foot-grid{grid-template-columns:1fr;} }
  .foot-field { display:flex; flex-direction:column; gap:6px; }
  .foot-label { font-size:11px; font-weight:700; color:#94a3b8; letter-spacing:.06em; }
  .foot-input { padding:9px 12px; border:1px solid #e2e8f0; border-radius:9px;
    font-size:13px; font-weight:600; color:#1e293b; background:#f8fafc;
    outline:none; font-family:inherit; transition:border-color .15s,box-shadow .15s; }
  .foot-input:focus { border-color:#3b82f6; background:#fff; box-shadow:0 0 0 3px rgba(59,130,246,.12); }

  .th-temp  { background:#fff7ed!important; color:#c2410c!important; }
  .th-qual  { background:#f0fdf4!important; color:#15803d!important; }
  .th-teg   { background:#eff6ff!important; color:#1d4ed8!important; }
  .th-arus  { background:#fdf4ff!important; color:#7e22ce!important; }
  .th-note  { background:#f8fafc!important; color:#475569!important; }

  /* ─── PERUBAHAN TAB BUTTON DI SINI ─── */
  .tab-btn { 
    padding: 8px 18px; 
    border: 1px solid rgba(255,255,255,0.2); 
    border-radius: 8px; 
    font-size: 13px;
    font-weight: 600; 
    cursor: pointer; 
    font-family: inherit; 
    transition: all .2s ease;
    display: flex; 
    align-items: center; 
    gap: 6px; 
  }
  .tab-btn.active { 
    background: #ffffff; 
    color: #1d4ed8; 
    border-color: #ffffff; 
    box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
  }
  .tab-btn.inactive { 
    background: rgba(255,255,255,0.1); 
    color: #bfdbfe; 
  }
  .tab-btn.inactive:hover { 
    background: rgba(255,255,255,0.25); 
    color: #ffffff; 
    border-color: rgba(255,255,255,0.4); 
  }

  .save-btn { display:flex; align-items:center; gap:8px; padding:11px 26px;
    border:none; border-radius:10px; font-size:14px; font-weight:700;
    cursor:pointer; font-family:inherit; transition:all .15s; }
  .save-btn:not(:disabled) { background:#1d4ed8; color:#fff; box-shadow:0 2px 10px rgba(29,78,216,.3); }
  .save-btn:not(:disabled):hover { background:#1e40af; }
  .save-btn:disabled { background:#e2e8f0; color:#94a3b8; cursor:not-allowed; }

  .back-btn { display:flex; align-items:center; gap:5px; padding:8px 14px;
    border:1px solid #e2e8f0; border-radius:9px; background:#fff; color:#475569;
    font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; }
  .back-btn:hover { background:#f8fafc; }

  .prog-pill { display:inline-block; padding:3px 11px; border-radius:999px; font-weight:700;
    font-size:12px; white-space:nowrap; font-variant-numeric:tabular-nums; }

  .sum-table { width:100%; border-collapse:collapse; font-size:13px; }
  .sum-table th { background:#f8fafc; color:#475569; font-weight:700;
    padding:9px 14px; border:1px solid #e2e8f0; text-align:left; }
  .sum-table td { padding:9px 14px; border:1px solid #e2e8f0; color:#334155; }
  .sum-table tr:nth-child(even) td { background:#fafbfc; }

  .legend { display:flex; gap:14px; flex-wrap:wrap; }
  .leg-item { display:flex; align-items:center; gap:6px; font-size:12px; color:#475569; }
  .leg-sym { width:26px; height:24px; border-radius:6px; display:flex; align-items:center;
    justify-content:center; font-weight:700; font-size:13px; }

  .month-chip { display:inline-flex; align-items:center; gap:5px; padding:3px 10px;
    border-radius:999px; font-size:11px; font-weight:700; border:1px solid; white-space:nowrap; }

  .scan-warn { padding:10px 14px; background:#fefce8; border:1px solid #fde047;
    border-radius:9px; display:flex; align-items:center; gap:8px;
    font-size:12px; color:#854d0e; }

  .hist-row { display:flex; align-items:center; gap:14px; padding:12px 20px;
    border-bottom:1px solid #f8fafc; }
  .hist-row:last-child { border-bottom:none; }

  .act-btn { display:inline-flex; align-items:center; gap:5px; padding:6px 12px;
    border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; font-family:inherit;
    transition:all .15s; text-decoration:none; line-height:1.2; }
  .act-btn-detail { background:#f1f5f9; border:1px solid #cbd5e1; color:#334155; }
  .act-btn-detail:hover { background:#e2e8f0; color:#0f172a; }
  .act-btn-edit { background:#eff6ff; border:1px solid #bfdbfe; color:#1d4ed8; }
  .act-btn-edit:hover { background:#dbeafe; color:#1e40af; }
  .act-btn-del { background:#fef2f2; border:1px solid #fecaca; color:#dc2626; }
  .act-btn-del:hover { background:#fee2e2; color:#b91c1c; }
`;

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────

function ProgPill({ v }: { v: number }) {
  const bg = v === 100 ? "#d1fae5" : v > 60 ? "#dbeafe" : v > 0 ? "#fef3c7" : "#f1f5f9";
  const color = v === 100 ? "#065f46" : v > 60 ? "#1e40af" : v > 0 ? "#92400e" : "#6b7280";
  return <span className="prog-pill" style={{ background: bg, color }}>{v}%</span>;
}

function Bar({ v, color = "#3b82f6", h = 4 }: { v: number; color?: string; h?: number }) {
  return <div style={{ background: "#e2e8f0", borderRadius: 999, height: h, overflow: "hidden" }}>
    <div style={{ width: `${v}%`, height: "100%", background: color, borderRadius: 999, transition: "width .5s" }} />
  </div>;
}

function SymBtn({
  label, current, value, activeClass, onClick,
}: {
  label: string; current: string; value: SymbolValue; activeClass: string; onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`sym-btn ${current === value ? activeClass : ""}`}
      onClick={onClick}
      title={value === "O" ? "OK/Normal" : value === "X" ? "Abnormal" : ""}
    >
      {label}
    </button>
  );
}

function SymbolCell({
  value, onChange,
}: {
  value: SymbolValue;
  onChange: (v: SymbolValue) => void;
}) {
  const toggle = (v: SymbolValue) => onChange(value === v ? "" : v);
  return (
    <div className="sym-group">
      <SymBtn label="O" current={value} value="O" activeClass="ok" onClick={() => toggle("O")} />
      <SymBtn label="X" current={value} value="X" activeClass="nok" onClick={() => toggle("X")} />
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

type Page = "form" | "history";

export function EChecksheetPanelForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading: authLoading, isInitialized } = useAuth();
  const { isOnline } = useConnection();

  // Verifikasi scan per area (bukan global)
  // QR panel membawa ?areaKey=GENBA-A&_scanned=true sehingga saat halaman pertama load,
  // jika areaKey cocok dengan selArea dan _scanned=true, langsung terverifikasi.
  const urlAreaKey = params.get("areaKey") || "";
  const urlScanned = params.get("_scanned") === "true";
  const isAdminUser = !!(user && ["admin", "superadmin"].includes(user.role));
  const [isVerifiedForArea, setIsVerifiedForArea] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!mounted || !isInitialized || authLoading) return;
    if (!user || !isAuthorizedForChecksheet(user))
      setTimeout(() => { if (!user || !isAuthorizedForChecksheet(user)) router.push("/login-page"); }, 1500);
  }, [user, authLoading, isInitialized, router, mounted]);

  const [page, setPage] = useState<Page>("form");
  const [selArea, setSelArea] = useState<AreaConfig | null>(null);
  const [selMonth, setSelMonth] = useState("");
  const [selYear, setSelYear] = useState(CURRENT_YEAR);
  const [readings, setReadings] = useState<PanelReading[]>([]);
  const [tgl, setTgl] = useState("");
  const [picCheck, setPicCheck] = useState("");
  const [sessions, setSessions] = useState<InspectionSession[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // State untuk Detail, Edit, Hapus Riwayat
  const [viewingSession, setViewingSession] = useState<InspectionSession | null>(null);
  const [editingSession, setEditingSession] = useState<InspectionSession | null>(null);
  const [editReadings, setEditReadings] = useState<PanelReading[]>([]);
  const [deletingSession, setDeletingSession] = useState<InspectionSession | null>(null);

  const topRef = useRef<HTMLDivElement>(null);

  // Load data inspeksi panel dari database
  const loadSessionsFromDb = async () => {
    try {
      setIsLoadingSessions(true);
      const res = await fetch(`/e-checksheet-ga/api/panel/inspections?_t=${Date.now()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSessions(json.data);
      }
    } catch (err) {
      console.error("Gagal memuat data inspeksi panel:", err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadSessionsFromDb();
  }, []);

  // Otomatis update PIC Check sesuai nama lengkap user
  useEffect(() => {
    if (user?.fullName) {
      setPicCheck(user.fullName);
    }
  }, [user]);

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const goToArea = (area: AreaConfig, month: string) => {
    setSelArea(area);
    setSelMonth(month);
    setReadings(area.panels.map(p => mkReading(p.id)));
    setTgl(getNowDateTimeString());
    setPicCheck(user?.fullName || "");
    // Auto-verifikasi jika area cocok dengan URL QR atau user adalah admin
    const verifiedByQR = urlScanned && urlAreaKey === area.key;
    setIsVerifiedForArea(verifiedByQR || isAdminUser);
    scrollTop();
  };

  // Jika halaman dimuat langsung dari QR link (URL sudah ada areaKey), buka area langsung
  useEffect(() => {
    if (urlAreaKey && urlScanned) {
      const targetArea = AREAS.find(a => a.key === urlAreaKey);
      if (targetArea) {
        goToArea(targetArea, CURRENT_MONTH);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlAreaKey, urlScanned]);

  const resetForm = () => {
    setSelArea(null); setSelMonth(""); setReadings([]);
    setTgl(""); setPicCheck(user?.fullName || "");
    scrollTop();
  };

  const updR = (panelId: string, patch: Partial<PanelReading>) =>
    setReadings(prev => prev.map(r => r.panelId === panelId ? { ...r, ...patch } : r));

  const filledCount = readings.filter(isReadingFilled).length;
  const formPct = readings.length ? Math.round((filledCount / readings.length) * 100) : 0;

  // Validasi NG: jika panel ada kondisi NG, catatan wajib diisi
  const unannotatedNgPanels = readings.filter(r => isReadingFilled(r) && isReadingNg(r) && !r.catatan?.trim());
  const hasUnannotatedNg = unannotatedNgPanels.length > 0;

  const canSave = isVerifiedForArea && selArea && selMonth && filledCount > 0 && tgl && picCheck && !hasUnannotatedNg;

  const handlePreview = () => setShowPreview(true);
  const handleSave = async () => {
    if (!selArea) return;
    setIsSaving(true);
    setShowPreview(false);
    const newId = mkId();
    const session: InspectionSession = {
      id: newId,
      areaKey: selArea.key,
      areaLabel: selArea.label,
      month: selMonth,
      year: selYear,
      readings: readings.map(r => ({ ...r })),
      tgl: tgl || getNowDateTimeString(),
      picCheck: picCheck || user?.fullName || "-",
      savedAt: Date.now(),
    };

    try {
      const res = await fetch("/e-checksheet-ga/api/panel/inspections/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(session),
      });
      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        alert(resJson.message || "Gagal menyimpan ke database!");
        return;
      }
      await loadSessionsFromDb();
      resetForm();
    } catch (err) {
      console.error("Error saving panel inspection:", err);
      alert("Terjadi kesalahan jaringan saat menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handler Edit Sesi Riwayat
  const handleOpenEdit = (s: InspectionSession) => {
    setEditingSession(s);
    setEditReadings(s.readings.map(r => ({ ...r })));
  };

  const updEditR = (panelId: string, patch: Partial<PanelReading>) => {
    setEditReadings(prev => prev.map(r => r.panelId === panelId ? { ...r, ...patch } : r));
  };

  const editNgUnannotated = editReadings.filter(r => isReadingFilled(r) && isReadingNg(r) && !r.catatan?.trim());
  const canSaveEdit = editReadings.filter(isReadingFilled).length > 0 && editNgUnannotated.length === 0;

  const handleSaveEdit = async () => {
    if (!editingSession) return;
    try {
      const res = await fetch("/e-checksheet-ga/api/panel/inspections/edit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingSession.id,
          readings: editReadings,
        }),
      });
      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        alert(resJson.message || "Gagal memperbarui data di database");
        return;
      }
      await loadSessionsFromDb();
      setEditingSession(null);
      setEditReadings([]);
    } catch (err) {
      console.error("Error editing panel inspection:", err);
      alert("Terjadi kesalahan jaringan saat mengubah data.");
    }
  };

  // Handler Hapus Sesi Riwayat
  const handleDeleteSession = async () => {
    if (!deletingSession) return;
    try {
      const res = await fetch("/e-checksheet-ga/api/panel/inspections/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingSession.id }),
      });
      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        alert(resJson.message || "Gagal menghapus data dari database");
        return;
      }
      await loadSessionsFromDb();
      setDeletingSession(null);
    } catch (err) {
      console.error("Error deleting panel inspection:", err);
      alert("Terjadi kesalahan jaringan saat menghapus data.");
    }
  };

  const totalSessions = sessions.length;
  // Persentase OK rata-rata seluruh sesi
  const avgPct = sessions.length
    ? Math.round(sessions.map(sessionPct).reduce((a, b) => a + b, 0) / sessions.length) : 0;

  // Total panel dicek & total panel OK
  const allReadings = sessions.flatMap(s => s.readings.filter(isReadingFilled));
  const totalReadingsChecked = allReadings.length;
  const totalReadingsNg = allReadings.filter(isReadingNg).length;
  const totalReadingsOk = totalReadingsChecked - totalReadingsNg;

  // Filter tahun dan bulan untuk grafik / rekap NG pada Summary
  const [historyYear, setHistoryYear] = useState(CURRENT_YEAR);
  const [historyMonthFilter, setHistoryMonthFilter] = useState<string>(""); // "" = semua bulan

  // Filter sesi sesuai tahun & bulan yang dipilih
  const filteredSessions = sessions.filter(s => {
    const matchYear = s.year === historyYear;
    const matchMonth = !historyMonthFilter || s.month === historyMonthFilter;
    return matchYear && matchMonth;
  });

  // Kalkulasi agregasi NG per bulan (12 bulan) untuk tahun terpilih
  const monthlyNgRows = NG_CATEGORIES.map(cat => {
    const perMonth = MONTH_NAMES.map(mName => {
      // Cari sesi di bulan & tahun ini
      const matching = sessions.filter(s => s.year === historyYear && s.month === mName);
      let count = 0;
      matching.forEach(s => {
        s.readings.filter(isReadingFilled).forEach(r => {
          const flags = classifyReadingNg(r);
          if (flags.includes(cat.key)) count++;
        });
      });
      return count;
    });
    const totalYear = perMonth.reduce((a, b) => a + b, 0);
    return { ...cat, perMonth, totalYear };
  });

  // Total NG per bulan (semua kategori dijumlahkan)
  const monthlyTotalNg = MONTH_NAMES.map((_, mIdx) => {
    return monthlyNgRows.reduce((sum, r) => sum + r.perMonth[mIdx], 0);
  });
  const overallTotalNgYear = monthlyNgRows.reduce((sum, r) => sum + r.totalYear, 0);

  // Rekap NG untuk filter bulan aktif (atau setahun jika tidak pilih filter bulan)
  const currentFilteredNgCounts: Record<keyof NgClassification, number> = {
    tempHigh: 0,
    odorHangus: 0,
    noiseAbnormal: 0,
    fiveSAbnormal: 0,
    volt3Phase: 0,
    volt1Phase: 0,
  };

  filteredSessions.forEach(s => {
    s.readings.filter(isReadingFilled).forEach(r => {
      const flags = classifyReadingNg(r);
      flags.forEach(f => {
        currentFilteredNgCounts[f] = (currentFilteredNgCounts[f] || 0) + 1;
      });
    });
  });

  const totalFilteredNg = Object.values(currentFilteredNgCounts).reduce((a, b) => a + b, 0);

  const panelOf = (id: string) =>
    AREAS.flatMap(a => a.panels).find(p => p.id === id)?.name ?? id;

  const areasByGroup: Record<MonthGroup, AreaConfig[]> = { A: [], B: [], C: [] };
  AREAS.forEach(a => areasByGroup[a.group].push(a));

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="panel-page">
      <style>{CSS}</style>
      <Sidebar userName={user?.fullName} />

      <main className="panel-main">
        <div ref={topRef} className="panel-inner">

          {/* ── HEADER ──────────────────────────────────────────────────── */}
          <div className="p-card" style={{ marginBottom: 14, overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(135deg,#1e3a5f 0%,#1d4ed8 60%,#4f46e5 100%)", padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 11, background: "rgba(255,255,255,.15)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    <Zap size={22} color="#fff" />
                  </div>
                  <div>
                    <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-.02em" }}>
                      Checksheet Pengecekan Panel
                    </h1>
                    <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(255,255,255,.65)" }}>
                      PT Jatim Autocomp Indonesia · PGA Dept. Utility
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className={`tab-btn ${page === "form" ? "active" : "inactive"}`}
                    onClick={() => setPage("form")} style={{ fontSize: 12 }}>
                    <ClipboardList size={13} /> Form
                  </button>
                  <button className={`tab-btn ${page === "history" ? "active" : "inactive"}`}
                    onClick={() => setPage("history")} style={{ fontSize: 12, position: "relative" }}>
                    <BarChart3 size={13} /> Riwayat
                    {sessions.length > 0 && (
                      <span style={{
                        position: "absolute", top: -5, right: -5, width: 16, height: 16,
                        borderRadius: "50%", background: "#ef4444", color: "#fff",
                        fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        {sessions.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 14 }}>
                {[
                  { label: "Area", val: AREAS.length },
                  { label: "Panel", val: AREAS.reduce((s, a) => s + a.panels.length, 0) },
                  { label: "Tersimpan", val: totalSessions },
                  { label: "Avg. OK", val: `${avgPct}%` },
                ].map(s => (
                  <div key={s.label} style={{
                    background: "rgba(255,255,255,.1)", borderRadius: 9,
                    padding: "9px 6px", textAlign: "center"
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,.55)", marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              padding: "12px 24px", borderTop: "1px solid #f1f5f9",
              display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap"
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>SIMBOL:</span>
              <div className="legend">
                {[
                  { sym: "O", cls: "ok", label: "OK / Normal", bg: "#dcfce7", border: "#86efac", tc: "#15803d" },
                  { sym: "X", cls: "nok", label: "Abnormal (perlu tindakan)", bg: "#fee2e2", border: "#fca5a5", tc: "#b91c1c" },

                ].map(l => (
                  <div key={l.sym} className="leg-item">
                    <div className="leg-sym" style={{ background: l.bg, border: `1.5px solid ${l.border}`, color: l.tc }}>
                      {l.sym}
                    </div>
                    <span>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              RIWAYAT PAGE
          ══════════════════════════════════════════════════════════════ */}
          {page === "history" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* ── Filter Riwayat (Tahun & Bulan) ── */}
              <div className="p-card" style={{ padding: "14px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Calendar size={15} color="#1d4ed8" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Tahun Riwayat:</span>
                      <select
                        value={historyYear}
                        onChange={e => setHistoryYear(+e.target.value)}
                        style={{
                          padding: "5px 12px", border: "1px solid #cbd5e1", borderRadius: 8,
                          fontSize: 13, fontWeight: 700, color: "#1e293b", background: "#f8fafc",
                          outline: "none", fontFamily: "inherit"
                        }}
                      >
                        {[CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: "#64748b" }}>Filter Bulan:</span>
                      <select
                        value={historyMonthFilter}
                        onChange={e => setHistoryMonthFilter(e.target.value)}
                        style={{
                          padding: "5px 12px", border: "1px solid #cbd5e1", borderRadius: 8,
                          fontSize: 13, fontWeight: 600, color: "#1e293b", background: "#fff",
                          outline: "none", fontFamily: "inherit"
                        }}
                      >
                        <option value="">— Semua Bulan —</option>
                        {MONTH_NAMES.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      {historyMonthFilter && (
                        <button
                          type="button"
                          onClick={() => setHistoryMonthFilter("")}
                          style={{
                            padding: "4px 8px", border: "1px solid #e2e8f0", borderRadius: 6,
                            background: "#f1f5f9", fontSize: 11, color: "#64748b", cursor: "pointer"
                          }}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#64748b" }}>
                    <span>Panel Dicek: <b style={{ color: "#1e293b" }}>{totalReadingsChecked}</b></span>
                    <span>·</span>
                    <span style={{ color: "#16a34a" }}>OK: <b>{totalReadingsOk}</b></span>
                    <span>·</span>
                    <span style={{ color: "#dc2626" }}>NG: <b>{totalReadingsNg}</b></span>
                  </div>
                </div>
              </div>

              {/* ── GRAFIK & KLASIFIKASI TEMUAN NG PER BULAN ── */}
              <div className="p-card" style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, background: "#fee2e2",
                      border: "1px solid #fca5a5", display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <AlertCircle size={17} color="#dc2626" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#1e293b" }}>
                        Grafik & Analisis Temuan NG per Item Check ({historyYear})
                      </div>
                      <div style={{ fontSize: 11.5, color: "#94a3b8" }}>
                        Distribusi abnormal panel per bulan berdasarkan kriteria pengecekan
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: "3px 12px", borderRadius: 999,
                    background: overallTotalNgYear > 0 ? "#fee2e2" : "#dcfce7",
                    color: overallTotalNgYear > 0 ? "#dc2626" : "#16a34a",
                    fontWeight: 700, fontSize: 11.5, border: "1px solid"
                  }}>
                    {overallTotalNgYear > 0 ? `${overallTotalNgYear} Total NG Tahun ${historyYear}` : "0 NG (Semua Normal)"}
                  </div>
                </div>

                {/* Ringkasan Cards Kategori NG */}
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: 10, marginBottom: 18
                }}>
                  {NG_CATEGORIES.map(cat => {
                    const cnt = historyMonthFilter
                      ? currentFilteredNgCounts[cat.key]
                      : monthlyNgRows.find(r => r.key === cat.key)?.totalYear || 0;
                    return (
                      <div key={cat.key} style={{
                        padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0",
                        background: cnt > 0 ? "#fff5f5" : "#f8fafc",
                        borderLeft: `4px solid ${cat.color}`
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", lineHeight: 1.2 }}>
                          {cat.label}
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                          <span style={{ fontSize: 18, fontWeight: 800, color: cnt > 0 ? cat.color : "#94a3b8" }}>
                            {cnt}
                          </span>
                          <span style={{ fontSize: 10, color: "#94a3b8" }}>kasus</span>
                        </div>
                        <div style={{ fontSize: 9.5, color: "#94a3b8", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {cat.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Visual Grafik SVG Bulanan */}
                {(() => {
                  const chartH = 210;
                  const paddingL = 40;
                  const paddingB = 36;
                  const paddingT = 16;
                  const plotH = chartH - paddingB - paddingT;
                  const monthSlotW = 74;
                  const numCat = NG_CATEGORIES.length;
                  const barGroupW = 56;
                  const barW = barGroupW / numCat;
                  const totalSVGW = paddingL + MONTH_SHORT.length * monthSlotW + 16;

                  const allVals = monthlyNgRows.flatMap(r => r.perMonth);
                  const maxVal = Math.max(...allVals, 4);
                  const gridCount = 4;
                  const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => Math.round((maxVal / gridCount) * i));

                  return (
                    <div style={{
                      border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 14px 10px",
                      background: "#fafbfc"
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>Tren Bar Chart Bulanan per Item Check</span>
                        {historyMonthFilter && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#2563eb" }}>
                            (Bulan aktif: {historyMonthFilter})
                          </span>
                        )}
                      </div>

                      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                        <svg width={totalSVGW} height={chartH} style={{ display: "block", minWidth: totalSVGW }}>
                          {/* Grid lines horizontal */}
                          {gridLines.map((gl, i) => {
                            const y = paddingT + plotH - (gl / maxVal) * plotH;
                            return (
                              <g key={i}>
                                <line x1={paddingL} y1={y} x2={totalSVGW - 10} y2={y}
                                  stroke={i === 0 ? "#cbd5e1" : "#e2e8f0"} strokeWidth={i === 0 ? 1.5 : 1}
                                  strokeDasharray={i === 0 ? "none" : "3 3"} />
                                <text x={paddingL - 6} y={y + 3.5} textAnchor="end" fontSize={9} fill="#94a3b8" fontWeight="600">{gl}</text>
                              </g>
                            );
                          })}

                          {/* Bars per bulan per kategori */}
                          {MONTH_SHORT.map((mShort, mIdx) => {
                            const mFullName = MONTH_NAMES[mIdx];
                            const isSelectedMonth = historyMonthFilter === mFullName;
                            const groupX = paddingL + mIdx * monthSlotW + (monthSlotW - barGroupW) / 2;

                            return (
                              <g key={mIdx}>
                                {/* Highlight kolom bulan terpilih */}
                                {isSelectedMonth && (
                                  <rect
                                    x={paddingL + mIdx * monthSlotW}
                                    y={paddingT}
                                    width={monthSlotW}
                                    height={plotH}
                                    fill="#eff6ff"
                                    opacity={0.6}
                                    rx={4}
                                  />
                                )}

                                {NG_CATEGORIES.map((cat, ci) => {
                                  const row = monthlyNgRows[ci];
                                  const val = row ? row.perMonth[mIdx] : 0;
                                  const bh = (val / maxVal) * plotH;
                                  const bx = groupX + ci * barW;
                                  const by = paddingT + plotH - bh;

                                  return val > 0 ? (
                                    <g key={ci}>
                                      <rect
                                        x={bx}
                                        y={by}
                                        width={Math.max(barW - 1, 2)}
                                        height={bh}
                                        fill={cat.color}
                                        opacity={0.9}
                                        rx={2}
                                      >
                                        <title>{`${cat.label} (${mFullName}): ${val} kejadian`}</title>
                                      </rect>
                                      {bh > 13 && (
                                        <text
                                          x={bx + (barW - 1) / 2}
                                          y={by + 9.5}
                                          textAnchor="middle"
                                          fontSize={7.5}
                                          fill="#fff"
                                          fontWeight="800"
                                        >
                                          {val}
                                        </text>
                                      )}
                                    </g>
                                  ) : null;
                                })}

                                {/* Nama Bulan Label */}
                                <text
                                  x={paddingL + mIdx * monthSlotW + monthSlotW / 2}
                                  y={chartH - 8}
                                  textAnchor="middle"
                                  fontSize={10}
                                  fill={isSelectedMonth ? "#1d4ed8" : "#475569"}
                                  fontWeight={isSelectedMonth ? "800" : "600"}
                                >
                                  {mShort}
                                </text>

                                {/* Total per bulan jika > 0 */}
                                {monthlyTotalNg[mIdx] > 0 && (
                                  <text
                                    x={paddingL + mIdx * monthSlotW + monthSlotW / 2}
                                    y={chartH - 22}
                                    textAnchor="middle"
                                    fontSize={8.5}
                                    fill="#dc2626"
                                    fontWeight="700"
                                  >
                                    ∑{monthlyTotalNg[mIdx]}
                                  </text>
                                )}
                              </g>
                            );
                          })}
                        </svg>
                      </div>

                      {/* Legend Kategori */}
                      <div style={{
                        display: "flex", flexWrap: "wrap", gap: "6px 14px",
                        paddingTop: 10, marginTop: 8, borderTop: "1px solid #f1f5f9"
                      }}>
                        {NG_CATEGORIES.map(cat => {
                          const yrTotal = monthlyNgRows.find(r => r.key === cat.key)?.totalYear || 0;
                          return (
                            <div key={cat.key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                              <span style={{ width: 10, height: 10, borderRadius: 2, background: cat.color }} />
                              <span style={{ color: "#475569", fontWeight: 500 }}>{cat.label}</span>
                              <span style={{ fontWeight: 700, color: yrTotal > 0 ? cat.color : "#94a3b8" }}>
                                ({yrTotal})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Tabel Matriks Rekap NG Bulanan */}
                <div style={{ marginTop: 14, overflowX: "auto" }}>
                  <table className="sum-table" style={{ fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 36, textAlign: "center" }}>No</th>
                        <th style={{ minWidth: 160 }}>Klasifikasi Item Check NG</th>
                        {MONTH_SHORT.map((m, idx) => (
                          <th key={m} style={{
                            textAlign: "center", minWidth: 42,
                            background: historyMonthFilter === MONTH_NAMES[idx] ? "#dbeafe" : undefined,
                            color: historyMonthFilter === MONTH_NAMES[idx] ? "#1d4ed8" : undefined
                          }}>
                            {m}
                          </th>
                        ))}
                        <th style={{ textAlign: "center", minWidth: 60 }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyNgRows.map((row, idx) => (
                        <tr key={row.key}>
                          <td style={{ textAlign: "center", color: "#94a3b8" }}>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: 8, height: 8, borderRadius: 2, background: row.color }} />
                              <span>{row.label}</span>
                            </div>
                          </td>
                          {row.perMonth.map((cnt, mIdx) => (
                            <td key={mIdx} style={{
                              textAlign: "center",
                              fontWeight: cnt > 0 ? 700 : 400,
                              color: cnt > 0 ? "#dc2626" : "#cbd5e1",
                              background: historyMonthFilter === MONTH_NAMES[mIdx] ? "#eff6ff" : undefined
                            }}>
                              {cnt || "-"}
                            </td>
                          ))}
                          <td style={{
                            textAlign: "center", fontWeight: 800,
                            color: row.totalYear > 0 ? "#dc2626" : "#94a3b8", background: "#f8fafc"
                          }}>
                            {row.totalYear || "-"}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ background: "#f8fafc", fontWeight: 800 }}>
                        <td colSpan={2} style={{ textAlign: "right", color: "#1e293b" }}>
                          TOTAL TEMUAN NG:
                        </td>
                        {monthlyTotalNg.map((tot, mIdx) => (
                          <td key={mIdx} style={{
                            textAlign: "center",
                            color: tot > 0 ? "#dc2626" : "#94a3b8"
                          }}>
                            {tot || "-"}
                          </td>
                        ))}
                        <td style={{ textAlign: "center", fontSize: 13, color: overallTotalNgYear > 0 ? "#dc2626" : "#16a34a" }}>
                          {overallTotalNgYear}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── DAFTAR SESI RIWAYAT INSPEKSI ── */}
              <div className="p-card" style={{ overflow: "hidden" }}>
                <div style={{
                  padding: "14px 20px", borderBottom: "1px solid #f1f5f9",
                  display: "flex", alignItems: "center", gap: 8
                }}>
                  <ClipboardList size={15} color="#1d4ed8" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Daftar Sesi Riwayat Inspeksi</span>
                  <span style={{
                    marginLeft: "auto", padding: "2px 10px", borderRadius: 999,
                    background: "#eff6ff", color: "#1d4ed8", fontSize: 11, fontWeight: 700
                  }}>
                    {filteredSessions.length} sesi {historyMonthFilter ? `(${historyMonthFilter} ${historyYear})` : `(${historyYear})`}
                  </span>
                </div>
                {isLoadingSessions ? (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                    <p style={{ fontSize: 14 }}>Memuat data riwayat inspeksi...</p>
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
                    <ClipboardList size={36} style={{ margin: "0 auto 12px", opacity: .3 }} />
                    <p style={{ fontSize: 14 }}>Tidak ada data inspeksi yang sesuai dengan filter.</p>
                  </div>
                ) : (
                  <div>
                    {[...filteredSessions].reverse().map(s => {
                      const pct = sessionPct(s);
                      const gc = GROUP_COLOR[AREAS.find(a => a.key === s.areaKey)?.group ?? "A"];
                      const ngCount = s.readings.filter(r => isReadingFilled(r) && isReadingNg(r)).length;

                      return (
                        <div key={s.id} className="hist-row" style={{ flexWrap: "wrap" }}>
                          <ProgPill v={pct} />
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                                {s.areaLabel}
                              </span>
                              {ngCount > 0 ? (
                                <span style={{
                                  display: "inline-flex", alignItems: "center", gap: 3,
                                  padding: "2px 7px", borderRadius: 999,
                                  background: "#fee2e2", color: "#dc2626", fontSize: 10.5, fontWeight: 700
                                }}>
                                  ⚠ {ngCount} NG
                                </span>
                              ) : (
                                <span style={{
                                  display: "inline-flex", alignItems: "center", gap: 3,
                                  padding: "2px 7px", borderRadius: 999,
                                  background: "#dcfce7", color: "#15803d", fontSize: 10.5, fontWeight: 700
                                }}>
                                  ✓ 100% OK
                                </span>
                              )}
                              {s.isEdited && (
                                <span style={{
                                  display: "inline-flex", alignItems: "center", gap: 4,
                                  padding: "2px 8px", borderRadius: 999,
                                  background: "#fef3c7", border: "1px solid #fde68a",
                                  color: "#b45309", fontSize: 10.5, fontWeight: 700
                                }}>
                                  <Edit3 size={10} /> Diedit
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                              {s.month} {s.year}
                              {s.picCheck && <> · Pengisi (PIC): <b style={{ color: "#334155" }}>{s.picCheck}</b></>}
                              {s.tgl && <> · Tgl: {s.tgl}</>}
                              {s.isEdited && s.updatedAt && (
                                <span style={{ color: "#b45309", marginLeft: 6 }}>
                                  (Update: {s.updatedAt})
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ textAlign: "right", flexShrink: 0, marginRight: 10 }}>
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                              {s.readings.filter(isReadingFilled).length}/{s.readings.length} panel dicek
                            </div>
                            <div style={{ width: 80, marginTop: 4 }}>
                              <Bar v={pct} color={pct === 100 ? "#22c55e" : pct > 60 ? gc.bar : "#ef4444"} h={4} />
                            </div>
                          </div>

                          {/* Tombol Aksi: Detail, Edit, Hapus */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => setViewingSession(s)}
                              className="act-btn act-btn-detail"
                              title="Lihat rincian pengecekan"
                            >
                              <Eye size={12} /> Detail
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(s)}
                              className="act-btn act-btn-edit"
                              title="Edit data inspeksi"
                            >
                              <Edit3 size={12} /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingSession(s)}
                              className="act-btn act-btn-del"
                              title="Hapus data inspeksi"
                            >
                              <Trash2 size={12} /> Hapus
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── TABEL REKAP SUMMARY DENGAN PENGISI & PERSENTASE OK ── */}
              {sessions.length > 0 && (
                <div className="p-card" style={{ overflow: "hidden" }}>
                  <div style={{
                    padding: "14px 20px", borderBottom: "1px solid #f1f5f9",
                    display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8
                  }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Tabel Rekap Summary Inspeksi Panel</span>
                      <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>
                        Status kelayakan (% OK) dan nama pengisi / inspektor
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: "#64748b" }}>
                      * Sesi bernilai 100% jika semua panel berstatus OK tanpa temuan NG
                    </span>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table className="sum-table">
                      <thead>
                        <tr>
                          <th>Area</th>
                          <th style={{ textAlign: "center" }}>Bulan / Thn</th>
                          <th style={{ textAlign: "center" }}>Pengisi (PIC Check)</th>
                          <th style={{ textAlign: "center" }}>Panel Dicek</th>
                          <th style={{ textAlign: "center" }}>Temuan NG</th>
                          <th style={{ textAlign: "center" }}>% OK</th>
                          <th style={{ textAlign: "center" }}>Waktu & Tanggal</th>
                          <th style={{ textAlign: "center" }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...filteredSessions].reverse().map((s) => {
                          const pct = sessionPct(s);
                          const ngCount = s.readings.filter(r => isReadingFilled(r) && isReadingNg(r)).length;
                          return (
                            <tr key={s.id}>
                              <td style={{ fontWeight: 600 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span>{s.areaLabel}</span>
                                  {s.isEdited && (
                                    <span style={{
                                      padding: "1px 6px", borderRadius: 4, background: "#fef3c7",
                                      color: "#b45309", fontSize: 10, fontWeight: 700
                                    }}>
                                      Edit
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={{ textAlign: "center" }}>{s.month} {s.year}</td>
                              <td style={{ textAlign: "center" }}>
                                <span style={{
                                  display: "inline-flex", alignItems: "center", gap: 5,
                                  fontWeight: 600, color: "#1e293b", background: "#f1f5f9",
                                  padding: "3px 10px", borderRadius: 6, fontSize: 12
                                }}>
                                  <User size={12} color="#64748b" />
                                  {s.picCheck || "-"}
                                </span>
                              </td>
                              <td style={{ textAlign: "center" }}>
                                {s.readings.filter(isReadingFilled).length} / {s.readings.length}
                              </td>
                              <td style={{ textAlign: "center" }}>
                                {ngCount > 0 ? (
                                  <span style={{ color: "#dc2626", fontWeight: 700 }}>
                                    {ngCount} NG
                                  </span>
                                ) : (
                                  <span style={{ color: "#16a34a", fontWeight: 600 }}>
                                    0 (Nihil)
                                  </span>
                                )}
                              </td>
                              <td style={{ textAlign: "center" }}>
                                <ProgPill v={pct} />
                              </td>
                              <td style={{ textAlign: "center", color: "#475569", fontSize: 12 }}>
                                {s.tgl || "-"}
                              </td>
                              <td style={{ textAlign: "center" }}>
                                <div style={{ display: "inline-flex", gap: 5 }}>
                                  <button
                                    type="button"
                                    onClick={() => setViewingSession(s)}
                                    className="act-btn act-btn-detail"
                                    style={{ padding: "4px 8px", fontSize: 11 }}
                                    title="Detail"
                                  >
                                    <Eye size={11} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(s)}
                                    className="act-btn act-btn-edit"
                                    style={{ padding: "4px 8px", fontSize: 11 }}
                                    title="Edit"
                                  >
                                    <Edit3 size={11} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingSession(s)}
                                    className="act-btn act-btn-del"
                                    style={{ padding: "4px 8px", fontSize: 11 }}
                                    title="Hapus"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              FORM PAGE
          ══════════════════════════════════════════════════════════════ */}
          {page === "form" && (
            <>
              {!selArea && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                  <div className="p-card" style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                    <Calendar size={15} color="#64748b" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Tahun Inspeksi:</span>
                    <select value={selYear} onChange={e => setSelYear(+e.target.value)}
                      style={{
                        padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: 8,
                        fontSize: 14, fontWeight: 700, color: "#1e293b", background: "#f8fafc",
                        outline: "none", fontFamily: "inherit"
                      }}>
                      {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>Bulan berjalan: <strong style={{ color: "#1d4ed8" }}>{CURRENT_MONTH}</strong></span>
                  </div>

                  {(["A", "B", "C"] as MonthGroup[]).map(grp => {
                    const gc = GROUP_COLOR[grp];
                    const grpAreas = areasByGroup[grp];
                    const grpLabel: Record<MonthGroup, string> = {
                      A: "Grup A — Jan, Apr, Jul, Okt",
                      B: "Grup B — Feb, Mei, Agu, Nov",
                      C: "Grup C — Mar, Jun, Sep, Des",
                    };
                    return (
                      <div key={grp}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                          <span style={{
                            display: "inline-block", width: 20, height: 20, borderRadius: 6,
                            background: gc.bg, border: `1.5px solid ${gc.ring}`,
                            fontWeight: 800, fontSize: 11, color: gc.text, textAlign: "center", lineHeight: "18px"
                          }}>
                            {grp}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: gc.text }}>{grpLabel[grp]}</span>
                          <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>{grpAreas.reduce((s, a) => s + a.panels.length, 0)} panel</span>
                        </div>
                        <div className="area-grid">
                          {grpAreas.map(area => {
                            const lastSess = [...sessions].reverse().find(s => s.areaKey === area.key);
                            const pct = lastSess ? sessionPct(lastSess) : 0;
                            return (
                              <div key={area.key} className="area-btn"
                                onClick={() => goToArea(area, CURRENT_MONTH)}
                                style={{ cursor: "pointer" }}>
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 3 }}>
                                      {area.label}
                                    </div>
                                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                                      {area.panels.length} panel
                                    </div>
                                  </div>
                                  <span className="month-chip" style={{
                                    background: gc.bg, borderColor: gc.ring, color: gc.text
                                  }}>
                                    {grp}
                                  </span>
                                </div>
                                <div>
                                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                                    {area.months.map(m => (
                                      <span key={m} style={{
                                        fontSize: 10, padding: "2px 7px", borderRadius: 4,
                                        background: m === CURRENT_MONTH ? "#dbeafe" : "#f1f5f9",
                                        color: m === CURRENT_MONTH ? "#1d4ed8" : "#94a3b8", fontWeight: 600
                                      }}>
                                        {m.slice(0, 3)}
                                      </span>
                                    ))}
                                  </div>
                                  <Bar v={pct} color={gc.bar} h={3} />
                                </div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <ProgPill v={pct} />
                                  <ChevronRight size={15} color="#cbd5e1" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selArea && !isVerifiedForArea && (
                <div style={{
                  background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 14,
                  padding: "18px 22px", display: "flex", flexDirection: "column", gap: 12
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <AlertCircle size={20} color="#d97706" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#92400e" }}>
                        Verifikasi Lokasi Diperlukan
                      </div>
                      <div style={{ fontSize: 12, color: "#b45309", marginTop: 2 }}>
                        Scan QR Code di area <strong>{selArea.label}</strong> untuk memulai pengisian form.
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div style={{
                      padding: "8px 14px", background: "#fef3c7", border: "1px solid #fde68a",
                      borderRadius: 9, fontSize: 12, color: "#78350f", fontWeight: 600
                    }}>
                      📱 Scan QR pada panel di area ini untuk verifikasi otomatis
                    </div>
                    <button
                      onClick={() => setIsVerifiedForArea(true)}
                      style={{
                        padding: "8px 16px", border: "1.5px solid #d97706", borderRadius: 9,
                        background: "white", color: "#92400e", fontSize: 12, fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit"
                      }}
                    >
                      Lewati — Sudah di Area
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: "#b45309", fontStyle: "italic" }}>
                    ⚠ Tombol Simpan tetap memerlukan verifikasi scan. Klik &quot;Lewati&quot; untuk bisa mengisi form, namun scan QR tetap wajib sebelum menyimpan.
                  </div>
                </div>
              )}

              {selArea && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                  <div className="p-card" style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                      <button className="back-btn" onClick={resetForm}>
                        ← Kembali
                      </button>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                        {selArea.label}
                      </span>
                      <ChevronRight size={13} color="#cbd5e1" />
                      <span style={{ fontSize: 12, color: "#1d4ed8", fontWeight: 600 }}>{selMonth} {selYear}</span>
                      <span style={{ marginLeft: "auto" }}>
                        <ProgPill v={formPct} />
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Pilih Bulan:</span>
                      {selArea.months.map(m => (
                        <button key={m} type="button"
                          onClick={() => setSelMonth(m)}
                          style={{
                            padding: "5px 12px", borderRadius: 7, border: "1.5px solid",
                            fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                            borderColor: selMonth === m ? "#3b82f6" : "#e2e8f0",
                            background: selMonth === m ? "#dbeafe" : "#f8fafc",
                            color: selMonth === m ? "#1d4ed8" : "#64748b"
                          }}>
                          {m}
                        </button>
                      ))}
                      <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 8 }}>Tahun: {selYear}</span>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <Bar v={formPct}
                        color={formPct === 100 ? "#22c55e" : formPct > 50 ? "#3b82f6" : "#94a3b8"} h={5} />
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 5 }}>
                        {filledCount} dari {readings.length} panel sudah diisi
                      </div>
                    </div>
                  </div>

                  <div className="p-card" style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <User size={14} color="#64748b" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", letterSpacing: ".06em" }}>
                        INFORMASI INSPEKSI
                      </span>
                    </div>
                    <div className="foot-grid">
                      <div className="foot-field">
                        <span className="foot-label">WAKTU & TGL. INSPEKSI (OTOMATIS)</span>
                        <input
                          type="text"
                          value={tgl}
                          readOnly
                          className="foot-input"
                          style={{ background: "#f1f5f9", cursor: "not-allowed", color: "#334155" }}
                        />
                      </div>
                      <div className="foot-field">
                        <span className="foot-label">PIC CHECK / INSPEKTOR</span>
                        <input
                          type="text"
                          value={picCheck}
                          readOnly
                          className="foot-input"
                          style={{ background: "#f1f5f9", cursor: "not-allowed", color: "#334155" }}
                          placeholder="Nama inspektor..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-card" style={{ overflow: "hidden" }}>
                    <div style={{
                      padding: "12px 20px", borderBottom: "1px solid #f1f5f9",
                      display: "flex", alignItems: "center", gap: 8
                    }}>
                      <Zap size={14} color="#1d4ed8" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                        Data Pengukuran Panel — {selArea.label}
                      </span>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table className="insp-table">
                        <thead>
                          <tr>
                            <th className="left" rowSpan={2} style={{ width: 36 }}>No</th>
                            <th className="left" rowSpan={2} style={{ minWidth: 160 }}>Nama Panel</th>
                            <th className="th-temp" rowSpan={2} style={{ minWidth: 95 }}>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                                <ThermometerSun size={13} />
                                <span>Temp (°C)</span>
                                <span style={{ fontSize: 10, fontWeight: 600, color: "#c2410c", opacity: 0.9 }}>Max 65°C</span>
                              </div>
                            </th>
                            <th className="th-qual" colSpan={3}>
                              <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }}>
                                <Sparkles size={12} /> Kualitas (O = OK, X = Abnormal)
                              </div>
                            </th>
                            <th className="th-teg" colSpan={2}>
                              <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }}>
                                <Gauge size={12} /> Tegangan Out MCCB (V)
                              </div>
                            </th>
                            <th className="th-arus" colSpan={3}>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                  <Zap size={12} /> Arus (A)
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 500, color: "#7e22ce", opacity: 0.9 }}>≤ Kapasitas MCCB</span>
                              </div>
                            </th>
                            <th className="th-note" rowSpan={2} style={{ minWidth: 120 }}>Catatan</th>
                          </tr>
                          <tr>
                            <th className="th-qual" style={{ minWidth: 90 }}>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                  <Volume2 size={11} />
                                  <span>Tidak Bau</span>
                                </div>
                                <span style={{ fontSize: 9.5, fontWeight: 500, color: "#166534" }}>Tdk bau hangus</span>
                              </div>
                            </th>
                            <th className="th-qual" style={{ minWidth: 100 }}>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                  <Wind size={11} />
                                  <span>Suara</span>
                                </div>
                                <span style={{ fontSize: 9.5, fontWeight: 500, color: "#166534" }}>Tdk dengung/arcing</span>
                              </div>
                            </th>
                            <th className="th-qual" style={{ minWidth: 90 }}>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                  <Sparkles size={11} />
                                  <span>5S / Bersih</span>
                                </div>
                                <span style={{ fontSize: 9.5, fontWeight: 500, color: "#166534" }}>Bersih & tertutup</span>
                              </div>
                            </th>
                            <th className="th-teg" style={{ minWidth: 90 }}>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                                <span>3 Phase</span>
                                <span style={{ fontSize: 10, fontWeight: 600, color: "#1e40af" }}>380V – 415V</span>
                              </div>
                            </th>
                            <th className="th-teg" style={{ minWidth: 90 }}>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                                <span>1 Phase</span>
                                <span style={{ fontSize: 10, fontWeight: 600, color: "#1e40af" }}>220V – 240V</span>
                              </div>
                            </th>
                            <th className="th-arus" style={{ minWidth: 60 }}>R</th>
                            <th className="th-arus" style={{ minWidth: 60 }}>S</th>
                            <th className="th-arus" style={{ minWidth: 60 }}>T</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selArea.panels.map((panel, idx) => {
                            const r = readings.find(x => x.panelId === panel.id)!;
                            if (!r) return null;
                            const filled = isReadingFilled(r);
                            const rowNg = filled && isReadingNg(r);
                            const missingNote = rowNg && !r.catatan?.trim();
                            return (
                              <tr key={panel.id}>
                                <td className="no-cell">{idx + 1}</td>
                                <td className="panel-name" style={filled ? { background: rowNg ? "#fff1f2!important" : "#f0fdf4!important" } : {}}>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                                    <span>{panel.name}</span>
                                    {rowNg && (
                                      <span style={{
                                        fontSize: 9.5, fontWeight: 800, padding: "1px 6px",
                                        borderRadius: 4, background: "#fee2e2", color: "#dc2626"
                                      }}>
                                        NG
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td style={{ textAlign: "center", background: filled ? "#fff7ed" : "" }}>
                                  <input type="text" value={r.temp} placeholder="—"
                                    className="num-in"
                                    style={{ borderColor: r.temp && +r.temp > 65 ? "#fca5a5" : "" }}
                                    onChange={e => updR(panel.id, { temp: e.target.value })}
                                  />
                                </td>
                                <td><SymbolCell value={r.bau} onChange={v => updR(panel.id, { bau: v })} /></td>
                                <td><SymbolCell value={r.suara} onChange={v => updR(panel.id, { suara: v })} /></td>
                                <td><SymbolCell value={r.fiveS} onChange={v => updR(panel.id, { fiveS: v })} /></td>
                                <td style={{ textAlign: "center" }}>
                                  <input type="text" value={r.tegOut3Phase} placeholder="—"
                                    className="num-in"
                                    style={{ borderColor: r.tegOut3Phase && (+r.tegOut3Phase < 380 || +r.tegOut3Phase > 415) ? "#fca5a5" : "" }}
                                    onChange={e => updR(panel.id, { tegOut3Phase: e.target.value })}
                                  />
                                </td>
                                <td style={{ textAlign: "center" }}>
                                  <input type="text" value={r.tegOut1Phase} placeholder="—"
                                    className="num-in"
                                    style={{ borderColor: r.tegOut1Phase && (+r.tegOut1Phase < 220 || +r.tegOut1Phase > 240) ? "#fca5a5" : "" }}
                                    onChange={e => updR(panel.id, { tegOut1Phase: e.target.value })}
                                  />
                                </td>
                                <td style={{ textAlign: "center" }}>
                                  <input type="text" value={r.arusR} placeholder="—"
                                    className="num-in" onChange={e => updR(panel.id, { arusR: e.target.value })} />
                                </td>
                                <td style={{ textAlign: "center" }}>
                                  <input type="text" value={r.arusS} placeholder="—"
                                    className="num-in" onChange={e => updR(panel.id, { arusS: e.target.value })} />
                                </td>
                                <td style={{ textAlign: "center" }}>
                                  <input type="text" value={r.arusT} placeholder="—"
                                    className="num-in" onChange={e => updR(panel.id, { arusT: e.target.value })} />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    value={r.catatan}
                                    placeholder={rowNg ? "Wajib diisi jika NG… *" : "Opsional…"}
                                    className="note-in"
                                    style={
                                      missingNote
                                        ? { borderColor: "#ef4444", background: "#fef2f2", boxShadow: "0 0 0 2px rgba(239,68,68,.15)" }
                                        : rowNg
                                        ? { borderColor: "#f97316" }
                                        : {}
                                    }
                                    onChange={e => updR(panel.id, { catatan: e.target.value })}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {readings.some(r => r.temp && +r.temp > 65) && (
                      <div style={{
                        margin: "12px 16px 0", padding: "8px 14px",
                        background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
                        display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#b91c1c"
                      }}>
                        <AlertCircle size={13} style={{ flexShrink: 0 }} />
                        Beberapa panel memiliki suhu &gt; 65°C (batas aman). Segera tindak lanjuti!
                      </div>
                    )}
                    {readings.some(r => r.tegOut3Phase && (+r.tegOut3Phase < 380 || +r.tegOut3Phase > 415)) && (
                      <div style={{
                        margin: "12px 16px 0", padding: "8px 14px",
                        background: "#fffbeb", border: "1px solid #fde047", borderRadius: 8,
                        display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#92400e"
                      }}>
                        <AlertCircle size={13} style={{ flexShrink: 0 }} />
                        Tegangan 3 Phase di luar rentang normal (380–415V). Periksa kembali.
                      </div>
                    )}
                    {hasUnannotatedNg && (
                      <div style={{
                        margin: "12px 16px 0", padding: "10px 14px",
                        background: "#fff1f2", border: "1.5px solid #fca5a5", borderRadius: 8,
                        display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#dc2626", fontWeight: 600
                      }}>
                        <AlertCircle size={15} style={{ flexShrink: 0 }} />
                        <span>
                          Ada <strong>{unannotatedNgPanels.length} panel dengan kondisi abnormal (NG)</strong> yang belum diberi catatan! Inspector wajib mengisi tindakan / kondisi pada kolom Catatan.
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-card" style={{
                    padding: "14px 20px",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap"
                  }}>
                    <button className="back-btn" onClick={resetForm}>← Pilih Area Lain</button>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {!isVerifiedForArea && (
                        <span style={{ fontSize: 12, color: "#d97706", fontWeight: 600 }}>
                          ⚠ Scan QR area terlebih dahulu
                        </span>
                      )}
                      {filledCount === 0 && (
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>
                          Isi minimal 1 panel
                        </span>
                      )}
                      {hasUnannotatedNg && (
                        <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 700 }}>
                          ⚠ Kolom catatan wajib diisi untuk panel NG
                        </span>
                      )}
                      {(!tgl || !picCheck) && (
                        <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>
                          ⚠ Informasi inspeksi belum terisi
                        </span>
                      )}
                      <button className="save-btn" disabled={!canSave || isSaving} onClick={handlePreview}>
                        <Save size={15} />
                        {isSaving ? "Menyimpan…" : "Preview & Simpan"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {showPreview && selArea && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20
        }}
          onClick={e => { if (e.target === e.currentTarget) setShowPreview(false); }}>
          <div style={{
            background: "#fff", borderRadius: 16, maxWidth: 640, width: "100%",
            maxHeight: "85vh", overflow: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,.25)"
          }}>

            <div style={{
              padding: "18px 24px", borderBottom: "1px solid #f1f5f9",
              display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>Preview Data Inspeksi</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                  Periksa sebelum menyimpan
                </div>
              </div>
              <button onClick={() => setShowPreview(false)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 20, color: "#94a3b8", lineHeight: 1, padding: 4
                }}>✕</button>
            </div>

            <div style={{ padding: "18px 24px" }}>
              <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
                {[
                  ["Area", selArea.label],
                  ["Bulan / Tahun", `${selMonth} ${selYear}`],
                  ["Panel Diisi", `${filledCount} dari ${readings.length}`],
                  ["Waktu Inspeksi", tgl || "—"],
                  ["PIC Check", picCheck || "—"],
                ].map(([label, val]) => (
                  <div key={label} style={{
                    display: "flex", gap: 12, padding: "6px 0",
                    borderBottom: "1px solid #f1f5f9", alignItems: "baseline"
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", width: 120, flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{val}</span>
                  </div>
                ))}
              </div>

              <div style={{
                fontSize: 11, fontWeight: 700, color: "#94a3b8",
                letterSpacing: ".06em", marginBottom: 10
              }}>
                DETAIL PANEL TERISI ({filledCount})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {readings.filter(isReadingFilled).map(r => {
                  const pName = panelOf(r.panelId);
                  const hasAlert = (r.temp && +r.temp > 65) ||
                    (r.tegOut3Phase && (+r.tegOut3Phase < 380 || +r.tegOut3Phase > 415)) ||
                    (r.tegOut1Phase && (+r.tegOut1Phase < 220 || +r.tegOut1Phase > 240)) ||
                    r.bau === "X" || r.suara === "X" || r.fiveS === "X";
                  return (
                    <div key={r.panelId} style={{
                      border: `1.5px solid ${hasAlert ? "#fecaca" : "#e2e8f0"}`,
                      borderRadius: 10, padding: "10px 14px",
                      background: hasAlert ? "#fff5f5" : "#f8fafc"
                    }}>
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        marginBottom: 6
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{pName}</span>
                        {hasAlert && <span style={{
                          fontSize: 11, color: "#dc2626", fontWeight: 700,
                          background: "#fee2e2", padding: "2px 8px", borderRadius: 999
                        }}>⚠ Perlu Tindakan</span>}
                      </div>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#475569" }}>
                        {r.temp && <span>🌡 {r.temp}°C {+r.temp > 65 ? "⚠" : ""}</span>}
                        {r.bau && <span>👃 Tidak Bau: <strong style={{ color: r.bau === "X" ? "#dc2626" : "#16a34a" }}>{r.bau}</strong></span>}
                        {r.suara && <span>👂 Suara/Tidak Bising: <strong style={{ color: r.suara === "X" ? "#dc2626" : "#16a34a" }}>{r.suara}</strong></span>}
                        {r.fiveS && <span>✨ 5S/Bersih: <strong style={{ color: r.fiveS === "X" ? "#dc2626" : "#16a34a" }}>{r.fiveS}</strong></span>}
                        {r.tegOut3Phase && <span>⚡ 3Φ: {r.tegOut3Phase}V {(+r.tegOut3Phase < 380 || +r.tegOut3Phase > 415) ? "⚠" : ""}</span>}
                        {r.tegOut1Phase && <span>⚡ 1Φ: {r.tegOut1Phase}V</span>}
                        {(r.arusR || r.arusS || r.arusT) && <span>🔌 A: R={r.arusR || "-"} S={r.arusS || "-"} T={r.arusT || "-"}</span>}
                        {r.catatan && <span>📝 {r.catatan}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{
              padding: "14px 24px", borderTop: "1px solid #f1f5f9",
              display: "flex", justifyContent: "flex-end", gap: 10
            }}>
              <button onClick={() => setShowPreview(false)}
                style={{
                  padding: "9px 20px", border: "1px solid #e2e8f0", borderRadius: 9,
                  background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit"
                }}>
                  Batal / Edit
              </button>
              <button onClick={handleSave} disabled={isSaving}
                style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "9px 22px",
                  border: "none", borderRadius: 9, background: "#1d4ed8", color: "#fff",
                  fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  boxShadow: "0 2px 8px rgba(29,78,216,.25)"
                }}>
                <Save size={14} />{isSaving ? "Menyimpan…" : "Konfirmasi Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: DETAIL PENGECEKAN PANEL
      ══════════════════════════════════════════════════════════════════ */}
      {viewingSession && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16, zIndex: 1100, backdropFilter: "blur(2px)"
        }} onClick={() => setViewingSession(null)}>
          <div style={{
            background: "#fff", borderRadius: 16, maxWidth: 840, width: "100%",
            maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column",
            boxShadow: "0 20px 60px rgba(0,0,0,.3)"
          }} onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div style={{
              padding: "16px 22px", borderBottom: "1px solid #f1f5f9",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: "#eff6ff",
                  border: "1px solid #bfdbfe", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0
                }}>
                  <Eye size={18} color="#1d4ed8" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                    <span>Detail Pemeriksaan Panel — {viewingSession.areaLabel}</span>
                    {viewingSession.isEdited && (
                      <span style={{
                        padding: "2px 8px", borderRadius: 999, background: "#fef3c7",
                        border: "1px solid #fde68a", color: "#b45309", fontSize: 10.5, fontWeight: 700
                      }}>
                        Diedit
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#94a3b8" }}>
                    Periode {viewingSession.month} {viewingSession.year} · Waktu: {viewingSession.tgl}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingSession(null)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#94a3b8", padding: 6, borderRadius: 8, display: "flex", alignItems: "center"
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "18px 22px", overflowY: "auto", flex: 1 }}>
              {/* Metadata card */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                gap: 12, padding: "12px 16px", background: "#f8fafc", borderRadius: 10,
                border: "1px solid #e2e8f0", marginBottom: 16
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>AREA</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{viewingSession.areaLabel}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>BULAN / TAHUN</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{viewingSession.month} {viewingSession.year}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>PIC CHECK</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{viewingSession.picCheck || "-"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>STATUS KELAYAKAN (% OK)</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <ProgPill v={sessionPct(viewingSession)} />
                    <span style={{ fontSize: 11.5, color: "#64748b" }}>
                      ({viewingSession.readings.filter(r => isReadingFilled(r) && !isReadingNg(r)).length}/{viewingSession.readings.length} OK)
                    </span>
                  </div>
                </div>
              </div>

              {/* Rincian item panel */}
              <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 10 }}>
                DAFTAR HASIL PENGUKURAN PANEL
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {viewingSession.readings.map((r, idx) => {
                  const pName = panelOf(r.panelId);
                  const filled = isReadingFilled(r);
                  const isNg = filled && isReadingNg(r);

                  return (
                    <div key={r.panelId} style={{
                      border: `1px solid ${isNg ? "#fecaca" : "#e2e8f0"}`,
                      borderRadius: 10, padding: "12px 16px",
                      background: isNg ? "#fff5f5" : filled ? "#ffffff" : "#f8fafc"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{
                            width: 22, height: 22, borderRadius: 6, background: "#f1f5f9",
                            fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b"
                          }}>
                            {idx + 1}
                          </span>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b" }}>{pName}</span>
                        </div>
                        {isNg ? (
                          <span style={{
                            fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 999,
                            background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca"
                          }}>
                            ⚠ ABNORMAL / NG
                          </span>
                        ) : filled ? (
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                            background: "#dcfce7", color: "#166534"
                          }}>
                            NORMAL / OK
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>Belum Diisi</span>
                        )}
                      </div>

                      {filled ? (
                        <div style={{
                          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                          gap: 8, fontSize: 12, color: "#334155", background: isNg ? "rgba(254,226,226,.3)" : "#f8fafc",
                          padding: "8px 12px", borderRadius: 8
                        }}>
                          <div>
                            <span style={{ color: "#64748b", fontSize: 11 }}>Suhu:</span>{" "}
                            <b>{r.temp ? `${r.temp}°C` : "-"}</b>{" "}
                            {r.temp && +r.temp > 65 && <b style={{ color: "#dc2626" }}>(Max 65°C!)</b>}
                          </div>
                          <div>
                            <span style={{ color: "#64748b", fontSize: 11 }}>Tdk Bau:</span>{" "}
                            <b style={{ color: r.bau === "X" ? "#dc2626" : r.bau === "O" ? "#16a34a" : "#334155" }}>{r.bau || "-"}</b>
                          </div>
                          <div>
                            <span style={{ color: "#64748b", fontSize: 11 }}>Suara:</span>{" "}
                            <b style={{ color: r.suara === "X" ? "#dc2626" : r.suara === "O" ? "#16a34a" : "#334155" }}>{r.suara || "-"}</b>
                          </div>
                          <div>
                            <span style={{ color: "#64748b", fontSize: 11 }}>5S:</span>{" "}
                            <b style={{ color: r.fiveS === "X" ? "#dc2626" : r.fiveS === "O" ? "#16a34a" : "#334155" }}>{r.fiveS || "-"}</b>
                          </div>
                          <div>
                            <span style={{ color: "#64748b", fontSize: 11 }}>Teg. 3Φ:</span>{" "}
                            <b>{r.tegOut3Phase ? `${r.tegOut3Phase}V` : "-"}</b>
                          </div>
                          <div>
                            <span style={{ color: "#64748b", fontSize: 11 }}>Teg. 1Φ:</span>{" "}
                            <b>{r.tegOut1Phase ? `${r.tegOut1Phase}V` : "-"}</b>
                          </div>
                          <div style={{ gridColumn: "span 2" }}>
                            <span style={{ color: "#64748b", fontSize: 11 }}>Arus (A):</span>{" "}
                            <b>R: {r.arusR || "-"} | S: {r.arusS || "-"} | T: {r.arusT || "-"}</b>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>Data tidak diisi saat inspeksi</div>
                      )}

                      {r.catatan && (
                        <div style={{
                          marginTop: 8, padding: "6px 10px", borderRadius: 6,
                          background: isNg ? "#fee2e2" : "#f1f5f9",
                          fontSize: 12, color: isNg ? "#991b1b" : "#475569"
                        }}>
                          <b>Catatan:</b> {r.catatan}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "12px 22px", borderTop: "1px solid #f1f5f9", background: "#f8fafc",
              display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10
            }}>
              <button
                type="button"
                onClick={() => {
                  const s = viewingSession;
                  setViewingSession(null);
                  handleOpenEdit(s);
                }}
                className="act-btn act-btn-edit"
              >
                <Edit3 size={13} /> Edit Sesi Ini
              </button>
              <button
                type="button"
                onClick={() => setViewingSession(null)}
                style={{
                  padding: "7px 18px", border: "1px solid #cbd5e1", borderRadius: 8,
                  background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit"
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: EDIT DATA SESI INSPEKSI PANEL
      ══════════════════════════════════════════════════════════════════ */}
      {editingSession && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16, zIndex: 1100, backdropFilter: "blur(2px)"
        }} onClick={() => setEditingSession(null)}>
          <div style={{
            background: "#fff", borderRadius: 16, maxWidth: 960, width: "100%",
            maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column",
            boxShadow: "0 20px 60px rgba(0,0,0,.3)"
          }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{
              padding: "16px 22px", borderBottom: "1px solid #f1f5f9",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: "#eff6ff",
                  border: "1px solid #bfdbfe", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0
                }}>
                  <Edit3 size={18} color="#1d4ed8" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>
                    Edit Pemeriksaan Panel — {editingSession.areaLabel}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#94a3b8" }}>
                    Bulan {editingSession.month} {editingSession.year} · Pengambilan awal: {editingSession.tgl}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEditingSession(null)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#94a3b8", padding: 6, borderRadius: 8, display: "flex", alignItems: "center"
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "18px 22px", overflowY: "auto", flex: 1 }}>
              {editNgUnannotated.length > 0 && (
                <div style={{
                  marginBottom: 14, padding: "10px 14px", borderRadius: 8,
                  background: "#fff1f2", border: "1px solid #fecaca",
                  fontSize: 12.5, fontWeight: 600, color: "#dc2626",
                  display: "flex", alignItems: "center", gap: 8
                }}>
                  <AlertCircle size={15} color="#dc2626" />
                  <span>Ada {editNgUnannotated.length} panel NG yang kolom catatannya masih kosong! Inspector wajib mengisi catatan.</span>
                </div>
              )}

              <div style={{ overflowX: "auto" }}>
                <table className="insp-table">
                  <thead>
                    <tr>
                      <th className="left" rowSpan={2} style={{ width: 36 }}>No</th>
                      <th className="left" rowSpan={2} style={{ minWidth: 160 }}>Nama Panel</th>
                      <th className="th-temp" rowSpan={2} style={{ minWidth: 95 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                          <ThermometerSun size={13} />
                          <span>Temp (°C)</span>
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#c2410c" }}>Max 65°C</span>
                        </div>
                      </th>
                      <th className="th-qual" colSpan={3}>Kualitas (O = OK, X = Abnormal)</th>
                      <th className="th-teg" colSpan={2}>Tegangan Out MCCB (V)</th>
                      <th className="th-arus" colSpan={3}>Arus (A)</th>
                      <th className="th-note" rowSpan={2} style={{ minWidth: 140 }}>Catatan</th>
                    </tr>
                    <tr>
                      <th className="th-qual" style={{ minWidth: 80 }}>Tdk Bau</th>
                      <th className="th-qual" style={{ minWidth: 80 }}>Suara</th>
                      <th className="th-qual" style={{ minWidth: 80 }}>5S</th>
                      <th className="th-teg" style={{ minWidth: 85 }}>3 Phase</th>
                      <th className="th-teg" style={{ minWidth: 85 }}>1 Phase</th>
                      <th className="th-arus" style={{ minWidth: 55 }}>R</th>
                      <th className="th-arus" style={{ minWidth: 55 }}>S</th>
                      <th className="th-arus" style={{ minWidth: 55 }}>T</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editReadings.map((r, idx) => {
                      const pName = panelOf(r.panelId);
                      const filled = isReadingFilled(r);
                      const rowNg = filled && isReadingNg(r);
                      const missingNote = rowNg && !r.catatan?.trim();

                      return (
                        <tr key={r.panelId}>
                          <td className="no-cell">{idx + 1}</td>
                          <td className="panel-name" style={filled ? { background: rowNg ? "#fff1f2!important" : "#f0fdf4!important" } : {}}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                              <span>{pName}</span>
                              {rowNg && (
                                <span style={{
                                  fontSize: 9.5, fontWeight: 800, padding: "1px 6px",
                                  borderRadius: 4, background: "#fee2e2", color: "#dc2626"
                                }}>
                                  NG
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: "center", background: filled ? "#fff7ed" : "" }}>
                            <input
                              type="text"
                              value={r.temp}
                              placeholder="—"
                              className="num-in"
                              style={{ borderColor: r.temp && +r.temp > 65 ? "#fca5a5" : "" }}
                              onChange={e => updEditR(r.panelId, { temp: e.target.value })}
                            />
                          </td>
                          <td><SymbolCell value={r.bau} onChange={v => updEditR(r.panelId, { bau: v })} /></td>
                          <td><SymbolCell value={r.suara} onChange={v => updEditR(r.panelId, { suara: v })} /></td>
                          <td><SymbolCell value={r.fiveS} onChange={v => updEditR(r.panelId, { fiveS: v })} /></td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="text"
                              value={r.tegOut3Phase}
                              placeholder="—"
                              className="num-in"
                              style={{ borderColor: r.tegOut3Phase && (+r.tegOut3Phase < 380 || +r.tegOut3Phase > 415) ? "#fca5a5" : "" }}
                              onChange={e => updEditR(r.panelId, { tegOut3Phase: e.target.value })}
                            />
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="text"
                              value={r.tegOut1Phase}
                              placeholder="—"
                              className="num-in"
                              style={{ borderColor: r.tegOut1Phase && (+r.tegOut1Phase < 220 || +r.tegOut1Phase > 240) ? "#fca5a5" : "" }}
                              onChange={e => updEditR(r.panelId, { tegOut1Phase: e.target.value })}
                            />
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input type="text" value={r.arusR} placeholder="—" className="num-in"
                              onChange={e => updEditR(r.panelId, { arusR: e.target.value })} />
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input type="text" value={r.arusS} placeholder="—" className="num-in"
                              onChange={e => updEditR(r.panelId, { arusS: e.target.value })} />
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input type="text" value={r.arusT} placeholder="—" className="num-in"
                              onChange={e => updEditR(r.panelId, { arusT: e.target.value })} />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={r.catatan}
                              placeholder={rowNg ? "Wajib diisi jika NG… *" : "Catatan…"}
                              className="note-in"
                              style={
                                missingNote
                                  ? { borderColor: "#ef4444", background: "#fef2f2", boxShadow: "0 0 0 2px rgba(239,68,68,.15)" }
                                  : rowNg
                                  ? { borderColor: "#f97316" }
                                  : {}
                              }
                              onChange={e => updEditR(r.panelId, { catatan: e.target.value })}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: "14px 22px", borderTop: "1px solid #f1f5f9", background: "#f8fafc",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10
            }}>
              <div style={{ fontSize: 11.5, color: "#64748b" }}>
                Status sesi akan otomatis ditandai <b>&quot;Diedit&quot;</b> setelah perubahan disimpan.
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  style={{
                    padding: "8px 18px", border: "1px solid #cbd5e1", borderRadius: 8,
                    background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit"
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="save-btn"
                  disabled={!canSaveEdit}
                  onClick={handleSaveEdit}
                >
                  <Save size={14} /> Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: KONFIRMASI HAPUS DATA INSPEKSI
      ══════════════════════════════════════════════════════════════════ */}
      {deletingSession && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16, zIndex: 1150, backdropFilter: "blur(2px)"
        }} onClick={() => setDeletingSession(null)}>
          <div style={{
            background: "#fff", borderRadius: 16, maxWidth: 460, width: "100%",
            overflow: "hidden", display: "flex", flexDirection: "column",
            boxShadow: "0 20px 60px rgba(0,0,0,.3)"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px" }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: "#fef2f2",
                border: "1px solid #fecaca", display: "flex", alignItems: "center",
                justifyContent: "center", marginBottom: 14
              }}>
                <Trash2 size={22} color="#dc2626" />
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#1e293b", marginBottom: 6 }}>
                Hapus Data Inspeksi Panel?
              </div>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                Apakah Anda yakin ingin menghapus data riwayat inspeksi untuk area{" "}
                <b style={{ color: "#1e293b" }}>{deletingSession.areaLabel}</b> ({deletingSession.month} {deletingSession.year})?
              </p>
              <div style={{
                marginTop: 12, padding: "10px 12px", background: "#f8fafc",
                borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, color: "#475569"
              }}>
                <div>Waktu Inspeksi: <b>{deletingSession.tgl}</b></div>
                <div style={{ marginTop: 2 }}>PIC Check: <b>{deletingSession.picCheck || "-"}</b></div>
                <div style={{ marginTop: 2 }}>
                  Panel Selesai: <b>{deletingSession.readings.filter(isReadingFilled).length}/{deletingSession.readings.length}</b> ({sessionPct(deletingSession)}%)
                </div>
              </div>
            </div>

            <div style={{
              padding: "12px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0",
              display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10
            }}>
              <button
                type="button"
                onClick={() => setDeletingSession(null)}
                style={{
                  padding: "8px 16px", border: "1px solid #cbd5e1", borderRadius: 8,
                  background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit"
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteSession}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 18px", border: "none", borderRadius: 8,
                  background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", boxShadow: "0 2px 6px rgba(220,38,38,.25)", fontFamily: "inherit"
                }}
              >
                <Trash2 size={14} /> Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}