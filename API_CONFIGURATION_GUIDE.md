# API Configuration Guide - Electrical Inspections

## 📋 Ringkasan Konfigurasi

Sistem inspeksi listrik telah dikonfigurasi untuk menyimpan data ke database MySQL, menggantikan localStorage.

## 🗄️ Setup Database

### 1. Buat Tabel di Database

Jalankan SQL berikut di MySQL:

```sql
-- Jalankan file database-schema-electrical.sql
SOURCE database-schema-electrical.sql;
```

Atau copy-paste langsung di MySQL:

```sql
CREATE TABLE IF NOT EXISTS electrical_inspections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL COMMENT 'instalasi-listrik or stop-kontak',
    tanggal DATE NOT NULL,
    area VARCHAR(255) NOT NULL,
    pic VARCHAR(255) NOT NULL,
    additional_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_type_date (type, tanggal),
    INDEX idx_area_date (area, tanggal),
    INDEX idx_tanggal (tanggal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS electrical_inspection_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inspection_id INT NOT NULL,
    item_no INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_detail TEXT,
    hasil VARCHAR(10) NOT NULL COMMENT 'OK or NOK',
    keterangan TEXT,
    foto_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_inspection_id FOREIGN KEY (inspection_id) 
        REFERENCES electrical_inspections(id) ON DELETE CASCADE,
    
    INDEX idx_inspection_id (inspection_id),
    INDEX idx_item_no (item_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Verifikasi Koneksi Database

Pastikan `.env.local` memiliki konfigurasi database yang benar:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=your_database
```

## 🔌 API Endpoints

### POST - Simpan Inspeksi

**Endpoint:** `POST /api/electrical_inspections`

**Request Body:**
```json
{
  "type": "instalasi-listrik",
  "tanggal": "2026-02-06",
  "area": "Ruang Server",
  "pic": "John Doe",
  "data": {
    "1": {
      "hasil": "OK",
      "keterangan": ""
    },
    "2": {
      "hasil": "NOK",
      "keterangan": "Kabel terkelupas di sudut ruangan"
    },
    "3": {
      "hasil": "OK",
      "keterangan": ""
    },
    "4": {
      "hasil": "OK",
      "keterangan": ""
    }
  },
  "additional_notes": ""
}
```

**Response Sukses (200):**
```json
{
  "success": true,
  "message": "Inspection record created successfully",
  "data": {
    "id": "45",
    "type": "instalasi-listrik",
    "tanggal": "2026-02-06",
    "area": "Ruang Server",
    "pic": "John Doe",
    "itemCount": 4
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Item 2: Description is required for NOK status"
}
```

### GET - Ambil Riwayat Inspeksi

**Endpoint:** `GET /api/electrical_inspections?type=instalasi-listrik`

**Query Parameters:**
- `type` (optional): `instalasi-listrik` atau `stop-kontak`
- `area` (optional): Filter berdasarkan area
- `startDate` (optional): Format YYYY-MM-DD
- `endDate` (optional): Format YYYY-MM-DD

