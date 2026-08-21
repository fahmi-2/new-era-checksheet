# Implementasi Scan Area Required untuk Checksheet

## 📋 Ringkasan Implementasi

Fitur ini memastikan bahwa setiap inspector harus **scan QR code terlebih dahulu** sebelum bisa mengisi checksheet. Jika mengakses halaman secara manual (tanpa scan), mereka akan melihat halaman **READ-ONLY** dengan instruksi untuk scan.

---

## 🔧 Komponen yang Sudah Dibuat

### 1. **Hook: `useScanVerification`** 
📁 File: `lib/hooks/useScanVerification.ts`

```typescript
// Gunakan di setiap halaman checksheet
const { isScanned, isLoading } = useScanVerification();

// Jika tidak scan dan halaman dimuat:
if (!isScanned) {
  return <ScanAreaRequired ... />;
}
```

### 2. **Komponen: `ScanAreaRequired`**
📁 File: `components/ScanAreaRequired.tsx`

Menampilkan halaman yang user-friendly ketika akses tanpa scan.

### 3. **Modifikasi Scan Page**
📁 File: `app/scan/page.tsx`

Sudah dimodifikasi untuk menambahkan parameter `_scanned=true` ke setiap URL yang dinavigasi.

---

## 🚀 Cara Implementasi di Setiap Halaman Checksheet

### **Template Modifikasi Umum**

Untuk setiap halaman detail checksheet, tambahkan ini di awal file:

```typescript
// ✅ TAMBAHKAN IMPORT INI
import { useScanVerification } from "@/lib/hooks/useScanVerification";
import { ScanAreaRequired } from "@/components/ScanAreaRequired";

export default function ChecksheetPage({ ... }) {
  // ... existing imports dan variables ...
  
  // ✅ TAMBAHKAN HOOK INI
  const { isScanned, isLoading } = useScanVerification();
  
  // ✅ TAMBAHKAN STATE INI
  const [redirected, setRedirected] = useState(false);

  // ✅ TAMBAHKAN useEffect INI (SEBELUM useEffect lainnya)
  useEffect(() => {
    // Jika scan verification masih loading, tunggu
    if (isLoading) return;
    
    // Jika tidak scan, redirect ke homepage setelah 3 detik
    // atau langsung tampilkan ScanAreaRequired
    if (!isScanned && !redirected) {
      console.warn('⚠️ Akses tanpa scan detected');
      // Bisa pilih: redirect atau tampilkan ScanAreaRequired
    }
  }, [isScanned, isLoading, redirected]);

  // ✅ TAMBAHKAN CONDITIONAL RENDER INI
  // Tampilkan ScanAreaRequired jika loading atau tidak scan
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div>Memverifikasi akses...</div>
      </div>
    );
  }

  if (!isScanned) {
    return (
      <ScanAreaRequired
        title="Inspeksi [Nama Checksheet]"
        checksheetType="[checksheet-type]"
        areaName={zona || area || title}
        description="[Deskripsi area]"
      />
    );
  }

  // ... RENDER NORMAL HALAMAN DI SINI ...
  return (
    <div className="app-page">
      {/* ... halaman normal ... */}
    </div>
  );
}
```

---

## 📋 Daftar Halaman yang Perlu Dimodifikasi

### **Status-GA Routes** (Halaman Detail)

