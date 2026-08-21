// scripts/generate-hydrant-qr.js
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

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
  { no: 21, lokasi: "SHILD WIRE C4  / AREA TIMUR", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
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

const OUTPUT_DIR = path.join(process.cwd(), "public", "generated-qr", "hydrant");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sanitizeFileName(str) {
  return str
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

async function generateQR(text, filePath) {
  try {
    await QRCode.toFile(filePath, text, {
      width: 300,
      margin: 2,
      color: {
        dark: "#0d47a1",
        light: "#ffffff",
      },
    });
    console.log(`✅ ${path.basename(filePath)} berhasil dibuat`);
  } catch (err) {
    console.error(`❌ Gagal membuat ${filePath}:`, err);
  }
}

async function main() {
  console.log("🚀 Memulai generate QR code hydrant berdasarkan NAMA LOKASI...");

  // Hapus folder lama agar tidak ada sisa file no-*.png
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  }

  ensureDir(path.join(OUTPUT_DIR, "form"));
  ensureDir(path.join(OUTPUT_DIR, "history"));

  for (const hydrant of HYDRANT_LIST) {
    const lokasi = hydrant.lokasi;
    const encodedLokasi = encodeURIComponent(lokasi);
    const safeName = sanitizeFileName(lokasi);

    const formText = `echecksheet://hydrant/${encodedLokasi}?action=form`;
    const formPath = path.join(OUTPUT_DIR, "form", `${safeName}.png`);
    await generateQR(formText, formPath);

    const historyText = `echecksheet://hydrant/${encodedLokasi}?action=history`;
    const historyPath = path.join(OUTPUT_DIR, "history", `${safeName}.png`);
    await generateQR(historyText, historyPath);
  }

  console.log("\n🎉 Semua QR code hydrant berhasil dibuat berdasarkan NAMA LOKASI!");
  console.log(`📁 Lokasi: /public/generated-qr/hydrant/`);
}

main().catch(console.error);