**Response Sukses (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "45",
      "type": "instalasi-listrik",
      "tanggal": "2026-02-06",
      "area": "Ruang Server",
      "pic": "John Doe",
      "items": {
        "1": {
          "hasil": "OK",
          "keterangan": "",
          "foto_path": null
        },
        "2": {
          "hasil": "NOK",
          "keterangan": "Kabel terkelupas",
          "foto_path": null
        }
      },
      "additionalNotes": null,
      "createdAt": "2026-02-06T10:30:45.000Z",
      "updatedAt": "2026-02-06T10:30:45.000Z"
    }
  ]
}
```

### GET - Detail Inspeksi

**Endpoint:** `GET /api/electrical_inspections/[id]`

**Response:** Sama seperti GET list, tapi untuk 1 record saja.

### DELETE - Hapus Inspeksi

**Endpoint:** `DELETE /api/electrical_inspections/[id]`

**Response Sukses (200):**
```json
{
  "success": true,
  "message": "Record deleted successfully",
  "data": { "id": "45" }
}
```

## 🔍 Validasi Data

### Field yang Wajib Diisi
- `type`: `instalasi-listrik` atau `stop-kontak`
- `tanggal`: Format DATE (YYYY-MM-DD)
- `area`: String (tidak boleh kosong)
- `pic`: String (Person in Charge)
- `data`: Object dengan item inspeksi

### Validasi Item
- `hasil`: HARUS `OK` atau `NOK`
- `keterangan`: WAJIB jika `hasil === 'NOK'`

## 📝 Form Pages yang Sudah Update

### 1. Form Instalasi Listrik
**Path:** `/status-ga/form-inspeksi-stop-kontak/instalasi-listrik/page.tsx`

**Perubahan:**
- Menghapus localStorage
- POST ke API `/api/electrical_inspections`
- Tambah loading state: `isSubmitting`
- Button feedback: "⏳ Menyimpan..." saat proses

### 2. Form Stop Kontak
**Path:** `/status-ga/form-inspeksi-stop-kontak/stop-kontak/page.tsx`

**Perubahan:** Sama seperti Form Instalasi Listrik

### 3. Riwayat Instalasi Listrik
**Path:** `/status-ga/form-inspeksi-stop-kontak/instalasi-listrik/riwayat/page.tsx`

**Perubahan:**
- Menghapus localStorage
- GET dari API `/api/electrical_inspections?type=instalasi-listrik`
- Update type `HistoryEntry` sesuai response API

### 4. Riwayat Stop Kontak
**Path:** `/status-ga/form-inspeksi-stop-kontak/stop-kontak/riwayat/page.tsx`

**Perubahan:** Sama seperti Riwayat Instalasi Listrik

## 🧪 Testing

### Test dengan cURL (Windows PowerShell)

```powershell
# Create Inspection
$body = @{
    type = "instalasi-listrik"
    tanggal = "2026-02-06"
    area = "Test Area"
    pic = "Test Inspector"
    data = @{
        "1" = @{hasil="OK"; keterangan=""}
        "2" = @{hasil="NOK"; keterangan="Test issue"}
        "3" = @{hasil="OK"; keterangan=""}
        "4" = @{hasil="OK"; keterangan=""}
    }
    additional_notes = ""
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/electrical_inspections" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

```powershell
# Get All Inspections
Invoke-WebRequest -Uri "http://localhost:3000/api/electrical_inspections?type=instalasi-listrik" `
    -Method GET | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

## 🐛 Troubleshooting

### Error: "Database connection failed"
- ✅ Periksa .env.local configuration
- ✅ Pastikan MySQL server running
- ✅ Verifikasi credentials di .env.local

### Error: "Required fields are missing"
- ✅ Pastikan semua field wajib terisi: type, tanggal, area, pic, data
- ✅ Pastikan data bukan empty object

### Error: "Description is required for NOK status"
- ✅ Jika ada item dengan hasil "NOK", keterangan WAJIB diisi

### Error: "Internal server error"
- ✅ Periksa console logs di server
- ✅ Verifikasi struktur tabel database sesuai schema
- ✅ Pastikan foreign key constraint OK

## 📊 Data Structure

### electrical_inspections Table
```
id (PK)                 INT
type                    VARCHAR(50) - 'instalasi-listrik' or 'stop-kontak'
tanggal                 DATE - Tanggal inspeksi
area                    VARCHAR(255) - Area inspeksi
pic                     VARCHAR(255) - Person in Charge
additional_notes        TEXT - Catatan tambahan
created_at              TIMESTAMP - Created date
updated_at              TIMESTAMP - Updated date
```

### electrical_inspection_details Table
```
id (PK)                 INT
inspection_id (FK)      INT - Foreign key to electrical_inspections
item_no                 INT - Nomor item (1-4)
item_name               VARCHAR(255) - Nama item
item_detail             TEXT - Detail item
hasil                   VARCHAR(10) - 'OK' or 'NOK'
keterangan              TEXT - Keterangan/catatan
foto_path               VARCHAR(500) - Path ke foto (nullable)
created_at              TIMESTAMP - Created date
```

## ✅ Checklist Setup Lengkap

- [ ] Database tabel sudah dibuat
- [ ] .env.local sudah dikonfigurasi
- [ ] npm run dev sudah berjalan
- [ ] Form Instalasi Listrik bisa submit ke API
- [ ] Form Stop Kontak bisa submit ke API
- [ ] Riwayat Instalasi Listrik bisa fetch dari API
- [ ] Riwayat Stop Kontak bisa fetch dari API
- [ ] Data tersimpan di database, bukan localStorage

## 🎯 Next Steps

1. ✅ Database schema sudah dibuat
2. ✅ API routes sudah fixed
3. ✅ Form pages sudah update ke API
4. ✅ Riwayat pages sudah update ke API
5. 👉 **Jalankan SQL untuk membuat tabel**
6. 👉 **Test form dengan submit data**
7. 👉 **Verifikasi data di database**

---

**Last Updated:** February 6, 2026  
**Version:** 1.0 - Electrical Inspections API Configuration