| Route | Jenis Checksheet | File | Status |
|-------|------------------|------|--------|
| `/status-ga/fire-alarm/[zona]` | Fire Alarm | `app/status-ga/fire-alarm/[zona]/page.tsx` | 🔄 TODO |
| `/status-ga/inspeksi-apar/[slug]` | APAR | `app/status-ga/inspeksi-apar/[slug]/page.tsx` | 🔄 TODO |
| `/status-ga/checksheet-toilet/[area]` | Toilet | `app/status-ga/checksheet-toilet/[area]/page.tsx` | 🔄 TODO |
| `/status-ga/inspeksi-apd/[...]` | APD | `app/status-ga/inspeksi-apd/[...]/page.tsx` | 🔄 TODO |
| `/status-ga/lift-barang/[...]` | Lift Barang | `app/status-ga/lift-barang/[...]/page.tsx` | 🔄 TODO |
| `/status-ga/selang-hydrant/[area]` | Selang Hydrant | `app/status-ga/selang-hydrant/[area]/page.tsx` | 🔄 TODO |
| `/status-ga/smoke-detector/[...]` | Smoke Detector | `app/status-ga/smoke-detector/[...]/page.tsx` | 🔄 TODO |
| `/status-ga/inspeksi-emergency/[area]` | Emergency Lamp | `app/status-ga/inspeksi-emergency/[area]/page.tsx` | 🔄 TODO |
| `/status-ga/exit-lamp-pintu-darurat/[...]` | Exit Lamp | `app/status-ga/exit-lamp-pintu-darurat/[...]/page.tsx` | 🔄 TODO |
| `/status-ga/form-inspeksi-stop-kontak/[...]` | Stop Kontak | `app/status-ga/form-inspeksi-stop-kontak/[...]/page.tsx` | 🔄 TODO |
| `/status-ga/tg-listrik/[...]` | Tangga Listrik | `app/status-ga/tg-listrik/[...]/page.tsx` | 🔄 TODO |
| `/status-ga/inspeksi-preventif-lift-barang/[...]` | Lift Barang Preventif | `app/status-ga/inspeksi-preventif-lift-barang/[...]/page.tsx` | 🔄 TODO |
| `/status-ga/ga-inf-jalan` | Infrastruktur Jalan | `app/status-ga/ga-inf-jalan/page.tsx` atau `[...]/page.tsx` | 🔄 TODO |
| `/status-ga/panel/[...]` | Panel | `app/status-ga/panel/[...]/page.tsx` | 🔄 TODO |

### **E-Checksheet Routes** (Rute alternatif)

| Route | Jenis Checksheet | File | Status |
|-------|------------------|------|--------|
| `/e-checksheet-hydrant` | Hydrant | `app/e-checksheet-hydrant/page.tsx` | 🔄 TODO |
| `/e-checksheet-slg-hydrant` | Selang Hydrant | `app/e-checksheet-slg-hydrant/page.tsx` | 🔄 TODO |
| `/e-checksheet-smoke-detector` | Smoke Detector | `app/e-checksheet-smoke-detector/page.tsx` | 🔄 TODO |
| `/e-checksheet-tg-listrik` | Tangga Listrik | `app/e-checksheet-tg-listrik/page.tsx` | 🔄 TODO |
| `/e-checksheet-lift-barang` | Lift Barang | `app/e-checksheet-lift-barang/page.tsx` | 🔄 TODO |
| `/e-checksheet-panel` | Panel | `app/e-checksheet-panel/page.tsx` | 🔄 TODO |
| `/e-checksheet-ga-inf-jalan` | Infrastruktur Jalan | `app/e-checksheet-ga-inf-jalan/page.tsx` | 🔄 TODO |
| `/e-checksheet-ins-apd` | APD | `app/e-checksheet-ins-apd/page.tsx` | 🔄 TODO |

---

## 💡 Contoh Implementasi Lengkap

### **Contoh untuk Fire Alarm**

Lihat perubahan di: `app/status-ga/fire-alarm/[zona]/page.tsx`

```typescript
"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";  // ✅ ADD useSearchParams
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft } from "lucide-react";
// ✅ TAMBAHKAN IMPORTS INI
import { useScanVerification } from "@/lib/hooks/useScanVerification";
import { ScanAreaRequired } from "@/components/ScanAreaRequired";

export default function ChecksheetFireAlarm({
  params,
}: {
  params: Promise<{ zona: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();  // ✅ ADD THIS
  const { user } = useAuth();
  const { zona } = use(params);

  // ✅ TAMBAHKAN INI
  const { isScanned, isLoading } = useScanVerification();

  // ... existing state variables ...
  const [items, setItems] = useState<FireAlarmItem[]>([]);
  const [checker, setChecker] = useState("");
  const [checkerNik, setCheckerNik] = useState("");
  const [masterLoading, setMasterLoading] = useState(false);
  const [masterError, setMasterError] = useState<string | null>(null);
  const [masterInfo, setMasterInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hasNg, setHasNg] = useState(false);
  const [redirected, setRedirected] = useState(false);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // ... existing auth effect ...
  
  // ── RENDER ────────────────────────────────────────────────
  if (!user) return null;

  // ✅ TAMBAHKAN CHECK INI DI AWAL RENDER
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
        <div>Memverifikasi akses...</div>
      </div>
    );
  }

  if (!isScanned) {
    return (
      <ScanAreaRequired
        title="Inspeksi Fire Alarm"
        checksheetType="fire-alarm"
        areaName={`ZONA ${zona?.toUpperCase() || '?'}`}
        description="Sistem alarm kebakaran - Daily check"
      />
    );
  }

  // ✅ SETELAH INI, RENDER HALAMAN NORMAL SEPERTI BIASA
  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />
      {/* ... REST OF PAGE ... */}
    </div>
  );
}
```

