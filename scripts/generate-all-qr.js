// scripts/generate-all-qr.js
/**
 * ✅ UPDATED QR Code Generator untuk SEMUA checksheet
 * 
 * Fitur:
 * - Menambahkan TITLE di atas setiap QR code untuk mudah printing
 * - menggunakan DATA REAL dari aplikasi (zona, area, slug, lokasi)
 * - Sesuai dengan ACTUAL ROUTING di app/
 * - Support format: echecksheet:///[tipo]/[parameter]
 * 
 * Routing Pattern:
 * STATUS-GA: fire-alarm, inspeksi-hydrant, inspeksi-apar, checksheet-toilet, dll
 * E-CHECKSHEET: e-checksheet-hydrant, e-checksheet-apd, dll
 */

const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const { createCanvas, registerFont } = require("canvas");

// ✅ FIRE ALARM - Zona-based (18 zones)
const FIRE_ALARM_ZONES = [
  "zona-1", "zona-2", "zona-3", "zona-4", "zona-5",
  "zona-6", "zona-7", "zona-8", "zona-9", "zona-10",
  "zona-11", "zona-12", "zona-13", "zona-14", "zona-15",
  "zona-20", "zona-22", "zona-23"
];

// Map zona ke deskripsi
const FIRE_ALARM_ZONES_MAP = {
  "zona-1": "Lobby & Hydrant Main Office",
  "zona-2": "EXIM",
  "zona-3": "Toilet C, Rest Area, Musholla, Pintu 1-2 Genba A",
  "zona-4": "Office Warehouse, Lift Barang WHS, USM Area",
  "zona-5": "Hydrant Jig Proto, Office Jig Proto",
  "zona-6": "Hydrant Training",
  "zona-7": "Hydrant Genba C, Dinding Mezzanine, Gel Sheet",
  "zona-8": "Pump Room",
  "zona-9": "Power House A, TPS B3",
  "zona-10": "Hydrant Canteen",
  "zona-11": "Auditorium",
  "zona-12": "Samping Panel Genba B",
  "zona-13": "Area Timur Genba B",
  "zona-14": "Power House B, Parkir Bawah & Atas",
  "zona-15": "Prepare Box EXIM, Office EXIM",
  "zona-20": "Axis 8 - Selatan Pintu 7",
  "zona-22": "New Warehouse",
  "zona-23": "Bawah Mezzanine, Ministore Warehouse",
};

// ✅ HYDRANT - 36 hydrants dengan lokasi/zona/jenis lengkap
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

// ✅ APAR - Slug-based (30 areas)
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

// ✅ TOILET - Area IDs (12 areas)
const TOILET_AREAS = [
  "toilet-driver", "toilet-bea-cukai", "toilet-parkir", "toilet-c2", "toilet-c1",
  "toilet-d", "toilet-auditorium", "toilet-whs", "toilet-b1", "toilet-a",
  "toilet-lobby", "toilet-office-main"
];

// ✅ LIFT BARANG - Unit names (6 lifts) - From GaLiftBarangContent.tsx
const LIFT_BARANG_UNITS = [
  { no: 1, namaLift: "Lift Barang Genba A", area: "Genba A Lt. 2", lokasi: "Produksi Genba A" },
  { no: 2, namaLift: "Lift Barang Genba B", area: "Genba B Lt. 2", lokasi: "Produksi Genba B" },
  { no: 3, namaLift: "Lift Barang Genba C", area: "Genba C Lt. 2", lokasi: "Produksi Genba C" },
  { no: 4, namaLift: "Lift Barang Genba D", area: "Genba D Lt. 2", lokasi: "Produksi Genba D" },
  { no: 5, namaLift: "Lift Barang Genba E", area: "Genba E Lt. 2", lokasi: "Produksi Genba E" },
  { no: 6, namaLift: "Lift Barang Warehouse", area: "Warehouse Lt. 2", lokasi: "Area Warehouse" },
];

