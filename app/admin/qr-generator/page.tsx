// app/admin/qr-generator/page.tsx
"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";

// ──────────────────────────────────────────────────────────────────────────────
// AUTH FETCH HELPER
// ──────────────────────────────────────────────────────────────────────────────
function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  if (typeof window === "undefined") return fetch(url, options);
  try {
    const userStr = localStorage.getItem("auth_current_user_v2");
    if (userStr) {
      const u = JSON.parse(userStr);
      options.headers = {
        "Content-Type": "application/json",
        ...options.headers,
        "x-user-id": String(u.id || ""),
        "x-user-role": String(u.role || ""),
        "x-username": String(u.username || ""),
      };
    }
  } catch {}
  return fetch(url, options);
}

// ──────────────────────────────────────────────────────────────────────────────
// HOOK: useSidebarWidth
// Mendengarkan CustomEvent "sidebarToggle" yang di-dispatch oleh Sidebar.tsx.
// Sidebar mengirim: { detail: { expanded: boolean, width: number } }
// Nilai collapsed = 70px, expanded = 240px — sesuai konstanta di Sidebar.tsx
// ──────────────────────────────────────────────────────────────────────────────
function useSidebarWidth() {
  const COLLAPSED_W = 70;   // harus sama dengan SIDEBAR_COLLAPSED_W di Sidebar.tsx
  const EXPANDED_W  = 240;  // harus sama dengan SIDEBAR_EXPANDED_W  di Sidebar.tsx

  const [sidebarW, setSidebarW] = useState(COLLAPSED_W);

  useEffect(() => {
    // Baca CSS variable yang di-set Sidebar saat mount (sudah pasti akurat)
    const readCssVar = () => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue("--sidebar-w").trim();
      if (v) setSidebarW(parseInt(v));
    };
    readCssVar();

    // Dengarkan event toggle dari Sidebar
    const onToggle = (e: Event) => {
      const { width } = (e as CustomEvent<{ expanded: boolean; width: number }>).detail;
      setSidebarW(width);
    };

    window.addEventListener("sidebarToggle", onToggle);
    return () => window.removeEventListener("sidebarToggle", onToggle);
  }, []);

  return sidebarW;
}

// ──────────────────────────────────────────────────────────────────────────────
// GA DATA STRUCTURES
// ──────────────────────────────────────────────────────────────────────────────

const FIRE_ALARM_ZONES: Record<string, string> = {
  "zona-1": "Lobby & Hydrant Main Office",
  "zona-2": "EXIM",
  "zona-3": "Toilet C, Rest Area, Musholla, Pintu 1-2",
  "zona-4": "Office WHS, Lift Barang WHS, USM",
  "zona-5": "Hydrant Jig Proto, Office Jig Proto",
  "zona-6": "Hydrant Training",
  "zona-7": "Hydrant Genba C, Mezzanine, Gel Sheet",
  "zona-8": "Pump Room",
  "zona-9": "Power House A, TPS B3",
  "zona-10": "Hydrant Canteen",
  "zona-11": "Auditorium",
  "zona-12": "Samping Panel Genba B",
  "zona-13": "Area Timur Genba B",
  "zona-14": "Power House B, Parkir",
  "zona-15": "Prepare Box EXIM, Office EXIM",
  "zona-20": "Axis 8 - Selatan Pintu 7",
  "zona-22": "New Warehouse",
  "zona-23": "Bawah Mezzanine, Ministore WHS",
};

