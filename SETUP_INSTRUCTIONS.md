# 🚀 SETUP INSTRUCTIONS - E-Checksheet Toilet Integration

## 📌 Langkah-Langkah Setup

### 1️⃣ **Buat Database Table**

Jalankan SQL query berikut di MySQL client:

```sql
CREATE TABLE IF NOT EXISTS toilet_inspections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    area_code VARCHAR(100) NOT NULL,
    inspection_date DATE NOT NULL,
    inspection_time VARCHAR(10),
    inspector_id INT,
    inspector_name VARCHAR(255) NOT NULL,
    overall_status VARCHAR(10) NOT NULL COMMENT 'OK or NG',
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_area_date (area_code, inspection_date),
    INDEX idx_inspection_date (inspection_date),
    UNIQUE KEY unique_inspection (area_code, inspection_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Atau copy-paste dari file**: `database-schema-toilet.sql`

### 2️⃣ **Verify Database Connection**

Pastikan credentials di `lib/db.ts` sudah benar:

```typescript
const pool = mysql.createPool({
  host: 'localhost',      // ✅ Sesuaikan dengan host MySQL Anda
  port: 3306,            // ✅ Sesuaikan dengan port MySQL Anda
  user: 'root',          // ✅ Sesuaikan dengan username
  password: '',          // ✅ Sesuaikan dengan password
  database: 'e_checksheet_ga'  // ✅ Pastikan database ada
});
```

### 3️⃣ **Start Application**

```bash
# Terminal 1: Development Server
npm run dev
# Atau jika menggunakan pnpm:
pnpm dev
```

Akses aplikasi di: http://localhost:3000

### 4️⃣ **Test Integration**

```bash
# Testing Checklist:
1. Login sebagai inspector-ga
2. Navigasi ke /status-ga/checksheet-toilet
3. Klik "Isi Checklist" pada salah satu area
4. Isi form dengan data dummy
5. Klik "Simpan Checksheet"
6. Verify data muncul di database:
   
   SELECT * FROM toilet_inspections 
   WHERE inspection_date = CURDATE();
   
7. Kembali ke list, verify status berubah menjadi "Sudah Diisi"
8. Edit checksheet yang sudah diisi
9. Verify data terupdate di database
10. Lihat riwayat dan test filter
11. Export ke CSV
```

---

## 📁 File Structure Overview

```
app/
├── api/
│   └── toilet-inspections/
│       ├── check-status.ts          ✅ GET - Status satu area satu hari
│       ├── check-all-status.ts      ✅ GET - Status semua area satu hari
│       ├── submit.ts                ✅ POST - Simpan/Update checksheet
│       └── history.ts               ✅ GET - Riwayat inspeksi
├── status-ga/
│   └── checksheet-toilet/
│       ├── page.tsx                 ✅ List semua toilet dengan status
│       ├── [area]/
│       │   └── page.tsx             ✅ Form untuk isi checksheet
│       └── riwayat/
│           └── [area]/
│               └── page.tsx         ✅ Halaman riwayat inspeksi
components/
└── ChecksheetToiletForm.tsx         ✅ Form component dengan 12 checklist items
lib/
├── db.ts                            ✅ MySQL connection pool
└── auth-context.tsx                 ✅ Auth context (unchanged)

database-schema-toilet.sql           ✅ SQL schema untuk membuat table
TOILET_CHECKSHEET_INTEGRATION.md     ✅ Dokumentasi lengkap
SETUP_INSTRUCTIONS.md                ✅ File ini
```

---

## 🔍 API Endpoints Reference

### 1. Check Status (Satu Area)
```
GET /api/toilet-inspections/check-status
Parameters:
  - area_code: string (e.g., "toilet-driver")
  - inspection_date: YYYY-MM-DD

Response:
{
  "success": true,
  "filled": true,
  "data": {
    "id": 1,
    "overall_status": "OK",
    "inspection_time": "09:30",
    "inspector_name": "John Doe",
    "details": { ... }
  }
}
```

### 2. Check All Status (Semua Area)
```
GET /api/toilet-inspections/check-all-status
Parameters:
  - area_codes: string (comma-separated, e.g., "toilet-driver,toilet-bea-cukai")
  - inspection_date: YYYY-MM-DD

Response:
{
  "success": true,
  "data": [
    { "area_code": "toilet-driver", "filled": true, "status": "OK" },
    { "area_code": "toilet-bea-cukai", "filled": false, "status": null }
  ]
}
```

### 3. Submit Checksheet
```
POST /api/toilet-inspections/submit
Body:
{
  "area_code": "toilet-driver",
  "inspection_date": "2026-02-04",
  "inspection_time": "09:30",
  "inspector_id": 1,
  "inspector_name": "John Doe",
  "overall_status": "OK",
  "details": {
    "kebersihan_lantai": "OK",
    "kebersihan_dinding": "NG",
    ...
    "notes": "Ada noda di dinding"
  }
}

