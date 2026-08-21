// scripts/generate-all-qr-v2.js
/**
 * ✅ UPDATED QR Code Generator untuk SEMUA checksheet
 * 
 * Fitur:
 * - Menambahkan TITLE di atas setiap QR code untuk mudah printing
 * - Menggunakan DATA REAL dari aplikasi (zona, area, slug, lokasi)
 * - Sesuai dengan ACTUAL ROUTING di app/
 * - Support format: echecksheet:///[tipo]/[parameter]
 * 
 * Usage:
 * node scripts/generate-all-qr-v2.js
 */

const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const { createCanvas, Image: CanvasImage } = require("canvas");

// ✅ DATA ZONA FIRE ALARM (18 zones)
const FIRE_ALARM_ZONES = {
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

// ✅ DATA HYDRANT (36 hydrants dengan lokasi/zona/jenis lengkap)
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

// ✅ LIFT BARANG - Unit names (6 lifts)
const LIFT_BARANG_UNITS = [
  { no: 1, namaLift: "Lift Barang Produksi", area: "Genba A Lt. 2", lokasi: "Produksi Genba A" },
  { no: 2, namaLift: "Lift Barang Genba B", area: "Genba B Lt. 2", lokasi: "Produksi Genba B" },
  { no: 3, namaLift: "Lift Barang Genba C", area: "Genba C Lt. 2", lokasi: "Produksi Genba C" },
  { no: 4, namaLift: "Lift Barang Genba D", area: "Genba D Lt. 2", lokasi: "Produksi Genba D" },
  { no: 5, namaLift: "Lift Barang Genba E", area: "Genba E Lt. 2", lokasi: "Produksi Genba E" },
  { no: 6, namaLift: "Lift Barang Warehouse", area: "Warehouse Lt. 2", lokasi: "Area Warehouse" },
];

// ✅ PANEL - Panel names (20 panels)
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

// ✅ SELANG HYDRANT - 36 hydrants (sama dengan hydrant data)
const SELANG_HYDRANT_DATA = HYDRANT_LIST;

// ✅ SMOKE DETECTOR - Area (5 areas)
const SMOKE_DETECTOR_AREAS = ["area-1", "area-2", "area-3", "area-4", "area-5"];

// ✅ EMERGENCY LAMP - Area (9 areas)
const EMERGENCY_AREAS = [
  "genba-a", "genba-b", "genba-c", "warehouse", "office",
  "pump-room", "power-house", "training-room", "auditorium"
];

// ✅ EXIT LAMP - Category (3 categories)
const EXIT_LAMP_CATEGORIES = ["exit-lamp", "titik-kumpul", "pintu-darurat"];

// ✅ STOP KONTAK - Type (2 types)
const STOP_KONTAK_TYPES = ["instalasi-listrik", "stop-kontak"];

// ✅ INFRASTRUKTUR JALAN - Area (2 areas)
const INF_JALAN_AREAS = ["area-dalam-pabrik", "area-luar-pabrik"];

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
 * Generate QR dengan TITLE di atas secara asynchronous
 * @param {string} text - URL/content untuk QR
 * @param {string} filePath - Path file output
 * @param {string} title - Title yang ditampilkan di atas QR
 * @returns {Promise<boolean>}
 */
async function generateQRWithTitle(text, filePath, title) {
  return new Promise(async (resolve) => {
    try {
      const dir = path.dirname(filePath);
      ensureDir(dir);

      // Generate QR code sebagai data URL
      const qrDataUrl = await QRCode.toDataURL(text, {
        width: 300,
        margin: 2,
        color: {
          dark: "#0d47a1",
          light: "#ffffff",
        },
      });

      // Pakai loadImage dengan timeout
      const img = new CanvasImage();
      
      const timeout = setTimeout(() => {
        console.error(`❌ Timeout loading image for ${path.basename(filePath)}`);
        resolve(false);
      }, 5000);

      img.onload = () => {
        clearTimeout(timeout);
        try {
          // Buat canvas dengan space untuk title di atas
          const titleHeight = 60;
          const canvas = createCanvas(400, img.height + titleHeight);
          const ctx = canvas.getContext("2d");

          // Background putih
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Title dengan font lebih besar
          ctx.fillStyle = "#0d47a1";
          ctx.font = "bold 16px Arial";
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
          ctx.drawImage(img, 50, titleHeight, 300, 300);

          // Save to file
          const buffer = canvas.toBuffer("image/png");
          fs.writeFileSync(filePath, buffer);
          console.log(`✅ ${path.basename(filePath)}`);
          resolve(true);
        } catch (err) {
          console.error(`❌ Canvas error for ${path.basename(filePath)}:`, err.message);
          resolve(false);
        }
      };

      img.onerror = () => {
        clearTimeout(timeout);
        console.error(`❌ Error loading image for ${path.basename(filePath)}`);
        resolve(false);
      };

      img.src = qrDataUrl;
    } catch (err) {
      console.error(`❌ Error generating QR ${path.basename(filePath)}:`, err.message);
      resolve(false);
    }
  });
}

// ============================================================
// GENERATOR FUNCTIONS
// ============================================================

async function generateFireAlarmQR() {
  console.log("\n🔥 Generating Fire Alarm QR codes...");
  let count = 0;

  for (const [zona, desc] of Object.entries(FIRE_ALARM_ZONES)) {
    const text = `echecksheet:///status-ga/fire-alarm/${zona}`;
    const title = `Fire Alarm - ${zona}`;
    const filePath = path.join(process.cwd(), "public", "generated-qr", "fire-alarm", `${zona}.png`);

    if (await generateQRWithTitle(text, filePath, title)) count++;
  }

  console.log(`✅ Fire Alarm: ${count} QR codes created`);
  return count;
}

async function generateHydrantQR() {
  console.log("\n💧 Generating Hydrant QR codes...");
  let count = 0;

  for (const hydrant of HYDRANT_LIST) {
    const text = `echecksheet:///status-ga/inspeksi-hydrant?openHydrant=${hydrant.no}`;
    const title = `Hydrant #${String(hydrant.no).padStart(2, '0')} - ${hydrant.lokasi}`;
    const filePath = path.join(process.cwd(), "public", "generated-qr", "hydrant", `hydrant-${String(hydrant.no).padStart(2, '0')}.png`);

    if (await generateQRWithTitle(text, filePath, title)) count++;
  }

  console.log(`✅ Hydrant: ${count} QR codes created`);
  return count;
}

async function generateAparQR() {
  console.log("\n🧯 Generating APAR QR codes...");
  let count = 0;

  for (const slug of APAR_SLUGS) {
    const text = `echecksheet:///status-ga/inspeksi-apar/${slug}`;
    const title = `APAR - ${slug.replace(/-/g, " ")}`;
    const filePath = path.join(process.cwd(), "public", "generated-qr", "apar", `${slug}.png`);

    if (await generateQRWithTitle(text, filePath, title)) count++;
  }

  console.log(`✅ APAR: ${count} QR codes created`);
  return count;
}

async function generateToiletQR() {
  console.log("\n🚽 Generating Toilet QR codes...");
  let count = 0;

  for (const areaId of TOILET_AREAS) {
    const text = `echecksheet:///status-ga/checksheet-toilet/${areaId}`;
    const title = `Toilet - ${areaId.replace(/-/g, " ")}`;
    const filePath = path.join(process.cwd(), "public", "generated-qr", "toilet", `${areaId}.png`);

    if (await generateQRWithTitle(text, filePath, title)) count++;
  }

  console.log(`✅ Toilet: ${count} QR codes created`);
  return count;
}

async function generateLiftBarangQR() {
  console.log("\n📦 Generating Lift Barang QR codes...");
  let count = 0;

  for (const lift of LIFT_BARANG_UNITS) {
    const text = `echecksheet:///status-ga/lift-barang?openLift=${encodeURIComponent(lift.namaLift)}`;
    const title = `Lift Barang - ${lift.namaLift}`;
    const safeName = sanitizeFileName(lift.namaLift);
    const filePath = path.join(process.cwd(), "public", "generated-qr", "lift-barang", `${safeName}.png`);

    if (await generateQRWithTitle(text, filePath, title)) count++;
  }

  console.log(`✅ Lift Barang: ${count} QR codes created`);
  return count;
}

async function generateSelangHydrantQR() {
  console.log("\n🚿 Generating Selang Hydrant QR codes...");
  let count = 0;

  for (const hydrant of SELANG_HYDRANT_DATA) {
    const text = `echecksheet:///status-ga/selang-hydrant?openArea=hydrant-${hydrant.no}`;
    const title = `Selang Hydrant #${hydrant.no} - ${hydrant.lokasi}`;
    const filePath = path.join(process.cwd(), "public", "generated-qr", "selang-hydrant", `hydrant-${String(hydrant.no).padStart(2, '0')}.png`);

    if (await generateQRWithTitle(text, filePath, title)) count++;
  }

  console.log(`✅ Selang Hydrant: ${count} QR codes created`);
  return count;
}

async function generateSmokeDetectorQR() {
  console.log("\n💨 Generating Smoke Detector QR codes...");
  let count = 0;

  for (const area of SMOKE_DETECTOR_AREAS) {
    const text = `echecksheet:///status-ga/smoke-detector?openArea=${area}`;
    const title = `Smoke Detector - ${area}`;
    const filePath = path.join(process.cwd(), "public", "generated-qr", "smoke-detector", `${area}.png`);

    if (await generateQRWithTitle(text, filePath, title)) count++;
  }

  console.log(`✅ Smoke Detector: ${count} QR codes created`);
  return count;
}

async function generateEmergencyQR() {
  console.log("\n🔆 Generating Emergency Lamp QR codes...");
  let count = 0;

  for (const area of EMERGENCY_AREAS) {
    const text = `echecksheet:///status-ga/inspeksi-emergency/${area}`;
    const title = `Emergency Lamp - ${area.replace(/-/g, " ")}`;
    const filePath = path.join(process.cwd(), "public", "generated-qr", "emergency", `${area}.png`);

    if (await generateQRWithTitle(text, filePath, title)) count++;
  }

  console.log(`✅ Emergency Lamp: ${count} QR codes created`);
  return count;
}

async function generateExitLampQR() {
  console.log("\n🚪 Generating Exit Lamp QR codes...");
  let count = 0;

  for (const category of EXIT_LAMP_CATEGORIES) {
    const text = `echecksheet:///status-ga/exit-lamp-pintu-darurat/${category}`;
    const title = `Exit Lamp - ${category.replace(/-/g, " ")}`;
    const filePath = path.join(process.cwd(), "public", "generated-qr", "exit-lamp", `${category}.png`);

    if (await generateQRWithTitle(text, filePath, title)) count++;
  }

  console.log(`✅ Exit Lamp: ${count} QR codes created`);
  return count;
}

async function generatePanelQR() {
  console.log("\n⚡ Generating Panel QR codes...");
  let count = 0;

  for (const panel of PANEL_NAMES) {
    const text = `echecksheet:///status-ga/panel?openPanel=${encodeURIComponent(panel.namaPanel)}`;
    const title = `Panel - ${panel.namaPanel}`;
    const safeName = sanitizeFileName(panel.namaPanel);
    const filePath = path.join(process.cwd(), "public", "generated-qr", "panel", `${safeName}.png`);

    if (await generateQRWithTitle(text, filePath, title)) count++;
  }

  console.log(`✅ Panel: ${count} QR codes created`);
  return count;
}

async function generateStopKontakQR() {
  console.log("\n🔌 Generating Stop Kontak QR codes...");
  let count = 0;

  for (const type of STOP_KONTAK_TYPES) {
    const text = `echecksheet:///status-ga/form-inspeksi-stop-kontak/${type}`;
    const title = `Stop Kontak - ${type.replace(/-/g, " ")}`;
    const filePath = path.join(process.cwd(), "public", "generated-qr", "stop-kontak", `${type}.png`);

    if (await generateQRWithTitle(text, filePath, title)) count++;
  }

  console.log(`✅ Stop Kontak: ${count} QR codes created`);
  return count;
}

async function generateInfJalanQR() {
  console.log("\n🛣️ Generating Infrastruktur Jalan QR codes...");
  let count = 0;

  for (const area of INF_JALAN_AREAS) {
    const text = `echecksheet:///status-ga/ga-inf-jalan?search=${encodeURIComponent(area)}`;
    const title = `Infrastruktur Jalan - ${area.replace(/-/g, " ")}`;
    const filePath = path.join(process.cwd(), "public", "generated-qr", "inf-jalan", `${area}.png`);

    if (await generateQRWithTitle(text, filePath, title)) count++;
  }

  console.log(`✅ Infrastruktur Jalan: ${count} QR codes created`);
  return count;
}

async function generateTgListrikQR() {
  console.log("\n🪜 Generating Tangga Listrik QR codes...");
  let count = 0;

  for (const area of TG_LISTRIK_AREAS) {
    const text = `echecksheet:///status-ga/tg-listrik?openArea=${encodeURIComponent(area)}`;
    const title = `Tangga Listrik - ${area.replace(/-/g, " ")}`;
    const filePath = path.join(process.cwd(), "public", "generated-qr", "tg-listrik", `${area}.png`);

    if (await generateQRWithTitle(text, filePath, title)) count++;
  }

  console.log(`✅ Tangga Listrik: ${count} QR codes created`);
  return count;
}

async function generateLiftBarangPreventifQR() {
  console.log("\n🔧 Generating Lift Barang Preventif QR codes...");
  let count = 0;

  for (const subType of LIFT_BARANG_SUB_TYPES) {
    const text = `echecksheet:///status-ga/inspeksi-preventif-lift-barang/${subType}`;
    const title = `Lift Barang ${subType.charAt(0).toUpperCase() + subType.slice(1)}`;
    const filePath = path.join(process.cwd(), "public", "generated-qr", "lift-barang-preventif", `${subType}.png`);

    if (await generateQRWithTitle(text, filePath, title)) count++;
  }

  console.log(`✅ Lift Barang Preventif: ${count} QR codes created`);
  return count;
}

// ============================================================
// MAIN EXECUTION
// ============================================================

async function main() {
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║     🎯 QR CODE GENERATOR - UPDATED VERSION (v2)          ║");
  console.log("║  Dengan TITLE di atas setiap QR untuk mudah printing     ║");
  console.log("║  Data sesuai dengan ACTUAL ROUTING di aplikasi           ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");

  let totalCount = 0;

  // STATUS-GA Checksheets
  console.log("\n📍 STATUS-GA Checksheets (inside /app/status-ga/):");
  totalCount += await generateFireAlarmQR();
  totalCount += await generateHydrantQR();
  totalCount += await generateAparQR();
  totalCount += await generateToiletQR();
  totalCount += await generatePanelQR();
  totalCount += await generateStopKontakQR();
  totalCount += await generateInfJalanQR();
  totalCount += await generateTgListrikQR();
  totalCount += await generateLiftBarangQR();
  totalCount += await generateSelangHydrantQR();
  totalCount += await generateSmokeDetectorQR();
  totalCount += await generateEmergencyQR();
  totalCount += await generateExitLampQR();
  totalCount += await generateLiftBarangPreventifQR();

  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log(`║  ✅ SELESAI! Total ${String(totalCount).padStart(3, ' ')} QR codes berhasil dibuat                   ║`);
  console.log("║  📁 Lokasi: /public/generated-qr/[checksheet-type]/      ║");
  console.log("║                                                           ║");
  console.log("║  ✨ Fitur Baru:                                          ║");
  console.log("║  - TITLE di atas setiap QR code                          ║");
  console.log("║  - Data zona/area/lokasi sesuai aplikasi                 ║");
  console.log("║  - Siap untuk printing langsung                          ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