// ✅ SELANG HYDRANT - Zona/Area (4 zones)
const SELANG_HYDRANT_ZONES = ["zona-barat", "zona-timur", "zona-utara", "zona-selatan"];

// ✅ SMOKE DETECTOR - Area (5 areas)
const SMOKE_DETECTOR_AREAS = ["area-1", "area-2", "area-3", "area-4", "area-5"];

// ✅ EMERGENCY LAMP - Area (9 areas)
const EMERGENCY_AREAS = [
  "genba-a", "genba-b", "genba-c", "warehouse", "office",
  "pump-room", "power-house", "training-room", "auditorium"
];

// ✅ EXIT LAMP - Category (3 categories)
const EXIT_LAMP_CATEGORIES = ["exit-lamp", "titik-kumpul", "pintu-darurat"];

// ✅ PANEL - Panel names (20 panels) - From GaPanelContent.tsx
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

// ✅ STOP KONTAK - Type (2 types)
const STOP_KONTAK_TYPES = ["instalasi-listrik", "stop-kontak"];

// ✅ INFRASTRUKTUR JALAN - Area (2 areas)
const INF_JALAN_AREAS = ["area-dalam-pabrik", "area-luar-pabrik"];

// ✅ APD - APD types (43 types)
const APD_TYPES = [
  "topi-safety", "helm-safety", "kacamata-safety", "masker-n95", "masker-kain",
  "sarung-tangan-nitrile", "sarung-tangan-kulit", "sepatu-safety", "boot-safety",
  "rompi-safety", "rompi-reflective", "apron", "overall", "jaket-safety",
  "kaos-kaki-safety", "ikat-pinggang-safety", "safety-belt", "harness",
  "knee-pad", "elbow-pad", "wrist-guard", "face-shield", "ear-muff",
  "respirator", "gas-mask", "safety-glasses", "welding-helmet", "bump-cap",
  "hairnet", "shoe-cover", "sleeve-guard", "chest-protector", "back-protector",
  "shin-guard", "goggles", "earplugs", "air-purifying-respirator",
  "supplied-air-respirator", "chemical-resistant-suit", "radiation-suit",
  "flame-resistant-suit", "electrostatic-suit"
];

// ✅ TANGGA LISTRIK - Unit (2 units)
const TG_LISTRIK_AREAS = ["area-produksi", "area-warehouse"];

// ✅ INSPEKSI PREVENTIF LIFT BARANG - Types (2 sub-types)
const LIFT_BARANG_SUB_TYPES = ["inspeksi", "preventif"];

// Utility functions
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sanitizeFileName(str) {
  return str
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .replace(/\s+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

/**
 * Generate QR dengan TITLE di atas
 * @param {string} text - URL/content untuk QR
 * @param {string} filePath - Path file output
 * @param {string} title - Title yang ditampilkan di atas QR
 */
async function generateQRWithTitle(text, filePath, title) {
  try {
    const dir = path.dirname(filePath);
    ensureDir(dir);

    // Generate QR code buffer
    const qrBuffer = await QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
      color: {
        dark: "#0d47a1",
        light: "#ffffff",
      },
    });

    // Decode base64 ke buffer
    const base64Data = qrBuffer.replace(/^data:image\/png;base64,/, "");
    const qrImageBuffer = Buffer.from(base64Data, "base64");

    // Load QR image
    const { Image } = require("canvas");
    const qrImage = new Image();
    qrImage.onload = () => {
      // Buat canvas dengan space untuk title di atas
      const titleHeight = 60;
      const canvas = createCanvas(400, qrImage.height + titleHeight);
      const ctx = canvas.getContext("2d");

      // Background putih
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Title dengan font lebih besar
      ctx.fillStyle = "#0d47a1";
      ctx.font = "bold 18px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Wrap title jika terlalu panjang
      const maxWidth = 390;
      const words = title.split(" ");
      let lines = [];
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine + (currentLine ? " " : "") + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      // Draw title lines
      const lineHeight = 20;
      const startY = 15 + (lines.length > 1 ? 5 : 10);
      lines.forEach((line, idx) => {
        ctx.fillText(line, canvas.width / 2, startY + idx * lineHeight);
      });

      // Draw QR code di bawah title
      ctx.drawImage(qrImage, 50, titleHeight, 300, 300);

      // Save to file
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(filePath, buffer);
      console.log(`✅ ${path.basename(filePath)}`);
    };
    qrImage.src = qrImageBuffer;
  } catch (err) {
    console.error(`❌ Error creating ${filePath}:`, err.message);
  }
}