---

## 🔄 Alur User

### **Skenario 1: Akses Manual (Tanpa Scan)**
```
User klik di menu status-ga → klik Fire Alarm → pilih Zona 1
                                                        ↓
                                    Halaman dibuka tanpa parameter _scanned=true
                                                        ↓
                                    useScanVerification mendeteksi isScanned = false
                                                        ↓
                                    ScanAreaRequired ditampilkan (READ-ONLY)
                                                        ↓
                                    User klik "Buka Scan QR Code"
                                                        ↓
                                    User scan QR code untuk Fire Alarm Zona 1
                                                        ↓
                                    Scan page menambahkan _scanned=true
                                                        ↓
                                    Halaman Fire Alarm dibuka dengan parameter _scanned=true
                                                        ↓
                                    useScanVerification mendeteksi isScanned = true
                                                        ↓
                                    ✅ Halaman normal ditampilkan (EDITABLE)
```

### **Skenario 2: Akses via Scan QR**
```
User membuka halaman scan
                  ↓
User scan QR code Fire Alarm Zona 1
                  ↓
Scan page memproses QR → tambah _scanned=true
                  ↓
Navigate ke /status-ga/fire-alarm/zona-1?_scanned=true
                  ↓
useScanVerification mendeteksi isScanned = true
                  ↓
✅ Halaman normal ditampilkan langsung (EDITABLE)
```

---

## 🛠️ Troubleshooting

### **Masalah: Halaman masih bisa diedit meskipun tidak scan**

**Solusi:**
- Pastikan import `useScanVerification` dan `ScanAreaRequired` sudah benar
- Pastikan conditional render untuk `ScanAreaRequired` ditempatkan **sebelum** render normal
- Cek browser console untuk warning dari `useScanVerification`

### **Masalah: Halaman blank / tidak loading**

**Solusi:**
- Pastikan `useSearchParams()` sudah diimport dari `next/navigation`
- Pastikan component adalah `"use client"` component
- Cek apakah ada error di browser console

### **Masalah: Parameter `_scanned` tidak ditambahkan**

**Solusi:**
- Cek bahwa file `app/scan/page.tsx` sudah dimodifikasi dengan fungsi `addScanParam`
- Pastikan fungsi ini dijalankan untuk semua routing (status-ga dan e-checksheet)

---

## 📝 Catatan Penting

1. **Parameter `_scanned=true` hanya valid untuk sesi scan saat itu**
   - Jika user refresh halaman, parameter hilang dan harus scan ulang
   - Ini adalah behavior yang diinginkan untuk security

2. **Halaman list (seperti `/status-ga/fire-alarm`) TIDAK perlu ditambah scan check**
   - Scan hanya diperlukan di halaman detail/form
   - Halaman list bisa diakses langsung

3. **Read-Only Mode**
   - Jika tidak scan, user hanya bisa melihat info (READ-ONLY)
   - Tidak bisa mengubah input, klik tombol isi, atau submit
   - User harus scan untuk bisa interaksi

---

## ✅ Checklist Implementasi

- [x] Hook `useScanVerification` dibuat
- [x] Komponen `ScanAreaRequired` dibuat
- [x] Scan page dimodifikasi untuk menambahkan parameter
- [ ] Fire Alarm detail halaman dimodifikasi
- [ ] Toilet detail halaman dimodifikasi
- [ ] APAR detail halaman dimodifikasi
- [ ] Hydrant detail halaman dimodifikasi
- [ ] Selang Hydrant detail halaman dimodifikasi
- [ ] Smoke Detector detail halaman dimodifikasi
- [ ] Emergency Lamp detail halaman dimodifikasi
- [ ] Exit Lamp detail halaman dimodifikasi
- [ ] Lift Barang detail halaman dimodifikasi
- [ ] Lift Barang Preventif detail halaman dimodifikasi
- [ ] Panel detail halaman dimodifikasi
- [ ] Stop Kontak detail halaman dimodifikasi
- [ ] Tangga Listrik detail halaman dimodifikasi
- [ ] Infrastruktur Jalan detail halaman dimodifikasi
- [ ] APD detail halaman dimodifikasi
- [ ] Testing di semua browser/device

---

## 🎯 Next Steps

1. Review implementasi di file-file yang sudah dibuat
2. Copy template modifikasi ke setiap halaman checksheet detail
3. Test alur: akses manual → scan → akses via scan
4. Dokumentasi sudah tersedia di: `SCAN_AREA_REQUIREMENT_GUIDE.md`
