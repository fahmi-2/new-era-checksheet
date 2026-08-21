# IMPLEMENTASI FITUR HYDROTEST DAN LOGIKA OK/NG/OBS

## Ringkasan Perubahan

Semua fitur yang diminta telah berhasil diimplementasikan. Berikut adalah detail lengkap perubahan:

## 1. DATABASE SCHEMA MIGRATION
**File:** `migration/add-hydrotest-to-apar.sql`

- Menambahkan kolom `hydrotest_date` ke tabel `apar_items`
- Kolom ini menyimpan tanggal test hidrotatik (format sama dengan exp_date)
- Membuat index untuk performa query yang lebih baik

## 2. API BACKEND CHANGES

### 2.1 API Submit Route (`/api/apar/submit/route.ts`)
- ✅ Menambahkan `hydrotestDate` ke interface `AparItem`
- ✅ Memperbarui validasi check values dari ['O', 'X'] menjadi ['OK', 'NG', 'OBS']
- ✅ Menambahkan `hydrotest_date` ke INSERT query (parameter $7 dengan NULL fallback)
- ✅ Menambahkan `hydrotestDate || null` ke data submission
- ✅ Mengubah hasNg check logic dari 'X' menjadi 'NG'

### 2.2 API Edit Route (`/api/apar/edit/route.ts`)
- ✅ Menambahkan `hydrotestDate?: string | null` ke interface `AparItem`
- ✅ Memperbarui validasi check values dari ['O', 'X'] menjadi ['OK', 'NG', 'OBS']
- ✅ Menambahkan `hydrotest_date` ke UPDATE query (parameter $6)
- ✅ Menambahkan `hydrotest_date` ke INSERT query untuk new items (parameter $7)
- ✅ Memperbaharui semua parameter indices untuk insert/update operations

### 2.3 API History Route (`/api/apar/history/route.ts`)
- ✅ Mengubah ng_count query logic dari 'X' menjadi 'NG'
- ✅ Menambahkan `hydrotestDate: item.hydrotest_date || null` ke response mapping
- ✅ Menambahkan `itemId: item.id` untuk proper item identification di edit modal

## 3. FRONTEND INSPECTION FORM (`app/status-ga/inspeksi-apar/[slug]/page.tsx`)

### 3.1 Data Structure
- ✅ Menambahkan `hydrotestDate: item.hydrotestDate || ""` ke initial items
- ✅ Mengganti default check values dari "O" menjadi "OK"

### 3.2 Validasi & Logic
- ✅ Memperbarui `handleShowPreview()` untuk check OK/NG/OBS
- ✅ Memperbarui validasi di `handleSave()` dari O/X menjadi OK/NG/OBS
- ✅ Mengubah ng detection logic dari 'X' menjadi 'NG'
- ✅ Menambahkan `hydrotestDate` ke submitData structure

### 3.3 Fitur Tambah Item Baru
- ✅ Membuat fungsi `handleAddItem()` yang:
  - Menghitung nomor item berikutnya (maxNo + 1)
  - Membuat item baru dengan semua field kosong kecuali nomor dan default OK values
  - Auto-expand item baru agar user langsung bisa edit
  - Tidak bisa edit field PIC (sudah diisi dari user account)

### 3.4 Form UI Updates
- ✅ Menambahkan kolom "Hydrotest Date" di table desktop view
- ✅ Menambahkan input field hydrotest_date untuk setiap item
- ✅ Update select options dari [O, X] menjadi [OK, NG, OBS]
- ✅ Menambahkan tombol "➕ Tambah Item" di form-actions
- ✅ Menambahkan CSS styles untuk `.btn-add` dan `.date-input`

## 4. FRONTEND RIWAYAT/HISTORY PAGE (`app/status-ga/inspeksi-apar/[slug]/riwayat/page.tsx`)

### 4.1 Data Structure
- ✅ Menambahkan `hydrotestDate?: string | null` ke interface `AparItem`
- ✅ Mengubah default check values di `handleAddItem()` dari 'O' menjadi 'OK'

### 4.2 Display Views
- ✅ Menambahkan kolom "Hydrotest Date" di desktop table view
- ✅ Menambahkan tampilan hydrotest_date di mobile card view
- ✅ Updating check value display logic dari 'X' menjadi 'NG'
- ✅ Mengubah hasNg detection dari 'X' menjadi 'NG'

### 4.3 Edit Modal
- ✅ Menambahkan input field "Hydrotest Date" di edit form
- ✅ User bisa edit exp_date dan hydrotest_date kapan saja
- ✅ Mengubah check select options dari [O, X] menjadi [OK, NG, OBS]
- ✅ Update check display logic untuk mendeteksi 'NG' nilai

## FITUR YANG DIIMPLEMENTASIKAN

### 1. ✅ Hydrotest Date Field
- Kolom baru di database untuk menyimpan tanggal hydrotest
- Sistem same seperti exp_date
- Bisa diedit kapan saja jika sudah ada data atau diisi jika kosong

### 2. ✅ Logika OK/NG/OBS
- Mengganti system O/X dengan OK/NG/OBS
- OK = Kondisi baik
- NG = Ada masalah yang perlu diperbaiki
- OBS = Observasi/Catatan

### 3. ✅ Fitur Tambah Item Baru
- User bisa menambah item APAR baru saat pengisian checksheet
- Item baru memiliki semua field kosong kecuali:
  - Nomor urut (auto-increment)
  - Nilai check default = OK
  - PIC = account user (tidak bisa diedit)
- User bisa edit semua field item baru kecuali PIC

## TESTING CHECKLIST

Sebelum deployment, pastikan untuk test:

1. ✅ Database Migration
   - Jalankan SQL migration: `migration/add-hydrotest-to-apar.sql`
   - Verify kolom hydrotest_date sudah ada di apar_items table

2. ✅ Pengisian Data Baru
   - Coba isi checksheet APAR baru
   - Verify hydrotest_date field muncul dan bisa diisi
   - Verify check options menampilkan OK/NG/OBS
   - Coba tambah item baru menggunakan tombol ➕ Tambah Item
   - Verify item baru bisa diedit dengan nilai default OK

3. ✅ Edit Data Existing
   - Buka riwayat dan coba edit data lama
   - Verify hydrotest_date field muncul di edit modal
   - Verify bisa edit exp_date dan hydrotest_date
   - Verify check values menampilkan OK/NG/OBS

4. ✅ Validasi Submit
   - Coba submit tanpa isi check values → harus error
   - Coba submit dengan nilai invalid → harus error
   - Coba submit dengan NG tapi no keterangan → harus error
   - Submit valid data → harus berhasil

5. ✅ API Response
   - Check API /api/apar/history mengembalikan hydrotestDate
   - Check API /api/apar/submit menerima hydrotestDate
   - Check API /api/apar/edit bisa update hydrotestDate

## NOTES UNTUK DEVELOPER

1. Database migration harus dijalankan sebelum test features ini
2. Backfill existing data jika diperlukan (hydrotest_date default NULL)
3. Check semua validasi di API level sesuai dengan OK/NG/OBS
4. Test di lakukan untuk desktop dan mobile views
5. Pastikan PIC field tidak bisa diedit di form tambah item

## FILE YANG DIMODIFIKASI

1. `migration/add-hydrotest-to-apar.sql` - NEW
2. `app/api/apar/submit/route.ts`
3. `app/api/apar/edit/route.ts`
4. `app/api/apar/history/route.ts`
5. `app/status-ga/inspeksi-apar/[slug]/page.tsx`
6. `app/status-ga/inspeksi-apar/[slug]/riwayat/page.tsx`