const HYDRANT_LIST = [
  { no: 1, lokasi: "KANTIN", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 2, lokasi: "AUDITORIUM", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 3, lokasi: "MAIN OFFICE SISI SELATAN", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 4, lokasi: "BELAKANG RAK KARTON BOX EXIM", zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR" },
  { no: 5, lokasi: "PINTU 9 CV 2B / GENBA A", zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR" },
  { no: 6, lokasi: "CV AT6 GENBA A", zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR" },
  { no: 7, lokasi: "CV AT7 GENBA A", zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR" },
  { no: 8, lokasi: "CV AT 11 GENBA A", zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR" },
  { no: 9, lokasi: "PINTU 7 GENBA A", zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR" },
  { no: 10, lokasi: "SEBELAH UTARA PINTU 7", zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR" },
  { no: 11, lokasi: "NEW BUILDING WHS (RAK TOYOTA)", zona: "UTARA", jenisHydrant: "HYDRANT INDOOR" },
  { no: 12, lokasi: "SAMPING LIFT BARANG WHS", zona: "UTARA", jenisHydrant: "HYDRANT INDOOR" },
  { no: 13, lokasi: "OFFICE WHS", zona: "UTARA", jenisHydrant: "HYDRANT INDOOR" },
  { no: 14, lokasi: "CV 12B / AREA BARAT", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 15, lokasi: "CV AB 10", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 16, lokasi: "CV AB 5", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 17, lokasi: "PINTU 1 GENBA A", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 18, lokasi: "CV 8A", zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR" },
  { no: 19, lokasi: "SUB ASSY B1", zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR" },
  { no: 20, lokasi: "SUB ASSY C7", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 21, lokasi: "SHILD WIRE C4 / AREA TIMUR", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 22, lokasi: "RAYCHAM NPR.07", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 23, lokasi: "CV 5A M/S / AREA BARAT", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 24, lokasi: "TRAINING ROOM", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 25, lokasi: "JIG PROTO / STOCK MATERIAL", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 26, lokasi: "MEZZANINE SISI BARAT", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 27, lokasi: "DEPAN MASJID", zona: "BARAT", jenisHydrant: "HYDRANT PILLAR" },
  { no: 28, lokasi: "DEPAN GENBA C", zona: "BARAT", jenisHydrant: "HYDRANT PILLAR" },
  { no: 29, lokasi: "SAMPING PUMP ROOM", zona: "BARAT", jenisHydrant: "HYDRANT PILLAR" },
  { no: 30, lokasi: "SAMPING LOADING DOCK WH", zona: "TIMUR", jenisHydrant: "HYDRANT PILLAR" },
  { no: 31, lokasi: "SEBELAH UTARA PINTU 8", zona: "TIMUR", jenisHydrant: "HYDRANT PILLAR" },
  { no: 32, lokasi: "SAMPING LOADING DOCK EXIM", zona: "TIMUR", jenisHydrant: "HYDRANT PILLAR" },
  { no: 33, lokasi: "DEPAN AREA PARKIR", zona: "TIMUR", jenisHydrant: "HYDRANT PILLAR" },
  { no: 34, lokasi: "PARKIR BAWAH", zona: "SELATAN", jenisHydrant: "HYDRANT INDOOR" },
  { no: 35, lokasi: "PARKIR ATAS", zona: "SELATAN", jenisHydrant: "HYDRANT INDOOR" },
  { no: 36, lokasi: "DEPAN POWER HOUSE A", zona: "UTARA", jenisHydrant: "HYDRANT OUTDOOR" },
];

const APAR_SLUGS = [
  "area-locker-security", "area-kantin", "area-auditorium", "area-main-office", "exim",
  "area-genba-a", "area-mezzanine-genba-a", "jig-proto-1-area-receiving", "stock-control-area",
  "jig-proto-2-cnc-room", "area-training-dining-mtc", "genba-c", "area-pump-room-warehouse",
  "power-house-genba-a", "power-house-genba-c", "area-tps-b3", "new-building-warehouse",
  "genba-b", "power-house-workshop", "area-segitiga-ga", "area-parkir-motor",
  "forklift", "samping-pagar-rak-helm", "belakang-kantin", "ir-room",
  "area-auditorium-outdoor", "area-klinik", "mesin-raychem-genba-a", "mesin-raychem-genba-b",
  "mesin-raychem-genba-c"
];

const TOILET_AREAS = [
  "toilet-driver", "toilet-bea-cukai", "toilet-parkir", "toilet-c2", "toilet-c1",
  "toilet-d", "toilet-auditorium", "toilet-whs", "toilet-b1", "toilet-a",
  "toilet-lobby", "toilet-office-main", "toilet-genba-b", "toilet-b2"
];

const LIFT_BARANG_UNITS = [
  { no: 1, namaLift: "Lift Barang Produksi", area: "Genba A Lt. 2", lokasi: "Produksi Genba A" },
  { no: 2, namaLift: "Lift Barang Genba B", area: "Genba B Lt. 2", lokasi: "Produksi Genba B" },
  { no: 3, namaLift: "Lift Barang Genba C", area: "Genba C Lt. 2", lokasi: "Produksi Genba C" },
  { no: 4, namaLift: "Lift Barang Genba D", area: "Genba D Lt. 2", lokasi: "Produksi Genba D" },
  { no: 5, namaLift: "Lift Barang Genba E", area: "Genba E Lt. 2", lokasi: "Produksi Genba E" },
  { no: 6, namaLift: "Lift Barang Warehouse", area: "Warehouse Lt. 2", lokasi: "Area Warehouse" },
];

const PANEL_NAMES = [
  { no: 1, namaPanel: "MCC Sump 1", area: "Pintu 3 Genba A" },
  { no: 2, namaPanel: "MCC Sump 2", area: "Pintu 1 Genba A" },
  { no: 3, namaPanel: "MCC Sump 3", area: "Samping Meeting Room" },
  { no: 4, namaPanel: "MCC Sump 4", area: "Toilet Security" },
  { no: 5, namaPanel: "MCC Sump 5", area: "Toilet Wanita D" },
  { no: 6, namaPanel: "MCC Sump 6", area: "Pintu 9" },
  { no: 7, namaPanel: "MCC Sump 7", area: "Parkir Mobil" },
  { no: 8, namaPanel: "MCC Sump Main Office", area: "Polytainer Exim" },
  { no: 9, namaPanel: "sump new (auditorium)", area: "Submersible Pump Control Panel" },
  { no: 10, namaPanel: "LP OLP - 1", area: "Loading Dock Warehouse" },
  { no: 11, namaPanel: "LP OLP - 2", area: "Samping Masjid" },
  { no: 12, namaPanel: "LP Training", area: "Training Room" },
  { no: 13, namaPanel: "LP Kantin", area: "Kantin Room" },
  { no: 14, namaPanel: "PP Dep Well", area: "TPA" },
  { no: 15, namaPanel: "STP", area: "IPAL" },
  { no: 16, namaPanel: "PP Computer", area: "Main Office" },
  { no: 17, namaPanel: "PP/LP Office", area: "Main Office" },
  { no: 18, namaPanel: "LP GH", area: "Pos Security" },
  { no: 19, namaPanel: "Workshop", area: "Workshop" },
  { no: 20, namaPanel: "Segitiga", area: "Area Segitiga" },
];

const SMOKE_DETECTOR_AREAS = ["area-1", "area-2", "area-3", "area-4", "area-5"];
const EMERGENCY_AREAS = ["genba-a", "genba-b", "genba-c", "warehouse", "office", "pump-room", "power-house", "training-room", "auditorium"];
const EXIT_LAMP_CATEGORIES = ["exit-lamp", "titik-kumpul", "pintu-darurat"];
const STOP_KONTAK_TYPES = ["instalasi-listrik", "stop-kontak"];
const INF_JALAN_AREAS = ["area-dalam-pabrik", "area-luar-pabrik"];
const TG_LISTRIK_AREAS = ["area-produksi", "area-warehouse"];
const LIFT_BARANG_SUB_TYPES = ["inspeksi", "preventif"];

// ──────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ──────────────────────────────────────────────────────────────────────────────
interface QRConfig {
  type: string;
  title: string;
  url: string;
  description?: string;
}

declare global {
  interface Window {
    QRCode: any;
    _qrcodeScriptLoading?: boolean;
    _qrcodeScriptLoaded?: boolean;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// LOAD QR SCRIPT
// ──────────────────────────────────────────────────────────────────────────────
function loadQRScript(cb: () => void) {
  if (window._qrcodeScriptLoaded) { cb(); return; }
  if (window._qrcodeScriptLoading) {
    const p = setInterval(() => {
      if (window._qrcodeScriptLoaded) { clearInterval(p); cb(); }
    }, 80);
    return;
  }
  window._qrcodeScriptLoading = true;
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
  s.onload = () => { window._qrcodeScriptLoaded = true; window._qrcodeScriptLoading = false; cb(); };
  s.onerror = () => { window._qrcodeScriptLoading = false; };
  document.head.appendChild(s);
}

// ──────────────────────────────────────────────────────────────────────────────
// QR CARD COMPONENT
// ──────────────────────────────────────────────────────────────────────────────
function QRCard({ config, index }: { config: QRConfig; index: number }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const c = document.createElement("div");
    c.style.cssText = "width:172px;height:172px;";
    qrRef.current = c;
    wrapperRef.current.appendChild(c);

    loadQRScript(() => {
      if (!window.QRCode || !qrRef.current) return;
      try {
        new window.QRCode(qrRef.current, {
          text: config.url,
          width: 172,
          height: 172,
          colorDark: "#0d47a1",
          colorLight: "#ffffff",
          correctLevel: window.QRCode.CorrectLevel.M
        });
        setTimeout(() => { setLoaded(true); }, 200);
      } catch {}
    });

    const cc = c, ww = wrapperRef.current;
    return () => {
      try { if (ww?.contains(cc)) ww.removeChild(cc); } catch {}
      qrRef.current = null;
    };
  }, [config.url]);

  const downloadQR = async () => {
    if (!loaded) { alert("QR code belum siap. Mohon tunggu sebentar."); return; }
    await new Promise(resolve => setTimeout(resolve, 300));

    let src = qrRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    let imgElement = qrRef.current?.querySelector("img") as HTMLImageElement | null;
    if (!src && !imgElement) { alert("QR belum siap. Silakan coba lagi."); return; }

    let actualWidth = 0, actualHeight = 0;
    let srcData: HTMLCanvasElement | HTMLImageElement = src || imgElement!;
    if (src) { actualWidth = src.width; actualHeight = src.height; }
    else if (imgElement) { actualWidth = imgElement.naturalWidth || imgElement.width || 172; actualHeight = imgElement.naturalHeight || imgElement.height || 172; }
    if (actualWidth === 0 || actualHeight === 0) { actualWidth = 172; actualHeight = 172; }

    const titleHeight = 60;
    const qrSize = Math.max(actualWidth, actualHeight, 172);
    const ec = document.createElement("canvas");
    ec.width = qrSize + 40;
    ec.height = qrSize + titleHeight + 20;
    const ctx = ec.getContext("2d")!;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, ec.width, ec.height);
    ctx.fillStyle = "#0d47a1";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const maxWidth = ec.width - 20;
    const words = config.title.split(" ");
    let lines: string[] = [];
    let currentLine = "";
    for (const word of words) {
      const testLine = currentLine + (currentLine ? " " : "") + word;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) { lines.push(currentLine); currentLine = word; }
      else { currentLine = testLine; }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = 20;
    const startY = 15 + (lines.length > 1 ? 5 : 10);
    lines.forEach((line, idx) => { ctx.fillText(line, ec.width / 2, startY + idx * lineHeight); });

    const qrX = (ec.width - qrSize) / 2;
    ctx.drawImage(srcData, qrX, titleHeight, qrSize, qrSize);

    const a = document.createElement("a");
    a.download = `QR_${sanitizeFileName(config.title)}.png`;
    a.href = ec.toDataURL("image/png");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="qr-card">
      <div className="qr-header">
        <span className="qr-index">#{index + 1}</span>
        <span className="qr-type-badge">{config.type}</span>
      </div>
      <div style={{ position: "relative" }}>
        <div ref={wrapperRef} style={{ width: 180, height: 180, border: "2px solid #e2e8f0", borderRadius: 8, overflow: "hidden", background: "white", padding: 4, boxSizing: "border-box" }} />
        {!loaded && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "white", borderRadius: 8 }}>
            <div className="qr-spinner" />
          </div>
        )}
      </div>
      <div className="qr-info">
        <h3 className="qr-title">{config.title}</h3>
        {config.description && <p className="qr-desc">{config.description}</p>}
        <code className="qr-url">{config.url}</code>
      </div>
      <div className="qr-actions">
        <button className="btn-dl" onClick={downloadQR}>⬇ Download</button>
        <button className="btn-cp" onClick={() => { navigator.clipboard?.writeText(config.url).catch(() => {}); alert("✅ URL disalin!"); }}>⎘ Salin</button>
      </div>
      <style jsx>{`
        .qr-card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,.07); display: flex; flex-direction: column; align-items: center; gap: 14px; border: 2px solid #f1f5f9; transition: all .2s; }
        .qr-card:hover { border-color: #1e88e5; box-shadow: 0 4px 20px rgba(30,136,229,.12); transform: translateY(-2px); }
        .qr-header { width: 100%; display: flex; align-items: center; justify-content: space-between; }
        .qr-index { font-size: 12px; font-weight: 600; color: #94a3b8; background: #f1f5f9; padding: 3px 8px; border-radius: 6px; }
        .qr-type-badge { font-size: 10px; font-weight: 700; background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; }
        .qr-spinner { width: 28px; height: 28px; border: 3px solid #e2e8f0; border-top-color: #1e88e5; border-radius: 50%; animation: spin .8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg) } }
        .qr-info { width: 100%; text-align: center; }
        .qr-title { margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #1e293b; line-height: 1.3; }
        .qr-desc { margin: 0 0 8px; font-size: 12px; color: #64748b; }
        .qr-url { display: block; font-size: 9px; color: #94a3b8; background: #f8fafc; padding: 6px; border-radius: 6px; word-break: break-all; text-align: left; font-family: monospace; border: 1px solid #e2e8f0; line-height: 1.5; }
        .qr-actions { width: 100%; display: flex; gap: 8px; }
        .btn-dl, .btn-cp { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all .2s; border: none; }
        .btn-dl { background: #1e88e5; color: white; }
        .btn-dl:hover { background: #1565c0; }
        .btn-cp { background: #f1f5f9; color: #475569; border: 1.5px solid #e2e8f0; }
        .btn-cp:hover { background: #e2e8f0; }
      `}</style>
    </div>
  );
}

function sanitizeFileName(str: string) {
  return str.replace(/[^a-zA-Z0-9\s-]/g, " ").replace(/\s+/g, "_").replace(/^_+|_+$/g, "").toLowerCase();
}

// ──────────────────────────────────────────────────────────────────────────────
// GENERATOR FUNCTIONS
// ──────────────────────────────────────────────────────────────────────────────
function generateFireAlarmQR(): QRConfig[] {
  return Object.entries(FIRE_ALARM_ZONES).map(([zona, desc]) => ({ type: "Fire Alarm", title: `Fire Alarm - ${zona}`, url: `echecksheet:///status-ga/fire-alarm/${zona}`, description: desc }));
}
function generateHydrantQR(): QRConfig[] {
  return HYDRANT_LIST.map(h => ({ type: "Hydrant", title: `Hydrant #${String(h.no).padStart(2, '0')} - ${h.lokasi}`, url: `echecksheet:///e-checksheet-hydrant?no=${h.no}&lokasi=${encodeURIComponent(h.lokasi)}&zona=${encodeURIComponent(h.zona)}&jenisHydrant=${encodeURIComponent(h.jenisHydrant)}`, description: `${h.jenisHydrant} • Zona ${h.zona}` }));
}
function generateAparQR(): QRConfig[] {
  return APAR_SLUGS.map(slug => ({ type: "APAR", title: `APAR - ${slug.replace(/-/g, " ")}`, url: `echecksheet:///status-ga/inspeksi-apar/${slug}` }));
}
function generateToiletQR(): QRConfig[] {
  return TOILET_AREAS.map(areaId => ({ type: "Toilet", title: `Toilet - ${areaId.replace(/-/g, " ")}`, url: `echecksheet:///status-ga/checksheet-toilet/${areaId}` }));
}
function generateLiftBarangQR(): QRConfig[] {
  return LIFT_BARANG_UNITS.map(lift => ({ type: "Lift Barang", title: `Lift Barang - ${lift.namaLift}`, url: `echecksheet:///status-ga/lift-barang?openLift=${encodeURIComponent(lift.namaLift)}`, description: `${lift.area} • ${lift.lokasi}` }));
}
function generateSelangHydrantQR(): QRConfig[] {
  return HYDRANT_LIST.map(h => ({ type: "Selang Hydrant", title: `Selang Hydrant #${h.no} - ${h.lokasi}`, url: `echecksheet:///e-checksheet-selang-hydrant?no=${h.no}&lokasi=${encodeURIComponent(h.lokasi)}&zona=${encodeURIComponent(h.zona)}&jenisHydrant=${encodeURIComponent(h.jenisHydrant)}`, description: `${h.jenisHydrant} • Zona ${h.zona}` }));
}
function generateSmokeDetectorQR(): QRConfig[] {
  return SMOKE_DETECTOR_AREAS.map(area => ({ type: "Smoke Detector", title: `Smoke Detector - ${area}`, url: `echecksheet:///status-ga/smoke-detector?area=${encodeURIComponent(area)}` }));
}
function generateEmergencyQR(): QRConfig[] {
  return EMERGENCY_AREAS.map(area => ({ type: "Emergency Lamp", title: `Emergency Lamp - ${area.replace(/-/g, " ")}`, url: `echecksheet:///status-ga/inspeksi-emergency/${area}` }));
}
function generateExitLampQR(): QRConfig[] {
  return EXIT_LAMP_CATEGORIES.map(cat => ({ type: "Exit Lamp", title: `Exit Lamp - ${cat.replace(/-/g, " ")}`, url: `echecksheet:///status-ga/exit-lamp-pintu-darurat/${cat}` }));
}
function generatePanelQR(): QRConfig[] {
  return PANEL_NAMES.map(panel => ({ type: "Panel", title: `Panel - ${panel.namaPanel}`, url: `echecksheet:///e-checksheet-panel?namaPanel=${encodeURIComponent(panel.namaPanel)}&area=${encodeURIComponent(panel.area)}`, description: panel.area }));
}
function generateStopKontakQR(): QRConfig[] {
  return STOP_KONTAK_TYPES.map(type => ({ type: "Stop Kontak", title: `Stop Kontak - ${type.replace(/-/g, " ")}`, url: `echecksheet:///status-ga/form-inspeksi-stop-kontak/${type}` }));
}
function generateInfJalanQR(): QRConfig[] {
  return INF_JALAN_AREAS.map(area => ({ type: "Infrastruktur Jalan", title: `Infrastruktur Jalan - ${area.replace(/-/g, " ")}`, url: `echecksheet:///e-checksheet-ga-inf-jalan?area=${encodeURIComponent(area)}` }));
}
function generateTgListrikQR(): QRConfig[] {
  return TG_LISTRIK_AREAS.map(area => ({ type: "Tangga Listrik", title: `Tangga Listrik - ${area.replace(/-/g, " ")}`, url: `echecksheet:///status-ga/tg-listrik?openArea=${encodeURIComponent(area)}` }));
}
function generateLiftBarangPreventifQR(): QRConfig[] {
  return LIFT_BARANG_SUB_TYPES.map(subType => ({ type: "Lift Preventif", title: `Lift Barang ${subType.charAt(0).toUpperCase() + subType.slice(1)}`, url: `echecksheet:///status-ga/inspeksi-preventif-lift-barang/${subType}` }));
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ──────────────────────────────────────────────────────────────────────────────
export default function QRGeneratorPage() {
  const router = useRouter();
  const { user, loading: authLoading, isInitialized } = useAuth();

  // ✅ Reactive sidebar width
  const sidebarW = useSidebarWidth();

  const [selectedCategory, setSelectedCategory] = useState<string>("fire-alarm");
  const [searchQuery, setSearchQuery] = useState("");
  const [qrConfigs, setQrConfigs] = useState<QRConfig[]>([]);
  const [isGenerated, setIsGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    { id: "fire-alarm", label: "🔥 Fire Alarm", count: Object.keys(FIRE_ALARM_ZONES).length, generator: generateFireAlarmQR },
    { id: "hydrant", label: "💧 Hydrant", count: HYDRANT_LIST.length, generator: generateHydrantQR },
    { id: "apar", label: "🧯 APAR", count: APAR_SLUGS.length, generator: generateAparQR },
    { id: "toilet", label: "🚽 Toilet", count: TOILET_AREAS.length, generator: generateToiletQR },
    { id: "lift-barang", label: "📦 Lift Barang", count: LIFT_BARANG_UNITS.length, generator: generateLiftBarangQR },
    { id: "selang-hydrant", label: "🚿 Selang Hydrant", count: HYDRANT_LIST.length, generator: generateSelangHydrantQR },
    { id: "smoke-detector", label: "💨 Smoke Detector", count: SMOKE_DETECTOR_AREAS.length, generator: generateSmokeDetectorQR },
    { id: "emergency", label: "🔆 Emergency Lamp", count: EMERGENCY_AREAS.length, generator: generateEmergencyQR },
    { id: "exit-lamp", label: "🚪 Exit Lamp", count: EXIT_LAMP_CATEGORIES.length, generator: generateExitLampQR },
    { id: "panel", label: "⚡ Panel", count: PANEL_NAMES.length, generator: generatePanelQR },
    { id: "stop-kontak", label: "🔌 Stop Kontak", count: STOP_KONTAK_TYPES.length, generator: generateStopKontakQR },
    { id: "inf-jalan", label: "🛣️ Inf. Jalan", count: INF_JALAN_AREAS.length, generator: generateInfJalanQR },
    { id: "tg-listrik", label: "🪜 Tangga Listrik", count: TG_LISTRIK_AREAS.length, generator: generateTgListrikQR },
    { id: "lift-preventif", label: "🔧 Lift Preventif", count: LIFT_BARANG_SUB_TYPES.length, generator: generateLiftBarangPreventifQR },
  ];

  useEffect(() => {
    if (!isInitialized || authLoading) return;
    if (!user) { router.push("/login-page"); return; }
    if (!["admin", "superadmin"].includes(user.role)) router.push("/home");
  }, [user, authLoading, isInitialized, router]);

  useEffect(() => {
    const cat = categories.find(c => c.id === selectedCategory);
    if (cat) {
      setIsLoading(true);
      setTimeout(() => { setQrConfigs(cat.generator()); setIsGenerated(true); setIsLoading(false); }, 150);
    }
  }, [selectedCategory]);

  const filteredConfigs = qrConfigs.filter(cfg =>
    cfg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cfg.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cfg.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleGenerateAll = () => {
    setIsLoading(true);
    setTimeout(() => {
      const all = categories.flatMap(cat => cat.generator());
      setQrConfigs(all);
      setIsGenerated(true);
      setIsLoading(false);
      setTimeout(() => document.getElementById("qr-grid")?.scrollIntoView({ behavior: "smooth" }), 100);
    }, 300);
  };

  if (authLoading || !isInitialized) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f0f4f8" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, border: "3px solid #e2e8f0", borderTopColor: "#1e88e5", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#64748b", fontSize: 14 }}>Memuat...</p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!user) return null;

  const selectedCat = categories.find(c => c.id === selectedCategory);

  // ✅ Inline style yang reaktif terhadap sidebarW (hanya desktop, mobile pakai CSS override)
  const mainStyle: React.CSSProperties = {
    marginLeft: sidebarW,
    padding: 24,
    minHeight: "100vh",
    background: "#f0f4f8",
    // Smooth transition ikut animasi sidebar
    transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  };

  return (
    <>
      <Sidebar userName={user.fullName || user.username} />
      <main className="mc" style={mainStyle}>
        {/* Header */}
        <div className="ph">
          
          <div>
            <h1 className="ht">🔲 QR Generator - General Affairs</h1>
            <p className="hs">Buat & unduh QR Code untuk semua checksheet GA dengan TITLE untuk printing</p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="cat-scroll">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`cat-btn ${selectedCategory === cat.id ? "active" : ""}`}
              onClick={() => { setSelectedCategory(cat.id); setSearchQuery(""); setIsGenerated(false); }}
            >
              <span className="cat-icon">{cat.label.split(" ")[0]}</span>
              <span className="cat-label">{cat.label.split(" ").slice(1).join(" ")}</span>
              <span className="cat-count">{cat.count}</span>
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="toolbar">
          <div className="search-box">
            <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder={`Cari di ${selectedCat?.label}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="action-buttons">
            <button className="btn-secondary" onClick={() => { setSearchQuery(""); setIsGenerated(false); setQrConfigs([]); }}>
              🔄 Reset
            </button>
            <button className="btn-primary" onClick={handleGenerateAll} disabled={isLoading}>
              {isLoading ? "Memuat..." : "✨ Generate Semua"}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="info-box">
          <p><strong>Format URL:</strong> <code>echecksheet:///status-ga/[type]/[slug]</code> atau <code>?param=value</code></p>
          <p><strong>TITLE:</strong> Otomatis ditambahkan di atas QR untuk memudahkan identifikasi saat printing.</p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: 48, background: "white", borderRadius: 12 }}>
            <div style={{ width: 28, height: 28, border: "3px solid #e2e8f0", borderTopColor: "#1e88e5", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
            <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Memuat QR Codes...</p>
          </div>
        )}

        {/* Results */}
        {isGenerated && !isLoading && (
          <>
            <div className="results-header">
              <h2>✅ {filteredConfigs.length} QR Code{filteredConfigs.length !== 1 ? "s" : ""} Siap Download</h2>
              <p>Klik <strong>⬇ Download</strong> untuk menyimpan PNG dengan TITLE.</p>
            </div>
            <div id="qr-grid" className="qr-grid">
              {filteredConfigs.length > 0 ? (
                filteredConfigs.map((cfg, i) => <QRCard key={`${cfg.type}-${cfg.title}-${i}`} config={cfg} index={i} />)
              ) : (
                <div className="empty-state">
                  <p>🔍 Tidak ditemukan hasil untuk "{searchQuery}"</p>
                  <button className="btn-small" onClick={() => setSearchQuery("")}>Hapus Filter</button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Guide */}
        <div className="guide-section">
          <h2>📖 Panduan Penggunaan</h2>
          <div className="guide-steps">
            {[
              { n: 1, title: "Pilih Kategori", desc: "Klik tab kategori checksheet yang ingin dibuat QR-nya." },
              { n: 2, title: "Cari & Filter", desc: "Gunakan kolom search untuk menemukan item spesifik." },
              { n: 3, title: "Download", desc: "Klik ⬇ Download untuk menyimpan PNG dengan TITLE di atas QR." },
              { n: 4, title: "Cetak & Tempel", desc: "Print QR code dan tempel di lokasi fisik yang sesuai." },
              { n: 5, title: "Scan & Gunakan", desc: "Scan QR dengan device untuk langsung membuka form checksheet." },
            ].map(({ n, title, desc }) => (
              <div key={n} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#1e88e5,#1565c0)", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{n}</div>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{title}</h3>
                  <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <style jsx>{`
        /* ── Desktop: margin-left dikontrol inline via sidebarW ── */
        .mc { padding: 24px; min-height: 100vh; background: #f0f4f8; }

        .ph { background: linear-gradient(135deg, #1e3a5f, #1e88e5); border-radius: 16px; padding: 20px 24px; display: flex; align-items: center; gap: 16px; margin-bottom: 20px; box-shadow: 0 4px 16px rgba(30,136,229,.25); }
        .bb { background: rgba(255,255,255,.15); border: none; color: white; width: 40px; height: 40px; border-radius: 10px; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .ht { margin: 0 0 4px; font-size: 22px; font-weight: 700; color: white; }
        .hs { margin: 0; font-size: 13px; color: rgba(255,255,255,.8); }
        
        .cat-scroll { display: flex; gap: 8px; overflow-x: auto; padding: 8px 0; margin-bottom: 16px; scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
        .cat-scroll::-webkit-scrollbar { height: 6px; }
        .cat-scroll::-webkit-scrollbar-track { background: transparent; }
        .cat-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .cat-btn { display: flex; align-items: center; gap: 6px; padding: 10px 16px; border: 2px solid #e2e8f0; border-radius: 12px; background: white; cursor: pointer; transition: all .2s; white-space: nowrap; }
        .cat-btn:hover { border-color: #1e88e5; background: #eff6ff; }
        .cat-btn.active { border-color: #1e88e5; background: #eff6ff; box-shadow: 0 2px 8px rgba(30,136,229,.15); }
        .cat-icon { font-size: 16px; }
        .cat-label { font-size: 13px; font-weight: 600; color: #475569; }
        .cat-count { font-size: 11px; font-weight: 700; background: #f1f5f9; color: #64748b; padding: 2px 8px; border-radius: 999px; }
        
        .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
        .search-box { position: relative; flex: 1; min-width: 200px; max-width: 400px; }
        .search-input { width: 100%; padding: 12px 12px 12px 40px; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; transition: border-color .2s; box-sizing: border-box; }
        .search-input:focus { border-color: #1e88e5; }
        .action-buttons { display: flex; gap: 8px; }
        .btn-primary { padding: 11px 20px; background: linear-gradient(135deg, #1e88e5, #1565c0); color: white; border: none; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all .2s; }
        .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(30,136,229,.3); }
        .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
        .btn-secondary { padding: 11px 20px; background: #f1f5f9; color: #475569; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all .2s; }
        .btn-secondary:hover { background: #e2e8f0; }
        
        .info-box { background: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; font-size: 13px; color: #1e293b; line-height: 1.6; }
        .info-box code { background: #e0f2fe; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
        
        .results-header { margin: 24px 0 16px; }
        .results-header h2 { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0 0 6px; }
        .results-header p { font-size: 13px; color: #64748b; margin: 0; }
        
        .qr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; margin-bottom: 32px; }
        
        .empty-state { grid-column: 1 / -1; text-align: center; padding: 48px; background: white; border-radius: 12px; color: #64748b; }
        .empty-state p { margin: 0 0 16px; font-size: 14px; }
        .btn-small { padding: 8px 16px; background: #f1f5f9; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 12px; font-weight: 600; color: #475569; cursor: pointer; }
        .btn-small:hover { background: #e2e8f0; }
        
        .guide-section { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,.06); margin-bottom: 40px; }
        .guide-section h2 { font-size: 17px; font-weight: 700; color: #1e293b; margin: 0 0 20px; }
        .guide-steps { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
        
        @keyframes spin { to { transform: rotate(360deg) } }
        
        /* ── Mobile: sidebar biasanya overlay/hidden, main ambil full width ── */
        @media (max-width: 768px) {
          .mc {
            /* Override inline style saat mobile — margin-left reset ke 0 */
            margin-left: 0 !important;
            padding: 12px;
          }
          .ht { font-size: 16px; }
          .hs { font-size: 11px; }
          .qr-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
          .toolbar { flex-direction: column; align-items: stretch; }
          .search-box { max-width: 100%; }
          .action-buttons { justify-content: center; }
          .guide-steps { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}