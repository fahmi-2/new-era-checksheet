// scripts/generate-fire-alarm-qr.js
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

const zones = [
  "zona-1", "zona-2", "zona-3", "zona-4", "zona-5",
  "zona-6", "zona-7", "zona-8", "zona-9", "zona-10",
  "zona-11", "zona-12", "zona-13", "zona-14", "zona-15",
  "zona-20", "zona-22", "zona-23"
];

const OUTPUT_DIR = path.join(process.cwd(), "public", "generated-qr", "fire-alarm");

async function generateQR(text, filePath) {
  try {
    // Gunakan toFile() langsung — lebih aman dan tidak corrupt
    await QRCode.toFile(filePath, text, {
      width: 300,
      margin: 2,
      color: {
        dark: "#0d47a1",   // Biru tua
        light: "#ffffff",  // Putih
      },
    });

    console.log(`✅ ${filePath} berhasil dibuat`);
  } catch (err) {
    console.error(`❌ Gagal membuat ${filePath}:`, err);
  }
}

async function main() {
  console.log("🚀 Memulai generate QR code untuk Fire Alarm...");

  for (const zone of zones) {
    const formText = `echecksheet://fire-alarm/${zone}?action=form`;
    const formPath = path.join(OUTPUT_DIR, "form", `${zone}.png`);
    await generateQR(formText, formPath);

    const historyText = `echecksheet://fire-alarm/${zone}?action=history`;
    const historyPath = path.join(OUTPUT_DIR, "history", `${zone}.png`);
    await generateQR(historyText, historyPath);
  }

  console.log("\n🎉 Semua QR code berhasil dibuat!");
  console.log(`📁 Lokasi: /public/generated-qr/fire-alarm/`);
}

main().catch(console.error);