async function generateFireAlarmQR() {
  console.log("🔥 Generating Fire Alarm QR codes...");
  let count = 0;

  for (const zona of FIRE_ALARM_ZONES) {
    const text = `echecksheet:///status-ga/fire-alarm/${zona}`;
    const zoneName = FIRE_ALARM_ZONES_MAP[zona] || zona;
    const title = `Fire Alarm - ${zoneName}`;
    const filePath = path.join(process.cwd(), "public", "generated-qr", "fire-alarm", `${zona}.png`);

    if (await generateQRWithTitle(text, filePath, title)) count++;
  }

  console.log(`✅ Fire Alarm: ${count} QR codes created\n`);
  return count;
}

async function generateHydrantQR() {
  console.log("💧 Generating Hydrant QR codes...");
  let count = 0;

  for (const hydrant of HYDRANT_LIST) {
    const text = `echecksheet:///status-ga/inspeksi-hydrant?openHydrant=${hydrant.no}`;
    const title = `Hydrant #${hydrant.no} - ${hydrant.lokasi}`;
    const filePath = path.join(process.cwd(), "public", "generated-qr", "hydrant", `hydrant-${hydrant.no}.png`);

    if (await generateQRWithTitle(text, filePath, title)) count++;
  }

  console.log(`✅ Hydrant: ${count} QR codes created\n`);
  return count;
}

async function generateAparQR() {
  console.log("🧯 Generating APAR QR codes...");
  let count = 0;

  for (const slug of APAR_SLUGS) {
    const text = `echecksheet:///status-ga/inspeksi-apar/${slug}`;
    const filePath = path.join(process.cwd(), "public", "generated-qr", "apar", `${slug}.png`);

    if (await generateQR(text, filePath)) count++;
  }

  console.log(`✅ APAR: ${count} QR codes created`);
  return count;
}

async function generateToiletQR() {
  console.log("🚽 Generating Toilet QR codes...");
  let count = 0;

  for (const areaId of TOILET_AREAS) {
    const text = `echecksheet:///status-ga/checksheet-toilet/${areaId}`;
    const filePath = path.join(process.cwd(), "public", "generated-qr", "toilet", `${areaId}.png`);

    if (await generateQR(text, filePath)) count++;
  }

  console.log(`✅ Toilet: ${count} QR codes created`);
  return count;
}

async function generateLiftBarangQR() {
  console.log("📦 Generating Lift Barang QR codes...");
  let count = 0;

  for (const lift of LIFT_BARANG_UNITS) {
    const params = new URLSearchParams({
      liftName: lift.namaLift,
      area: lift.area,
      lokasi: lift.lokasi
    });
    const text = `echecksheet:///status-ga/lift-barang?${params.toString()}`;
    const safeName = sanitizeFileName(lift.namaLift);
    const filePath = path.join(process.cwd(), "public", "generated-qr", "lift-barang", `${safeName}.png`);

    if (await generateQR(text, filePath)) count++;
  }

  console.log(`✅ Lift Barang: ${count} QR codes created`);
  return count;
}

async function generateSelangHydrantQR() {
  console.log("🚿 Generating Selang Hydrant QR codes...");
  let count = 0;

  for (const zona of SELANG_HYDRANT_ZONES) {
    const text = `echecksheet:///status-ga/selang-hydrant?openArea=${zona}`;
    const filePath = path.join(process.cwd(), "public", "generated-qr", "selang-hydrant", `${zona}.png`);

    if (await generateQR(text, filePath)) count++;
  }

  console.log(`✅ Selang Hydrant: ${count} QR codes created`);
  return count;
}

