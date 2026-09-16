// app/e-checksheet-ins-apd/EChecksheetInsApdForm.tsx
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ChevronRight, ChevronLeft, Factory, MapPin, Calendar,
  CheckCircle2, Save, Plus, Trash2, BarChart3,
  ShieldCheck, AlertCircle, TrendingUp, Users,
  ClipboardList, Download, Loader2, RefreshCw,
  Edit3, Clock, X, Eye, User, Search, Settings, RotateCcw, Tag,
} from "lucide-react";

// ─── STATIC DATA ─────────────────────────────────────────────────────────────

interface SubConfig { name: string; areas: string[] }
interface ProsesConfig {
  key: string;
  name: string;
  areaType: "predefined-per-sub" | "cv" | "none";
  subs: SubConfig[];
}
interface DeptConfig { deptKey: string; deptName: string; proses: ProsesConfig[] }

const DEPT_CONFIG: DeptConfig[] = [
  {
    deptKey: "PRODUKSI", deptName: "PRODUKSI",
    proses: [
      {
        key: "prod-pre-assy", name: "PRE ASSY", areaType: "predefined-per-sub",
        subs: [
          { name: "Bonder", areas: ["Mazda", "Toyota AMX", "Toyota TRX", "Toyota NPR & TNGA", "BCL", "Nissan"] },
          { name: "Bonder Minic", areas: ["Toyota AMX", "Toyota TRX", "BCL"] },
          { name: "Anti Korosi (EJ30 & EJ35)", areas: ["Toyota AMX", "Toyota TRX", "BCL"] },
          { name: "Raychem Alpha", areas: ["Mazda", "Toyota AMX", "Toyota TRX", "Toyota NPR & TNGA", "BCL", "Nissan"] },
          { name: "Raychem Non-Alpha", areas: ["Big Size", "BCL", "Nissan", "Toyota NPR & TNGA"] },
          { name: "Heat Shrink", areas: ["Mazda", "Toyota AMX", "Toyota TRX", "Toyota NPR & TNGA", "BCL", "Nissan"] },
          { name: "Gun Solder", areas: ["Nissan"] },
          { name: "Dip Solder", areas: ["Nissan"] },
          { name: "Casting", areas: ["Mazda", "Toyota AMX", "Toyota TRX", "Toyota NPR & TNGA", "BCL", "Nissan"] },
          { name: "Cutting", areas: ["Mazda", "Toyota AMX", "Toyota TRX", "Toyota NPR & TNGA", "BCL", "Nissan"] },
          { name: "Transporter", areas: ["Area 01", "Area 02", "Area 03", "Area 04"] },
        ],
      },
      {
        key: "prod-final-assy", name: "FINAL ASSY", areaType: "cv",
        subs: [
          { name: "Shisui", areas: [] },
          { name: "Sub Assy", areas: [] },
          { name: "Taping", areas: [] },
          { name: "Offline", areas: [] },
          { name: "Siage", areas: [] },
          { name: "Expander Grommet", areas: [] },
          { name: "Vacuum", areas: [] },
          { name: "CS / Material Supply", areas: [] },
        ],
      },
      {
        key: "prod-cutting-tube", name: "CUTTING TUBE", areaType: "none",
        subs: [
          { name: "Rolling Tube", areas: [] },
          { name: "Chorobiki", areas: [] },
          { name: "Cek COT / VO / CVO Manual", areas: [] },
          { name: "Cutting COT/COTO", areas: [] },
          { name: "Cutting VO/CVO", areas: [] },
          { name: "Rewinding", areas: [] },
          { name: "Reuse Wire", areas: [] },
          { name: "Giling & Kupas Wire", areas: [] },
        ],
      },
    ],
  },
  {
    deptKey: "QA", deptName: "QA",
    proses: [
      {
        key: "qa-pre-assy", name: "INSPEKSI PRE ASSY", areaType: "predefined-per-sub",
        subs: [
          { name: "Bonder", areas: ["Mazda", "Toyota AMX", "Toyota TRX", "Toyota NPR & TNGA", "BCL", "Nissan"] },
          { name: "Bonder Minic", areas: ["Toyota AMX", "Toyota TRX", "BCL"] },
          { name: "Anti Korosi (EJ30 & EJ35)", areas: ["Toyota AMX", "Toyota TRX", "BCL"] },
          { name: "Raychem Alpha", areas: ["Mazda", "Toyota AMX", "Toyota TRX", "Toyota NPR & TNGA", "BCL", "Nissan"] },
          { name: "Raychem Non-Alpha", areas: ["Big Size", "BCL", "Nissan", "Toyota NPR & TNGA"] },
          { name: "Heat Shrink", areas: ["Mazda", "Toyota AMX", "Toyota TRX", "Toyota NPR & TNGA", "BCL", "Nissan"] },
          { name: "Gun Solder", areas: ["Nissan"] },
          { name: "Dip Solder", areas: ["Nissan"] },
          { name: "Waterproof", areas: [] },
          { name: "Cross Section", areas: [] },
          { name: "Cutting", areas: [] },
        ],
      },
      {
        key: "qa-final-assy", name: "INSPEKSI FINAL ASSY", areaType: "predefined-per-sub",
        subs: [
          { name: "Dry Surf", areas: ["Toyota AMX", "Toyota TRX", "Toyota NPR & TNGA"] },
          { name: "Waterproof", areas: ["Toyota AMX", "Toyota TRX"] },
          { name: "Checker & Packing", areas: [] }, // CV
        ],
      },
      {
        key: "qa-others", name: "REC. INSP & LAINNYA", areaType: "none",
        subs: [
          { name: "Receiving Inspection Material", areas: ["Loading Dock Warehouse"] },
          { name: "Voltage Test", areas: ["Jig Proto"] },
          { name: "Pekerjaan Workshop", areas: ["Workshop"] },
        ],
      },
    ],
  },
  {
    deptKey: "GA", deptName: "GA UTILITY",
    proses: [{
      key: "ga-util", name: "GA UTILITY", areaType: "predefined-per-sub",
      subs: [
        { name: "Pembersihan, Perbaikan Kipas & AC", areas: ["Genba", "Office"] },
        { name: "Pengecekan Panel", areas: ["Genba", "Outside"] },
        { name: "Pengecekan Utility", areas: ["Utility"] },
        { name: "Instalasi Listrik", areas: ["All Area"] },
        { name: "Pengurusan Tandon Air, IPAL, Septick Tank", areas: ["Pump Room", "IPAL"] },
        { name: "Pemasangan & Penggantian Lampu", areas: ["All Area"] },
        { name: "Pekerjaan Workshop", areas: ["Workshop"] },
      ],
    }],
  },
  {
    deptKey: "GA-FASUM", deptName: "GA FASUM",
    proses: [{
      key: "ga-fasum", name: "GA FASUM", areaType: "none",
      subs: [
        { name: "Pengecatan Lantai & Dinding", areas: [] },
        { name: "Perbaikan Fasilitas Umum (Workshop)", areas: [] },
        { name: "Bekerja di Ketinggian", areas: [] },
      ],
    }],
  },
  {
    deptKey: "GA-ENV", deptName: "GA ENV",
    proses: [{
      key: "ga-env", name: "GA ENV", areaType: "none",
      subs: [
        { name: "Pengambilan, Pembersihan, Packing, Pemuatan Limbah B3 & Non B3", areas: [] },
        { name: "Perusakan Scrap Limbah B3", areas: [] },
      ],
    }],
  },
  {
    deptKey: "WAREHOUSE", deptName: "WAREHOUSE",
    proses: [{
      key: "wh", name: "WAREHOUSE", areaType: "predefined-per-sub",
      subs: [
        { name: "Driver & Receiving Storage", areas: ["Main Rack", "Loading Dock"] },
        { name: "Chorobiki Pre Assy", areas: ["Main Rack", "Genba"] },
        { name: "Ministore FA & Protector", areas: ["Ministore", "Genba"] },
        { name: "Supply FA & Protector", areas: ["Ministore", "Genba"] },
      ],
    }],
  },
  {
    deptKey: "EXIM", deptName: "EXIM",
    proses: [{
      key: "exim", name: "EXIM", areaType: "predefined-per-sub",
      subs: [
        { name: "Driver Forklift", areas: ["Loading Dock"] },
        { name: "Prepare Box", areas: ["Prepare Box"] },
        { name: "Supply Box & Finish Good", areas: ["Loading Dock", "Genba"] },
      ],
    }],
  },
  {
    deptKey: "MTC", deptName: "MTC",
    proses: [{
      key: "mtc", name: "MTC", areaType: "predefined-per-sub",
      subs: [
        { name: "Preventive", areas: ["Genba"] },
        { name: "Back Up Produksi", areas: ["Genba"] },
      ],
    }],
  },
  {
    deptKey: "PROD-DESIGN", deptName: "PROD. DESIGN",
    proses: [{
      key: "pd", name: "PROD. DESIGN", areaType: "predefined-per-sub",
      subs: [
        { name: "Back Up Produksi", areas: ["Genba"] },
        { name: "Preventive", areas: ["Genba"] },
        { name: "Preparation", areas: ["Jig Proto"] },
      ],
    }],
  },
  {
    deptKey: "PROD-ENG", deptName: "PROD. ENG",
    proses: [{
      key: "pe", name: "PROD. ENG", areaType: "predefined-per-sub",
      subs: [
        { name: "Fabrikasi", areas: ["Jig Proto"] },
        { name: "Drawing", areas: ["Office"] },
        { name: "Back Up Produksi", areas: ["Genba"] },
        { name: "Preventive", areas: ["Genba"] },
        { name: "CNC", areas: ["Area CNC"] },
      ],
    }],
  },
];

// ─── FINDING OPTIONS ──────────────────────────────────────────────────────────

const FINDING_OPTIONS = [
  "Rusak / tdk layak pakai",
  "Belum dapat APD",
  "APD hilang",
  "Spesifikasi APD tidak sesuai standar, size tidak ada",
  "Tidak pakai tanpa alasan",
  "Cara pakai APD tidak sesuai standar",
  "Lain-lain",
];

export interface ApdProblemCategory {
  key: string;
  label: string;
  desc: string;
  color: string;
}

export const APD_PROBLEM_CATEGORIES: ApdProblemCategory[] = [
  { key: "rusak", label: "Rusak / tdk layak pakai", desc: "APD robek, patah, aus, atau fungsi proteksi menurun", color: "#ef4444" },
  { key: "belum_dapat", label: "Belum dapat APD", desc: "Karyawan baru / belum menerima distribusi APD", color: "#f97316" },
  { key: "hilang", label: "APD hilang", desc: "APD tertinggal, hilang, atau tidak dapat ditemukan", color: "#eab308" },
  { key: "spesifikasi", label: "Spesifikasi APD tidak sesuai standar, size tidak ada", desc: "Ukuran tidak pas atau tidak sesuai standar K3", color: "#8b5cf6" },
  { key: "tidak_pakai", label: "Tidak pakai tanpa alasan", desc: "Sengaja tidak mengenakan APD saat bekerja", color: "#dc2626" },
  { key: "cara_pakai", label: "Cara pakai APD tidak sesuai standar", desc: "Posisi pakai salah atau tidak melindungi area kerja", color: "#06b6d4" },
  { key: "lain_lain", label: "Lain-lain", desc: "Temuan kondisi abnormal lainnya", color: "#64748b" },
];

export const MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// ─── TYPES ────────────────────────────────────────────────────────────────────

// Satu "baris inspeksi" = satu proses + sub + area/CV
// Model baru: per area, ada jumlah OK/NOK manpower
interface InspectionRow {
  id: string;
  area: string;         // nama area atau nama CV
  jumlahMP: number;     // total man power dicek
  okCount: number;
  nokCount: number;
  // N-OK detail (per NIK)
  nokDetails: NokDetail[];
}

interface NokDetail {
  id: string;
  nik: string;
  finding: string;       // from FINDING_OPTIONS
  findingCustom: string; // if "Lain-lain"
  tindakan: string;
  pic: string;
}

interface InspectionEntry {
  id: string;
  deptKey: string;
  deptName: string;
  prosesKey: string;
  prosesName: string;
  subName: string;
  areaType?: string;
  sourceAreaName?: string;
  inspectorId?: string;
  inspectorName?: string;
  scanVerified?: boolean;
  date: string;
  rows: InspectionRow[];
  savedAt: number;
  updatedAt?: string;
  isEdited?: boolean;
}

// ─── ACCENT COLORS ────────────────────────────────────────────────────────────