Response:
{
  "success": true,
  "message": "Data checksheet berhasil disimpan",
  "id": 1
}
```

### 4. Get History
```
GET /api/toilet-inspections/history
Parameters:
  - area_code: string
  - inspection_date: YYYY-MM-DD (optional)
  - limit: number (default 30)
  - offset: number (default 0)

Response:
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "limit": 30,
    "offset": 0
  }
}
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'mysql2'"
```bash
npm install mysql2
# atau jika menggunakan pnpm:
pnpm add mysql2
```

### Error: "Database connection failed"
- ✅ Cek MySQL server sudah running
- ✅ Cek credentials di lib/db.ts
- ✅ Cek database 'e_checksheet_ga' sudah ada
- ✅ Cek table 'toilet_inspections' sudah dibuat

### Error: "Role is not 'inspector-ga'"
- ✅ Login dengan akun yang memiliki role 'inspector-ga'
- ✅ Atau ubah role di page dengan mengedit auth-context jika testing

### Data tidak tersimpan
- ✅ Cek browser console untuk error messages
- ✅ Cek Network tab untuk melihat API response
- ✅ Cek MySQL error log
- ✅ Cek database connection string di lib/db.ts

### CSV Export tidak bekerja
- ✅ Cek browser console untuk error
- ✅ Cek apakah ada inspection data di riwayat
- ✅ Browser mungkin memblok file download - cek permission

---

## ✨ Features Checklist

- ✅ **List Toilet Areas**: Tampil semua 12 area toilet dengan status
- ✅ **Form Checksheet**: 12 item checklist dengan OK/NG/Blank options
- ✅ **Auto Status**: Status keseluruhan auto-calculated
- ✅ **Save to Database**: Data tersimpan dengan unique constraint per area per hari
- ✅ **Edit Support**: Bisa edit data yang sudah diisi hari ini
- ✅ **History View**: Lihat riwayat inspeksi dengan pagination
- ✅ **Filter by Date**: Filter riwayat berdasarkan tanggal
- ✅ **Filter by Status**: Filter riwayat by OK/NG
- ✅ **Export CSV**: Export riwayat ke CSV format
- ✅ **Role Based Access**: Hanya inspector-ga yang bisa akses
- ✅ **Responsive Design**: Fully mobile responsive
- ✅ **Error Handling**: Graceful error handling dengan user feedback
- ✅ **Loading States**: Loading indicators untuk better UX

---

## 📊 Database Queries Useful

### View semua inspection hari ini
```sql
SELECT * FROM toilet_inspections 
WHERE inspection_date = CURDATE()
ORDER BY area_code ASC;
```

### View inspection tertentu per area
```sql
SELECT * FROM toilet_inspections 
WHERE area_code = 'toilet-driver'
ORDER BY inspection_date DESC;
```

### Count inspection per status hari ini
```sql
SELECT overall_status, COUNT(*) as count
FROM toilet_inspections 
WHERE inspection_date = CURDATE()
GROUP BY overall_status;
```

### Find NG inspections (perlu follow-up)
```sql
SELECT * FROM toilet_inspections 
WHERE overall_status = 'NG'
AND inspection_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
ORDER BY inspection_date DESC;
```

### Get inspection details dengan JSON extract
```sql
SELECT 
  area_code,
  inspection_date,
  JSON_EXTRACT(details, '$.notes') as notes,
  JSON_EXTRACT(details, '$.kebersihan_dinding') as dinding_status
FROM toilet_inspections
WHERE overall_status = 'NG';
```

---

## 📞 Support & Questions

Jika ada masalah atau pertanyaan:

1. **Cek dokumentasi**: Baca `TOILET_CHECKSHEET_INTEGRATION.md`
2. **Lihat error**: Cek browser console dan network tab
3. **Check database**: Verify table structure dan data
4. **Check auth**: Verify login role adalah 'inspector-ga'

---

**Status**: ✅ Production Ready  
**Last Updated**: 2026-02-04  
**Version**: 1.0

---

## 🎯 Next Features (Future Roadmap)

- [ ] Dashboard dengan analytics chart
- [ ] Email notification untuk NG items
- [ ] Photo attachment untuk evidence
- [ ] Bulk action untuk multiple areas
- [ ] SLA tracking
- [ ] Mobile app sync
- [ ] QR code scanning per area
- [ ] Automated reminders