async function generateSmokeDetectorQR() {
  console.log("💨 Generating Smoke Detector QR codes...");
  let count = 0;

  for (const area of SMOKE_DETECTOR_AREAS) {
    const text = `echecksheet:///status-ga/smoke-detector?openArea=${area}`;
    const filePath = path.join(process.cwd(), "public", "generated-qr", "smoke-detector", `${area}.png`);

    if (await generateQR(text, filePath)) count++;
  }

  console.log(`✅ Smoke Detector: ${count} QR codes created`);
  return count;
}

async function generateEmergencyQR() {
  console.log("🔆 Generating Emergency Lamp QR codes...");
  let count = 0;

  for (const area of EMERGENCY_AREAS) {
    const text = `echecksheet:///status-ga/inspeksi-emergency/${area}`;
    const filePath = path.join(process.cwd(), "public", "generated-qr", "emergency", `${area}.png`);

    if (await generateQR(text, filePath)) count++;
  }

  console.log(`✅ Emergency Lamp: ${count} QR codes created`);
  return count;
}

async function generateExitLampQR() {
  console.log("🚪 Generating Exit Lamp QR codes...");
  let count = 0;

  for (const category of EXIT_LAMP_CATEGORIES) {
    const text = `echecksheet:///status-ga/exit-lamp-pintu-darurat/${category}`;
    const filePath = path.join(process.cwd(), "public", "generated-qr", "exit-lamp", `${category}.png`);

    if (await generateQR(text, filePath)) count++;
  }

  console.log(`✅ Exit Lamp: ${count} QR codes created`);
  return count;
}

async function generatePanelQR() {
  console.log("⚡ Generating Panel QR codes...");
  let count = 0;

  for (const panel of PANEL_NAMES) {
    const date = new Date().toISOString().split("T")[0];
    const params = new URLSearchParams({
      panelName: panel.namaPanel,
      area: panel.area,
      date: date
    });
    const text = `echecksheet:///status-ga/panel?${params.toString()}`;
    const safeName = sanitizeFileName(panel.namaPanel);
    const filePath = path.join(process.cwd(), "public", "generated-qr", "panel", `${safeName}.png`);

    if (await generateQR(text, filePath)) count++;
  }

  console.log(`✅ Panel: ${count} QR codes created`);
  return count;
}

async function generateStopKontakQR() {
  console.log("🔌 Generating Stop Kontak QR codes...");
  let count = 0;

  for (const type of STOP_KONTAK_TYPES) {
    const text = `echecksheet:///status-ga/form-inspeksi-stop-kontak/${type}`;
    const filePath = path.join(process.cwd(), "public", "generated-qr", "stop-kontak", `${type}.png`);

    if (await generateQR(text, filePath)) count++;
  }

  console.log(`✅ Stop Kontak: ${count} QR codes created`);
  return count;
}

async function generateInfJalanQR() {
  console.log("🛣️ Generating Infrastruktur Jalan QR codes...");
  let count = 0;

  for (const area of INF_JALAN_AREAS) {
    const text = `echecksheet:///status-ga/ga-inf-jalan?search=${encodeURIComponent(area)}`;
    const filePath = path.join(process.cwd(), "public", "generated-qr", "inf-jalan", `${area}.png`);

    if (await generateQR(text, filePath)) count++;
  }

  console.log(`✅ Infrastruktur Jalan: ${count} QR codes created`);
  return count;
}

async function generateApdQR() {
  console.log("👷 Generating APD QR codes...");
  let count = 0;

  for (const apdType of APD_TYPES) {
    const safeName = sanitizeFileName(apdType);
    const text = `echecksheet:///status-ga/inspeksi-apd?areaId=${encodeURIComponent(apdType)}`;
    const filePath = path.join(process.cwd(), "public", "generated-qr", "apd", `${safeName}.png`);

    if (await generateQR(text, filePath)) count++;
  }

  console.log(`✅ APD: ${count} QR codes created`);
  return count;
}