interface AC { dot: string; light: string; bar: string; ring: string }
const ACCENT: Record<string, AC> = {
  PRODUKSI: { dot: "#2563eb", light: "#eff6ff", bar: "#3b82f6", ring: "#bfdbfe" },
  QA: { dot: "#7c3aed", light: "#f5f3ff", bar: "#8b5cf6", ring: "#ddd6fe" },
  GA: { dot: "#059669", light: "#ecfdf5", bar: "#10b981", ring: "#a7f3d0" },
  "GA-FASUM": { dot: "#0d9488", light: "#f0fdfa", bar: "#14b8a6", ring: "#99f6e4" },
  "GA-ENV": { dot: "#0891b2", light: "#ecfeff", bar: "#06b6d4", ring: "#a5f3fc" },
  WAREHOUSE: { dot: "#d97706", light: "#fffbeb", bar: "#f59e0b", ring: "#fde68a" },
  EXIM: { dot: "#0891b2", light: "#ecfeff", bar: "#06b6d4", ring: "#a5f3fc" },
  MTC: { dot: "#e11d48", light: "#fff1f2", bar: "#f43f5e", ring: "#fecdd3" },
  "PROD-DESIGN": { dot: "#9333ea", light: "#fdf4ff", bar: "#a855f7", ring: "#e9d5ff" },
  "PROD-ENG": { dot: "#0f766e", light: "#f0fdfa", bar: "#14b8a6", ring: "#99f6e4" },
};
const ac = (key: string): AC => ACCENT[key] ?? { dot: "#6b7280", light: "#f9fafb", bar: "#9ca3af", ring: "#e5e7eb" };

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
  .apd-page { min-height:100vh; background:#f1f5f9; }
  .apd-main { margin-left:280px; min-width:0; transition:margin-left .3s; }
  @media (min-width:481px) and (max-width:1024px){ .apd-main{margin-left:240px;} }
  @media (max-width:480px){ .apd-main{margin-left:0!important;padding-top:56px;} }
  .sidebar-container.collapsed ~ .apd-main,
  body:has(.sidebar-container.collapsed) .apd-main { margin-left:80px; }
  .apd-inner { max-width:900px; margin:0 auto; padding:20px 18px 56px; }
  @media (max-width:640px){ .apd-inner{padding:12px 10px 56px;} }

  .apd-card { background:#fff; border:1px solid #e2e8f0; border-radius:14px; box-shadow:0 1px 6px rgba(0,0,0,.06); }
  .dept-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  @media (max-width:520px){ .dept-grid{grid-template-columns:1fr;} }

  .apd-btn-row { display:flex; align-items:center; width:100%; text-align:left;
    border:1.5px solid #e2e8f0; border-radius:10px; background:#fff;
    cursor:pointer; font-family:inherit; transition:all .15s; }
  .apd-btn-row:hover { border-color:#93c5fd; background:#eff6ff; box-shadow:0 2px 10px rgba(37,99,235,.08); }

  .apd-save { display:flex; align-items:center; gap:8px; padding:10px 22px;
    border:none; border-radius:10px; font-size:14px; font-weight:700;
    cursor:pointer; font-family:inherit; transition:all .15s; }
  .apd-save:not(:disabled) { background:#2563eb; color:#fff; box-shadow:0 2px 8px rgba(37,99,235,.25); }
  .apd-save:not(:disabled):hover { background:#1d4ed8; }
  .apd-save:disabled { background:#e2e8f0; color:#94a3b8; cursor:not-allowed; }

  .apd-add-btn { width:100%; padding:10px; border:2px dashed #e2e8f0; border-radius:10px;
    background:none; color:#94a3b8; font-size:13px; font-weight:600;
    cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;
    font-family:inherit; transition:all .15s; }
  .apd-add-btn:hover { border-color:#93c5fd; color:#2563eb; background:#eff6ff; }

  .apd-input-field { width:100%; padding:8px 11px; border:1px solid #e2e8f0;
    border-radius:8px; font-size:13px; color:#1e293b; background:#f8fafc;
    outline:none; font-family:inherit; box-sizing:border-box; transition:border-color .15s,box-shadow .15s; }
  .apd-input-field:focus { border-color:#3b82f6; background:#fff; box-shadow:0 0 0 3px rgba(59,130,246,.12); }
  .apd-input-field:disabled { background:#f1f5f9; color:#94a3b8; cursor:not-allowed; }

  .num-input { width:70px; padding:7px 10px; border:1px solid #e2e8f0; border-radius:8px;
    font-size:15px; font-weight:700; color:#1e293b; background:#f8fafc; text-align:center;
    outline:none; font-family:inherit; box-sizing:border-box; transition:border-color .15s,box-shadow .15s; }
  .num-input:focus { border-color:#3b82f6; background:#fff; box-shadow:0 0 0 3px rgba(59,130,246,.12); }
  @media (max-width:480px){ .num-input{width:56px; font-size:14px;} }

  .tab-btn { padding:7px 16px; border:none; border-radius:8px; font-size:13px;
    font-weight:600; cursor:pointer; font-family:inherit; transition:all .15s; }
  .tab-btn.active   { background:#2563eb; color:#fff; box-shadow:0 2px 6px rgba(37,99,235,.25); }
  .tab-btn.inactive { background:#f1f5f9; color:#64748b; }
  .tab-btn.inactive:hover { background:#e2e8f0; }

  /* inspection area card */
  .area-card { border:1.5px solid #e2e8f0; border-radius:12px; overflow:hidden; margin-bottom:14px; }
  .area-card-head { background:#f8fafc; border-bottom:1px solid #e2e8f0; padding:12px 16px;
    display:flex; align-items:center; gap:10px; }

  /* stat boxes */
  .stat-row { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:14px; }
  @media (max-width:480px){ .stat-row{grid-template-columns:1fr 1fr;} }
  .stat-box { border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; text-align:center; }

  /* NOK table */
  .nok-table { width:100%; border-collapse:collapse; font-size:12px; }
  .nok-table th { background:#fef2f2; color:#b91c1c; font-weight:700;
    padding:8px 10px; border:1px solid #fecaca; text-align:left; white-space:nowrap; }
  .nok-table td { padding:8px 10px; border:1px solid #f3f4f6; vertical-align:top; }
  .nok-table tr:nth-child(even) td { background:#fafafa; }

  /* Summary table */
  .sum-table { width:100%; border-collapse:collapse; font-size:12px; }
  .sum-table th { background:#f8fafc; color:#475569; font-weight:700;
    padding:9px 12px; border:1px solid #e2e8f0; white-space:nowrap; }
  .sum-table td { padding:8px 12px; border:1px solid #e2e8f0; color:#334155; }
  .sum-table tr:nth-child(even) td { background:#fafbfc; }

  /* Chart */
  .chart-wrap { display:flex; flex-direction:column; gap:9px; }
  .chart-row  { display:flex; align-items:center; gap:10px; }
  .chart-lbl  { width:230px; font-size:11px; color:#475569; font-weight:500; flex-shrink:0; text-align:right; }
  @media (max-width:520px){ .chart-lbl{width:90px; font-size:10px;} }
  .chart-track { flex:1; background:#e2e8f0; border-radius:999px; height:20px; overflow:hidden; }
  .chart-fill  { height:100%; border-radius:999px; display:flex; align-items:center;
    padding-left:8px; transition:width .5s; }
  .chart-fill span { font-size:11px; font-weight:700; color:#fff; white-space:nowrap; }

  /* Action buttons */
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

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const pctOK = (row: InspectionRow) =>
  row.jumlahMP > 0 ? Math.round((row.okCount / row.jumlahMP) * 100) : 0;

const entryAvgPct = (e: InspectionEntry) => {
  if (!e.rows.length) return 0;
  const v = e.rows.map(pctOK);
  return Math.round(v.reduce((a, b) => a + b) / v.length);
};

const mkId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

const mkNok = (): NokDetail => ({ id: mkId(), nik: "", finding: "", findingCustom: "", tindakan: "", pic: "" });

const mkRow = (area: string): InspectionRow =>
  ({ id: mkId(), area, jumlahMP: 0, okCount: 0, nokCount: 0, nokDetails: [] });

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────

function PctPill({ v }: { v: number }) {
  const bg = v === 100 ? "#d1fae5" : v > 60 ? "#dbeafe" : v > 0 ? "#fef3c7" : "#f1f5f9";
  const color = v === 100 ? "#065f46" : v > 60 ? "#1e40af" : v > 0 ? "#92400e" : "#6b7280";
  return <span style={{
    display: "inline-block", padding: "3px 10px", borderRadius: 999,
    fontWeight: 700, fontSize: 12, background: bg, color, whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums"
  }}>{v}%</span>;
}

function Bar({ v, color = "#3b82f6", h = 4 }: { v: number; color?: string; h?: number }) {
  return <div style={{ background: "#e2e8f0", borderRadius: 999, height: h, overflow: "hidden" }}>
    <div style={{ width: `${v}%`, height: "100%", background: color, borderRadius: 999, transition: "width .5s" }} />
  </div>;
}

function Chip({ label, a }: { label: string; a: AC }) {
  return <span style={{
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "3px 10px", borderRadius: 999, background: a.light, border: `1px solid ${a.ring}`,
    fontSize: 11, fontWeight: 700, color: a.dot, whiteSpace: "nowrap"
  }}>
    <span style={{ width: 6, height: 6, borderRadius: "50%", background: a.dot, flexShrink: 0 }} />
    {label}
  </span>;
}

function StepBar({ step, labels }: { step: number; labels: string[] }) {
  return <div style={{ display: "flex", alignItems: "flex-start", gap: 0, marginBottom: 22 }}>
    {labels.map((label, i) => {
      const done = i < step, active = i === step;
      return <div key={i} style={{ display: "flex", alignItems: "center", flex: i < labels.length - 1 ? 1 : "none" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0,
            background: done ? "#2563eb" : active ? "#fff" : "#f1f5f9",
            color: done ? "#fff" : active ? "#2563eb" : "#9ca3af",
            border: active ? "2px solid #2563eb" : done ? "2px solid #2563eb" : "2px solid #e2e8f0",
            boxShadow: active ? "0 0 0 3px #dbeafe" : "none", transition: "all .2s"
          }}>
            {done ? <CheckCircle2 size={14} /> : i + 1}
          </div>
          <span style={{
            fontSize: 10, fontWeight: 600, whiteSpace: "nowrap",
            color: active ? "#2563eb" : done ? "#475569" : "#94a3b8"
          }}>{label}</span>
        </div>
        {i < labels.length - 1 && <div style={{
          flex: 1, height: 2, marginBottom: 14,
          background: done ? "#2563eb" : "#e2e8f0", transition: "background .3s"
        }} />}
      </div>;
    })}
  </div>;
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} style={{
    display: "flex", alignItems: "center", gap: 5,
    padding: "7px 13px", border: "1px solid #e2e8f0", borderRadius: 9, background: "#fff",
    color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
  }}
    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc"; }}
    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; }}>
    <ChevronLeft size={15} /> Kembali
  </button>;
}

const Lbl = ({ ch }: { ch: string }) =>
  <span style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>{ch}</span>;

const SectionTitle = ({ ch }: { ch: string }) =>
  <div style={{
    fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: ".07em",
    textTransform: "uppercase", marginBottom: 10
  }}>{ch}</div>;

// ─── ROW FORM COMPONENT ───────────────────────────────────────────────────────

function AreaRowForm({
  row, isCV, idx, canDelete, acColor, labelDisplay,
  onChange, onDelete,
}: {
  row: InspectionRow;
  isCV: boolean;
  idx: number;
  canDelete: boolean;
  acColor: AC;
  labelDisplay?: string;
  onChange: (r: InspectionRow) => void;
  onDelete: () => void;
}) {
  const pct = pctOK(row);

  const upd = (patch: Partial<InspectionRow>) => onChange({ ...row, ...patch });

  const updNok = (nikId: string, patch: Partial<NokDetail>) =>
    upd({ nokDetails: row.nokDetails.map(n => n.id === nikId ? { ...n, ...patch } : n) });

  const addNok = () => upd({ nokDetails: [...row.nokDetails, mkNok()] });
  const delNok = (nikId: string) => upd({ nokDetails: row.nokDetails.filter(n => n.id !== nikId) });

  // sync okCount when jumlahMP or nokCount changes
  const setJumlah = (val: number) => {
    const v = Math.max(0, val);
    const nok = Math.min(row.nokCount, v);
    upd({ jumlahMP: v, nokCount: nok, okCount: v - nok });
  };
  const setNokCount = (val: number) => {
    const v = Math.max(0, Math.min(val, row.jumlahMP));
    upd({ nokCount: v, okCount: row.jumlahMP - v });
  };

  return (
    <div className="area-card">
      {/* Area header */}
      <div className="area-card-head">
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: "#fff",
          border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
        }}>
          <MapPin size={14} color="#3b82f6" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {isCV ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", flexShrink: 0 }}>CV {idx + 1}:</span>
              <input
                type="text"
                value={row.area}
                onChange={e => upd({ area: e.target.value })}
                placeholder={`Nama Conveyor (cth: CV-0${idx + 1})`}
                style={{
                  flex: 1, padding: "5px 10px", border: "1px solid #e2e8f0", borderRadius: 7,
                  fontSize: 13, fontWeight: 600, color: "#1e293b", background: "#fff",
                  outline: "none", fontFamily: "inherit"
                }}
              />
            </div>
          ) : (
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
              {labelDisplay || row.area || <span style={{ color: "#94a3b8" }}>— Area belum dipilih —</span>}
            </div>
          )}
          {row.jumlahMP > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
              <div style={{ flex: 1 }}>
                <Bar v={pct} color={pct === 100 ? "#16a34a" : pct > 0 ? "#3b82f6" : "#e2e8f0"} h={3} />
              </div>
              <span style={{ fontSize: 10, color: "#16a34a", fontWeight: 700 }}>{row.okCount}✓</span>
              <span style={{ fontSize: 10, color: "#dc2626", fontWeight: 700 }}>{row.nokCount}✗</span>
            </div>
          )}
        </div>
        {canDelete && (
          <button onClick={onDelete}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#cbd5e1", padding: 4, lineHeight: 0, flexShrink: 0
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#cbd5e1"; }}>
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <div style={{ padding: "14px 16px" }}>

        {/* ── Stat inputs ──────────────────────────────────────────── */}
        <div className="stat-row">
          {/* Jumlah MP */}
          <div className="stat-box" style={{ borderColor: "#e2e8f0" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>
              JUMLAH MP
            </div>
            <input type="number" min={0} value={row.jumlahMP || ""}
              className="num-input"
              placeholder="0"
              onChange={e => setJumlah(parseInt(e.target.value) || 0)}
              style={{ borderColor: "#e2e8f0" }}
            />
          </div>
          {/* OK */}
          <div className="stat-box" style={{ borderColor: "#bbf7d0" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#16a34a", marginBottom: 6 }}>
              OK
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#16a34a" }}>
              {row.okCount}
            </div>
          </div>
          {/* N-OK */}
          <div className="stat-box" style={{ borderColor: "#fecaca" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#dc2626", marginBottom: 6 }}>
              N-OK
            </div>
            <input type="number" min={0} max={row.jumlahMP} value={row.nokCount || ""}
              className="num-input"
              placeholder="0"
              onChange={e => setNokCount(parseInt(e.target.value) || 0)}
              style={{ borderColor: "#fecaca", color: "#dc2626" }}
            />
          </div>
          {/* %OK */}
          <div className="stat-box" style={{ borderColor: pct === 100 ? "#bbf7d0" : pct > 60 ? "#bfdbfe" : pct > 0 ? "#fde68a" : "#e2e8f0" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>
              % OK
            </div>
            <div style={{
              fontSize: 22, fontWeight: 800,
              color: pct === 100 ? "#16a34a" : pct > 60 ? "#2563eb" : pct > 0 ? "#d97706" : "#94a3b8"
            }}>
              {pct}%
            </div>
          </div>
        </div>

        {/* ── N-OK Detail Table ─────────────────────────────────────── */}
        {row.nokCount > 0 && (
          <div style={{ marginTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <SectionTitle ch={`Detail N-OK (${row.nokCount} orang)`} />
              <button onClick={addNok}
                style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "5px 12px",
                  border: "1px solid #fecaca", borderRadius: 8, background: "#fff5f5",
                  color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
                }}>
                <Plus size={12} /> Tambah NIK
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="nok-table">
                <thead>
                  <tr>
                    <th style={{ width: 34 }}>No</th>
                    <th style={{ minWidth: 100 }}>NIK</th>
                    <th style={{ minWidth: 180 }}>Temuan / Problem</th>
                    <th style={{ minWidth: 160 }}>Tindakan Perbaikan</th>
                    <th style={{ minWidth: 110 }}>PIC</th>
                    <th style={{ width: 36 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {row.nokDetails.map((nok, ni) => (
                    <tr key={nok.id}>
                      <td style={{ textAlign: "center", color: "#94a3b8", fontWeight: 600 }}>{ni + 1}</td>
                      <td>
                        <input type="text" value={nok.nik}
                          onChange={e => updNok(nok.id, { nik: e.target.value })}
                          placeholder="Tulis NIK..."
                          className="apd-input-field"
                          style={{ minWidth: 90 }}
                        />
                      </td>
                      <td>
                        <select value={nok.finding}
                          onChange={e => updNok(nok.id, { finding: e.target.value, findingCustom: "" })}
                          className="apd-input-field"
                          style={{ marginBottom: nok.finding === "Lain-lain" ? 6 : 0 }}>
                          <option value="">— Pilih Temuan —</option>
                          {FINDING_OPTIONS.map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                        {nok.finding === "Lain-lain" && (
                          <input type="text" value={nok.findingCustom}
                            onChange={e => updNok(nok.id, { findingCustom: e.target.value })}
                            placeholder="Tulis temuan lain-lain..."
                            className="apd-input-field"
                          />
                        )}
                      </td>
                      <td>
                        <textarea value={nok.tindakan}
                          onChange={e => updNok(nok.id, { tindakan: e.target.value })}
                          placeholder="Tulis tindakan perbaikan..."
                          rows={2}
                          className="apd-input-field"
                          style={{ resize: "vertical", minHeight: 52 }}
                        />
                      </td>
                      <td>
                        <input type="text" value={nok.pic}
                          onChange={e => updNok(nok.id, { pic: e.target.value })}
                          placeholder="Nama PIC..."
                          className="apd-input-field"
                        />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button onClick={() => delNok(nok.id)}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "#fca5a5", padding: 4, lineHeight: 0
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#dc2626"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#fca5a5"; }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {row.nokDetails.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{
                        textAlign: "center", color: "#94a3b8",
                        fontStyle: "italic", padding: "12px"
                      }}>
                        Klik "Tambah NIK" untuk menambah detail N-OK
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

type Page = "inspection" | "summary" | "edit";

export function EChecksheetInsApdForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading: authLoading, isInitialized } = useAuth();

  const areaNameParam = params.get("areaName") || "Area";
  const areaType = params.get("areaType") || "";

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!mounted || !isInitialized || authLoading) return;
    if (!user || !isAuthorizedForChecksheet(user))
      setTimeout(() => { if (!user || !isAuthorizedForChecksheet(user)) router.push("/login-page"); }, 1500);
  }, [user, authLoading, isInitialized, router, mounted]);

  const [page, setPage] = useState<Page>("inspection");
  const [step, setStep] = useState(0);
  const [selDept, setSelDept] = useState<DeptConfig | null>(null);
  const [selProc, setSelProc] = useState<ProsesConfig | null>(null);

  // step-2 form state
  const [selSub, setSelSub] = useState("");
  const [selArea, setSelArea] = useState("");
  const [rows, setRows] = useState<InspectionRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [entries, setEntries] = useState<InspectionEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false); // preview/konfirmasi sebelum simpan
  const [summaryTab, setSummaryTab] = useState<"ringkasan" | "bulanan">("ringkasan"); // tab tabel Summary Prosentase

  // state edit & hapus data riwayat
  const [editingEntry, setEditingEntry] = useState<InspectionEntry | null>(null);
  const [editRows, setEditRows] = useState<InspectionRow[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [deletingEntry, setDeletingEntry] = useState<InspectionEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // state modal detail inspeksi
  const [viewingEntry, setViewingEntry] = useState<InspectionEntry | null>(null);

  // filter mandiri untuk tabel & sesi riwayat inspeksi
  const [historySearch, setHistorySearch] = useState("");
  const [historyDeptFilter, setHistoryDeptFilter] = useState("");
  const [useIndependentFilter, setUseIndependentFilter] = useState(false);
  const [localHistoryYear, setLocalHistoryYear] = useState(new Date().getFullYear());
  const [localHistoryMonth, setLocalHistoryMonth] = useState("");

  // ── Master Labels state ───────────────────────────────────────────────
  // Menyimpan custom label & deleted markers dari database: { dept: {key: name}, proses: {key: name}, area: {compositeKey: name}, deleted: {key: 'DELETED'} }
  const [masterLabels, setMasterLabels] = useState<{
    dept: Record<string, string>;
    proses: Record<string, string>;
    area: Record<string, string>;
    deleted: Record<string, string>;
  }>({ dept: {}, proses: {}, area: {}, deleted: {} });
  const [customMasterItems, setCustomMasterItems] = useState<{
    dept: any[];
    proses: any[];
    sub: any[];
    area: any[];
  }>({ dept: [], proses: [], sub: [], area: [] });
  const [loadingLabels, setLoadingLabels] = useState(false);
  const [savingLabel, setSavingLabel] = useState(""); // key yang sedang disimpan
  const [deletingMasterKey, setDeletingMasterKey] = useState(""); // key yang sedang dihapus

  // Sub-tab halaman Edit
  const [editPageTab, setEditPageTab] = useState<"riwayat" | "master-data">("riwayat");

  // State form rename (edit master data)
  const [renameDeptKey, setRenameDeptKey] = useState<string | null>(null);
  const [renameDeptVal, setRenameDeptVal] = useState("");
  const [renameProsesKey, setRenameProsesKey] = useState<string | null>(null);
  const [renameProsesVal, setRenameProsesVal] = useState("");
  const [renameAreaKey, setRenameAreaKey] = useState<string | null>(null);
  const [renameAreaVal, setRenameAreaVal] = useState("");
  // Untuk area: perlu pilih proses & sub dulu
  const [masterAreaProses, setMasterAreaProses] = useState(""); // prosesKey
  const [masterAreaSub, setMasterAreaSub] = useState("");    // subName

  // State Modal Tambah Master Data
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [showAddProsesModal, setShowAddProsesModal] = useState(false);
  const [newProsesDeptKey, setNewProsesDeptKey] = useState("");
  const [newProsesName, setNewProsesName] = useState("");
  const [newProsesAreaType, setNewProsesAreaType] = useState<"predefined-per-sub" | "cv" | "none">("predefined-per-sub");
  const [showAddSubModal, setShowAddSubModal] = useState(false);
  const [newSubProsesKey, setNewSubProsesKey] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [newAreaProsesKey, setNewAreaProsesKey] = useState("");
  const [newAreaSubName, setNewAreaSubName] = useState("");
  const [newAreaName, setNewAreaName] = useState("");
  const [isAddingMaster, setIsAddingMaster] = useState(false);
  const [addMasterError, setAddMasterError] = useState("");

  const wizardRef = useRef<HTMLDivElement>(null);
  const scrollUp = () => wizardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  // ── fetch riwayat inspeksi dari PostgreSQL ─────────────────────────────
  const loadEntries = async () => {
    setLoadingEntries(true);
    try {
      const res = await fetch("/e-checksheet-ga/api/apd/inspections");
      if (!res.ok) {
        const text = await res.text();
        console.error("Gagal load entries (HTTP " + res.status + "):", text);
        return;
      }
      const json = await res.json();
      if (json.success) {
        setEntries(json.data as InspectionEntry[]);
      } else {
        console.error("Gagal load entries:", json.message);
      }
    } catch (err) {
      console.error("Fetch entries error:", err);
    } finally {
      setLoadingEntries(false);
    }
  };

  // ── fetch master labels & custom items dari database ───────────────────
  const loadMasterLabels = async () => {
    setLoadingLabels(true);
    try {
      const res = await fetch("/e-checksheet-ga/api/apd/master-labels");
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) {
        setMasterLabels({
          dept: json.data?.dept || {},
          proses: json.data?.proses || {},
          area: json.data?.area || {},
          deleted: json.data?.deleted || {},
        });
        if (json.customItems) {
          setCustomMasterItems({
            dept: json.customItems.dept || [],
            proses: json.customItems.proses || [],
            sub: json.customItems.sub || [],
            area: json.customItems.area || [],
          });
        }
      }
    } catch (err) {
      console.error("Fetch master labels error:", err);
    } finally {
      setLoadingLabels(false);
    }
  };

  // ── simpan satu label ke database ─────────────────────────────────────
  const saveMasterLabel = async (
    label_type: "dept" | "proses" | "area",
    key: string,
    custom_name: string
  ) => {
    setSavingLabel(key);
    try {
      const res = await fetch("/e-checksheet-ga/api/apd/master-labels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label_type, key, custom_name }),
      });
      const json = await res.json();
      if (json.success) {
        // update state lokal tanpa refetch
        setMasterLabels(prev => ({
          ...prev,
          [label_type]: custom_name.trim()
            ? { ...prev[label_type], [key]: custom_name.trim() }
            : Object.fromEntries(Object.entries(prev[label_type]).filter(([k]) => k !== key)),
        }));
      }
    } catch (err) {
      console.error("Save master label error:", err);
    } finally {
      setSavingLabel("");
      setRenameDeptKey(null);
      setRenameProsesKey(null);
      setRenameAreaKey(null);
    }
  };

  // ── tambah item master (dept, proses, sub, area) ──────────────────────
  const handleAddMasterItem = async (
    item_type: "dept" | "proses" | "sub" | "area",
    item_name: string,
    parent_key?: string,
    area_type?: string
  ) => {
    if (!item_name.trim()) return;
    setIsAddingMaster(true);
    setAddMasterError("");
    try {
      const res = await fetch("/e-checksheet-ga/api/apd/master-labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_type,
          item_name: item_name.trim(),
          parent_key,
          area_type: area_type || "predefined-per-sub",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || `Gagal menambah ${item_type}`);
      }
      // reload master labels & custom items
      await loadMasterLabels();
      setShowAddDeptModal(false);
      setShowAddProsesModal(false);
      setShowAddSubModal(false);
      setShowAddAreaModal(false);
      setNewDeptName("");
      setNewProsesName("");
      setNewSubName("");
      setNewAreaName("");
    } catch (err) {
      console.error(`Add master ${item_type} error:`, err);
      setAddMasterError(err instanceof Error ? err.message : "Gagal menambah data");
    } finally {
      setIsAddingMaster(false);
    }
  };

  // ── hapus item master (dept, proses, sub, area) ───────────────────────
  const handleDeleteMasterItem = async (
    item_type: "dept" | "proses" | "sub" | "area",
    key: string,
    displayName: string
  ) => {
    const confirmMsg = `Yakin ingin menghapus ${item_type.toUpperCase()} "${displayName}"?\n\nPerhatian: Item ini akan disembunyikan dari daftar pilihan inspeksi.`;
    if (!window.confirm(confirmMsg)) return;

    setDeletingMasterKey(key);
    try {
      const res = await fetch("/e-checksheet-ga/api/apd/master-labels", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_type, key }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.message || `Gagal menghapus ${item_type}`);
        return;
      }
      // Jika yang dihapus sedang dipilih di form atau masterArea, reset
      if (item_type === "dept" && selDept?.deptKey === key) {
        setSelDept(null);
        setStep(0);
      }
      if (item_type === "proses" && (selProc?.key === key || masterAreaProses === key)) {
        if (selProc?.key === key) { setSelProc(null); setStep(1); }
        if (masterAreaProses === key) { setMasterAreaProses(""); setMasterAreaSub(""); }
      }
      if (item_type === "sub" && (selSub === key || masterAreaSub === key)) {
        if (selSub === key) setSelSub("");
        if (masterAreaSub === key) setMasterAreaSub("");
      }

      await loadMasterLabels();
    } catch (err) {
      console.error(`Delete master ${item_type} error:`, err);
      alert("Terjadi kesalahan saat menghapus data");
    } finally {
      setDeletingMasterKey("");
    }
  };

  // ── helper: resolve label dengan custom override ───────────────────────
  const resolveLabel = (
    type: "dept" | "proses" | "area",
    key: string,
    defaultName: string
  ): string => masterLabels[type][key] ?? defaultName;

  useEffect(() => {
    if (mounted && isInitialized && !authLoading && user) {
      loadEntries();
      loadMasterLabels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isInitialized, authLoading, !!user]);

  // ── Struktur Master Dinamis (Gabungan DEPT_CONFIG bawaan + Custom Items - Deleted) ──
  const dynamicDeptConfig = useMemo((): DeptConfig[] => {
    // 1. Ambil daftar dept bawaan yang belum dihapus
    const baseDepts: DeptConfig[] = DEPT_CONFIG
      .filter(d => !masterLabels.deleted[d.deptKey])
      .map(d => ({
        deptKey: d.deptKey,
        deptName: d.deptName,
        proses: d.proses
          .filter(p => !masterLabels.deleted[p.key])
          .map(p => ({
            key: p.key,
            name: p.name,
            areaType: p.areaType,
            subs: p.subs
              .filter(s => !masterLabels.deleted[`${p.key}::${s.name}`])
              .map(s => ({
                name: s.name,
                areas: s.areas.filter(a => !masterLabels.deleted[`${p.key}::${s.name}::${a}`]),
              })),
          })),
      }));

    // 2. Tambahkan custom depts
    const customDeptsList = customMasterItems.dept.filter(d => !masterLabels.deleted[d.item_key]);
    for (const cd of customDeptsList) {
      if (!baseDepts.some(b => b.deptKey === cd.item_key)) {
        baseDepts.push({
          deptKey: cd.item_key,
          deptName: cd.item_name,
          proses: [],
        });
      }
    }

    // 3. Tambahkan custom proses ke dept yang sesuai
    const customProsesList = customMasterItems.proses.filter(p => !masterLabels.deleted[p.item_key]);
    for (const cp of customProsesList) {
      const parentDept = baseDepts.find(d => d.deptKey === cp.parent_key);
      if (parentDept && !parentDept.proses.some(p => p.key === cp.item_key)) {
        parentDept.proses.push({
          key: cp.item_key,
          name: cp.item_name,
          areaType: (cp.area_type as any) || "predefined-per-sub",
          subs: [],
        });
      }
    }

    // 4. Tambahkan custom subs ke proses yang sesuai
    const customSubsList = customMasterItems.sub.filter(s => !masterLabels.deleted[s.item_key]);
    for (const cs of customSubsList) {
      for (const d of baseDepts) {
        const proc = d.proses.find(p => p.key === cs.parent_key);
        if (proc && !proc.subs.some(s => s.name === cs.item_name)) {
          proc.subs.push({
            name: cs.item_name,
            areas: [],
          });
        }
      }
    }

    // 5. Tambahkan custom areas ke sub yang sesuai
    const customAreasList = customMasterItems.area.filter(a => !masterLabels.deleted[a.item_key]);
    for (const ca of customAreasList) {
      // ca.parent_key format: "prosesKey::subName"
      const [pKey, ...restSub] = (ca.parent_key || "").split("::");
      const sName = restSub.join("::");
      if (pKey && sName) {
        for (const d of baseDepts) {
          const proc = d.proses.find(p => p.key === pKey);
          if (proc) {
            const sub = proc.subs.find(s => s.name === sName);
            if (sub && !sub.areas.includes(ca.item_name)) {
              sub.areas.push(ca.item_name);
            }
          }
        }
      }
    }

    return baseDepts;
  }, [customMasterItems, masterLabels.deleted]);

  // derived
  const currentSub = selProc?.subs?.find(s => s.name === selSub);
  const areaOptions = currentSub?.areas ?? [];
  const isCV = selProc?.areaType === "cv" ||
    (selSub === "Checker & Packing" && selProc?.key === "qa-final-assy");

  // ── navigation ────────────────────────────────────────────────────────────
  const goToDept = (d: DeptConfig) => {
    setSelDept(d); setSelProc(null); resetStep2(); setStep(1); scrollUp();
  };
  const goToProc = (p: ProsesConfig) => {
    setSelProc(p); resetStep2(); setStep(2); scrollUp();
  };
  const goBack = () => {
    if (step === 2) { setStep(1); resetStep2(); }
    else if (step === 1) { setStep(0); setSelDept(null); }
    scrollUp();
  };

  const resetStep2 = () => {
    setSelSub(""); setSelArea(""); setRows([]); setSaveError("");
  };

  // when sub changes: reset area, then (re)initialize rows depending on mode.
  // NOTE: this used to be split into 3 effects, one of which only re-ran on
  // `isCV` changing — for procs where areaType is already "cv" (e.g. FINAL ASSY),
  // `isCV` never changes between sub-proses, so switching sub-proses left `rows`
  // empty forever and the CV form never appeared. This single effect re-runs on
  // every sub-proses change instead.
  useEffect(() => {
    setSelArea("");
    if (!selSub) { setRows([]); return; }
    if (isCV) {
      setRows([mkRow("")]);
    } else if ((currentSub?.areas?.length ?? 0) === 0) {
      // tidak ada area spesifik untuk sub-proses ini -> satu baris implisit
      setRows([mkRow("-")]);
    } else {
      setRows([]); // menunggu pemilihan Area
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selSub, isCV]);

  // when area changes (predefined, non-CV, punya daftar area), build single row
  useEffect(() => {
    if (!isCV && areaOptions.length > 0) {
      if (selArea) setRows([mkRow(selArea)]);
      else setRows([]);
    }
  }, [selArea, isCV, areaOptions.length]);

  // ── row mutations ─────────────────────────────────────────────────────────
  const updateRow = (rowId: string, updated: InspectionRow) =>
    setRows(prev => prev.map(r => r.id === rowId ? updated : r));

  const addCvRow = () => setRows(prev => [...prev, mkRow("")]);

  const deleteCvRow = (rowId: string) =>
    setRows(prev => prev.filter(r => r.id !== rowId));

  // ── save ──────────────────────────────────────────────────────────────────
  // Tanggal/waktu data disimpan otomatis mengikuti waktu realtime saat "Simpan"
  // ditekan (bukan input manual). Input bulan di halaman Summary hanya
  // dipakai sebagai filter untuk Riwayat Inspeksi, bukan untuk menentukan
  // tanggal yang tersimpan.
  const openConfirm = () => {
    if (!canSave || !selDept || !selProc || !selSub) return;
    setSaveError("");
    setShowConfirm(true);
  };

  const handleSave = async () => {
    if (!selDept || !selProc || !selSub) return;
    setIsSaving(true);
    setSaveError("");

    try {
      const payload = {
        deptKey: selDept.deptKey,
        deptName: resolveLabel("dept", selDept.deptKey, selDept.deptName),
        prosesKey: selProc.key,
        prosesName: resolveLabel("proses", selProc.key, selProc.name),
        subName: selSub,
        areaType: isCV ? "cv" : areaOptions.length > 0 ? "predefined-per-sub" : "none",
        sourceAreaName: areaNameParam,
        inspectorId: (user as any)?.nik || (user as any)?.id || "",
        inspectorName: user?.fullName || "",
        rows: rows.map(r => ({
          area: r.area,
          jumlahMP: r.jumlahMP,
          okCount: r.okCount,
          nokCount: r.nokCount,
          nokDetails: r.nokDetails.map(n => ({
            nik: n.nik,
            finding: n.finding,
            findingCustom: n.findingCustom,
            tindakan: n.tindakan,
            pic: n.pic,
          })),
        })),
      };

      const res = await fetch("/e-checksheet-ga/api/apd/inspections/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let json: any;
      const text = await res.text();
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(`Server response error (${res.status}): ${text.slice(0, 150)}`);
      }

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menyimpan data");
      }

      // reload dari database supaya Summary & Riwayat sinkron
      await loadEntries();

      setShowConfirm(false);
      setStep(0);
      setSelDept(null);
      setSelProc(null);
      resetStep2();
      scrollUp();
    } catch (err) {
      console.error("Save error:", err);
      setSaveError(err instanceof Error ? err.message : "Gagal menyimpan data");
    } finally {
      setIsSaving(false);
    }
  };

  // ── edit & delete riwayat handler ─────────────────────────────────────────
  const handleOpenEdit = (entry: InspectionEntry) => {
    setEditingEntry(entry);
    setEditError("");
    const clonedRows: InspectionRow[] = JSON.parse(JSON.stringify(entry.rows || []));
    setEditRows(clonedRows);
  };

  const handleUpdateEditRow = (rowId: string, updated: InspectionRow) => {
    setEditRows(prev => prev.map(r => r.id === rowId ? updated : r));
  };

  const handleAddEditCvRow = () => {
    setEditRows(prev => [...prev, mkRow("")]);
  };

  const handleDeleteEditCvRow = (rowId: string) => {
    setEditRows(prev => prev.filter(r => r.id !== rowId));
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    setIsSavingEdit(true);
    setEditError("");

    try {
      const isCVEdit = editingEntry.areaType === "cv" ||
        (editingEntry.subName === "Checker & Packing" && editingEntry.prosesKey === "qa-final-assy");

      if (isCVEdit && !editRows.some(r => r.area.trim())) {
        throw new Error("Isi minimal satu nama Conveyor");
      }

      if (editRows.length === 0) {
        throw new Error("Belum ada baris inspeksi area");
      }

      const payload = {
        id: editingEntry.id,
        rows: editRows.map(r => ({
          area: r.area,
          jumlahMP: r.jumlahMP,
          okCount: r.okCount,
          nokCount: r.nokCount,
          nokDetails: r.nokDetails.map(n => ({
            nik: n.nik,
            finding: n.finding,
            findingCustom: n.findingCustom,
            tindakan: n.tindakan,
            pic: n.pic,
          })),
        })),
      };

      const res = await fetch("/e-checksheet-ga/api/apd/inspections/edit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memperbarui data inspeksi");
      }

      await loadEntries();
      setEditingEntry(null);
    } catch (err) {
      console.error("Edit save error:", err);
      setEditError(err instanceof Error ? err.message : "Gagal memperbarui data");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!deletingEntry) return;
    setIsDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch("/e-checksheet-ga/api/apd/inspections/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingEntry.id }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menghapus data inspeksi");
      }

      await loadEntries();
      setDeletingEntry(null);
    } catch (err) {
      console.error("Delete error:", err);
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus data");
    } finally {
      setIsDeleting(false);
    }
  };

  const CURRENT_YEAR = new Date().getFullYear();
  const [historyYear, setHistoryYear] = useState(CURRENT_YEAR);
  const [historyMonthFilter, setHistoryMonthFilter] = useState<string>(""); // "" = semua bulan

  // ── computed ──────────────────────────────────────────────────────────────
  // Sesi / entri yang cocok dengan tahun & bulan filter aktif
  const summaryEntries = useMemo(() => {
    return entries.filter(e => {
      const d = new Date(e.date);
      const matchYear = d.getFullYear() === historyYear;
      const mName = MONTH_NAMES_ID[d.getMonth()];
      const matchMonth = !historyMonthFilter || mName === historyMonthFilter;
      return matchYear && matchMonth;
    });
  }, [entries, historyYear, historyMonthFilter]);

  const overallPct = useMemo(() => {
    if (!summaryEntries.length) return 0;
    const v = summaryEntries.map(entryAvgPct);
    return Math.round(v.reduce((a, b) => a + b) / v.length);
  }, [summaryEntries]);

  // Total MP, OK, NOK di seluruh summaryEntries aktif
  const totalMpActive = useMemo(() =>
    summaryEntries.reduce((s, e) => s + e.rows.reduce((a, r) => a + r.jumlahMP, 0), 0)
  , [summaryEntries]);

  const totalOkActive = useMemo(() =>
    summaryEntries.reduce((s, e) => s + e.rows.reduce((a, r) => a + r.okCount, 0), 0)
  , [summaryEntries]);

  const totalNokActive = useMemo(() =>
    summaryEntries.reduce((s, e) => s + e.rows.reduce((a, r) => a + r.nokCount, 0), 0)
  , [summaryEntries]);

  const summaryRows = useMemo(() =>
    dynamicDeptConfig.flatMap(dept =>
      dept.proses.map(proc => {
        const rel = summaryEntries.filter(e => e.prosesKey === proc.key);
        const totalMP = rel.reduce((s, e) => s + e.rows.reduce((a, r) => a + r.jumlahMP, 0), 0);
        const totalOK = rel.reduce((s, e) => s + e.rows.reduce((a, r) => a + r.okCount, 0), 0);
        const totalNOK = rel.reduce((s, e) => s + e.rows.reduce((a, r) => a + r.nokCount, 0), 0);
        const pct = totalMP > 0 ? Math.round((totalOK / totalMP) * 100) : 0;
        const resolvedDept = resolveLabel("dept", dept.deptKey, dept.deptName);
        const resolvedProses = resolveLabel("proses", proc.key, proc.name);
        return { deptName: resolvedDept, prosesName: resolvedProses, totalMP, totalOK, totalNOK, pct };
      })
    ), [summaryEntries, masterLabels, dynamicDeptConfig]);

  // Rekap bulanan: %OK per proses untuk tiap bulan (Jan–Des) dalam tahun terpilih
  const activeMonthIdx = historyMonthFilter ? MONTH_NAMES_ID.indexOf(historyMonthFilter) : -1;
  const monthIndexesShown = activeMonthIdx >= 0 ? [activeMonthIdx] : MONTHS.map((_, i) => i);

  const monthlySummaryRows = useMemo(() =>
    dynamicDeptConfig.flatMap(dept =>
      dept.proses.map(proc => {
        const relAll = entries.filter(e => {
          const d = new Date(e.date);
          return e.prosesKey === proc.key && d.getFullYear() === historyYear;
        });
        const perMonth = MONTHS.map((_, mIdx) => {
          const rel = relAll.filter(e => new Date(e.date).getMonth() === mIdx);
          const totalMP = rel.reduce((s, e) => s + e.rows.reduce((a, r) => a + r.jumlahMP, 0), 0);
          const totalOK = rel.reduce((s, e) => s + e.rows.reduce((a, r) => a + r.okCount, 0), 0);
          return totalMP > 0 ? Math.round((totalOK / totalMP) * 100) : null;
        });
        const resolvedDept = resolveLabel("dept", dept.deptKey, dept.deptName);
        const resolvedProses = resolveLabel("proses", proc.key, proc.name);
        return { deptName: resolvedDept, prosesName: resolvedProses, perMonth };
      })
    ), [entries, historyYear, masterLabels, dynamicDeptConfig]);

  // Overall %OK per bulan pada tahun terpilih
  const monthlyOverall = useMemo(() =>
    MONTHS.map((_, mIdx) => {
      const rel = entries.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === historyYear && d.getMonth() === mIdx;
      });
      const totalMP = rel.reduce((s, e) => s + e.rows.reduce((a, r) => a + r.jumlahMP, 0), 0);
      const totalOK = rel.reduce((s, e) => s + e.rows.reduce((a, r) => a + r.okCount, 0), 0);
      return totalMP > 0 ? Math.round((totalOK / totalMP) * 100) : 0;
    }), [entries, historyYear]);

  // Problem counts pada summaryEntries (memperhitungkan filter bulan jika aktif)
  const problemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    FINDING_OPTIONS.forEach(f => { counts[f] = 0; });
    summaryEntries.forEach(e => e.rows.forEach(r => r.nokDetails.forEach(n => {
      const key = n.finding || "Lain-lain";
      counts[key] = (counts[key] || 0) + 1;
    })));
    return counts;
  }, [summaryEntries]);

  const totalProblems = Object.values(problemCounts).reduce((a, b) => a + b, 0);

  // Rekap bulanan Problem untuk tahun terpilih: jumlah temuan per kategori per bulan (Jan–Des)
  const monthlyProblemRows = useMemo(() =>
    APD_PROBLEM_CATEGORIES.map(cat => {
      const perMonth = MONTHS.map((_, mIdx) => {
        const rel = entries.filter(e => {
          const d = new Date(e.date);
          return d.getFullYear() === historyYear && d.getMonth() === mIdx;
        });
        let cnt = 0;
        rel.forEach(e => e.rows.forEach(r => r.nokDetails.forEach(n => {
          const key = n.finding || "Lain-lain";
          if (key === cat.label) cnt++;
        })));
        return cnt;
      });
      const totalYear = perMonth.reduce((a, b) => a + b, 0);
      return { ...cat, perMonth, totalYear };
    }), [entries, historyYear]);

  // Total temuan problem per bulan (Jan–Des) untuk tahun terpilih
  const monthlyTotalProblems = useMemo(() =>
    MONTHS.map((_, mIdx) => {
      return monthlyProblemRows.reduce((sum, r) => sum + r.perMonth[mIdx], 0);
    }), [monthlyProblemRows]);

  const overallTotalProblemsYear = monthlyProblemRows.reduce((a, b) => a + b.totalYear, 0);

  const canSave = !!(selSub && rows.length > 0 &&
    (isCV ? rows.some(r => r.area.trim()) : rows.length > 0));

  // Riwayat inspeksi: mendukung filter tersendiri (tahun, bulan, departemen, dan kata kunci pencarian)
  const filteredHistoryEntries = useMemo(() => {
    const yr = useIndependentFilter ? localHistoryYear : historyYear;
    const mo = useIndependentFilter ? localHistoryMonth : historyMonthFilter;

    return entries.filter(e => {
      const d = new Date(e.date);
      const matchYear = !yr || d.getFullYear() === yr;
      const mName = MONTH_NAMES_ID[d.getMonth()];
      const matchMonth = !mo || mName === mo;
      const matchDept = !historyDeptFilter || e.deptKey === historyDeptFilter || e.deptName === historyDeptFilter;

      let matchSearch = true;
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase().trim();
        const inDept = e.deptName.toLowerCase().includes(q);
        const inProc = e.prosesName.toLowerCase().includes(q);
        const inSub = e.subName.toLowerCase().includes(q);
        const inPic = (e.inspectorName || "").toLowerCase().includes(q);
        const inRows = e.rows.some(r =>
          r.area.toLowerCase().includes(q) ||
          r.nokDetails.some(n =>
            n.nik.toLowerCase().includes(q) ||
            n.finding.toLowerCase().includes(q) ||
            (n.findingCustom || "").toLowerCase().includes(q) ||
            (n.pic || "").toLowerCase().includes(q) ||
            (n.tindakan || "").toLowerCase().includes(q)
          )
        );
        matchSearch = inDept || inProc || inSub || inPic || inRows;
      }

      return matchYear && matchMonth && matchDept && matchSearch;
    });
  }, [entries, useIndependentFilter, localHistoryYear, localHistoryMonth, historyYear, historyMonthFilter, historyDeptFilter, historySearch]);

  const filteredEntries = filteredHistoryEntries;

  // ── EXPORT PDF FUNCTION ───────────────────────────────────────────────────
  const exportToPdf = () => {
    try {
      setIsExportingPdf(true);
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Header background
      doc.setFillColor(30, 58, 95); // Deep navy blue
      doc.rect(0, 0, pageWidth, 28, "F");

      // Header title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.text("LAPORAN SUMMARY INSPEKSI APD", pageWidth / 2, 12, { align: "center" });

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(203, 213, 225);
      const filterInfo = `Tahun: ${historyYear}${historyMonthFilter ? ` · Bulan: ${historyMonthFilter}` : " · Seluruh Bulan"}`;
      doc.text(filterInfo, pageWidth / 2, 19, { align: "center" });
      doc.text(
        `Dicetak: ${new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })} | Oleh: ${user?.fullName || "Inspector"}`,
        pageWidth / 2,
        24,
        { align: "center" }
      );

      // ── Key Metrics Cards ──
      const startY = 33;
      const cardW = (pageWidth - 28 - 12) / 4;
      const totalMPAll = summaryRows.reduce((a, r) => a + r.totalMP, 0);
      const totalOKAll = summaryRows.reduce((a, r) => a + r.totalOK, 0);
      const totalNOKAll = summaryRows.reduce((a, r) => a + r.totalNOK, 0);

      const metrics = [
        { label: "TOTAL MAN POWER", val: String(totalMPAll), color: [30, 41, 59] },
        { label: "TOTAL OK", val: String(totalOKAll), color: [22, 163, 74] },
        { label: "TOTAL N-OK", val: String(totalNOKAll), color: [220, 38, 38] },
        { label: "OVERALL % OK", val: `${overallPct}%`, color: [37, 99, 235] },
      ];

      metrics.forEach((m, idx) => {
        const cx = 14 + idx * (cardW + 4);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(cx, startY, cardW, 14, 2, 2, "FD");

        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 116, 139);
        doc.text(m.label, cx + cardW / 2, startY + 4.5, { align: "center" });

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(m.color[0], m.color[1], m.color[2]);
        doc.text(m.val, cx + cardW / 2, startY + 11, { align: "center" });
      });

      let curY = startY + 18;

      // ── Section 1: Summary Problem / Temuan Abnormal ──
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("1. Summary Problem / Temuan Abnormal", 14, curY);

      const tableDataProblem = APD_PROBLEM_CATEGORIES.map((cat, i) => {
        const cnt = problemCounts[cat.label] || 0;
        const pct = totalProblems ? Math.round((cnt / totalProblems) * 100) : 0;
        return [String(i + 1), cat.label, cnt > 0 ? String(cnt) : "-", cnt > 0 ? `${pct}%` : "-"];
      });

      tableDataProblem.push(["", "Total Temuan", String(totalProblems || "-"), "100%"]);

      autoTable(doc, {
        startY: curY + 2,
        head: [["No", "Problem / Temuan Abnormal", "Jumlah", "%"]],
        body: tableDataProblem,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2, font: "helvetica", textColor: [30, 41, 59] },
        headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
        columnStyles: {
          0: { halign: "center", cellWidth: 10 },
          1: { halign: "left" },
          2: { halign: "center", cellWidth: 25, textColor: [220, 38, 38], fontStyle: "bold" },
          3: { halign: "center", cellWidth: 25, fontStyle: "bold" },
        },
        didParseCell: (data) => {
          if (data.row.index === tableDataProblem.length - 1) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fillColor = [254, 242, 242];
          }
        },
        margin: { left: 14, right: 14 },
      });

      curY = (doc as any).lastAutoTable.finalY + 8;

      // ── Section 2: Tabel Summary Prosentase ──
      if (curY > pageHeight - 65) {
        doc.addPage();
        curY = 16;
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("2. Ringkasan Prosentase Pengecekan APD per Proses", 14, curY);

      const tableData1 = summaryRows.map((r, i) => [
        String(i + 1),
        r.deptName,
        r.prosesName,
        r.totalMP > 0 ? String(r.totalMP) : "-",
        r.totalOK > 0 ? String(r.totalOK) : "-",
        r.totalNOK > 0 ? String(r.totalNOK) : "-",
        r.totalMP > 0 ? `${r.pct}%` : "-",
      ]);

      // Total row
      tableData1.push([
        "",
        "TOTAL / OVERALL",
        "",
        String(totalMPAll || "-"),
        String(totalOKAll || "-"),
        String(totalNOKAll || "-"),
        `${overallPct}%`,
      ]);

      autoTable(doc, {
        startY: curY + 2,
        head: [["No", "Dept", "Proses", "Total MP", "OK", "N-OK", "% OK"]],
        body: tableData1,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2, font: "helvetica", textColor: [30, 41, 59] },
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
        columnStyles: {
          0: { halign: "center", cellWidth: 10 },
          1: { halign: "left", cellWidth: 32 },
          2: { halign: "left" },
          3: { halign: "center", cellWidth: 20 },
          4: { halign: "center", cellWidth: 18, textColor: [22, 163, 74], fontStyle: "bold" },
          5: { halign: "center", cellWidth: 18, textColor: [220, 38, 38], fontStyle: "bold" },
          6: { halign: "center", cellWidth: 20, fontStyle: "bold" },
        },
        didParseCell: (data) => {
          if (data.row.index === tableData1.length - 1) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fillColor = [238, 242, 255];
            if (data.column.index === 1) {
              data.cell.colSpan = 2;
            }
          }
        },
        margin: { left: 14, right: 14 },
      });

      curY = (doc as any).lastAutoTable.finalY + 8;

      // ── Section 3: Riwayat Inspeksi Terakhir ──
      if (filteredEntries.length > 0) {
        if (curY > pageHeight - 65) {
          doc.addPage();
          curY = 16;
        }

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(`3. Riwayat Inspeksi (${filteredEntries.length} Record)`, 14, curY);

        const tableData3 = [...filteredEntries].reverse().map((e, idx) => {
          const p = entryAvgPct(e);
          const mp = e.rows.reduce((a, r) => a + r.jumlahMP, 0);
          const ok = e.rows.reduce((a, r) => a + r.okCount, 0);
          const nok = e.rows.reduce((a, r) => a + r.nokCount, 0);
          const dateStr = new Date(e.date).toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          return [
            String(idx + 1),
            dateStr,
            e.deptName,
            `${e.prosesName} - ${e.subName}`,
            String(mp),
            String(ok),
            String(nok),
            `${p}%`,
          ];
        });

        autoTable(doc, {
          startY: curY + 2,
          head: [["No", "Waktu", "Dept", "Proses / Sub", "MP", "OK", "NOK", "%OK"]],
          body: tableData3,
          theme: "striped",
          styles: { fontSize: 7.5, cellPadding: 2, font: "helvetica", textColor: [30, 41, 59] },
          headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
          columnStyles: {
            0: { halign: "center", cellWidth: 8 },
            1: { halign: "center", cellWidth: 28 },
            2: { halign: "left", cellWidth: 26 },
            3: { halign: "left" },
            4: { halign: "center", cellWidth: 12 },
            5: { halign: "center", cellWidth: 12, textColor: [22, 163, 74], fontStyle: "bold" },
            6: { halign: "center", cellWidth: 12, textColor: [220, 38, 38], fontStyle: "bold" },
            7: { halign: "center", cellWidth: 14, fontStyle: "bold" },
          },
          margin: { left: 14, right: 14 },
        });
      }

      // Add page numbers at bottom
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Halaman ${p} dari ${totalPages} — E-CheckSheet APD System`,
          pageWidth / 2,
          pageHeight - 6,
          { align: "center" }
        );
      }

      // Save PDF
      const filename = `Summary_Inspeksi_APD_${historyYear}_${historyMonthFilter || "All"}_${Date.now()}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error("Export PDF error:", err);
      alert("Gagal mengunduh PDF: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsExportingPdf(false);
    }
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="apd-page">
      <style>{CSS}</style>
      <Sidebar userName={user?.fullName} />

      <main className="apd-main">
        <div className="apd-inner">

          {/* ── HEADER ─────────────────────────────────────────────────────── */}
          <div className="apd-card" style={{ marginBottom: 14, overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(135deg,#1e3a5f 0%,#1d4ed8 100%)", padding: "18px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,.15)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    <ShieldCheck size={20} color="#fff" />
                  </div>
                  <div>
                    <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#fff" }}>Inspeksi APD</h1>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,.6)" }}>
                      {areaNameParam}{areaType ? ` · ${areaType}` : ""}
                    </p>
                  </div>
                </div>
                {/* Page tabs */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
                  <button className={`tab-btn ${page === "inspection" ? "active" : "inactive"}`}
                    onClick={() => setPage("inspection")}
                    style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <ClipboardList size={13} /> Form
                  </button>
                  <button className={`tab-btn ${page === "summary" ? "active" : "inactive"}`}
                    onClick={() => setPage("summary")}
                    style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <BarChart3 size={13} /> Summary
                  </button>
                  <button className={`tab-btn ${page === "edit" ? "active" : "inactive"}`}
                    onClick={() => setPage("edit")}
                    style={{ display: "flex", alignItems: "center", gap: 5, position: "relative" }}>
                    <Edit3 size={13} /> Edit
                    {entries.length > 0 && (
                      <span style={{
                        position: "absolute", top: -6, right: -6, width: 16, height: 16,
                        borderRadius: "50%", background: "#ef4444", color: "#fff",
                        fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        {entries.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
              {/* Stats Header */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 14 }}>
                {[
                  { label: "Departemen", val: dynamicDeptConfig.length },
                  { label: "Sesi Tersimpan", val: entries.length },
                  { label: "Temuan Problem", val: overallTotalProblemsYear },
                  { label: "Overall % OK", val: `${overallPct}%` },
                ].map(s => (
                  <div key={s.label} style={{
                    background: "rgba(255,255,255,.1)", borderRadius: 9,
                    padding: "9px 6px", textAlign: "center"
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)", marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              SUMMARY PAGE
          ══════════════════════════════════════════════════════════════════ */}
          {page === "summary" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* ── TOOLBAR FILTER & TINDAKAN TERPADU (Satu Tempat, Tanpa Duplikasi) ── */}
              <div className="apd-card" style={{ padding: "14px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    {/* Filter Tahun */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Calendar size={15} color="#1d4ed8" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Tahun:</span>
                      <select
                        value={historyYear}
                        onChange={e => setHistoryYear(+e.target.value)}
                        style={{
                          padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: 8,
                          fontSize: 13, fontWeight: 700, color: "#1e293b", background: "#f8fafc",
                          outline: "none", fontFamily: "inherit"
                        }}
                      >
                        {[CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>

                    {/* Filter Bulan */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: "#64748b" }}>Filter Bulan:</span>
                      <select
                        value={historyMonthFilter}
                        onChange={e => setHistoryMonthFilter(e.target.value)}
                        style={{
                          padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: 8,
                          fontSize: 13, fontWeight: 600, color: "#1e293b", background: "#fff",
                          outline: "none", fontFamily: "inherit"
                        }}
                      >
                        <option value="">— Semua Bulan —</option>
                        {MONTH_NAMES_ID.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      {historyMonthFilter && (
                        <button
                          type="button"
                          onClick={() => setHistoryMonthFilter("")}
                          style={{
                            padding: "5px 9px", border: "1px solid #e2e8f0", borderRadius: 6,
                            background: "#f1f5f9", fontSize: 11, color: "#64748b", cursor: "pointer",
                            display: "inline-flex", alignItems: "center", gap: 3
                          }}
                        >
                          <X size={12} />
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions & Metrics Indicator */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10, fontSize: 12,
                      background: "#f8fafc", padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0"
                    }}>
                      <span>MP: <b style={{ color: "#1e293b" }}>{totalMpActive}</b></span>
                      <span>·</span>
                      <span style={{ color: "#16a34a" }}>OK: <b>{totalOkActive}</b></span>
                      <span>·</span>
                      <span style={{ color: "#dc2626" }}>NOK: <b>{totalNokActive}</b></span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        onClick={loadEntries}
                        disabled={loadingEntries}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "7px 12px", border: "1px solid #cbd5e1", borderRadius: 8,
                          background: "#fff", color: "#475569", fontSize: 12, fontWeight: 600,
                          cursor: loadingEntries ? "not-allowed" : "pointer", fontFamily: "inherit",
                          transition: "all .15s"
                        }}
                        title="Muat ulang data dari database"
                      >
                        <RefreshCw size={13} className={loadingEntries ? "animate-spin" : ""} />
                        {loadingEntries ? "Memuat..." : "Refresh"}
                      </button>
                      <button
                        onClick={exportToPdf}
                        disabled={isExportingPdf || entries.length === 0}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "7px 14px", border: "none", borderRadius: 8,
                          background: entries.length > 0 ? "#2563eb" : "#e2e8f0",
                          color: entries.length > 0 ? "#fff" : "#94a3b8",
                          fontSize: 12, fontWeight: 700,
                          cursor: entries.length > 0 && !isExportingPdf ? "pointer" : "not-allowed",
                          boxShadow: entries.length > 0 ? "0 2px 6px rgba(37,99,235,.25)" : "none",
                          fontFamily: "inherit", transition: "all .15s"
                        }}
                      >
                        {isExportingPdf ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                        {isExportingPdf ? "PDF..." : "Download PDF"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── GRAFIK & ANALISIS TEMUAN PROBLEM APD (DI ATAS TABEL SUMMARY) ── */}
              <div className="apd-card" style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 9, background: "#fee2e2",
                      border: "1px solid #fca5a5", display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <AlertCircle size={18} color="#dc2626" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#1e293b" }}>
                        Grafik &amp; Analisis Temuan Problem APD ({historyYear})
                      </div>
                      <div style={{ fontSize: 11.5, color: "#94a3b8" }}>
                        Distribusi abnormalitas APD bulanan berdasarkan kategori temuan
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: "4px 12px", borderRadius: 999,
                    background: overallTotalProblemsYear > 0 ? "#fee2e2" : "#dcfce7",
                    color: overallTotalProblemsYear > 0 ? "#dc2626" : "#16a34a",
                    fontWeight: 700, fontSize: 11.5, border: "1px solid"
                  }}>
                    {overallTotalProblemsYear > 0 ? `${overallTotalProblemsYear} Total Temuan (${historyYear})` : "0 Temuan (Semua Sesuai)"}
                  </div>
                </div>

                {/* Ringkasan Cards Kategori Temuan APD */}
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                  gap: 10, marginBottom: 18
                }}>
                  {APD_PROBLEM_CATEGORIES.map(cat => {
                    const cnt = historyMonthFilter
                      ? (problemCounts[cat.label] || 0)
                      : (monthlyProblemRows.find(r => r.key === cat.key)?.totalYear || 0);
                    return (
                      <div key={cat.key} style={{
                        padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0",
                        background: cnt > 0 ? "#fff5f5" : "#f8fafc",
                        borderLeft: `4px solid ${cat.color}`,
                        transition: "all .15s"
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", lineHeight: 1.25 }}>
                          {cat.label}
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                          <span style={{ fontSize: 18, fontWeight: 800, color: cnt > 0 ? cat.color : "#94a3b8" }}>
                            {cnt}
                          </span>
                          <span style={{ fontSize: 10, color: "#94a3b8" }}>kasus</span>
                        </div>
                        <div style={{ fontSize: 9.5, color: "#94a3b8", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={cat.desc}>
                          {cat.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Visual Grafik SVG Bulanan Vertikal */}
                {(() => {
                  const chartH = 220;
                  const paddingL = 42;
                  const paddingB = 38;
                  const paddingT = 18;
                  const plotH = chartH - paddingB - paddingT;
                  const monthSlotW = 76;
                  const numCat = APD_PROBLEM_CATEGORIES.length;
                  const barGroupW = 60;
                  const barW = barGroupW / numCat;
                  const totalSVGW = paddingL + MONTHS.length * monthSlotW + 16;

                  const allVals = monthlyProblemRows.flatMap(r => r.perMonth);
                  const maxVal = Math.max(...allVals, 4);
                  const gridCount = 4;
                  const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => Math.round((maxVal / gridCount) * i));

                  return (
                    <div style={{
                      border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 14px 10px",
                      background: "#fafbfc"
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span>Tren Bar Chart Bulanan Temuan APD</span>
                          {historyMonthFilter && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#2563eb", background: "#eff6ff", padding: "1px 8px", borderRadius: 6 }}>
                              Bulan aktif: {historyMonthFilter}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>Hover batang untuk melihat detail</span>
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
                          {MONTHS.map((mShort, mIdx) => {
                            const mFullName = MONTH_NAMES_ID[mIdx];
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
                                    opacity={0.65}
                                    rx={4}
                                  />
                                )}

                                {APD_PROBLEM_CATEGORIES.map((cat, ci) => {
                                  const row = monthlyProblemRows[ci];
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
                                        <title>{`${cat.label} (${mFullName}): ${val} kasus`}</title>
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
                                {monthlyTotalProblems[mIdx] > 0 && (
                                  <text
                                    x={paddingL + mIdx * monthSlotW + monthSlotW / 2}
                                    y={chartH - 22}
                                    textAnchor="middle"
                                    fontSize={8.5}
                                    fill="#dc2626"
                                    fontWeight="700"
                                  >
                                    ∑{monthlyTotalProblems[mIdx]}
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
                        {APD_PROBLEM_CATEGORIES.map(cat => {
                          const yrTotal = monthlyProblemRows.find(r => r.key === cat.key)?.totalYear || 0;
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

                {/* Tabel Matriks Rekap Bulanan Temuan */}
                <div style={{ marginTop: 14, overflowX: "auto" }}>
                  <table className="sum-table" style={{ fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 36, textAlign: "center" }}>No</th>
                        <th style={{ minWidth: 180 }}>Kategori Problem Temuan APD</th>
                        {MONTHS.map((m, idx) => (
                          <th key={m} style={{
                            textAlign: "center", minWidth: 42,
                            background: historyMonthFilter === MONTH_NAMES_ID[idx] ? "#dbeafe" : undefined,
                            color: historyMonthFilter === MONTH_NAMES_ID[idx] ? "#1d4ed8" : undefined
                          }}>
                            {m}
                          </th>
                        ))}
                        <th style={{ textAlign: "center", minWidth: 60 }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyProblemRows.map((row, idx) => (
                        <tr key={row.key}>
                          <td style={{ textAlign: "center", color: "#94a3b8" }}>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <span style={{ width: 8, height: 8, borderRadius: 2, background: row.color, flexShrink: 0 }} />
                              <span>{row.label}</span>
                            </div>
                          </td>
                          {MONTHS.map((m, mIdx) => {
                            const val = row.perMonth[mIdx];
                            const isSelected = historyMonthFilter === MONTH_NAMES_ID[mIdx];
                            return (
                              <td key={m} style={{
                                textAlign: "center",
                                fontWeight: val > 0 ? 700 : 400,
                                color: val > 0 ? row.color : "#cbd5e1",
                                background: isSelected ? "#eff6ff" : undefined
                              }}>
                                {val > 0 ? val : "-"}
                              </td>
                            );
                          })}
                          <td style={{
                            textAlign: "center", fontWeight: 800,
                            color: row.totalYear > 0 ? row.color : "#94a3b8"
                          }}>
                            {row.totalYear > 0 ? row.totalYear : "-"}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ fontWeight: 800, background: "#f8fafc" }}>
                        <td colSpan={2} style={{ textAlign: "right", color: "#1e293b" }}>TOTAL TEMUAN</td>
                        {MONTHS.map((m, mIdx) => {
                          const tot = monthlyTotalProblems[mIdx];
                          const isSelected = historyMonthFilter === MONTH_NAMES_ID[mIdx];
                          return (
                            <td key={m} style={{
                              textAlign: "center",
                              color: tot > 0 ? "#dc2626" : "#94a3b8",
                              background: isSelected ? "#dbeafe" : undefined
                            }}>
                              {tot > 0 ? tot : "-"}
                            </td>
                          );
                        })}
                        <td style={{ textAlign: "center", color: overallTotalProblemsYear > 0 ? "#dc2626" : "#16a34a" }}>
                          {overallTotalProblemsYear}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── TABEL SUMMARY PERSENTASE PENGECEKAN APD PER PROSES ── */}
              <div className="apd-card" style={{ overflow: "hidden" }}>
                <div style={{
                  padding: "13px 20px", borderBottom: "1px solid #f1f5f9",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <TrendingUp size={15} color="#2563eb" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                      Ringkasan Prosentase Pengecekan APD per Proses
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className={`tab-btn ${summaryTab === "ringkasan" ? "active" : "inactive"}`}
                      onClick={() => setSummaryTab("ringkasan")}>
                      Ringkasan
                    </button>
                    <button className={`tab-btn ${summaryTab === "bulanan" ? "active" : "inactive"}`}
                      onClick={() => setSummaryTab("bulanan")}>
                      Bulanan
                    </button>
                  </div>
                </div>

                {/* ── Tab: Ringkasan ─────────────────────────────────────────── */}
                {summaryTab === "ringkasan" && (
                  <div style={{ overflowX: "auto", padding: "10px 0" }}>
                    <table className="sum-table">
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left" }}>No</th>
                          <th style={{ textAlign: "left" }}>Dept</th>
                          <th style={{ textAlign: "left" }}>Proses</th>
                          <th style={{ textAlign: "center" }}>Total MP</th>
                          <th style={{ textAlign: "center" }}>OK</th>
                          <th style={{ textAlign: "center" }}>N-OK</th>
                          <th style={{ textAlign: "center" }}>%OK</th>
                          <th style={{ minWidth: 100 }}>Progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summaryRows.map((r, i) => (
                          <tr key={i}>
                            <td style={{ color: "#94a3b8", textAlign: "center" }}>{i + 1}</td>
                            <td style={{ fontWeight: 600 }}>{r.deptName}</td>
                            <td>{r.prosesName}</td>
                            <td style={{ textAlign: "center", color: "#64748b" }}>{r.totalMP || "-"}</td>
                            <td style={{ textAlign: "center", fontWeight: 700, color: "#16a34a" }}>{r.totalOK || "-"}</td>
                            <td style={{ textAlign: "center", fontWeight: 700, color: "#dc2626" }}>{r.totalNOK || "-"}</td>
                            <td style={{ textAlign: "center" }}>
                              {r.totalMP > 0 ? <PctPill v={r.pct} /> : <span style={{ color: "#cbd5e1" }}>-</span>}
                            </td>
                            <td style={{ minWidth: 100 }}>
                              {r.totalMP > 0 && <Bar v={r.pct}
                                color={r.pct === 100 ? "#16a34a" : r.pct > 60 ? "#3b82f6" : "#f59e0b"} h={6} />}
                            </td>
                          </tr>
                        ))}
                        <tr style={{ fontWeight: 700 }}>
                          <td colSpan={3} style={{ textAlign: "right", color: "#1e293b" }}>TOTAL / OVERALL</td>
                          <td style={{ textAlign: "center", color: "#1e293b" }}>
                            {summaryRows.reduce((a, r) => a + r.totalMP, 0) || "-"}
                          </td>
                          <td style={{ textAlign: "center", color: "#16a34a" }}>
                            {summaryRows.reduce((a, r) => a + r.totalOK, 0) || "-"}
                          </td>
                          <td style={{ textAlign: "center", color: "#dc2626" }}>
                            {summaryRows.reduce((a, r) => a + r.totalNOK, 0) || "-"}
                          </td>
                          <td style={{ textAlign: "center" }}><PctPill v={overallPct} /></td>
                          <td><Bar v={overallPct} color="#2563eb" h={6} /></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ── Tab: Bulanan ───────────────────────────────────────────── */}
                {summaryTab === "bulanan" && (
                  <>
                    <div style={{ overflowX: "auto", padding: "10px 0" }}>
                      <table className="sum-table">
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left" }} rowSpan={2}>No</th>
                            <th style={{ textAlign: "left" }} rowSpan={2}>Dept</th>
                            <th style={{ textAlign: "left" }} rowSpan={2}>Proses</th>
                            <th style={{ textAlign: "center" }} colSpan={monthIndexesShown.length}>
                              PROSENTASE OK ({historyYear})
                            </th>
                          </tr>
                          <tr>
                            {monthIndexesShown.map(mIdx => (
                              <th key={mIdx} style={{
                                textAlign: "center", minWidth: 64,
                                background: mIdx === activeMonthIdx ? "#dbeafe" : undefined
                              }}>
                                {MONTHS[mIdx]}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {monthlySummaryRows.map((r, i) => (
                            <tr key={i}>
                              <td style={{ color: "#94a3b8", textAlign: "center" }}>{i + 1}</td>
                              <td style={{ fontWeight: 600 }}>{r.deptName}</td>
                              <td>{r.prosesName}</td>
                              {monthIndexesShown.map(mIdx => {
                                const v = r.perMonth[mIdx];
                                return (
                                  <td key={mIdx} style={{
                                    textAlign: "center",
                                    background: mIdx === activeMonthIdx ? "#eff6ff" : undefined
                                  }}>
                                    {v === null
                                      ? <span style={{ color: "#cbd5e1" }}>-</span>
                                      : <PctPill v={v} />}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                          <tr style={{ fontWeight: 700 }}>
                            <td colSpan={3} style={{ textAlign: "right", color: "#1e293b" }}>OVERALL</td>
                            {monthIndexesShown.map(mIdx => (
                              <td key={mIdx} style={{
                                textAlign: "center",
                                background: mIdx === activeMonthIdx ? "#dbeafe" : undefined
                              }}>
                                <PctPill v={monthlyOverall[mIdx]} />
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Diagram tren %OK overall per bulan */}
                    <div style={{ padding: "6px 20px 18px" }}>
                      <SectionTitle ch="Grafik Tren %OK Overall per Bulan" />
                      <div className="chart-wrap">
                        {monthIndexesShown.map(mIdx => {
                          const v = monthlyOverall[mIdx];
                          const color = v === 100 ? "#16a34a" : v > 60 ? "#3b82f6" : v > 0 ? "#f59e0b" : "#cbd5e1";
                          return (
                            <div className="chart-row" key={mIdx}>
                              <span className="chart-lbl">{MONTHS[mIdx]}</span>
                              <div className="chart-track">
                                <div className="chart-fill" style={{ width: `${Math.max(v, 6)}%`, background: color }}>
                                  <span>{v}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* ── PREVIEW 5 SESI TERBARU (ringkas) ── */}
              {entries.length > 0 && (
                <div className="apd-card" style={{ overflow: "hidden" }}>
                  <div style={{
                    padding: "13px 20px", borderBottom: "1px solid #f1f5f9",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 12, flexWrap: "wrap"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <ClipboardList size={16} color="#2563eb" />
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                        Sesi Inspeksi Terbaru
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 700,
                        background: "#eff6ff", color: "#2563eb", padding: "2px 9px", borderRadius: 999
                      }}>
                        {entries.length} Total Sesi
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setPage("edit"); setEditPageTab("riwayat"); }}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "6px 14px", border: "1px solid #bfdbfe", borderRadius: 8,
                        background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 700,
                        cursor: "pointer", fontFamily: "inherit"
                      }}
                    >
                      <Edit3 size={12} /> Lihat Semua &amp; Edit →
                    </button>
                  </div>

                  {/* Preview 5 sesi terbaru */}
                  {[...entries].reverse().slice(0, 5).map((e, i, arr) => {
                    const p = entryAvgPct(e);
                    const mp = e.rows.reduce((a, r) => a + r.jumlahMP, 0);
                    const ok = e.rows.reduce((a, r) => a + r.okCount, 0);
                    const nok = e.rows.reduce((a, r) => a + r.nokCount, 0);
                    return (
                      <div key={e.id} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 20px", borderBottom: i < arr.length - 1 ? "1px solid #f8fafc" : "none",
                        flexWrap: "wrap"
                      }}>
                        <PctPill v={p} />
                        <div style={{ flex: 1, minWidth: 180 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                            {resolveLabel("proses", e.prosesKey, e.prosesName)} · {e.subName}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>
                            {resolveLabel("dept", e.deptKey, e.deptName)} ·&nbsp;
                            <span style={{ color: "#16a34a", fontWeight: 600 }}>{ok} OK</span>&nbsp;·&nbsp;
                            <span style={{ color: "#dc2626", fontWeight: 600 }}>{nok} NOK</span>&nbsp;/&nbsp;{mp} MP
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>
                          {new Date(e.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                        <button
                          type="button"
                          onClick={() => setViewingEntry(e)}
                          className="act-btn act-btn-detail"
                          style={{ padding: "4px 10px", fontSize: 11 }}
                        >
                          <Eye size={11} /> Detail
                        </button>
                      </div>
                    );
                  })}

                  {entries.length > 5 && (
                    <div style={{
                      padding: "10px 20px", textAlign: "center",
                      borderTop: "1px solid #f1f5f9", background: "#f8fafc"
                    }}>
                      <button
                        type="button"
                        onClick={() => { setPage("edit"); setEditPageTab("riwayat"); }}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "7px 18px", border: "1px solid #bfdbfe", borderRadius: 8,
                          background: "#eff6ff", color: "#1d4ed8", fontSize: 12.5, fontWeight: 700,
                          cursor: "pointer", fontFamily: "inherit"
                        }}
                      >
                        <Edit3 size={13} /> Lihat {entries.length - 5} sesi lainnya di tab Edit →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              EDIT PAGE: Riwayat Inspeksi + Manajemen Master Data
          ══════════════════════════════════════════════════════════════════ */}
          {page === "edit" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* ── Sub-Tab Navigation ── */}
              <div className="apd-card" style={{ padding: "14px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className={`tab-btn ${editPageTab === "riwayat" ? "active" : "inactive"}`}
                      onClick={() => setEditPageTab("riwayat")}
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <ClipboardList size={13} /> Riwayat Inspeksi
                      {entries.length > 0 && (
                        <span style={{
                          background: editPageTab === "riwayat" ? "rgba(255,255,255,0.3)" : "#e2e8f0",
                          color: editPageTab === "riwayat" ? "#fff" : "#64748b",
                          fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "1px 6px"
                        }}>{entries.length}</span>
                      )}
                    </button>
                    <button
                      className={`tab-btn ${editPageTab === "master-data" ? "active" : "inactive"}`}
                      onClick={() => setEditPageTab("master-data")}
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Settings size={13} /> Manajemen Master Data
                    </button>
                  </div>
                  {editPageTab === "riwayat" && (
                    <button
                      onClick={loadEntries}
                      disabled={loadingEntries}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: 8,
                        background: "#fff", color: "#475569", fontSize: 12, fontWeight: 600,
                        cursor: loadingEntries ? "not-allowed" : "pointer", fontFamily: "inherit"
                      }}
                    >
                      <RefreshCw size={13} />
                      {loadingEntries ? "Memuat..." : "Refresh"}
                    </button>
                  )}
                </div>
              </div>

              {/* ── Sub-Tab: Riwayat Inspeksi ── */}
              {editPageTab === "riwayat" && (
                <>
                  {/* Filter bar */}
                  <div className="apd-card" style={{ padding: "12px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                        <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                        <input
                          type="text"
                          value={historySearch}
                          onChange={e => setHistorySearch(e.target.value)}
                          placeholder="Cari Dept, proses, sub, NIK, PIC, area..."
                          style={{
                            width: "100%", padding: "7px 12px 7px 32px", border: "1px solid #cbd5e1",
                            borderRadius: 8, fontSize: 12.5, outline: "none", background: "#f8fafc",
                            fontFamily: "inherit", boxSizing: "border-box"
                          }}
                        />
                        {historySearch && (
                          <button type="button" onClick={() => setHistorySearch("")}
                            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                              border: "none", background: "none", cursor: "pointer", color: "#94a3b8" }}>
                            <X size={13} />
                          </button>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Dept:</span>
                        <select value={historyDeptFilter} onChange={e => setHistoryDeptFilter(e.target.value)}
                          style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: 7,
                            fontSize: 12, color: "#1e293b", background: "#fff", outline: "none" }}>
                          <option value="">Semua</option>
                          {dynamicDeptConfig.map(d => (
                            <option key={d.deptKey} value={d.deptKey}>{resolveLabel("dept", d.deptKey, d.deptName)}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Tahun:</span>
                        <select value={localHistoryYear} onChange={e => setLocalHistoryYear(+e.target.value)}
                          style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: 7,
                            fontSize: 12, color: "#1e293b", background: "#fff", outline: "none" }}>
                          {[CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Bulan:</span>
                        <select value={localHistoryMonth} onChange={e => setLocalHistoryMonth(e.target.value)}
                          style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: 7,
                            fontSize: 12, color: "#1e293b", background: "#fff", outline: "none" }}>
                          <option value="">Semua</option>
                          {MONTH_NAMES_ID.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      {(historySearch || historyDeptFilter || localHistoryMonth || localHistoryYear !== CURRENT_YEAR) && (
                        <button type="button"
                          onClick={() => { setHistorySearch(""); setHistoryDeptFilter(""); setLocalHistoryMonth(""); setLocalHistoryYear(CURRENT_YEAR); }}
                          style={{ padding: "5px 10px", border: "1px solid #e2e8f0", borderRadius: 6,
                            background: "#fff", fontSize: 11, color: "#ef4444", cursor: "pointer", fontWeight: 600 }}>
                          Reset Filter
                        </button>
                      )}
                    </div>
                  </div>

                  {filteredEntries.length === 0 ? (
                    <div className="apd-card" style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                      Tidak ada sesi inspeksi yang sesuai filter.
                    </div>
                  ) : (
                    <div className="apd-card" style={{ overflow: "hidden" }}>
                      <div style={{ padding: "11px 20px", borderBottom: "1px solid #f1f5f9",
                        display: "flex", alignItems: "center", gap: 8 }}>
                        <ClipboardList size={15} color="#2563eb" />
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b" }}>
                          {filteredEntries.length} Sesi Ditemukan
                        </span>
                        {filteredEntries.length < entries.length && (
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>dari {entries.length} total</span>
                        )}
                      </div>

                      {[...filteredEntries].reverse().map((e, i) => {
                        const p = entryAvgPct(e);
                        const mp = e.rows.reduce((a, r) => a + r.jumlahMP, 0);
                        const ok = e.rows.reduce((a, r) => a + r.okCount, 0);
                        const nok = e.rows.reduce((a, r) => a + r.nokCount, 0);
                        return (
                          <div key={e.id} style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "13px 20px",
                            borderBottom: i < filteredEntries.length - 1 ? "1px solid #f8fafc" : "none",
                            flexWrap: "wrap"
                          }}>
                            <PctPill v={p} />
                            <div style={{ flex: 1, minWidth: 200 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b" }}>
                                  {resolveLabel("proses", e.prosesKey, e.prosesName)} · {e.subName}
                                </span>
                                {nok > 0 ? (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3,
                                    padding: "2px 7px", borderRadius: 999,
                                    background: "#fee2e2", color: "#dc2626", fontSize: 10.5, fontWeight: 700 }}>
                                    ⚠ {nok} NOK
                                  </span>
                                ) : (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3,
                                    padding: "2px 7px", borderRadius: 999,
                                    background: "#dcfce7", color: "#15803d", fontSize: 10.5, fontWeight: 700 }}>
                                    ✓ 100% OK
                                  </span>
                                )}
                                {e.isEdited && (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4,
                                    padding: "2px 8px", borderRadius: 999,
                                    background: "#fef3c7", border: "1px solid #fde68a",
                                    color: "#b45309", fontSize: 10.5, fontWeight: 700 }}>
                                    <Edit3 size={10} /> Diedit
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 3 }}>
                                {resolveLabel("dept", e.deptKey, e.deptName)} ·&nbsp;
                                <span style={{ color: "#16a34a", fontWeight: 600 }}>{ok} OK</span>&nbsp;·&nbsp;
                                <span style={{ color: "#dc2626", fontWeight: 600 }}>{nok} NOK</span>&nbsp;/&nbsp;{mp} MP
                                {e.inspectorName && <> · <span style={{ color: "#475569" }}>{e.inspectorName}</span></>}
                              </div>
                            </div>
                            <div style={{ fontSize: 11, textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                              <span style={{ color: "#475569", fontWeight: 600 }}>
                                {new Date(e.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                              <span style={{ color: "#94a3b8" }}>
                                {new Date(e.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              {e.isEdited && e.updatedAt && (
                                <span style={{ color: "#d97706", fontSize: 10 }}>Edit: {new Date(e.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                              <button type="button" onClick={() => setViewingEntry(e)}
                                className="act-btn act-btn-detail" title="Detail">
                                <Eye size={12} /> Detail
                              </button>
                              <button type="button" onClick={() => handleOpenEdit(e)}
                                className="act-btn act-btn-edit" title="Edit">
                                <Edit3 size={12} /> Edit
                              </button>
                              <button type="button" onClick={() => { setDeletingEntry(e); setDeleteError(""); }}
                                className="act-btn act-btn-del" title="Hapus">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* ── Sub-Tab: Manajemen Master Data ── */}
              {editPageTab === "master-data" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                  {/* Info banner */}
                  <div className="apd-card" style={{ padding: "14px 20px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: "#eff6ff",
                      border: "1px solid #bfdbfe", display: "flex", alignItems: "center",
                      justifyContent: "center", flexShrink: 0 }}>
                      <Tag size={18} color="#2563eb" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Manajemen Nama Master Data</div>
                      <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 3, lineHeight: 1.5 }}>
                        Ubah nama tampilan <b>Departemen</b>, <b>Proses</b>, dan <b>Area</b> sesuai kondisi aktual di pabrik.
                        Perubahan disimpan ke database dan berlaku untuk semua pengguna.
                        Klik ikon <RotateCcw size={11} style={{ verticalAlign: "middle" }} /> Reset untuk kembali ke nama default.
                      </div>
                    </div>
                    <button onClick={loadMasterLabels} disabled={loadingLabels}
                      style={{ display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: 8,
                        background: "#fff", color: "#475569", fontSize: 11.5, fontWeight: 600,
                        cursor: loadingLabels ? "not-allowed" : "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                      <RefreshCw size={12} />
                      {loadingLabels ? "Memuat..." : "Refresh"}
                    </button>
                  </div>

                  {/* Section A: Nama Departemen */}
                  <div className="apd-card" style={{ overflow: "hidden" }}>
                    <div style={{ padding: "13px 20px", borderBottom: "1px solid #f1f5f9",
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Factory size={15} color="#7c3aed" />
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Nama Departemen</span>
                        <span style={{ fontSize: 11, background: "#f3e8ff", color: "#7c3aed", padding: "1px 8px", borderRadius: 999, fontWeight: 700 }}>
                          {dynamicDeptConfig.length}
                        </span>
                      </div>
                      <button
                        onClick={() => { setShowAddDeptModal(true); setAddMasterError(""); }}
                        style={{ display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "6px 12px", border: "none", borderRadius: 8,
                          background: "#7c3aed", color: "#fff", fontSize: 12, fontWeight: 700,
                          cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 6px rgba(124,58,237,.25)" }}>
                        <Plus size={13} /> Tambah Departemen
                      </button>
                    </div>
                    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                      {dynamicDeptConfig.map(dept => {
                        const currentName = resolveLabel("dept", dept.deptKey, dept.deptName);
                        const isCustom = !!masterLabels.dept[dept.deptKey];
                        const isEditing = renameDeptKey === dept.deptKey;
                        const isDeleting = deletingMasterKey === dept.deptKey;
                        return (
                          <div key={dept.deptKey} style={{ display: "flex", alignItems: "center", gap: 12,
                            padding: "10px 14px", border: `1.5px solid ${isCustom ? "#bfdbfe" : "#e2e8f0"}`,
                            borderRadius: 10, background: isCustom ? "#f8fbff" : "#fafafa" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8",
                                  background: "#f1f5f9", padding: "1px 7px", borderRadius: 4 }}>
                                  {dept.deptKey}
                                </span>
                                {isEditing ? (
                                  <input autoFocus type="text" value={renameDeptVal}
                                    onChange={e => setRenameDeptVal(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === "Enter") saveMasterLabel("dept", dept.deptKey, renameDeptVal);
                                      if (e.key === "Escape") setRenameDeptKey(null);
                                    }}
                                    placeholder={dept.deptName}
                                    style={{ flex: 1, padding: "5px 10px", border: "1.5px solid #3b82f6",
                                      borderRadius: 7, fontSize: 13, fontWeight: 600, outline: "none",
                                      fontFamily: "inherit", minWidth: 140 }} />
                                ) : (
                                  <span style={{ fontSize: 14, fontWeight: 700, color: isCustom ? "#1d4ed8" : "#1e293b" }}>
                                    {currentName}
                                  </span>
                                )}
                                {isCustom && !isEditing && (
                                  <span style={{ fontSize: 10, background: "#dbeafe", color: "#1d4ed8",
                                    padding: "1px 7px", borderRadius: 999, fontWeight: 600 }}>Custom</span>
                                )}
                              </div>
                              {isCustom && (
                                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>Default: {dept.deptName}</div>
                              )}
                            </div>
                            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                              {isEditing ? (
                                <>
                                  <button onClick={() => saveMasterLabel("dept", dept.deptKey, renameDeptVal)}
                                    disabled={savingLabel === dept.deptKey}
                                    style={{ display: "inline-flex", alignItems: "center", gap: 5,
                                      padding: "5px 12px", border: "none", borderRadius: 7,
                                      background: "#2563eb", color: "#fff", fontSize: 12, fontWeight: 700,
                                      cursor: "pointer", fontFamily: "inherit" }}>
                                    <Save size={12} />{savingLabel === dept.deptKey ? "Menyimpan..." : "Simpan"}
                                  </button>
                                  <button onClick={() => setRenameDeptKey(null)}
                                    style={{ padding: "5px 10px", border: "1px solid #e2e8f0", borderRadius: 7,
                                      background: "#fff", color: "#475569", fontSize: 12, fontWeight: 600,
                                      cursor: "pointer", fontFamily: "inherit" }}>Batal</button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => { setRenameDeptKey(dept.deptKey); setRenameDeptVal(currentName); }}
                                    className="act-btn act-btn-edit" style={{ padding: "5px 10px" }} title="Ubah Nama">
                                    <Edit3 size={12} /> Ubah
                                  </button>
                                  {isCustom && (
                                    <button onClick={() => saveMasterLabel("dept", dept.deptKey, "")}
                                      style={{ display: "inline-flex", alignItems: "center", gap: 4,
                                        padding: "5px 9px", border: "1px solid #e2e8f0", borderRadius: 7,
                                        background: "#f8fafc", color: "#94a3b8", fontSize: 12,
                                        cursor: "pointer", fontFamily: "inherit" }} title="Reset ke Default">
                                      <RotateCcw size={11} /> Reset
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteMasterItem("dept", dept.deptKey, currentName)}
                                    disabled={isDeleting}
                                    className="act-btn act-btn-del"
                                    style={{ padding: "5px 9px" }}
                                    title="Hapus Departemen"
                                  >
                                    <Trash2 size={12} /> {isDeleting ? "..." : "Hapus"}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section B: Nama Proses */}
                  <div className="apd-card" style={{ overflow: "hidden" }}>
                    <div style={{ padding: "13px 20px", borderBottom: "1px solid #f1f5f9",
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <BarChart3 size={15} color="#059669" />
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Nama Proses</span>
                      </div>
                      <button
                        onClick={() => {
                          setNewProsesDeptKey(dynamicDeptConfig[0]?.deptKey || "");
                          setShowAddProsesModal(true);
                          setAddMasterError("");
                        }}
                        style={{ display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "6px 12px", border: "none", borderRadius: 8,
                          background: "#059669", color: "#fff", fontSize: 12, fontWeight: 700,
                          cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 6px rgba(5,150,105,.25)" }}>
                        <Plus size={13} /> Tambah Proses
                      </button>
                    </div>
                    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                      {dynamicDeptConfig.flatMap(dept =>
                        dept.proses.map(proc => {
                          const currentName = resolveLabel("proses", proc.key, proc.name);
                          const isCustom = !!masterLabels.proses[proc.key];
                          const isEditing = renameProsesKey === proc.key;
                          const isDeleting = deletingMasterKey === proc.key;
                          const a = ac(dept.deptKey);
                          return (
                            <div key={proc.key} style={{ display: "flex", alignItems: "center", gap: 12,
                              padding: "10px 14px", border: `1.5px solid ${isCustom ? "#bbf7d0" : "#e2e8f0"}`,
                              borderRadius: 10, background: isCustom ? "#f0fdf4" : "#fafafa" }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                  <Chip label={resolveLabel("dept", dept.deptKey, dept.deptName)} a={a} />
                                  {isEditing ? (
                                    <input autoFocus type="text" value={renameProsesVal}
                                      onChange={e => setRenameProsesVal(e.target.value)}
                                      onKeyDown={e => {
                                        if (e.key === "Enter") saveMasterLabel("proses", proc.key, renameProsesVal);
                                        if (e.key === "Escape") setRenameProsesKey(null);
                                      }}
                                      placeholder={proc.name}
                                      style={{ flex: 1, padding: "5px 10px", border: "1.5px solid #3b82f6",
                                        borderRadius: 7, fontSize: 13, fontWeight: 600, outline: "none",
                                        fontFamily: "inherit", minWidth: 160 }} />
                                  ) : (
                                    <span style={{ fontSize: 14, fontWeight: 700, color: isCustom ? "#15803d" : "#1e293b" }}>
                                      {currentName}
                                    </span>
                                  )}
                                  {isCustom && !isEditing && (
                                    <span style={{ fontSize: 10, background: "#dcfce7", color: "#15803d",
                                      padding: "1px 7px", borderRadius: 999, fontWeight: 600 }}>Custom</span>
                                )}
                                </div>
                                {isCustom && (
                                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>Default: {proc.name}</div>
                                )}
                              </div>
                              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                {isEditing ? (
                                  <>
                                    <button onClick={() => saveMasterLabel("proses", proc.key, renameProsesVal)}
                                      disabled={savingLabel === proc.key}
                                      style={{ display: "inline-flex", alignItems: "center", gap: 5,
                                        padding: "5px 12px", border: "none", borderRadius: 7,
                                        background: "#2563eb", color: "#fff", fontSize: 12, fontWeight: 700,
                                        cursor: "pointer", fontFamily: "inherit" }}>
                                      <Save size={12} />{savingLabel === proc.key ? "Menyimpan..." : "Simpan"}
                                    </button>
                                    <button onClick={() => setRenameProsesKey(null)}
                                      style={{ padding: "5px 10px", border: "1px solid #e2e8f0", borderRadius: 7,
                                        background: "#fff", color: "#475569", fontSize: 12, fontWeight: 600,
                                        cursor: "pointer", fontFamily: "inherit" }}>Batal</button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => { setRenameProsesKey(proc.key); setRenameProsesVal(currentName); }}
                                      className="act-btn act-btn-edit" style={{ padding: "5px 10px" }} title="Ubah Nama">
                                      <Edit3 size={12} /> Ubah
                                    </button>
                                    {isCustom && (
                                      <button onClick={() => saveMasterLabel("proses", proc.key, "")}
                                        style={{ display: "inline-flex", alignItems: "center", gap: 4,
                                          padding: "5px 9px", border: "1px solid #e2e8f0", borderRadius: 7,
                                          background: "#f8fafc", color: "#94a3b8", fontSize: 12,
                                          cursor: "pointer", fontFamily: "inherit" }} title="Reset ke Default">
                                        <RotateCcw size={11} /> Reset
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeleteMasterItem("proses", proc.key, currentName)}
                                      disabled={isDeleting}
                                      className="act-btn act-btn-del"
                                      style={{ padding: "5px 9px" }}
                                      title="Hapus Proses"
                                    >
                                      <Trash2 size={12} /> {isDeleting ? "..." : "Hapus"}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Section C: Sub-Proses & Area */}
                  <div className="apd-card" style={{ overflow: "hidden" }}>
                    <div style={{ padding: "13px 20px", borderBottom: "1px solid #f1f5f9",
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <MapPin size={15} color="#d97706" />
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Manajemen Sub-Proses & Area</span>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {masterAreaProses && (
                          <button
                            onClick={() => {
                              setNewSubProsesKey(masterAreaProses);
                              setShowAddSubModal(true);
                              setAddMasterError("");
                            }}
                            style={{ display: "inline-flex", alignItems: "center", gap: 5,
                              padding: "6px 12px", border: "none", borderRadius: 8,
                              background: "#0284c7", color: "#fff", fontSize: 12, fontWeight: 700,
                              cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 6px rgba(2,132,199,.25)" }}>
                            <Plus size={13} /> Tambah Sub-Proses
                          </button>
                        )}
                        {masterAreaProses && masterAreaSub && (
                          <button
                            onClick={() => {
                              setNewAreaProsesKey(masterAreaProses);
                              setNewAreaSubName(masterAreaSub);
                              setShowAddAreaModal(true);
                              setAddMasterError("");
                            }}
                            style={{ display: "inline-flex", alignItems: "center", gap: 5,
                              padding: "6px 12px", border: "none", borderRadius: 8,
                              background: "#d97706", color: "#fff", fontSize: 12, fontWeight: 700,
                              cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 6px rgba(217,119,6,.25)" }}>
                            <Plus size={13} /> Tambah Area
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Pilih Proses:</span>
                          <select value={masterAreaProses} onChange={e => { setMasterAreaProses(e.target.value); setMasterAreaSub(""); }}
                            style={{ padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: 8,
                              fontSize: 13, color: "#1e293b", background: "#fff", outline: "none", fontFamily: "inherit" }}>
                            <option value="">— Pilih Proses —</option>
                            {dynamicDeptConfig.flatMap(dept =>
                              dept.proses.map(proc => (
                                <option key={proc.key} value={proc.key}>
                                  {resolveLabel("dept", dept.deptKey, dept.deptName)} › {resolveLabel("proses", proc.key, proc.name)}
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                        {masterAreaProses && (() => {
                          const proc = dynamicDeptConfig.flatMap(d => d.proses).find(p => p.key === masterAreaProses);
                          if (!proc) return null;
                          return (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Pilih Sub-Proses:</span>
                                <select value={masterAreaSub} onChange={e => setMasterAreaSub(e.target.value)}
                                  style={{ padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: 8,
                                    fontSize: 13, color: "#1e293b", background: "#fff", outline: "none", fontFamily: "inherit" }}>
                                  <option value="">— Pilih Sub-Proses —</option>
                                  {proc.subs.map(s => (
                                    <option key={s.name} value={s.name}>{s.name} ({s.areas.length} Area)</option>
                                  ))}
                                </select>
                              </div>
                              {masterAreaSub && (
                                <button
                                  onClick={() => handleDeleteMasterItem("sub", `${proc.key}::${masterAreaSub}`, masterAreaSub)}
                                  disabled={deletingMasterKey === `${proc.key}::${masterAreaSub}`}
                                  className="act-btn act-btn-del"
                                  style={{ padding: "5px 10px" }}
                                  title="Hapus Sub-Proses Ini"
                                >
                                  <Trash2 size={12} /> Hapus Sub-Proses
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {masterAreaProses && masterAreaSub && (() => {
                        const proc = dynamicDeptConfig.flatMap(d => d.proses).find(p => p.key === masterAreaProses);
                        const sub = proc?.subs.find(s => s.name === masterAreaSub);
                        if (!sub) return null;
                        if (sub.areas.length === 0) {
                          return (
                            <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8", fontSize: 13 }}>
                              Sub-proses "{sub.name}" belum memiliki area terdefinisi.
                              <div style={{ marginTop: 8 }}>
                                <button
                                  onClick={() => {
                                    setNewAreaProsesKey(masterAreaProses);
                                    setNewAreaSubName(masterAreaSub);
                                    setShowAddAreaModal(true);
                                    setAddMasterError("");
                                  }}
                                  style={{ display: "inline-flex", alignItems: "center", gap: 5,
                                    padding: "6px 12px", border: "none", borderRadius: 7,
                                    background: "#d97706", color: "#fff", fontSize: 12, fontWeight: 700,
                                    cursor: "pointer", fontFamily: "inherit" }}>
                                  <Plus size={12} /> Tambah Area Pertama
                                </button>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {sub.areas.map(originalArea => {
                              const compositeKey = `${masterAreaProses}::${masterAreaSub}::${originalArea}`;
                              const currentName = resolveLabel("area", compositeKey, originalArea);
                              const isCustom = !!masterLabels.area[compositeKey];
                              const isEditing = renameAreaKey === compositeKey;
                              return (
                                <div key={compositeKey} style={{ display: "flex", alignItems: "center", gap: 12,
                                  padding: "9px 14px", border: `1.5px solid ${isCustom ? "#fde68a" : "#e2e8f0"}`,
                                  borderRadius: 9, background: isCustom ? "#fffbeb" : "#fafafa" }}>
                                  <MapPin size={13} color={isCustom ? "#d97706" : "#94a3b8"} style={{ flexShrink: 0 }} />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    {isEditing ? (
                                      <input autoFocus type="text" value={renameAreaVal}
                                        onChange={e => setRenameAreaVal(e.target.value)}
                                        onKeyDown={e => {
                                          if (e.key === "Enter") saveMasterLabel("area", compositeKey, renameAreaVal);
                                          if (e.key === "Escape") setRenameAreaKey(null);
                                        }}
                                        placeholder={originalArea}
                                        style={{ width: "100%", padding: "5px 10px", border: "1.5px solid #3b82f6",
                                          borderRadius: 7, fontSize: 13, fontWeight: 600, outline: "none",
                                          fontFamily: "inherit", boxSizing: "border-box" }} />
                                    ) : (
                                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                        <span style={{ fontSize: 13.5, fontWeight: 700, color: isCustom ? "#b45309" : "#1e293b" }}>
                                          {currentName}
                                        </span>
                                        {isCustom && (
                                          <>
                                            <span style={{ fontSize: 10, background: "#fef3c7", color: "#b45309",
                                              padding: "1px 7px", borderRadius: 999, fontWeight: 600 }}>Custom</span>
                                            <span style={{ fontSize: 11, color: "#94a3b8" }}>← Default: {originalArea}</span>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                    {isEditing ? (
                                      <>
                                        <button onClick={() => saveMasterLabel("area", compositeKey, renameAreaVal)}
                                          disabled={savingLabel === compositeKey}
                                          style={{ display: "inline-flex", alignItems: "center", gap: 5,
                                            padding: "5px 12px", border: "none", borderRadius: 7,
                                            background: "#2563eb", color: "#fff", fontSize: 12, fontWeight: 700,
                                            cursor: "pointer", fontFamily: "inherit" }}>
                                          <Save size={12} />{savingLabel === compositeKey ? "Menyimpan..." : "Simpan"}
                                        </button>
                                        <button onClick={() => setRenameAreaKey(null)}
                                          style={{ padding: "5px 10px", border: "1px solid #e2e8f0", borderRadius: 7,
                                            background: "#fff", color: "#475569", fontSize: 12, fontWeight: 600,
                                            cursor: "pointer", fontFamily: "inherit" }}>Batal</button>
                                      </>
                                    ) : (
                                      <>
                                        <button onClick={() => { setRenameAreaKey(compositeKey); setRenameAreaVal(currentName); }}
                                          className="act-btn act-btn-edit" style={{ padding: "5px 10px" }} title="Ubah Nama">
                                          <Edit3 size={12} /> Ubah
                                        </button>
                                        {isCustom && (
                                          <button onClick={() => saveMasterLabel("area", compositeKey, "")}
                                            style={{ display: "inline-flex", alignItems: "center", gap: 4,
                                              padding: "5px 9px", border: "1px solid #e2e8f0", borderRadius: 7,
                                              background: "#f8fafc", color: "#94a3b8", fontSize: 12,
                                              cursor: "pointer", fontFamily: "inherit" }} title="Reset ke Default">
                                            <RotateCcw size={11} /> Reset
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleDeleteMasterItem("area", compositeKey, currentName)}
                                          disabled={deletingMasterKey === compositeKey}
                                          className="act-btn act-btn-del"
                                          style={{ padding: "5px 9px" }}
                                          title="Hapus Area"
                                        >
                                          <Trash2 size={12} /> {deletingMasterKey === compositeKey ? "..." : "Hapus"}
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}

                      {(!masterAreaProses || !masterAreaSub) && (
                        <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, padding: "24px 0" }}>
                          Pilih Proses dan Sub-Proses di atas untuk mengelola daftar Area (tambah, ubah nama, atau hapus).
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}



          {/* ══════════════════════════════════════════════════════════════════
              INSPECTION WIZARD
          ══════════════════════════════════════════════════════════════════ */}
          {page === "inspection" && (
            <div ref={wizardRef} className="apd-card" style={{ padding: "20px 18px 22px" }}>
              <StepBar step={step} labels={["Departemen", "Proses", "Inspeksi"]} />

              {/* ── Step 0: Pilih Dept ─────────────────────────────────────── */}
              {step === 0 && (
                <div>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
                    Pilih departemen yang akan diinspeksi.
                  </p>
                  <div className="dept-grid">
                    {dynamicDeptConfig.map(dept => {
                      const a = ac(dept.deptKey);
                      const rel = entries.filter(e => e.deptKey === dept.deptKey);
                      const pct = rel.length ? Math.round(rel.map(entryAvgPct).reduce((a, b) => a + b) / rel.length) : 0;
                      const resolvedDeptName = resolveLabel("dept", dept.deptKey, dept.deptName);
                      return (
                        <button key={dept.deptKey} className="apd-btn-row"
                          style={{ padding: "14px", justifyContent: "space-between" }}
                          onClick={() => goToDept(dept)}>
                          <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                              <span style={{ width: 8, height: 8, borderRadius: "50%", background: a.dot, flexShrink: 0 }} />
                              <span style={{
                                fontSize: 13, fontWeight: 700, color: "#1e293b",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                              }}>
                                {resolvedDeptName}
                              </span>
                            </div>
                            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 7 }}>
                              {dept.proses.length} proses
                            </div>
                            <Bar v={pct} color={a.bar} h={3} />
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                            <PctPill v={pct} />
                            <ChevronRight size={15} color="#cbd5e1" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Step 1: Pilih Proses ───────────────────────────────────── */}
              {step === 1 && selDept && (() => {
                const a = ac(selDept.deptKey);
                const resolvedDeptName = resolveLabel("dept", selDept.deptKey, selDept.deptName);
                return (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                      <BackBtn onClick={goBack} />
                      <Chip label={resolvedDeptName} a={a} />
                    </div>
                    <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 14px" }}>
                      Pilih proses yang akan diinspeksi.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {selDept.proses.map(proc => {
                        const rel = entries.filter(e => e.prosesKey === proc.key);
                        const pct = rel.length ? Math.round(rel.map(entryAvgPct).reduce((a, b) => a + b) / rel.length) : 0;
                        const resolvedProcName = resolveLabel("proses", proc.key, proc.name);
                        return (
                          <button key={proc.key} className="apd-btn-row"
                            style={{ gap: 12, padding: "12px 14px" }}
                            onClick={() => goToProc(proc)}>
                            <div style={{
                              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                              background: a.light, border: `1px solid ${a.ring}`,
                              display: "flex", alignItems: "center", justifyContent: "center"
                            }}>
                              <Factory size={15} color={a.dot} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: 13, fontWeight: 700, color: "#1e293b",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                              }}>
                                {resolvedProcName}
                              </div>
                              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                                {proc.subs.length} sub-proses
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                              <PctPill v={pct} />
                              <ChevronRight size={15} color="#cbd5e1" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* ── Step 2: Inspeksi ───────────────────────────────────────── */}
              {step === 2 && selDept && selProc && (() => {
                const a = ac(selDept.deptKey);
                const resolvedDeptName = resolveLabel("dept", selDept.deptKey, selDept.deptName);
                const resolvedProcName = resolveLabel("proses", selProc.key, selProc.name);
                return (
                  <div>
                    {/* Breadcrumb */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
                      <BackBtn onClick={goBack} />
                      <Chip label={resolvedDeptName} a={a} />
                      <ChevronRight size={12} color="#cbd5e1" />
                      <span style={{
                        padding: "3px 10px", borderRadius: 999,
                        background: "#f1f5f9", fontSize: 11, fontWeight: 600, color: "#475569"
                      }}>
                        {resolvedProcName}
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                      {/* Sub-proses */}
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px" }}>
                        <Lbl ch="Sub-Proses" />
                        <select value={selSub} onChange={e => setSelSub(e.target.value)}
                          className="apd-input-field">
                          <option value="">— Pilih Sub-Proses —</option>
                          {selProc.subs.map(s => (
                            <option key={s.name} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Area (predefined, non-CV) */}
                      {selSub && !isCV && areaOptions.length > 0 && (
                        <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px" }}>
                          <Lbl ch="Area" />
                          <select value={selArea} onChange={e => setSelArea(e.target.value)}
                            className="apd-input-field">
                            <option value="">— Pilih Area —</option>
                            {areaOptions.map(o => {
                              const compositeKey = `${selProc.key}::${selSub}::${o}`;
                              const resolvedAreaName = resolveLabel("area", compositeKey, o);
                              return (
                                <option key={o} value={o}>
                                  {resolvedAreaName !== o ? `${resolvedAreaName} (${o})` : o}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}

                      {/* Info jika tidak ada area spesifik */}
                      {selSub && !isCV && areaOptions.length === 0 && (
                        <div style={{
                          border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 16px",
                          display: "flex", alignItems: "center", gap: 8, color: "#64748b", fontSize: 13
                        }}>
                          <MapPin size={14} color="#94a3b8" />
                          Tidak ada area spesifik — seluruh area berlaku.
                        </div>
                      )}

                      {/* ── Inspection forms ───────────────────────────────── */}
                      {selSub && (isCV ? rows.length > 0 : rows.length > 0 || areaOptions.length === 0) && (
                        <div>
                          <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            marginBottom: 12
                          }}>
                            <SectionTitle ch={isCV ? "Form Inspeksi per Conveyor" : "Form Inspeksi"} />
                            {isCV && (
                              <button className="apd-add-btn" style={{ width: "auto", padding: "6px 14px" }}
                                onClick={addCvRow}>
                                <Plus size={13} /> Tambah Conveyor
                              </button>
                            )}
                          </div>

                          {rows.map((row, idx) => {
                            const compositeKey = `${selProc.key}::${selSub}::${row.area}`;
                            const resolvedArea = resolveLabel("area", compositeKey, row.area);
                            const labelDisplay = !isCV && row.area && resolvedArea !== row.area
                              ? `${resolvedArea} (${row.area})`
                              : undefined;
                            return (
                              <AreaRowForm
                                key={row.id}
                                row={row}
                                isCV={isCV}
                                idx={idx}
                                canDelete={isCV && rows.length > 1}
                                acColor={a}
                                labelDisplay={labelDisplay}
                                onChange={updated => updateRow(row.id, updated)}
                                onDelete={() => deleteCvRow(row.id)}
                              />
                            );
                          })}
                        </div>
                      )}

                    </div>

                    {/* Footer */}
                    <div style={{
                      marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: 10, flexWrap: "wrap"
                    }}>
                      <BackBtn onClick={goBack} />
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {saveError && (
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#dc2626" }}>
                            ⚠ {saveError}
                          </span>
                        )}
                        {!selSub && (
                          <span style={{ fontSize: 12, color: "#d97706", fontWeight: 600 }}>
                            ⚠ Pilih sub-proses
                          </span>
                        )}
                        {selSub && isCV && !rows.some(r => r.area.trim()) && (
                          <span style={{ fontSize: 12, color: "#d97706", fontWeight: 600 }}>
                            ⚠ Isi nama Conveyor
                          </span>
                        )}
                        <button className="apd-save" disabled={!canSave || isSaving} onClick={openConfirm}>
                          <Save size={15} />
                          Simpan Data
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: Detail Pemeriksaan APD (Adaptasi Checksheet Panel)
      ══════════════════════════════════════════════════════════════════ */}
      {viewingEntry && (() => {
        const a = ac(viewingEntry.deptKey);
        const p = entryAvgPct(viewingEntry);
        const totalMP = viewingEntry.rows.reduce((acc, r) => acc + r.jumlahMP, 0);
        const totalOK = viewingEntry.rows.reduce((acc, r) => acc + r.okCount, 0);
        const totalNOK = viewingEntry.rows.reduce((acc, r) => acc + r.nokCount, 0);
        const d = new Date(viewingEntry.date);
        const monthName = MONTH_NAMES_ID[d.getMonth()];
        const yearNum = d.getFullYear();
        const dateStr = d.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric"
        }) + " · " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

        return (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16, zIndex: 1100, backdropFilter: "blur(2px)"
          }} onClick={() => setViewingEntry(null)}>
            <div style={{
              background: "#fff", borderRadius: 16, maxWidth: 860, width: "100%",
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
                    width: 38, height: 38, borderRadius: 10, background: a.light,
                    border: `1px solid ${a.ring}`, display: "flex", alignItems: "center",
                    justifyContent: "center", flexShrink: 0
                  }}>
                    <Eye size={18} color={a.dot} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span>Detail Pemeriksaan APD — {viewingEntry.prosesName} · {viewingEntry.subName}</span>
                      {viewingEntry.isEdited && (
                        <span style={{
                          padding: "2px 8px", borderRadius: 999, background: "#fef3c7",
                          border: "1px solid #fde68a", color: "#b45309", fontSize: 10.5, fontWeight: 700
                        }}>
                          Diedit
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#94a3b8" }}>
                      Departemen {viewingEntry.deptName} · Periode {monthName} {yearNum} · Waktu: {dateStr}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setViewingEntry(null)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#94a3b8", padding: 6, borderRadius: 8, display: "flex", alignItems: "center"
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f1f5f9"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
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
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>DEPARTEMEN</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginTop: 2 }}>
                      <Chip label={viewingEntry.deptName} a={a} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>PROSES / SUB</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginTop: 2 }}>
                      {viewingEntry.prosesName} — {viewingEntry.subName}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>PIC CHECK / INSPEKTOR</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginTop: 2 }}>
                      {viewingEntry.inspectorName || "-"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>STATUS KELAYAKAN (% OK)</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <PctPill v={p} />
                      <span style={{ fontSize: 11.5, color: "#64748b" }}>
                        ({totalOK}/{totalMP} MP OK)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subtitle */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", letterSpacing: ".04em" }}>
                    RINCIAN HASIL PENGECEKAN PER AREA / CONVEYOR
                  </div>
                  <div style={{ fontSize: 11.5, color: "#64748b" }}>
                    Total: <b style={{ color: "#1e293b" }}>{totalMP}</b> MP · <b style={{ color: "#16a34a" }}>{totalOK}</b> OK · <b style={{ color: "#dc2626" }}>{totalNOK}</b> N-OK
                  </div>
                </div>

                {/* Daftar Area / Conveyor */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {viewingEntry.rows.map((row, idx) => {
                    const rowPct = pctOK(row);
                    const isNg = row.nokCount > 0;

                    return (
                      <div key={row.id || idx} style={{
                        border: `1px solid ${isNg ? "#fecaca" : "#e2e8f0"}`,
                        borderRadius: 10, padding: "14px 16px",
                        background: isNg ? "#fffafa" : "#ffffff"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{
                              width: 24, height: 24, borderRadius: 6, background: isNg ? "#fee2e2" : "#f1f5f9",
                              fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                              color: isNg ? "#dc2626" : "#64748b"
                            }}>
                              {idx + 1}
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                              {row.area || `Area/Conveyor #${idx + 1}`}
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {isNg ? (
                              <span style={{
                                fontSize: 11, fontWeight: 800, padding: "2px 9px", borderRadius: 999,
                                background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca"
                              }}>
                                ⚠ {row.nokCount} TEMUAN N-OK
                              </span>
                            ) : (
                              <span style={{
                                fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 999,
                                background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0"
                              }}>
                                ✓ SEMUA PERSONEL OK (100%)
                              </span>
                            )}
                            <PctPill v={rowPct} />
                          </div>
                        </div>

                        {/* Ringkasan MP */}
                        <div style={{
                          display: "flex", alignItems: "center", gap: 14, fontSize: 12, color: "#475569",
                          background: isNg ? "rgba(254,226,226,.25)" : "#f8fafc",
                          padding: "8px 12px", borderRadius: 8, marginBottom: isNg ? 10 : 0
                        }}>
                          <span>Jumlah Man Power: <b style={{ color: "#1e293b" }}>{row.jumlahMP}</b></span>
                          <span>·</span>
                          <span style={{ color: "#16a34a" }}>OK: <b>{row.okCount}</b></span>
                          <span>·</span>
                          <span style={{ color: "#dc2626" }}>N-OK: <b>{row.nokCount}</b></span>
                        </div>

                        {/* Rincian temuan per NIK jika ada NOK */}
                        {row.nokDetails && row.nokDetails.length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#b91c1c", marginBottom: 6, textTransform: "uppercase" }}>
                              Daftar Rincian Temuan Personel (N-OK):
                            </div>
                            <div style={{ overflowX: "auto" }}>
                              <table className="nok-table">
                                <thead>
                                  <tr>
                                    <th style={{ width: 30, textAlign: "center" }}>No</th>
                                    <th>NIK / Karyawan</th>
                                    <th>Temuan Abnormal / Problem</th>
                                    <th>Tindakan / Solusi</th>
                                    <th>PIC</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {row.nokDetails.map((nok, nIdx) => (
                                    <tr key={nok.id || nIdx}>
                                      <td style={{ textAlign: "center", fontWeight: 600, color: "#94a3b8" }}>{nIdx + 1}</td>
                                      <td style={{ fontWeight: 700, color: "#1e293b" }}>{nok.nik || "-"}</td>
                                      <td style={{ color: "#dc2626", fontWeight: 600 }}>
                                        {nok.finding === "Lain-lain" ? (nok.findingCustom || "Lain-lain") : (nok.finding || "-")}
                                      </td>
                                      <td style={{ color: "#334155" }}>{nok.tindakan || "-"}</td>
                                      <td style={{ fontWeight: 600, color: "#475569" }}>{nok.pic || "-"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: "14px 22px", borderTop: "1px solid #f1f5f9", background: "#f8fafc",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10
              }}>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  Status sesi: {viewingEntry.isEdited ? <b style={{ color: "#b45309" }}>Pernah diedit</b> : <b>Data orisinil</b>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => {
                      const e = viewingEntry;
                      setViewingEntry(null);
                      handleOpenEdit(e);
                    }}
                    className="act-btn act-btn-edit"
                    style={{ padding: "8px 16px", fontSize: 13 }}
                  >
                    <Edit3 size={13} /> Edit Sesi Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingEntry(null)}
                    style={{
                      padding: "8px 18px", border: "1px solid #cbd5e1", borderRadius: 8,
                      background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit"
                    }}
                  >
                    Tutup
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: Preview / Konfirmasi Simpan
      ══════════════════════════════════════════════════════════════════ */}
      {showConfirm && selDept && selProc && selSub && (() => {
        const a = ac(selDept.deptKey);
        return (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16, zIndex: 1000
          }} onClick={() => !isSaving && setShowConfirm(false)}>
            <div style={{
              background: "#fff", borderRadius: 16, maxWidth: 560, width: "100%",
              maxHeight: "88vh", overflow: "hidden", display: "flex", flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0,0,0,.3)"
            }} onClick={e => e.stopPropagation()}>

              {/* header */}
              <div style={{
                padding: "16px 20px", borderBottom: "1px solid #f1f5f9",
                display: "flex", alignItems: "center", gap: 10
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9, background: a.light,
                  border: `1px solid ${a.ring}`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  <ClipboardList size={16} color={a.dot} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>Konfirmasi Simpan Data</div>
                  <div style={{ fontSize: 11.5, color: "#94a3b8" }}>Periksa kembali data di bawah sebelum disimpan</div>
                </div>
              </div>

              {/* body */}
              <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
                {saveError && (
                  <div style={{
                    marginBottom: 14, padding: "10px 14px", borderRadius: 8,
                    background: "#fef2f2", border: "1px solid #fecaca",
                    fontSize: 12.5, fontWeight: 600, color: "#dc2626",
                    display: "flex", alignItems: "center", gap: 8
                  }}>
                    <AlertCircle size={15} color="#dc2626" />
                    <span>{saveError}</span>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div>
                    <Lbl ch="Departemen" />
                    <Chip label={resolveLabel("dept", selDept.deptKey, selDept.deptName)} a={a} />
                  </div>
                  <div>
                    <Lbl ch="Waktu Inspeksi (realtime)" />
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                      {new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                    </div>
                  </div>
                  <div>
                    <Lbl ch="Proses" />
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                      {resolveLabel("proses", selProc.key, selProc.name)}
                    </div>
                  </div>
                  <div>
                    <Lbl ch="Sub-Proses" />
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{selSub}</div>
                  </div>
                </div>

                <SectionTitle ch={isCV ? "Detail per Conveyor" : "Detail per Area"} />
                {rows.map((row, idx) => {
                  const pct = pctOK(row);
                  const compositeKey = `${selProc.key}::${selSub}::${row.area}`;
                  const rowAreaDisplay = isCV
                    ? `CV ${idx + 1}: ${row.area || "(nama belum diisi)"}`
                    : resolveLabel("area", compositeKey, row.area);
                  return (
                    <div key={row.id} style={{
                      border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", marginBottom: 10
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, gap: 8 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1e293b" }}>
                          {rowAreaDisplay}
                        </span>
                        <PctPill v={pct} />
                      </div>
                      <div style={{ fontSize: 12, color: "#475569" }}>
                        Jumlah MP: <b>{row.jumlahMP}</b>
                        {" · "}OK: <b style={{ color: "#16a34a" }}>{row.okCount}</b>
                        {" · "}N-OK: <b style={{ color: "#dc2626" }}>{row.nokCount}</b>
                      </div>
                      {row.nokDetails.length > 0 && (
                        <div style={{ marginTop: 8, borderTop: "1px dashed #e2e8f0", paddingTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                          {row.nokDetails.map((n, ni) => (
                            <div key={n.id} style={{ fontSize: 11.5, color: "#64748b" }}>
                              {ni + 1}. NIK <b style={{ color: "#1e293b" }}>{n.nik || "-"}</b>
                              {" — "}
                              {n.finding === "Lain-lain" ? (n.findingCustom || "Lain-lain") : (n.finding || "(temuan belum dipilih)")}
                              {n.tindakan && <> · Tindakan: {n.tindakan}</>}
                              {n.pic && <> · PIC: {n.pic}</>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {rows.length === 0 && (
                  <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 12.5, padding: "12px 0" }}>
                    Belum ada data area/conveyor.
                  </div>
                )}
              </div>

              {/* footer */}
              <div style={{
                padding: "14px 20px", borderTop: "1px solid #f1f5f9",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10
              }}>
                {saveError ? (
                  <span style={{ marginRight: "auto", fontSize: 12, fontWeight: 700, color: "#dc2626" }}>
                    ⚠ {saveError}
                  </span>
                ) : <span />}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button onClick={() => setShowConfirm(false)} disabled={isSaving}
                    style={{
                      padding: "9px 18px", border: "1px solid #e2e8f0", borderRadius: 9,
                      background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600,
                      cursor: isSaving ? "not-allowed" : "pointer", fontFamily: "inherit"
                    }}>
                    Batal
                  </button>
                  <button className="apd-save" disabled={isSaving} onClick={handleSave}>
                    <Save size={15} />
                    {isSaving ? "Menyimpan…" : "Ya, Simpan Data"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {/* ══════════════════════════════════════════════════════════════════
          MODAL: Edit Data Inspeksi Riwayat
      ══════════════════════════════════════════════════════════════════ */}
      {editingEntry && (() => {
        const a = ac(editingEntry.deptKey);
        const isCVEdit = editingEntry.areaType === "cv" ||
          (editingEntry.subName === "Checker & Packing" && editingEntry.prosesKey === "qa-final-assy");

        return (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16, zIndex: 1100, backdropFilter: "blur(2px)"
          }} onClick={() => !isSavingEdit && setEditingEntry(null)}>
            <div style={{
              background: "#fff", borderRadius: 16, maxWidth: 840, width: "100%",
              maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0,0,0,.3)"
            }} onClick={e => e.stopPropagation()}>

              {/* Modal Header */}
              <div style={{
                padding: "16px 20px", borderBottom: "1px solid #f1f5f9",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: a.light,
                    border: `1px solid ${a.ring}`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    <Edit3 size={17} color={a.dot} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>
                      Edit Data Inspeksi APD
                    </div>
                    <div style={{ fontSize: 11.5, color: "#94a3b8" }}>
                      Sesuaikan item check, jumlah MP, OK/N-OK, dan rincian temuan di bawah
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => !isSavingEdit && setEditingEntry(null)}
                  disabled={isSavingEdit}
                  style={{
                    background: "none", border: "none", cursor: isSavingEdit ? "not-allowed" : "pointer",
                    color: "#94a3b8", padding: 6, borderRadius: 8, display: "flex", alignItems: "center"
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f1f5f9"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: "18px 22px", overflowY: "auto", flex: 1 }}>
                {editError && (
                  <div style={{
                    marginBottom: 14, padding: "10px 14px", borderRadius: 8,
                    background: "#fef2f2", border: "1px solid #fecaca",
                    fontSize: 12.5, fontWeight: 600, color: "#dc2626",
                    display: "flex", alignItems: "center", gap: 8
                  }}>
                    <AlertCircle size={15} color="#dc2626" />
                    <span>{editError}</span>
                  </div>
                )}

                {/* Metadata info */}
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: 12, padding: "12px 14px", background: "#f8fafc", borderRadius: 10,
                  border: "1px solid #e2e8f0", marginBottom: 16
                }}>
                  <div>
                    <Lbl ch="Departemen" />
                    <Chip label={editingEntry.deptName} a={a} />
                  </div>
                  <div>
                    <Lbl ch="Proses" />
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                      {editingEntry.prosesName}
                    </div>
                  </div>
                  <div>
                    <Lbl ch="Sub-Proses" />
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                      {editingEntry.subName}
                    </div>
                  </div>
                  <div>
                    <Lbl ch="Tgl Asli Pengambilan" />
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
                      {new Date(editingEntry.date).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                    </div>
                  </div>
                </div>

                {/* Form Items editing */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 12
                }}>
                  <SectionTitle ch={isCVEdit ? "Edit Form per Conveyor" : "Edit Form per Area"} />
                  {isCVEdit && (
                    <button className="apd-add-btn" style={{ width: "auto", padding: "6px 14px" }}
                      onClick={handleAddEditCvRow}>
                      <Plus size={13} /> Tambah Conveyor
                    </button>
                  )}
                </div>

                {editRows.map((row, idx) => (
                  <AreaRowForm
                    key={row.id}
                    row={row}
                    isCV={isCVEdit}
                    idx={idx}
                    canDelete={isCVEdit && editRows.length > 1}
                    acColor={a}
                    onChange={updated => handleUpdateEditRow(row.id, updated)}
                    onDelete={() => handleDeleteEditCvRow(row.id)}
                  />
                ))}

                {editRows.length === 0 && (
                  <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, padding: "24px 0" }}>
                    Belum ada baris inspeksi area.
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: "14px 20px", borderTop: "1px solid #f1f5f9",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10
              }}>
                <div style={{ fontSize: 11.5, color: "#94a3b8" }}>
                  Status akan otomatis ditandai <b>"Diedit"</b> setelah disimpan.
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    onClick={() => setEditingEntry(null)}
                    disabled={isSavingEdit}
                    style={{
                      padding: "9px 18px", border: "1px solid #e2e8f0", borderRadius: 9,
                      background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600,
                      cursor: isSavingEdit ? "not-allowed" : "pointer", fontFamily: "inherit"
                    }}
                  >
                    Batal
                  </button>
                  <button
                    className="apd-save"
                    disabled={isSavingEdit || editRows.length === 0}
                    onClick={handleSaveEdit}
                  >
                    <Save size={15} />
                    {isSavingEdit ? "Menyimpan Perubahan…" : "Simpan Perubahan"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: Konfirmasi Hapus Data
      ══════════════════════════════════════════════════════════════════ */}
      {deletingEntry && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16, zIndex: 1150, backdropFilter: "blur(2px)"
        }} onClick={() => !isDeleting && setDeletingEntry(null)}>
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
                Hapus Data Inspeksi?
              </div>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                Apakah Anda yakin ingin menghapus data inspeksi untuk proses{" "}
                <b style={{ color: "#1e293b" }}>{deletingEntry.prosesName} · {deletingEntry.subName}</b>{" "}
                ({deletingEntry.deptName})?
              </p>
              <div style={{
                marginTop: 12, padding: "10px 12px", background: "#f8fafc",
                borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, color: "#475569"
              }}>
                <div>Tgl Inspeksi: <b>{new Date(deletingEntry.date).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</b></div>
                <div style={{ marginTop: 2 }}>Total MP: <b>{deletingEntry.rows.reduce((a, r) => a + r.jumlahMP, 0)}</b> | OK: <b style={{ color: "#16a34a" }}>{deletingEntry.rows.reduce((a, r) => a + r.okCount, 0)}</b> | N-OK: <b style={{ color: "#dc2626" }}>{deletingEntry.rows.reduce((a, r) => a + r.nokCount, 0)}</b></div>
              </div>

              {deleteError && (
                <div style={{
                  marginTop: 12, padding: "8px 12px", borderRadius: 8,
                  background: "#fef2f2", border: "1px solid #fecaca",
                  fontSize: 12, fontWeight: 600, color: "#dc2626"
                }}>
                  ⚠ {deleteError}
                </div>
              )}
            </div>

            <div style={{
              padding: "12px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0",
              display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10
            }}>
              <button
                onClick={() => setDeletingEntry(null)}
                disabled={isDeleting}
                style={{
                  padding: "8px 16px", border: "1px solid #cbd5e1", borderRadius: 8,
                  background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600,
                  cursor: isDeleting ? "not-allowed" : "pointer", fontFamily: "inherit"
                }}
              >
                Batal
              </button>
              <button
                onClick={handleDeleteEntry}
                disabled={isDeleting}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 18px", border: "none", borderRadius: 8,
                  background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 700,
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 6px rgba(220,38,38,.25)", fontFamily: "inherit"
                }}
              >
                <Trash2 size={14} />
                {isDeleting ? "Menghapus…" : "Ya, Hapus Data"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Tambah Departemen ── */}
      {showAddDeptModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16, zIndex: 1150, backdropFilter: "blur(2px)"
        }} onClick={() => !isAddingMaster && setShowAddDeptModal(false)}>
          <div style={{
            background: "#fff", borderRadius: 16, maxWidth: 440, width: "100%",
            boxShadow: "0 20px 60px rgba(0,0,0,.3)", overflow: "hidden"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Factory size={18} color="#7c3aed" />
                <span style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>Tambah Departemen Baru</span>
              </div>
              <button onClick={() => setShowAddDeptModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: "20px" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                Nama Departemen <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                autoFocus
                type="text"
                value={newDeptName}
                onChange={e => setNewDeptName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && newDeptName.trim()) handleAddMasterItem("dept", newDeptName);
                }}
                placeholder="Contoh: LOGISTIK, MAINTENANCE 2..."
                style={{
                  width: "100%", padding: "9px 12px", border: "1.5px solid #cbd5e1",
                  borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box"
                }}
              />
              {addMasterError && (
                <div style={{ marginTop: 10, fontSize: 12, color: "#dc2626", fontWeight: 600 }}>
                  ⚠ {addMasterError}
                </div>
              )}
            </div>
            <div style={{ padding: "12px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setShowAddDeptModal(false)}
                disabled={isAddingMaster}
                style={{ padding: "8px 16px", border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Batal
              </button>
              <button
                onClick={() => handleAddMasterItem("dept", newDeptName)}
                disabled={isAddingMaster || !newDeptName.trim()}
                style={{
                  padding: "8px 18px", border: "none", borderRadius: 8, background: "#7c3aed", color: "#fff",
                  fontSize: 13, fontWeight: 700, cursor: isAddingMaster || !newDeptName.trim() ? "not-allowed" : "pointer",
                  opacity: isAddingMaster || !newDeptName.trim() ? 0.6 : 1, fontFamily: "inherit"
                }}>
                {isAddingMaster ? "Menyimpan..." : "Simpan Departemen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Tambah Proses ── */}
      {showAddProsesModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16, zIndex: 1150, backdropFilter: "blur(2px)"
        }} onClick={() => !isAddingMaster && setShowAddProsesModal(false)}>
          <div style={{
            background: "#fff", borderRadius: 16, maxWidth: 480, width: "100%",
            boxShadow: "0 20px 60px rgba(0,0,0,.3)", overflow: "hidden"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <BarChart3 size={18} color="#059669" />
                <span style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>Tambah Proses Baru</span>
              </div>
              <button onClick={() => setShowAddProsesModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                  Pilih Departemen Induk <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  value={newProsesDeptKey}
                  onChange={e => setNewProsesDeptKey(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #cbd5e1", borderRadius: 8, fontSize: 13, background: "#fff", outline: "none", fontFamily: "inherit" }}
                >
                  {dynamicDeptConfig.map(d => (
                    <option key={d.deptKey} value={d.deptKey}>
                      {resolveLabel("dept", d.deptKey, d.deptName)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                  Nama Proses <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  value={newProsesName}
                  onChange={e => setNewProsesName(e.target.value)}
                  placeholder="Contoh: INLINE INSPECTION, PACKING..."
                  style={{
                    width: "100%", padding: "9px 12px", border: "1.5px solid #cbd5e1",
                    borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                  Tipe Area Inspeksi
                </label>
                <select
                  value={newProsesAreaType}
                  onChange={e => setNewProsesAreaType(e.target.value as any)}
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #cbd5e1", borderRadius: 8, fontSize: 13, background: "#fff", outline: "none", fontFamily: "inherit" }}
                >
                  <option value="predefined-per-sub">Predefined Area (Pilihan Area tetap per Sub-Proses)</option>
                  <option value="cv">Conveyor / CV (Dinamis per nomor conveyor)</option>
                  <option value="none">Tanpa Area Spesifik (Satu area umum)</option>
                </select>
              </div>

              {addMasterError && (
                <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>
                  ⚠ {addMasterError}
                </div>
              )}
            </div>
            <div style={{ padding: "12px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setShowAddProsesModal(false)}
                disabled={isAddingMaster}
                style={{ padding: "8px 16px", border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Batal
              </button>
              <button
                onClick={() => handleAddMasterItem("proses", newProsesName, newProsesDeptKey, newProsesAreaType)}
                disabled={isAddingMaster || !newProsesName.trim() || !newProsesDeptKey}
                style={{
                  padding: "8px 18px", border: "none", borderRadius: 8, background: "#059669", color: "#fff",
                  fontSize: 13, fontWeight: 700, cursor: isAddingMaster || !newProsesName.trim() ? "not-allowed" : "pointer",
                  opacity: isAddingMaster || !newProsesName.trim() ? 0.6 : 1, fontFamily: "inherit"
                }}>
                {isAddingMaster ? "Menyimpan..." : "Simpan Proses"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Tambah Sub-Proses ── */}
      {showAddSubModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16, zIndex: 1150, backdropFilter: "blur(2px)"
        }} onClick={() => !isAddingMaster && setShowAddSubModal(false)}>
          <div style={{
            background: "#fff", borderRadius: 16, maxWidth: 440, width: "100%",
            boxShadow: "0 20px 60px rgba(0,0,0,.3)", overflow: "hidden"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ClipboardList size={18} color="#0284c7" />
                <span style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>Tambah Sub-Proses Baru</span>
              </div>
              <button onClick={() => setShowAddSubModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                  Proses Induk
                </label>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", background: "#f8fafc", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  {(() => {
                    const proc = dynamicDeptConfig.flatMap(d => d.proses).find(p => p.key === newSubProsesKey);
                    return proc ? proc.name : newSubProsesKey;
                  })()}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                  Nama Sub-Proses <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  value={newSubName}
                  onChange={e => setNewSubName(e.target.value)}
                  placeholder="Contoh: Crimping, Cutting, Quality Gate..."
                  style={{
                    width: "100%", padding: "9px 12px", border: "1.5px solid #cbd5e1",
                    borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box"
                  }}
                />
              </div>

              {addMasterError && (
                <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>
                  ⚠ {addMasterError}
                </div>
              )}
            </div>
            <div style={{ padding: "12px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setShowAddSubModal(false)}
                disabled={isAddingMaster}
                style={{ padding: "8px 16px", border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Batal
              </button>
              <button
                onClick={() => handleAddMasterItem("sub", newSubName, newSubProsesKey)}
                disabled={isAddingMaster || !newSubName.trim() || !newSubProsesKey}
                style={{
                  padding: "8px 18px", border: "none", borderRadius: 8, background: "#0284c7", color: "#fff",
                  fontSize: 13, fontWeight: 700, cursor: isAddingMaster || !newSubName.trim() ? "not-allowed" : "pointer",
                  opacity: isAddingMaster || !newSubName.trim() ? 0.6 : 1, fontFamily: "inherit"
                }}>
                {isAddingMaster ? "Menyimpan..." : "Simpan Sub-Proses"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Tambah Area ── */}
      {showAddAreaModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16, zIndex: 1150, backdropFilter: "blur(2px)"
        }} onClick={() => !isAddingMaster && setShowAddAreaModal(false)}>
          <div style={{
            background: "#fff", borderRadius: 16, maxWidth: 440, width: "100%",
            boxShadow: "0 20px 60px rgba(0,0,0,.3)", overflow: "hidden"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MapPin size={18} color="#d97706" />
                <span style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>Tambah Area Baru</span>
              </div>
              <button onClick={() => setShowAddAreaModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                  Proses & Sub-Proses
                </label>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b", background: "#f8fafc", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  {(() => {
                    const proc = dynamicDeptConfig.flatMap(d => d.proses).find(p => p.key === newAreaProsesKey);
                    return `${proc ? proc.name : newAreaProsesKey} › ${newAreaSubName}`;
                  })()}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                  Nama Area Baru <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  value={newAreaName}
                  onChange={e => setNewAreaName(e.target.value)}
                  placeholder="Contoh: Line 05, Area Khusus, Toyota BCL..."
                  style={{
                    width: "100%", padding: "9px 12px", border: "1.5px solid #cbd5e1",
                    borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box"
                  }}
                />
              </div>

              {addMasterError && (
                <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>
                  ⚠ {addMasterError}
                </div>
              )}
            </div>
            <div style={{ padding: "12px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setShowAddAreaModal(false)}
                disabled={isAddingMaster}
                style={{ padding: "8px 16px", border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Batal
              </button>
              <button
                onClick={() => handleAddMasterItem("area", newAreaName, `${newAreaProsesKey}::${newAreaSubName}`)}
                disabled={isAddingMaster || !newAreaName.trim() || !newAreaProsesKey || !newAreaSubName}
                style={{
                  padding: "8px 18px", border: "none", borderRadius: 8, background: "#d97706", color: "#fff",
                  fontSize: 13, fontWeight: 700, cursor: isAddingMaster || !newAreaName.trim() ? "not-allowed" : "pointer",
                  opacity: isAddingMaster || !newAreaName.trim() ? 0.6 : 1, fontFamily: "inherit"
                }}>
                {isAddingMaster ? "Menyimpan..." : "Simpan Area"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}