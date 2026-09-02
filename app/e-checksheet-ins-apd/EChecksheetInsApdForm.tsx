// app/e-checksheet-ins-apd/EChecksheetInsApdForm.tsx
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { useScanVerification } from "@/lib/hooks/useScanVerification";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ChevronRight, ChevronLeft, Factory, MapPin, Calendar,
  CheckCircle2, Save, Plus, Trash2, BarChart3,
  ShieldCheck, AlertCircle, TrendingUp, Users,
  ClipboardList, Download, Loader2, RefreshCw,
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
  row, isCV, idx, canDelete, acColor,
  onChange, onDelete,
}: {
  row: InspectionRow;
  isCV: boolean;
  idx: number;
  canDelete: boolean;
  acColor: AC;
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
              {row.area || <span style={{ color: "#94a3b8" }}>— Area belum dipilih —</span>}
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

type Page = "inspection" | "summary";

export function EChecksheetInsApdForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading: authLoading, isInitialized } = useAuth();
  const { isScanned } = useScanVerification();

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
  const [selDate, setSelDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [entries, setEntries] = useState<InspectionEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false); // preview/konfirmasi sebelum simpan
  const [summaryTab, setSummaryTab] = useState<"ringkasan" | "bulanan">("ringkasan"); // tab tabel 1. Summary Prosentase
  const [problemTab, setProblemTab] = useState<"ringkasan" | "bulanan">("ringkasan"); // tab tabel 2 & 3. Summary Problem / Grafik

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

  useEffect(() => {
    if (mounted && isInitialized && !authLoading && user) {
      loadEntries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isInitialized, authLoading, !!user]);

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
        deptName: selDept.deptName,
        prosesKey: selProc.key,
        prosesName: selProc.name,
        subName: selSub,
        areaType: isCV ? "cv" : areaOptions.length > 0 ? "predefined-per-sub" : "none",
        sourceAreaName: areaNameParam,
        inspectorId: (user as any)?.nik || (user as any)?.id || "",
        inspectorName: user?.fullName || "",
        scanVerified: isScanned,
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

  // ── computed ──────────────────────────────────────────────────────────────

  // Jika filter bulan diisi, seluruh Summary (Ringkasan & Bulanan) difokuskan
  // ke bulan tersebut — bukan hanya ke bulan persisnya.
  const summaryEntries = useMemo(() =>
    selDate ? entries.filter(e => e.date.slice(0, 7) === selDate) : entries,
    [entries, selDate]);

  const overallPct = useMemo(() => {
    if (!summaryEntries.length) return 0;
    const v = summaryEntries.map(entryAvgPct);
    return Math.round(v.reduce((a, b) => a + b) / v.length);
  }, [summaryEntries]);

  const summaryRows = useMemo(() =>
    DEPT_CONFIG.flatMap(dept =>
      dept.proses.map(proc => {
        const rel = summaryEntries.filter(e => e.prosesKey === proc.key);
        const totalMP = rel.reduce((s, e) => s + e.rows.reduce((a, r) => a + r.jumlahMP, 0), 0);
        const totalOK = rel.reduce((s, e) => s + e.rows.reduce((a, r) => a + r.okCount, 0), 0);
        const totalNOK = rel.reduce((s, e) => s + e.rows.reduce((a, r) => a + r.nokCount, 0), 0);
        const pct = totalMP > 0 ? Math.round((totalOK / totalMP) * 100) : 0;
        return { deptName: dept.deptName, prosesName: proc.name, totalMP, totalOK, totalNOK, pct };
      })
    ), [summaryEntries]);

  // Rekap bulanan: %OK per proses untuk tiap bulan (Jan–Des) dalam satu tahun.
  // Jika filter bulan diisi, hanya bulan tsb yang ditampilkan; jika tidak, 12 bulan penuh.
  const activeMonthIdx = selDate ? Number(selDate.slice(5, 7)) - 1 : -1;
  const monthIndexesShown = activeMonthIdx >= 0 ? [activeMonthIdx] : MONTHS.map((_, i) => i);

  const monthlySummaryRows = useMemo(() =>
    DEPT_CONFIG.flatMap(dept =>
      dept.proses.map(proc => {
        const relAll = entries.filter(e => e.prosesKey === proc.key);
        const perMonth = MONTHS.map((_, mIdx) => {
          const rel = relAll.filter(e => new Date(e.date).getMonth() === mIdx);
          const totalMP = rel.reduce((s, e) => s + e.rows.reduce((a, r) => a + r.jumlahMP, 0), 0);
          const totalOK = rel.reduce((s, e) => s + e.rows.reduce((a, r) => a + r.okCount, 0), 0);
          return totalMP > 0 ? Math.round((totalOK / totalMP) * 100) : null;
        });
        return { deptName: dept.deptName, prosesName: proc.name, perMonth };
      })
    ), [entries]);

  // Overall %OK per bulan, dipakai untuk grafik tren bulanan
  const monthlyOverall = useMemo(() =>
    MONTHS.map((_, mIdx) => {
      const rel = entries.filter(e => new Date(e.date).getMonth() === mIdx);
      const totalMP = rel.reduce((s, e) => s + e.rows.reduce((a, r) => a + r.jumlahMP, 0), 0);
      const totalOK = rel.reduce((s, e) => s + e.rows.reduce((a, r) => a + r.okCount, 0), 0);
      return totalMP > 0 ? Math.round((totalOK / totalMP) * 100) : 0;
    }), [entries]);

  // problem aggregation from nokDetails (filtered for Ringkasan)
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

  // Rekap bulanan Problem: jumlah temuan per kategori per bulan (Jan–Des)
  const monthlyProblemRows = useMemo(() =>
    FINDING_OPTIONS.map(cat => {
      const perMonth = MONTHS.map((_, mIdx) => {
        const rel = entries.filter(e => new Date(e.date).getMonth() === mIdx);
        let cnt = 0;
        rel.forEach(e => e.rows.forEach(r => r.nokDetails.forEach(n => {
          const key = n.finding || "Lain-lain";
          if (key === cat) cnt++;
        })));
        return cnt;
      });
      const totalYear = perMonth.reduce((a, b) => a + b, 0);
      return { category: cat, perMonth, totalYear };
    }), [entries]);

  // Total temuan problem per bulan (Jan–Des)
  const monthlyTotalProblems = useMemo(() =>
    MONTHS.map((_, mIdx) => {
      const rel = entries.filter(e => new Date(e.date).getMonth() === mIdx);
      let cnt = 0;
      rel.forEach(e => e.rows.forEach(r => r.nokDetails.forEach(n => {
        if (n.finding || n.nik) cnt++;
      })));
      return cnt;
    }), [entries]);

  const overallTotalProblemsYear = monthlyTotalProblems.reduce((a, b) => a + b, 0);

  const canSave = !!(selSub && isScanned && rows.length > 0 &&
    (isCV ? rows.some(r => r.area.trim()) : rows.length > 0));

  // Riwayat inspeksi difilter berdasarkan bulan pilihan (opsional) di halaman Summary
  const filteredEntries = useMemo(() =>
    selDate ? entries.filter(e => e.date.slice(0, 7) === selDate) : entries,
    [entries, selDate]);

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
      const filterInfo = selDate
        ? `Filter Bulan: ${selDate}`
        : "Periode: Seluruh Riwayat Inspeksi";
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

      // ── Section 1: Tabel Summary Prosentase ──
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("1. Ringkasan Prosentase Pengecekan APD per Proses", 14, curY);

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

      // ── Section 2: Summary Problem / Temuan Abnormal ──
      if (curY > pageHeight - 65) {
        doc.addPage();
        curY = 16;
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("2. Summary Problem / Temuan Abnormal", 14, curY);

      const tableData2 = FINDING_OPTIONS.map((cat, i) => {
        const cnt = problemCounts[cat] || 0;
        const pct = totalProblems ? Math.round((cnt / totalProblems) * 100) : 0;
        return [String(i + 1), cat, cnt > 0 ? String(cnt) : "-", cnt > 0 ? `${pct}%` : "-"];
      });

      tableData2.push(["", "Total Temuan", String(totalProblems || "-"), "100%"]);

      autoTable(doc, {
        startY: curY + 2,
        head: [["No", "Problem / Temuan Abnormal", "Jumlah", "%"]],
        body: tableData2,
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
          if (data.row.index === tableData2.length - 1) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fillColor = [254, 242, 242];
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
      const filename = `Summary_Inspeksi_APD_${selDate || "All"}_${Date.now()}.pdf`;
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
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
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button className={`tab-btn ${page === "inspection" ? "active" : "inactive"}`}
                    onClick={() => setPage("inspection")}
                    style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <ClipboardList size={13} /> Form
                  </button>
                  <button className={`tab-btn ${page === "summary" ? "active" : "inactive"}`}
                    onClick={() => setPage("summary")}
                    style={{ display: "flex", alignItems: "center", gap: 5, position: "relative" }}>
                    <BarChart3 size={13} /> Summary
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
              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
                {[
                  { label: "Departemen", val: DEPT_CONFIG.length },
                  { label: "Tersimpan", val: entries.length },
                  { label: "Overall", val: `${overallPct}%` },
                ].map(s => (
                  <div key={s.label} style={{
                    background: "rgba(255,255,255,.1)", borderRadius: 8,
                    padding: "8px 6px", textAlign: "center"
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,.55)", marginTop: 1 }}>{s.label}</div>
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

              {/* Filter bulan — hanya memfilter Riwayat Inspeksi di bawah */}
              <div className="apd-card" style={{ padding: "16px 20px" }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 10, flexWrap: "wrap", marginBottom: 10
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Calendar size={13} color="#94a3b8" />
                     <SectionTitle ch="Filter Bulan & Tindakan" />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={loadEntries}
                      disabled={loadingEntries}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "7px 13px", border: "1px solid #e2e8f0", borderRadius: 8,
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
                        padding: "7px 15px", border: "none", borderRadius: 8,
                        background: entries.length > 0 ? "#2563eb" : "#e2e8f0",
                        color: entries.length > 0 ? "#fff" : "#94a3b8",
                        fontSize: 12, fontWeight: 700,
                        cursor: entries.length > 0 && !isExportingPdf ? "pointer" : "not-allowed",
                        boxShadow: entries.length > 0 ? "0 2px 6px rgba(37,99,235,.25)" : "none",
                        fontFamily: "inherit", transition: "all .15s"
                      }}
                    >
                      {isExportingPdf ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                      {isExportingPdf ? "Membuat PDF..." : "Download PDF"}
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-end", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ maxWidth: 280, flex: "1 1 200px" }}>
                    <Lbl ch="Pilih Bulan (opsional)" />
                    <input type="month" value={selDate}
                      onChange={e => setSelDate(e.target.value)}
                      max={new Date().toISOString().slice(0, 7)}
                      className="apd-input-field" />
                  </div>
                  {selDate && (
                    <button onClick={() => setSelDate("")}
                      style={{
                        padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 8,
                        background: "#fff", color: "#64748b", fontSize: 12, fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit"
                      }}>
                      Reset Filter
                    </button>
                  )}
                </div>
                <p style={{ margin: "10px 0 0", fontSize: 11.5, color: "#94a3b8", lineHeight: 1.5 }}>
                  Tanggal &amp; waktu data disimpan otomatis mengikuti waktu realtime saat inspeksi disimpan.
                  Memilih bulan akan memfokuskan seluruh <b>Summary</b> (Ringkasan &amp; Bulanan) serta{" "}
                  <b>Riwayat Inspeksi</b> di bawah ke bulan yang dipilih{
                    selDate && <> — saat ini: <b style={{ color: "#2563eb" }}>{MONTHS[activeMonthIdx]}</b></>
                  }.
                </p>
              </div>

              {/* 1. Summary Persentase */}
              <div className="apd-card" style={{ overflow: "hidden" }}>
                <div style={{
                  padding: "13px 20px", borderBottom: "1px solid #f1f5f9",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <TrendingUp size={15} color="#2563eb" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                      1. Summary Prosentase Pengecekan APD
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

                {/* ── Tab: Ringkasan (tampilan asli) ─────────────────────── */}
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

                {/* ── Tab: Bulanan (persentase OK per bulan, spt Excel) ──── */}
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
                              PROSENTASE OK
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

              {/* 2. Summary Problem */}
              <div className="apd-card" style={{ overflow: "hidden" }}>
                <div style={{
                  padding: "13px 20px", borderBottom: "1px solid #f1f5f9",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertCircle size={15} color="#e11d48" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                      2. Summary Problem / Temuan Abnormal
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className={`tab-btn ${problemTab === "ringkasan" ? "active" : "inactive"}`}
                      onClick={() => setProblemTab("ringkasan")}>
                      Ringkasan
                    </button>
                    <button className={`tab-btn ${problemTab === "bulanan" ? "active" : "inactive"}`}
                      onClick={() => setProblemTab("bulanan")}>
                      Bulanan
                    </button>
                  </div>
                </div>

                {/* ── Tab Problem: Ringkasan ─────────────────────────────────── */}
                {problemTab === "ringkasan" && (
                  <div style={{ overflowX: "auto", padding: "10px 0" }}>
                    <table className="sum-table">
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left" }}>No</th>
                          <th style={{ textAlign: "left" }}>Problem / Temuan Abnormal</th>
                          <th style={{ textAlign: "center" }}>Jumlah</th>
                          <th style={{ textAlign: "center" }}>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {FINDING_OPTIONS.map((cat, i) => {
                          const cnt = problemCounts[cat] || 0;
                          const pct = totalProblems ? Math.round((cnt / totalProblems) * 100) : 0;
                          return (
                            <tr key={cat}>
                              <td style={{ color: "#94a3b8", textAlign: "center" }}>{i + 1}</td>
                              <td>{cat}</td>
                              <td style={{
                                textAlign: "center", fontWeight: 700,
                                color: cnt > 0 ? "#dc2626" : "#94a3b8"
                              }}>{cnt || "-"}</td>
                              <td style={{ textAlign: "center", color: "#64748b" }}>{cnt > 0 ? `${pct}%` : "-"}</td>
                            </tr>
                          );
                        })}
                        <tr>
                          <td colSpan={2} style={{ fontWeight: 700, textAlign: "right", color: "#1e293b" }}>
                            Total Temuan
                          </td>
                          <td style={{
                            textAlign: "center", fontWeight: 800, fontSize: 15,
                            color: totalProblems > 0 ? "#dc2626" : "#94a3b8"
                          }}>
                            {totalProblems || "-"}
                          </td>
                          <td style={{ textAlign: "center", fontWeight: 700, color: "#64748b" }}>
                            {totalProblems > 0 ? "100%" : "-"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ── Tab Problem: Bulanan ───────────────────────────────────── */}
                {problemTab === "bulanan" && (
                  <div style={{ overflowX: "auto", padding: "10px 0" }}>
                    <table className="sum-table">
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left" }} rowSpan={2}>No</th>
                          <th style={{ textAlign: "left" }} rowSpan={2}>Problem / Temuan Abnormal</th>
                          <th style={{ textAlign: "center" }} colSpan={monthIndexesShown.length}>
                            JUMLAH TEMUAN BULANAN
                          </th>
                          <th style={{ textAlign: "center" }} rowSpan={2}>Total</th>
                        </tr>
                        <tr>
                          {monthIndexesShown.map(mIdx => (
                            <th key={mIdx} style={{
                              textAlign: "center", minWidth: 54,
                              background: mIdx === activeMonthIdx ? "#fee2e2" : undefined
                            }}>
                              {MONTHS[mIdx]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyProblemRows.map((r, i) => (
                          <tr key={i}>
                            <td style={{ color: "#94a3b8", textAlign: "center" }}>{i + 1}</td>
                            <td style={{ fontWeight: 500 }}>{r.category}</td>
                            {monthIndexesShown.map(mIdx => {
                              const cnt = r.perMonth[mIdx];
                              return (
                                <td key={mIdx} style={{
                                  textAlign: "center",
                                  fontWeight: cnt > 0 ? 700 : 400,
                                  color: cnt > 0 ? "#dc2626" : "#94a3b8",
                                  background: mIdx === activeMonthIdx ? "#fff1f2" : undefined
                                }}>
                                  {cnt || "-"}
                                </td>
                              );
                            })}
                            <td style={{
                              textAlign: "center", fontWeight: 800,
                              color: r.totalYear > 0 ? "#dc2626" : "#94a3b8"
                            }}>
                              {r.totalYear || "-"}
                            </td>
                          </tr>
                        ))}
                        <tr style={{ fontWeight: 700 }}>
                          <td colSpan={2} style={{ textAlign: "right", color: "#1e293b" }}>TOTAL TEMUAN</td>
                          {monthIndexesShown.map(mIdx => (
                            <td key={mIdx} style={{
                              textAlign: "center", fontWeight: 800,
                              color: monthlyTotalProblems[mIdx] > 0 ? "#dc2626" : "#94a3b8",
                              background: mIdx === activeMonthIdx ? "#fee2e2" : undefined
                            }}>
                              {monthlyTotalProblems[mIdx] || "-"}
                            </td>
                          ))}
                          <td style={{ textAlign: "center", fontWeight: 800, fontSize: 14, color: "#dc2626" }}>
                            {overallTotalProblemsYear || "-"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 3. Grafik */}
              <div className="apd-card" style={{ padding: "16px 20px" }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 8, marginBottom: 16, flexWrap: "wrap"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <BarChart3 size={15} color="#2563eb" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                      3. Grafik Problem / Temuan Abnormal {problemTab === "bulanan" ? "(Tren Bulanan)" : "(Distribusi Kategori)"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className={`tab-btn ${problemTab === "ringkasan" ? "active" : "inactive"}`}
                      onClick={() => setProblemTab("ringkasan")}>
                      Ringkasan
                    </button>
                    <button className={`tab-btn ${problemTab === "bulanan" ? "active" : "inactive"}`}
                      onClick={() => setProblemTab("bulanan")}>
                      Bulanan
                    </button>
                  </div>
                </div>

                {/* ── Grafik: Ringkasan ──────────────────────────────────────── */}
                {problemTab === "ringkasan" && (
                  totalProblems === 0 ? (
                    <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8", fontSize: 13 }}>
                      Belum ada data temuan.
                    </div>
                  ) : (
                    <div className="chart-wrap">
                      {FINDING_OPTIONS.map((cat, ci) => {
                        const val = problemCounts[cat] || 0;
                        const pct = totalProblems ? Math.round((val / totalProblems) * 100) : 0;
                        const barColors = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#06b6d4", "#6366f1", "#a855f7"];
                        return (
                          <div key={cat} className="chart-row">
                            <span className="chart-lbl">{cat}</span>
                            <div className="chart-track">
                              <div className="chart-fill"
                                style={{
                                  width: `${pct}%`, background: barColors[ci % barColors.length],
                                  minWidth: val > 0 ? 36 : 0
                                }}>
                                {val > 0 && <span>{val} ({pct}%)</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}

                {/* ── Grafik: Bulanan ────────────────────────────────────────── */}
                {problemTab === "bulanan" && (() => {
                  // Warna kontras selang-seling antar kategori
                  const CAT_COLORS = ["#ef4444","#2563eb","#f97316","#7c3aed","#eab308","#059669","#db2777"];
                  const allMonthsArr = MONTHS.map((_, i) => i);
                  const chartH = 210;
                  const paddingL = 44; const paddingB = 40; const paddingT = 18;
                  const plotH = chartH - paddingB - paddingT;
                  const monthSlotW = 90;
                  const numCat = FINDING_OPTIONS.length;
                  const barGroupW = 70;
                  const barW = barGroupW / numCat;
                  const totalSVGW = paddingL + allMonthsArr.length * monthSlotW + 8;
                  const allVals = monthlyProblemRows.flatMap(r => r.perMonth);
                  const maxVal = Math.max(...allVals, 1);
                  const gridCount = 5;
                  const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => Math.round((maxVal / gridCount) * i));

                  const linePaths = FINDING_OPTIONS.map((cat, ci) => {
                    const row = monthlyProblemRows[ci];
                    const pts = allMonthsArr.map(mIdx => {
                      const val = row ? (row.perMonth[mIdx] || 0) : 0;
                      const groupX = paddingL + mIdx * monthSlotW + (monthSlotW - barGroupW) / 2;
                      const bx = groupX + ci * barW + barW / 2;
                      const bh = (val / maxVal) * plotH;
                      return { x: bx, y: paddingT + plotH - bh, val };
                    });
                    const segs: string[] = [];
                    let drawing = false;
                    pts.forEach(p => {
                      if (p.val > 0) { segs.push(drawing ? `L ${p.x} ${p.y}` : `M ${p.x} ${p.y}`); drawing = true; }
                      else drawing = false;
                    });
                    return { path: segs.join(" "), color: CAT_COLORS[ci % CAT_COLORS.length], pts };
                  });

                  if (overallTotalProblemsYear === 0) {
                    return <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8", fontSize: 13 }}>Belum ada data temuan bulanan.</div>;
                  }
                  return (
                    <>
                      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", marginBottom: 4 }}>
                        <svg width={totalSVGW} height={chartH} style={{ display: "block", minWidth: totalSVGW }}>
                          {/* Grid lines + Y labels */}
                          {gridLines.map((gl, i) => {
                            const y = paddingT + plotH - (gl / maxVal) * plotH;
                            return (
                              <g key={i}>
                                <line x1={paddingL} y1={y} x2={totalSVGW - 4} y2={y}
                                  stroke={i === 0 ? "#cbd5e1" : "#f1f5f9"} strokeWidth={i === 0 ? 1.5 : 1} />
                                <text x={paddingL - 5} y={y + 4} textAnchor="end" fontSize={9} fill="#94a3b8">{gl}</text>
                              </g>
                            );
                          })}
                          {/* Bars per month per category */}
                          {allMonthsArr.map(mIdx => {
                            const groupX = paddingL + mIdx * monthSlotW + (monthSlotW - barGroupW) / 2;
                            return (
                              <g key={mIdx}>
                                {FINDING_OPTIONS.map((cat, ci) => {
                                  const row = monthlyProblemRows[ci];
                                  const val = row ? (row.perMonth[mIdx] || 0) : 0;
                                  const bh = (val / maxVal) * plotH;
                                  const bx = groupX + ci * barW;
                                  const by = paddingT + plotH - bh;
                                  const color = CAT_COLORS[ci % CAT_COLORS.length];
                                  return val > 0 ? (
                                    <g key={ci}>
                                      <rect x={bx} y={by} width={Math.max(barW - 1.5, 1)} height={bh}
                                        fill={color} opacity={0.82} rx={2} />
                                      {bh > 14 && (
                                        <text x={bx + (barW - 1.5) / 2} y={by + 10}
                                          textAnchor="middle" fontSize={8} fill="#fff" fontWeight="700">{val}</text>
                                      )}
                                    </g>
                                  ) : null;
                                })}
                                <text x={paddingL + mIdx * monthSlotW + monthSlotW / 2} y={chartH - 6}
                                  textAnchor="middle" fontSize={10} fill="#475569" fontWeight="600">
                                  {MONTHS[mIdx]}
                                </text>
                              </g>
                            );
                          })}
                          {/* Line charts per category */}
                          {linePaths.map((lp, ci) => lp.path ? (
                            <g key={ci}>
                              <path d={lp.path} fill="none" stroke={lp.color}
                                strokeWidth={2} strokeDasharray="5 3" opacity={0.7} />
                              {lp.pts.filter(p => p.val > 0).map((p, pi) => (
                                <circle key={pi} cx={p.x} cy={p.y} r={4}
                                  fill={lp.color} stroke="#fff" strokeWidth={1.5} />
                              ))}
                            </g>
                          ) : null)}
                          {/* Y axis label */}
                          <text x={11} y={paddingT + plotH / 2} textAnchor="middle" fontSize={9} fill="#94a3b8"
                            transform={`rotate(-90, 11, ${paddingT + plotH / 2})`}>Jumlah</text>
                        </svg>
                      </div>
                      {/* Legend */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 14px", padding: "8px 2px 2px" }}>
                        {FINDING_OPTIONS.map((cat, ci) => {
                          const totalYr = monthlyProblemRows[ci]?.totalYear || 0;
                          return (
                            <div key={ci} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <div style={{ width: 11, height: 11, borderRadius: 2, flexShrink: 0, background: CAT_COLORS[ci % CAT_COLORS.length] }} />
                              <span style={{ fontSize: 11, color: "#475569", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={cat}>{cat}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: totalYr > 0 ? CAT_COLORS[ci % CAT_COLORS.length] : "#94a3b8", marginLeft: 2 }}>({totalYr})</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* 4. Riwayat */}
              {entries.length > 0 && (
                <div className="apd-card" style={{ overflow: "hidden" }}>
                  <div style={{
                    padding: "13px 20px", borderBottom: "1px solid #f1f5f9",
                    display: "flex", alignItems: "center", gap: 8
                  }}>
                    <Users size={15} color="#2563eb" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                      4. Riwayat Inspeksi
                    </span>
                    <span style={{
                      marginLeft: "auto", fontSize: 11, fontWeight: 700,
                      background: "#eff6ff", color: "#2563eb", padding: "2px 9px", borderRadius: 999
                    }}>
                      {filteredEntries.length}{selDate ? ` / ${entries.length}` : ""}
                    </span>
                  </div>
                  {filteredEntries.length === 0 && (
                    <div style={{ padding: "22px 20px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                       Tidak ada data pada bulan yang dipilih.
                    </div>
                  )}
                  {[...filteredEntries].reverse().map((e, i) => {
                    const p = entryAvgPct(e);
                    const mp = e.rows.reduce((a, r) => a + r.jumlahMP, 0);
                    const ok = e.rows.reduce((a, r) => a + r.okCount, 0);
                    const nok = e.rows.reduce((a, r) => a + r.nokCount, 0);
                    return (
                      <div key={e.id} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "11px 20px", borderBottom: i < filteredEntries.length - 1 ? "1px solid #f8fafc" : "none"
                      }}>
                        <PctPill v={p} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 13, fontWeight: 600, color: "#1e293b",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                          }}>
                            {e.prosesName} · {e.subName}
                          </div>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                            {e.deptName} ·&nbsp;
                            <span style={{ color: "#16a34a" }}>{ok} OK</span>&nbsp;·&nbsp;
                            <span style={{ color: "#dc2626" }}>{nok} NOK</span>&nbsp;/&nbsp;{mp} MP
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "right", flexShrink: 0 }}>
                          {new Date(e.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          <br />
                          {new Date(e.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    );
                  })}
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
                    {DEPT_CONFIG.map(dept => {
                      const a = ac(dept.deptKey);
                      const rel = entries.filter(e => e.deptKey === dept.deptKey);
                      const pct = rel.length ? Math.round(rel.map(entryAvgPct).reduce((a, b) => a + b) / rel.length) : 0;
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
                                {dept.deptName}
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
                return (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                      <BackBtn onClick={goBack} />
                      <Chip label={selDept.deptName} a={a} />
                    </div>
                    <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 14px" }}>
                      Pilih proses yang akan diinspeksi.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {selDept.proses.map(proc => {
                        const rel = entries.filter(e => e.prosesKey === proc.key);
                        const pct = rel.length ? Math.round(rel.map(entryAvgPct).reduce((a, b) => a + b) / rel.length) : 0;
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
                                {proc.name}
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
                return (
                  <div>
                    {/* Breadcrumb */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
                      <BackBtn onClick={goBack} />
                      <Chip label={selDept.deptName} a={a} />
                      <ChevronRight size={12} color="#cbd5e1" />
                      <span style={{
                        padding: "3px 10px", borderRadius: 999,
                        background: "#f1f5f9", fontSize: 11, fontWeight: 600, color: "#475569"
                      }}>
                        {selProc.name}
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
                            {areaOptions.map(o => (
                              <option key={o} value={o}>{o}</option>
                            ))}
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

                          {rows.map((row, idx) => (
                            <AreaRowForm
                              key={row.id}
                              row={row}
                              isCV={isCV}
                              idx={idx}
                              canDelete={isCV && rows.length > 1}
                              acColor={a}
                              onChange={updated => updateRow(row.id, updated)}
                              onDelete={() => deleteCvRow(row.id)}
                            />
                          ))}
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
                        {!isScanned && (
                          <span style={{ fontSize: 12, color: "#d97706", fontWeight: 600 }}>
                            ⚠ Scan QR Code terlebih dahulu
                          </span>
                        )}
                        {isScanned && !selSub && (
                          <span style={{ fontSize: 12, color: "#d97706", fontWeight: 600 }}>
                            ⚠ Pilih sub-proses
                          </span>
                        )}
                        {isScanned && selSub && isCV && !rows.some(r => r.area.trim()) && (
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
                    <Chip label={selDept.deptName} a={a} />
                  </div>
                  <div>
                    <Lbl ch="Waktu Inspeksi (realtime)" />
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                      {new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                    </div>
                  </div>
                  <div>
                    <Lbl ch="Proses" />
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{selProc.name}</div>
                  </div>
                  <div>
                    <Lbl ch="Sub-Proses" />
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{selSub}</div>
                  </div>
                </div>

                <SectionTitle ch={isCV ? "Detail per Conveyor" : "Detail per Area"} />
                {rows.map((row, idx) => {
                  const pct = pctOK(row);
                  return (
                    <div key={row.id} style={{
                      border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", marginBottom: 10
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, gap: 8 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1e293b" }}>
                          {isCV ? `CV ${idx + 1}: ${row.area || "(nama belum diisi)"}` : row.area}
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
    </div>
  );
}