async function generateTgListrikQR() {
  console.log("🪜 Generating Tangga Listrik QR codes...");
  let count = 0;

  for (const area of TG_LISTRIK_AREAS) {
    const text = `echecksheet:///status-ga/tg-listrik?openArea=${encodeURIComponent(area)}`;
    const filePath = path.join(process.cwd(), "public", "generated-qr", "tg-listrik", `${area}.png`);

    if (await generateQR(text, filePath)) count++;
  }

  console.log(`✅ Tangga Listrik: ${count} QR codes created`);
  return count;
}

async function generateLiftBarangPreventifQR() {
  console.log("🔧 Generating Lift Barang Preventif QR codes...");
  let count = 0;

  for (const subType of LIFT_BARANG_SUB_TYPES) {
    const text = `echecksheet:///status-ga/inspeksi-preventif-lift-barang/${subType}`;
    const filePath = path.join(process.cwd(), "public", "generated-qr", "lift-barang-preventif", `${subType}.png`);

    if (await generateQR(text, filePath)) count++;
  }

  console.log(`✅ Lift Barang Preventif: ${count} QR codes created`);
  return count;
}

// ✅ E-CHECKSHEET HYDRANT - Direct route (36 hydrants)
// Sample data for hydrant locations
const HYDRANT_DATA = [
  { no: 1, lokasi: "KANTIN", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 2, lokasi: "AUDITORIUM", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 3, lokasi: "GENBA A", zona: "UTARA", jenisHydrant: "HYDRANT OUTDOOR" },
  { no: 4, lokasi: "GENBA B", zona: "TIMUR", jenisHydrant: "HYDRANT OUTDOOR" },
  { no: 5, lokasi: "GENBA C", zona: "SELATAN", jenisHydrant: "HYDRANT INDOOR" },
  { no: 6, lokasi: "WAREHOUSE", zona: "UTARA", jenisHydrant: "HYDRANT INDOOR" },
  { no: 7, lokasi: "PUMP ROOM", zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR" },
  { no: 8, lokasi: "POWER HOUSE", zona: "SELATAN", jenisHydrant: "HYDRANT OUTDOOR" },
  { no: 9, lokasi: "OFFICE", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 10, lokasi: "LOBBY", zona: "UTARA", jenisHydrant: "HYDRANT INDOOR" },
  { no: 11, lokasi: "EXIM", zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR" },
  { no: 12, lokasi: "TRAINING", zona: "SELATAN", jenisHydrant: "HYDRANT OUTDOOR" },
];

async function generateEChecksheetHydrantQR() {
  console.log("💧 Generating E-Checksheet Hydrant QR codes...");
  let count = 0;

  for (const hydrant of HYDRANT_DATA) {
    const params = new URLSearchParams({
      no: hydrant.no,
      lokasi: hydrant.lokasi,
      zona: hydrant.zona,
      jenisHydrant: hydrant.jenisHydrant
    });
    const text = `echecksheet:///e-checksheet-hydrant?${params.toString()}`;
    const filePath = path.join(process.cwd(), "public", "generated-qr", "e-checksheet-hydrant", `hydrant-${hydrant.no}.png`);

    if (await generateQR(text, filePath)) count++;
  }

  console.log(`✅ E-Checksheet Hydrant: ${count} QR codes created`);
  return count;
}

// ✅ E-CHECKSHEET INFRASTRUKTUR JALAN - Direct route
const INF_JALAN_DATA = [
  { areaName: "Jalan Utama Produksi A", kategori: "Jalan Utama", lokasi: "Genba A - Main Road" },
  { areaName: "Jalan Utama Produksi B", kategori: "Jalan Utama", lokasi: "Genba B - Main Road" },
  { areaName: "Jalan Sekunder Warehouse", kategori: "Jalan Sekunder", lokasi: "Warehouse" },
  { areaName: "Jalan Akses Pump Room", kategori: "Jalan Akses", lokasi: "Pump Room" },
];

async function generateEChecksheetInfJalanQR() {
  console.log("🛣️ Generating E-Checksheet Infrastruktur Jalan QR codes...");
  let count = 0;

  for (const road of INF_JALAN_DATA) {
    const params = new URLSearchParams({
      areaName: road.areaName,
      kategori: road.kategori,
      lokasi: road.lokasi
    });
    const text = `echecksheet:///e-checksheet-inf-jalan?${params.toString()}`;
    const safeName = sanitizeFileName(road.areaName);
    const filePath = path.join(process.cwd(), "public", "generated-qr", "e-checksheet-inf-jalan", `${safeName}.png`);

    if (await generateQR(text, filePath)) count++;
  }

  console.log(`✅ E-Checksheet Infrastruktur Jalan: ${count} QR codes created`);
  return count;
}

// ✅ E-CHECKSHEET INSPEKSI APD - Direct route
const APD_AREAS_DATA = [
  { areaId: 1, areaName: "PRE ASSY AREA GENBA C", areaType: "Produksi" },
  { areaId: 2, areaName: "PRE ASSY GENBA A+B", areaType: "Produksi" },
  { areaId: 3, areaName: "FINAL ASSY AREA", areaType: "Produksi" },
  { areaId: 4, areaName: "WAREHOUSE AREA", areaType: "Logistik" },
  { areaId: 5, areaName: "OFFICE AREA", areaType: "Administrative" },
];

async function generateEChecksheetApdQR() {
  console.log("👷 Generating E-Checksheet APD QR codes...");
  let count = 0;

  for (const area of APD_AREAS_DATA) {
    const params = new URLSearchParams({
      areaId: area.areaId,
      areaName: area.areaName,
      areaType: area.areaType
    });
    const text = `echecksheet:///e-checksheet-ins-apd?${params.toString()}`;
    const safeName = sanitizeFileName(area.areaName);
    const filePath = path.join(process.cwd(), "public", "generated-qr", "e-checksheet-apd", `${safeName}.png`);

    if (await generateQR(text, filePath)) count++;
  }

  console.log(`✅ E-Checksheet APD: ${count} QR codes created`);
  return count;
}

// ✅ E-CHECKSHEET LIFT BARANG - Direct route
const LIFT_BARANG_DATA = [
  { namaLift: "Lift Barang Genba A", area: "Genba A Lt. 2", lokasi: "Produksi Genba A" },
  { namaLift: "Lift Barang Genba B", area: "Genba B Lt. 2", lokasi: "Produksi Genba B" },
  { namaLift: "Lift Barang Genba C", area: "Genba C Lt. 2", lokasi: "Produksi Genba C" },
  { namaLift: "Lift Barang Genba D", area: "Genba D Lt. 2", lokasi: "Produksi Genba D" },
  { namaLift: "Lift Barang Genba E", area: "Genba E Lt. 2", lokasi: "Produksi Genba E" },
  { namaLift: "Lift Barang Warehouse", area: "Warehouse Lt. 2", lokasi: "Area Warehouse" },
];

async function generateEChecksheetLiftBarangQR() {
  console.log("📦 Generating E-Checksheet Lift Barang QR codes...");
  let count = 0;

  for (const lift of LIFT_BARANG_DATA) {
    const params = new URLSearchParams({
      liftName: lift.namaLift,
      area: lift.area,
      lokasi: lift.lokasi
    });
    const text = `echecksheet:///e-checksheet-lift-barang?${params.toString()}`;
    const safeName = sanitizeFileName(lift.namaLift);
    const filePath = path.join(process.cwd(), "public", "generated-qr", "e-checksheet-lift-barang", `${safeName}.png`);

    if (await generateQR(text, filePath)) count++;
  }

  console.log(`✅ E-Checksheet Lift Barang: ${count} QR codes created`);
  return count;
}

// ✅ E-CHECKSHEET PANEL - Direct route
const PANEL_DATA = [
  { namaPanel: "MCC Sump 1", area: "Pintu 3 Genba A" },
  { namaPanel: "MCC Sump 2", area: "Pintu 1 Genba A" },
  { namaPanel: "MCC Sump 3", area: "Samping Meeting Room" },
  { namaPanel: "MCC Sump 4", area: "Toilet Security" },
  { namaPanel: "MCC Sump 5", area: "Toilet Wanita D" },
  { namaPanel: "MCC Sump 6", area: "Pintu 9" },
  { namaPanel: "MCC Sump 7", area: "Parkir Mobil" },
  { namaPanel: "MCC Sump Main Office", area: "Polytainer Exim" },
  { namaPanel: "sump new (auditorium)", area: "Submersible Pump Control Panel" },
  { namaPanel: "LP OLP - 1", area: "Loading Dock Warehouse" },
  { namaPanel: "LP OLP - 2", area: "Samping Masjid" },
  { namaPanel: "LP Training", area: "Training Room" },
  { namaPanel: "LP Kantin", area: "Kantin Room" },
  { namaPanel: "PP Dep Well", area: "TPA" },
  { namaPanel: "STP", area: "IPAL" },
  { namaPanel: "PP Computer", area: "Main Office" },
  { namaPanel: "PP/LP Office", area: "Main Office" },
  { namaPanel: "LP GH", area: "Pos Security" },
  { namaPanel: "Workshop", area: "Workshop" },
  { namaPanel: "Segitiga", area: "Area Segitiga" },
];

async function generateEChecksheetPanelQR() {
  console.log("⚡ Generating E-Checksheet Panel QR codes...");
  let count = 0;

  for (const panel of PANEL_DATA) {
    const date = new Date().toISOString().split("T")[0];
    const params = new URLSearchParams({
      panelName: panel.namaPanel,
      area: panel.area,
      date: date
    });
    const text = `echecksheet:///e-checksheet-panel?${params.toString()}`;
    const safeName = sanitizeFileName(panel.namaPanel);
    const filePath = path.join(process.cwd(), "public", "generated-qr", "e-checksheet-panel", `${safeName}.png`);

    if (await generateQR(text, filePath)) count++;
  }

  console.log(`✅ E-Checksheet Panel: ${count} QR codes created`);
  return count;
}

// ✅ E-CHECKSHEET SELANG HYDRANT - Direct route
const SELANG_HYDRANT_DATA = [
  { lokasi: "KANTIN", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR", pic: "TIAN" },
  { lokasi: "AUDITORIUM", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR", pic: "TIAN" },
  { lokasi: "GENBA A", zona: "UTARA", jenisHydrant: "HYDRANT OUTDOOR", pic: "BUDI" },
  { lokasi: "WAREHOUSE", zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR", pic: "AGUS" },
];

async function generateEChecksheetSelangHydrantQR() {
  console.log("🚿 Generating E-Checksheet Selang Hydrant QR codes...");
  let count = 0;

  for (const selang of SELANG_HYDRANT_DATA) {
    const params = new URLSearchParams({
      lokasi: selang.lokasi,
      zona: selang.zona,
      jenisHydrant: selang.jenisHydrant,
      pic: selang.pic
    });
    const text = `echecksheet:///e-checksheet-slg-hydrant?${params.toString()}`;
    const safeName = sanitizeFileName(selang.lokasi);
    const filePath = path.join(process.cwd(), "public", "generated-qr", "e-checksheet-selang-hydrant", `${safeName}.png`);

    if (await generateQR(text, filePath)) count++;
  }

  console.log(`✅ E-Checksheet Selang Hydrant: ${count} QR codes created`);
  return count;
}

// ✅ E-CHECKSHEET SMOKE DETECTOR - Direct route
const SMOKE_DETECTOR_DATA = [
  { no: 1, lokasi: "LOBBY", zona: "1" },
  { no: 2, lokasi: "LOBBY", zona: "1" },
  { no: 3, lokasi: "GENBA A", zona: "2" },
  { no: 4, lokasi: "GENBA B", zona: "3" },
  { no: 5, lokasi: "WAREHOUSE", zona: "4" },
];

async function generateEChecksheetSmokeDetectorQR() {
  console.log("💨 Generating E-Checksheet Smoke Detector QR codes...");
  let count = 0;

  for (const detector of SMOKE_DETECTOR_DATA) {
    const params = new URLSearchParams({
      no: detector.no,
      lokasi: detector.lokasi,
      zona: detector.zona
    });
    const text = `echecksheet:///e-checksheet-smoke-detector?${params.toString()}`;
    const filePath = path.join(process.cwd(), "public", "generated-qr", "e-checksheet-smoke-detector", `detector-${detector.no}.png`);

    if (await generateQR(text, filePath)) count++;
  }

  console.log(`✅ E-Checksheet Smoke Detector: ${count} QR codes created`);
  return count;
}

// ✅ E-CHECKSHEET TANGGA LISTRIK - Direct route
const TG_LISTRIK_DATA = [
  { areaName: "Tangga Listrik A - Produksi", lokasi: "Genba A" },
  { areaName: "Tangga Listrik B - Warehouse", lokasi: "Gudang Utama" },
  { areaName: "Tangga Listrik C - Office", lokasi: "Office Area" },
];

async function generateEChecksheetTgListrikQR() {
  console.log("🪜 Generating E-Checksheet Tangga Listrik QR codes...");
  let count = 0;

  for (const stairs of TG_LISTRIK_DATA) {
    const params = new URLSearchParams({
      areaName: stairs.areaName,
      lokasi: stairs.lokasi
    });
    const text = `echecksheet:///e-checksheet-tg-listrik?${params.toString()}`;
    const safeName = sanitizeFileName(stairs.areaName);
    const filePath = path.join(process.cwd(), "public", "generated-qr", "e-checksheet-tg-listrik", `${safeName}.png`);

    if (await generateQR(text, filePath)) count++;
  }

  console.log(`✅ E-Checksheet Tangga Listrik: ${count} QR codes created`);
  return count;
}

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║  🎯 QR CODE GENERATOR - SEMUA CHECKSHEET (Status-GA + E-Checksheet) ║");
  console.log("║  Sesuai dengan routing ACTUAL di app/                      ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log("📍 STATUS-GA Checksheets (inside /app/status-ga/)::\n");
  let totalCount = 0;

  totalCount += await generateFireAlarmQR();
  totalCount += await generateHydrantQR();
  totalCount += await generateAparQR();
  totalCount += await generateToiletQR();
  totalCount += await generatePanelQR();
  totalCount += await generateStopKontakQR();
  totalCount += await generateInfJalanQR();
  totalCount += await generateTgListrikQR();
  totalCount += await generateApdQR();
  totalCount += await generateLiftBarangQR();
  totalCount += await generateSelangHydrantQR();
  totalCount += await generateSmokeDetectorQR();
  totalCount += await generateEmergencyQR();
  totalCount += await generateExitLampQR();
  totalCount += await generateLiftBarangPreventifQR();

  console.log("\n📍 E-CHECKSHEET Checksheets (direct routes in /app/):\n");

  totalCount += await generateEChecksheetHydrantQR();
  totalCount += await generateEChecksheetInfJalanQR();
  totalCount += await generateEChecksheetApdQR();
  totalCount += await generateEChecksheetLiftBarangQR();
  totalCount += await generateEChecksheetPanelQR();
  totalCount += await generateEChecksheetSelangHydrantQR();
  totalCount += await generateEChecksheetSmokeDetectorQR();
  totalCount += await generateEChecksheetTgListrikQR();

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log(`║  ✅ SELESAI! Total ${totalCount} QR codes berhasil dibuat                   ║`);
  console.log("║  📁 Lokasi: /public/generated-qr/                           ║");
  console.log("║                                                              ║");
  console.log("║  Format QR: echecksheet:///[routing-path]                   ║");
  console.log("║  Status-GA:  echecksheet:///status-ga/fire-alarm/zona-1    ║");
  console.log("║  E-Checksheet: echecksheet:///e-checksheet-hydrant?...     ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
