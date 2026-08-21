# 🎯 QR Code Generator - Updated Guide

## Apa yang Diperbarui?

Script **`generate-all-qr-v2.js`** telah dibuat dengan fitur-fitur baru:

### ✨ Fitur Terbaru:
1. **TITLE di atas QR Code** - Setiap QR code memiliki judul yang jelas untuk memudahkan printing dan identifikasi
2. **Data yang Akurat** - Semua zona, area, slug, dan lokasi sesuai dengan data actual di aplikasi
3. **Better Organization** - Output terstruktur dengan folder tipe checksheet
4. **Async Processing** - Pembuatan QR code lebih cepat dan efisien

## Data yang Diperbarui:

### Fire Alarm (18 Zona)
- Dengan deskripsi lengkap untuk setiap zona
- Format: `Fire Alarm - ZONA-{number}`

### Hydrant (36 Hydrants)
- Data lengkap: No, Lokasi, Zona, Jenis Hydrant
- Format: `Hydrant #{no} - {lokasi}`
- Contoh: `Hydrant #01 - KANTIN`, `Hydrant #36 - DEPAN POWER HOUSE A`

### APAR (30 Slugs)
- Sesuai dengan actual slugs dari aplikasi
- Format: `APAR - {slug-name}`

### Toilet (12 Areas)
- Format: `Toilet - {area-name}`

### Lift Barang (6 Units)
- Format: `Lift Barang - {nama-lift}`

### Panel (20 Panels)
- Format: `Panel - {nama-panel}`

### Selang Hydrant (36 Hydrants)
- Format: `Selang Hydrant #{no} - {lokasi}`

### Dan lainnya...
- Smoke Detector, Emergency Lamp, Exit Lamp, Stop Kontak, Infrastruktur Jalan, Tangga Listrik

## Installation & Usage:

### 1. Install Dependencies
```bash
npm install canvas
# atau
pnpm install canvas
```

### 2. Generate QR Codes
Pilih salah satu cara:

#### Menggunakan script baru (dengan title):
```bash
npm run gen-qr-v2
# atau
pnpm gen-qr-v2
```

#### Menggunakan script lama (tanpa title):
```bash
npm run gen-qr
# atau
pnpm gen-qr
```

### 3. Output Location
Semua QR codes akan tersimpan di:
```
/public/generated-qr/
├── fire-alarm/
├── hydrant/
├── apar/
├── toilet/
├── lift-barang/
├── panel/
├── selang-hydrant/
├── smoke-detector/
├── emergency/
├── exit-lamp/
├── stop-kontak/
├── inf-jalan/
└── tg-listrik/
```

## Output Format:

Setiap QR code image memiliki struktur:
```
┌─────────────────┐
│   TITLE TEXT    │   ← Title untuk mudah identifikasi
│ (e.g., Hydrant  │      saat printing
│    #01 - KANTIN)│
├─────────────────┤
│                 │
│    QR CODE      │   ← QR code 300x300px
│   (Image)       │
│                 │
└─────────────────┘
```

## URL Format Generated:

Setiap QR code encode URL dengan format:

### Status-GA Routes:
- **Fire Alarm**: `echecksheet:///status-ga/fire-alarm/{zona}`
- **Hydrant**: `echecksheet:///status-ga/inspeksi-hydrant?openHydrant={no}`
- **APAR**: `echecksheet:///status-ga/inspeksi-apar/{slug}`
- **Toilet**: `echecksheet:///status-ga/checksheet-toilet/{areaId}`
- **Lift Barang**: `echecksheet:///status-ga/lift-barang?openLift={name}`
- **Panel**: `echecksheet:///status-ga/panel?openPanel={name}`
- **Selang Hydrant**: `echecksheet:///status-ga/selang-hydrant?openArea={no}`
- **Smoke Detector**: `echecksheet:///status-ga/smoke-detector?openArea={area}`
- **Emergency Lamp**: `echecksheet:///status-ga/inspeksi-emergency/{area}`
- **Exit Lamp**: `echecksheet:///status-ga/exit-lamp-pintu-darurat/{category}`
- **Stop Kontak**: `echecksheet:///status-ga/form-inspeksi-stop-kontak/{type}`
- **Infrastruktur Jalan**: `echecksheet:///status-ga/ga-inf-jalan?search={area}`
- **Tangga Listrik**: `echecksheet:///status-ga/tg-listrik?openArea={area}`
- **Lift Barang Preventif**: `echecksheet:///status-ga/inspeksi-preventif-lift-barang/{subtype}`

## Data Accuracy:

✅ Fire Alarm Zones: Sesuai dengan file `app/status-ga/fire-alarm/page.tsx`
✅ Hydrant Data: Sesuai dengan file `app/status-ga/inspeksi-hydrant/GaInspeksiHydrantContent.tsx`
✅ APAR Slugs: Sesuai dengan `CHECKSHEET_ROUTING_STRUCTURE.json`
✅ Toilet Areas: Sesuai dengan actual data di aplikasi
✅ Lift Barang: 6 unit sesuai dengan GaLiftBarangContent
✅ Panel: 20 panel sesuai dengan GaPanelContent
✅ Semua Zona/Area/Slug: Divalidasi dengan actual routing

## Notes:

- Script ini menggunakan **Canvas library** untuk rendering title di atas QR
- Ukuran final image: 400x360px (dengan title di atas)
- Format output: PNG dengan background putih
- Setiap QR code diberi nama sesuai zona/area/slug untuk mudah diorganisir

## Troubleshooting:

### Canvas installation fails
Jika terjadi error saat install canvas, pastikan:
- Node.js >= 12.x terinstall
- Python 3.x terinstall (untuk build canvas)
- Build tools terinstall (untuk Windows gunakan Visual Studio Build Tools)

```bash
# Windows
npm install --build-from-source

# macOS (jika ada error)
npm install canvas --python=/usr/bin/python3
```

### QR codes tidak tergenerate
- Pastikan folder `/public/generated-qr/` ada
- Cek permission folder
- Jalankan dari root project directory
